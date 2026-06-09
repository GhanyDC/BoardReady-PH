"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireMembership } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";

const externalDrillSchema = z
  .object({
    drillTitle: z
      .string()
      .trim()
      .min(2, "Drill title is required.")
      .max(180, "Keep the drill title under 180 characters."),
    sourceLabel: z
      .string()
      .trim()
      .max(160, "Keep the source label under 160 characters.")
      .nullable(),
    subjectId: z.string().uuid("Choose a subject."),
    topicId: z.string().uuid("Choose a valid topic.").nullable(),
    totalItems: z.coerce
      .number()
      .int()
      .min(1, "Total items must be greater than 0.")
      .max(10000, "Keep total items under 10,000."),
    score: z.coerce
      .number()
      .int()
      .min(0, "Score cannot be negative.")
      .max(10000, "Keep score under 10,000."),
    dateTaken: z.string().refine((value) => isValidDateInput(value), {
      message: "Date taken is required.",
    }),
    mistakeNotes: z
      .string()
      .trim()
      .max(4000, "Keep mistake notes under 4,000 characters.")
      .nullable(),
    weakTopicNotes: z
      .string()
      .trim()
      .max(4000, "Keep weak topic notes under 4,000 characters.")
      .nullable(),
  })
  .superRefine((value, context) => {
    if (value.score > value.totalItems) {
      context.addIssue({
        code: "custom",
        message: "Score cannot exceed total items.",
        path: ["score"],
      });
    }
  });

export type ExternalDrillFormState = {
  errors?: {
    drillTitle?: string[];
    sourceLabel?: string[];
    subjectId?: string[];
    topicId?: string[];
    totalItems?: string[];
    score?: string[];
    dateTaken?: string[];
    mistakeNotes?: string[];
    weakTopicNotes?: string[];
  };
  message?: string;
};

function nullableText(value: FormDataEntryValue | null) {
  const text = value?.toString().trim() ?? "";

  return text === "" ? null : text;
}

function nullableUuid(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value;
}

function isValidDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
}

export async function createExternalDrillLogAction(
  _state: ExternalDrillFormState,
  formData: FormData,
): Promise<ExternalDrillFormState> {
  const parsed = externalDrillSchema.safeParse({
    drillTitle: formData.get("drillTitle"),
    sourceLabel: nullableText(formData.get("sourceLabel")),
    subjectId: formData.get("subjectId"),
    topicId: nullableUuid(formData.get("topicId")),
    totalItems: formData.get("totalItems"),
    score: formData.get("score"),
    dateTaken: formData.get("dateTaken"),
    mistakeNotes: nullableText(formData.get("mistakeNotes")),
    weakTopicNotes: nullableText(formData.get("weakTopicNotes")),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram) {
    return {
      message: "Join a group before logging external drills.",
    };
  }

  const supabase = await createClient();
  const { data: subject } = await supabase
    .from("subjects")
    .select("id")
    .eq("id", parsed.data.subjectId)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!subject) {
    return {
      errors: {
        subjectId: ["Choose a subject from your active group and exam track."],
      },
    };
  }

  if (parsed.data.topicId) {
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("id", parsed.data.topicId)
      .eq("subject_id", parsed.data.subjectId)
      .eq("group_id", context.activeGroup.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!topic) {
      return {
        errors: {
          topicId: ["Choose a topic that belongs to the selected subject."],
        },
      };
    }
  }

  const { error } = await supabase.from("external_drill_logs").insert({
    user_id: context.user.id,
    group_id: context.activeGroup.id,
    exam_program_id: context.activeExamProgram.id,
    subject_id: parsed.data.subjectId,
    topic_id: parsed.data.topicId,
    drill_title: parsed.data.drillTitle,
    source_label: parsed.data.sourceLabel,
    total_items: parsed.data.totalItems,
    score: parsed.data.score,
    date_taken: parsed.data.dateTaken,
    mistake_notes: parsed.data.mistakeNotes,
    weak_topic_notes: parsed.data.weakTopicNotes,
  });

  if (error) {
    return {
      message: error.message,
    };
  }

  redirect("/external-drills/new?created=1");
}
