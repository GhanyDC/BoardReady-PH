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

export type CurrentUserContext = {
  user: User;
  profile: Profile | null;
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

  const primaryMembership = choosePrimaryMembership(memberships ?? []);

  if (!primaryMembership) {
    return {
      user,
      profile,
      membership: null,
    };
  }

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, exam_program_id")
    .eq("id", primaryMembership.group_id)
    .maybeSingle();

  const { data: examProgram } = group
    ? await supabase
        .from("exam_programs")
        .select("id, name, slug, exam_type, country")
        .eq("id", group.exam_program_id)
        .maybeSingle()
    : { data: null };

  return {
    user,
    profile,
    membership: group && examProgram
      ? {
          group,
          examProgram,
          role: primaryMembership.role,
        }
      : null,
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
