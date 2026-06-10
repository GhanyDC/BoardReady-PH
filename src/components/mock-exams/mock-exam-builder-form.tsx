"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import type { MockExamFormState } from "@/app/admin/mock-exams/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  distributeWeightedItems,
  mockExamTypes,
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
  defaults?: MockExamBuilderDefaults;
  submitLabel?: string;
};

export function MockExamBuilderForm({
  action,
  subjects,
  defaults,
  submitLabel = "Create draft",
}: MockExamBuilderFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [itemCount, setItemCount] = useState(defaults?.itemCount ?? 50);
  const distribution = useMemo(
    () => distributeWeightedItems(subjects, itemCount),
    [subjects, itemCount],
  );

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
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
            defaultValue={defaults?.mockType ?? "quick"}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            required
          >
            {mockExamTypes.map((mockType) => (
              <option key={mockType.value} value={mockType.value}>
                {mockType.label}
              </option>
            ))}
          </select>
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
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors disabled:opacity-70"
          >
            <option value="weighted_by_subject">Weighted by subject</option>
          </select>
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
              <th className="px-3 py-2 font-medium">Items</th>
            </tr>
          </thead>
          <tbody>
            {distribution.map((subject) => (
              <tr key={subject.subjectId} className="border-t">
                <td className="px-3 py-2">{subject.subjectName}</td>
                <td className="px-3 py-2">{subject.boardWeight}%</td>
                <td className="px-3 py-2 font-medium">{subject.itemCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {state.message ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-fit">
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
