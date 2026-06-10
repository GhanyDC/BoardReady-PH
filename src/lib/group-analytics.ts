import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/types";

type GroupAnalyticsClient = SupabaseClient<Database>;

export type GroupAnalyticsContext = {
  groupId: string;
  examProgramId: string;
};

export type GroupWeakSignal = {
  id: string;
  name: string;
  count: number;
  averageAccuracy: number | null;
};

export type AdminReviewerSummary = {
  userId: string;
  displayName: string;
  studyMinutesThisWeek: number;
  questionsAnsweredThisWeek: number;
  latestMockPercentage: number | null;
  latestReadinessEstimate: number | null;
  lastActivityAt: string | null;
  inactiveThisWeek: boolean;
  belowMinimumActivityThreshold: boolean;
};

export type AdminGroupAnalytics = {
  reviewerCount: number;
  activeReviewersThisWeek: number;
  totalStudyMinutesThisWeek: number;
  averageStudyMinutesPerActiveReviewer: number;
  totalQuestionsAnsweredThisWeek: number;
  averagePracticeAccuracy: number | null;
  mockExamsCompletedThisWeek: number;
  averageLatestReadinessScore: number | null;
  topWeakSubjects: GroupWeakSignal[];
  topWeakTopics: GroupWeakSignal[];
  externalDrillsLoggedThisWeek: number;
  inactiveReviewers: AdminReviewerSummary[];
  belowMinimumActivityReviewers: AdminReviewerSummary[];
  reviewerSummaries: AdminReviewerSummary[];
  weekStart: string;
  weekEnd: string;
};

export type PublicGroupProgress = {
  reviewerCount: number;
  activeReviewersThisWeek: number;
  totalStudyMinutesThisWeek: number;
  totalQuestionsAnsweredThisWeek: number;
  averagePracticeAccuracy: number | null;
  mockExamsCompletedThisWeek: number;
  externalDrillsLoggedThisWeek: number;
  activeDaysThisWeek: number;
  topWeakSubjects: GroupWeakSignal[];
  topWeakTopics: GroupWeakSignal[];
  weekStart: string;
  weekEnd: string;
};

const minimumWeeklyStudyMinutes = 60;
const minimumWeeklyQuestions = 20;

type StudySessionRow = {
  user_id: string;
  started_at: string;
  duration_seconds: number;
};

type QuestionAttemptRow = {
  user_id: string;
  is_correct: boolean;
  created_at: string;
};

type MockAttemptRow = {
  user_id: string;
  percentage: number | null;
  submitted_at: string | null;
  created_at: string;
};

type ReadinessSnapshotRow = {
  user_id: string;
  overall_readiness: number;
  calculated_at: string;
};

type ExternalDrillRow = {
  user_id: string;
  created_at: string;
};

type WeakAreaRow = {
  subject_id: string;
  topic_id: string;
  accuracy: number;
  priority: string;
};

type GroupProgressSummaryRow =
  Database["public"]["Functions"]["get_group_progress_summary"]["Returns"][number];

type JsonObject = { [key: string]: Json | undefined };

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfLocalWeek(date: Date) {
  const weekStart = startOfLocalDay(date);
  const day = weekStart.getDay();
  const daysSinceMonday = (day + 6) % 7;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);

  return weekStart;
}

