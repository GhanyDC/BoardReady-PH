"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireMembership } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";

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
