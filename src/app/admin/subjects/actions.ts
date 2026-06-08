"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminContext } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

const subjectSchema = z.object({
  subjectId: z.string().uuid(),
  boardWeight: z.coerce.number().int().min(0).max(100),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  isActive: z.boolean(),
});

function checked(value: FormDataEntryValue | null) {
  return value === "on";
}

export async function updateSubjectAction(formData: FormData) {
  const parsed = subjectSchema.safeParse({
    subjectId: formData.get("subjectId"),
    boardWeight: formData.get("boardWeight"),
    sortOrder: formData.get("sortOrder"),
    isActive: checked(formData.get("isActive")),
  });

  if (!parsed.success) {
    throw new Error("Invalid subject update.");
  }

  const context = await requireAdminContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("subjects")
    .update({
      board_weight: parsed.data.boardWeight,
      sort_order: parsed.data.sortOrder,
      is_active: parsed.data.isActive,
    })
    .eq("id", parsed.data.subjectId)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/subjects");
  revalidatePath("/admin/topics");
  revalidatePath("/dashboard");
}
