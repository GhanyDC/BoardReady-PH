import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/types";

export const readinessDisclaimer =
  "This is an internal study estimate and does not guarantee board exam results.";

export const readinessComponentWeights = {
  practice: 0.35,
  mockExam: 0.35,
  weakArea: 0.15,
  studyConsistency: 0.1,
  externalDrill: 0.05,
} as const;

export const minimumPracticeAttempts = 20;
export const minimumSubjectPracticeAttempts = 5;

export type ReadinessLabel =
  | "high_risk"
  | "needs_work"
  | "near_ready"
  | "board_ready"
  | "strong";

export type SubjectReadinessPriority =
  | "urgent"
  | "high"
  | "medium"
  | "maintenance";

export type ReadinessContext = {
  userId: string;
  groupId: string;
  examProgramId: string;
};

export type ReadinessComponentKey =
  | "practice"
  | "mockExam"
  | "weakArea"
  | "studyConsistency"
  | "externalDrill";

export type ReadinessComponent = {
  key: ReadinessComponentKey;
  label: string;
  weight: number;
  score: number | null;
  weightedContribution: number;
  insufficient: boolean;
  detail: string;
};

export type SubjectReadiness = {
  subjectId: string;
  subjectName: string;
  subjectWeight: number;
  practiceAccuracy: number | null;
  practiceAttemptCount: number;
  mockExamAccuracy: number | null;
  mockExamItemCount: number;
  weakTopicCount: number;
  criticalWeakTopicCount: number;
  highWeakTopicCount: number;
  mediumWeakTopicCount: number;
  externalDrillAverage: number | null;
  externalDrillCount: number;
  readinessEstimate: number | null;
  priority: SubjectReadinessPriority;
  insufficientData: boolean;
  notes: string[];
};

export type ReadinessAssessment = {
  context: ReadinessContext;
  overallReadiness: number;
  label: ReadinessLabel;
  labelText: string;
  components: ReadinessComponent[];
  subjectBreakdown: SubjectReadiness[];
  warnings: string[];
  calculatedAt: string;
  selectedMockExamTitle: string | null;
  recommendationSummary: Json;
};

type ReadinessClient = SupabaseClient<Database>;

type SubjectRow = {
  id: string;
  name: string;
  board_weight: number;
  sort_order: number;
};

type PracticeQuestionRow = {
  id: string;
  subject_id: string;
};

type PracticeAttemptRow = {
  question_id: string;
  is_correct: boolean;
};

type MockAttemptRow = {
  id: string;
  mock_exam_id: string;
  percentage: number | null;
  submitted_at: string | null;
};

type WeakAreaRow =
  Database["public"]["Functions"]["refresh_user_weak_areas"]["Returns"][number];

type ExternalDrillRow = {
  subject_id: string;
  total_items: number;
  score: number;
  percentage: number;
};

