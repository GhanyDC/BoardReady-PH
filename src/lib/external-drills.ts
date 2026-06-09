import type { SupabaseClient } from "@supabase/supabase-js";

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

type ExternalDrillAnalyticsClient = SupabaseClient<Database>;

export type ExternalDrillAnalyticsContext = {
  userId: string;
  groupId: string;
  examProgramId: string;
};

type SubjectSummary = {
  subjectId: string;
  subjectName: string;
  totalDrills: number;
  totalItems: number;
  averagePercentage: number;
};

type TopicSummary = {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  totalDrills: number;
  totalItems: number;
  averagePercentage: number;
};

export type ExternalDrillSummary = {
  totalDrills: number;
  totalItems: number;
  averagePercentage: number | null;
  latestDrill: (ExternalDrillLog & {
    subjectName: string;
    topicName: string | null;
  }) | null;
  weakestSubject: SubjectSummary | null;
  weakestTopic: TopicSummary | null;
  averagePercentageBySubject: SubjectSummary[];
  averagePercentageByTopic: TopicSummary[];
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

export async function getExternalDrillSummary(
  supabase: ExternalDrillAnalyticsClient,
  context: ExternalDrillAnalyticsContext,
): Promise<ExternalDrillSummary> {
  const { data: logs } = await supabase
    .from("external_drill_logs")
    .select("*")
    .eq("user_id", context.userId)
    .eq("group_id", context.groupId)
    .eq("exam_program_id", context.examProgramId)
    .order("date_taken", { ascending: false })
    .order("created_at", { ascending: false });

  const externalLogs = logs ?? [];

  if (externalLogs.length === 0) {
    return {
      totalDrills: 0,
      totalItems: 0,
      averagePercentage: null,
      latestDrill: null,
      weakestSubject: null,
      weakestTopic: null,
      averagePercentageBySubject: [],
      averagePercentageByTopic: [],
    };
  }

  const subjectIds = [...new Set(externalLogs.map((log) => log.subject_id))];
  const topicIds = [
    ...new Set(
      externalLogs
        .map((log) => log.topic_id)
        .filter((topicId): topicId is string => Boolean(topicId)),
    ),
  ];
  const [{ data: subjects }, { data: topics }] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name")
      .eq("group_id", context.groupId)
      .eq("exam_program_id", context.examProgramId)
      .in("id", subjectIds),
    topicIds.length > 0
      ? supabase
          .from("topics")
          .select("id, subject_id, name")
          .eq("group_id", context.groupId)
          .in("id", topicIds)
      : Promise.resolve({ data: [] }),
  ]);
  const subjectNameById = new Map(
    (subjects ?? []).map((subject) => [subject.id, subject.name]),
  );
  const topicById = new Map((topics ?? []).map((topic) => [topic.id, topic]));

  const subjectSummaries = summarizeExternalSubjectScores(
    externalLogs,
    subjectNameById,
  );
  const topicSummaries = summarizeExternalTopicScores(
    externalLogs,
    subjectNameById,
    topicById,
  );
  const totalItems = externalLogs.reduce(
    (total, log) => total + log.total_items,
    0,
  );
  const averagePercentage =
    externalLogs.reduce((total, log) => total + Number(log.percentage), 0) /
    externalLogs.length;
  const latestLog = externalLogs[0] ?? null;
  const latestTopic = latestLog?.topic_id
    ? topicById.get(latestLog.topic_id)
    : null;

  return {
    totalDrills: externalLogs.length,
    totalItems,
    averagePercentage,
    latestDrill: latestLog
      ? {
          ...latestLog,
          subjectName: subjectNameById.get(latestLog.subject_id) ?? "Subject",
          topicName: latestTopic?.name ?? null,
        }
      : null,
    weakestSubject: subjectSummaries[0] ?? null,
    weakestTopic: topicSummaries[0] ?? null,
    averagePercentageBySubject: subjectSummaries,
    averagePercentageByTopic: topicSummaries,
  };
}

function summarizeExternalSubjectScores(
  logs: ExternalDrillLog[],
  subjectNameById: Map<string, string>,
) {
  const summaryBySubject = new Map<
    string,
    SubjectSummary & { percentageTotal: number }
  >();

  for (const log of logs) {
    const current = summaryBySubject.get(log.subject_id) ?? {
      subjectId: log.subject_id,
      subjectName: subjectNameById.get(log.subject_id) ?? "Subject",
      totalDrills: 0,
      totalItems: 0,
      averagePercentage: 0,
      percentageTotal: 0,
    };

    current.totalDrills += 1;
    current.totalItems += log.total_items;
    current.percentageTotal += Number(log.percentage);
    current.averagePercentage = current.percentageTotal / current.totalDrills;
    summaryBySubject.set(log.subject_id, current);
  }

  return [...summaryBySubject.values()]
    .map((summary) => ({
      subjectId: summary.subjectId,
      subjectName: summary.subjectName,
      totalDrills: summary.totalDrills,
      totalItems: summary.totalItems,
      averagePercentage: summary.averagePercentage,
    }))
    .sort(
      (left, right) =>
        left.averagePercentage - right.averagePercentage ||
        right.totalDrills - left.totalDrills,
    );
}

function summarizeExternalTopicScores(
  logs: ExternalDrillLog[],
  subjectNameById: Map<string, string>,
  topicById: Map<string, { id: string; subject_id: string; name: string }>,
) {
  const summaryByTopic = new Map<
    string,
    TopicSummary & { percentageTotal: number }
  >();

  for (const log of logs) {
    if (!log.topic_id) {
      continue;
    }

    const topic = topicById.get(log.topic_id);
    const current = summaryByTopic.get(log.topic_id) ?? {
      topicId: log.topic_id,
      topicName: topic?.name ?? "Topic",
      subjectId: log.subject_id,
      subjectName: subjectNameById.get(log.subject_id) ?? "Subject",
      totalDrills: 0,
      totalItems: 0,
      averagePercentage: 0,
      percentageTotal: 0,
    };

    current.totalDrills += 1;
    current.totalItems += log.total_items;
    current.percentageTotal += Number(log.percentage);
    current.averagePercentage = current.percentageTotal / current.totalDrills;
    summaryByTopic.set(log.topic_id, current);
  }

  return [...summaryByTopic.values()]
    .map((summary) => ({
      topicId: summary.topicId,
      topicName: summary.topicName,
      subjectId: summary.subjectId,
      subjectName: summary.subjectName,
      totalDrills: summary.totalDrills,
      totalItems: summary.totalItems,
      averagePercentage: summary.averagePercentage,
    }))
    .sort(
      (left, right) =>
        left.averagePercentage - right.averagePercentage ||
        right.totalDrills - left.totalDrills,
    );
}
