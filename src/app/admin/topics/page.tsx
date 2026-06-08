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
        .eq("is_active", true)
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
              {context.activeExamProgram.name}.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/subjects">
              <Layers3 aria-hidden="true" />
              View subjects
            </Link>
          </Button>
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
                New topics are scoped to the active group and exam track.
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  required
                >
                  <option value="">Choose subject</option>
                  {(subjects ?? []).map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Topic name</Label>
                <Input id="name" name="name" minLength={2} maxLength={140} required />
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
              <Button type="submit" className="md:col-span-4 md:w-fit">
                Create topic
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4">
          {(topics ?? []).length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No topics yet</CardTitle>
                <CardDescription>
                  Create topics before building questions for this exam track.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {(topics ?? []).map((topic) => (
            <Card key={topic.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <CardTitle>{topic.name}</CardTitle>
                  <CardDescription>
                    {subjectNameById.get(topic.subject_id) ?? "Inactive subject"}{" "}
                    / display order {topic.sort_order}
                  </CardDescription>
                </div>
                <Badge variant={topic.is_active ? "default" : "secondary"}>
                  {topic.is_active ? "Active" : "Archived"}
                </Badge>
              </CardHeader>
              <CardContent className="grid gap-4">
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
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      required
                    >
                      {(subjects ?? []).map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
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
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
