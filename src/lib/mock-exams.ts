export const mockExamTypes = [
  { value: "quick", label: "Quick" },
  { value: "half", label: "Half" },
  { value: "full", label: "Full" },
  { value: "custom", label: "Custom" },
] as const;

export const mockExamStatuses = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
] as const;

export type MockExamType = (typeof mockExamTypes)[number]["value"];
export type MockExamStatus = (typeof mockExamStatuses)[number]["value"];

export type WeightedSubject = {
  id: string;
  name: string;
  board_weight: number;
  sort_order?: number;
};

export type SubjectItemDistribution = {
  subjectId: string;
  subjectName: string;
  boardWeight: number;
  itemCount: number;
};

export function mockTypeLabel(value: string) {
  return mockExamTypes.find((item) => item.value === value)?.label ?? value;
}

export function mockStatusLabel(value: string) {
  return mockExamStatuses.find((item) => item.value === value)?.label ?? value;
}

export function mockStatusBadgeVariant(value: string) {
  if (value === "published") {
    return "default" as const;
  }

  if (value === "archived") {
    return "secondary" as const;
  }

  return "outline" as const;
}

export function formatPercentage(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Not scored";
  }

  return `${Number(value).toFixed(1)}%`;
}

export function formatSeconds(totalSeconds: number | null | undefined) {
  if (totalSeconds === null || totalSeconds === undefined) {
    return "Not recorded";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function distributeWeightedItems(
  subjects: WeightedSubject[],
  itemCount: number,
): SubjectItemDistribution[] {
  if (subjects.length === 0 || itemCount <= 0) {
    return [];
  }

  const sortedSubjects = [...subjects].sort((a, b) => {
    const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);

    return orderDiff === 0 ? a.name.localeCompare(b.name) : orderDiff;
  });
  const positiveWeightTotal = sortedSubjects.reduce(
    (sum, subject) => sum + Math.max(0, subject.board_weight),
    0,
  );
  const weightedSubjects = sortedSubjects.map((subject) => ({
    subject,
    weight:
      positiveWeightTotal > 0
        ? Math.max(0, subject.board_weight)
        : 1,
  }));
  const totalWeight = weightedSubjects.reduce(
    (sum, item) => sum + item.weight,
    0,
  );
  const initial = weightedSubjects.map((item) => {
    const rawCount = (itemCount * item.weight) / totalWeight;

    return {
      subject: item.subject,
      count: Math.floor(rawCount),
      remainder: rawCount - Math.floor(rawCount),
    };
  });
  let assigned = initial.reduce((sum, item) => sum + item.count, 0);
  const byRemainder = [...initial].sort((a, b) => {
    const remainderDiff = b.remainder - a.remainder;

    return remainderDiff === 0
      ? (a.subject.sort_order ?? 0) - (b.subject.sort_order ?? 0)
      : remainderDiff;
  });

  for (const item of byRemainder) {
    if (assigned >= itemCount) {
      break;
    }

    item.count += 1;
    assigned += 1;
  }

  const countBySubjectId = new Map(
    byRemainder.map((item) => [item.subject.id, item.count]),
  );

  return sortedSubjects.map((subject) => ({
    subjectId: subject.id,
    subjectName: subject.name,
    boardWeight: subject.board_weight,
    itemCount: countBySubjectId.get(subject.id) ?? 0,
  }));
}
