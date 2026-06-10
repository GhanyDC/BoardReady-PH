import type { ReadinessAssessment } from "@/lib/readiness";

export type StudyRecommendationPriority = "urgent" | "high" | "medium" | "low";

export type StudyRecommendation = {
  id: string;
  title: string;
  detail: string;
  href: string;
  priority: StudyRecommendationPriority;
};

function componentScore(
  assessment: ReadinessAssessment,
  key: ReadinessAssessment["components"][number]["key"],
) {
  return assessment.components.find((component) => component.key === key)
    ?.score ?? null;
}

function hasRecommendation(
  recommendations: StudyRecommendation[],
  id: string,
) {
  return recommendations.some((recommendation) => recommendation.id === id);
}

function addRecommendation(
  recommendations: StudyRecommendation[],
  recommendation: StudyRecommendation,
) {
  if (!hasRecommendation(recommendations, recommendation.id)) {
    recommendations.push(recommendation);
  }
}

export function recommendationPriorityLabel(
  priority: StudyRecommendationPriority,
) {
  const labels: Record<StudyRecommendationPriority, string> = {
    urgent: "Urgent",
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  return labels[priority];
}

export function getStudyRecommendations(
  assessment: ReadinessAssessment,
): StudyRecommendation[] {
  const recommendations: StudyRecommendation[] = [];
  const subjectsByRisk = [...assessment.subjectBreakdown].sort((left, right) => {
    const leftScore = left.readinessEstimate ?? -1;
    const rightScore = right.readinessEstimate ?? -1;

    return leftScore - rightScore;
  });
  const urgentSubject = subjectsByRisk.find(
    (subject) =>
      subject.criticalWeakTopicCount > 0 ||
      (subject.readinessEstimate !== null && subject.readinessEstimate < 60),
  );
  const highSubject = subjectsByRisk.find(
    (subject) =>
      subject.priority === "high" &&
      subject.readinessEstimate !== null &&
      subject.readinessEstimate < 75,
  );
  const lowMockSubject = subjectsByRisk.find(
    (subject) =>
      subject.mockExamAccuracy !== null && subject.mockExamAccuracy < 70,
  );
  const lowPracticeSubject = subjectsByRisk.find(
    (subject) =>
      subject.practiceAttemptCount > 0 &&
      subject.practiceAccuracy !== null &&
      subject.practiceAccuracy < 70,
  );
  const practiceScore = componentScore(assessment, "practice");
  const mockScore = componentScore(assessment, "mockExam");
  const studyScore = componentScore(assessment, "studyConsistency");
  const externalScore = componentScore(assessment, "externalDrill");

  if (urgentSubject) {
    addRecommendation(recommendations, {
      id: `urgent-${urgentSubject.subjectId}`,
      title: `Prioritize ${urgentSubject.subjectName}`,
      detail:
        urgentSubject.criticalWeakTopicCount > 0
          ? "Critical weak areas are present. Review those topics before broad review."
          : "This subject is below the high-risk threshold. Start with focused review and short drills.",
      href: "/weak-areas",
      priority: "urgent",
    });
  }

  if (practiceScore === null) {
    addRecommendation(recommendations, {
      id: "practice-volume",
      title: "Build a practice baseline",
      detail:
        "Answer more published-question drills so the practice component can measure weighted subject accuracy.",
      href: "/practice",
      priority: "high",
    });
  } else if (lowPracticeSubject) {
    addRecommendation(recommendations, {
      id: `practice-${lowPracticeSubject.subjectId}`,
      title: `Take a focused drill in ${lowPracticeSubject.subjectName}`,
      detail:
        "Practice accuracy is lagging for this subject. Use a short subject or topic drill and review missed rationales.",
      href: "/practice",
      priority: "high",
    });
  }

  if (mockScore === null) {
    addRecommendation(recommendations, {
      id: "mock-needed",
      title: "Take a mock exam",
      detail:
        "No submitted mock exam is available yet. Start with a quick mock once enough published questions exist.",
      href: "/mock-exams",
      priority: "high",
    });
  } else if (lowMockSubject) {
    addRecommendation(recommendations, {
      id: `mock-${lowMockSubject.subjectId}`,
      title: `Review mock exam misses in ${lowMockSubject.subjectName}`,
      detail:
        "Mock exam performance is low for this subject. Review answer rationales before the next timed attempt.",
      href: "/mock-exams",
      priority: "medium",
    });
  }

  if (highSubject && !urgentSubject) {
    addRecommendation(recommendations, {
      id: `high-${highSubject.subjectId}`,
      title: `Stabilize ${highSubject.subjectName}`,
      detail:
        "This subject is not yet stable. Pair topic review with a short timed practice set.",
      href: "/practice",
      priority: "medium",
    });
  }

  if (studyScore === null) {
    addRecommendation(recommendations, {
      id: "study-goal",
      title: "Set a weekly study goal",
      detail:
        "A weekly goal lets BoardReady PH estimate study consistency without mixing it into practice accuracy.",
      href: "/study-habits",
      priority: "medium",
    });
  } else if (studyScore < 80) {
    addRecommendation(recommendations, {
      id: "study-deficit",
      title: "Add one focused study session",
      detail:
        "You are below your weekly study goal. Add a focused session and log it with the study timer.",
      href: "/study-timer",
      priority: "medium",
    });
  }

  if (externalScore === null) {
    addRecommendation(recommendations, {
      id: "external-drill-log",
      title: "Log external drill scores when available",
      detail:
        "External drill logs are optional and self-reported, but they can add a small supporting signal.",
      href: "/external-drills/new",
      priority: "low",
    });
  }

  if (recommendations.length === 0) {
    addRecommendation(recommendations, {
      id: "maintenance",
      title: "Maintain balanced review",
      detail:
        "No urgent readiness gaps are visible. Keep rotating practice, timed mocks, rationale review, and study logging.",
      href: "/practice",
      priority: "low",
    });
  }

  return recommendations.slice(0, 5);
}
