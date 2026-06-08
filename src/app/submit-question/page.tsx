import { redirect } from "next/navigation";
import { Send } from "lucide-react";

import { submitReviewerQuestionAction } from "@/app/submit-question/actions";
import { AppShell } from "@/components/app-shell";
import { QuestionEditorForm } from "@/components/questions/question-editor-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireMembership } from "@/lib/current-user";
import {
  formatDateTime,
  statusBadgeVariant,
  statusLabel,
} from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SubmitQuestionPageProps = {
  searchParams?: Promise<{
    submitted?: string;
  }>;
};

export default async function SubmitQuestionPage({
  searchParams,
}: SubmitQuestionPageProps) {
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const supabase = await createClient();
  const [
    { data: subjects },
    { data: topics },
    { data: submissions },
  ] = await Promise.all([
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
    supabase
      .from("questions")
      .select("id, question_text, status, created_at")
      .eq("created_by", context.user.id)
      .eq("group_id", context.activeGroup.id)
      .eq("exam_program_id", context.activeExamProgram.id)
      .order("created_at", { ascending: false })
      .limit(5),
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
            Submit Question
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Suggest a practice question
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Submissions are saved as pending review for{" "}
            {context.activeExamProgram.name}.
          </p>
        </section>

        {params?.submitted === "1" ? (
          <Card>
            <CardHeader>
              <CardTitle>Question submitted</CardTitle>
              <CardDescription>
                Your question is pending admin review.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Question details</CardTitle>
              <CardDescription>
                Reviewer submissions cannot be published directly.
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Send aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <QuestionEditorForm
              action={submitReviewerQuestionAction}
              subjects={subjects ?? []}
              topics={topics ?? []}
              submitMode="reviewer-submit"
              defaults={{
                difficulty: "moderate",
                bloomLevel: "understanding",
                sourceType: "reviewer_submitted",
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your recent submissions</CardTitle>
            <CardDescription>
              Only your own submitted questions are shown here.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {(submissions ?? []).length === 0 ? (
              <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                No submissions yet.
              </p>
            ) : null}
            {(submissions ?? []).map((submission) => (
              <div
                key={submission.id}
                className="grid gap-2 rounded-md border px-3 py-2 text-sm md:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-medium">{submission.question_text}</p>
                  <p className="mt-1 text-muted-foreground">
                    Submitted {formatDateTime(submission.created_at)}
                  </p>
                </div>
                <Badge variant={statusBadgeVariant(submission.status)}>
                  {statusLabel(submission.status)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
