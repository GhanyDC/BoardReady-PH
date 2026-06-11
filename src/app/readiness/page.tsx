import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  ListChecks,
  RotateCcw,
  ShieldCheck,
  Target,
  Timer,
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
import { requireMembership } from "@/lib/current-user";
import {
  getStudyRecommendations,
  recommendationPriorityLabel,
  type StudyRecommendationPriority,
} from "@/lib/readiness-recommendations";
import {
  calculateReadinessAssessment,
  readinessDisclaimer,
  saveReadinessSnapshot,
  type ReadinessLabel,
  type SubjectReadinessPriority,
} from "@/lib/readiness";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/types";

export const dynamic = "force-dynamic";

const improvementLinks = [
  {
    href: "/practice",
    label: "Practice",
    icon: Target,
  },
  {
    href: "/mock-exams",
    label: "Mock Exams",
    icon: ClipboardCheck,
  },
  {
    href: "/weak-areas",
    label: "Weak Areas",
    icon: AlertTriangle,
  },
  {
    href: "/study-timer",
    label: "Study Timer",
    icon: Timer,
  },
  {
    href: "/external-drills",
    label: "External Drills",
    icon: ClipboardList,
  },
];

function scoreText(value: number | null) {
  if (value === null) {
    return "Not enough data yet";
  }

  return `${value.toFixed(1)}%`;
}

function labelBadgeVariant(label: ReadinessLabel) {
  if (label === "strong" || label === "board_ready") {
    return "success" as const;
  }

  if (label === "high_risk") {
    return "outline" as const;
  }

  return "secondary" as const;
}

function priorityLabel(priority: SubjectReadinessPriority) {
  const labels: Record<SubjectReadinessPriority, string> = {
    urgent: "Urgent",
    high: "High",
    medium: "Medium",
    maintenance: "Maintenance",
  };

  return labels[priority];
}

function priorityBadgeVariant(priority: SubjectReadinessPriority) {
  if (priority === "maintenance") {
    return "success" as const;
  }

  if (priority === "urgent") {
    return "outline" as const;
  }

  return "secondary" as const;
}

function recommendationBadgeVariant(priority: StudyRecommendationPriority) {
  if (priority === "low") {
    return "outline" as const;
  }

  if (priority === "urgent") {
    return "default" as const;
  }

  return "secondary" as const;
}

export default async function ReadinessPage() {
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const assessment = await calculateReadinessAssessment(supabase, {
    userId: context.user.id,
    groupId: context.activeGroup.id,
    examProgramId: context.activeExamProgram.id,
  });
  const recommendations = getStudyRecommendations(assessment);
  const assessmentWithRecommendations = {
    ...assessment,
    recommendationSummary: recommendations as unknown as Json,
  };
  const { error: snapshotError } = await saveReadinessSnapshot(
    supabase,
    assessmentWithRecommendations,
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
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-primary">
              Readiness
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Board readiness estimate
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {readinessDisclaimer}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            Internal study estimate
          </div>
        </section>

        {snapshotError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Snapshot could not be saved: {snapshotError.message}
          </p>
        ) : null}

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Overall readiness</CardTitle>
              <CardDescription>
                Calculated{" "}
                {new Intl.DateTimeFormat("en", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(assessment.calculatedAt))}
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <BarChart3 aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-5xl font-semibold tracking-normal">
                  {assessment.overallReadiness.toFixed(1)}%
                </p>
                <div className="mt-3">
                  <Badge variant={labelBadgeVariant(assessment.label)}>
                    {assessment.labelText}
                  </Badge>
                </div>
              </div>
              <Button asChild variant="outline">
                <Link href="/readiness">
                  <RotateCcw aria-hidden="true" />
                  Recalculate
                </Link>
              </Button>
            </div>

            <div className="h-3 rounded-full bg-muted" aria-hidden="true">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${assessment.overallReadiness}%` }}
              />
            </div>

            {assessment.warnings.length > 0 ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                <p className="font-medium">Insufficient data warnings</p>
                <ul className="mt-2 grid gap-1">
                  {assessment.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {assessment.components.map((component) => (
            <Card key={component.key}>
              <CardHeader>
                <CardTitle className="text-base">{component.label}</CardTitle>
                <CardDescription>
                  {(component.weight * 100).toFixed(0)}% weight
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="text-2xl font-semibold">
                  {scoreText(component.score)}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {component.detail}
                </p>
                <div className="h-2 rounded-full bg-muted" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${component.score ?? 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader>
            <div className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Rule-based study recommendations</CardTitle>
                <CardDescription>
                  Generated from your readiness signals. No AI is used.
                </CardDescription>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <ListChecks aria-hidden="true" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="flex flex-col gap-3 rounded-md border px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{recommendation.title}</p>
                    <Badge
                      variant={recommendationBadgeVariant(
                        recommendation.priority,
                      )}
                    >
                      {recommendationPriorityLabel(recommendation.priority)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {recommendation.detail}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={recommendation.href}>Open</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Improve this estimate</CardTitle>
            <CardDescription>
              These links lead to the modules that feed the readiness score.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {improvementLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Button key={item.href} asChild variant="outline">
                  <Link href={item.href}>
                    <Icon aria-hidden="true" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject readiness breakdown</CardTitle>
            <CardDescription>
              Subject estimates use database weights and stay scoped to your
              active group and exam program.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-muted text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">Subject</th>
                    <th className="px-3 py-2 font-medium">Weight</th>
                    <th className="px-3 py-2 font-medium">Practice</th>
                    <th className="px-3 py-2 font-medium">Mock</th>
                    <th className="px-3 py-2 font-medium">Weak topics</th>
                    <th className="px-3 py-2 font-medium">External</th>
                    <th className="px-3 py-2 font-medium">Estimate</th>
                    <th className="px-3 py-2 font-medium">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {assessment.subjectBreakdown.map((subject) => (
                    <tr key={subject.subjectId} className="border-t align-top">
                      <td className="px-3 py-2">
                        <p className="font-medium">{subject.subjectName}</p>
                        {subject.insufficientData ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Insufficient data
                          </p>
                        ) : null}
                        {subject.notes.length > 0 ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {subject.notes[0]}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">{subject.subjectWeight}%</td>
                      <td className="px-3 py-2">
                        <p>{scoreText(subject.practiceAccuracy)}</p>
                        <p className="text-xs text-muted-foreground">
                          {subject.practiceAttemptCount} attempts
                        </p>
                      </td>
                      <td className="px-3 py-2">
                        <p>{scoreText(subject.mockExamAccuracy)}</p>
                        <p className="text-xs text-muted-foreground">
                          {subject.mockExamItemCount} items
                        </p>
                      </td>
                      <td className="px-3 py-2">
                        <p>{subject.weakTopicCount}</p>
                        <p className="text-xs text-muted-foreground">
                          {subject.criticalWeakTopicCount} critical /{" "}
                          {subject.highWeakTopicCount} high
                        </p>
                      </td>
                      <td className="px-3 py-2">
                        <p>{scoreText(subject.externalDrillAverage)}</p>
                        <p className="text-xs text-muted-foreground">
                          {subject.externalDrillCount} logs
                        </p>
                      </td>
                      <td className="px-3 py-2">
                        {scoreText(subject.readinessEstimate)}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={priorityBadgeVariant(subject.priority)}>
                          {priorityLabel(subject.priority)}
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
