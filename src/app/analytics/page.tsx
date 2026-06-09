import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  CircleHelp,
  Target,
  TrendingUp,
} from "lucide-react";

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
import {
  formatAverageConfidence,
  formatPercent,
  getPerformanceAnalytics,
  minimumWeakAreaAttempts,
  priorityForAccuracy,
  priorityLabel,
  summarizePerformance,
  type SubjectPerformance,
  type TopicPerformance,
} from "@/lib/analytics";
import { requireMembership } from "@/lib/current-user";
import { formatDateTime } from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SubjectRow = {
  id: string;
  name: string;
  board_weight: number;
};

type TopicRow = {
  id: string;
  subject_id: string;
  name: string;
};

function statusBadge(topic: TopicDisplayRow) {
  if (topic.total_attempts === 0) {
    return <Badge variant="outline">No attempts</Badge>;
  }

  if (topic.total_attempts < minimumWeakAreaAttempts) {
    return <Badge variant="secondary">Insufficient</Badge>;
  }

  const priority = priorityForAccuracy(topic.accuracy ?? 0);
  const className =
    priority === "critical"
      ? "border-transparent bg-red-600 text-white"
      : priority === "high"
        ? "border-transparent bg-orange-600 text-white"
        : priority === "medium"
          ? "border-transparent bg-amber-500 text-black"
          : priority === "watchlist"
            ? "border-transparent bg-sky-600 text-white"
            : "border-transparent bg-emerald-600 text-white";

  return <Badge className={className}>{priorityLabel(priority)}</Badge>;
}

type TopicDisplayRow = {
  id: string;
  subject_id: string;
  subject_name: string;
  topic_name: string;
  total_attempts: number;
  correct_attempts: number;
  wrong_attempts: number;
  accuracy: number | null;
  average_confidence: number | null;
  latest_attempted_at: string | null;
};

function buildTopicRows(
  subjects: SubjectRow[],
  topics: TopicRow[],
  topicPerformance: TopicPerformance[],
) {
  const subjectNameById = new Map(
    subjects.map((subject) => [subject.id, subject.name]),
  );
  const performanceByTopicId = new Map(
    topicPerformance.map((topic) => [topic.topic_id, topic]),
  );

  return topics.map((topic) => {
    const performance = performanceByTopicId.get(topic.id);

    return {
      id: topic.id,
      subject_id: topic.subject_id,
      subject_name: subjectNameById.get(topic.subject_id) ?? "Subject",
      topic_name: topic.name,
      total_attempts: performance?.total_attempts ?? 0,
      correct_attempts: performance?.correct_attempts ?? 0,
      wrong_attempts: performance?.wrong_attempts ?? 0,
      accuracy: performance?.accuracy ?? null,
      average_confidence: performance?.average_confidence ?? null,
      latest_attempted_at: performance?.latest_attempted_at ?? null,
    };
  });
}

function subjectCardData(
  subjects: SubjectRow[],
  subjectPerformance: SubjectPerformance[],
  topicRows: TopicDisplayRow[],
) {
  const performanceBySubjectId = new Map(
    subjectPerformance.map((subject) => [subject.subject_id, subject]),
  );

  return subjects.map((subject) => {
    const performance = performanceBySubjectId.get(subject.id);
    const attemptedTopics = topicRows
      .filter(
        (topic) => topic.subject_id === subject.id && topic.total_attempts > 0,
      )
      .sort(
        (left, right) =>
          (left.accuracy ?? 101) - (right.accuracy ?? 101) ||
          right.total_attempts - left.total_attempts,
      );

    return {
      id: subject.id,
      name: subject.name,
      boardWeight: subject.board_weight,
      totalAttempts: performance?.total_attempts ?? 0,
      correctAttempts: performance?.correct_attempts ?? 0,
      wrongAttempts: performance?.wrong_attempts ?? 0,
      accuracy: performance?.accuracy ?? null,
      averageConfidence: performance?.average_confidence ?? null,
      weakestTopic: attemptedTopics[0] ?? null,
    };
  });
}

