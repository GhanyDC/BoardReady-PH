import {
  BarChart3,
  CalendarDays,
  Clock3,
  ListChecks,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/current-user";
import { formatRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import {
  activityLabel,
  formatDuration,
  studyStyleLabel,
} from "@/lib/study";

export const dynamic = "force-dynamic";

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

  const [
    { data: subjects },
    { data: preferences },
    { data: weekSessions },
    { data: latestSession },
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
              External hardcopy drills stay outside BoardReady PH. Sprint 1
              only prepares secure account, role, group, exam track, subject,
              and topic foundations.
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
