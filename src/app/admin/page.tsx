import { redirect } from "next/navigation";
import { Megaphone, NotebookTabs, ShieldCheck, SquarePen } from "lucide-react";

import { AppShell } from "@/components/app-shell";
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
  },
  {
    title: "Subjects and topics",
    description: "Group-scoped board outline management.",
    icon: NotebookTabs,
  },
  {
    title: "Mock exams",
    description: "Published-question exam sets for readiness checks.",
    icon: ShieldCheck,
  },
  {
    title: "Announcements",
    description: "Private updates for the group.",
    icon: Megaphone,
  },
];

export default async function AdminPage() {
  const context = await requireMembership();
  const userName =
    context.profile?.full_name ?? context.user.email ?? "BoardReady PH admin";

  if (!canAccessAdmin(context.membership.role)) {
    redirect("/dashboard");
  }

  return (
    <AppShell
      userName={userName}
      role={context.membership.role}
      groupName={context.membership.group.name}
      examProgramName={context.membership.examProgram.name}
    >
      <div className="space-y-8">
        <section>
          <p className="text-sm font-medium uppercase text-primary">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Group administration
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Sprint 1 verifies role-gated access for{" "}
            {context.membership.examProgram.name} and reserves management areas
            for the next build phase.
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
                  Foundation ready
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
