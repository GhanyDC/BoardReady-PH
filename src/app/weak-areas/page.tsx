import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Filter,
  RotateCcw,
  Search,
  Target,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatAverageConfidence,
  formatPercent,
  getPerformanceAnalytics,
  getWeakAreas,
  isWeakPriority,
  minimumWeakAreaAttempts,
  priorityLabel,
  summarizePerformance,
  type WeakAreaWithNames,
} from "@/lib/analytics";
import { requireMembership } from "@/lib/current-user";
import { formatDateTime } from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type WeakAreasPageProps = {
  searchParams?: Promise<{
    subject?: string;
    priority?: string;
    minAttempts?: string;
    q?: string;
  }>;
};

function parseMinimumAttempts(value?: string) {
  const parsed = Number.parseInt(value ?? `${minimumWeakAreaAttempts}`, 10);

  if (Number.isNaN(parsed)) {
    return minimumWeakAreaAttempts;
  }

  return Math.min(Math.max(parsed, 1), 100);
}

function priorityClassName(priority: string) {
  if (priority === "critical") {
    return "border-transparent bg-red-600 text-white";
  }

  if (priority === "high") {
    return "border-transparent bg-orange-600 text-white";
  }

  if (priority === "medium") {
    return "border-transparent bg-amber-500 text-black";
  }

  if (priority === "watchlist") {
    return "border-transparent bg-sky-600 text-white";
  }

  return "border-transparent bg-emerald-600 text-white";
}

function matchesFilters(
  area: WeakAreaWithNames,
  filters: {
    subject: string;
    priority: string;
    minimumAttempts: number;
    search: string;
  },
) {
  const normalizedSearch = filters.search.toLowerCase();

  return (
    (!filters.subject || area.subject_id === filters.subject) &&
    (!filters.priority || area.priority === filters.priority) &&
    area.total_attempts >= filters.minimumAttempts &&
    (!normalizedSearch ||
      area.topicName.toLowerCase().includes(normalizedSearch) ||
      area.subjectName.toLowerCase().includes(normalizedSearch))
  );
}

function practiceHref(area: WeakAreaWithNames) {
  const params = new URLSearchParams({
    subject: area.subject_id,
    topic: area.topic_id,
    mode: "topic_drill",
    count: "10",
  });

  return `/practice?${params.toString()}`;
}

function missedHref(area: WeakAreaWithNames) {
  const params = new URLSearchParams({
    subject: area.subject_id,
    topic: area.topic_id,
  });

  return `/missed-questions?${params.toString()}`;
}

