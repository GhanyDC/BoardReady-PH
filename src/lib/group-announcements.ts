import type { Database } from "@/lib/types";

export type GroupAnnouncement =
  Database["public"]["Tables"]["group_announcements"]["Row"];

export const groupAnnouncementVisibilityValues = [
  "reviewers",
  "admins",
  "all",
] as const;

export const groupAnnouncementStatusValues = [
  "draft",
  "published",
  "archived",
] as const;

export type GroupAnnouncementVisibility =
  (typeof groupAnnouncementVisibilityValues)[number];

export type GroupAnnouncementStatus =
  (typeof groupAnnouncementStatusValues)[number];

export const groupAnnouncementVisibilities: Array<{
  value: GroupAnnouncementVisibility;
  label: string;
}> = [
  { value: "reviewers", label: "Reviewers" },
  { value: "admins", label: "Admins" },
  { value: "all", label: "All members" },
];

export const groupAnnouncementStatuses: Array<{
  value: GroupAnnouncementStatus;
  label: string;
}> = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export function groupAnnouncementVisibilityLabel(value: string) {
  return (
    groupAnnouncementVisibilities.find((item) => item.value === value)?.label ??
    value
  );
}

export function groupAnnouncementStatusLabel(value: string) {
  return (
    groupAnnouncementStatuses.find((item) => item.value === value)?.label ??
    value
  );
}

export function groupAnnouncementStatusBadgeVariant(status: string) {
  if (status === "published") {
    return "default" as const;
  }

  if (status === "archived") {
    return "secondary" as const;
  }

  return "outline" as const;
}
