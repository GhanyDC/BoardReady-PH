"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdminContext } from "@/lib/admin-auth";
import {
  bloomLevels,
  questionDifficulties,
  questionStatuses,
  questionSourceTypes,
} from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";

const choiceLabels = ["A", "B", "C", "D"] as const;
const difficultyValues: string[] = questionDifficulties.map((item) => item.value);
const bloomLevelValues: string[] = bloomLevels.map((item) => item.value);
const sourceTypeValues: string[] = questionSourceTypes.map((item) => item.value);
const statusValues: string[] = questionStatuses.map((item) => item.value);

const allowedStatusTransitions: Record<string, string[]> = {
  draft: ["draft", "pending_review", "published"],
  pending_review: [
    "pending_review",
    "needs_revision",
    "published",
    "rejected",
  ],
  needs_revision: ["needs_revision", "pending_review"],
  published: ["published", "archived"],
  archived: ["archived", "published"],
  rejected: ["rejected"],
};

const adminQuestionSchema = z.object({
  subjectId: z.string().uuid("Choose a subject."),
  topicId: z.string().uuid("Choose a topic."),
  difficulty: z.string().refine((value) => difficultyValues.includes(value), {
    message: "Choose a difficulty.",
  }),
  bloomLevel: z.string().refine((value) => bloomLevelValues.includes(value), {
    message: "Choose a Bloom level.",
  }),
  sourceType: z.string().refine((value) => sourceTypeValues.includes(value), {
    message: "Choose a source type.",
  }),
  questionText: z
    .string()
    .trim()
    .min(10, "Question text must be at least 10 characters.")
    .max(8000, "Question text is too long."),
  rationale: z.string().trim().max(8000, "Rationale is too long."),
  correctAnswer: z.enum(choiceLabels, {
    error: "Choose exactly one correct answer.",
  }),
  intent: z.enum(["draft", "publish"]),
});

const adminQuestionUpdateSchema = adminQuestionSchema.extend({
  questionId: z.string().uuid(),
  status: z.string().refine((value) => statusValues.includes(value), {
    message: "Choose a valid status.",
  }),
  intent: z.literal("update"),
});

export type QuestionFormState = {
  errors?: {
    subjectId?: string[];
    topicId?: string[];
    difficulty?: string[];
    bloomLevel?: string[];
    sourceType?: string[];
    questionText?: string[];
    rationale?: string[];
    correctAnswer?: string[];
    choices?: string[];
    status?: string[];
  };
  message?: string;
};

function parseChoices(formData: FormData, correctAnswer: string) {
  return choiceLabels.map((label, index) => ({
    choice_label: label,
    choice_text: formData.get(`choiceText${label}`)?.toString().trim() ?? "",
    explanation:
      formData.get(`choiceExplanation${label}`)?.toString().trim() || null,
    is_correct: label === correctAnswer,
    order_index: index + 1,
  }));
}

function validateChoices(choices: ReturnType<typeof parseChoices>) {
  const missingChoice = choices.find((choice) => choice.choice_text.length === 0);

  if (missingChoice) {
    return `Choice ${missingChoice.choice_label} is required.`;
  }

  const correctCount = choices.filter((choice) => choice.is_correct).length;

  if (choices.length !== 4 || correctCount !== 1) {
    return "Exactly four choices and one correct answer are required.";
  }

  return null;
}

async function assertTopicInSubject(subjectId: string, topicId: string) {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .select("id")
    .eq("id", subjectId)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .eq("is_active", true)
    .maybeSingle();

  if (subjectError || !subject) {
    return {
      context,
      supabase,
      error: {
        field: "subjectId" as const,
        message: "Choose a subject from the active exam track.",
      },
    };
  }

  const { data: topic, error } = await supabase
    .from("topics")
    .select("id")
    .eq("id", topicId)
    .eq("subject_id", subjectId)
    .eq("group_id", context.activeGroup.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !topic) {
    return {
      context,
      supabase,
      error: {
        field: "topicId" as const,
        message: "Choose a topic that belongs to the selected subject.",
      },
    };
  }

  return { context, supabase, error: null };
}

