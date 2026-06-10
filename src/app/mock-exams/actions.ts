"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireMembership } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/types";

const submitMockExamSchema = z.object({
  attemptId: z.string().uuid(),
  timeSpentSeconds: z.coerce.number().int().min(0).max(86400),
});

export async function startMockExamAction(formData: FormData) {
  const parsed = z.string().uuid().safeParse(formData.get("mockExamId"));

  if (!parsed.success) {
    redirect("/mock-exams?error=invalid-mock");
  }

  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const { data: mockExam } = await supabase
    .from("mock_exams")
    .select("id, item_count")
    .eq("id", parsed.data)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .eq("status", "published")
    .maybeSingle();

  if (!mockExam) {
    redirect("/mock-exams?error=missing-mock");
  }

  const { data: existingAttempt } = await supabase
    .from("mock_exam_attempts")
    .select("id")
    .eq("mock_exam_id", mockExam.id)
    .eq("user_id", context.user.id)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingAttempt) {
    redirect(`/mock-exams/${existingAttempt.id}/take`);
  }

  const { data: attempt, error } = await supabase
    .from("mock_exam_attempts")
    .insert({
      mock_exam_id: mockExam.id,
      user_id: context.user.id,
      group_id: context.activeGroup.id,
      exam_program_id: context.activeExamProgram.id,
      total_items: mockExam.item_count,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (error || !attempt) {
    redirect("/mock-exams?error=start-failed");
  }

  redirect(`/mock-exams/${attempt.id}/take`);
}

export async function submitMockExamAction(formData: FormData) {
  const parsed = submitMockExamSchema.safeParse({
    attemptId: formData.get("attemptId"),
    timeSpentSeconds: formData.get("timeSpentSeconds"),
  });

  if (!parsed.success) {
    redirect("/mock-exams?error=invalid-attempt");
  }

  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram) {
    redirect("/onboarding");
  }

  const questionIds = formData
    .getAll("questionId")
    .map((value) => value.toString());
  const answers = questionIds
    .map((questionId) => {
      const selectedChoiceId = formData.get(`answer:${questionId}`)?.toString();

      if (!selectedChoiceId) {
        return null;
      }

      const parsedQuestionId = z.string().uuid().safeParse(questionId);
      const parsedChoiceId = z.string().uuid().safeParse(selectedChoiceId);

      if (!parsedQuestionId.success || !parsedChoiceId.success) {
        return null;
      }

      return {
        question_id: parsedQuestionId.data,
        selected_choice_id: parsedChoiceId.data,
        time_spent_seconds: null,
      };
    })
    .filter((answer): answer is NonNullable<typeof answer> => Boolean(answer));

  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("mock_exam_attempts")
    .select("id")
    .eq("id", parsed.data.attemptId)
    .eq("user_id", context.user.id)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .maybeSingle();

  if (!attempt) {
    redirect("/mock-exams?error=missing-attempt");
  }

  const { error } = await supabase.rpc("submit_mock_exam_attempt", {
    target_mock_exam_attempt_id: attempt.id,
    submitted_answers: answers as Json,
    target_time_spent_seconds: parsed.data.timeSpentSeconds,
  });

  if (error) {
    redirect(`/mock-exams/${attempt.id}/take?error=submit-failed`);
  }

  redirect(`/mock-exams/${attempt.id}/results`);
}
