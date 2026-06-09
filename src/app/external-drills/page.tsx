import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, Eye, Plus, SquarePen } from "lucide-react";

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
import {
  externalDrillCategoryByValue,
  externalDrillPerformanceCategories,
  externalDrillPerformanceCategory,
  formatExternalDrillPercentage,
  previewExternalDrillText,
} from "@/lib/external-drills";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ExternalDrillsPageProps = {
  searchParams?: Promise<{
    created?: string;
    deleted?: string;
    error?: string;
    from?: string;
    to?: string;
    subject?: string;
    topic?: string;
    performance?: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00.000`));
}

export default async function ExternalDrillsPage({
  searchParams,
}: ExternalDrillsPageProps) {
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const from = params?.from ?? "";
  const to = params?.to ?? "";
  const subject = params?.subject ?? "";
  const topic = params?.topic ?? "";
  const performance = params?.performance ?? "";
  const performanceCategory = externalDrillCategoryByValue(performance);
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

  let query = supabase
    .from("external_drill_logs")
    .select(
      "id, subject_id, topic_id, drill_title, source_label, total_items, score, percentage, mistake_notes, weak_topic_notes, date_taken",
    )
    .eq("user_id", context.user.id)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .order("date_taken", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (from) {
    query = query.gte("date_taken", from);
  }

  if (to) {
    query = query.lte("date_taken", to);
  }

  if (subject) {
    query = query.eq("subject_id", subject);
  }

  if (topic) {
    query = query.eq("topic_id", topic);
  }

  if (performanceCategory) {
    query = query.gte("percentage", performanceCategory.minInclusive);

    if (performanceCategory.maxExclusive !== null) {
      query = query.lt("percentage", performanceCategory.maxExclusive);
    }
  }

  const { data: logs } = await query;
  const visibleLogs = logs ?? [];
  const subjectNameById = new Map(
    (subjects ?? []).map((subjectItem) => [subjectItem.id, subjectItem.name]),
  );
  const topicNameById = new Map(
    (topics ?? []).map((topicItem) => [topicItem.id, topicItem.name]),
  );
  const filteredTopics = subject
    ? (topics ?? []).filter((topicItem) => topicItem.subject_id === subject)
    : topics ?? [];
  const averagePercentage =
    visibleLogs.length > 0
      ? visibleLogs.reduce(
          (total, log) => total + Number(log.percentage ?? 0),
          0,
        ) / visibleLogs.length
      : null;
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
              External Drills
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Offline drill history
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Scores are separate from BoardReady PH practice accuracy and are
              scoped to your active group and exam track.
            </p>
          </div>
          <Button asChild>
            <Link href="/external-drills/new">
              <Plus aria-hidden="true" />
              Log external drill
            </Link>
          </Button>
        </section>

        {params?.created === "1" ? (
          <p className="rounded-md border border-emerald-600/30 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            External drill log saved.
          </p>
        ) : null}

        {params?.deleted === "1" ? (
          <p className="rounded-md border border-emerald-600/30 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            External drill log deleted.
          </p>
        ) : null}

        {params?.error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            The requested external drill action could not be completed.
          </p>
        ) : null}

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Showing {visibleLogs.length} log
                {visibleLogs.length === 1 ? "" : "s"}
                {averagePercentage === null
                  ? "."
                  : ` / average ${formatExternalDrillPercentage(
                      averagePercentage,
                    )}.`}
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <ClipboardList aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="from">From</Label>
                <Input id="from" name="from" type="date" defaultValue={from} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="to">To</Label>
                <Input id="to" name="to" type="date" defaultValue={to} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="performance">Performance</Label>
                <select
                  id="performance"
                  name="performance"
                  defaultValue={performance}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="">All performance</option>
                  {externalDrillPerformanceCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label} ({category.description})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject</Label>
                <select
                  id="subject"
                  name="subject"
                  defaultValue={subject}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="">All topics</option>
                  {filteredTopics.map((topicItem) => (
                    <option key={topicItem.id} value={topicItem.id}>
                      {topicItem.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="md:self-end">
                Apply filters
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4">
          {visibleLogs.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No external drill logs found</CardTitle>
                <CardDescription>
                  Log an offline drill score and it will appear here.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {visibleLogs.map((log) => {
            const category = externalDrillPerformanceCategory(
              Number(log.percentage),
            );

            return (
              <Card key={log.id}>
                <CardContent className="grid gap-4 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(log.date_taken)} /{" "}
                        {subjectNameById.get(log.subject_id) ?? "Subject"}
                        {log.topic_id
                          ? ` / ${topicNameById.get(log.topic_id) ?? "Topic"}`
                          : ""}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold">
                        {log.drill_title}
                      </h2>
                      {log.source_label ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {log.source_label}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="outline" className={category.badgeClassName}>
                      {category.label}
                    </Badge>
                  </div>

                  <div className="grid gap-3 text-sm md:grid-cols-3">
                    <div className="rounded-md border px-3 py-2">
                      <p className="text-muted-foreground">Score</p>
                      <p className="font-semibold">
                        {log.score} / {log.total_items}
                      </p>
                    </div>
                    <div className="rounded-md border px-3 py-2">
                      <p className="text-muted-foreground">Percentage</p>
                      <p className="font-semibold">
                        {formatExternalDrillPercentage(Number(log.percentage))}
                      </p>
                    </div>
                    <div className="rounded-md border px-3 py-2">
                      <p className="text-muted-foreground">Weak topics</p>
                      <p className="font-semibold">
                        {previewExternalDrillText(log.weak_topic_notes, 80)}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-muted-foreground">
                    {previewExternalDrillText(log.mistake_notes)}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/external-drills/${log.id}`}>
                        <Eye aria-hidden="true" />
                        View
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/external-drills/${log.id}/edit`}>
                        <SquarePen aria-hidden="true" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
