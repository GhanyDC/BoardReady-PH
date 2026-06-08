"use server";

import { z } from "zod";

import { requireMembership } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { activityTypes } from "@/lib/study";

const activityTypeValues: string[] = activityTypes.map((item) => item.value);

const studySessionSchema = z.object({
  activityType: z.string().refine((value) => activityTypeValues.includes(value), {
    message: "Choose an activity type.",
  }),
  subjectId: z.string().uuid().nullable(),
  topicId: z.string().uuid().nullable(),
  startedAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Start time is required.",
  }),
  endedAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "End time is required.",
  }),
  durationSeconds: z.coerce
    .number()
    .int()
    .min(1, "Save a session after at least 1 second."),
  focusRating: z.coerce
    .number()
    .int()
    .min(1)
    .max(5)
    .nullable(),
  notes: z.string().trim().max(2000, "Keep notes under 2,000 characters."),
});

export type StudyTimerFormState = {
  errors?: {
    activityType?: string[];
    subjectId?: string[];
    topicId?: string[];
    startedAt?: string[];
    endedAt?: string[];
    durationSeconds?: string[];
    focusRating?: string[];
    notes?: string[];
  };
  message?: string;
  success?: string;
};

function nullableUuid(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value;
}

function nullableRating(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value;
}

export async function saveStudySessionAction(
  _state: StudyTimerFormState,
  formData: FormData,
): Promise<StudyTimerFormState> {
  const parsed = studySessionSchema.safeParse({
    activityType: formData.get("activityType"),
    subjectId: nullableUuid(formData.get("subjectId")),
    topicId: nullableUuid(formData.get("topicId")),
    startedAt: formData.get("startedAt"),
    endedAt: formData.get("endedAt"),
    durationSeconds: formData.get("durationSeconds"),
    focusRating: nullableRating(formData.get("focusRating")),
    notes: formData.get("notes")?.toString() ?? "",
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.topicId && !parsed.data.subjectId) {
    return {
      errors: {
        topicId: ["Choose a subject before choosing a topic."],
      },
    };
  }

  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram) {
    return {
      message: "Join a group before saving study sessions.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("study_sessions").insert({
    user_id: context.user.id,
    group_id: context.activeGroup.id,
    exam_program_id: context.activeExamProgram.id,
    subject_id: parsed.data.subjectId,
    topic_id: parsed.data.topicId,
    activity_type: parsed.data.activityType,
    started_at: parsed.data.startedAt,
    ended_at: parsed.data.endedAt,
    duration_seconds: parsed.data.durationSeconds,
    focus_rating: parsed.data.focusRating,
    notes: parsed.data.notes || null,
  });

  if (error) {
    return {
      message: error.message,
    };
  }

  return {
    success: "Study session saved.",
  };
}
