import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types";

export const minimumWeakAreaAttempts = 5;

export const weakAreaPriorities = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "watchlist", label: "Watchlist" },
  { value: "cleared", label: "Cleared" },
] as const;

export type WeakAreaPriority = (typeof weakAreaPriorities)[number]["value"];

export type AnalyticsContext = {
  userId: string;
  groupId: string;
  examProgramId: string;
};

export type SubjectPerformance =
  Database["public"]["Views"]["subject_attempt_analytics"]["Row"];

export type TopicPerformance =
  Database["public"]["Views"]["topic_attempt_analytics"]["Row"];

export type WeakArea = Database["public"]["Tables"]["weak_areas"]["Row"];

export type WeakAreaWithNames = WeakArea & {
  subjectName: string;
  topicName: string;
  recommendedAction: string;
  isWeak: boolean;
};

type AnalyticsClient = SupabaseClient<Database>;

function priorityRank(priority: string) {
  const order: Record<string, number> = {
    critical: 1,
    high: 2,
    medium: 3,
    watchlist: 4,
    cleared: 5,
  };

  return order[priority] ?? 99;
}

export function priorityLabel(priority: string) {
  return (
    weakAreaPriorities.find((item) => item.value === priority)?.label ??
    priority
  );
}

export function priorityForAccuracy(accuracy: number): WeakAreaPriority {
  if (accuracy < 50) {
    return "critical";
  }

  if (accuracy < 60) {
    return "high";
  }

  if (accuracy < 70) {
    return "medium";
  }

  if (accuracy < 80) {
    return "watchlist";
  }

  return "cleared";
}

export function recommendedAction(priority: string) {
  if (priority === "critical") {
    return "Review notes and answer 10-15 focused questions.";
  }

  if (priority === "high") {
    return "Take a focused topic drill and review rationales.";
  }

  if (priority === "medium") {
    return "Retake missed questions and explain rationales.";
  }

  if (priority === "watchlist") {
    return "Maintain with short review.";
  }

  return "Topic is currently stable.";
}

export function isWeakPriority(priority: string) {
  return priority === "critical" || priority === "high" || priority === "medium";
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }

  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

export function formatAverageConfidence(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }

  return `${value.toFixed(1)}/5`;
}

export async function getSubjectPerformance(
  supabase: AnalyticsClient,
  context: AnalyticsContext,
) {
  const { data, error } = await supabase
    .from("subject_attempt_analytics")
    .select("*")
    .eq("user_id", context.userId)
    .eq("group_id", context.groupId)
    .eq("exam_program_id", context.examProgramId)
    .order("accuracy", { ascending: true });

  return {
    data: data ?? [],
    error,
  };
}

export async function getTopicPerformance(
  supabase: AnalyticsClient,
  context: AnalyticsContext,
) {
  const { data, error } = await supabase
    .from("topic_attempt_analytics")
    .select("*")
    .eq("user_id", context.userId)
    .eq("group_id", context.groupId)
    .eq("exam_program_id", context.examProgramId)
    .order("subject_name", { ascending: true })
    .order("accuracy", { ascending: true });

  return {
    data: data ?? [],
    error,
  };
}

export async function getPerformanceAnalytics(
  supabase: AnalyticsClient,
  context: AnalyticsContext,
) {
  const [subjects, topics] = await Promise.all([
    getSubjectPerformance(supabase, context),
    getTopicPerformance(supabase, context),
  ]);

  return {
    subjects: subjects.data,
    topics: topics.data,
    errors: [subjects.error, topics.error].filter(Boolean),
  };
}

export async function refreshWeakAreas(
  supabase: AnalyticsClient,
  context: AnalyticsContext,
) {
  const { data, error } = await supabase.rpc("refresh_user_weak_areas", {
    target_group_id: context.groupId,
    target_exam_program_id: context.examProgramId,
  });

  return {
    data: data ?? [],
    error,
  };
}

