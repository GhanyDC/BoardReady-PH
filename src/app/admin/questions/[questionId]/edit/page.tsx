import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, SquarePen } from "lucide-react";

import { updateAdminQuestionAction } from "@/app/admin/questions/actions";
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
import { QuestionEditorForm } from "@/components/questions/question-editor-form";
import { requireAdminContext } from "@/lib/admin-auth";
import { statusBadgeVariant, statusLabel } from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EditQuestionPageProps = {
  params: Promise<{
    questionId: string;
  }>;
};

export default async function EditQuestionPage({
  params,
}: EditQuestionPageProps) {
  const { questionId } = await params;
  const context = await requireAdminContext();
  const supabase = await createClient();
  const [
    { data: question },
    { data: choices },
    { data: subjects },
    { data: topics },
  ] = await Promise.all([
    supabase
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .eq("group_id", context.activeGroup.id)
      .eq("exam_program_id", context.activeExamProgram.id)
      .maybeSingle(),
    supabase
      .from("choices")
      .select("*")
      .eq("question_id", questionId)
      .order("order_index", { ascending: true }),
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

  if (!question) {
    notFound();
  }

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
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-normal">
                Edit question
              </h1>
              <Badge variant={statusBadgeVariant(question.status)}>
                {statusLabel(question.status)}
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Review fields, choices, rationale, and publishing status for the
              active exam track.
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
              <CardTitle>Question workflow</CardTitle>
              <CardDescription>
                Publishing requires four choices, one correct answer, valid
                subject/topic, and a rationale.
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <SquarePen aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <QuestionEditorForm
              action={updateAdminQuestionAction}
              subjects={subjects ?? []}
              topics={topics ?? []}
              submitMode="admin-edit"
              defaults={{
                id: question.id,
                subjectId: question.subject_id,
                topicId: question.topic_id,
                difficulty: question.difficulty,
                bloomLevel: question.bloom_level,
                sourceType: question.source_type,
                status: question.status,
                questionText: question.question_text,
                rationale: question.rationale ?? "",
                choices: (choices ?? []).map((choice) => ({
                  label: choice.choice_label as "A" | "B" | "C" | "D",
                  text: choice.choice_text,
                  explanation: choice.explanation ?? "",
                  isCorrect: choice.is_correct,
                })),
              }}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
