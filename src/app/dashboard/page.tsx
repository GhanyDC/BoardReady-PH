import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ClipboardList,
  ListChecks,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/current-user";
import { attemptTypeLabel } from "@/lib/practice";
import { formatRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import {
  formatPercent,
  getPerformanceAnalytics,
  getWeakAreas,
  minimumWeakAreaAttempts,
  summarizePerformance,
} from "@/lib/analytics";
import {
  formatExternalDrillPercentage,
  getExternalDrillSummary,
} from "@/lib/external-drills";
import {
  formatPercentage,
  mockAttemptStatusLabel,
} from "@/lib/mock-exams";
import {
  calculateReadinessAssessment,
  readinessDisclaimer,
} from "@/lib/readiness";
import { getStudyRecommendations } from "@/lib/readiness-recommendations";
import {
  activityLabel,
  formatDuration,
  studyStyleLabel,
} from "@/lib/study";

export const dynamic = "force-dynamic";

// Today and weekly totals currently use app/server local date boundaries.
// User-specific timezone support can be added later.
function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfLocalWeek(date: Date) {
  const weekStart = startOfLocalDay(date);
  const day = weekStart.getDay();
  const daysSinceMonday = (day + 6) % 7;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);
  return weekStart;
}

function progressPercent(totalSeconds: number, goalMinutes?: number) {
  if (!goalMinutes) {
    return 0;
  }

  return Math.min(100, Math.round((totalSeconds / (goalMinutes * 60)) * 100));
}

function formatGoalProgress(totalSeconds: number, goalMinutes?: number) {
  if (!goalMinutes) {
    return "Set a goal in Study Habits.";
  }

  return `${progressPercent(totalSeconds, goalMinutes)}% of ${goalMinutes}m goal`;
}

