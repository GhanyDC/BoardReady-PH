"use server";

import { z } from "zod";

import { requireMembership } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";

const attemptSchema = z.object({
  questionId: z.string().uuid(),
  selectedChoiceId: z.string().uuid(),
  attemptType: z
    .string()
    .refine(
      (value) =>
        ["practice_drill", "topic_drill", "missed_question_review"].includes(
          value,
        ),
      {
        message: "Invalid attempt type.",
      },
    ),
  timeSpentSeconds: z.coerce.number().int().min(0).nullable(),
  confidenceRating: z.coerce.number().int().min(1).max(5).nullable(),
});

export type SavePracticeAttemptResult = {
  message?: string;
  attempt?: {
    id: string;
    isCorrect: boolean;
  };
};

function nullableSeconds(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value;
}

export async function savePracticeAttemptAction(
  formData: FormData,
): Promise<SavePracticeAttemptResult> {
  const parsed = attemptSchema.safeParse({
    questionId: formData.get("questionId"),
    selectedChoiceId: formData.get("selectedChoiceId"),
    attemptType: formData.get("attemptType"),
    timeSpentSeconds: nullableSeconds(formData.get("timeSpentSeconds")),
    confidenceRating: nullableSeconds(formData.get("confidenceRating")),
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Invalid answer.",
    };
  }

  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram) {
    return {
      message: "Join a group before answering practice questions.",
    };
  }

  const supabase = await createClient();
  const { data: attempt, error } = await supabase
    .from("question_attempts")
    .insert({
      user_id: context.user.id,
      group_id: context.activeGroup.id,
      exam_program_id: context.activeExamProgram.id,
      question_id: parsed.data.questionId,
      selected_choice_id: parsed.data.selectedChoiceId,
      attempt_type: parsed.data.attemptType,
      time_spent_seconds: parsed.data.timeSpentSeconds,
      confidence_rating: parsed.data.confidenceRating,
    })
    .select("id, is_correct")
    .single();

  if (error || !attempt) {
    return {
      message: error?.message ?? "Answer could not be saved.",
    };
  }

  return {
    attempt: {
      id: attempt.id,
      isCorrect: attempt.is_correct,
    },
  };
}
