"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import type { ExternalDrillFormState } from "@/app/external-drills/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SubjectOption = {
  id: string;
  name: string;
};

type TopicOption = {
  id: string;
  subject_id: string;
  name: string;
};

type ExternalDrillAction = (
  state: ExternalDrillFormState,
  formData: FormData,
) => Promise<ExternalDrillFormState>;

type ExternalDrillFormProps = {
  action: ExternalDrillAction;
  subjects: SubjectOption[];
  topics: TopicOption[];
  defaultDate: string;
  defaults?: {
    id?: string;
    drillTitle?: string;
    sourceLabel?: string | null;
    subjectId?: string;
    topicId?: string | null;
    totalItems?: number;
    score?: number;
    dateTaken?: string;
    mistakeNotes?: string | null;
    weakTopicNotes?: string | null;
  };
  submitLabel?: string;
};

function formatPercentage(score: string, totalItems: string) {
  const parsedScore = Number.parseInt(score, 10);
  const parsedTotal = Number.parseInt(totalItems, 10);

  if (
    Number.isNaN(parsedScore)
    || Number.isNaN(parsedTotal)
    || parsedTotal <= 0
    || parsedScore < 0
    || parsedScore > parsedTotal
  ) {
    return "--";
  }

  return `${((parsedScore / parsedTotal) * 100).toFixed(2)}%`;
}

export function ExternalDrillForm({
  action,
  subjects,
  topics,
  defaultDate,
  defaults,
  submitLabel = "Save external drill",
}: ExternalDrillFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [subjectId, setSubjectId] = useState(defaults?.subjectId ?? "");
  const [topicId, setTopicId] = useState(defaults?.topicId ?? "");
  const [score, setScore] = useState(defaults?.score?.toString() ?? "");
  const [totalItems, setTotalItems] = useState(
    defaults?.totalItems?.toString() ?? "",
  );

  const filteredTopics = useMemo(
    () => topics.filter((topic) => topic.subject_id === subjectId),
    [subjectId, topics],
  );
  const percentage = formatPercentage(score, totalItems);
  const noSubjects = subjects.length === 0;

  return (
    <form action={formAction} className="grid gap-6">
      {defaults?.id ? (
        <input type="hidden" name="logId" value={defaults.id} />
      ) : null}

      <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        Log your score from a hardcopy/offline drill. Do not upload photos,
        scans, or copyrighted materials.
      </p>

      <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
        <div className="grid gap-2">
          <Label htmlFor="drillTitle">Drill title</Label>
          <Input
            id="drillTitle"
            name="drillTitle"
            placeholder="Example: Assessment diagnostic set"
            defaultValue={defaults?.drillTitle ?? ""}
            required
            maxLength={180}
          />
          {state.errors?.drillTitle ? (
            <p className="text-sm text-destructive">
              {state.errors.drillTitle[0]}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sourceLabel">Source label</Label>
          <Input
            id="sourceLabel"
            name="sourceLabel"
            placeholder="Optional"
            defaultValue={defaults?.sourceLabel ?? ""}
            maxLength={160}
          />
          {state.errors?.sourceLabel ? (
            <p className="text-sm text-destructive">
              {state.errors.sourceLabel[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="subjectId">Subject</Label>
          <select
            id="subjectId"
            name="subjectId"
            value={subjectId}
            onChange={(event) => {
              setSubjectId(event.target.value);
              setTopicId("");
            }}
            disabled={noSubjects}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
          >
            <option value="">
              {noSubjects ? "No active subjects" : "Choose subject"}
            </option>
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
            value={topicId}
            onChange={(event) => setTopicId(event.target.value)}
            disabled={!subjectId || filteredTopics.length === 0}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
          >
            <option value="">No topic</option>
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

      <div className="grid gap-4 md:grid-cols-4">
        <div className="grid gap-2">
          <Label htmlFor="totalItems">Total items</Label>
          <Input
            id="totalItems"
            name="totalItems"
            type="number"
            min={1}
            max={10000}
            value={totalItems}
            onChange={(event) => setTotalItems(event.target.value)}
            required
          />
          {state.errors?.totalItems ? (
            <p className="text-sm text-destructive">
              {state.errors.totalItems[0]}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="score">Score</Label>
          <Input
            id="score"
            name="score"
            type="number"
            min={0}
            max={totalItems || 10000}
            value={score}
            onChange={(event) => setScore(event.target.value)}
            required
          />
          {state.errors?.score ? (
            <p className="text-sm text-destructive">{state.errors.score[0]}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="dateTaken">Date taken</Label>
          <Input
            id="dateTaken"
            name="dateTaken"
            type="date"
            defaultValue={defaults?.dateTaken ?? defaultDate}
            required
          />
          {state.errors?.dateTaken ? (
            <p className="text-sm text-destructive">
              {state.errors.dateTaken[0]}
            </p>
          ) : null}
        </div>

        <div className="rounded-md border bg-card px-3 py-2">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Percentage
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-normal">
            {percentage}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="weakTopicNotes">Weak topics</Label>
          <textarea
            id="weakTopicNotes"
            name="weakTopicNotes"
            rows={5}
            maxLength={4000}
            placeholder="Topics or concepts to revisit"
            defaultValue={defaults?.weakTopicNotes ?? ""}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          {state.errors?.weakTopicNotes ? (
            <p className="text-sm text-destructive">
              {state.errors.weakTopicNotes[0]}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="mistakeNotes">Mistakes and notes</Label>
          <textarea
            id="mistakeNotes"
            name="mistakeNotes"
            rows={5}
            maxLength={4000}
            placeholder="Score patterns, mistakes, or next steps"
            defaultValue={defaults?.mistakeNotes ?? ""}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          {state.errors?.mistakeNotes ? (
            <p className="text-sm text-destructive">
              {state.errors.mistakeNotes[0]}
            </p>
          ) : null}
        </div>
      </div>

      {state.message ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending || noSubjects}
        className="w-full sm:w-fit"
      >
        {pending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <Save aria-hidden="true" />
        )}
        {submitLabel}
      </Button>
    </form>
  );
}