function formatTargetDate(value?: string | null) {
  if (!value) {
    return "No exam date";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function formatAccuracy(correct: number, total: number) {
  if (total === 0) {
    return "N/A";
  }

  return `${Math.round((correct / total) * 100)}%`;
}

function readinessBadgeVariant(label: string) {
  if (label === "strong" || label === "board_ready") {
    return "success" as const;
  }

  if (label === "high_risk") {
    return "outline" as const;
  }

  return "secondary" as const;
}

export default async function DashboardPage() {
  const context = await requireCurrentUser();
  const userName =
    context.profile?.full_name ?? context.user.email ?? "BoardReady PH reviewer";

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Join a group to start</CardTitle>
            <CardDescription>
              BoardReady PH needs an active group before it can show your exam
              track dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Use the access code from your admin to connect your account to a
              group and exam track.
            </p>
            <Button asChild>
              <Link href="/onboarding">Go to onboarding</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const supabase = await createClient();
  const todayStart = startOfLocalDay(new Date());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const weekStart = startOfLocalWeek(new Date());
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const analyticsContext = {
    userId: context.user.id,
    groupId: context.activeGroup.id,
    examProgramId: context.activeExamProgram.id,
  };

  const [
    { data: subjects },
    { data: preferences },
    { data: weekSessions },
    { data: latestSession },
    { data: todayAttempts },
    { data: latestAttempt },
    { data: weekAttempts },
    performanceResult,
    weakAreasResult,
    externalDrillSummary,
    readinessAssessment,
    { data: latestMockAttempt },
    { data: latestPublishedMockExam },
  ] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name, board_weight")
      .eq("group_id", context.activeGroup.id)
      .eq("exam_program_id", context.activeExamProgram.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("study_preferences")
      .select(
        "daily_goal_minutes, weekly_goal_minutes, preferred_session_length_minutes, preferred_study_style, target_exam_date",
      )
      .eq("user_id", context.user.id)
      .eq("group_id", context.activeGroup.id)
      .eq("exam_program_id", context.activeExamProgram.id)
      .maybeSingle(),
    supabase
      .from("study_sessions")
      .select("id, subject_id, activity_type, started_at, duration_seconds")
      .eq("user_id", context.user.id)
      .eq("group_id", context.activeGroup.id)
      .eq("exam_program_id", context.activeExamProgram.id)
      .gte("started_at", weekStart.toISOString())
      .lt("started_at", nextWeekStart.toISOString()),
    supabase
      .from("study_sessions")
      .select("id, subject_id, activity_type, started_at, duration_seconds")
      .eq("user_id", context.user.id)
      .eq("group_id", context.activeGroup.id)
      .eq("exam_program_id", context.activeExamProgram.id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("question_attempts")
      .select("id, is_correct, created_at")
      .eq("user_id", context.user.id)
      .eq("group_id", context.activeGroup.id)
      .eq("exam_program_id", context.activeExamProgram.id)
      .gte("created_at", todayStart.toISOString())
      .lt("created_at", tomorrowStart.toISOString()),
    supabase
      .from("question_attempts")
      .select("id, is_correct, confidence_rating, attempt_type, created_at")
      .eq("user_id", context.user.id)
      .eq("group_id", context.activeGroup.id)
      .eq("exam_program_id", context.activeExamProgram.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("question_attempts")
      .select("id")
      .eq("user_id", context.user.id)
      .eq("group_id", context.activeGroup.id)
      .eq("exam_program_id", context.activeExamProgram.id)
      .gte("created_at", weekStart.toISOString())
      .lt("created_at", nextWeekStart.toISOString()),
    getPerformanceAnalytics(supabase, analyticsContext),
    getWeakAreas(supabase, analyticsContext),
    getExternalDrillSummary(supabase, analyticsContext),
    calculateReadinessAssessment(supabase, analyticsContext),
    supabase
      .from("mock_exam_attempts")
      .select(
        "id, mock_exam_id, status, score, total_items, percentage, submitted_at, created_at",
      )
      .eq("user_id", context.user.id)
      .eq("group_id", context.activeGroup.id)
      .eq("exam_program_id", context.activeExamProgram.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("mock_exams")
      .select("id, title, item_count, time_limit_minutes, published_at")
      .eq("group_id", context.activeGroup.id)
      .eq("exam_program_id", context.activeExamProgram.id)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const subjectNameById = new Map(
    (subjects ?? []).map((subject) => [subject.id, subject.name]),
  );
  const todaySeconds = (weekSessions ?? [])
    .filter((session) => {
      const startedAt = new Date(session.started_at);
      return startedAt >= todayStart && startedAt < tomorrowStart;
    })
    .reduce((total, session) => total + session.duration_seconds, 0);
  const weekSeconds = (weekSessions ?? []).reduce(
    (total, session) => total + session.duration_seconds,
    0,
  );
  const latestSubjectName = latestSession?.subject_id
    ? subjectNameById.get(latestSession.subject_id)
    : null;
  const latestSessionHelper = latestSession
    ? `${activityLabel(latestSession.activity_type)} / ${
        latestSubjectName ?? "General session"
      }`
    : "Start the timer to begin tracking.";
  const studyPlanHelper = preferences
    ? `${studyStyleLabel(preferences.preferred_study_style)} / ${
        preferences.preferred_session_length_minutes
      }m sessions`
    : "Set goals and preferences in Study Habits.";
  const todayAttemptCount = (todayAttempts ?? []).length;
  const todayCorrectCount = (todayAttempts ?? []).filter(
    (attempt) => attempt.is_correct,
  ).length;
  const weeklyAttemptCount = (weekAttempts ?? []).length;
  const analyticsSummary = summarizePerformance(
    performanceResult.subjects,
    performanceResult.topics,
  );
  const topWeakAreas = weakAreasResult.data
    .filter((area) => area.isWeak)
    .slice(0, 3);
  const hasInsufficientPracticeData =
    analyticsSummary.totalAttempts < minimumWeakAreaAttempts ||
    (analyticsSummary.totalAttempts > 0 &&
      weakAreasResult.data.length === 0 &&
      analyticsSummary.insufficientTopics.length > 0);
  const readinessRecommendations = getStudyRecommendations(readinessAssessment);
  const topReadinessRecommendation = readinessRecommendations[0] ?? null;
  const topWeakSubject = [...readinessAssessment.subjectBreakdown]
    .filter((subject) => subject.readinessEstimate !== null)
    .sort(
      (left, right) =>
        (left.readinessEstimate ?? 0) - (right.readinessEstimate ?? 0),
    )[0] ?? null;
  const { data: latestAttemptMockExam } = latestMockAttempt
    ? await supabase
        .from("mock_exams")
        .select("id, title, item_count, time_limit_minutes")
        .eq("id", latestMockAttempt.mock_exam_id)
        .maybeSingle()
    : { data: null };
  const mockExamTitle =
    latestAttemptMockExam?.title ?? latestPublishedMockExam?.title ?? null;
  const mockExamHref =
    latestMockAttempt?.status === "in_progress"
      ? `/mock-exams/${latestMockAttempt.id}/take`
      : latestMockAttempt?.status === "submitted"
        ? `/mock-exams/${latestMockAttempt.id}/results`
        : "/mock-exams";
  const mockExamAction =
    latestMockAttempt?.status === "in_progress"
      ? "Resume mock exam"
      : latestMockAttempt?.status === "submitted"
        ? "View results"
        : "Take mock exam";

  const metricCards = [
    {
      title: "Today's Study Time",
      value: formatDuration(todaySeconds),
      helper: formatGoalProgress(todaySeconds, preferences?.daily_goal_minutes),
      icon: Clock3,
      href: "/study-timer",
      action: "Log time",
      progress: progressPercent(todaySeconds, preferences?.daily_goal_minutes),
    },
    {
      title: "Weekly Study Time",
      value: formatDuration(weekSeconds),
      helper: formatGoalProgress(weekSeconds, preferences?.weekly_goal_minutes),
      icon: TrendingUp,
      href: "/study-logs",
      action: "View logs",
      progress: progressPercent(weekSeconds, preferences?.weekly_goal_minutes),
    },
    {
      title: "Latest Session",
      value: latestSession
        ? formatDuration(latestSession.duration_seconds)
        : "No sessions yet",
      helper: latestSessionHelper,
      icon: CalendarDays,
      href: "/study-timer",
      action: "Open timer",
      progress: latestSession ? 100 : 0,
    },
    {
      title: "Study Plan",
      value: formatTargetDate(preferences?.target_exam_date),
      helper: studyPlanHelper,
      icon: ListChecks,
      href: "/study-habits",
      action: "Edit habits",
      progress: preferences ? 100 : 0,
    },
  ];

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
              BoardReady PH
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Welcome, {userName}
            </h1>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
              <p>
                <span className="font-medium text-foreground">Exam Track:</span>{" "}
                {context.activeExamProgram.name}
              </p>
              <p>
                <span className="font-medium text-foreground">Group:</span>{" "}
                {context.activeGroup.name}
              </p>
              <p>
                <span className="font-medium text-foreground">Role:</span>{" "}
                {formatRole(context.role)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">
            <BarChart3 className="size-4 text-primary" aria-hidden="true" />
            Server-local day and calendar week
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => {
            const Icon = card.icon;

            return (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                  <CardTitle className="text-sm text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{card.value}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {card.helper}
                  </p>
                  <div
                    className="mt-4 h-2 rounded-full bg-muted"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${card.progress}%` }}
                    />
                  </div>
                  <Button asChild variant="link" className="mt-3 h-auto p-0">
                    <Link href={card.href}>{card.action}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Readiness Summary</CardTitle>
              <CardDescription>
                Internal study estimate across practice, mocks, weak areas,
                study consistency, and external drills.
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <ListChecks aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border px-3 py-3">
                <p className="text-3xl font-semibold">
                  {readinessAssessment.overallReadiness.toFixed(1)}%
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Readiness score
                </p>
              </div>
              <div className="rounded-md border px-3 py-3">
                <Badge variant={readinessBadgeVariant(readinessAssessment.label)}>
                  {readinessAssessment.labelText}
                </Badge>
                <p className="mt-3 text-sm text-muted-foreground">
                  Study estimate label
                </p>
              </div>
              <div className="rounded-md border px-3 py-3">
                <p className="text-base font-semibold">
                  {topWeakSubject?.subjectName ?? "Not enough data"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Top weak subject
                </p>
              </div>
              <div className="rounded-md border px-3 py-3">
                <p className="text-base font-semibold">
                  {topReadinessRecommendation?.title ?? "Maintain review"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Top recommendation
                </p>
              </div>
            </div>

            <div className="rounded-md bg-muted px-3 py-3 text-sm text-muted-foreground">
              {readinessDisclaimer}
            </div>

            <Button asChild className="w-fit">
              <Link href="/readiness">Open readiness overview</Link>
            </Button>
          </CardContent>
        </Card>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Practice Activity</CardTitle>
                <CardDescription>
                  Basic drill activity for your active group and exam track.
                </CardDescription>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <Target aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border px-3 py-3">
                  <p className="text-2xl font-semibold">{todayAttemptCount}</p>
                  <p className="text-sm text-muted-foreground">
                    Answered today
                  </p>
                </div>
                <div className="rounded-md border px-3 py-3">
                  <p className="text-2xl font-semibold">{todayCorrectCount}</p>
                  <p className="text-sm text-muted-foreground">Correct today</p>
                </div>
                <div className="rounded-md border px-3 py-3">
                  <p className="text-2xl font-semibold">
                    {formatAccuracy(todayCorrectCount, todayAttemptCount)}
                  </p>
                  <p className="text-sm text-muted-foreground">Accuracy today</p>
                </div>
              </div>

              {latestAttempt ? (
                <div className="flex flex-col gap-3 rounded-md border px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">
                      Latest: {attemptTypeLabel(latestAttempt.attempt_type)}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(latestAttempt.created_at))}
                      {latestAttempt.confidence_rating
                        ? ` / Confidence ${latestAttempt.confidence_rating}/5`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={
                        latestAttempt.is_correct
                          ? "size-5 text-emerald-600"
                          : "size-5 text-destructive"
                      }
                      aria-hidden="true"
                    />
                    <span>
                      {latestAttempt.is_correct ? "Correct" : "Incorrect"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border px-3 py-3 text-sm text-muted-foreground">
                  No practice attempts yet. Start a drill when published
                  questions are available.
                </div>
              )}

              <Button asChild className="w-fit">
                <Link href="/practice">Start practice</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Learning Progress</CardTitle>
                <CardDescription>
                  Practice accuracy and weak-area signals.
                </CardDescription>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <BarChart3 aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border px-3 py-3">
                  <p className="text-2xl font-semibold">
                    {formatPercent(analyticsSummary.overallAccuracy)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Practice Accuracy
                  </p>
                </div>
                <div className="rounded-md border px-3 py-3">
                  <p className="text-2xl font-semibold">{weeklyAttemptCount}</p>
                  <p className="text-sm text-muted-foreground">
                    Answered this week
                  </p>
                </div>
              </div>

              <div className="grid gap-2 text-sm">
                <div className="rounded-md border px-3 py-3">
                  <p className="font-medium">Weakest subject</p>
                  <p className="mt-1 text-muted-foreground">
                    {analyticsSummary.weakestSubject
                      ? `${
                          analyticsSummary.weakestSubject.subject_name
                        } / ${formatPercent(
                          analyticsSummary.weakestSubject.accuracy,
                        )}`
                      : "Not enough data yet."}
                  </p>
                </div>
                <div className="rounded-md border px-3 py-3">
                  <p className="font-medium">Weakest topic</p>
                  <p className="mt-1 text-muted-foreground">
                    {analyticsSummary.weakestTopic
                      ? `${analyticsSummary.weakestTopic.topic_name} / ${formatPercent(
                          analyticsSummary.weakestTopic.accuracy,
                        )}`
                      : "Not enough data yet."}
                  </p>
                </div>
              </div>

              <div className="rounded-md bg-muted px-3 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className="size-4 text-destructive"
                    aria-hidden="true"
                  />
                  <p className="font-medium">Top weak areas</p>
                </div>
                {topWeakAreas.length > 0 ? (
                  <div className="mt-3 grid gap-2">
                    {topWeakAreas.map((area) => (
                      <div
                        key={area.id}
                        className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {area.topicName}
                          </span>
                          <span className="block truncate text-muted-foreground">
                            {area.subjectName}
                          </span>
                        </span>
                        <span className="shrink-0 font-medium text-destructive">
                          {formatPercent(area.accuracy)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-muted-foreground">
                    {hasInsufficientPracticeData
                      ? "Answer more topic-focused questions to unlock weak-area signals."
                      : "No weak topics below 70% right now."}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href="/analytics">View analytics</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/weak-areas">View weak areas</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Mock Exam</CardTitle>
              <CardDescription>
                Timed exam attempts tracked separately from practice drills.
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <ClipboardCheck aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {latestMockAttempt ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-md border px-3 py-3">
                    <p className="text-xl font-semibold">
                      {mockExamTitle ?? "Mock exam"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Latest attempt
                    </p>
                  </div>
                  <div className="rounded-md border px-3 py-3">
                    <p className="text-xl font-semibold">
                      {mockAttemptStatusLabel(latestMockAttempt.status)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">Status</p>
                  </div>
                  <div className="rounded-md border px-3 py-3">
                    <p className="text-xl font-semibold">
                      {latestMockAttempt.score === null
                        ? "Not scored"
                        : `${latestMockAttempt.score}/${latestMockAttempt.total_items}`}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">Score</p>
                  </div>
                  <div className="rounded-md border px-3 py-3">
                    <p className="text-xl font-semibold">
                      {formatPercentage(latestMockAttempt.percentage)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Mock percentage
                    </p>
                  </div>
                </div>

                <div className="rounded-md bg-muted px-3 py-3 text-sm">
                  <p className="font-medium">Latest mock exam</p>
                  <p className="mt-1 text-muted-foreground">
                    {mockExamTitle ?? "Mock exam"} /{" "}
                    {latestMockAttempt.submitted_at
                      ? `Submitted ${new Intl.DateTimeFormat("en", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(latestMockAttempt.submitted_at))}`
                      : `Started ${new Intl.DateTimeFormat("en", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(latestMockAttempt.created_at))}`}
                  </p>
                </div>
              </>
            ) : latestPublishedMockExam ? (
              <div className="rounded-md border px-3 py-3 text-sm">
                <p className="font-medium">{latestPublishedMockExam.title}</p>
                <p className="mt-1 text-muted-foreground">
                  {latestPublishedMockExam.item_count} items /{" "}
                  {latestPublishedMockExam.time_limit_minutes} minutes
                </p>
              </div>
            ) : (
              <div className="rounded-md border px-3 py-3 text-sm text-muted-foreground">
                No published mock exams are available yet.
              </div>
            )}

            <Button asChild className="w-fit">
              <Link href={mockExamHref}>{mockExamAction}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>External Drill Performance</CardTitle>
              <CardDescription>
                Offline drill scores tracked separately from practice accuracy.
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <ClipboardList aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {externalDrillSummary.totalDrills === 0 ? (
              <div className="rounded-md border px-3 py-3 text-sm text-muted-foreground">
                No external drill scores logged yet.
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-md border px-3 py-3">
                    <p className="text-xl font-semibold">
                      {externalDrillSummary.latestDrill
                        ? `${externalDrillSummary.latestDrill.score}/${externalDrillSummary.latestDrill.total_items}`
                        : "N/A"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Latest score
                    </p>
                  </div>
                  <div className="rounded-md border px-3 py-3">
                    <p className="text-xl font-semibold">
                      {formatExternalDrillPercentage(
                        externalDrillSummary.averagePercentage,
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      External average
                    </p>
                  </div>
                  <div className="rounded-md border px-3 py-3">
                    <p className="text-xl font-semibold">
                      {externalDrillSummary.totalDrills}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Drills logged
                    </p>
                  </div>
                  <div className="rounded-md border px-3 py-3">
                    <p className="text-xl font-semibold">
                      {externalDrillSummary.weakestSubject
                        ? externalDrillSummary.weakestSubject.subjectName
                        : "N/A"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Weakest external subject
                    </p>
                  </div>
                </div>

                <div className="rounded-md bg-muted px-3 py-3 text-sm">
                  <p className="font-medium">Latest external drill</p>
                  <p className="mt-1 text-muted-foreground">
                    {externalDrillSummary.latestDrill
                      ? `${externalDrillSummary.latestDrill.drill_title} / ${
                          externalDrillSummary.latestDrill.subjectName
                        } / ${formatExternalDrillPercentage(
                          Number(externalDrillSummary.latestDrill.percentage),
                        )}`
                      : "No external drill logs yet."}
                  </p>
                </div>
              </>
            )}

            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/external-drills/new">Log external drill</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/external-drills">View external drills</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Exam Track Subjects</CardTitle>
              <CardDescription>
                Subject weights are scoped to the current exam track.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {(subjects ?? []).map((subject) => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span>{subject.name}</span>
                  <span className="font-medium text-primary">
                    {subject.board_weight}%
                  </span>
                </div>
              ))}
              {subjects?.length === 0 ? (
                <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                  Subjects will appear after an admin configures this exam
                  track.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy boundary</CardTitle>
              <CardDescription>
                Personal progress is scoped to your account and group.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Study progress is scoped to your account and active group.
              External hardcopy drills stay outside BoardReady PH and are never
              uploaded here.
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
