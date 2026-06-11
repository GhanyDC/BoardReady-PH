import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Flag,
  Layers3,
  Megaphone,
  ShieldCheck,
  SquarePen,
} from "lucide-react";

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
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AdminWorkflowCard = {
  title: string;
  description: string;
  helper: string;
  icon: typeof SquarePen;
  href: string;
  action: string;
  count?: number | null;
  countLabel?: string;
  tone?: "default" | "attention" | "success";
};

function countLabel(count: number | null | undefined, label: string) {
  const safeCount = count ?? 0;

  return `${safeCount} ${label}`;
}

function cardToneClassName(tone: AdminWorkflowCard["tone"]) {
  if (tone === "attention") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  return "bg-accent text-accent-foreground";
}

function buildAdminWorkflowCards(counts: {
  pendingReviewerSubmissions: number | null;
  publishedQuestions: number | null;
  draftQuestions: number | null;
  archivedQuestions: number | null;
  publishedMockExams: number | null;
  activeGroupGoals: number | null;
  publishedAnnouncements: number | null;
}): AdminWorkflowCard[] {
  return [
    {
      title: "Question Bank",
      description: "Create, review, publish, and archive verified questions.",
      helper: "Open the full bank with filters and review actions.",
      icon: SquarePen,
      href: "/admin/questions",
      action: "Open bank",
      count:
        (counts.publishedQuestions ?? 0) +
        (counts.draftQuestions ?? 0) +
        (counts.archivedQuestions ?? 0) +
        (counts.pendingReviewerSubmissions ?? 0),
      countLabel: "tracked questions",
    },
    {
      title: "Pending Reviewer Submissions",
      description: "Review reviewer-submitted items waiting for admin action.",
      helper: "Prioritize these before publishing more practice sets.",
      icon: Clock3,
      href: "/admin/questions?status=pending_review&source=reviewer_submitted",
      action: "Review pending",
      count: counts.pendingReviewerSubmissions,
      countLabel: "pending",
      tone: "attention",
    },
    {
      title: "Published Questions",
      description: "Questions currently available for drills and mock exams.",
      helper: "Check coverage before generating more mocks.",
      icon: CheckCircle2,
      href: "/admin/questions?status=published",
      action: "View published",
      count: counts.publishedQuestions,
      countLabel: "published",
      tone: "success",
    },
    {
      title: "Draft Questions",
      description: "In-progress questions that are not visible to reviewers.",
      helper: "Finish drafts or publish only when requirements are met.",
      icon: FileQuestion,
      href: "/admin/questions?status=draft",
      action: "View drafts",
      count: counts.draftQuestions,
      countLabel: "draft",
    },
    {
      title: "Subjects and Topics",
      description: "Manage the active exam track outline and topic hierarchy.",
      helper: "Keep weights and topics aligned before adding questions.",
      icon: Layers3,
      href: "/admin/subjects",
      action: "Manage outline",
    },
    {
      title: "Mock Exams",
      description: "Published-question exam sets for readiness checks.",
      helper: "Review draft and published mock exams.",
      icon: ShieldCheck,
      href: "/admin/mock-exams",
      action: "Open mocks",
      count: counts.publishedMockExams,
      countLabel: "published",
    },
    {
      title: "Group Progress",
      description: "Admin-only reviewer activity and readiness signals.",
      helper: "Monitor aggregate readiness without exposing private notes.",
      icon: BarChart3,
      href: "/admin/group-progress",
      action: "View progress",
    },
    {
      title: "Group Goals",
      description: "Aggregate accountability targets for the group.",
      helper: "Create or update active group targets.",
      icon: Flag,
      href: "/admin/group-goals",
      action: "Manage goals",
      count: counts.activeGroupGoals,
      countLabel: "active",
    },
    {
      title: "Announcements",
      description: "Private updates for the group.",
      helper: "Publish reviewer-facing updates for the active group.",
      icon: Megaphone,
      href: "/admin/announcements",
      action: "Manage announcements",
      count: counts.publishedAnnouncements,
      countLabel: "published",
    },
  ];
}

