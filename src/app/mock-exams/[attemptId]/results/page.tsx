import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BarChart3, CheckCircle2, Circle, XCircle } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireMembership } from "@/lib/current-user";
import { formatPercentage, formatSeconds } from "@/lib/mock-exams";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type MockExamResultsPageProps = {
  params: Promise<{
    attemptId: string;
  }>;
};

type QuestionRow = {
  id: string;
  subject_id: string;
  topic_id: string;
};

type AnswerRow = {
  question_id: string;
  is_correct: boolean;
};

type BreakdownRow = {
  id: string;
  name: string;
  items: number;
  correct: number;
};

function breakdownPercentage(correct: number, total: number) {
  if (total === 0) {
    return "0.0%";
  }

  return `${((correct * 100) / total).toFixed(1)}%`;
}

function buildBreakdown(
  questions: QuestionRow[],
  answersByQuestionId: Map<string, AnswerRow>,
  nameById: Map<string, string>,
  key: "subject_id" | "topic_id",
) {
  const rows = new Map<string, BreakdownRow>();

  for (const question of questions) {
    const id = question[key];
    const current = rows.get(id) ?? {
      id,
      name: nameById.get(id) ?? "Unassigned",
      items: 0,
      correct: 0,
    };
    const answer = answersByQuestionId.get(question.id);

    current.items += 1;

    if (answer?.is_correct) {
      current.correct += 1;
    }

    rows.set(id, current);
  }

  return [...rows.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export default async function MockExamResultsPage({
  params,
}: MockExamResultsPageProps) {
  const { attemptId } = await params;
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("mock_exam_attempts")
    .select(
      "id, mock_exam_id, started_at, submitted_at, time_spent_seconds, score, total_items, percentage, status",
    )
    .eq("id", attemptId)
    .eq("user_id", context.user.id)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .maybeSingle();

  if (!attempt) {
    redirect("/mock-exams?error=missing-attempt");
  }

  if (attempt.status !== "submitted") {
    redirect(`/mock-exams/${attempt.id}/take`);
  }

  const [{ data: mockExam }, { data: itemRows }, { data: answers }] =
    await Promise.all([
      supabase
        .from("mock_exams")
        .select("id, title, mock_type, time_limit_minutes")
        .eq("id", attempt.mock_exam_id)
        .maybeSingle(),
      supabase
        .from("mock_exam_items")
        .select("question_id, order_index")
        .eq("mock_exam_id", attempt.mock_exam_id)
        .order("order_index", { ascending: true }),
      supabase
        .from("mock_exam_answers")
        .select("question_id, is_correct")
        .eq("mock_exam_attempt_id", attempt.id),
    ]);
  const questionIds = (itemRows ?? []).map((item) => item.question_id);
  let questions: QuestionRow[] = [];
  let subjects: { id: string; name: string }[] = [];
  let topics: { id: string; name: string }[] = [];

  if (questionIds.length > 0) {
    const [{ data: questionRows }, { data: subjectRows }, { data: topicRows }] =
      await Promise.all([
        supabase
          .from("questions")
          .select("id, subject_id, topic_id")
          .in("id", questionIds),
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
    subjects = subjectRows ?? [];
    topics = topicRows ?? [];
  }

  const answersByQuestionId = new Map(
    (answers ?? []).map((answer) => [answer.question_id, answer]),
  );
  const subjectNameById = new Map(
    subjects.map((subject) => [subject.id, subject.name]),
  );
  const topicNameById = new Map(topics.map((topic) => [topic.id, topic.name]));
  const subjectBreakdown = buildBreakdown(
    questions,
    answersByQuestionId,
    subjectNameById,
    "subject_id",
  );
  const topicBreakdown = buildBreakdown(
    questions,
    answersByQuestionId,
    topicNameById,
    "topic_id",
  );
  const answeredCount = answers?.length ?? 0;
  const correctCount =
    attempt.score ?? (answers ?? []).filter((answer) => answer.is_correct).length;
  const wrongCount = answeredCount - correctCount;
  const unansweredCount = Math.max(0, attempt.total_items - answeredCount);
  const title = mockExam?.title ?? "Mock exam";
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
              Mock Exam Results
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Submitted{" "}
              {attempt.submitted_at
                ? new Date(attempt.submitted_at).toLocaleString()
                : "recently"}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/mock-exams">
              <ArrowLeft aria-hidden="true" />
              Back to mock exams
            </Link>
          </Button>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {correctCount}/{attempt.total_items}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatPercentage(attempt.percentage)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Time spent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                {formatSeconds(attempt.time_spent_seconds)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Limit {mockExam?.time_limit_minutes ?? "-"} minutes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Correct / wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                {correctCount} correct
              </p>
              <p className="flex items-center gap-2">
                <XCircle className="size-4 text-destructive" />
                {wrongCount} wrong
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Unanswered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="flex items-center gap-2 text-3xl font-semibold">
                <Circle className="size-5 text-muted-foreground" />
                {unansweredCount}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {answeredCount} answered
              </p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Subject breakdown</CardTitle>
              <CardDescription>
                Correct answers by board subject.
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <BarChart3 aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">Subject</th>
                    <th className="px-3 py-2 font-medium">Items</th>
                    <th className="px-3 py-2 font-medium">Correct</th>
                    <th className="px-3 py-2 font-medium">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectBreakdown.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2">{row.items}</td>
                      <td className="px-3 py-2">{row.correct}</td>
                      <td className="px-3 py-2">
                        <Badge variant="secondary">
                          {breakdownPercentage(row.correct, row.items)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Topic breakdown</CardTitle>
            <CardDescription>Correct answers by saved topic.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">Topic</th>
                    <th className="px-3 py-2 font-medium">Items</th>
                    <th className="px-3 py-2 font-medium">Correct</th>
                    <th className="px-3 py-2 font-medium">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {topicBreakdown.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2">{row.items}</td>
                      <td className="px-3 py-2">{row.correct}</td>
                      <td className="px-3 py-2">
                        <Badge variant="secondary">
                          {breakdownPercentage(row.correct, row.items)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
