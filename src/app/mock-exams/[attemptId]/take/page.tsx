import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { submitMockExamAction } from "@/app/mock-exams/actions";
import { AppShell } from "@/components/app-shell";
import { MockExamTakeSession } from "@/components/mock-exams/mock-exam-take-session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireMembership } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type TakeMockExamPageProps = {
  params: Promise<{
    attemptId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

type ChoiceRow = {
  id: string;
  question_id: string;
  choice_label: string;
  choice_text: string;
  order_index: number;
};

function errorMessage(code?: string) {
  const messages: Record<string, string> = {
    "submit-failed": "Mock exam could not be submitted. Please try again.",
  };

  return code ? messages[code] ?? "Mock exam action could not be completed." : null;
}

export default async function TakeMockExamPage({
  params,
  searchParams,
}: TakeMockExamPageProps) {
  const { attemptId } = await params;
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    redirect("/onboarding");
  }

  const queryParams = await searchParams;
  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("mock_exam_attempts")
    .select("id, mock_exam_id, started_at, status, total_items")
    .eq("id", attemptId)
    .eq("user_id", context.user.id)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .maybeSingle();

  if (!attempt) {
    redirect("/mock-exams?error=missing-attempt");
  }

  if (attempt.status === "submitted") {
    redirect(`/mock-exams/${attempt.id}/results`);
  }

  if (attempt.status !== "in_progress") {
    redirect("/mock-exams?error=missing-attempt");
  }

  const [{ data: mockExam }, { data: itemRows }] = await Promise.all([
    supabase
      .from("mock_exams")
      .select("id, title, time_limit_minutes")
      .eq("id", attempt.mock_exam_id)
      .eq("group_id", context.activeGroup.id)
      .eq("exam_program_id", context.activeExamProgram.id)
      .eq("status", "published")
      .maybeSingle(),
    supabase
      .from("mock_exam_items")
      .select("question_id, order_index")
      .eq("mock_exam_id", attempt.mock_exam_id)
      .order("order_index", { ascending: true }),
  ]);

  if (!mockExam) {
    redirect("/mock-exams?error=missing-mock");
  }

  const questionIds = (itemRows ?? []).map((item) => item.question_id);
  let choices: ChoiceRow[] = [];
  let questions: {
    id: string;
    subject_id: string;
    topic_id: string;
    question_text: string;
    difficulty: string;
  }[] = [];
  let subjects: { id: string; name: string }[] = [];
  let topics: { id: string; name: string }[] = [];

  if (questionIds.length > 0) {
    const [
      { data: questionRows },
      { data: choiceRows },
      { data: subjectRows },
      { data: topicRows },
    ] = await Promise.all([
      supabase
        .from("questions")
        .select("id, subject_id, topic_id, question_text, difficulty")
        .in("id", questionIds),
      supabase
        .from("choices")
        .select("id, question_id, choice_label, choice_text, order_index")
        .in("question_id", questionIds)
        .order("order_index", { ascending: true }),
      supabase
        .from("subjects")
        .select("id, name")
        .eq("group_id", context.activeGroup.id)
        .eq("exam_program_id", context.activeExamProgram.id),
      supabase
        .from("topics")
        .select("id, name")
        .eq("group_id", context.activeGroup.id),
    ]);

    questions = questionRows ?? [];
    choices = choiceRows ?? [];
    subjects = subjectRows ?? [];
    topics = topicRows ?? [];
  }

  const questionById = new Map(
    questions.map((question) => [question.id, question]),
  );
  const subjectNameById = new Map(
    subjects.map((subject) => [subject.id, subject.name]),
  );
  const topicNameById = new Map(topics.map((topic) => [topic.id, topic.name]));
  const choicesByQuestionId = new Map<string, ChoiceRow[]>();

  for (const choice of choices) {
    const current = choicesByQuestionId.get(choice.question_id) ?? [];
    current.push(choice);
    choicesByQuestionId.set(choice.question_id, current);
  }

  const orderedQuestions = (itemRows ?? [])
    .map((item) => questionById.get(item.question_id))
    .filter((question): question is NonNullable<typeof question> =>
      Boolean(question),
    )
    .map((question) => ({
      id: question.id,
      questionText: question.question_text,
      difficulty: question.difficulty,
      subjectName: subjectNameById.get(question.subject_id) ?? "Subject",
      topicName: topicNameById.get(question.topic_id) ?? "Topic",
      choices: (choicesByQuestionId.get(question.id) ?? []).map((choice) => ({
        id: choice.id,
        choice_label: choice.choice_label,
        choice_text: choice.choice_text,
      })),
    }));
  const errorText = errorMessage(queryParams?.error);
  const userName =
    context.profile?.full_name ?? context.user.email ?? "BoardReady PH reviewer";

  return (
    <AppShell
      userName={userName}
      role={context.role}
      groupName={context.activeGroup.name}
      examProgramName={context.activeExamProgram.name}
    >
      <div className="space-y-8">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-primary">
              Mock Exam
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Take exam
            </h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/mock-exams">
              <ArrowLeft aria-hidden="true" />
              Back to mock exams
            </Link>
          </Button>
        </section>

        {errorText ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorText}
          </p>
        ) : null}

        {orderedQuestions.length !== attempt.total_items ? (
          <Card>
            <CardHeader>
              <CardTitle>Mock exam item set looks incomplete</CardTitle>
              <CardDescription>
                Expected {attempt.total_items} items, loaded{" "}
                {orderedQuestions.length}.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <MockExamTakeSession
            attemptId={attempt.id}
            mockExamTitle={mockExam.title}
            startedAt={attempt.started_at}
            timeLimitMinutes={mockExam.time_limit_minutes}
            questions={orderedQuestions}
            action={submitMockExamAction}
          />
        )}
      </div>
    </AppShell>
  );
}
