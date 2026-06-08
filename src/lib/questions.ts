import type { VariantProps } from "class-variance-authority";

import type { badgeVariants } from "@/components/ui/badge";

export const questionDifficulties = [
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "difficult", label: "Difficult" },
] as const;

export const bloomLevels = [
  { value: "remembering", label: "Remembering" },
  { value: "understanding", label: "Understanding" },
  { value: "applying", label: "Applying" },
  { value: "analyzing", label: "Analyzing" },
  { value: "evaluating", label: "Evaluating" },
  { value: "creating", label: "Creating" },
] as const;

export const questionSourceTypes = [
  { value: "self_made", label: "Self-made" },
  { value: "personal_notes", label: "Personal notes" },
  { value: "textbook_based", label: "Textbook-based" },
  { value: "public_reference", label: "Public reference" },
  { value: "reviewer_submitted", label: "Reviewer submitted" },
] as const;

export const questionStatuses = [
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending review" },
  { value: "needs_revision", label: "Needs revision" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
  { value: "rejected", label: "Rejected" },
] as const;

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

function labelFor(
  value: string,
  options: readonly { value: string; label: string }[],
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function difficultyLabel(value: string) {
  return labelFor(value, questionDifficulties);
}

export function bloomLevelLabel(value: string) {
  return labelFor(value, bloomLevels);
}

export function sourceTypeLabel(value: string) {
  return labelFor(value, questionSourceTypes);
}

export function statusLabel(value: string) {
  return labelFor(value, questionStatuses);
}

export function statusBadgeVariant(status: string): BadgeVariant {
  if (status === "published") {
    return "success";
  }

  if (status === "pending_review" || status === "needs_revision") {
    return "default";
  }

  if (status === "archived" || status === "rejected") {
    return "secondary";
  }

  return "outline";
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function shortUserId(value: string) {
  return value.slice(0, 8);
}
