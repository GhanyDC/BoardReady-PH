import Link from "next/link";
import { ArrowLeft, ClipboardCheck } from "lucide-react";

import { createMockExamAction } from "@/app/admin/mock-exams/actions";
import { AppShell } from "@/components/app-shell";
import { MockExamBuilderForm } from "@/components/mock-exams/mock-exam-builder-form";
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

export default async function NewAdminMockExamPage() {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const { data: subjects, error } = await supabase
    .from("subjects")
    .select("id, name, board_weight, sort_order")
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
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
              Admin / Mock Exams
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              New mock exam
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Generate a weighted draft from published verified questions.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/mock-exams">
              <ArrowLeft aria-hidden="true" />
              Back to mock exams
            </Link>
          </Button>
        </section>

        {error ? (
          <Card>
            <CardHeader>
              <CardTitle>Subjects could not be loaded</CardTitle>
              <CardDescription>
                Active subjects could not be loaded. Refresh the page and try
                again.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Weighted builder</CardTitle>
              <CardDescription>
                Subject weights come from the active exam program setup.
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <ClipboardCheck aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <MockExamBuilderForm
              action={createMockExamAction}
              subjects={subjects ?? []}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