export default async function AdminPage() {
  const context = await requireAdminContext();
  const userName =
    context.profile?.full_name ?? context.user.email ?? "BoardReady PH admin";
  const { activeGroup, activeExamProgram, role } = context;
  const supabase = await createClient();
  const [
    { count: pendingReviewerSubmissions },
    { count: publishedQuestions },
    { count: draftQuestions },
    { count: archivedQuestions },
    { count: publishedMockExams },
    { count: activeGroupGoals },
    { count: publishedAnnouncements },
  ] = await Promise.all([
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("group_id", activeGroup.id)
      .eq("exam_program_id", activeExamProgram.id)
      .eq("status", "pending_review")
      .eq("source_type", "reviewer_submitted"),
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("group_id", activeGroup.id)
      .eq("exam_program_id", activeExamProgram.id)
      .eq("status", "published"),
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("group_id", activeGroup.id)
      .eq("exam_program_id", activeExamProgram.id)
      .eq("status", "draft"),
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("group_id", activeGroup.id)
      .eq("exam_program_id", activeExamProgram.id)
      .eq("status", "archived"),
    supabase
      .from("mock_exams")
      .select("id", { count: "exact", head: true })
      .eq("group_id", activeGroup.id)
      .eq("exam_program_id", activeExamProgram.id)
      .eq("status", "published"),
    supabase
      .from("group_goals")
      .select("id", { count: "exact", head: true })
      .eq("group_id", activeGroup.id)
      .eq("exam_program_id", activeExamProgram.id)
      .eq("status", "active"),
    supabase
      .from("group_announcements")
      .select("id", { count: "exact", head: true })
      .eq("group_id", activeGroup.id)
      .eq("exam_program_id", activeExamProgram.id)
      .eq("status", "published"),
  ]);
  const workflowCards = buildAdminWorkflowCards({
    pendingReviewerSubmissions,
    publishedQuestions,
    draftQuestions,
    archivedQuestions,
    publishedMockExams,
    activeGroupGoals,
    publishedAnnouncements,
  });

  return (
    <AppShell
      userName={userName}
      role={role}
      groupName={activeGroup.name}
      examProgramName={activeExamProgram.name}
    >
      <div className="space-y-8">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-primary">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Content command center
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Role-gated workflow for {activeExamProgram.name}. Review content,
              prepare mocks, manage group operations, and keep reviewer-facing
              material controlled.
            </p>
          </div>
          <div className="rounded-md border bg-card px-3 py-2 text-sm">
            <p className="font-medium">{activeGroup.name}</p>
            <p className="text-muted-foreground">{activeExamProgram.name}</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Published</CardTitle>
              <CardDescription>Question bank</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-normal">
                {publishedQuestions ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pending</CardTitle>
              <CardDescription>Reviewer submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-normal">
                {pendingReviewerSubmissions ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Drafts</CardTitle>
              <CardDescription>Unpublished questions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-normal">
                {draftQuestions ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Archived</CardTitle>
              <CardDescription>Retired questions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-normal">
                {archivedQuestions ?? 0}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {workflowCards.map((area) => {
            const Icon = area.icon;
            const cardCountLabel = area.countLabel
              ? countLabel(area.count, area.countLabel)
              : null;

            return (
              <Card key={area.title}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <CardTitle>{area.title}</CardTitle>
                    <CardDescription>{area.description}</CardDescription>
                  </div>
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-md ${cardToneClassName(
                      area.tone,
                    )}`}
                  >
                    <Icon aria-hidden="true" />
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {cardCountLabel ? (
                      <Badge variant="secondary">{cardCountLabel}</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {area.helper}
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-fit">
                    <Link href={area.href}>{area.action}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Suggested review order</CardTitle>
            <CardDescription>
              A simple content loop for private beta preparation.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-3">
            {[
              "Review pending and needs-revision submissions.",
              "Publish only complete questions with rationales.",
              "Check mock exam availability before inviting reviewers.",
            ].map((step, index) => (
              <div key={step} className="rounded-md border px-3 py-3">
                <p className="font-semibold">Step {index + 1}</p>
                <p className="mt-1 text-muted-foreground">{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
