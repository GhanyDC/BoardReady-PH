"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import type { QuestionFormState } from "@/app/admin/questions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  bloomLevels,
  questionDifficulties,
  questionSourceTypes,
  questionStatuses,
} from "@/lib/questions";

type SubjectOption = {
  id: string;
  name: string;
};

type TopicOption = {
  id: string;
  subject_id: string;
  name: string;
};

export type QuestionChoiceDefaults = {
  label: "A" | "B" | "C" | "D";
  text: string;
  explanation: string;
  isCorrect: boolean;
};

export type QuestionEditorDefaults = {
  id?: string;
  subjectId?: string;
  topicId?: string;
  difficulty?: string;
  bloomLevel?: string;
  sourceType?: string;
  status?: string;
  questionText?: string;
  rationale?: string;
  choices?: QuestionChoiceDefaults[];
};

type QuestionFormAction = (
  state: QuestionFormState,
  formData: FormData,
) => Promise<QuestionFormState>;

type QuestionEditorFormProps = {
  action: QuestionFormAction;
  subjects: SubjectOption[];
  topics: TopicOption[];
  defaults?: QuestionEditorDefaults;
  submitMode?: "admin-create" | "admin-edit" | "reviewer-submit";
};

const choiceLabels = ["A", "B", "C", "D"] as const;

function defaultChoices(defaults?: QuestionEditorDefaults) {
  return choiceLabels.map((label) => {
    const existing = defaults?.choices?.find((choice) => choice.label === label);

    return {
      label,
      text: existing?.text ?? "",
      explanation: existing?.explanation ?? "",
      isCorrect: existing?.isCorrect ?? label === "A",
    };
  });
}

export function QuestionEditorForm({
  action,
  subjects,
  topics,
  defaults,
  submitMode = "admin-create",
}: QuestionEditorFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [subjectId, setSubjectId] = useState(defaults?.subjectId ?? "");
  const filteredTopics = useMemo(
    () => topics.filter((topic) => topic.subject_id === subjectId),
    [subjectId, topics],
  );
  const choices = defaultChoices(defaults);
  const defaultCorrectAnswer =
    choices.find((choice) => choice.isCorrect)?.label ?? "A";
  const sourceOptions =
    submitMode === "reviewer-submit"
      ? questionSourceTypes.filter((item) =>
          ["reviewer_submitted", "personal_notes"].includes(item.value),
        )
      : questionSourceTypes;

  return (
    <form action={formAction} className="grid gap-6">
      {defaults?.id ? (
        <input type="hidden" name="questionId" value={defaults.id} />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="subjectId">Subject</Label>
          <select
            id="subjectId"
            name="subjectId"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            required
          >
            <option value="">Choose subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {state.errors?.subjectId ? (
            <p className="text-sm text-destructive">
              {state.errors.subjectId[0]}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="topicId">Topic</Label>
          <select
            id="topicId"
            name="topicId"
            defaultValue={defaults?.topicId ?? ""}
            disabled={!subjectId || filteredTopics.length === 0}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
            required
          >
            <option value="">Choose topic</option>
            {filteredTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
          {state.errors?.topicId ? (
            <p className="text-sm text-destructive">{state.errors.topicId[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <select
            id="difficulty"
            name="difficulty"
            defaultValue={defaults?.difficulty ?? "moderate"}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            required
          >
            {questionDifficulties.map((difficulty) => (
              <option key={difficulty.value} value={difficulty.value}>
                {difficulty.label}
              </option>
            ))}
          </select>
          {state.errors?.difficulty ? (
            <p className="text-sm text-destructive">
              {state.errors.difficulty[0]}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="bloomLevel">Bloom level</Label>
          <select
            id="bloomLevel"
            name="bloomLevel"
            defaultValue={defaults?.bloomLevel ?? "understanding"}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            required
          >
            {bloomLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
          {state.errors?.bloomLevel ? (
            <p className="text-sm text-destructive">
              {state.errors.bloomLevel[0]}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sourceType">Source type</Label>
          <select
            id="sourceType"
            name="sourceType"
            defaultValue={defaults?.sourceType ?? sourceOptions[0]?.value}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            required
          >
            {sourceOptions.map((sourceType) => (
              <option key={sourceType.value} value={sourceType.value}>
                {sourceType.label}
              </option>
            ))}
          </select>
          {state.errors?.sourceType ? (
            <p className="text-sm text-destructive">
              {state.errors.sourceType[0]}
            </p>
          ) : null}
        </div>
      </div>

      {submitMode === "admin-edit" ? (
        <div className="grid gap-2 md:max-w-sm">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaults?.status ?? "draft"}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            required
          >
            {questionStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="questionText">Question text</Label>
        <textarea
          id="questionText"
          name="questionText"
          rows={5}
          defaultValue={defaults?.questionText ?? ""}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          required
        />
        {state.errors?.questionText ? (
          <p className="text-sm text-destructive">
            {state.errors.questionText[0]}
          </p>
        ) : null}
      </div>

      <fieldset className="grid gap-4">
        <legend className="text-sm font-medium">Choices</legend>
        <div className="grid gap-4">
          {choices.map((choice) => (
            <div key={choice.label} className="grid gap-3 rounded-md border p-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="radio"
                    name="correctAnswer"
                    value={choice.label}
                    defaultChecked={choice.label === defaultCorrectAnswer}
                    className="size-4 accent-primary"
                    required
                  />
                  Correct {choice.label}
                </label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`choiceText${choice.label}`}>
                  Choice {choice.label}
                </Label>
                <Input
                  id={`choiceText${choice.label}`}
                  name={`choiceText${choice.label}`}
                  defaultValue={choice.text}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`choiceExplanation${choice.label}`}>
                  Explanation
                </Label>
                <textarea
                  id={`choiceExplanation${choice.label}`}
                  name={`choiceExplanation${choice.label}`}
                  rows={2}
                  defaultValue={choice.explanation}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>
            </div>
          ))}
        </div>
        {state.errors?.correctAnswer ? (
          <p className="text-sm text-destructive">
            {state.errors.correctAnswer[0]}
          </p>
        ) : null}
        {state.errors?.choices ? (
          <p className="text-sm text-destructive">{state.errors.choices[0]}</p>
        ) : null}
      </fieldset>

      <div className="grid gap-2">
        <Label htmlFor="rationale">Rationale</Label>
        <textarea
          id="rationale"
          name="rationale"
          rows={4}
          defaultValue={defaults?.rationale ?? ""}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        {state.errors?.rationale ? (
          <p className="text-sm text-destructive">{state.errors.rationale[0]}</p>
        ) : null}
      </div>

      {state.message ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          name="intent"
          value={
            submitMode === "reviewer-submit"
              ? "submit"
              : submitMode === "admin-edit"
                ? "update"
                : "draft"
          }
          disabled={pending}
          variant={submitMode === "admin-edit" ? "default" : "outline"}
        >
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {submitMode === "reviewer-submit"
            ? "Submit for review"
            : submitMode === "admin-edit"
              ? "Save changes"
              : "Save draft"}
        </Button>
        {submitMode === "admin-create" ? (
          <Button type="submit" name="intent" value="publish" disabled={pending}>
            {pending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Save aria-hidden="true" />
            )}
            Publish
          </Button>
        ) : null}
      </div>
    </form>
  );
}
