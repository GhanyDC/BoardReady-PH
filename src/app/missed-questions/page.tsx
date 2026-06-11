import Link from "next/link";
import { redirect } from "next/navigation";
import { RotateCcw } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireMembership } from "@/lib/current-user";
import { difficultyLabel, formatDateTime, questionDifficulties } from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type MissedQuestionsPageProps = {
  searchParams?: Promise<{
    subject?: string;
    topic?: string;
    difficulty?: string;
    from?: string;
    to?: string;
  }>;
};

type WrongAttemptSummary = {
  questionId: string;
  latestWrongAt: string;
  wrongCount: number;
  latestConfidence: number | null;
};

function startOfDayIso(value: string) {
  return new Date(`${value}T00:00:00.000`).toISOString();
}

function endOfDayIso(value: string) {
  return new Date(`${value}T23:59:59.999`).toISOString();
}

function preview(value: string) {
  return value.length > 140 ? `${value.slice(0, 140)}...` : value;
}

export default async function MissedQuestionsPage({
  searchParams,
}: MissedQuestionsPageProps) {
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const subject = params?.subject ?? "";
  const topic = params?.topic ?? "";
  const difficulty = params?.difficulty ?? "";
  const from = params?.from ?? "";
  const to = params?.to ?? "";
  const supabase = await createClient();
  const [{ data: subjects }, { data: topics }] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name")
      .eq("group_id", context.activeGroup.id)
      .eq("exam_program_id", context.activeExamProgram.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("topics")
      .select("id, subject_id, name")
      .eq("group_id", context.activeGroup.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  let attemptQuery = supabase
    .from("question_attempts")
    .select("question_id, created_at, confidence_rating")
    .eq("user_id", context.user.id)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .eq("is_correct", false)
    .order("created_at", { ascending: false })
    .limit(250);

  if (from) {
    attemptQuery = attemptQuery.gte("created_at", startOfDayIso(from));
  }

  if (to) {
    attemptQuery = attemptQuery.lte("created_at", endOfDayIso(to));
  }

  const { data: wrongAttempts } = await attemptQuery;
  const summaryByQuestion = new Map<string, WrongAttemptSummary>();

  for (const attempt of wrongAttempts ?? []) {
    const current = summaryByQuestion.get(attempt.question_id);

    if (current) {
      current.wrongCount += 1;
      continue;
    }

    summaryByQuestion.set(attempt.question_id, {
      questionId: attempt.question_id,
      latestWrongAt: attempt.created_at,
      wrongCount: 1,
      latestConfidence: attempt.confidence_rating,
    });
  }

  const questionIds = [...summaryByQuestion.keys()];
  const { data: questionRows } = questionIds.length
    ? await supabase
        .from("questions")
        .select("id, question_text, subject_id, topic_id, difficulty, rationale")
        .in("id", questionIds)
        .eq("group_id", context.activeGroup.id)
        .eq("exam_program_id", context.activeExamProgram.id)
        .eq("status", "published")
    : { data: [] };
  const subjectNameById = new Map(
    (subjects ?? []).map((subjectItem) => [subjectItem.id, subjectItem.name]),
  );
  const topicNameById = new Map(
    (topics ?? []).map((topicItem) => [topicItem.id, topicItem.name]),
  );
  const filteredTopics = subject
    ? (topics ?? []).filter((topicItem) => topicItem.subject_id === subject)
    : topics ?? [];
  const missedQuestions = (questionRows ?? [])
    .filter((question) => !subject || question.subject_id === subject)
    .filter((question) => !topic || question.topic_id === topic)
    .filter((question) => !difficulty || question.difficulty === difficulty)
    .map((question) => ({
      ...question,
      summary: summaryByQuestion.get(question.id),
    }))
    .filter((question) => question.summary);
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
        <section>
          <p className="text-sm font-medium uppercase text-primary">
            Missed Questions
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Review incorrect attempts
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Only your own incorrect practice attempts are shown.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Showing {missedQuestions.length} missed question
              {missedQuestions.length === 1 ? "" : "s"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject</Label>
                <select
                  id="subject"
                  name="subject"
                  defaultValue={subject}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="">All subjects</option>
                  {(subjects ?? []).map((subjectItem) => (
                    <option key={subjectItem.id} value={subjectItem.id}>
                      {subjectItem.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="topic">Topic</Label>
                <select
                  id="topic"
                  name="topic"
                  defaultValue={topic}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="">All topics</option>
                  {filteredTopics.map((topicItem) => (
                    <option key={topicItem.id} value={topicItem.id}>
                      {topicItem.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  name="difficulty"
                  defaultValue={difficulty}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="">All difficulties</option>
                  {questionDifficulties.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="from">From</Label>
                <Input id="from" name="from" type="date" defaultValue={from} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="to">To</Label>
                <Input id="to" name="to" type="date" defaultValue={to} />
              </div>
              <Button type="submit" className="md:self-end">
                Apply filters
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4">
          {missedQuestions.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No missed questions found</CardTitle>
                <CardDescription>
                  Incorrect practice attempts will appear here.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {missedQuestions.map((question) => (
            <Card key={question.id}>
              <CardContent className="grid gap-4 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {subjectNameById.get(question.subject_id) ?? "Subject"} /{" "}
                      {topicNameById.get(question.topic_id) ?? "Topic"}
                    </p>
                    <h2 className="mt-1 font-semibold">
                      {preview(question.question_text)}
                    </h2>
                  </div>
                  <Badge>{difficultyLabel(question.difficulty)}</Badge>
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                  <span>Wrong attempts: {question.summary?.wrongCount}</span>
                  <span>
                    Latest wrong:{" "}
                    {question.summary
                      ? formatDateTime(question.summary.latestWrongAt)
                      : "N/A"}
                  </span>
                  <span>
                    Confidence:{" "}
                    {question.summary?.latestConfidence
                      ? `${question.summary.latestConfidence}/5`
                      : "N/A"}
                  </span>
                </div>

                {question.rationale ? (
                  <div className="rounded-md bg-muted px-3 py-2 text-sm">
                    <p className="font-medium">Rationale</p>
                    <p className="mt-1 leading-6 text-muted-foreground">
                      {question.rationale}
                    </p>
                  </div>
                ) : null}

                <Button asChild variant="outline" className="w-fit">
                  <Link href={`/practice/session?question=${question.id}&count=1`}>
                    <RotateCcw aria-hidden="true" />
                    Retry question
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
