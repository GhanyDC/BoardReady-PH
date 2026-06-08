import Link from "next/link";
import { ArrowLeft, SquarePen } from "lucide-react";

import { createAdminQuestionAction } from "@/app/admin/questions/actions";
import { AppShell } from "@/components/app-shell";
import { QuestionEditorForm } from "@/components/questions/question-editor-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdminContext } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewAdminQuestionPage() {
  const context = await requireAdminContext();
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
              Admin / Question Bank
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Create question
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Questions are saved to {context.activeGroup.name} and{" "}
              {context.activeExamProgram.name}.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/questions">
              <ArrowLeft aria-hidden="true" />
              Back to questions
            </Link>
          </Button>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Question details</CardTitle>
              <CardDescription>
                Drafts can be incomplete later, but this MVP form requires four
                choices before saving.
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <SquarePen aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <QuestionEditorForm
              action={createAdminQuestionAction}
              subjects={subjects ?? []}
              topics={topics ?? []}
              defaults={{
                difficulty: "moderate",
                bloomLevel: "understanding",
                sourceType: "self_made",
              }}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
