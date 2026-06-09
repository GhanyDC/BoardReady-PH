import { redirect } from "next/navigation";
import { ClipboardPenLine } from "lucide-react";

import { createExternalDrillLogAction } from "@/app/external-drills/actions";
import { AppShell } from "@/components/app-shell";
import { ExternalDrillForm } from "@/components/external-drills/external-drill-form";
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

type NewExternalDrillPageProps = {
  searchParams?: Promise<{
    created?: string;
  }>;
};

function todayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

export default async function NewExternalDrillPage({
  searchParams,
}: NewExternalDrillPageProps) {
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const created = params?.created === "1";
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
            External Drills
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Log an offline drill score
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Track results from hardcopy or offline drills without storing the
            drill material itself.
          </p>
        </section>

        {created ? (
          <p className="rounded-md border border-emerald-600/30 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            External drill log saved.
          </p>
        ) : null}

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Hardcopy or offline drill</CardTitle>
              <CardDescription>
                Record score metadata, weak topics, mistakes, and notes for
                your active group and exam track.
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <ClipboardPenLine aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <ExternalDrillForm
              action={createExternalDrillLogAction}
              subjects={subjects ?? []}
              topics={topics ?? []}
              defaultDate={todayDateInput()}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
