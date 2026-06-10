import Link from "next/link";
import { Megaphone, PlusCircle, Send } from "lucide-react";

import {
  createGroupAnnouncementAction,
  updateGroupAnnouncementSettingsAction,
} from "@/app/admin/announcements/actions";
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
  groupAnnouncementStatusBadgeVariant,
  groupAnnouncementStatusLabel,
  groupAnnouncementStatuses,
  groupAnnouncementVisibilities,
  groupAnnouncementVisibilityLabel,
} from "@/lib/group-announcements";
import { formatDateTime } from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

const textareaClassName =
  "min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export default async function AdminAnnouncementsPage() {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const { data: announcements, error } = await supabase
    .from("group_announcements")
    .select("*")
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .order("created_at", { ascending: false });
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
              Admin / Announcements
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Group announcements
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Publish group-scoped updates for reviewers, admins, or all members
              in {context.activeGroup.name}.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/group-progress">
              <Megaphone aria-hidden="true" />
              View group progress
            </Link>
          </Button>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Create announcement</CardTitle>
              <CardDescription>
                Published reviewer/all-member announcements appear on group
                progress.
              </CardDescription>
            </div>
            <PlusCircle className="size-5 text-primary" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <form
              action={createGroupAnnouncementAction}
              className="grid gap-4"
            >
              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    minLength={2}
                    maxLength={180}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <select
                    id="visibility"
                    name="visibility"
                    className={selectClassName}
                    defaultValue="reviewers"
                    required
                  >
                    {groupAnnouncementVisibilities.map((visibility) => (
                      <option key={visibility.value} value={visibility.value}>
                        {visibility.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    className={selectClassName}
                    defaultValue="draft"
                    required
                  >
                    {groupAnnouncementStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="body">Body</Label>
                <textarea
                  id="body"
                  name="body"
                  minLength={2}
                  maxLength={4000}
                  className={textareaClassName}
                  required
                />
              </div>

              <Button type="submit" className="w-fit">
                <Send aria-hidden="true" />
                Save announcement
              </Button>
            </form>
          </CardContent>
        </Card>

        {error ? (
          <Card>
            <CardHeader>
              <CardTitle>Announcements could not be loaded</CardTitle>
              <CardDescription>
                Try again after refreshing the page.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <section className="grid gap-4">
          {(announcements ?? []).length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No announcements yet</CardTitle>
                <CardDescription>
                  Create a draft or publish the first group update.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {(announcements ?? []).map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={groupAnnouncementStatusBadgeVariant(
                        announcement.status,
                      )}
                    >
                      {groupAnnouncementStatusLabel(announcement.status)}
                    </Badge>
                    <Badge variant="secondary">
                      {groupAnnouncementVisibilityLabel(
                        announcement.visibility,
                      )}
                    </Badge>
                  </div>
                  <CardTitle>{announcement.title}</CardTitle>
                  <CardDescription>
                    Created {formatDateTime(announcement.created_at)}
                    {announcement.published_at
                      ? ` / Published ${formatDateTime(
                          announcement.published_at,
                        )}`
                      : ""}
                  </CardDescription>
                </div>
                <Megaphone className="size-5 text-primary" aria-hidden="true" />
              </CardHeader>
              <CardContent className="grid gap-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {announcement.body}
                </p>

                <form
                  action={updateGroupAnnouncementSettingsAction}
                  className="grid gap-4 rounded-md border px-3 py-3 md:grid-cols-[1fr_1fr_auto] md:items-end"
                >
                  <input
                    type="hidden"
                    name="announcementId"
                    value={announcement.id}
                  />
                  <div className="grid gap-2">
                    <Label htmlFor={`visibility-${announcement.id}`}>
                      Visibility
                    </Label>
                    <select
                      id={`visibility-${announcement.id}`}
                      name="visibility"
                      className={selectClassName}
                      defaultValue={announcement.visibility}
                    >
                      {groupAnnouncementVisibilities.map((visibility) => (
                        <option key={visibility.value} value={visibility.value}>
                          {visibility.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`status-${announcement.id}`}>Status</Label>
                    <select
                      id={`status-${announcement.id}`}
                      name="status"
                      className={selectClassName}
                      defaultValue={announcement.status}
                    >
                      {groupAnnouncementStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" size="sm">
                    Update
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
