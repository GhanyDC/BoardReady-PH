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
const externalDrillUpdateSchema = externalDrillSchema.extend({
  logId: z.string().uuid("Choose an external drill log."),
});

export type ExternalDrillFormState = {
  errors?: {
    logId?: string[];
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

function parseExternalDrillForm(formData: FormData) {
  return {
    drillTitle: formData.get("drillTitle"),
    sourceLabel: nullableText(formData.get("sourceLabel")),
    subjectId: formData.get("subjectId"),
    topicId: nullableUuid(formData.get("topicId")),
    totalItems: formData.get("totalItems"),
    score: formData.get("score"),
    dateTaken: formData.get("dateTaken"),
    mistakeNotes: nullableText(formData.get("mistakeNotes")),
    weakTopicNotes: nullableText(formData.get("weakTopicNotes")),
  };
}

async function validateActiveSubjectAndTopic(
  subjectId: string,
  topicId: string | null,
) {
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram) {
    return {
      context,
      error: {
        message: "Join a group before logging external drills.",
      } satisfies ExternalDrillFormState,
    };
  }

  const supabase = await createClient();
  const { data: subject } = await supabase
    .from("subjects")
    .select("id")
    .eq("id", subjectId)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!subject) {
    return {
      context,
      error: {
        errors: {
          subjectId: ["Choose a subject from your active group and exam track."],
        },
      } satisfies ExternalDrillFormState,
    };
  }

  if (topicId) {
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("id", topicId)
      .eq("subject_id", subjectId)
      .eq("group_id", context.activeGroup.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!topic) {
      return {
        context,
        error: {
          errors: {
            topicId: ["Choose a topic that belongs to the selected subject."],
          },
        } satisfies ExternalDrillFormState,
      };
    }
  }

  return {
    context,
    error: null,
  };
}

export async function createExternalDrillLogAction(
  _state: ExternalDrillFormState,
  formData: FormData,
): Promise<ExternalDrillFormState> {
  const parsed = externalDrillSchema.safeParse(parseExternalDrillForm(formData));

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { context, error: validationError } = await validateActiveSubjectAndTopic(
    parsed.data.subjectId,
    parsed.data.topicId,
  );

  if (validationError) {
    return validationError;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("external_drill_logs").insert({
    user_id: context.user.id,
    group_id: context.activeGroup!.id,
    exam_program_id: context.activeExamProgram!.id,
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
      message:
        "External drill log could not be saved. Check the subject, topic, and active group.",
    };
  }

  redirect("/external-drills?created=1");
}

export async function updateExternalDrillLogAction(
  _state: ExternalDrillFormState,
  formData: FormData,
): Promise<ExternalDrillFormState> {
  const parsed = externalDrillUpdateSchema.safeParse({
    logId: formData.get("logId"),
    ...parseExternalDrillForm(formData),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { context, error: validationError } = await validateActiveSubjectAndTopic(
    parsed.data.subjectId,
    parsed.data.topicId,
  );

  if (validationError) {
    return validationError;
  }

  const supabase = await createClient();
  const { data: updatedLog, error } = await supabase
    .from("external_drill_logs")
    .update({
      subject_id: parsed.data.subjectId,
      topic_id: parsed.data.topicId,
      drill_title: parsed.data.drillTitle,
      source_label: parsed.data.sourceLabel,
      total_items: parsed.data.totalItems,
      score: parsed.data.score,
      date_taken: parsed.data.dateTaken,
      mistake_notes: parsed.data.mistakeNotes,
      weak_topic_notes: parsed.data.weakTopicNotes,
    })
    .eq("id", parsed.data.logId)
    .eq("user_id", context.user.id)
    .eq("group_id", context.activeGroup!.id)
    .eq("exam_program_id", context.activeExamProgram!.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      message:
        "External drill log could not be updated. Check the subject, topic, and active group.",
    };
  }

  if (!updatedLog) {
    return {
      message: "External drill log was not found.",
    };
  }

  redirect(`/external-drills/${parsed.data.logId}?updated=1`);
}

export async function deleteExternalDrillLogAction(formData: FormData) {
  const logId = formData.get("logId")?.toString() ?? "";
  const parsed = z.string().uuid().safeParse(logId);

  if (!parsed.success) {
    redirect("/external-drills?error=invalid-log");
  }

  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  await supabase
    .from("external_drill_logs")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", context.user.id)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id);

  redirect("/external-drills?deleted=1");
}
