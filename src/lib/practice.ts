export const practiceModes = [
  { value: "mixed_subject", label: "Mixed subject" },
  { value: "subject_drill", label: "Subject drill" },
  { value: "topic_drill", label: "Topic drill" },
] as const;

export const attemptTypes = [
  { value: "practice_drill", label: "Practice drill" },
  { value: "topic_drill", label: "Topic drill" },
  { value: "missed_question_review", label: "Missed question review" },
] as const;

export function practiceModeLabel(value: string) {
  return practiceModes.find((mode) => mode.value === value)?.label ?? value;
}

export function attemptTypeLabel(value: string) {
  return attemptTypes.find((attemptType) => attemptType.value === value)?.label ?? value;
}
