"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminContext } from "@/lib/admin-auth";
import {
  groupGoalStatusValues,
  groupGoalTypeValues,
} from "@/lib/group-goals";
import { createClient } from "@/lib/supabase/server";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const createGoalSchema = z
  .object({
    title: z.string().trim().min(2).max(180),
    description: z
      .string()
      .trim()
      .max(2000)
      .transform((value) => (value.length > 0 ? value : null)),
    goalType: z.enum(groupGoalTypeValues),
    targetValue: z.coerce.number().int().min(1).max(100000),
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    status: z.enum(groupGoalStatusValues),
  })
  .refine((goal) => goal.endDate >= goal.startDate, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
  });

const updateGoalStatusSchema = z.object({
  goalId: z.string().uuid(),
  status: z.enum(groupGoalStatusValues),
});

function revalidateGoalViews() {
  revalidatePath("/admin/group-goals");
  revalidatePath("/admin/group-progress");
  revalidatePath("/group-progress");
}

export async function createGroupGoalAction(formData: FormData) {
  const parsed = createGoalSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    goalType: formData.get("goalType"),
    targetValue: formData.get("targetValue"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    throw new Error("Invalid group goal details.");
  }

  const context = await requireAdminContext();
  const supabase = await createClient();
  const { error } = await supabase.from("group_goals").insert({
    group_id: context.activeGroup.id,
    exam_program_id: context.activeExamProgram.id,
    title: parsed.data.title,
    description: parsed.data.description,
    goal_type: parsed.data.goalType,
    target_value: parsed.data.targetValue,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate,
    status: parsed.data.status,
    created_by: context.user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateGoalViews();
}

export async function updateGroupGoalStatusAction(formData: FormData) {
  const parsed = updateGoalStatusSchema.safeParse({
    goalId: formData.get("goalId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    throw new Error("Invalid group goal status.");
  }

  const context = await requireAdminContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("group_goals")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.goalId)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateGoalViews();
}
