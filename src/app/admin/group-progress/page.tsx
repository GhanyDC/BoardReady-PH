import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  ListChecks,
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
import { requireAdminContext } from "@/lib/admin-auth";
import { formatPercent } from "@/lib/analytics";
import {
  getAdminGroupAnalytics,
  type AdminReviewerSummary,
  type GroupWeakSignal,
} from "@/lib/group-analytics";
import { formatDateTime } from "@/lib/questions";
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

function formatScore(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }

  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function formatDate(value: string | null) {
  return value ? formatDateTime(value) : "No activity";
}

function activityBadge(reviewer: AdminReviewerSummary) {
  if (reviewer.inactiveThisWeek) {
    return <Badge variant="outline">Inactive this week</Badge>;
  }

  if (reviewer.belowMinimumActivityThreshold) {
    return <Badge variant="secondary">Light activity</Badge>;
  }

  return <Badge variant="success">Active</Badge>;
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
              {signal.count} active weak signal{signal.count === 1 ? "" : "s"}
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

export default async function AdminGroupProgressPage() {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const analytics = await getAdminGroupAnalytics(supabase, {
    groupId: context.activeGroup.id,
    examProgramId: context.activeExamProgram.id,
  });
  const userName =
    context.profile?.full_name ?? context.user.email ?? "BoardReady PH admin";
  const summaryCards = [
    {
      title: "Reviewers",
      value: formatNumber(analytics.reviewerCount),
      helper: `${formatNumber(analytics.activeReviewersThisWeek)} active this week`,
      icon: Users,
    },
    {
      title: "Study time",
      value: formatMinutes(analytics.totalStudyMinutesThisWeek),
      helper: `${formatMinutes(
        analytics.averageStudyMinutesPerActiveReviewer,
      )} average active reviewer`,
      icon: Timer,
    },
    {
      title: "Practice answers",
      value: formatNumber(analytics.totalQuestionsAnsweredThisWeek),
      helper: `${formatPercent(analytics.averagePracticeAccuracy)} average accuracy`,
      icon: BarChart3,
    },
    {
      title: "Mock exams",
      value: formatNumber(analytics.mockExamsCompletedThisWeek),
      helper: "Submitted this week",
      icon: ClipboardCheck,
    },
    {
      title: "Readiness estimate",
      value: formatScore(analytics.averageLatestReadinessScore),
      helper: "Average latest reviewer snapshot",
      icon: ListChecks,
    },
    {
      title: "External drills",
      value: formatNumber(analytics.externalDrillsLoggedThisWeek),
      helper: "Logs this week, without private notes",
      icon: ClipboardList,
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
              Admin / Group Progress
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Group progress dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Admin-only progress view for {context.activeGroup.name}. Metrics
              are scoped to the active group and exam program.
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
              <CardTitle>Group weak subjects</CardTitle>
              <CardDescription>
                Aggregated active weak-area signals across reviewers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeakSignalList
                emptyText="No group weak subject signals are available yet."
                signals={analytics.topWeakSubjects}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Group weak topics</CardTitle>
              <CardDescription>
                Aggregated topic-level signals for planning review sessions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeakSignalList
                emptyText="No group weak topic signals are available yet."
                signals={analytics.topWeakTopics}
              />
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Reviewer progress</CardTitle>
              <CardDescription>
                User-level admin view. Drill notes, missed-question details,
                and private study notes are not included.
              </CardDescription>
            </div>
            <AlertTriangle className="size-5 text-primary" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            {analytics.reviewerSummaries.length === 0 ? (
              <p className="rounded-md border px-3 py-3 text-sm text-muted-foreground">
                No reviewers are assigned to this group yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-3 pr-4 font-medium">Reviewer</th>
                      <th className="py-3 pr-4 font-medium">Study</th>
                      <th className="py-3 pr-4 font-medium">Questions</th>
                      <th className="py-3 pr-4 font-medium">Latest mock</th>
                      <th className="py-3 pr-4 font-medium">Readiness</th>
                      <th className="py-3 pr-4 font-medium">Last activity</th>
                      <th className="py-3 pr-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.reviewerSummaries.map((reviewer) => (
                      <tr
                        key={reviewer.userId}
                        className="border-b last:border-b-0"
                      >
                        <td className="py-3 pr-4 font-medium">
                          {reviewer.displayName}
                        </td>
                        <td className="py-3 pr-4">
                          {formatMinutes(reviewer.studyMinutesThisWeek)}
                        </td>
                        <td className="py-3 pr-4">
                          {formatNumber(reviewer.questionsAnsweredThisWeek)}
                        </td>
                        <td className="py-3 pr-4">
                          {formatScore(reviewer.latestMockPercentage)}
                        </td>
                        <td className="py-3 pr-4">
                          {formatScore(reviewer.latestReadinessEstimate)}
                        </td>
                        <td className="py-3 pr-4">
                          {formatDate(reviewer.lastActivityAt)}
                        </td>
                        <td className="py-3 pr-4">
                          {activityBadge(reviewer)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Inactive this week</CardTitle>
              <CardDescription>
                Reviewers without saved activity in the current calendar week.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {analytics.inactiveReviewers.length === 0 ? (
                <p className="rounded-md border px-3 py-3 text-sm text-muted-foreground">
                  No inactive reviewers for this week.
                </p>
              ) : (
                analytics.inactiveReviewers.map((reviewer) => (
                  <div
                    key={reviewer.userId}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{reviewer.displayName}</span>
                    <span className="text-muted-foreground">
                      {formatDate(reviewer.lastActivityAt)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Light activity</CardTitle>
              <CardDescription>
                Reviewers below weekly study and practice thresholds.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {analytics.belowMinimumActivityReviewers.length === 0 ? (
                <p className="rounded-md border px-3 py-3 text-sm text-muted-foreground">
                  No light-activity reviewers for this week.
                </p>
              ) : (
                analytics.belowMinimumActivityReviewers.map((reviewer) => (
                  <div
                    key={reviewer.userId}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{reviewer.displayName}</span>
                    <span className="text-muted-foreground">
                      {formatMinutes(reviewer.studyMinutesThisWeek)} /{" "}
                      {formatNumber(reviewer.questionsAnsweredThisWeek)} answers
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
