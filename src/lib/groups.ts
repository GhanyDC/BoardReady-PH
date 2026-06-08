import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types";

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

export type SwitchCurrentGroupResult = {
  activeGroup: Group;
  activeExamProgram: ExamProgram;
  activeMembership: Membership;
};

export async function switchCurrentGroup(
  groupId: string,
): Promise<SwitchCurrentGroupResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authentication is required.");
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id, role, joined_at")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    throw new Error("You do not belong to this group.");
  }

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, exam_program_id")
    .eq("id", groupId)
    .maybeSingle();

  if (!group) {
    throw new Error("Group not found.");
  }

  const { data: examProgram } = await supabase
    .from("exam_programs")
    .select("id, name, slug, exam_type, country")
    .eq("id", group.exam_program_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!examProgram) {
    throw new Error("This group is not connected to an active exam track.");
  }

  const { error: updateError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      current_group_id: group.id,
    },
    {
      onConflict: "id",
    },
  );

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    activeGroup: group,
    activeExamProgram: examProgram,
    activeMembership: membership,
  };
}
