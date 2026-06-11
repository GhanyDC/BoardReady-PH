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

import { SidebarNav } from "@/components/sidebar-nav";

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
  return (
    <div className="flex min-h-screen w-full bg-background">
      <SidebarNav
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
