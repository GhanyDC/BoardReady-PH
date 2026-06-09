import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { savePracticeAttemptAction } from "@/app/practice/session/actions";
import { AppShell } from "@/components/app-shell";
import { DrillSession } from "@/components/practice/drill-session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireMembership } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PracticeSessionPageProps = {
  searchParams?: Promise<{
    subject?: string;
    topic?: string;
    difficulty?: string;
    count?: string;
    mode?: string;
  }>;
};

type ChoiceRow = {
  id: string;
  question_id: string;
  choice_label: string;
  choice_text: string;
  explanation: string | null;
  is_correct: boolean;
  order_index: number;
};

type NameRow = {
  id: string;
  name: string;
};

function parseCount(value?: string) {
  const parsed = Number.parseInt(value ?? "10", 10);

  if (Number.isNaN(parsed)) {
    return 10;
  }

  return Math.min(Math.max(parsed, 1), 50);
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export default async function PracticeSessionPage({
  searchParams,
}: PracticeSessionPageProps) {
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const subject = params?.subject ?? "";
  const topic = params?.topic ?? "";
  const difficulty = params?.difficulty ?? "";
  const count = parseCount(params?.count);
  const mode = params?.mode ?? "mixed_subject";
  const attemptType =
    mode === "topic_drill" || topic ? "topic_drill" : "practice_drill";
  const supabase = await createClient();

  let questionQuery = supabase
    .from("questions")
    .select("id, subject_id, topic_id, question_text, difficulty, rationale")
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .eq("status", "published")
    .limit(100);

  if (subject) {
    questionQuery = questionQuery.eq("subject_id", subject);
  }

  if (topic) {
    questionQuery = questionQuery.eq("topic_id", topic);
  }

  if (difficulty) {
    questionQuery = questionQuery.eq("difficulty", difficulty);
  }

  const { data: questionPool, error } = await questionQuery;
  const selectedQuestions = shuffle(questionPool ?? []).slice(0, count);
  const questionIds = selectedQuestions.map((question) => question.id);
  let choices: ChoiceRow[] = [];
  let subjects: NameRow[] = [];
  let topics: NameRow[] = [];

  if (questionIds.length > 0) {
    const [
      { data: choiceRows },
      { data: subjectRows },
      { data: topicRows },
    ] = await Promise.all([
        supabase
          .from("choices")
          .select(
            "id, question_id, choice_label, choice_text, explanation, is_correct, order_index",
          )
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

    choices = choiceRows ?? [];
    subjects = subjectRows ?? [];
    topics = topicRows ?? [];
  }
  const subjectNameById = new Map(
    (subjects ?? []).map((subjectItem) => [subjectItem.id, subjectItem.name]),
  );
  const topicNameById = new Map(
    (topics ?? []).map((topicItem) => [topicItem.id, topicItem.name]),
  );
  const choicesByQuestionId = new Map<string, ChoiceRow[]>();

  for (const choice of choices ?? []) {
    const current = choicesByQuestionId.get(choice.question_id) ?? [];
    current.push(choice);
    choicesByQuestionId.set(choice.question_id, current);
  }

  const questions = selectedQuestions.map((question) => ({
    id: question.id,
    question_text: question.question_text,
    difficulty: question.difficulty,
    rationale: question.rationale ?? "",
    subjectName: subjectNameById.get(question.subject_id) ?? "Subject",
    topicName: topicNameById.get(question.topic_id) ?? "Topic",
    choices: (choicesByQuestionId.get(question.id) ?? []).map((choice) => ({
      id: choice.id,
      choice_label: choice.choice_label,
      choice_text: choice.choice_text,
      explanation: choice.explanation,
      is_correct: choice.is_correct,
    })),
  }));
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
              Practice Session
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Answer published questions
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              This Sprint 4 drill session is not persisted after refresh.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/practice">
              <ArrowLeft aria-hidden="true" />
              Back to setup
            </Link>
          </Button>
        </section>

        {error ? (
          <Card>
            <CardHeader>
              <CardTitle>Questions could not be loaded</CardTitle>
              <CardDescription>{error.message}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {questions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No matching questions</CardTitle>
              <CardDescription>
                Adjust your setup filters or wait for an admin to publish more
                questions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/practice">Return to setup</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DrillSession
            questions={questions}
            attemptType={attemptType}
            action={savePracticeAttemptAction}
          />
        )}
      </div>
    </AppShell>
  );
}
