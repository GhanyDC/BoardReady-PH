import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Flag,
  Megaphone,
  NotebookTabs,
  ShieldCheck,
  SquarePen,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireMembership } from "@/lib/current-user";
import { canAccessAdmin } from "@/lib/roles";

export const dynamic = "force-dynamic";

const adminAreas = [
  {
    title: "Question bank",
    description: "Admin-authored and reviewer-submitted questions.",
    icon: SquarePen,
    href: "/admin/questions",
  },
  {
    title: "Subjects and topics",
    description: "Group-scoped board outline management.",
    icon: NotebookTabs,
    href: "/admin/subjects",
  },
  {
    title: "Mock exams",
    description: "Published-question exam sets for readiness checks.",
    icon: ShieldCheck,
    href: "/admin/mock-exams",
  },
  {
    title: "Group progress",
    description: "Admin-only reviewer activity and readiness signals.",
    icon: BarChart3,
    href: "/admin/group-progress",
  },
  {
    title: "Group goals",
    description: "Aggregate accountability targets for the group.",
    icon: Flag,
    href: "/admin/group-goals",
  },
  {
    title: "Announcements",
    description: "Private updates for the group.",
    icon: Megaphone,
    href: "/admin/announcements",
  },
];

export default async function AdminPage() {
  const context = await requireMembership();
  const userName =
    context.profile?.full_name ?? context.user.email ?? "BoardReady PH admin";
  const { activeGroup, activeExamProgram, role } = context;

  if (!activeGroup || !activeExamProgram || !role || !canAccessAdmin(role)) {
    redirect("/dashboard");
  }

  return (
    <AppShell
      userName={userName}
      role={role}
      groupName={activeGroup.name}
      examProgramName={activeExamProgram.name}
    >
      <div className="space-y-8">
        <section>
          <p className="text-sm font-medium uppercase text-primary">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Group administration
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Role-gated management for {activeExamProgram.name}, including
            content, mock exams, group progress, goals, and announcements.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {adminAreas.map((area) => {
            const Icon = area.icon;

            return (
              <Card key={area.title}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <CardTitle>{area.title}</CardTitle>
                    <CardDescription>{area.description}</CardDescription>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <Icon aria-hidden="true" />
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {area.href ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={area.href}>Open</Link>
                    </Button>
                  ) : (
                    "Reserved for a later sprint"
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
