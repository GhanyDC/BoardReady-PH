import {
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  BookOpenText,
  ClipboardList,
  Flag,
  Layers3,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  MessageSquarePlus,
  NotebookTabs,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  SquarePen,
  Target,
  Timer,
  Users,
} from "lucide-react";

import { canAccessAdmin } from "@/lib/roles";
import type { AppRole } from "@/lib/types";

import { SidebarNav, type NavItem } from "@/components/sidebar-nav";

type AppShellProps = {
  userName: string;
  role: AppRole;
  groupName: string;
  examProgramName: string;
  children: React.ReactNode;
};

export function AppShell({
  userName,
  role,
  groupName,
  examProgramName,
  children,
}: AppShellProps) {
  const navItems: NavItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      show: true,
      group: "reviewer",
    },
    {
      href: "/readiness",
      label: "Readiness",
      icon: ListChecks,
      show: true,
      group: "reviewer",
    },
    {
      href: "/group-progress",
      label: "Group Progress",
      icon: Users,
      show: true,
      group: "reviewer",
    },
    {
      href: "/practice",
      label: "Practice",
      icon: Target,
      show: true,
      group: "reviewer",
    },
    {
      href: "/mock-exams",
      label: "Mock Exams",
      icon: ClipboardCheck,
      show: true,
      group: "reviewer",
    },
    {
      href: "/missed-questions",
      label: "Missed Questions",
      icon: RotateCcw,
      show: true,
      group: "reviewer",
    },
    {
      href: "/weak-areas",
      label: "Weak Areas",
      icon: AlertTriangle,
      show: true,
      group: "reviewer",
    },
    {
      href: "/analytics",
      label: "Analytics",
      icon: BarChart3,
      show: true,
      group: "reviewer",
    },
    {
      href: "/external-drills",
      label: "External Drills",
      icon: ClipboardList,
      show: true,
      group: "reviewer",
    },
    {
      href: "/external-drills/new",
      label: "Log External Drill",
      icon: SquarePen,
      show: true,
      group: "reviewer",
    },
    {
      href: "/study-timer",
      label: "Study Timer",
      icon: Timer,
      show: true,
      group: "reviewer",
    },
    {
      href: "/study-logs",
      label: "Study Logs",
      icon: BookOpenText,
      show: true,
      group: "reviewer",
    },
    {
      href: "/study-habits",
      label: "Study Habits",
      icon: SlidersHorizontal,
      show: true,
      group: "reviewer",
    },
    {
      href: "/submit-question",
      label: "Submit Question",
      icon: MessageSquarePlus,
      show: !canAccessAdmin(role),
      group: "reviewer",
    },
    {
      href: "/admin/questions",
      label: "Question Bank",
      icon: NotebookTabs,
      show: canAccessAdmin(role),
      group: "admin",
    },
    {
      href: "/admin/mock-exams",
      label: "Manage Mock Exams",
      icon: ClipboardCheck,
      show: canAccessAdmin(role),
      group: "admin",
    },
    {
      href: "/admin/subjects",
      label: "Subjects/Topics",
      icon: Layers3,
      show: canAccessAdmin(role),
      group: "admin",
    },
    {
      href: "/admin/group-progress",
      label: "Admin Progress",
      icon: BarChart3,
      show: canAccessAdmin(role),
      group: "admin",
    },
    {
      href: "/admin/group-goals",
      label: "Group Goals",
      icon: Flag,
      show: canAccessAdmin(role),
      group: "admin",
    },
    {
      href: "/admin/announcements",
      label: "Announcements",
      icon: Megaphone,
      show: canAccessAdmin(role),
      group: "admin",
    },
    {
      href: "/admin",
      label: "Admin Dashboard",
      icon: ShieldCheck,
      show: canAccessAdmin(role),
      group: "admin",
    },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SidebarNav
        navItems={navItems}
        userName={userName}
        role={role}
        groupName={groupName}
        examProgramName={examProgramName}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>

        <footer className="mx-auto flex w-full max-w-[1440px] items-center gap-2 px-4 pb-8 pt-4 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <ClipboardList className="size-4" aria-hidden="true" />
          Private exam-prep workspace
        </footer>
      </div>
    </div>
  );
}
