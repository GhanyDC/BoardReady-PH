import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, XCircle } from "lucide-react";

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
import { requireMembership } from "@/lib/current-user";
import { difficultyLabel } from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type MockExamReviewPageProps = {
  params: Promise<{
    attemptId: string;
  }>;
};

type QuestionRow = {
  id: string;
  subject_id: string;
  topic_id: string;
  question_text: string;
  difficulty: string;
  rationale: string | null;
};

type ChoiceRow = {
  id: string;
  question_id: string;
  choice_label: string;
  choice_text: string;
  explanation: string | null;
  is_correct: boolean;
  order_index: number;
};

function choiceClassName(isCorrect: boolean, isSelected: boolean) {
  if (isCorrect) {
    return "rounded-md border border-emerald-600/40 bg-emerald-50 px-3 py-3";
  }

  if (isSelected) {
    return "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-3";
  }

  return "rounded-md border px-3 py-3";
}

export default async function MockExamReviewPage({
  params,
}: MockExamReviewPageProps) {
  const { attemptId } = await params;
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("mock_exam_attempts")
    .select("id, mock_exam_id, status")
    .eq("id", attemptId)
    .eq("user_id", context.user.id)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .maybeSingle();

  if (!attempt) {
    redirect("/mock-exams?error=missing-attempt");
  }

  if (attempt.status !== "submitted") {
    redirect(`/mock-exams/${attempt.id}/take`);
  }

  const [{ data: mockExam }, { data: itemRows }, { data: answers }] =
    await Promise.all([
      supabase
        .from("mock_exams")
        .select("id, title")
        .eq("id", attempt.mock_exam_id)
        .maybeSingle(),
      supabase
        .from("mock_exam_items")
        .select("question_id, order_index")
        .eq("mock_exam_id", attempt.mock_exam_id)
        .order("order_index", { ascending: true }),
      supabase
        .from("mock_exam_answers")
        .select("question_id, selected_choice_id, is_correct")
        .eq("mock_exam_attempt_id", attempt.id),
    ]);
  const questionIds = (itemRows ?? []).map((item) => item.question_id);
  let questions: QuestionRow[] = [];
  let choices: ChoiceRow[] = [];
  let subjects: { id: string; name: string }[] = [];
  let topics: { id: string; name: string }[] = [];

  if (questionIds.length > 0) {
    const [
      { data: questionRows },
      { data: choiceRows },
      { data: subjectRows },
      { data: topicRows },
    ] = await Promise.all([
      supabase
        .from("questions")
        .select(
          "id, subject_id, topic_id, question_text, difficulty, rationale",
        )
        .in("id", questionIds),
      supabase
        .from("choices")
        .select(
          "id, question_id, choice_label, choice_text, explanation, is_correct, order_index",
        )
        .in("question_id", questionIds)
        .order("order_index", { ascending: true }),
      supabase
        .from("subjects")
        .select("id, name")
        .eq("group_id", context.activeGroup.id)
        .eq("exam_program_id", context.activeExamProgram.id),
      supabase
        .from("topics")
        .select("id, name")
        .eq("group_id", context.activeGroup.id),
    ]);

    questions = questionRows ?? [];
    choices = choiceRows ?? [];
    subjects = subjectRows ?? [];
    topics = topicRows ?? [];
  }

  const questionById = new Map(
    questions.map((question) => [question.id, question]),
  );
  const answerByQuestionId = new Map(
    (answers ?? []).map((answer) => [answer.question_id, answer]),
  );
  const subjectNameById = new Map(
    subjects.map((subject) => [subject.id, subject.name]),
  );
  const topicNameById = new Map(topics.map((topic) => [topic.id, topic.name]));
  const choicesByQuestionId = new Map<string, ChoiceRow[]>();

  for (const choice of choices) {
    const current = choicesByQuestionId.get(choice.question_id) ?? [];
    current.push(choice);
    choicesByQuestionId.set(choice.question_id, current);
  }

  const orderedQuestions = (itemRows ?? [])
    .map((item) => questionById.get(item.question_id))
    .filter((question): question is QuestionRow => Boolean(question));
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
              Mock Exam Review
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              {mockExam?.title ?? "Mock exam"}
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Answers, rationales, and explanations are shown after submission.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/mock-exams/${attempt.id}/results`}>
              <ArrowLeft aria-hidden="true" />
              Back to results
            </Link>
          </Button>
        </section>

        <section className="grid gap-4">
          {orderedQuestions.map((question, index) => {
            const answer = answerByQuestionId.get(question.id);
            const questionChoices = choicesByQuestionId.get(question.id) ?? [];
            const selectedChoice = questionChoices.find(
              (choice) => choice.id === answer?.selected_choice_id,
            );
            const correctChoice = questionChoices.find(
              (choice) => choice.is_correct,
            );

            return (
              <Card key={question.id}>
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {index + 1}/{orderedQuestions.length}
                    </Badge>
                    <Badge variant="outline">
                      {subjectNameById.get(question.subject_id) ?? "Subject"}
                    </Badge>
                    <Badge variant="outline">
                      {topicNameById.get(question.topic_id) ?? "Topic"}
                    </Badge>
                    <Badge>{difficultyLabel(question.difficulty)}</Badge>
                    <Badge variant={answer?.is_correct ? "default" : "outline"}>
                      {answer
                        ? answer.is_correct
                          ? "Correct"
                          : "Incorrect"
                        : "Unanswered"}
                    </Badge>
                  </div>
                  <CardTitle className="leading-7">
                    {question.question_text}
                  </CardTitle>
                  <CardDescription className="grid gap-1">
                    <span>
                      Your answer:{" "}
                      {selectedChoice
                        ? `${selectedChoice.choice_label}. ${selectedChoice.choice_text}`
                        : "Unanswered"}
                    </span>
                    <span>
                      Correct answer:{" "}
                      {correctChoice
                        ? `${correctChoice.choice_label}. ${correctChoice.choice_text}`
                        : "Unavailable"}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5">
                  <div className="grid gap-3">
                    {questionChoices.map((choice) => {
                      const isSelected = choice.id === answer?.selected_choice_id;

                      return (
                        <div
                          key={choice.id}
                          className={choiceClassName(
                            choice.is_correct,
                            isSelected,
                          )}
                        >
                          <div className="flex items-start gap-2 text-sm">
                            {choice.is_correct ? (
                              <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
                            ) : isSelected ? (
                              <XCircle className="mt-0.5 size-4 text-destructive" />
                            ) : (
                              <Circle className="mt-0.5 size-4 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium">
                                {choice.choice_label}. {choice.choice_text}
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                {choice.explanation || "No explanation provided."}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-md bg-muted px-3 py-3 text-sm">
                    <p className="font-medium">Rationale</p>
                    <p className="mt-1 leading-6 text-muted-foreground">
                      {question.rationale || "No rationale provided."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