function shortUserId(userId: string) {
  return `Reviewer ${userId.slice(0, 8)}`;
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxDate(...values: Array<string | null | undefined>) {
  const timestamps = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

function latestByUser<T extends { user_id: string }>(
  rows: T[],
  dateKey: keyof T,
) {
  const latest = new Map<string, T>();

  for (const row of rows) {
    const current = latest.get(row.user_id);
    const currentDate = current?.[dateKey];
    const rowDate = row[dateKey];

    if (
      typeof rowDate === "string" &&
      (!current ||
        (typeof currentDate === "string" &&
          new Date(rowDate).getTime() > new Date(currentDate).getTime()))
    ) {
      latest.set(row.user_id, row);
    }
  }

  return latest;
}

function activeDayCount(rows: Array<{ started_at?: string; created_at?: string; submitted_at?: string | null }>) {
  const days = new Set<string>();

  for (const row of rows) {
    const value = row.started_at ?? row.created_at ?? row.submitted_at;

    if (value) {
      days.add(new Date(value).toISOString().slice(0, 10));
    }
  }

  return days.size;
}

function isJsonObject(value: Json): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonString(value: Json | undefined) {
  return typeof value === "string" ? value : null;
}

function jsonNumber(value: Json | undefined) {
  return typeof value === "number" && !Number.isNaN(value) ? value : null;
}

function parseWeakSignals(value: Json): GroupWeakSignal[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isJsonObject(item)) {
      return [];
    }

    const id = jsonString(item.id);
    const name = jsonString(item.name);
    const count = jsonNumber(item.count);

    if (!id || !name || count === null) {
      return [];
    }

    return [
      {
        id,
        name,
        count,
        averageAccuracy: jsonNumber(item.averageAccuracy),
      },
    ];
  });
}

function emptyPublicGroupProgress(
  weekStart: Date,
  weekEnd: Date,
): PublicGroupProgress {
  return {
    reviewerCount: 0,
    activeReviewersThisWeek: 0,
    totalStudyMinutesThisWeek: 0,
    totalQuestionsAnsweredThisWeek: 0,
    averagePracticeAccuracy: null,
    mockExamsCompletedThisWeek: 0,
    externalDrillsLoggedThisWeek: 0,
    activeDaysThisWeek: 0,
    topWeakSubjects: [],
    topWeakTopics: [],
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
  };
}

function publicProgressFromSummary(
  row: GroupProgressSummaryRow | null,
  weekStart: Date,
  weekEnd: Date,
): PublicGroupProgress {
  if (!row) {
    return emptyPublicGroupProgress(weekStart, weekEnd);
  }

  return {
    reviewerCount: row.reviewer_count,
    activeReviewersThisWeek: row.active_reviewer_count,
    totalStudyMinutesThisWeek: row.total_study_minutes,
    totalQuestionsAnsweredThisWeek: row.total_questions_answered,
    averagePracticeAccuracy:
      row.average_practice_accuracy === null
        ? null
        : Number(row.average_practice_accuracy),
    mockExamsCompletedThisWeek: row.mock_exams_completed,
    externalDrillsLoggedThisWeek: row.external_drills_logged,
    activeDaysThisWeek: row.active_days_count,
    topWeakSubjects: parseWeakSignals(row.top_weak_subjects),
    topWeakTopics: parseWeakSignals(row.top_weak_topics),
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
  };
}

