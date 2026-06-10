import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  ListChecks,
  ShieldCheck,
  Target,
  Timer,
  Users,
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
import { formatPercent } from "@/lib/analytics";
import { requireMembership } from "@/lib/current-user";
import {
  getReviewerSafeGroupProgressForRange,
  getReviewerSafeGroupProgress,
  type GroupWeakSignal,
} from "@/lib/group-analytics";
import {
  formatGoalDate,
  formatGroupGoalValue,
  groupGoalMetricValue,
  groupGoalProgressPercent,
  groupGoalTypeLabel,
  type GroupGoal,
} from "@/lib/group-goals";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(Math.round(value));
}

function formatMinutes(value: number) {
  if (value < 60) {
    return `${formatNumber(value)}m`;
  }

  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function formatWeekRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  });
  const startDate = formatter.format(new Date(start));
  const endDate = formatter.format(new Date(new Date(end).getTime() - 1));

  return `${startDate} - ${endDate}`;
}

function formatScore(value: number | null) {
  return value === null ? "N/A" : formatPercent(value);
}

function WeakSignalList({
  emptyText,
  signals,
}: {
  emptyText: string;
  signals: GroupWeakSignal[];
}) {
  if (signals.length === 0) {
    return (
      <p className="rounded-md border px-3 py-3 text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {signals.map((signal) => (
        <div
          key={signal.id}
          className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
        >
          <span className="min-w-0">
            <span className="block truncate font-medium">{signal.name}</span>
            <span className="block text-muted-foreground">
              {signal.count} group weak signal{signal.count === 1 ? "" : "s"}
            </span>
          </span>
          <span className="shrink-0 font-medium">
            {formatScore(signal.averageAccuracy)}
          </span>
        </div>
      ))}
    </div>
  );
}

function GoalProgress({
  goal,
  value,
}: {
  goal: GroupGoal;
  value: number | null;
}) {
  const percent = groupGoalProgressPercent(goal, value);

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{goal.title}</span>
        <Badge variant="secondary">{groupGoalTypeLabel(goal.goal_type)}</Badge>
      </div>
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {formatGoalDate(goal.start_date)} - {formatGoalDate(goal.end_date)}
        </span>
        <span>
          {formatGroupGoalValue(goal.goal_type, value)} /{" "}
          {formatGroupGoalValue(goal.goal_type, goal.target_value)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted" aria-hidden="true">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${percent ?? 0}%` }}
        />
      </div>
      {goal.description ? (
        <p className="text-sm text-muted-foreground">{goal.description}</p>
      ) : null}
      {percent === null ? (
        <p className="text-sm text-muted-foreground">
          This custom checkpoint is tracked manually by the admin.
        </p>
      ) : null}
    </div>
  );
}

export default async function GroupProgressPage() {
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const groupContext = {
    groupId: context.activeGroup.id,
    examProgramId: context.activeExamProgram.id,
  };
  const [progress, { data: activeGoals }] = await Promise.all([
    getReviewerSafeGroupProgress(supabase, groupContext),
    supabase
      .from("group_goals")
      .select("*")
      .eq("group_id", context.activeGroup.id)
      .eq("exam_program_id", context.activeExamProgram.id)
      .eq("status", "active")
      .order("end_date", { ascending: true })
      .limit(6),
  ]);
  const goalRows = activeGoals ?? [];
  const goalProgressEntries = await Promise.all(
    goalRows.map(async (goal) => {
      const goalProgress = await getReviewerSafeGroupProgressForRange(
        supabase,
        groupContext,
        goal.start_date,
        goal.end_date,
      );

      return [
        goal.id,
        groupGoalMetricValue(goal.goal_type, goalProgress),
      ] as const;
    }),
  );
  const progressByGoalId = new Map(goalProgressEntries);
  const userName =
    context.profile?.full_name ?? context.user.email ?? "BoardReady PH reviewer";
  const summaryCards = [
    {
      title: "Reviewers active",
      value: `${formatNumber(progress.activeReviewersThisWeek)}/${formatNumber(
        progress.reviewerCount,
      )}`,
      helper: "With saved activity this week",
      icon: Users,
    },
    {
      title: "Study time",
      value: formatMinutes(progress.totalStudyMinutesThisWeek),
      helper: "Total group study minutes",
      icon: Timer,
    },
    {
      title: "Practice answers",
      value: formatNumber(progress.totalQuestionsAnsweredThisWeek),
      helper: `${formatScore(progress.averagePracticeAccuracy)} group accuracy`,
      icon: Target,
    },
    {
      title: "Mock exams",
      value: formatNumber(progress.mockExamsCompletedThisWeek),
      helper: "Submitted this week",
      icon: ClipboardCheck,
    },
    {
      title: "External drills",
      value: formatNumber(progress.externalDrillsLoggedThisWeek),
      helper: "Logged this week",
      icon: ClipboardList,
    },
    {
      title: "Active days",
      value: formatNumber(progress.activeDaysThisWeek),
      helper: "Days with group activity",
      icon: CalendarDays,
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
              Group Progress
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Weekly group progress
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Aggregate activity for {context.activeGroup.name} during{" "}
              {formatWeekRange(progress.weekStart, progress.weekEnd)}.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/readiness">
              <ListChecks aria-hidden="true" />
              My readiness
            </Link>
          </Button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.helper}</CardDescription>
                  </div>
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{card.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Shared weak subjects</CardTitle>
              <CardDescription>
                Aggregate subject signals for planning group review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeakSignalList
                emptyText="No shared weak subject signals are available yet."
                signals={progress.topWeakSubjects}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shared weak topics</CardTitle>
              <CardDescription>
                Aggregate topic signals without individual rankings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeakSignalList
                emptyText="No shared weak topic signals are available yet."
                signals={progress.topWeakTopics}
              />
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Active group goals</CardTitle>
            <CardDescription>
              Shared targets set by admins for aggregate group activity.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {goalRows.length === 0 ? (
              <p className="rounded-md border px-3 py-3 text-sm text-muted-foreground">
                No active group goals have been published yet.
              </p>
            ) : (
              goalRows.map((goal) => (
                <div key={goal.id} className="rounded-md border px-3 py-3">
                  <GoalProgress
                    goal={goal}
                    value={progressByGoalId.get(goal.id) ?? null}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Privacy boundary</CardTitle>
              <CardDescription>
                This page shows group totals only.
              </CardDescription>
            </div>
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
          </CardHeader>
          <CardContent className="grid gap-4 text-sm leading-6 text-muted-foreground">
            <p>
              Reviewer progress here is aggregate-only. It does not show
              individual readiness scores, study logs, external drill notes,
              missed-question details, low performers, or weakest reviewers.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/study-timer">Log study time</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/practice">Practice questions</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/external-drills/new">Log external drill</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to use this</CardTitle>
            <CardDescription>
              Positive accountability for the current group.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
            <p className="rounded-md border px-3 py-3">
              Use active days to spot whether the group is keeping a steady
              rhythm.
            </p>
            <p className="rounded-md border px-3 py-3">
              Use shared weak topics to choose review sessions that help more
              people.
            </p>
            <p className="rounded-md border px-3 py-3">
              Use your personal readiness page for your own score and study
              recommendations.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
