"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdminContext } from "@/lib/admin-auth";
import {
  bloomLevels,
  questionDifficulties,
  questionSourceTypes,
} from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";

const choiceLabels = ["A", "B", "C", "D"] as const;
const difficultyValues: string[] = questionDifficulties.map((item) => item.value);
const bloomLevelValues: string[] = bloomLevels.map((item) => item.value);
const sourceTypeValues: string[] = questionSourceTypes.map((item) => item.value);

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
      error: "Choose a topic that belongs to the selected subject.",
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
        topicId: [topicError],
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
      message: questionError?.message ?? "Question could not be created.",
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
      message: choicesError.message,
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
        message: publishError.message,
      };
    }
  }

  redirect("/admin/questions");
}
