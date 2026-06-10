"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdminContext } from "@/lib/admin-auth";
import {
  distributeWeightedItems,
  type SubjectItemDistribution,
} from "@/lib/mock-exams";
import { createClient } from "@/lib/supabase/server";

const mockTypeValues = ["quick", "half", "full", "custom"] as const;

const mockExamSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title is required.")
    .max(180, "Keep the title under 180 characters."),
  description: z.string().trim().max(2000, "Description is too long.").nullable(),
  mockType: z.enum(mockTypeValues, {
    error: "Choose a mock exam type.",
  }),
  itemCount: z.coerce
    .number()
    .int()
    .min(1, "Item count must be greater than 0.")
    .max(1000, "Keep mock exams under 1,000 items."),
  timeLimitMinutes: z.coerce
    .number()
    .int()
    .min(1, "Time limit must be greater than 0.")
    .max(1440, "Keep the time limit to 24 hours or less."),
  distributionMode: z.literal("weighted_by_subject", {
    error: "Weighted by subject is required for this MVP.",
  }),
});

const updateMockExamSchema = mockExamSchema.extend({
  mockExamId: z.string().uuid("Choose a mock exam."),
});

export type MockExamFormState = {
  errors?: {
    title?: string[];
    description?: string[];
    mockType?: string[];
    itemCount?: string[];
    timeLimitMinutes?: string[];
    distributionMode?: string[];
  };
  message?: string;
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ActiveSubject = {
  id: string;
  name: string;
  board_weight: number;
  sort_order: number;
};

type QuestionPoolItem = {
  id: string;
  subject_id: string;
};

function nullableText(value: FormDataEntryValue | null) {
  const text = value?.toString().trim() ?? "";

  return text === "" ? null : text;
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

async function loadActiveSubjects(
  supabase: SupabaseClient,
  groupId: string,
  examProgramId: string,
) {
  const { data: subjects, error } = await supabase
    .from("subjects")
    .select("id, name, board_weight, sort_order")
    .eq("group_id", groupId)
    .eq("exam_program_id", examProgramId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return {
    subjects: subjects ?? [],
    error,
  };
}

function validateQuestionSupply(
  distribution: SubjectItemDistribution[],
  questionPool: QuestionPoolItem[],
) {
  const questionsBySubject = new Map<string, QuestionPoolItem[]>();

  for (const question of questionPool) {
    const current = questionsBySubject.get(question.subject_id) ?? [];
    current.push(question);
    questionsBySubject.set(question.subject_id, current);
  }

  for (const subject of distribution) {
    if (subject.itemCount === 0) {
      continue;
    }

    const available = questionsBySubject.get(subject.subjectId)?.length ?? 0;

    if (available < subject.itemCount) {
      return {
        message: `${subject.subjectName} needs ${subject.itemCount} published verified questions, but only ${available} are available.`,
      };
    }
  }

  return { message: null };
}

function selectWeightedQuestions(
  distribution: SubjectItemDistribution[],
  questionPool: QuestionPoolItem[],
) {
  const questionsBySubject = new Map<string, QuestionPoolItem[]>();

  for (const question of questionPool) {
    const current = questionsBySubject.get(question.subject_id) ?? [];
    current.push(question);
    questionsBySubject.set(question.subject_id, current);
  }

  const selected = distribution.flatMap((subject) =>
    shuffle(questionsBySubject.get(subject.subjectId) ?? []).slice(
      0,
      subject.itemCount,
    ),
  );

  return shuffle(selected).map((question, index) => ({
    question_id: question.id,
    order_index: index + 1,
  }));
}

async function buildWeightedItems(
  supabase: SupabaseClient,
  subjects: ActiveSubject[],
  groupId: string,
  examProgramId: string,
  itemCount: number,
) {
  const distribution = distributeWeightedItems(subjects, itemCount);
  const subjectIds = distribution
    .filter((subject) => subject.itemCount > 0)
    .map((subject) => subject.subjectId);

  if (subjectIds.length === 0) {
    return {
      items: [],
      message: "Add active subjects before building a mock exam.",
    };
  }

  const { data: questionPool, error } = await supabase
    .from("questions")
    .select("id, subject_id")
    .eq("group_id", groupId)
    .eq("exam_program_id", examProgramId)
    .eq("status", "published")
    .not("verified_by", "is", null)
    .in("subject_id", subjectIds)
    .limit(5000);

  if (error) {
    return {
      items: [],
      message: error.message,
    };
  }

  const supplyError = validateQuestionSupply(distribution, questionPool ?? []);

  if (supplyError.message) {
    return {
      items: [],
      message: supplyError.message,
    };
  }

  return {
    items: selectWeightedQuestions(distribution, questionPool ?? []),
    message: null,
  };
}

async function parseAndPrepareMockExam(
  formData: FormData,
  includeId = false,
) {
  const parsed = (includeId ? updateMockExamSchema : mockExamSchema).safeParse({
    mockExamId: formData.get("mockExamId"),
    title: formData.get("title"),
    description: nullableText(formData.get("description")),
    mockType: formData.get("mockType"),
    itemCount: formData.get("itemCount"),
    timeLimitMinutes: formData.get("timeLimitMinutes"),
    distributionMode: formData.get("distributionMode"),
  });

  if (!parsed.success) {
    return {
      parsed,
      context: null,
      supabase: null,
      subjects: [],
      items: [],
      error: null,
    };
  }

  const context = await requireAdminContext();
  const supabase = await createClient();
  const { subjects, error: subjectsError } = await loadActiveSubjects(
    supabase,
    context.activeGroup.id,
    context.activeExamProgram.id,
  );

  if (subjectsError) {
    return {
      parsed,
      context,
      supabase,
      subjects,
      items: [],
      error: subjectsError.message,
    };
  }

  if (subjects.length === 0) {
    return {
      parsed,
      context,
      supabase,
      subjects,
      items: [],
      error: "Add active subjects before building a mock exam.",
    };
  }

  const { items, message } = await buildWeightedItems(
    supabase,
    subjects,
    context.activeGroup.id,
    context.activeExamProgram.id,
    parsed.data.itemCount,
  );

  return {
    parsed,
    context,
    supabase,
    subjects,
    items,
    error: message,
  };
}

export async function createMockExamAction(
  _state: MockExamFormState,
  formData: FormData,
): Promise<MockExamFormState> {
  const prepared = await parseAndPrepareMockExam(formData);

  if (!prepared.parsed.success) {
    return {
      errors: prepared.parsed.error.flatten().fieldErrors,
    };
  }

  if (!prepared.context || !prepared.supabase) {
    return {
      message: "Admin context could not be loaded.",
    };
  }

  if (prepared.error) {
    return {
      message: prepared.error,
    };
  }

  const { data: mockExam, error: createError } = await prepared.supabase
    .from("mock_exams")
    .insert({
      group_id: prepared.context.activeGroup.id,
      exam_program_id: prepared.context.activeExamProgram.id,
      title: prepared.parsed.data.title,
      description: prepared.parsed.data.description,
      mock_type: prepared.parsed.data.mockType,
      item_count: prepared.parsed.data.itemCount,
      time_limit_minutes: prepared.parsed.data.timeLimitMinutes,
      status: "draft",
      created_by: prepared.context.user.id,
    })
    .select("id")
    .single();

  if (createError || !mockExam) {
    return {
      message: createError?.message ?? "Mock exam could not be created.",
    };
  }

  const { error: itemsError } = await prepared.supabase
    .from("mock_exam_items")
    .insert(
      prepared.items.map((item) => ({
        mock_exam_id: mockExam.id,
        question_id: item.question_id,
        order_index: item.order_index,
      })),
    );

  if (itemsError) {
    await prepared.supabase.from("mock_exams").delete().eq("id", mockExam.id);

    return {
      message: itemsError.message,
    };
  }

  redirect("/admin/mock-exams?created=1");
}

export async function updateMockExamAction(
  _state: MockExamFormState,
  formData: FormData,
): Promise<MockExamFormState> {
  const prepared = await parseAndPrepareMockExam(formData, true);

  if (!prepared.parsed.success) {
    return {
      errors: prepared.parsed.error.flatten().fieldErrors,
    };
  }

  if (!prepared.context || !prepared.supabase) {
    return {
      message: "Admin context could not be loaded.",
    };
  }

  const parsedData = prepared.parsed.data as z.infer<
    typeof updateMockExamSchema
  >;

  if (prepared.error) {
    return {
      message: prepared.error,
    };
  }

  const { data: existingMockExam, error: loadError } = await prepared.supabase
    .from("mock_exams")
    .select("id, status")
    .eq("id", parsedData.mockExamId)
    .eq("group_id", prepared.context.activeGroup.id)
    .eq("exam_program_id", prepared.context.activeExamProgram.id)
    .maybeSingle();

  if (loadError || !existingMockExam) {
    return {
      message: loadError?.message ?? "Mock exam could not be loaded.",
    };
  }

  if (existingMockExam.status !== "draft") {
    return {
      message: "Only draft mock exams can regenerate weighted items.",
    };
  }

  const { error: updateError } = await prepared.supabase
    .from("mock_exams")
    .update({
      title: prepared.parsed.data.title,
      description: prepared.parsed.data.description,
      mock_type: prepared.parsed.data.mockType,
      item_count: prepared.parsed.data.itemCount,
      time_limit_minutes: prepared.parsed.data.timeLimitMinutes,
    })
    .eq("id", existingMockExam.id);

  if (updateError) {
    return {
      message: updateError.message,
    };
  }

  const { error: deleteError } = await prepared.supabase
    .from("mock_exam_items")
    .delete()
    .eq("mock_exam_id", existingMockExam.id);

  if (deleteError) {
    return {
      message: deleteError.message,
    };
  }

  const { error: itemsError } = await prepared.supabase
    .from("mock_exam_items")
    .insert(
      prepared.items.map((item) => ({
        mock_exam_id: existingMockExam.id,
        question_id: item.question_id,
        order_index: item.order_index,
      })),
    );

  if (itemsError) {
    return {
      message: itemsError.message,
    };
  }

  redirect("/admin/mock-exams?updated=1");
}

export async function publishMockExamAction(formData: FormData) {
  const parsed = z.string().uuid().safeParse(formData.get("mockExamId"));

  if (!parsed.success) {
    redirect("/admin/mock-exams?error=invalid-mock");
  }

  const context = await requireAdminContext();
  const supabase = await createClient();
  const { data: mockExam } = await supabase
    .from("mock_exams")
    .select("id, item_count")
    .eq("id", parsed.data)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id)
    .maybeSingle();

  if (!mockExam) {
    redirect("/admin/mock-exams?error=missing-mock");
  }

  const { count } = await supabase
    .from("mock_exam_items")
    .select("id", { count: "exact", head: true })
    .eq("mock_exam_id", mockExam.id);

  if ((count ?? 0) < mockExam.item_count) {
    redirect("/admin/mock-exams?error=incomplete-mock");
  }

  const { error } = await supabase
    .from("mock_exams")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", mockExam.id)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id);

  if (error) {
    redirect("/admin/mock-exams?error=publish-failed");
  }

  redirect("/admin/mock-exams?published=1");
}

export async function archiveMockExamAction(formData: FormData) {
  const parsed = z.string().uuid().safeParse(formData.get("mockExamId"));

  if (!parsed.success) {
    redirect("/admin/mock-exams?error=invalid-mock");
  }

  const context = await requireAdminContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("mock_exams")
    .update({
      status: "archived",
      archived_at: new Date().toISOString(),
    })
    .eq("id", parsed.data)
    .eq("group_id", context.activeGroup.id)
    .eq("exam_program_id", context.activeExamProgram.id);

  if (error) {
    redirect("/admin/mock-exams?error=archive-failed");
  }

  redirect("/admin/mock-exams?archived=1");
}
