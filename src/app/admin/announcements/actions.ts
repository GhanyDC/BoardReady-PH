"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminContext } from "@/lib/admin-auth";
import {
  groupAnnouncementStatusValues,
  groupAnnouncementVisibilityValues,
} from "@/lib/group-announcements";
import { createClient } from "@/lib/supabase/server";

const createAnnouncementSchema = z.object({
  title: z.string().trim().min(2).max(180),
  body: z.string().trim().min(2).max(4000),
  visibility: z.enum(groupAnnouncementVisibilityValues),
  status: z.enum(groupAnnouncementStatusValues),
});

const updateAnnouncementSettingsSchema = z.object({
  announcementId: z.string().uuid(),
  visibility: z.enum(groupAnnouncementVisibilityValues),
  status: z.enum(groupAnnouncementStatusValues),
});

function revalidateAnnouncementViews() {
  revalidatePath("/admin/announcements");
  revalidatePath("/group-progress");
}

export async function createGroupAnnouncementAction(formData: FormData) {
  const parsed = createAnnouncementSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    visibility: formData.get("visibility"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    throw new Error("Invalid announcement details.");
  }

  const context = await requireAdminContext();
  const supabase = await createClient();
  const { error } = await supabase.from("group_announcements").insert({
    group_id: context.activeGroup.id,
    exam_program_id: context.activeExamProgram.id,
    title: parsed.data.title,
    body: parsed.data.body,
    visibility: parsed.data.visibility,
    status: parsed.data.status,
    created_by: context.user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateAnnouncementViews();
}

export async function updateGroupAnnouncementSettingsAction(
  formData: FormData,
) {
  const parsed = updateAnnouncementSettingsSchema.safeParse({
    announcementId: formData.get("announcementId"),
    visibility: formData.get("visibility"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    throw new Error("Invalid announcement settings.");
  }

  const context = await requireAdminContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("group_announcements")
    .update({
      visibility: parsed.data.visibility,
      status: parsed.data.status,
    })
    .eq("id", parsed.data.announcementId)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateAnnouncementViews();
}
