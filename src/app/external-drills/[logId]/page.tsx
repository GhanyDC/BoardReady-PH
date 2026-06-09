import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, SquarePen } from "lucide-react";

import { deleteExternalDrillLogAction } from "@/app/external-drills/actions";
import { AppShell } from "@/components/app-shell";
import { DeleteExternalDrillForm } from "@/components/external-drills/delete-external-drill-form";
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
  externalDrillPerformanceCategory,
  formatExternalDrillPercentage,
} from "@/lib/external-drills";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ExternalDrillDetailPageProps = {
  params: Promise<{
    logId: string;
  }>;
  searchParams?: Promise<{
    updated?: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "full",
  }).format(new Date(`${value}T00:00:00.000`));
}

export default async function ExternalDrillDetailPage({
  params,
  searchParams,
}: ExternalDrillDetailPageProps) {
  const { logId } = await params;
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const { data: log } = await supabase
    .from("external_drill_logs")
    .select("*")
    .eq("id", logId)
    .eq("user_id", context.user.id)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .maybeSingle();

  if (!log) {
    notFound();
  }

  const [{ data: subject }, { data: topic }, resolvedSearchParams] =
    await Promise.all([
      supabase
        .from("subjects")
        .select("id, name")
        .eq("id", log.subject_id)
        .eq("group_id", context.activeGroup.id)
        .eq("exam_program_id", context.activeExamProgram.id)
        .maybeSingle(),
      log.topic_id
        ? supabase
            .from("topics")
            .select("id, name")
            .eq("id", log.topic_id)
            .eq("group_id", context.activeGroup.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      searchParams,
    ]);
  const category = externalDrillPerformanceCategory(Number(log.percentage));
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
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-normal">
                {log.drill_title}
              </h1>
              <Badge variant="outline" className={category.badgeClassName}>
                {category.label}
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {subject?.name ?? "Subject"}
              {topic?.name ? ` / ${topic.name}` : ""} /{" "}
              {formatDate(log.date_taken)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/external-drills">
                <ArrowLeft aria-hidden="true" />
                Back
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/external-drills/${log.id}/edit`}>
                <SquarePen aria-hidden="true" />
                Edit
              </Link>
            </Button>
          </div>
        </section>

        {resolvedSearchParams?.updated === "1" ? (
          <p className="rounded-md border border-emerald-600/30 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            External drill log updated.
          </p>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Score</CardTitle>
              <CardDescription>Score over total items</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-normal">
                {log.score} / {log.total_items}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Percentage</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-normal">
                {formatExternalDrillPercentage(Number(log.percentage))}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Date taken</CardTitle>
              <CardDescription>{log.source_label ?? "No source label"}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <CalendarDays className="size-5 text-primary" aria-hidden="true" />
              <p className="font-semibold">{formatDate(log.date_taken)}</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Weak topics</CardTitle>
              <CardDescription>External drill signal only</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {log.weak_topic_notes ?? "No weak topics logged."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mistakes and notes</CardTitle>
              <CardDescription>Private notes for this log</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {log.mistake_notes ?? "No mistake notes logged."}
              </p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Delete log</CardTitle>
            <CardDescription>
              Remove this score record from your external drill history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteExternalDrillForm
              action={deleteExternalDrillLogAction}
              logId={log.id}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
