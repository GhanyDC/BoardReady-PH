import { redirect } from "next/navigation";

import { requireMembership } from "@/lib/current-user";
import { canAccessAdmin } from "@/lib/roles";

export async function requireAdminContext() {
  const context = await requireMembership();

  if (
    !context.activeGroup ||
    !context.activeExamProgram ||
    !context.role ||
    !canAccessAdmin(context.role)
  ) {
    redirect("/dashboard");
  }

  return {
    ...context,
    activeGroup: context.activeGroup,
    activeExamProgram: context.activeExamProgram,
    role: context.role,
  };
}