function summarizeWeakSignals(
  weakAreas: WeakAreaRow[],
  nameById: Map<string, string>,
  key: "subject_id" | "topic_id",
) {
  const weakPriorities = new Set(["critical", "high", "medium"]);
  const rows = new Map<string, { totalAccuracy: number; count: number }>();

  for (const area of weakAreas) {
    if (!weakPriorities.has(area.priority)) {
      continue;
    }

    const id = area[key];
    const current = rows.get(id) ?? { totalAccuracy: 0, count: 0 };
    current.totalAccuracy += area.accuracy;
    current.count += 1;
    rows.set(id, current);
  }

  return [...rows.entries()]
    .map(([id, row]) => ({
      id,
      name: nameById.get(id) ?? "Unassigned",
      count: row.count,
      averageAccuracy: row.count > 0 ? row.totalAccuracy / row.count : null,
    }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        (left.averageAccuracy ?? 100) - (right.averageAccuracy ?? 100),
    )
    .slice(0, 5);
}

async function loadGroupMembers(
  supabase: GroupAnalyticsClient,
  context: GroupAnalyticsContext,
) {
  const { data } = await supabase
    .from("group_members")
    .select("user_id, role")
    .eq("group_id", context.groupId)
    .order("joined_at", { ascending: true });

  return (data ?? []).filter((member) => member.role === "reviewer");
}

async function loadWeekData(
  supabase: GroupAnalyticsClient,
  context: GroupAnalyticsContext,
  weekStart: Date,
  weekEnd: Date,
) {
  const [studySessions, questionAttempts, mockAttempts, externalDrills] =
    await Promise.all([
      supabase
        .from("study_sessions")
        .select("user_id, started_at, duration_seconds")
        .eq("group_id", context.groupId)
        .eq("exam_program_id", context.examProgramId)
        .gte("started_at", weekStart.toISOString())
        .lt("started_at", weekEnd.toISOString()),
      supabase
        .from("question_attempts")
        .select("user_id, is_correct, created_at")
        .eq("group_id", context.groupId)
        .eq("exam_program_id", context.examProgramId)
        .gte("created_at", weekStart.toISOString())
        .lt("created_at", weekEnd.toISOString()),
      supabase
        .from("mock_exam_attempts")
        .select("user_id, percentage, submitted_at, created_at")
        .eq("group_id", context.groupId)
        .eq("exam_program_id", context.examProgramId)
        .eq("status", "submitted")
        .gte("submitted_at", weekStart.toISOString())
        .lt("submitted_at", weekEnd.toISOString()),
      supabase
        .from("external_drill_logs")
        .select("user_id, created_at")
        .eq("group_id", context.groupId)
        .eq("exam_program_id", context.examProgramId)
        .gte("created_at", weekStart.toISOString())
        .lt("created_at", weekEnd.toISOString()),
    ]);

  return {
    studySessions: studySessions.data ?? [],
    questionAttempts: questionAttempts.data ?? [],
    mockAttempts: mockAttempts.data ?? [],
    externalDrills: externalDrills.data ?? [],
  };
}

async function loadLatestSignals(
  supabase: GroupAnalyticsClient,
  context: GroupAnalyticsContext,
) {
  const [mockAttempts, readinessSnapshots, weakAreas, subjects, topics] =
    await Promise.all([
      supabase
        .from("mock_exam_attempts")
        .select("user_id, percentage, submitted_at, created_at")
        .eq("group_id", context.groupId)
        .eq("exam_program_id", context.examProgramId)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false })
        .limit(500),
      supabase
        .from("readiness_snapshots")
        .select("user_id, overall_readiness, calculated_at")
        .eq("group_id", context.groupId)
        .eq("exam_program_id", context.examProgramId)
        .order("calculated_at", { ascending: false })
        .limit(500),
      supabase
        .from("weak_areas")
        .select("subject_id, topic_id, accuracy, priority")
        .eq("group_id", context.groupId)
        .eq("exam_program_id", context.examProgramId),
      supabase
        .from("subjects")
        .select("id, name")
        .eq("group_id", context.groupId)
        .eq("exam_program_id", context.examProgramId),
      supabase.from("topics").select("id, name").eq("group_id", context.groupId),
    ]);

  return {
    latestMockByUser: latestByUser(
      (mockAttempts.data ?? []).filter(
        (attempt): attempt is MockAttemptRow => Boolean(attempt.submitted_at),
      ),
      "submitted_at",
    ),
    latestReadinessByUser: latestByUser(
      readinessSnapshots.data ?? [],
      "calculated_at",
    ),
    weakAreas: weakAreas.data ?? [],
    subjectNameById: new Map(
      (subjects.data ?? []).map((subject) => [subject.id, subject.name]),
    ),
    topicNameById: new Map(
      (topics.data ?? []).map((topic) => [topic.id, topic.name]),
    ),
  };
}

