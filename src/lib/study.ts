export const preferredStudyTimes = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
  { value: "mixed", label: "Mixed" },
] as const;

export const preferredStudyStyles = [
  { value: "drills", label: "Drills" },
  { value: "notes", label: "Notes" },
  { value: "mock_exams", label: "Mock exams" },
  { value: "flashcards", label: "Flashcards" },
  { value: "mixed", label: "Mixed" },
] as const;

export const weaknessStrategies = [
  { value: "focus_weak_areas", label: "Focus weak areas" },
  { value: "balanced_review", label: "Balanced review" },
  { value: "maintain_strengths", label: "Maintain strengths" },
  { value: "exam_weighted", label: "Exam-weighted" },
] as const;

export const weekDays = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
] as const;

export const activityTypes = [
  { value: "watching_lecture", label: "Watching lecture" },
  { value: "reading_notes", label: "Reading notes" },
  { value: "answering_drills", label: "Answering drills" },
  { value: "rationalizing_answers", label: "Rationalizing answers" },
  { value: "mock_exam", label: "Mock exam" },
  { value: "group_study", label: "Group study" },
  { value: "other", label: "Other" },
] as const;

export type ActivityType = (typeof activityTypes)[number]["value"];

export function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${safeSeconds}s`;
}

export function activityLabel(value: string | null | undefined) {
  return (
    activityTypes.find((activityType) => activityType.value === value)?.label ??
    "Unknown"
  );
}

export function studyStyleLabel(value: string | null | undefined) {
  return (
    preferredStudyStyles.find((style) => style.value === value)?.label ??
    "Not set"
  );
}
