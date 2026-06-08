import type { AppRole } from "@/lib/types";

export function formatRole(role: AppRole) {
  const labels: Record<AppRole, string> = {
    reviewer: "Reviewer",
    admin: "Admin",
    super_admin: "Super Admin",
  };

  return labels[role];
}

export function canAccessAdmin(role: AppRole) {
  return role === "admin" || role === "super_admin";
}
