import type { AppRole } from "@/lib/types";
import { SidebarNav } from "@/components/sidebar-nav";
import { AppFooter } from "@/components/app-footer";

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

        <AppFooter />
      </div>
    </div>
  );
}
