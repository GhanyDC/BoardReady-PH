import Link from "next/link";
import { Layers3, PlusCircle } from "lucide-react";

import {
  createTopicAction,
  setTopicActiveAction,
  updateTopicAction,
} from "@/app/admin/topics/actions";
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

export default async function AdminTopicsPage() {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const [{ data: subjects, error: subjectsError }, { data: topics, error }] =
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
  const subjectNameById = new Map(
    (subjects ?? []).map((subject) => [subject.id, subject.name]),
  );
  const activeSubjects = (subjects ?? []).filter((subject) => subject.is_active);
  const topicsBySubject = new Map<string, NonNullable<typeof topics>>();
  const totalTopicCount = (topics ?? []).length;
  const activeTopicCount = (topics ?? []).filter((topic) => topic.is_active).length;

  for (const topic of topics ?? []) {
    const current = topicsBySubject.get(topic.subject_id) ?? [];
    current.push(topic);
    topicsBySubject.set(topic.subject_id, current);
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
              Admin / Topics
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Topic management
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Create, order, and archive topics for{" "}
              {context.activeExamProgram.name}. Topics inherit the active group
              and exam track through their subject.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/subjects">
              <Layers3 aria-hidden="true" />
              View subjects
            </Link>
          </Button>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Exam track</CardTitle>
              <CardDescription>{context.activeGroup.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold leading-6">
                {context.activeExamProgram.name}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active subjects</CardTitle>
              <CardDescription>Eligible for new topics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-normal">
                {activeSubjects.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Topics</CardTitle>
              <CardDescription>Active / total</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-normal">
                {activeTopicCount} / {totalTopicCount}
              </p>
            </CardContent>
          </Card>
        </section>

        {subjectsError || error ? (
          <Card>
            <CardHeader>
              <CardTitle>Topics could not be loaded</CardTitle>
              <CardDescription>
                {subjectsError?.message ?? error?.message}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Create topic</CardTitle>
              <CardDescription>
                New topics require an active subject in the current exam track.
              </CardDescription>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <PlusCircle aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <form
              action={createTopicAction}
              className="grid gap-4 md:grid-cols-[1.1fr_1fr_160px_auto] md:items-end"
            >
              <div className="grid gap-2">
                <Label htmlFor="subjectId">Subject</Label>
                <select
                  id="subjectId"
                  name="subjectId"
                  disabled={activeSubjects.length === 0}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  required
                >
                  <option value="">
                    {activeSubjects.length === 0
                      ? "No active subjects"
                      : "Choose subject"}
                  </option>
                  {activeSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Topic name</Label>
                <Input
                  id="name"
                  name="name"
                  minLength={2}
                  maxLength={140}
                  placeholder="Example: Psychological testing ethics"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Display order</Label>
                <Input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  min={0}
                  max={1000}
                  defaultValue={0}
                  required
                />
              </div>
              <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm md:self-end">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked
                  className="size-4 accent-primary"
                />
                Active
              </label>
              <Button
                type="submit"
                disabled={activeSubjects.length === 0}
                className="md:col-span-4 md:w-fit"
              >
                Create topic
              </Button>
            </form>
            {activeSubjects.length === 0 ? (
              <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Activate or create a subject before adding topics.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <section className="grid gap-4">
          {(subjects ?? []).length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No subjects yet</CardTitle>
                <CardDescription>
                  Add subjects before creating topics for this exam track.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {(subjects ?? []).map((subject) => {
            const subjectTopics = topicsBySubject.get(subject.id) ?? [];

            return (
              <Card key={subject.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1.5">
                    <CardTitle>{subject.name}</CardTitle>
                  <CardDescription>
                      {subject.board_weight}% board weight / display order{" "}
                      {subject.sort_order} / {subjectTopics.length} topic
                      {subjectTopics.length === 1 ? "" : "s"}
                  </CardDescription>
                </div>
                  <Badge variant={subject.is_active ? "default" : "secondary"}>
                    {subject.is_active ? "Active subject" : "Inactive subject"}
                </Badge>
              </CardHeader>
              <CardContent className="grid gap-4">
                  {subjectTopics.length === 0 ? (
                    <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                      No topics yet for this subject.
                    </p>
                  ) : null}

                  {subjectTopics.map((topic) => (
                    <div key={topic.id} className="grid gap-4 rounded-md border p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-medium">{topic.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {subjectNameById.get(topic.subject_id) ??
                              "Inactive subject"}{" "}
                            / display order {topic.sort_order}
                          </p>
                        </div>
                        <Badge variant={topic.is_active ? "default" : "secondary"}>
                          {topic.is_active ? "Active topic" : "Archived topic"}
                        </Badge>
                      </div>

                      <form
                        action={updateTopicAction}
                        className="grid gap-4 lg:grid-cols-[1fr_1.1fr_140px_auto] lg:items-end"
                      >
                        <input type="hidden" name="topicId" value={topic.id} />
                        <div className="grid gap-2">
                          <Label htmlFor={`subject-${topic.id}`}>Subject</Label>
                          <select
                            id={`subject-${topic.id}`}
                            name="subjectId"
                            defaultValue={topic.subject_id}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            required
                          >
                            {(subjects ?? []).map((subjectOption) => (
                              <option
                                key={subjectOption.id}
                                value={subjectOption.id}
                              >
                                {subjectOption.name}
                                {subjectOption.is_active ? "" : " (inactive)"}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`name-${topic.id}`}>Topic name</Label>
                          <Input
                            id={`name-${topic.id}`}
                            name="name"
                            defaultValue={topic.name}
                            minLength={2}
                            maxLength={140}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`order-${topic.id}`}>Order</Label>
                          <Input
                            id={`order-${topic.id}`}
                            name="sortOrder"
                            type="number"
                            min={0}
                            max={1000}
                            defaultValue={topic.sort_order}
                            required
                          />
                        </div>
                        <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm lg:self-end">
                          <input
                            type="checkbox"
                            name="isActive"
                            defaultChecked={topic.is_active}
                            className="size-4 accent-primary"
                          />
                          Active
                        </label>
                        <Button type="submit" className="lg:col-span-4 lg:w-fit">
                          Save topic
                        </Button>
                      </form>

                      <form action={setTopicActiveAction}>
                        <input type="hidden" name="topicId" value={topic.id} />
                        <input
                          type="hidden"
                          name="isActive"
                          value={topic.is_active ? "false" : "true"}
                        />
                        <Button type="submit" variant="outline" size="sm">
                          {topic.is_active ? "Archive topic" : "Restore topic"}
                        </Button>
                      </form>
                    </div>
                  ))}
              </CardContent>
            </Card>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
