import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, SquarePen } from "lucide-react";

import { updateExternalDrillLogAction } from "@/app/external-drills/actions";
import { AppShell } from "@/components/app-shell";
import { ExternalDrillForm } from "@/components/external-drills/external-drill-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireMembership } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EditExternalDrillPageProps = {
  params: Promise<{
    logId: string;
  }>;
};

function todayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

export default async function EditExternalDrillPage({
  params,
}: EditExternalDrillPageProps) {
  const { logId } = await params;
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const [{ data: log }, { data: subjects }, { data: topics }] =
    await Promise.all([
      supabase
        .from("external_drill_logs")
        .select("*")
        .eq("id", logId)
        .eq("user_id", context.user.id)
        .eq("group_id", context.activeGroup.id)
        .eq("exam_program_id", context.activeExamProgram.id)
        .maybeSingle(),
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

  if (!log) {
    notFound();
  }

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
              Edit external drill log
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Update score metadata and notes for your active group and exam
              track.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/external-drills/${log.id}`}>
              <ArrowLeft aria-hidden="true" />
              Back to detail
            </Link>
          </Button>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>{log.drill_title}</CardTitle>
              <CardDescription>
                Score edits recalculate the generated percentage in the
                database.
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <SquarePen aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <ExternalDrillForm
              action={updateExternalDrillLogAction}
              subjects={subjects ?? []}
              topics={topics ?? []}
              defaultDate={todayDateInput()}
              submitLabel="Update external drill"
              defaults={{
                id: log.id,
                drillTitle: log.drill_title,
                sourceLabel: log.source_label,
                subjectId: log.subject_id,
                topicId: log.topic_id,
                totalItems: log.total_items,
                score: log.score,
                dateTaken: log.date_taken,
                mistakeNotes: log.mistake_notes,
                weakTopicNotes: log.weak_topic_notes,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