export default async function WeakAreasPage({
  searchParams,
}: WeakAreasPageProps) {
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const subject = params?.subject ?? "";
  const priority = params?.priority ?? "";
  const minimumAttempts = parseMinimumAttempts(params?.minAttempts);
  const search = params?.q?.trim() ?? "";
  const supabase = await createClient();
  const analyticsContext = {
    userId: context.user.id,
    groupId: context.activeGroup.id,
    examProgramId: context.activeExamProgram.id,
  };
  const [
    { data: subjects },
    weakAreasResult,
    performanceResult,
  ] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name")
      .eq("group_id", context.activeGroup.id)
      .eq("exam_program_id", context.activeExamProgram.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    getWeakAreas(supabase, analyticsContext),
    getPerformanceAnalytics(supabase, analyticsContext),
  ]);
  const summary = summarizePerformance(
    performanceResult.subjects,
    performanceResult.topics,
  );
  const weakAreas = weakAreasResult.data;
  const filteredAreas = weakAreas.filter((area) =>
    matchesFilters(area, { subject, priority, minimumAttempts, search }),
  );
  const weakOnlyCount = weakAreas.filter((area) =>
    isWeakPriority(area.priority),
  ).length;
  const watchlistCount = weakAreas.filter(
    (area) => area.priority === "watchlist",
  ).length;
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
            Weak Areas
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Topic focus list
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Based on published-question attempts in your active group and exam
            track.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Weak topics</CardTitle>
                <CardDescription>Accuracy below 70%</CardDescription>
              </div>
              <AlertTriangle className="size-5 text-destructive" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{weakOnlyCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Watchlist</CardTitle>
                <CardDescription>70-79% accuracy</CardDescription>
              </div>
              <Target className="size-5 text-primary" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{watchlistCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Practice accuracy</CardTitle>
                <CardDescription>Unweighted attempts</CardDescription>
              </div>
              <BarChart3 className="size-5 text-primary" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {formatPercent(summary.overallAccuracy)}
              </p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Narrow topics by subject, priority, attempts, or topic name.
              </CardDescription>
            </div>
            <Filter className="size-5 text-primary" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <form action="/weak-areas" className="grid gap-4 md:grid-cols-5">
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
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue={priority}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="">All priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="watchlist">Watchlist</option>
                  <option value="cleared">Cleared</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="minAttempts">Min attempts</Label>
                <Input
                  id="minAttempts"
                  name="minAttempts"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={minimumAttempts}
                />
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="q">Search topic</Label>
                <div className="flex gap-2">
                  <Input id="q" name="q" defaultValue={search} />
                  <Button type="submit">
                    <Search aria-hidden="true" />
                    Apply
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {weakAreasResult.error || performanceResult.errors.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Analytics could not be loaded</CardTitle>
              <CardDescription>
                {weakAreasResult.error?.message ??
                  performanceResult.errors[0]?.message ??
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
                Weak areas appear after practice answers are saved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/practice">Start practice</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {summary.totalAttempts > 0 && weakAreas.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Not enough topic data yet</CardTitle>
              <CardDescription>
                A topic needs at least {minimumWeakAreaAttempts} attempts before
                it appears here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/practice">Add more attempts</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {weakAreas.length > 0 && weakOnlyCount === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No weak areas right now</CardTitle>
              <CardDescription>
                Topics with enough data are currently watchlist or cleared.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <section className="grid gap-4">
          {weakAreas.length > 0 && filteredAreas.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No topics match the filters</CardTitle>
                <CardDescription>
                  Adjust filters to expand the focus list.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {filteredAreas.map((area) => (
            <Card key={area.id}>
              <CardContent className="grid gap-4 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {area.subjectName}
                    </p>
                    <h2 className="mt-1 text-base font-semibold leading-6">
                      {area.topicName}
                    </h2>
                  </div>
                  <Badge className={priorityClassName(area.priority)}>
                    {priorityLabel(area.priority)}
                  </Badge>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-md border px-3 py-3">
                    <p className="font-semibold">{formatPercent(area.accuracy)}</p>
                    <p className="mt-1 text-muted-foreground">Accuracy</p>
                  </div>
                  <div className="rounded-md border px-3 py-3">
                    <p className="font-semibold">{area.total_attempts}</p>
                    <p className="mt-1 text-muted-foreground">Attempts</p>
                  </div>
                  <div className="rounded-md border px-3 py-3">
                    <p className="font-semibold">{area.wrong_attempts}</p>
                    <p className="mt-1 text-muted-foreground">Wrong</p>
                  </div>
                  <div className="rounded-md border px-3 py-3">
                    <p className="font-semibold">
                      {formatAverageConfidence(area.average_confidence)}
                    </p>
                    <p className="mt-1 text-muted-foreground">Confidence</p>
                  </div>
                  <div className="rounded-md border px-3 py-3">
                    <p className="font-semibold">
                      {formatDateTime(area.last_attempted_at)}
                    </p>
                    <p className="mt-1 text-muted-foreground">Latest</p>
                  </div>
                </div>

                <div className="rounded-md bg-muted px-3 py-3 text-sm">
                  <p className="font-medium">Recommended action</p>
                  <p className="mt-1 text-muted-foreground">
                    {area.recommendedAction}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href={practiceHref(area)}>
                      <Target aria-hidden="true" />
                      Focused drill
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={missedHref(area)}>
                      <RotateCcw aria-hidden="true" />
                      Missed questions
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