export async function getWeakAreas(
  supabase: AnalyticsClient,
  context: AnalyticsContext,
) {
  const { data: weakAreas, error } = await refreshWeakAreas(supabase, context);

  if (error || weakAreas.length === 0) {
    return {
      data: [],
      error,
    };
  }

  const subjectIds = [...new Set(weakAreas.map((area) => area.subject_id))];
  const topicIds = [...new Set(weakAreas.map((area) => area.topic_id))];
  const [{ data: subjects }, { data: topics }] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name")
      .eq("group_id", context.groupId)
      .eq("exam_program_id", context.examProgramId)
      .in("id", subjectIds),
    supabase
      .from("topics")
      .select("id, name")
      .eq("group_id", context.groupId)
      .in("id", topicIds),
  ]);
  const subjectNameById = new Map(
    (subjects ?? []).map((subject) => [subject.id, subject.name]),
  );
  const topicNameById = new Map(
    (topics ?? []).map((topic) => [topic.id, topic.name]),
  );
  const enriched = weakAreas.map((area) => ({
    ...area,
    subjectName: subjectNameById.get(area.subject_id) ?? "Subject",
    topicName: topicNameById.get(area.topic_id) ?? "Topic",
    recommendedAction: recommendedAction(area.priority),
    isWeak: isWeakPriority(area.priority),
  }));

  return {
    data: sortWeakAreas(enriched),
    error: null,
  };
}

export function sortWeakAreas<T extends Pick<WeakArea, "priority" | "accuracy" | "last_attempted_at">>(
  rows: T[],
) {
  return [...rows].sort((left, right) => {
    const priorityDelta = priorityRank(left.priority) - priorityRank(right.priority);

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    if (left.accuracy !== right.accuracy) {
      return left.accuracy - right.accuracy;
    }

    return (
      new Date(right.last_attempted_at).getTime() -
      new Date(left.last_attempted_at).getTime()
    );
  });
}

export function summarizePerformance(
  subjects: SubjectPerformance[],
  topics: TopicPerformance[],
) {
  const totalAttempts = subjects.reduce(
    (sum, subject) => sum + subject.total_attempts,
    0,
  );
  const correctAttempts = subjects.reduce(
    (sum, subject) => sum + subject.correct_attempts,
    0,
  );
  const overallAccuracy =
    totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : null;
  const confidenceTotals = subjects.reduce(
    (sum, subject) =>
      sum +
      (subject.average_confidence ?? 0) * subject.confidence_attempts,
    0,
  );
  const confidenceAttempts = subjects.reduce(
    (sum, subject) => sum + subject.confidence_attempts,
    0,
  );
  const averageConfidence =
    confidenceAttempts > 0 ? confidenceTotals / confidenceAttempts : null;
  const attemptedSubjects = subjects.filter(
    (subject) => subject.total_attempts > 0,
  );
  const attemptedTopics = topics.filter((topic) => topic.total_attempts > 0);
  const weakTopics = topics
    .filter(
      (topic) =>
        topic.total_attempts >= minimumWeakAreaAttempts && topic.accuracy < 70,
    )
    .sort((left, right) => left.accuracy - right.accuracy);
  const watchlistTopics = topics
    .filter(
      (topic) =>
        topic.total_attempts >= minimumWeakAreaAttempts &&
        topic.accuracy >= 70 &&
        topic.accuracy < 80,
    )
    .sort((left, right) => left.accuracy - right.accuracy);
  const stableTopics = topics
    .filter(
      (topic) =>
        topic.total_attempts >= minimumWeakAreaAttempts && topic.accuracy >= 80,
    )
    .sort((left, right) => right.accuracy - left.accuracy);
  const insufficientTopics = topics
    .filter(
      (topic) =>
        topic.total_attempts > 0 &&
        topic.total_attempts < minimumWeakAreaAttempts,
    )
    .sort((left, right) => left.total_attempts - right.total_attempts);

  return {
    totalAttempts,
    correctAttempts,
    wrongAttempts: totalAttempts - correctAttempts,
    overallAccuracy,
    averageConfidence,
    weakestSubject:
      attemptedSubjects.sort((left, right) => left.accuracy - right.accuracy)[0] ??
      null,
    weakestTopic:
      attemptedTopics.sort((left, right) => left.accuracy - right.accuracy)[0] ??
      null,
    weakTopics,
    watchlistTopics,
    stableTopics,
    insufficientTopics,
    topHighPerformingTopics: stableTopics.slice(0, 3),
  };
}
