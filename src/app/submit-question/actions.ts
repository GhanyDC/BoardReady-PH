"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import type { QuestionFormState } from "@/app/admin/questions/actions";
import { requireMembership } from "@/lib/current-user";
import {
  bloomLevels,
  questionDifficulties,
  questionSourceTypes,
} from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";

const choiceLabels = ["A", "B", "C", "D"] as const;
const difficultyValues: string[] = questionDifficulties.map((item) => item.value);
const bloomLevelValues: string[] = bloomLevels.map((item) => item.value);
const reviewerSourceValues: string[] = questionSourceTypes
  .filter((item) => ["reviewer_submitted", "personal_notes"].includes(item.value))
  .map((item) => item.value);

const reviewerQuestionSchema = z.object({
  subjectId: z.string().uuid("Choose a subject."),
  topicId: z.string().uuid("Choose a topic."),
  difficulty: z.string().refine((value) => difficultyValues.includes(value), {
    message: "Choose a difficulty.",
  }),
  bloomLevel: z.string().refine((value) => bloomLevelValues.includes(value), {
    message: "Choose a Bloom level.",
  }),
  sourceType: z.string().refine((value) => reviewerSourceValues.includes(value), {
    message: "Choose a valid source type.",
  }),
  questionText: z
    .string()
    .trim()
    .min(10, "Question text must be at least 10 characters.")
    .max(8000, "Question text is too long."),
  rationale: z
    .string()
    .trim()
    .min(5, "Rationale is required for reviewer submissions.")
    .max(8000, "Rationale is too long."),
  correctAnswer: z.enum(choiceLabels, {
    error: "Choose exactly one correct answer.",
  }),
  intent: z.literal("submit"),
});

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

export async function submitReviewerQuestionAction(
  _state: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  const parsed = reviewerQuestionSchema.safeParse({
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

  const choices = parseChoices(formData, parsed.data.correctAnswer);
  const choiceError = validateChoices(choices);

  if (choiceError) {
    return {
      errors: {
        choices: [choiceError],
      },
    };
  }

  const context = await requireMembership();

  if (!context.activeGroup || !context.activeExamProgram) {
    return {
      message: "Join a group before submitting questions.",
    };
  }

  const supabase = await createClient();
  const { data: subject } = await supabase
    .from("subjects")
    .select("id")
    .eq("id", parsed.data.subjectId)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!subject) {
    return {
      errors: {
        subjectId: ["Choose a subject from your active group and exam track."],
      },
    };
  }

  const { data: topic } = await supabase
    .from("topics")
    .select("id")
    .eq("id", parsed.data.topicId)
    .eq("subject_id", parsed.data.subjectId)
    .eq("group_id", context.activeGroup.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!topic) {
    return {
      errors: {
        topicId: ["Choose a topic that belongs to the selected subject."],
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
      rationale: parsed.data.rationale,
      source_type: parsed.data.sourceType,
      status: "pending_review",
      created_by: context.user.id,
    })
    .select("id")
    .single();

  if (questionError || !question) {
    return {
      message: "Question could not be submitted. Check the form and try again.",
    };
  }

  const { error: choicesError } = await supabase.from("choices").insert(
    choices.map((choice) => ({
      ...choice,
      question_id: question.id,
    })),
  );

  if (choicesError) {
    return {
      message: "Question choices could not be saved. Check the choices and try again.",
    };
  }

  redirect("/submit-question?submitted=1");
}
