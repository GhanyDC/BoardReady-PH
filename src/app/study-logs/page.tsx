import { redirect } from "next/navigation";
import { BookOpenText } from "lucide-react";

import { AppShell } from "@/components/app-shell";
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
import { createClient } from "@/lib/supabase/server";
import { activityLabel, activityTypes, formatDuration } from "@/lib/study";

export const dynamic = "force-dynamic";

type StudyLogsPageProps = {
  searchParams?: Promise<{
    from?: string;
    to?: string;
    subject?: string;
    activity?: string;
  }>;
};

function endOfDayIso(date: string) {
  const parsed = new Date(`${date}T23:59:59.999`);
  return parsed.toISOString();
}

function startOfDayIso(date: string) {
  const parsed = new Date(`${date}T00:00:00.000`);
  return parsed.toISOString();
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function StudyLogsPage({
  searchParams,
}: StudyLogsPageProps) {
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const from = params?.from ?? "";
  const to = params?.to ?? "";
  const subject = params?.subject ?? "";
  const activity = params?.activity ?? "";
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
      .select("id, name, subject_id")
      .eq("group_id", context.activeGroup.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  let query = supabase
    .from("study_sessions")
    .select(
      "id, subject_id, topic_id, activity_type, started_at, duration_seconds, focus_rating, notes",
    )
    .eq("user_id", context.user.id)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .order("started_at", { ascending: false });

  if (from) {
    query = query.gte("started_at", startOfDayIso(from));
  }

  if (to) {
    query = query.lte("started_at", endOfDayIso(to));
  }

  if (subject) {
    query = query.eq("subject_id", subject);
  }

  if (activity) {
    query = query.eq("activity_type", activity);
  }

  const { data: sessions } = await query;
  const subjectNameById = new Map(
    (subjects ?? []).map((subjectItem) => [subjectItem.id, subjectItem.name]),
  );
  const topicNameById = new Map(
    (topics ?? []).map((topicItem) => [topicItem.id, topicItem.name]),
  );
  const totalSeconds = (sessions ?? []).reduce(
    (total, session) => total + session.duration_seconds,
    0,
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
        <section>
          <p className="text-sm font-medium uppercase text-primary">
            Study Logs
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Review your saved sessions
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Logs are limited to your active group and exam track.
          </p>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Showing {formatDuration(totalSeconds)} across{" "}
                {(sessions ?? []).length} visible sessions.
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <BookOpenText aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="from">From</Label>
                <Input id="from" name="from" type="date" defaultValue={from} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="to">To</Label>
                <Input id="to" name="to" type="date" defaultValue={to} />
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
                <Label htmlFor="activity">Activity</Label>
                <select
                  id="activity"
                  name="activity"
                  defaultValue={activity}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="">All activities</option>
                  {activityTypes.map((activityType) => (
                    <option key={activityType.value} value={activityType.value}>
                      {activityType.label}
                    </option>
                  ))}
                </select>
              </div>
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground md:col-span-4 md:w-fit">
                Apply filters
              </button>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4">
          {(sessions ?? []).length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No study logs yet</CardTitle>
                <CardDescription>
                  Save a study timer session and it will appear here.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {(sessions ?? []).map((session) => (
            <Card key={session.id}>
              <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {formatDateTime(session.started_at)}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">
                    {activityLabel(session.activity_type)}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {subjectNameById.get(session.subject_id ?? "") ??
                      "General session"}
                    {session.topic_id
                      ? ` / ${topicNameById.get(session.topic_id) ?? "Topic"}`
                      : ""}
                  </p>
                  {session.notes ? (
                    <p className="mt-3 text-sm leading-6">{session.notes}</p>
                  ) : null}
                </div>
                <div className="grid gap-2 text-sm md:text-right">
                  <span className="font-semibold">
                    {formatDuration(session.duration_seconds)}
                  </span>
                  <span className="text-muted-foreground">
                    Focus:{" "}
                    {session.focus_rating ? `${session.focus_rating}/5` : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
