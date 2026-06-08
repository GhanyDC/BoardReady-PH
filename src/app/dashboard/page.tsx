import {
  BarChart3,
  Clock3,
  ListChecks,
  Target,
  TrendingUp,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireMembership } from "@/lib/current-user";
import { formatRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const metricCards = [
  {
    title: "Readiness",
    value: "0%",
    helper: "Baseline starts after the first mock exam.",
    icon: TrendingUp,
  },
  {
    title: "Study time",
    value: "0h",
    helper: "Timer and logs arrive in Sprint 2.",
    icon: Clock3,
  },
  {
    title: "Weak areas",
    value: "Pending",
    helper: "Missed-question patterns will appear here.",
    icon: Target,
  },
  {
    title: "Next task",
    value: "Onboarded",
    helper: "Question drills unlock after the bank is published.",
    icon: ListChecks,
  },
];

export default async function DashboardPage() {
  const context = await requireMembership();
  const userName =
    context.profile?.full_name ?? context.user.email ?? "BoardReady PH reviewer";
  const supabase = await createClient();
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, board_weight")
    .eq("group_id", context.membership.group.id)
    .eq("exam_program_id", context.membership.examProgram.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <AppShell
      userName={userName}
      role={context.membership.role}
      groupName={context.membership.group.name}
      examProgramName={context.membership.examProgram.name}
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
                {context.membership.examProgram.name}
              </p>
              <p>
                <span className="font-medium text-foreground">Group:</span>{" "}
                {context.membership.group.name}
              </p>
              <p>
                <span className="font-medium text-foreground">Role:</span>{" "}
                {formatRole(context.membership.role)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">
            <BarChart3 className="size-4 text-primary" aria-hidden="true" />
            Sprint 1 foundation
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
