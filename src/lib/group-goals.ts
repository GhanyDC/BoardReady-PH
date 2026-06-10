import type { PublicGroupProgress } from "@/lib/group-analytics";
import type { Database } from "@/lib/types";

export type GroupGoal = Database["public"]["Tables"]["group_goals"]["Row"];

export const groupGoalTypeValues = [
  "study_minutes",
  "questions_answered",
  "mock_exams_completed",
  "external_drills_logged",
  "custom",
] as const;

export const groupGoalStatusValues = [
  "draft",
  "active",
  "completed",
  "archived",
] as const;

export type GroupGoalType = (typeof groupGoalTypeValues)[number];
export type GroupGoalStatus = (typeof groupGoalStatusValues)[number];

export const groupGoalTypes: Array<{ value: GroupGoalType; label: string }> = [
  { value: "study_minutes", label: "Study minutes" },
  { value: "questions_answered", label: "Questions answered" },
  { value: "mock_exams_completed", label: "Mock exams completed" },
  { value: "external_drills_logged", label: "External drills logged" },
  { value: "custom", label: "Custom checkpoint" },
];

export const groupGoalStatuses: Array<{
  value: GroupGoalStatus;
  label: string;
}> = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export function groupGoalTypeLabel(value: string) {
  return groupGoalTypes.find((type) => type.value === value)?.label ?? value;
}

export function groupGoalStatusLabel(value: string) {
  return (
    groupGoalStatuses.find((status) => status.value === value)?.label ?? value
  );
}

export function groupGoalStatusBadgeVariant(status: string) {
  if (status === "completed") {
    return "success" as const;
  }

  if (status === "active") {
    return "default" as const;
  }

  if (status === "archived") {
    return "secondary" as const;
  }

  return "outline" as const;
}

export function groupGoalMetricValue(
  goalType: string,
  progress: PublicGroupProgress,
) {
  if (goalType === "study_minutes") {
    return progress.totalStudyMinutesThisWeek;
  }

  if (goalType === "questions_answered") {
    return progress.totalQuestionsAnsweredThisWeek;
  }

  if (goalType === "mock_exams_completed") {
    return progress.mockExamsCompletedThisWeek;
  }

  if (goalType === "external_drills_logged") {
    return progress.externalDrillsLoggedThisWeek;
  }

  return null;
}

export function groupGoalProgressPercent(goal: GroupGoal, value: number | null) {
  if (value === null || goal.target_value <= 0) {
    return null;
  }

  return Math.min(100, Math.round((value / goal.target_value) * 100));
}

export function formatGroupGoalValue(goalType: string, value: number | null) {
  if (value === null) {
    return "Manual checkpoint";
  }

  const formatted = new Intl.NumberFormat("en").format(Math.round(value));

  if (goalType === "study_minutes") {
    return `${formatted}m`;
  }

  if (goalType === "questions_answered") {
    return `${formatted} answers`;
  }

  if (goalType === "mock_exams_completed") {
    return `${formatted} mock${Math.round(value) === 1 ? "" : "s"}`;
  }

  if (goalType === "external_drills_logged") {
    return `${formatted} drill${Math.round(value) === 1 ? "" : "s"}`;
  }

  return formatted;
}

export function formatGoalDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}
