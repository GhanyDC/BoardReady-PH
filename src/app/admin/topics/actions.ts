"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminContext } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

const topicSchema = z.object({
  subjectId: z.string().uuid(),
  name: z.string().trim().min(2).max(140),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  isActive: z.boolean(),
});

const topicUpdateSchema = topicSchema.extend({
  topicId: z.string().uuid(),
});

const activeToggleSchema = z.object({
  topicId: z.string().uuid(),
  isActive: z.boolean(),
});

function checked(value: FormDataEntryValue | null) {
  return value === "on";
}

async function assertSubjectInActiveContext(subjectId: string) {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const { data: subject, error } = await supabase
    .from("subjects")
    .select("id")
    .eq("id", subjectId)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .maybeSingle();

  if (error || !subject) {
    throw new Error("Choose a subject from the active exam track.");
  }

  return { context, supabase };
}

export async function createTopicAction(formData: FormData) {
  const parsed = topicSchema.safeParse({
    subjectId: formData.get("subjectId"),
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
    isActive: checked(formData.get("isActive")),
  });

  if (!parsed.success) {
    throw new Error("Invalid topic details.");
  }

  const { context, supabase } = await assertSubjectInActiveContext(
    parsed.data.subjectId,
  );
  const { error } = await supabase.from("topics").insert({
    group_id: context.activeGroup.id,
    subject_id: parsed.data.subjectId,
    name: parsed.data.name,
    sort_order: parsed.data.sortOrder,
    is_active: parsed.data.isActive,
    created_by: context.user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/topics");
  revalidatePath("/admin/subjects");
}

export async function updateTopicAction(formData: FormData) {
  const parsed = topicUpdateSchema.safeParse({
    topicId: formData.get("topicId"),
    subjectId: formData.get("subjectId"),
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
    isActive: checked(formData.get("isActive")),
  });

  if (!parsed.success) {
    throw new Error("Invalid topic details.");
  }

  const { context, supabase } = await assertSubjectInActiveContext(
    parsed.data.subjectId,
  );
  const { error } = await supabase
    .from("topics")
    .update({
      subject_id: parsed.data.subjectId,
      name: parsed.data.name,
      sort_order: parsed.data.sortOrder,
      is_active: parsed.data.isActive,
    })
    .eq("id", parsed.data.topicId)
    .eq("group_id", context.activeGroup.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/topics");
  revalidatePath("/admin/subjects");
}

export async function setTopicActiveAction(formData: FormData) {
  const parsed = activeToggleSchema.safeParse({
    topicId: formData.get("topicId"),
    isActive: formData.get("isActive") === "true",
  });

  if (!parsed.success) {
    throw new Error("Invalid topic status.");
  }

  const context = await requireAdminContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("topics")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.topicId)
    .eq("group_id", context.activeGroup.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/topics");
  revalidatePath("/admin/subjects");
}
