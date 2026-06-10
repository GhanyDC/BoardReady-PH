import Link from "next/link";
import {
  Archive,
  ClipboardCheck,
  FilePenLine,
  PlusCircle,
  Send,
} from "lucide-react";

import {
  archiveMockExamAction,
  publishMockExamAction,
} from "@/app/admin/mock-exams/actions";
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
import { requireAdminContext } from "@/lib/admin-auth";
import {
  mockStatusBadgeVariant,
  mockStatusLabel,
  mockTypeLabel,
} from "@/lib/mock-exams";
import { formatDateTime } from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AdminMockExamsPageProps = {
  searchParams?: Promise<{
    created?: string;
    updated?: string;
    published?: string;
    archived?: string;
    error?: string;
  }>;
};

function statusMessage(params: Awaited<AdminMockExamsPageProps["searchParams"]>) {
  if (params?.created === "1") {
    return "Mock exam draft created.";
  }

  if (params?.updated === "1") {
    return "Mock exam draft updated.";
  }

  if (params?.published === "1") {
    return "Mock exam published.";
  }

  if (params?.archived === "1") {
    return "Mock exam archived.";
  }

  return null;
}

function errorMessage(code?: string) {
  const messages: Record<string, string> = {
    "invalid-mock": "Choose a valid mock exam.",
    "missing-mock": "Mock exam was not found.",
    "incomplete-mock": "Mock exam needs its full item count before publishing.",
    "publish-failed": "Mock exam could not be published.",
    "archive-failed": "Mock exam could not be archived.",
  };

  return code ? messages[code] ?? "Mock exam action could not be completed." : null;
}

export default async function AdminMockExamsPage({
  searchParams,
}: AdminMockExamsPageProps) {
  const context = await requireAdminContext();
  const params = await searchParams;
  const supabase = await createClient();
  const { data: mockExams, error } = await supabase
    .from("mock_exams")
    .select(
      "id, title, description, mock_type, item_count, time_limit_minutes, status, created_by, published_at, archived_at, created_at, updated_at",
    )
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .order("updated_at", { ascending: false });
  const mockExamIds = (mockExams ?? []).map((mockExam) => mockExam.id);
  const { data: itemRows } =
    mockExamIds.length > 0
      ? await supabase
          .from("mock_exam_items")
          .select("mock_exam_id")
          .in("mock_exam_id", mockExamIds)
      : { data: [] };
  const itemCountByMockId = new Map<string, number>();

  for (const item of itemRows ?? []) {
    itemCountByMockId.set(
      item.mock_exam_id,
      (itemCountByMockId.get(item.mock_exam_id) ?? 0) + 1,
    );
  }

  const message = statusMessage(params);
  const errorText = errorMessage(params?.error);
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
              Mock exams
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Build timed exams from published verified questions in{" "}
              {context.activeExamProgram.name}.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/mock-exams/new">
              <PlusCircle aria-hidden="true" />
              New mock exam
            </Link>
          </Button>
        </section>

        {message ? (
          <p className="rounded-md border border-emerald-600/30 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {message}
          </p>
        ) : null}

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
                <CardTitle>No mock exams yet</CardTitle>
                <CardDescription>
                  Create a draft and publish it when the weighted item set is
                  complete.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/admin/mock-exams/new">
                    <PlusCircle aria-hidden="true" />
                    Create first mock exam
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {(mockExams ?? []).map((mockExam) => {
            const selectedCount = itemCountByMockId.get(mockExam.id) ?? 0;
            const complete = selectedCount === mockExam.item_count;

            return (
              <Card key={mockExam.id}>
                <CardContent className="grid gap-4 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={mockStatusBadgeVariant(mockExam.status)}>
                          {mockStatusLabel(mockExam.status)}
                        </Badge>
                        <Badge variant="secondary">
                          {mockTypeLabel(mockExam.mock_type)}
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
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/mock-exams/${mockExam.id}/edit`}>
                        <FilePenLine aria-hidden="true" />
                        Edit / review
                      </Link>
                    </Button>

                    {mockExam.status !== "published" ? (
                      <form action={publishMockExamAction}>
                        <input
                          type="hidden"
                          name="mockExamId"
                          value={mockExam.id}
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!complete}
                          title={
                            complete
                              ? "Publish mock exam"
                              : "Complete weighted items before publishing"
                          }
                        >
                          <Send aria-hidden="true" />
                          Publish
                        </Button>
                      </form>
                    ) : null}

                    {mockExam.status === "published" ? (
                      <form action={archiveMockExamAction}>
                        <input
                          type="hidden"
                          name="mockExamId"
                          value={mockExam.id}
                        />
                        <Button type="submit" variant="outline" size="sm">
                          <Archive aria-hidden="true" />
                          Archive
                        </Button>
                      </form>
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