function buildReviewerSummaries(
  reviewerIds: string[],
  weekData: {
    studySessions: StudySessionRow[];
    questionAttempts: QuestionAttemptRow[];
    mockAttempts: MockAttemptRow[];
    externalDrills: ExternalDrillRow[];
  },
  latestMockByUser: Map<string, MockAttemptRow>,
  latestReadinessByUser: Map<string, ReadinessSnapshotRow>,
) {
  return reviewerIds
    .map((userId) => {
      const sessions = weekData.studySessions.filter(
        (session) => session.user_id === userId,
      );
      const attempts = weekData.questionAttempts.filter(
        (attempt) => attempt.user_id === userId,
      );
      const mocks = weekData.mockAttempts.filter(
        (attempt) => attempt.user_id === userId,
      );
      const drills = weekData.externalDrills.filter(
        (drill) => drill.user_id === userId,
      );
      const studyMinutesThisWeek = Math.round(
        sessions.reduce(
          (sum, session) => sum + session.duration_seconds,
          0,
        ) / 60,
      );
      const lastActivityAt = maxDate(
        ...sessions.map((session) => session.started_at),
        ...attempts.map((attempt) => attempt.created_at),
        ...mocks.map((mock) => mock.submitted_at ?? mock.created_at),
        ...drills.map((drill) => drill.created_at),
        latestReadinessByUser.get(userId)?.calculated_at,
      );
      const questionsAnsweredThisWeek = attempts.length;

      return {
        userId,
        displayName: shortUserId(userId),
        studyMinutesThisWeek,
        questionsAnsweredThisWeek,
        latestMockPercentage:
          latestMockByUser.get(userId)?.percentage ?? null,
        latestReadinessEstimate:
          latestReadinessByUser.get(userId)?.overall_readiness ?? null,
        lastActivityAt,
        inactiveThisWeek:
          sessions.length === 0 &&
          attempts.length === 0 &&
          mocks.length === 0 &&
          drills.length === 0,
        belowMinimumActivityThreshold:
          studyMinutesThisWeek < minimumWeeklyStudyMinutes &&
          questionsAnsweredThisWeek < minimumWeeklyQuestions &&
          mocks.length === 0,
      } satisfies AdminReviewerSummary;
    })
    .sort((left, right) => {
      const leftDate = left.lastActivityAt
        ? new Date(left.lastActivityAt).getTime()
        : 0;
      const rightDate = right.lastActivityAt
        ? new Date(right.lastActivityAt).getTime()
        : 0;

      return rightDate - leftDate;
    });
}

