import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardCheck, FileText, PlayCircle } from "lucide-react";

import { startMockExamAction } from "@/app/mock-exams/actions";
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
import {
  formatPercentage,
  mockAttemptStatusLabel,
  mockTypeLabel,
} from "@/lib/mock-exams";
import { formatDateTime } from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type MockExamsPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function errorMessage(code?: string) {
  const messages: Record<string, string> = {
    "invalid-mock": "Choose a valid mock exam.",
    "missing-mock": "That mock exam is not available.",
    "start-failed": "Mock exam could not be started.",
  };

  return code ? messages[code] ?? "Mock exam action could not be completed." : null;
}

export default async function MockExamsPage({ searchParams }: MockExamsPageProps) {
  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram || !context.role) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const supabase = await createClient();
  const { data: mockExams, error } = await supabase
    .from("mock_exams")
    .select(
      "id, title, description, mock_type, item_count, time_limit_minutes, published_at",
    )
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  const mockExamIds = (mockExams ?? []).map((mockExam) => mockExam.id);
  const { data: attempts } =
    mockExamIds.length > 0
      ? await supabase
          .from("mock_exam_attempts")
          .select(
            "id, mock_exam_id, status, score, total_items, percentage, submitted_at, created_at",
          )
          .eq("user_id", context.user.id)
          .eq("group_id", context.activeGroup.id)
          .eq("exam_program_id", context.activeExamProgram.id)
          .in("mock_exam_id", mockExamIds)
          .order("created_at", { ascending: false })
      : { data: [] };
  const latestAttemptByMockId = new Map<
    string,
    NonNullable<typeof attempts>[number]
  >();

  for (const attempt of attempts ?? []) {
    if (!latestAttemptByMockId.has(attempt.mock_exam_id)) {
      latestAttemptByMockId.set(attempt.mock_exam_id, attempt);
    }
  }

  const errorText = errorMessage(params?.error);
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
            Mock Exams
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Published mock exams
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Take timed exams built from the published question bank for{" "}
            {context.activeExamProgram.name}.
          </p>
        </section>

        {errorText ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorText}
          </p>
        ) : null}

        {error ? (
          <Card>
            <CardHeader>
              <CardTitle>Mock exams could not be loaded</CardTitle>
              <CardDescription>{error.message}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <section className="grid gap-4">
          {(mockExams ?? []).length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No mock exams available</CardTitle>
                <CardDescription>
                  Published mock exams for your active group and exam track will
                  appear here.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {(mockExams ?? []).map((mockExam) => {
            const latestAttempt = latestAttemptByMockId.get(mockExam.id);
            const latestSubmitted = latestAttempt?.status === "submitted";
            const inProgress = latestAttempt?.status === "in_progress";

            return (
              <Card key={mockExam.id}>
                <CardContent className="grid gap-4 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          {mockTypeLabel(mockExam.mock_type)}
                        </Badge>
                        <Badge variant={inProgress ? "default" : "outline"}>
                          {mockAttemptStatusLabel(latestAttempt?.status)}
                        </Badge>
                      </div>
                      <h2 className="mt-3 text-lg font-semibold leading-6">
                        {mockExam.title}
                      </h2>
                      {mockExam.description ? (
                        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                          {mockExam.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                      <ClipboardCheck aria-hidden="true" />
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-4">
                    <span>{mockExam.item_count} items</span>
                    <span>{mockExam.time_limit_minutes} minutes</span>
                    <span>
                      Latest score:{" "}
                      {latestSubmitted
                        ? `${latestAttempt.score}/${latestAttempt.total_items}`
                        : "Not submitted"}
                    </span>
                    <span>
                      {latestSubmitted
                        ? formatPercentage(latestAttempt.percentage)
                        : mockExam.published_at
                          ? `Published ${formatDateTime(mockExam.published_at)}`
                          : "Published"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <form action={startMockExamAction}>
                      <input
                        type="hidden"
                        name="mockExamId"
                        value={mockExam.id}
                      />
                      <Button type="submit" size="sm">
                        <PlayCircle aria-hidden="true" />
                        {inProgress ? "Resume" : "Start"}
                      </Button>
                    </form>

                    {latestSubmitted ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/mock-exams/${latestAttempt.id}/results`}>
                          <FileText aria-hidden="true" />
                          Review previous attempt
                        </Link>
                      </Button>
                    ) : null}
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
