import Link from "next/link";
import { CalendarDays, Flag, PlusCircle, Target } from "lucide-react";

import {
  createGroupGoalAction,
  updateGroupGoalStatusAction,
} from "@/app/admin/group-goals/actions";
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
import { requireAdminContext } from "@/lib/admin-auth";
import { getReviewerSafeGroupProgressForRange } from "@/lib/group-analytics";
import {
  formatGoalDate,
  formatGroupGoalValue,
  groupGoalMetricValue,
  groupGoalProgressPercent,
  groupGoalStatusBadgeVariant,
  groupGoalStatusLabel,
  groupGoalStatuses,
  groupGoalTypeLabel,
  groupGoalTypes,
  type GroupGoal,
} from "@/lib/group-goals";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

const textareaClassName =
  "min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function nextWeekIsoDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);

  return date.toISOString().slice(0, 10);
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
        <span className="text-muted-foreground">Progress</span>
        <span className="font-medium">
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
      <p className="text-sm text-muted-foreground">
        {percent === null
          ? "Custom goals are tracked manually by the admin."
          : `${percent}% of target for this goal window.`}
      </p>
    </div>
  );
}

export default async function AdminGroupGoalsPage() {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const { data: goals, error } = await supabase
    .from("group_goals")
    .select("*")
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .order("end_date", { ascending: true })
    .order("created_at", { ascending: false });
  const goalRows = goals ?? [];
  const progressEntries = await Promise.all(
    goalRows.map(async (goal) => {
      const progress = await getReviewerSafeGroupProgressForRange(
        supabase,
        {
          groupId: context.activeGroup.id,
          examProgramId: context.activeExamProgram.id,
        },
        goal.start_date,
        goal.end_date,
      );

      return [
        goal.id,
        groupGoalMetricValue(goal.goal_type, progress),
      ] as const;
    }),
  );
  const progressByGoalId = new Map(progressEntries);
  const userName =
    context.profile?.full_name ?? context.user.email ?? "BoardReady PH admin";

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
              Admin / Group Goals
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Group goals
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Create aggregate goals for {context.activeGroup.name}. Active
              goals are visible to reviewers on group progress.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/group-progress">
              <Target aria-hidden="true" />
              View group progress
            </Link>
          </Button>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Create goal</CardTitle>
              <CardDescription>
                Built-in goal types calculate progress from group aggregate
                activity.
              </CardDescription>
            </div>
            <PlusCircle className="size-5 text-primary" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <form action={createGroupGoalAction} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    minLength={2}
                    maxLength={180}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="goalType">Goal type</Label>
                  <select
                    id="goalType"
                    name="goalType"
                    className={selectClassName}
                    defaultValue="study_minutes"
                    required
                  >
                    {groupGoalTypes.map((goalType) => (
                      <option key={goalType.value} value={goalType.value}>
                        {goalType.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  maxLength={2000}
                  className={textareaClassName}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="grid gap-2">
                  <Label htmlFor="targetValue">Target value</Label>
                  <Input
                    id="targetValue"
                    name="targetValue"
                    type="number"
                    min={1}
                    max={100000}
                    defaultValue={300}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={todayIsoDate()}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={nextWeekIsoDate()}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    className={selectClassName}
                    defaultValue="active"
                    required
                  >
                    {groupGoalStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-fit">
                Create group goal
              </Button>
            </form>
          </CardContent>
        </Card>

        {error ? (
          <Card>
            <CardHeader>
              <CardTitle>Goals could not be loaded</CardTitle>
              <CardDescription>
                Try again after refreshing the page.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <section className="grid gap-4">
          {goalRows.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No group goals yet</CardTitle>
                <CardDescription>
                  Create a goal to make it visible on group progress.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {goalRows.map((goal) => (
            <Card key={goal.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={groupGoalStatusBadgeVariant(goal.status)}>
                      {groupGoalStatusLabel(goal.status)}
                    </Badge>
                    <Badge variant="secondary">
                      {groupGoalTypeLabel(goal.goal_type)}
                    </Badge>
                  </div>
                  <CardTitle>{goal.title}</CardTitle>
                  <CardDescription>
                    {formatGoalDate(goal.start_date)} -{" "}
                    {formatGoalDate(goal.end_date)}
                  </CardDescription>
                </div>
                <Flag className="size-5 text-primary" aria-hidden="true" />
              </CardHeader>
              <CardContent className="grid gap-4">
                {goal.description ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {goal.description}
                  </p>
                ) : null}

                <GoalProgress
                  goal={goal}
                  value={progressByGoalId.get(goal.id) ?? null}
                />

                <div className="flex flex-col gap-3 rounded-md border px-3 py-3 text-sm md:flex-row md:items-end md:justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="size-4" aria-hidden="true" />
                    <span>
                      Target {formatGroupGoalValue(
                        goal.goal_type,
                        goal.target_value,
                      )}
                    </span>
                  </div>
                  <form
                    action={updateGroupGoalStatusAction}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <input type="hidden" name="goalId" value={goal.id} />
                    <Label htmlFor={`status-${goal.id}`} className="sr-only">
                      Status
                    </Label>
                    <select
                      id={`status-${goal.id}`}
                      name="status"
                      className={selectClassName}
                      defaultValue={goal.status}
                    >
                      {groupGoalStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" size="sm">
                      Update status
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
