import Link from "next/link";
import {
  BookOpenCheck,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
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
    },
    {
      href: "/admin",
      label: "Admin",
      icon: ShieldCheck,
      show: canAccessAdmin(role),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground"
              aria-label="BoardReady PH dashboard"
            >
              <BookOpenCheck aria-hidden="true" />
            </Link>
            <div>
              <p className="font-semibold leading-none">BoardReady PH</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {examProgramName} | {groupName}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <nav className="flex items-center gap-1" aria-label="Primary">
              {navItems
                .filter((item) => item.show)
                .map((item) => {
                  const Icon = item.icon;

                  return (
                    <Button key={item.href} variant="ghost" asChild>
                      <Link href={item.href}>
                        <Icon aria-hidden="true" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
            </nav>

            <div className="flex items-center gap-3 border-t pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{userName}</p>
                <Badge variant="secondary">{formatRole(role)}</Badge>
              </div>
              <form action={signOutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut aria-hidden="true" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>

      <footer className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 pb-8 text-sm text-muted-foreground sm:px-6">
        <ClipboardList className="size-4" aria-hidden="true" />
        Private exam-prep workspace
      </footer>
    </div>
  );
}
