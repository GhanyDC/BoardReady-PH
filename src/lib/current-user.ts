import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { AppRole, Database } from "@/lib/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Group = Pick<
  Database["public"]["Tables"]["groups"]["Row"],
  "id" | "name" | "exam_program_id"
>;
type ExamProgram = Pick<
  Database["public"]["Tables"]["exam_programs"]["Row"],
  "id" | "name" | "slug" | "exam_type" | "country"
>;
type Membership = Pick<
  Database["public"]["Tables"]["group_members"]["Row"],
  "group_id" | "role" | "joined_at"
>;

type ActiveContext = {
  activeGroup: Group;
  activeExamProgram: ExamProgram;
  activeMembership: Membership | null;
  role: AppRole;
};

export type CurrentUserContext = {
  user: User;
  profile: Profile | null;
  activeGroup: Group | null;
  activeExamProgram: ExamProgram | null;
  activeMembership: Membership | null;
  allMemberships: Membership[];
  role: AppRole | null;
  membership: {
    group: Group;
    examProgram: ExamProgram;
    role: AppRole;
  } | null;
};

function choosePrimaryMembership(memberships: Membership[]) {
  return (
    memberships.find((membership) => membership.role === "super_admin") ??
    memberships.find((membership) => membership.role === "admin") ??
    memberships[0] ??
    null
  );
}

function isGlobalSuperAdmin(memberships: Membership[]) {
  return memberships.some((membership) => membership.role === "super_admin");
}

async function loadGroupContext(
  groupId: string,
  memberships: Membership[],
): Promise<ActiveContext | null> {
  const activeMembership =
    memberships.find((membership) => membership.group_id === groupId) ?? null;
  const canUseGroup = Boolean(activeMembership) || isGlobalSuperAdmin(memberships);

  if (!canUseGroup) {
    return null;
  }

  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, exam_program_id")
    .eq("id", groupId)
    .maybeSingle();

  if (!group) {
    return null;
  }

  const { data: examProgram } = await supabase
    .from("exam_programs")
    .select("id, name, slug, exam_type, country")
    .eq("id", group.exam_program_id)
    .maybeSingle();

  if (!examProgram) {
    return null;
  }

  return {
    activeGroup: group,
    activeExamProgram: examProgram,
    activeMembership,
    role: activeMembership?.role ?? "super_admin",
  };
}

async function setCurrentGroup(userId: string, groupId: string) {
  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({ current_group_id: groupId })
    .eq("id", userId);
}

export async function getCurrentUserContext(): Promise<CurrentUserContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("group_members")
      .select("group_id, role, joined_at")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: true }),
  ]);

  const allMemberships = memberships ?? [];
  const preferredContext = profile?.current_group_id
    ? await loadGroupContext(profile.current_group_id, allMemberships)
    : null;

  const fallbackMembership = preferredContext
    ? null
    : choosePrimaryMembership(allMemberships);
  const fallbackContext = fallbackMembership
    ? await loadGroupContext(fallbackMembership.group_id, allMemberships)
    : null;

  const activeContext = preferredContext ?? fallbackContext;

  if (!activeContext) {
    return {
      user,
      profile,
      activeGroup: null,
      activeExamProgram: null,
      activeMembership: null,
      allMemberships,
      role: null,
      membership: null,
    };
  }

  if (!preferredContext && fallbackContext) {
    await setCurrentGroup(user.id, fallbackContext.activeGroup.id);
  }

  return {
    user,
    profile,
    activeGroup: activeContext.activeGroup,
    activeExamProgram: activeContext.activeExamProgram,
    activeMembership: activeContext.activeMembership,
    allMemberships,
    role: activeContext.role,
    membership: {
      group: activeContext.activeGroup,
      examProgram: activeContext.activeExamProgram,
      role: activeContext.role,
    },
  };
}

export async function requireCurrentUser() {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/login");
  }

  return context;
}

export async function requireMembership() {
  const context = await requireCurrentUser();

  if (!context.membership) {
    redirect("/onboarding");
  }

  return {
    ...context,
    membership: context.membership,
  };
}
