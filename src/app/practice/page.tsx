import { redirect } from "next/navigation";
import { ListChecks, Play } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PracticeSetupForm } from "@/components/practice/practice-setup-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireMembership } from "@/lib/current-user";
import { practiceModeLabel } from "@/lib/practice";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PracticePageProps = {
  searchParams?: Promise<{
    subject?: string;
    topic?: string;
    difficulty?: string;
    count?: string;
    mode?: string;
  }>;
};

function parseCount(value?: string) {
  const parsed = Number.parseInt(value ?? "10", 10);

  if (Number.isNaN(parsed)) {
    return 10;
  }

  return Math.min(Math.max(parsed, 1), 50);
}

export default async function PracticePage({ searchParams }: PracticePageProps) {
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

  let countQuery = supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .eq("status", "published");

  if (subject) {
    countQuery = countQuery.eq("subject_id", subject);
  }

  if (topic) {
    countQuery = countQuery.eq("topic_id", topic);
  }

  if (difficulty) {
    countQuery = countQuery.eq("difficulty", difficulty);
  }

  const { count: availableCount } = await countQuery;
  const safeAvailableCount = availableCount ?? 0;
  const selectedCount = Math.min(count, Math.max(safeAvailableCount, 1));
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
          <p className="text-sm font-medium uppercase text-primary">Practice</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Start a practice drill
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Practice drills use published questions from your active group and
            exam track only.
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Drill setup</CardTitle>
                <CardDescription>
                  Choose filters, check availability, then start.
                </CardDescription>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <Play aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <PracticeSetupForm
                subjects={subjects ?? []}
                topics={topics ?? []}
                availableCount={safeAvailableCount}
                defaults={{
                  subject,
                  topic,
                  difficulty,
                  count: selectedCount,
                  mode,
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Availability</CardTitle>
              <CardDescription>
                {practiceModeLabel(mode)} / requested {count} item
                {count === 1 ? "" : "s"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-md border px-3 py-3">
                <ListChecks className="size-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-2xl font-semibold">{safeAvailableCount}</p>
                  <p className="text-sm text-muted-foreground">
                    Published questions match these filters.
                  </p>
                </div>
              </div>
              {safeAvailableCount === 0 ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  No published questions match this setup yet.
                </p>
              ) : null}
              {safeAvailableCount > 0 && count > safeAvailableCount ? (
                <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                  This drill will use {safeAvailableCount} item
                  {safeAvailableCount === 1 ? "" : "s"} because fewer questions
                  are available than requested.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
