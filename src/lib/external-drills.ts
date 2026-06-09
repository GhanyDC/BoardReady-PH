import type { Database } from "@/lib/types";

export type ExternalDrillLog =
  Database["public"]["Tables"]["external_drill_logs"]["Row"];

export type ExternalDrillPerformanceCategory =
  | "critical"
  | "high_risk"
  | "needs_work"
  | "acceptable"
  | "strong";

type ExternalDrillPerformanceDefinition = {
  value: ExternalDrillPerformanceCategory;
  label: string;
  description: string;
  minInclusive: number;
  maxExclusive: number | null;
  badgeClassName: string;
};

export const externalDrillPerformanceCategories: ExternalDrillPerformanceDefinition[] = [
  {
    value: "critical",
    label: "Critical",
    description: "Below 50%",
    minInclusive: 0,
    maxExclusive: 50,
    badgeClassName: "border-red-200 bg-red-50 text-red-700",
  },
  {
    value: "high_risk",
    label: "High risk",
    description: "50-59%",
    minInclusive: 50,
    maxExclusive: 60,
    badgeClassName: "border-orange-200 bg-orange-50 text-orange-700",
  },
  {
    value: "needs_work",
    label: "Needs work",
    description: "60-69%",
    minInclusive: 60,
    maxExclusive: 70,
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    value: "acceptable",
    label: "Acceptable",
    description: "70-79%",
    minInclusive: 70,
    maxExclusive: 80,
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
  },
  {
    value: "strong",
    label: "Strong",
    description: "80%+",
    minInclusive: 80,
    maxExclusive: null,
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
];

export function externalDrillPerformanceCategory(percentage: number) {
  return externalDrillPerformanceCategories.find((category) => {
    const withinMin = percentage >= category.minInclusive;
    const withinMax =
      category.maxExclusive === null || percentage < category.maxExclusive;

    return withinMin && withinMax;
  }) ?? externalDrillPerformanceCategories[0];
}

export function externalDrillCategoryByValue(
  value: string,
): ExternalDrillPerformanceDefinition | null {
  return (
    externalDrillPerformanceCategories.find(
      (category) => category.value === value,
    ) ?? null
  );
}

export function formatExternalDrillPercentage(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }

  return `${Number(value).toFixed(2)}%`;
}

export function previewExternalDrillText(value: string | null, length = 120) {
  if (!value) {
    return "No notes";
  }

  return value.length > length ? `${value.slice(0, length)}...` : value;
}
