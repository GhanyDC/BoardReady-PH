import Image from "next/image";
import Link from "next/link";
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
  LogOut,
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

import { signOutAction } from "@/app/auth/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { canAccessAdmin, formatRole } from "@/lib/roles";
import type { AppRole } from "@/lib/types";

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
  const navItems = [
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

  const reviewerNav = navItems.filter((i) => i.show && i.group === "reviewer");
  const adminNav = navItems.filter((i) => i.show && i.group === "admin");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary text-primary-foreground shadow-sm"
                aria-label="BoardReady PH dashboard"
              >
                <Image
                  src="/logo.png"
                  alt="BoardReady PH Logo"
                  fill
                  className="object-cover dark:hidden"
                  priority
                />
                <Image
                  src="/logo-dark.png"
                  alt="BoardReady PH Logo"
                  fill
                  className="hidden object-cover dark:block"
                  priority
                />
              </Link>
              <div className="min-w-0">
                <p className="truncate font-semibold leading-none">BoardReady PH</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {examProgramName} | {groupName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <Badge variant="secondary" className="hidden sm:inline-flex">{formatRole(role)}</Badge>
              <form action={signOutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </Button>
              </form>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
            <nav 
              className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin lg:pb-0" 
              aria-label="Primary"
            >
              <div className="flex items-center gap-1 px-1">
                {reviewerNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button key={item.href} variant="ghost" size="sm" className="shrink-0 h-9" asChild>
                      <Link href={item.href}>
                        <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
                
                {adminNav.length > 0 && (
                  <>
                    <div className="mx-2 h-6 w-px shrink-0 bg-border" aria-hidden="true" />
                    <Badge variant="outline" className="mr-1 shrink-0 bg-muted">Admin</Badge>
                    {adminNav.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Button key={item.href} variant="ghost" size="sm" className="shrink-0 h-9" asChild>
                          <Link href={item.href}>
                            <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                            {item.label}
                          </Link>
                        </Button>
                      );
                    })}
                  </>
                )}
              </div>
            </nav>

            <div className="hidden items-center gap-3 border-l pl-4 lg:flex">
              <div className="min-w-0 text-right">
                <p className="truncate text-sm font-medium">{userName}</p>
                <Badge variant="secondary" className="mt-0.5">{formatRole(role)}</Badge>
              </div>
              <form action={signOutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>

      <footer className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 pb-8 text-sm text-muted-foreground sm:px-6">
        <ClipboardList className="size-4" aria-hidden="true" />
        Private exam-prep workspace
      </footer>
    </div>
  );
}
