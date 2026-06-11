"use client";

import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import type { MockExamFormState } from "@/app/admin/mock-exams/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  distributeWeightedItems,
  mockExamTypes,
  mockTypeLabel,
  type WeightedSubject,
} from "@/lib/mock-exams";

type MockExamFormAction = (
  state: MockExamFormState,
  formData: FormData,
) => Promise<MockExamFormState>;

type MockExamBuilderDefaults = {
  id?: string;
  title?: string;
  description?: string | null;
  mockType?: string;
  itemCount?: number;
  timeLimitMinutes?: number;
};

type MockExamBuilderFormProps = {
  action: MockExamFormAction;
  subjects: WeightedSubject[];
  availabilityBySubject?: Record<string, number>;
  defaults?: MockExamBuilderDefaults;
  submitLabel?: string;
};

const mockTypeDescriptions: Record<string, string> = {
  quick: "Short practice-style mock for fast readiness checks.",
  half: "Medium-length mock for pacing and coverage checks.",
  full: "Full-length simulation when enough published questions exist.",
  custom: "Custom item count and timing for a targeted mock.",
};

export function MockExamBuilderForm({
  action,
  subjects,
  availabilityBySubject = {},
  defaults,
  submitLabel = "Create draft",
}: MockExamBuilderFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [itemCount, setItemCount] = useState(defaults?.itemCount ?? 50);
  const [mockType, setMockType] = useState(defaults?.mockType ?? "quick");
  const distribution = useMemo(
    () => distributeWeightedItems(subjects, itemCount),
    [subjects, itemCount],
  );
  const hasAnyPublishedQuestions = Object.values(availabilityBySubject).some(
    (count) => count > 0,
  );
  const shortageSubjects = distribution.filter(
    (subject) =>
      subject.itemCount > (availabilityBySubject[subject.subjectId] ?? 0),
  );
  const hasShortage = shortageSubjects.length > 0;

  return (
    <form action={formAction} className="grid gap-6">
      {defaults?.id ? (
        <input type="hidden" name="mockExamId" value={defaults.id} />
      ) : null}
      <input
        type="hidden"
        name="distributionMode"
        value="weighted_by_subject"
      />

      <div className="rounded-md border bg-muted/40 px-3 py-3 text-sm">
        <p className="font-medium">Builder rules</p>
        <div className="mt-2 grid gap-2 text-muted-foreground md:grid-cols-2">
          <span>Only published verified questions are eligible.</span>
          <span>Subject weights drive the required item distribution.</span>
          <span>Shortages block draft generation and publishing.</span>
          <span>Changing a draft regenerates its saved item set.</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={defaults?.title ?? ""}
            maxLength={180}
            required
          />
          {state.errors?.title ? (
            <p className="text-sm text-destructive">{state.errors.title[0]}</p>
          ) : null}
        </div>

        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={defaults?.description ?? ""}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          {state.errors?.description ? (
            <p className="text-sm text-destructive">
              {state.errors.description[0]}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="mockType">Mock type</Label>
          <select
            id="mockType"
            name="mockType"
            value={mockType}
            onChange={(event) => setMockType(event.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            required
          >
            {mockExamTypes.map((mockType) => (
              <option key={mockType.value} value={mockType.value}>
                {mockType.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            {mockTypeLabel(mockType)}:{" "}
            {mockTypeDescriptions[mockType] ?? "Custom mock exam setup."}
          </p>
          {state.errors?.mockType ? (
            <p className="text-sm text-destructive">
              {state.errors.mockType[0]}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="itemCount">Items</Label>
          <Input
            id="itemCount"
            name="itemCount"
            type="number"
            min={1}
            max={1000}
            value={itemCount}
            onChange={(event) => {
              const nextValue = Number.parseInt(event.target.value || "0", 10);

              setItemCount(Number.isNaN(nextValue) ? 0 : Math.max(0, nextValue));
            }}
            required
          />
          <p className="text-xs text-muted-foreground">
            The builder splits this count across active subjects by weight.
          </p>
          {state.errors?.itemCount ? (
            <p className="text-sm text-destructive">
              {state.errors.itemCount[0]}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="timeLimitMinutes">Time limit minutes</Label>
          <Input
            id="timeLimitMinutes"
            name="timeLimitMinutes"
            type="number"
            min={1}
            max={1440}
            defaultValue={defaults?.timeLimitMinutes ?? 60}
            required
          />
          <p className="text-xs text-muted-foreground">
            Set realistic pacing. Maximum is 1,440 minutes.
          </p>
          {state.errors?.timeLimitMinutes ? (
            <p className="text-sm text-destructive">
              {state.errors.timeLimitMinutes[0]}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="distributionModeDisplay">Subject distribution</Label>
          <select
            id="distributionModeDisplay"
            value="weighted_by_subject"
            disabled
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm shadow-xs outline-none transition-colors disabled:opacity-70"
          >
            <option value="weighted_by_subject">Weighted by subject</option>
          </select>
          <p className="text-xs text-muted-foreground">
            The distribution preview updates when item count changes.
          </p>
          {state.errors?.distributionMode ? (
            <p className="text-sm text-destructive">
              {state.errors.distributionMode[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Subject</th>
              <th className="px-3 py-2 font-medium">Weight</th>
              <th className="px-3 py-2 font-medium">Required</th>
              <th className="px-3 py-2 font-medium">Available</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {distribution.map((subject) => {
              const available = availabilityBySubject[subject.subjectId] ?? 0;
              const shortage = Math.max(0, subject.itemCount - available);

              return (
                <tr key={subject.subjectId} className="border-t">
                  <td className="px-3 py-2">{subject.subjectName}</td>
                  <td className="px-3 py-2">{subject.boardWeight}%</td>
                  <td className="px-3 py-2 font-medium">{subject.itemCount}</td>
                  <td className="px-3 py-2">{available}</td>
                  <td className="px-3 py-2">
                    {shortage > 0 ? (
                      <span className="font-medium text-destructive">
                        Short {shortage}
                      </span>
                    ) : (
                      <span className="text-emerald-700">Enough</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!hasAnyPublishedQuestions ? (
        <div className="grid gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive">
          <p>
            No published verified questions are available for this active exam
            track yet.
          </p>
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link href="/admin/questions">Create or publish questions</Link>
          </Button>
        </div>
      ) : null}

      {hasShortage ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          <p className="font-medium">Question supply shortage</p>
          <p className="mt-1">
            Publish more verified questions before generating this weighted mock.
          </p>
          <ul className="mt-2 list-inside list-disc">
            {shortageSubjects.map((subject) => (
              <li key={subject.subjectId}>
                {subject.subjectName}: needs {subject.itemCount}, available{" "}
                {availabilityBySubject[subject.subjectId] ?? 0}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.message ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending || subjects.length === 0 || hasShortage}
        className="w-fit"
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
