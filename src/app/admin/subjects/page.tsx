import Link from "next/link";
import { BookOpenText, Layers3 } from "lucide-react";

import { updateSubjectAction } from "@/app/admin/subjects/actions";
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
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminSubjectsPage() {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const [{ data: subjects, error: subjectsError }, { data: topics }] =
    await Promise.all([
      supabase
        .from("subjects")
        .select("id, name, board_weight, sort_order, is_active")
        .eq("group_id", context.activeGroup.id)
        .eq("exam_program_id", context.activeExamProgram.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("topics")
        .select("id, subject_id, name, sort_order, is_active")
        .eq("group_id", context.activeGroup.id)
        .order("sort_order", { ascending: true }),
    ]);
  const userName =
    context.profile?.full_name ?? context.user.email ?? "BoardReady PH admin";
  const topicsBySubject = new Map<string, NonNullable<typeof topics>>();

  for (const topic of topics ?? []) {
    const current = topicsBySubject.get(topic.subject_id) ?? [];
    current.push(topic);
    topicsBySubject.set(topic.subject_id, current);
  }

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
              Admin / Subjects
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Subject outline
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Manage subject weights and display order for{" "}
              {context.activeExamProgram.name}.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/topics">
              <Layers3 aria-hidden="true" />
              Manage topics
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

        <section className="grid gap-4">
          {(subjects ?? []).length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No subjects yet</CardTitle>
                <CardDescription>
                  Add subjects for this exam track before creating topics or
                  questions.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {(subjects ?? []).map((subject) => (
            <Card key={subject.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <CardTitle>{subject.name}</CardTitle>
                  <CardDescription>
                    {subject.board_weight}% board weight / display order{" "}
                    {subject.sort_order}
                  </CardDescription>
                </div>
                <Badge variant={subject.is_active ? "default" : "secondary"}>
                  {subject.is_active ? "Active" : "Archived"}
                </Badge>
              </CardHeader>
              <CardContent className="grid gap-5">
                <form
                  action={updateSubjectAction}
                  className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
                >
                  <input type="hidden" name="subjectId" value={subject.id} />
                  <div className="grid gap-2">
                    <Label htmlFor={`boardWeight-${subject.id}`}>
                      Board weight
                    </Label>
                    <Input
                      id={`boardWeight-${subject.id}`}
                      name="boardWeight"
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={subject.board_weight}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`sortOrder-${subject.id}`}>
                      Display order
                    </Label>
                    <Input
                      id={`sortOrder-${subject.id}`}
                      name="sortOrder"
                      type="number"
                      min={0}
                      max={1000}
                      defaultValue={subject.sort_order}
                      required
                    />
                  </div>
                  <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm md:self-end">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={subject.is_active}
                      className="size-4 accent-primary"
                    />
                    Active
                  </label>
                  <Button type="submit" className="md:col-span-3 md:w-fit">
                    Save subject
                  </Button>
                </form>

                <div className="grid gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <BookOpenText className="size-4" aria-hidden="true" />
                    Topics
                  </div>
                  {(topicsBySubject.get(subject.id) ?? []).length === 0 ? (
                    <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                      No topics yet.
                    </p>
                  ) : null}
                  {(topicsBySubject.get(subject.id) ?? []).map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                    >
                      <span>{topic.name}</span>
                      <Badge variant={topic.is_active ? "outline" : "secondary"}>
                        {topic.is_active ? "Active" : "Archived"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
