"use server";

import { z } from "zod";

import { requireMembership } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import {
  preferredStudyStyles,
  preferredStudyTimes,
  weaknessStrategies,
  weekDays,
} from "@/lib/study";

const preferredStudyTimeValues: string[] = preferredStudyTimes.map(
  (item) => item.value,
);
const preferredStudyStyleValues: string[] = preferredStudyStyles.map(
  (item) => item.value,
);
const weaknessStrategyValues: string[] = weaknessStrategies.map(
  (item) => item.value,
);
const weekDayValues: string[] = weekDays.map((item) => item.value);

const studyPreferencesSchema = z.object({
  dailyGoalMinutes: z.coerce
    .number()
    .int()
    .min(1, "Daily goal must be at least 1 minute.")
    .max(1440, "Daily goal cannot exceed 24 hours."),
  weeklyGoalMinutes: z.coerce
    .number()
    .int()
    .min(1, "Weekly goal must be at least 1 minute.")
    .max(10080, "Weekly goal cannot exceed 7 days."),
  preferredSessionLengthMinutes: z.coerce
    .number()
    .int()
    .min(5, "Preferred session length must be at least 5 minutes.")
    .max(480, "Preferred session length cannot exceed 8 hours."),
  preferredStudyTime: z
    .string()
    .refine((value) => preferredStudyTimeValues.includes(value), {
      message: "Choose a preferred study time.",
    }),
  preferredStudyStyle: z
    .string()
    .refine((value) => preferredStudyStyleValues.includes(value), {
      message: "Choose a preferred study style.",
    }),
  weaknessStrategy: z
    .string()
    .refine((value) => weaknessStrategyValues.includes(value), {
      message: "Choose a weakness strategy.",
    }),
  restDays: z
    .array(
      z.string().refine((value) => weekDayValues.includes(value), {
        message: "Choose valid rest days.",
      }),
    )
    .default([]),
  targetExamDate: z.string().nullable(),
});

export type StudyPreferencesFormState = {
  errors?: {
    dailyGoalMinutes?: string[];
    weeklyGoalMinutes?: string[];
    preferredSessionLengthMinutes?: string[];
    preferredStudyTime?: string[];
    preferredStudyStyle?: string[];
    weaknessStrategy?: string[];
    restDays?: string[];
    targetExamDate?: string[];
  };
  message?: string;
  success?: string;
};

function nullableDate(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value;
}

export async function saveStudyPreferencesAction(
  _state: StudyPreferencesFormState,
  formData: FormData,
): Promise<StudyPreferencesFormState> {
  const parsed = studyPreferencesSchema.safeParse({
    dailyGoalMinutes: formData.get("dailyGoalMinutes"),
    weeklyGoalMinutes: formData.get("weeklyGoalMinutes"),
    preferredSessionLengthMinutes: formData.get(
      "preferredSessionLengthMinutes",
    ),
    preferredStudyTime: formData.get("preferredStudyTime"),
    preferredStudyStyle: formData.get("preferredStudyStyle"),
    weaknessStrategy: formData.get("weaknessStrategy"),
    restDays: formData.getAll("restDays").map(String),
    targetExamDate: nullableDate(formData.get("targetExamDate")),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram) {
    return {
      message: "Join a group before saving study habits.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("study_preferences").upsert(
    {
      user_id: context.user.id,
      group_id: context.activeGroup.id,
      exam_program_id: context.activeExamProgram.id,
      daily_goal_minutes: parsed.data.dailyGoalMinutes,
      weekly_goal_minutes: parsed.data.weeklyGoalMinutes,
      preferred_session_length_minutes:
        parsed.data.preferredSessionLengthMinutes,
      preferred_study_time: parsed.data.preferredStudyTime,
      preferred_study_style: parsed.data.preferredStudyStyle,
      weakness_strategy: parsed.data.weaknessStrategy,
      rest_days: parsed.data.restDays,
      target_exam_date: parsed.data.targetExamDate,
    },
    {
      onConflict: "user_id,group_id,exam_program_id",
    },
  );

  if (error) {
    return {
      message: error.message,
    };
  }

  return {
    success: "Study habits saved.",
  };
}
