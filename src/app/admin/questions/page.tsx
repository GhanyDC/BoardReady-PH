import Link from "next/link";
import { Filter, PlusCircle, Search } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireAdminContext } from "@/lib/admin-auth";
import {
  bloomLevelLabel,
  difficultyLabel,
  formatDateTime,
  questionDifficulties,
  questionSourceTypes,
  questionStatuses,
  shortUserId,
  sourceTypeLabel,
  statusBadgeVariant,
  statusLabel,
} from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AdminQuestionsPageProps = {
  searchParams?: Promise<{
    subject?: string;
    topic?: string;
    difficulty?: string;
    status?: string;
    source?: string;
    q?: string;
  }>;
};

function questionPreview(value: string) {
  if (value.length <= 150) {
    return value;
  }

  return `${value.slice(0, 150)}...`;
}

export default async function AdminQuestionsPage({
  searchParams,
}: AdminQuestionsPageProps) {
  const context = await requireAdminContext();
  const params = await searchParams;
  const subject = params?.subject ?? "";
  const topic = params?.topic ?? "";
  const difficulty = params?.difficulty ?? "";
  const status = params?.status ?? "";
  const source = params?.source ?? "";
  const search = params?.q?.trim() ?? "";
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

  let query = supabase
    .from("questions")
    .select(
      "id, question_text, subject_id, topic_id, difficulty, bloom_level, source_type, status, created_by, created_at, updated_at",
    )
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (subject) {
    query = query.eq("subject_id", subject);
  }

  if (topic) {
    query = query.eq("topic_id", topic);
  }

  if (difficulty) {
    query = query.eq("difficulty", difficulty);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (source) {
    query = query.eq("source_type", source);
  }

  if (search) {
    query = query.ilike("question_text", `%${search}%`);
  }

  const { data: questions, error } = await query;
  const subjectNameById = new Map(
    (subjects ?? []).map((subjectItem) => [subjectItem.id, subjectItem.name]),
  );
  const topicNameById = new Map(
    (topics ?? []).map((topicItem) => [topicItem.id, topicItem.name]),
  );
  const filteredTopics = subject
    ? (topics ?? []).filter((topicItem) => topicItem.subject_id === subject)
    : topics ?? [];
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
              Questions
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Review and manage questions for {context.activeExamProgram.name}.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/questions/new">
              <PlusCircle aria-hidden="true" />
              New question
            </Link>
          </Button>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Showing up to 50 active-context question records.
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Filter aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 lg:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="q">Search</Label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="q"
                    name="q"
                    defaultValue={search}
                    placeholder="Question text"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject</Label>
                <select
                  id="subject"
                  name="subject"
                  defaultValue={subject}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="">All subjects</option>
                  {(subjects ?? []).map((subjectItem) => (
                    <option key={subjectItem.id} value={subjectItem.id}>
                      {subjectItem.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="topic">Topic</Label>
                <select
                  id="topic"
                  name="topic"
                  defaultValue={topic}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="">All topics</option>
                  {filteredTopics.map((topicItem) => (
                    <option key={topicItem.id} value={topicItem.id}>
                      {topicItem.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  name="difficulty"
                  defaultValue={difficulty}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="">All difficulties</option>
                  {questionDifficulties.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={status}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="">All statuses</option>
                  {questionStatuses.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="source">Source</Label>
                <select
                  id="source"
                  name="source"
                  defaultValue={source}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="">All sources</option>
                  {questionSourceTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="lg:col-span-3 lg:w-fit">
                Apply filters
              </Button>
            </form>
          </CardContent>
        </Card>

        {error ? (
          <Card>
            <CardHeader>
              <CardTitle>Questions could not be loaded</CardTitle>
              <CardDescription>{error.message}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <section className="grid gap-4">
          {(questions ?? []).length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No questions found</CardTitle>
                <CardDescription>
                  Create a question or adjust filters to expand the list.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {(questions ?? []).map((question) => (
            <Card key={question.id}>
              <CardContent className="grid gap-4 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">
                      {subjectNameById.get(question.subject_id) ?? "Subject"} /{" "}
                      {topicNameById.get(question.topic_id) ?? "Topic"}
                    </p>
                    <h2 className="mt-1 text-base font-semibold leading-6">
                      {questionPreview(question.question_text)}
                    </h2>
                  </div>
                  <Badge variant={statusBadgeVariant(question.status)}>
                    {statusLabel(question.status)}
                  </Badge>
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3 xl:grid-cols-6">
                  <span>{difficultyLabel(question.difficulty)}</span>
                  <span>{bloomLevelLabel(question.bloom_level)}</span>
                  <span>{sourceTypeLabel(question.source_type)}</span>
                  <span>By {shortUserId(question.created_by)}</span>
                  <span>Created {formatDateTime(question.created_at)}</span>
                  <span>Updated {formatDateTime(question.updated_at)}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/questions/${question.id}/edit`}>
                      Edit / review
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
