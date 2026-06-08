import { redirect } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import { saveStudyPreferencesAction } from "@/app/study-habits/actions";
import { AppShell } from "@/components/app-shell";
import { StudyPreferencesForm } from "@/components/study/study-preferences-form";
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

export default async function StudyHabitsPage() {
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const { data: preference } = await supabase
    .from("study_preferences")
    .select("*")
    .eq("user_id", context.user.id)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .maybeSingle();

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
            Study Habits
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Personalize your study rhythm
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Goals and habits are saved for your active group and exam track.
          </p>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Study preferences</CardTitle>
              <CardDescription>
                Set goals, rest days, and review strategy for your current
                exam track.
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <SlidersHorizontal aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <StudyPreferencesForm
              action={saveStudyPreferencesAction}
              preference={preference}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