export default async function AnalyticsPage() {
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const analyticsContext = {
    userId: context.user.id,
    groupId: context.activeGroup.id,
    examProgramId: context.activeExamProgram.id,
  };
  const [
    { data: subjects },
    { data: topics },
    performanceResult,
  ] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name, board_weight")
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
    getPerformanceAnalytics(supabase, analyticsContext),
  ]);
  const activeSubjects = subjects ?? [];
  const activeTopics = topics ?? [];
  const topicRows = buildTopicRows(
    activeSubjects,
    activeTopics,
    performanceResult.topics,
  );
  const subjectCards = subjectCardData(
    activeSubjects,
    performanceResult.subjects,
    topicRows,
  );
  const summary = summarizePerformance(
    performanceResult.subjects,
    performanceResult.topics,
  );
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
            Analytics
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Subject and topic performance
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Practice accuracy from published-question attempts in your active
            group and exam track.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Total attempts</CardTitle>
                <CardDescription>Practice answers</CardDescription>
              </div>
              <Target className="size-5 text-primary" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{summary.totalAttempts}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Practice accuracy</CardTitle>
                <CardDescription>Unweighted</CardDescription>
              </div>
              <BarChart3 className="size-5 text-primary" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {formatPercent(summary.overallAccuracy)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Average confidence</CardTitle>
                <CardDescription>Saved ratings</CardDescription>
              </div>
              <TrendingUp className="size-5 text-primary" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {formatAverageConfidence(summary.averageConfidence)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Insufficient topics</CardTitle>
                <CardDescription>Below 5 attempts</CardDescription>
              </div>
              <CircleHelp className="size-5 text-primary" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {
                  topicRows.filter(
                    (topic) =>
                      topic.total_attempts > 0 &&
                      topic.total_attempts < minimumWeakAreaAttempts,
                  ).length
                }
              </p>
            </CardContent>
          </Card>
        </section>

        {performanceResult.errors.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Analytics could not be loaded</CardTitle>
              <CardDescription>
                {performanceResult.errors[0]?.message ??
                  "Try again after refreshing the page."}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {summary.totalAttempts === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No practice attempts yet</CardTitle>
              <CardDescription>
                Subject and topic performance will appear after practice
                answers are saved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/practice">Start practice</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          {subjectCards.map((subject) => (
            <Card key={subject.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{subject.name}</CardTitle>
                    <CardDescription>
                      Board weight {subject.boardWeight}%
                    </CardDescription>
                  </div>
                  {subject.accuracy !== null && subject.accuracy >= 80 ? (
                    <CheckCircle2
                      className="size-5 text-emerald-600"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border px-3 py-3">
                    <p className="text-xl font-semibold">
                      {formatPercent(subject.accuracy)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Accuracy
                    </p>
                  </div>
                  <div className="rounded-md border px-3 py-3">
                    <p className="text-xl font-semibold">
                      {subject.totalAttempts}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Attempts
                    </p>
                  </div>
                  <div className="rounded-md border px-3 py-3">
                    <p className="text-xl font-semibold">
                      {formatAverageConfidence(subject.averageConfidence)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Confidence
                    </p>
                  </div>
                </div>

                <div className="rounded-md border px-3 py-3 text-sm">
                  <p className="font-medium">Correct / wrong</p>
                  <p className="mt-1 text-muted-foreground">
                    {subject.correctAttempts} correct / {subject.wrongAttempts}{" "}
                    wrong
                  </p>
                </div>

                <div className="rounded-md bg-muted px-3 py-3 text-sm">
                  <p className="font-medium">Weakest topic</p>
                  <p className="mt-1 text-muted-foreground">
                    {subject.weakestTopic
                      ? `${subject.weakestTopic.topic_name} (${formatPercent(
                          subject.weakestTopic.accuracy,
                        )})`
                      : "No topic attempts yet."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Topic breakdown</CardTitle>
            <CardDescription>
              Topic accuracy grouped by subject.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-3 pr-4 font-medium">Subject</th>
                    <th className="py-3 pr-4 font-medium">Topic</th>
                    <th className="py-3 pr-4 font-medium">Accuracy</th>
                    <th className="py-3 pr-4 font-medium">Attempts</th>
                    <th className="py-3 pr-4 font-medium">Correct</th>
                    <th className="py-3 pr-4 font-medium">Wrong</th>
                    <th className="py-3 pr-4 font-medium">Confidence</th>
                    <th className="py-3 pr-4 font-medium">Latest</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topicRows.map((topic) => (
                    <tr key={topic.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 text-muted-foreground">
                        {topic.subject_name}
                      </td>
                      <td className="py-3 pr-4 font-medium">{topic.topic_name}</td>
                      <td className="py-3 pr-4">
                        {formatPercent(topic.accuracy)}
                      </td>
                      <td className="py-3 pr-4">{topic.total_attempts}</td>
                      <td className="py-3 pr-4">{topic.correct_attempts}</td>
                      <td className="py-3 pr-4">{topic.wrong_attempts}</td>
                      <td className="py-3 pr-4">
                        {formatAverageConfidence(topic.average_confidence)}
                      </td>
                      <td className="py-3 pr-4">
                        {topic.latest_attempted_at
                          ? formatDateTime(topic.latest_attempted_at)
                          : "N/A"}
                      </td>
                      <td className="py-3 pr-4">{statusBadge(topic)}</td>
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
