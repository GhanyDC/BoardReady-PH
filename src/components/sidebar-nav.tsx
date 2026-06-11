"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";

import { signOutAction } from "@/app/auth/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRole } from "@/lib/roles";
import type { AppRole } from "@/lib/types";

import type { ElementType } from "react";

export type NavItem = {
  href: string;
  label: string;
  icon: ElementType;
  show: boolean;
  group: "reviewer" | "admin";
};

type SidebarNavProps = {
  navItems: NavItem[];
  userName: string;
  role: AppRole;
  groupName: string;
  examProgramName: string;
};

export function SidebarNav({
  navItems,
  userName,
  role,
  groupName,
  examProgramName,
}: SidebarNavProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const timer = setTimeout(() => setIsMobileMenuOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const reviewerNav = navItems.filter((i) => i.show && i.group === "reviewer");
  const adminNav = navItems.filter((i) => i.show && i.group === "admin");

  const renderNavLinks = () => (
    <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Primary">
      <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Reviewer
      </div>
      {reviewerNav.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Button
            key={item.href}
            variant={isActive ? "secondary" : "ghost"}
            className={`justify-start ${
              isActive ? "font-semibold" : "font-normal"
            }`}
            asChild
          >
            <Link href={item.href}>
              <Icon className="mr-3 h-4 w-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          </Button>
        );
      })}

      {adminNav.length > 0 && (
        <>
          <div className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Admin
          </div>
          {adminNav.map((item) => {
            const Icon = item.icon;
            // Precise matching for admin dashboard, prefix matching for sub-routes
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={`justify-start ${
                  isActive ? "font-semibold" : "font-normal"
                }`}
                asChild
              >
                <Link href={item.href}>
                  <Icon className="mr-3 h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </>
      )}
    </nav>
  );

  const renderUserInfo = () => (
    <div className="flex items-center justify-between border-t p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{userName}</p>
        <Badge variant="secondary" className="mt-1">
          {formatRole(role)}
        </Badge>
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
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on <lg) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
          <Link
            href="/dashboard"
            className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary shadow-sm"
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
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="px-6 pb-2 pt-5">
            <p className="truncate text-sm font-medium">{examProgramName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {groupName}
            </p>
          </div>
          {renderNavLinks()}
        </div>

        {renderUserInfo()}
      </aside>

      {/* Mobile/Tablet Header (hidden on >=lg) */}
      <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between border-b bg-card px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 h-10 w-10"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={isMobileMenuOpen}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
          <Link
            href="/dashboard"
            className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary shadow-sm"
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
          <div className="min-w-0 max-w-[150px] sm:max-w-xs">
            <p className="truncate font-semibold leading-none text-sm">
              BoardReady PH
            </p>
          </div>
        </div>
      </header>

      {/* Mobile Slide-out Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-card shadow-xl transition-transform duration-300 ease-in-out">
            <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary shadow-sm">
                  <Image
                    src="/logo.png"
                    alt="BoardReady PH Logo"
                    fill
                    className="object-cover dark:hidden"
                  />
                  <Image
                    src="/logo-dark.png"
                    alt="BoardReady PH Logo"
                    fill
                    className="hidden object-cover dark:block"
                  />
                </div>
                <span className="font-semibold text-lg">Menu</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="-mr-2 h-10 w-10"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-6 pb-2 pt-5">
                <p className="truncate text-sm font-medium">{examProgramName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {groupName}
                </p>
              </div>
              {renderNavLinks()}
            </div>

            {renderUserInfo()}
          </div>
        </div>
      )}
    </>
  );
}
