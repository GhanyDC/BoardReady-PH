"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const onboardingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(160, "Keep the name under 160 characters."),
  inviteCode: z
    .string()
    .trim()
    .min(6, "Enter the group invite code.")
    .max(32, "Invite codes are at most 32 characters."),
});

export type OnboardingFormState = {
  errors?: {
    fullName?: string[];
    inviteCode?: string[];
  };
  message?: string;
};

export async function completeOnboardingAction(
  _state: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const parsed = onboardingSchema.safeParse({
    fullName: formData.get("fullName"),
    inviteCode: formData.get("inviteCode"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.rpc("join_group_with_invite", {
    p_full_name: parsed.data.fullName,
    p_invite_code: parsed.data.inviteCode,
  });

  if (error) {
    return {
      message: "Invite code could not be verified. Check the code and try again.",
    };
  }

  redirect("/dashboard");
}