export async function createAdminQuestionAction(
  _state: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  const parsed = adminQuestionSchema.safeParse({
    subjectId: formData.get("subjectId"),
    topicId: formData.get("topicId"),
    difficulty: formData.get("difficulty"),
    bloomLevel: formData.get("bloomLevel"),
    sourceType: formData.get("sourceType"),
    questionText: formData.get("questionText"),
    rationale: formData.get("rationale")?.toString() ?? "",
    correctAnswer: formData.get("correctAnswer"),
    intent: formData.get("intent"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.intent === "publish" && parsed.data.rationale.length < 5) {
    return {
      errors: {
        rationale: ["Rationale is required before publishing."],
      },
    };
  }

  const choices = parseChoices(formData, parsed.data.correctAnswer);
  const choiceError = validateChoices(choices);

  if (choiceError) {
    return {
      errors: {
        choices: [choiceError],
      },
    };
  }

  const { context, supabase, error: topicError } = await assertTopicInSubject(
    parsed.data.subjectId,
    parsed.data.topicId,
  );

  if (topicError) {
    return {
      errors: {
        [topicError.field]: [topicError.message],
      },
    };
  }

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .insert({
      group_id: context.activeGroup.id,
      exam_program_id: context.activeExamProgram.id,
      subject_id: parsed.data.subjectId,
      topic_id: parsed.data.topicId,
      question_text: parsed.data.questionText,
      difficulty: parsed.data.difficulty,
      bloom_level: parsed.data.bloomLevel,
      rationale: parsed.data.rationale || null,
      source_type: parsed.data.sourceType,
      status: "draft",
      created_by: context.user.id,
    })
    .select("id")
    .single();

  if (questionError || !question) {
    return {
      message: "Question could not be created. Check the form and try again.",
    };
  }

  const { error: choicesError } = await supabase.from("choices").insert(
    choices.map((choice) => ({
      ...choice,
      question_id: question.id,
    })),
  );

  if (choicesError) {
    await supabase.from("questions").delete().eq("id", question.id);
    return {
      message: "Question choices could not be saved. Check the choices and try again.",
    };
  }

  if (parsed.data.intent === "publish") {
    const { error: publishError } = await supabase
      .from("questions")
      .update({
        status: "published",
        verified_by: context.user.id,
        published_at: new Date().toISOString(),
      })
      .eq("id", question.id);

    if (publishError) {
      return {
        message: "Question could not be published. Check the question and try again.",
      };
    }
  }

  redirect("/admin/questions");
}

export async function updateAdminQuestionAction(
  _state: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  const parsed = adminQuestionUpdateSchema.safeParse({
    questionId: formData.get("questionId"),
    subjectId: formData.get("subjectId"),
    topicId: formData.get("topicId"),
    difficulty: formData.get("difficulty"),
    bloomLevel: formData.get("bloomLevel"),
    sourceType: formData.get("sourceType"),
    status: formData.get("status"),
    questionText: formData.get("questionText"),
    rationale: formData.get("rationale")?.toString() ?? "",
    correctAnswer: formData.get("correctAnswer"),
    intent: formData.get("intent"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.status === "published" && parsed.data.rationale.length < 5) {
    return {
      errors: {
        rationale: ["Rationale is required before publishing."],
      },
    };
  }

  const choices = parseChoices(formData, parsed.data.correctAnswer);
  const choiceError = validateChoices(choices);

  if (choiceError) {
    return {
      errors: {
        choices: [choiceError],
      },
    };
  }

  const { context, supabase, error: topicError } = await assertTopicInSubject(
    parsed.data.subjectId,
    parsed.data.topicId,
  );

  if (topicError) {
    return {
      errors: {
        [topicError.field]: [topicError.message],
      },
    };
  }

  const { data: existingQuestion, error: loadError } = await supabase
    .from("questions")
    .select("id, status")
    .eq("id", parsed.data.questionId)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .maybeSingle();

  if (loadError || !existingQuestion) {
    return {
      message: "Question could not be loaded for this active group.",
    };
  }

  const allowedTargets = allowedStatusTransitions[existingQuestion.status] ?? [];

  if (!allowedTargets.includes(parsed.data.status)) {
    return {
      errors: {
        status: [
          `Cannot change status from ${existingQuestion.status} to ${parsed.data.status}.`,
        ],
      },
    };
  }

  const { error: choicesError } = await supabase.from("choices").upsert(
    choices.map((choice) => ({
      ...choice,
      question_id: parsed.data.questionId,
    })),
    {
      onConflict: "question_id,choice_label",
    },
  );

  if (choicesError) {
    return {
      message: "Question choices could not be saved. Check the choices and try again.",
    };
  }

  const updatePayload: {
    subject_id: string;
    topic_id: string;
    question_text: string;
    difficulty: string;
    bloom_level: string;
    rationale: string | null;
    source_type: string;
    status: string;
    verified_by?: string;
    published_at?: string;
    archived_at?: string;
  } = {
    subject_id: parsed.data.subjectId,
    topic_id: parsed.data.topicId,
    question_text: parsed.data.questionText,
    difficulty: parsed.data.difficulty,
    bloom_level: parsed.data.bloomLevel,
    rationale: parsed.data.rationale || null,
    source_type: parsed.data.sourceType,
    status: parsed.data.status,
  };

  if (
    parsed.data.status === "published" &&
    existingQuestion.status !== "published"
  ) {
    updatePayload.verified_by = context.user.id;
    updatePayload.published_at = new Date().toISOString();
  }

  if (parsed.data.status === "archived" && existingQuestion.status !== "archived") {
    updatePayload.archived_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("questions")
    .update(updatePayload)
    .eq("id", parsed.data.questionId)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id);

  if (updateError) {
    return {
      message: "Question could not be updated. Check the form and try again.",
    };
  }

  redirect("/admin/questions");
}