function clampScore(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function roundScore(value: number) {
  return Math.round(clampScore(value) * 100) / 100;
}

function formatScore(value: number | null) {
  if (value === null) {
    return "Not enough data";
  }

  return `${roundScore(value).toFixed(1)}%`;
}

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

function weightedAverage(
  subjects: SubjectRow[],
  scoreBySubjectId: Map<string, number>,
) {
  if (subjects.length === 0) {
    return null;
  }

  const totalWeight = subjects.reduce(
    (sum, subject) => sum + Math.max(0, subject.board_weight),
    0,
  );
  const fallbackWeight = totalWeight > 0 ? 0 : 1;
  const divisor = totalWeight > 0 ? totalWeight : subjects.length;
  const weightedTotal = subjects.reduce((sum, subject) => {
    const weight =
      totalWeight > 0 ? Math.max(0, subject.board_weight) : fallbackWeight;
    const score = scoreBySubjectId.get(subject.id) ?? 0;

    return sum + score * weight;
  }, 0);

  return divisor > 0 ? weightedTotal / divisor : null;
}

function accuracy(correct: number, total: number) {
  return total > 0 ? (correct / total) * 100 : null;
}

function priorityForSubject(subject: {
  readinessEstimate: number | null;
  criticalWeakTopicCount: number;
}) {
  if (subject.criticalWeakTopicCount > 0) {
    return "urgent" satisfies SubjectReadinessPriority;
  }

  if (subject.readinessEstimate === null) {
    return "high" satisfies SubjectReadinessPriority;
  }

  if (subject.readinessEstimate < 60) {
    return "urgent" satisfies SubjectReadinessPriority;
  }

  if (subject.readinessEstimate < 75) {
    return "high" satisfies SubjectReadinessPriority;
  }

  if (subject.readinessEstimate < 85) {
    return "medium" satisfies SubjectReadinessPriority;
  }

  return "maintenance" satisfies SubjectReadinessPriority;
}

export function readinessLabelText(label: ReadinessLabel) {
  const labels: Record<ReadinessLabel, string> = {
    high_risk: "High risk",
    needs_work: "Needs work",
    near_ready: "Near ready",
    board_ready: "Board ready",
    strong: "Strong",
  };

  return labels[label];
}

export function readinessLabelForScore(
  overallReadiness: number,
  subjects: SubjectReadiness[],
): ReadinessLabel {
  const scoredSubjects = subjects.filter(
    (subject) => subject.readinessEstimate !== null,
  );
  const anySubjectBelow60 = scoredSubjects.some(
    (subject) => (subject.readinessEstimate ?? 0) < 60,
  );
  const anySubjectBelow70 = scoredSubjects.some(
    (subject) => (subject.readinessEstimate ?? 0) < 70,
  );
  const anySubjectBelow80 = scoredSubjects.some(
    (subject) => (subject.readinessEstimate ?? 0) < 80,
  );

  if (overallReadiness < 60 || anySubjectBelow60) {
    return "high_risk";
  }

  if (overallReadiness >= 90 && !anySubjectBelow80) {
    return "strong";
  }

  if (overallReadiness >= 80 && !anySubjectBelow70) {
    return "board_ready";
  }

  if (overallReadiness >= 75) {
    return "near_ready";
  }

  return "needs_work";
}

function componentForOverall(component: ReadinessComponent) {
  return component.score ?? 0;
}

function buildComponent(
  key: ReadinessComponentKey,
  label: string,
  weight: number,
  score: number | null,
  detail: string,
) {
  const roundedScore = score === null ? null : roundScore(score);

  return {
    key,
    label,
    weight,
    score: roundedScore,
    weightedContribution: roundScore((roundedScore ?? 0) * weight),
    insufficient: score === null,
    detail,
  } satisfies ReadinessComponent;
}

async function loadSubjects(
  supabase: ReadinessClient,
  context: ReadinessContext,
) {
  const { data } = await supabase
    .from("subjects")
    .select("id, name, board_weight, sort_order")
    .eq("group_id", context.groupId)
    .eq("exam_program_id", context.examProgramId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

async function loadPublishedPractice(
  supabase: ReadinessClient,
  context: ReadinessContext,
) {
  const { data: attempts } = await supabase
    .from("question_attempts")
    .select("question_id, is_correct")
    .eq("user_id", context.userId)
    .eq("group_id", context.groupId)
    .eq("exam_program_id", context.examProgramId)
    .order("created_at", { ascending: false })
    .limit(1000);
  const questionIds = [
    ...new Set((attempts ?? []).map((attempt) => attempt.question_id)),
  ];

  if (questionIds.length === 0) {
    return {
      attempts: [] as PracticeAttemptRow[],
      questionsById: new Map<string, PracticeQuestionRow>(),
    };
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, subject_id")
    .eq("group_id", context.groupId)
    .eq("exam_program_id", context.examProgramId)
    .eq("status", "published")
    .in("id", questionIds);
  const questionsById = new Map(
    (questions ?? []).map((question) => [question.id, question]),
  );
  const publishedAttempts = (attempts ?? []).filter((attempt) =>
    questionsById.has(attempt.question_id),
  );

  return {
    attempts: publishedAttempts,
    questionsById,
  };
}

async function loadMockSignal(
  supabase: ReadinessClient,
  context: ReadinessContext,
) {
  const { data: attempts } = await supabase
    .from("mock_exam_attempts")
    .select("id, mock_exam_id, percentage, submitted_at")
    .eq("user_id", context.userId)
    .eq("group_id", context.groupId)
    .eq("exam_program_id", context.examProgramId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(5);
  const submittedAttempts = (attempts ?? []).filter(
    (attempt): attempt is MockAttemptRow => attempt.percentage !== null,
  );
  const mockExamIds = [
    ...new Set(submittedAttempts.map((attempt) => attempt.mock_exam_id)),
  ];

  if (mockExamIds.length === 0) {
    return {
      score: null,
      detail: "No submitted mock exams yet.",
      selectedAttempt: null,
      selectedMockExam: null,
      subjectAccuracyById: new Map<string, { correct: number; total: number }>(),
    };
  }

  const { data: mockExams } = await supabase
    .from("mock_exams")
    .select("id, title, mock_type")
    .in("id", mockExamIds);
  const mockExamById = new Map(
    (mockExams ?? []).map((mockExam) => [mockExam.id, mockExam]),
  );
  const selectedAttempt =
    submittedAttempts.find(
      (attempt) => mockExamById.get(attempt.mock_exam_id)?.mock_type === "full",
    ) ?? submittedAttempts[0];
  const selectedMockExam = mockExamById.get(selectedAttempt.mock_exam_id) ?? null;
  const subjectAccuracyById = await loadMockSubjectAccuracy(
    supabase,
    selectedAttempt,
  );

  return {
    score: Number(selectedAttempt.percentage),
    detail: selectedMockExam
      ? `Using ${selectedMockExam.title}.`
      : "Using latest submitted mock exam.",
    selectedAttempt,
    selectedMockExam,
    subjectAccuracyById,
  };
}

async function loadMockSubjectAccuracy(
  supabase: ReadinessClient,
  attempt: MockAttemptRow,
) {
  const [{ data: items }, { data: answers }] = await Promise.all([
    supabase
      .from("mock_exam_items")
      .select("question_id")
      .eq("mock_exam_id", attempt.mock_exam_id),
    supabase
      .from("mock_exam_answers")
      .select("question_id, is_correct")
      .eq("mock_exam_attempt_id", attempt.id),
  ]);
  const questionIds = (items ?? []).map((item) => item.question_id);

  if (questionIds.length === 0) {
    return new Map<string, { correct: number; total: number }>();
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, subject_id")
    .in("id", questionIds);
  const answerByQuestionId = new Map(
    (answers ?? []).map((answer) => [answer.question_id, answer]),
  );
  const rows = new Map<string, { correct: number; total: number }>();

  for (const question of questions ?? []) {
    const current = rows.get(question.subject_id) ?? { correct: 0, total: 0 };
    const answer = answerByQuestionId.get(question.id);

    current.total += 1;

    if (answer?.is_correct) {
      current.correct += 1;
    }

    rows.set(question.subject_id, current);
  }

  return rows;
}

async function loadWeakAreas(
  supabase: ReadinessClient,
  context: ReadinessContext,
) {
  const { data } = await supabase.rpc("refresh_user_weak_areas", {
    target_group_id: context.groupId,
    target_exam_program_id: context.examProgramId,
  });

  return data ?? [];
}

async function loadStudyConsistency(
  supabase: ReadinessClient,
  context: ReadinessContext,
) {
  const { data: preferences } = await supabase
    .from("study_preferences")
    .select("weekly_goal_minutes")
    .eq("user_id", context.userId)
    .eq("group_id", context.groupId)
    .eq("exam_program_id", context.examProgramId)
    .maybeSingle();

  if (!preferences?.weekly_goal_minutes) {
    return {
      score: null,
      detail: "No weekly study goal set.",
    };
  }

  const weekStart = startOfLocalWeek(new Date());
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("duration_seconds")
    .eq("user_id", context.userId)
    .eq("group_id", context.groupId)
    .eq("exam_program_id", context.examProgramId)
    .gte("started_at", weekStart.toISOString())
    .lt("started_at", nextWeekStart.toISOString());
  const totalSeconds = (sessions ?? []).reduce(
    (sum, session) => sum + session.duration_seconds,
    0,
  );
  const goalSeconds = preferences.weekly_goal_minutes * 60;

  return {
    score: clampScore((totalSeconds / goalSeconds) * 100),
    detail: `${Math.round(totalSeconds / 60)} of ${
      preferences.weekly_goal_minutes
    } weekly goal minutes logged.`,
  };
}

async function loadExternalDrills(
  supabase: ReadinessClient,
  context: ReadinessContext,
) {
  const { data } = await supabase
    .from("external_drill_logs")
    .select("subject_id, total_items, score, percentage")
    .eq("user_id", context.userId)
    .eq("group_id", context.groupId)
    .eq("exam_program_id", context.examProgramId);

  return data ?? [];
}

function practiceStatsBySubject(
  subjects: SubjectRow[],
  attempts: PracticeAttemptRow[],
  questionsById: Map<string, PracticeQuestionRow>,
) {
  const stats = new Map<string, { correct: number; total: number }>();

  for (const subject of subjects) {
    stats.set(subject.id, { correct: 0, total: 0 });
  }

  for (const attempt of attempts) {
    const question = questionsById.get(attempt.question_id);

    if (!question) {
      continue;
    }

    const current = stats.get(question.subject_id) ?? { correct: 0, total: 0 };
    current.total += 1;

    if (attempt.is_correct) {
      current.correct += 1;
    }

    stats.set(question.subject_id, current);
  }

  return stats;
}

function weakAreaStatsBySubject(subjects: SubjectRow[], weakAreas: WeakAreaRow[]) {
  const stats = new Map<
    string,
    {
      weak: number;
      critical: number;
      high: number;
      medium: number;
      penalty: number;
    }
  >();

  for (const subject of subjects) {
    stats.set(subject.id, {
      weak: 0,
      critical: 0,
      high: 0,
      medium: 0,
      penalty: 0,
    });
  }

  for (const area of weakAreas) {
    const current = stats.get(area.subject_id) ?? {
      weak: 0,
      critical: 0,
      high: 0,
      medium: 0,
      penalty: 0,
    };

    if (area.priority === "critical") {
      current.weak += 1;
      current.critical += 1;
      current.penalty += 18;
    } else if (area.priority === "high") {
      current.weak += 1;
      current.high += 1;
      current.penalty += 12;
    } else if (area.priority === "medium") {
      current.weak += 1;
      current.medium += 1;
      current.penalty += 7;
    } else if (area.priority === "watchlist") {
      current.penalty += 2;
    }

    stats.set(area.subject_id, current);
  }

  return stats;
}

function externalStatsBySubject(
  subjects: SubjectRow[],
  logs: ExternalDrillRow[],
) {
  const stats = new Map<
    string,
    {
      totalPercentage: number;
      count: number;
    }
  >();

  for (const subject of subjects) {
    stats.set(subject.id, {
      totalPercentage: 0,
      count: 0,
    });
  }

  for (const log of logs) {
    const current = stats.get(log.subject_id) ?? {
      totalPercentage: 0,
      count: 0,
    };
    current.totalPercentage += Number(log.percentage);
    current.count += 1;
    stats.set(log.subject_id, current);
  }

  return stats;
}

function buildSubjectBreakdown(
  subjects: SubjectRow[],
  practiceStats: Map<string, { correct: number; total: number }>,
  mockStats: Map<string, { correct: number; total: number }>,
  weakStats: Map<
    string,
    {
      weak: number;
      critical: number;
      high: number;
      medium: number;
      penalty: number;
    }
  >,
  externalStats: Map<string, { totalPercentage: number; count: number }>,
) {
  return subjects.map((subject) => {
    const practice = practiceStats.get(subject.id) ?? { correct: 0, total: 0 };
    const mock = mockStats.get(subject.id) ?? { correct: 0, total: 0 };
    const weak = weakStats.get(subject.id) ?? {
      weak: 0,
      critical: 0,
      high: 0,
      medium: 0,
      penalty: 0,
    };
    const external = externalStats.get(subject.id) ?? {
      totalPercentage: 0,
      count: 0,
    };
    const practiceAccuracy = accuracy(practice.correct, practice.total);
    const mockExamAccuracy = accuracy(mock.correct, mock.total);
    const weakScore = clampScore(100 - weak.penalty);
    const externalAverage =
      external.count > 0 ? external.totalPercentage / external.count : null;
    const notes: string[] = [];
    const weightedParts: { score: number; weight: number }[] = [];

    if (practiceAccuracy !== null) {
      weightedParts.push({ score: practiceAccuracy, weight: 0.45 });
    }

    if (mockExamAccuracy !== null) {
      weightedParts.push({ score: mockExamAccuracy, weight: 0.35 });
    }

    weightedParts.push({ score: weakScore, weight: 0.15 });

    if (externalAverage !== null) {
      weightedParts.push({ score: externalAverage, weight: 0.05 });
    }

    if (practice.total < minimumSubjectPracticeAttempts) {
      notes.push("Insufficient practice attempts for this subject.");
    }

    if (mock.total === 0) {
      notes.push("No submitted mock exam items for this subject yet.");
    }

    const availableWeight = weightedParts.reduce(
      (sum, part) => sum + part.weight,
      0,
    );
    const readinessEstimate =
      availableWeight > 0
        ? weightedParts.reduce((sum, part) => sum + part.score * part.weight, 0) /
          availableWeight
        : null;
    const insufficientData =
      practice.total < minimumSubjectPracticeAttempts && mock.total === 0;
    const priority = priorityForSubject({
      readinessEstimate,
      criticalWeakTopicCount: weak.critical,
    });

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      subjectWeight: subject.board_weight,
      practiceAccuracy:
        practiceAccuracy === null ? null : roundScore(practiceAccuracy),
      practiceAttemptCount: practice.total,
      mockExamAccuracy:
        mockExamAccuracy === null ? null : roundScore(mockExamAccuracy),
      mockExamItemCount: mock.total,
      weakTopicCount: weak.weak,
      criticalWeakTopicCount: weak.critical,
      highWeakTopicCount: weak.high,
      mediumWeakTopicCount: weak.medium,
      externalDrillAverage:
        externalAverage === null ? null : roundScore(externalAverage),
      externalDrillCount: external.count,
      readinessEstimate:
        readinessEstimate === null ? null : roundScore(readinessEstimate),
      priority,
      insufficientData,
      notes,
    } satisfies SubjectReadiness;
  });
}

export async function calculateReadinessAssessment(
  supabase: ReadinessClient,
  context: ReadinessContext,
): Promise<ReadinessAssessment> {
  const [
    subjects,
    practiceResult,
    mockSignal,
    weakAreas,
    studyConsistency,
    externalDrills,
  ] = await Promise.all([
    loadSubjects(supabase, context),
    loadPublishedPractice(supabase, context),
    loadMockSignal(supabase, context),
    loadWeakAreas(supabase, context),
    loadStudyConsistency(supabase, context),
    loadExternalDrills(supabase, context),
  ]);
  const practiceStats = practiceStatsBySubject(
    subjects,
    practiceResult.attempts,
    practiceResult.questionsById,
  );
  const practiceScoreBySubject = new Map<string, number>();

  for (const subject of subjects) {
    const stats = practiceStats.get(subject.id) ?? { correct: 0, total: 0 };
    practiceScoreBySubject.set(
      subject.id,
      stats.total > 0 ? ((stats.correct / stats.total) * 100) : 0,
    );
  }

  const practiceScore =
    practiceResult.attempts.length >= minimumPracticeAttempts
      ? weightedAverage(subjects, practiceScoreBySubject)
      : null;
  const weakStats = weakAreaStatsBySubject(subjects, weakAreas);
  const externalStats = externalStatsBySubject(subjects, externalDrills);
  const externalAverage =
    externalDrills.length > 0
      ? externalDrills.reduce((sum, log) => sum + Number(log.percentage), 0) /
        externalDrills.length
      : null;
  const weakPenalty = weakAreas.reduce((penalty, area) => {
    if (area.priority === "critical") {
      return penalty + 18;
    }

    if (area.priority === "high") {
      return penalty + 12;
    }

    if (area.priority === "medium") {
      return penalty + 7;
    }

    if (area.priority === "watchlist") {
      return penalty + 2;
    }

    return penalty;
  }, 0);
  const weakAreaScore =
    practiceResult.attempts.length >= minimumSubjectPracticeAttempts
      ? clampScore(100 - weakPenalty)
      : null;
  const subjectBreakdown = buildSubjectBreakdown(
    subjects,
    practiceStats,
    mockSignal.subjectAccuracyById,
    weakStats,
    externalStats,
  );
  const components = [
    buildComponent(
      "practice",
      "Practice Performance",
      readinessComponentWeights.practice,
      practiceScore,
      practiceScore === null
        ? `${practiceResult.attempts.length}/${minimumPracticeAttempts} published-question attempts logged.`
        : `Weighted subject accuracy is ${formatScore(practiceScore)}.`,
    ),
    buildComponent(
      "mockExam",
      "Mock Exam Performance",
      readinessComponentWeights.mockExam,
      mockSignal.score,
      mockSignal.detail,
    ),
    buildComponent(
      "weakArea",
      "Weak Area Control",
      readinessComponentWeights.weakArea,
      weakAreaScore,
      weakAreaScore === null
        ? "Answer more practice questions to generate weak-area signals."
        : `${weakAreas.length} weak-area rows evaluated.`,
    ),
    buildComponent(
      "studyConsistency",
      "Study Consistency",
      readinessComponentWeights.studyConsistency,
      studyConsistency.score,
      studyConsistency.detail,
    ),
    buildComponent(
      "externalDrill",
      "External Drill Signal",
      readinessComponentWeights.externalDrill,
      externalAverage,
      externalAverage === null
        ? "No external drill logs yet."
        : `Average external drill score is ${formatScore(externalAverage)}.`,
    ),
  ];
  const overallReadiness = roundScore(
    components.reduce(
      (sum, component) =>
        sum + componentForOverall(component) * component.weight,
      0,
    ),
  );
  const label = readinessLabelForScore(overallReadiness, subjectBreakdown);
  const warnings = components
    .filter((component) => component.insufficient)
    .map((component) => `${component.label}: ${component.detail}`);

  if (subjects.length === 0) {
    warnings.push("No active subjects are configured for this exam program.");
  }

  return {
    context,
    overallReadiness,
    label,
    labelText: readinessLabelText(label),
    components,
    subjectBreakdown,
    warnings,
    calculatedAt: new Date().toISOString(),
    selectedMockExamTitle: mockSignal.selectedMockExam?.title ?? null,
    recommendationSummary: [],
  };
}

export async function saveReadinessSnapshot(
  supabase: ReadinessClient,
  assessment: ReadinessAssessment,
) {
  const componentByKey = new Map(
    assessment.components.map((component) => [component.key, component]),
  );

  return supabase.rpc("save_readiness_snapshot", {
    target_user_id: assessment.context.userId,
    target_group_id: assessment.context.groupId,
    target_exam_program_id: assessment.context.examProgramId,
    target_overall_readiness: assessment.overallReadiness,
    target_practice_component: componentByKey.get("practice")?.score ?? null,
    target_mock_exam_component: componentByKey.get("mockExam")?.score ?? null,
    target_weak_area_component: componentByKey.get("weakArea")?.score ?? null,
    target_study_consistency_component:
      componentByKey.get("studyConsistency")?.score ?? null,
    target_external_drill_component:
      componentByKey.get("externalDrill")?.score ?? null,
    target_subject_breakdown: assessment.subjectBreakdown as unknown as Json,
    target_recommendation_summary: assessment.recommendationSummary,
  });
}
