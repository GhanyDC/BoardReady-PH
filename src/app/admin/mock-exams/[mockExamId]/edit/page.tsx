import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Archive, ClipboardCheck, Send } from "lucide-react";

import {
  archiveMockExamAction,
  publishMockExamAction,
  updateMockExamAction,
} from "@/app/admin/mock-exams/actions";
import { AppShell } from "@/components/app-shell";
import { MockExamBuilderForm } from "@/components/mock-exams/mock-exam-builder-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdminContext } from "@/lib/admin-auth";
import {
  mockStatusBadgeVariant,
  mockStatusLabel,
  mockTypeLabel,
} from "@/lib/mock-exams";
import { formatDateTime } from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EditAdminMockExamPageProps = {
  params: Promise<{
    mockExamId: string;
  }>;
};

export default async function EditAdminMockExamPage({
  params,
}: EditAdminMockExamPageProps) {
  const { mockExamId } = await params;
  const context = await requireAdminContext();
  const supabase = await createClient();
  const [{ data: mockExam }, { data: subjects, error: subjectsError }] =
    await Promise.all([
      supabase
        .from("mock_exams")
        .select(
          "id, title, description, mock_type, item_count, time_limit_minutes, status, published_at, archived_at, created_at, updated_at",
        )
        .eq("id", mockExamId)
        .eq("group_id", context.activeGroup.id)
        .eq("exam_program_id", context.activeExamProgram.id)
        .maybeSingle(),
      supabase
        .from("subjects")
        .select("id, name, board_weight, sort_order")
        .eq("group_id", context.activeGroup.id)
        .eq("exam_program_id", context.activeExamProgram.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

  if (!mockExam) {
    redirect("/admin/mock-exams");
  }

  const { data: itemRows } = await supabase
    .from("mock_exam_items")
    .select("question_id")
    .eq("mock_exam_id", mockExam.id);
  const questionIds = (itemRows ?? []).map((item) => item.question_id);
  const { data: selectedQuestions } =
    questionIds.length > 0
      ? await supabase
          .from("questions")
          .select("id, subject_id")
          .in("id", questionIds)
      : { data: [] };
  const itemCountBySubject = new Map<string, number>();

  for (const question of selectedQuestions ?? []) {
    itemCountBySubject.set(
      question.subject_id,
      (itemCountBySubject.get(question.subject_id) ?? 0) + 1,
    );
  }

  const selectedCount = questionIds.length;
  const complete = selectedCount === mockExam.item_count;
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
              {mockExam.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={mockStatusBadgeVariant(mockExam.status)}>
                {mockStatusLabel(mockExam.status)}
              </Badge>
              <Badge variant="secondary">
                {mockTypeLabel(mockExam.mock_type)}
              </Badge>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/mock-exams">
              <ArrowLeft aria-hidden="true" />
              Back to mock exams
            </Link>
          </Button>
        </section>

        {subjectsError ? (
          <Card>
            <CardHeader>
              <CardTitle>Subjects could not be loaded</CardTitle>
              <CardDescription>{subjectsError.message}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {mockExam.status === "draft" ? (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Draft builder</CardTitle>
                <CardDescription>
                  Saving regenerates the weighted item set from published
                  verified questions.
                </CardDescription>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <ClipboardCheck aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <MockExamBuilderForm
                action={updateMockExamAction}
                subjects={subjects ?? []}
                submitLabel="Save and regenerate"
                defaults={{
                  id: mockExam.id,
                  title: mockExam.title,
                  description: mockExam.description,
                  mockType: mockExam.mock_type,
                  itemCount: mockExam.item_count,
                  timeLimitMinutes: mockExam.time_limit_minutes,
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Published item set</CardTitle>
                <CardDescription>
                  Published and archived mocks keep their selected questions
                  fixed.
                </CardDescription>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <ClipboardCheck aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-4">
                <span>
                  Items: {selectedCount}/{mockExam.item_count}
                </span>
                <span>{mockExam.time_limit_minutes} minutes</span>
                <span>Updated {formatDateTime(mockExam.updated_at)}</span>
                <span>
                  {mockExam.published_at
                    ? `Published ${formatDateTime(mockExam.published_at)}`
                    : "Not published"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {mockExam.status !== "published" ? (
                  <form action={publishMockExamAction}>
                    <input type="hidden" name="mockExamId" value={mockExam.id} />
                    <Button type="submit" disabled={!complete}>
                      <Send aria-hidden="true" />
                      Publish
                    </Button>
                  </form>
                ) : null}
                {mockExam.status === "published" ? (
                  <form action={archiveMockExamAction}>
                    <input type="hidden" name="mockExamId" value={mockExam.id} />
                    <Button type="submit" variant="outline">
                      <Archive aria-hidden="true" />
                      Archive
                    </Button>
                  </form>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Selected subject distribution</CardTitle>
            <CardDescription>
              Current saved item counts by active subject.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">Subject</th>
                    <th className="px-3 py-2 font-medium">Weight</th>
                    <th className="px-3 py-2 font-medium">Saved items</th>
                  </tr>
                </thead>
                <tbody>
                  {(subjects ?? []).map((subject) => (
                    <tr key={subject.id} className="border-t">
                      <td className="px-3 py-2">{subject.name}</td>
                      <td className="px-3 py-2">{subject.board_weight}%</td>
                      <td className="px-3 py-2 font-medium">
                        {itemCountBySubject.get(subject.id) ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