export async function getAdminGroupAnalytics(
  supabase: GroupAnalyticsClient,
  context: GroupAnalyticsContext,
): Promise<AdminGroupAnalytics> {
  const weekStart = startOfLocalWeek(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [members, weekData, latestSignals] = await Promise.all([
    loadGroupMembers(supabase, context),
    loadWeekData(supabase, context, weekStart, weekEnd),
    loadLatestSignals(supabase, context),
  ]);
  const reviewerIds = members.map((member) => member.user_id);
  const reviewerSummaries = buildReviewerSummaries(
    reviewerIds,
    weekData,
    latestSignals.latestMockByUser,
    latestSignals.latestReadinessByUser,
  );
  const activeReviewersThisWeek = reviewerSummaries.filter(
    (reviewer) => !reviewer.inactiveThisWeek,
  ).length;
  const totalStudyMinutesThisWeek = reviewerSummaries.reduce(
    (sum, reviewer) => sum + reviewer.studyMinutesThisWeek,
    0,
  );
  const correctPracticeAttempts = weekData.questionAttempts.filter(
    (attempt) => attempt.is_correct,
  ).length;
  const readinessScores = reviewerSummaries
    .map((reviewer) => reviewer.latestReadinessEstimate)
    .filter((score): score is number => score !== null);

  return {
    reviewerCount: reviewerIds.length,
    activeReviewersThisWeek,
    totalStudyMinutesThisWeek,
    averageStudyMinutesPerActiveReviewer:
      activeReviewersThisWeek > 0
        ? totalStudyMinutesThisWeek / activeReviewersThisWeek
        : 0,
    totalQuestionsAnsweredThisWeek: weekData.questionAttempts.length,
    averagePracticeAccuracy:
      weekData.questionAttempts.length > 0
        ? (correctPracticeAttempts / weekData.questionAttempts.length) * 100
        : null,
    mockExamsCompletedThisWeek: weekData.mockAttempts.length,
    averageLatestReadinessScore: average(readinessScores),
    topWeakSubjects: summarizeWeakSignals(
      latestSignals.weakAreas,
      latestSignals.subjectNameById,
      "subject_id",
    ),
    topWeakTopics: summarizeWeakSignals(
      latestSignals.weakAreas,
      latestSignals.topicNameById,
      "topic_id",
    ),
    externalDrillsLoggedThisWeek: weekData.externalDrills.length,
    inactiveReviewers: reviewerSummaries.filter(
      (reviewer) => reviewer.inactiveThisWeek,
    ),
    belowMinimumActivityReviewers: reviewerSummaries.filter(
      (reviewer) => reviewer.belowMinimumActivityThreshold,
    ),
    reviewerSummaries,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
  };
}

export function getPublicGroupProgressFromAdminAnalytics(
  analytics: AdminGroupAnalytics,
): PublicGroupProgress {
  return {
    reviewerCount: analytics.reviewerCount,
    activeReviewersThisWeek: analytics.activeReviewersThisWeek,
    totalStudyMinutesThisWeek: analytics.totalStudyMinutesThisWeek,
    totalQuestionsAnsweredThisWeek: analytics.totalQuestionsAnsweredThisWeek,
    averagePracticeAccuracy: analytics.averagePracticeAccuracy,
    mockExamsCompletedThisWeek: analytics.mockExamsCompletedThisWeek,
    externalDrillsLoggedThisWeek: analytics.externalDrillsLoggedThisWeek,
    activeDaysThisWeek: 0,
    topWeakSubjects: analytics.topWeakSubjects,
    topWeakTopics: analytics.topWeakTopics,
    weekStart: analytics.weekStart,
    weekEnd: analytics.weekEnd,
  };
}

export async function getReviewerSafeGroupProgress(
  supabase: GroupAnalyticsClient,
  context: GroupAnalyticsContext,
): Promise<PublicGroupProgress> {
  const weekStart = startOfLocalWeek(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { data } = await supabase
    .rpc("get_group_progress_summary", {
      target_group_id: context.groupId,
      target_exam_program_id: context.examProgramId,
      target_week_start: weekStart.toISOString(),
      target_week_end: weekEnd.toISOString(),
    })
    .maybeSingle();

  return publicProgressFromSummary(data, weekStart, weekEnd);
}

export async function getReviewerSafeGroupProgressForRange(
  supabase: GroupAnalyticsClient,
  context: GroupAnalyticsContext,
  startDate: string,
  endDate: string,
): Promise<PublicGroupProgress> {
  const rangeStart = new Date(`${startDate}T00:00:00`);
  const rangeEnd = new Date(`${endDate}T00:00:00`);
  rangeEnd.setDate(rangeEnd.getDate() + 1);

  const { data } = await supabase
    .rpc("get_group_progress_summary", {
      target_group_id: context.groupId,
      target_exam_program_id: context.examProgramId,
      target_week_start: rangeStart.toISOString(),
      target_week_end: rangeEnd.toISOString(),
    })
    .maybeSingle();

  return publicProgressFromSummary(data, rangeStart, rangeEnd);
}

export function getPublicGroupProgress(
  weekData: {
    studySessions: StudySessionRow[];
    questionAttempts: QuestionAttemptRow[];
    mockAttempts: MockAttemptRow[];
    externalDrills: ExternalDrillRow[];
  },
  weakSignals: {
    topWeakSubjects: GroupWeakSignal[];
    topWeakTopics: GroupWeakSignal[];
  },
  weekStart: string,
  weekEnd: string,
): PublicGroupProgress {
  const totalStudyMinutesThisWeek = Math.round(
    weekData.studySessions.reduce(
      (sum, session) => sum + session.duration_seconds,
      0,
    ) / 60,
  );

  return {
    reviewerCount: 0,
    activeReviewersThisWeek: 0,
    totalStudyMinutesThisWeek,
    totalQuestionsAnsweredThisWeek: weekData.questionAttempts.length,
    averagePracticeAccuracy:
      weekData.questionAttempts.length > 0
        ? (weekData.questionAttempts.filter((attempt) => attempt.is_correct)
            .length /
            weekData.questionAttempts.length) *
          100
        : null,
    mockExamsCompletedThisWeek: weekData.mockAttempts.length,
    externalDrillsLoggedThisWeek: weekData.externalDrills.length,
    activeDaysThisWeek: activeDayCount([
      ...weekData.studySessions,
      ...weekData.questionAttempts,
      ...weekData.mockAttempts,
      ...weekData.externalDrills,
    ]),
    topWeakSubjects: weakSignals.topWeakSubjects,
    topWeakTopics: weakSignals.topWeakTopics,
    weekStart,
    weekEnd,
  };
}
