import { redirect } from "next/navigation";
import { Timer } from "lucide-react";

import { saveStudySessionAction } from "@/app/study-timer/actions";
import { AppShell } from "@/components/app-shell";
import { StudyTimerForm } from "@/components/study/study-timer-form";
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

export default async function StudyTimerPage() {
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    redirect("/onboarding");
  }

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
            Study Timer
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Track focused study time
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Start, pause, resume, and save a session for your active group and
            exam track.
          </p>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Manual study timer</CardTitle>
              <CardDescription>
                This page-based timer does not persist after a refresh in Sprint
                2.
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Timer aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <StudyTimerForm
              action={saveStudySessionAction}
              subjects={subjects ?? []}
              topics={topics ?? []}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
