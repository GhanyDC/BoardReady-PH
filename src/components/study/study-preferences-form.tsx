"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useActionState } from "react";

import type { StudyPreferencesFormState } from "@/app/study-habits/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  preferredStudyStyles,
  preferredStudyTimes,
  weaknessStrategies,
  weekDays,
} from "@/lib/study";
import type { Database } from "@/lib/types";

type StudyPreference =
  Database["public"]["Tables"]["study_preferences"]["Row"];

type StudyPreferencesAction = (
  state: StudyPreferencesFormState,
  formData: FormData,
) => Promise<StudyPreferencesFormState>;

type StudyPreferencesFormProps = {
  action: StudyPreferencesAction;
  preference?: StudyPreference | null;
};

function SelectField({
  id,
  name,
  label,
  defaultValue,
  options,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function StudyPreferencesForm({
  action,
  preference,
}: StudyPreferencesFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const restDays = new Set(preference?.rest_days ?? []);

  return (
    <form action={formAction} className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="dailyGoalMinutes">Daily goal</Label>
          <Input
            id="dailyGoalMinutes"
            name="dailyGoalMinutes"
            type="number"
            min={1}
            max={1440}
            defaultValue={preference?.daily_goal_minutes ?? 60}
            required
          />
          <p className="text-xs text-muted-foreground">Minutes per day</p>
          {state.errors?.dailyGoalMinutes ? (
            <p className="text-sm text-destructive">
              {state.errors.dailyGoalMinutes[0]}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="weeklyGoalMinutes">Weekly goal</Label>
          <Input
            id="weeklyGoalMinutes"
            name="weeklyGoalMinutes"
            type="number"
            min={1}
            max={10080}
            defaultValue={preference?.weekly_goal_minutes ?? 420}
            required
          />
          <p className="text-xs text-muted-foreground">Minutes per week</p>
          {state.errors?.weeklyGoalMinutes ? (
            <p className="text-sm text-destructive">
              {state.errors.weeklyGoalMinutes[0]}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="preferredSessionLengthMinutes">
            Session length
          </Label>
          <Input
            id="preferredSessionLengthMinutes"
            name="preferredSessionLengthMinutes"
            type="number"
            min={5}
            max={480}
            defaultValue={
              preference?.preferred_session_length_minutes ?? 50
            }
            required
          />
          <p className="text-xs text-muted-foreground">Minutes per session</p>
          {state.errors?.preferredSessionLengthMinutes ? (
            <p className="text-sm text-destructive">
              {state.errors.preferredSessionLengthMinutes[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SelectField
          id="preferredStudyTime"
          name="preferredStudyTime"
          label="Preferred study time"
          defaultValue={preference?.preferred_study_time ?? "mixed"}
          options={preferredStudyTimes}
        />
        <SelectField
          id="preferredStudyStyle"
          name="preferredStudyStyle"
          label="Preferred study style"
          defaultValue={preference?.preferred_study_style ?? "mixed"}
          options={preferredStudyStyles}
        />
        <SelectField
          id="weaknessStrategy"
          name="weaknessStrategy"
          label="Weakness strategy"
          defaultValue={preference?.weakness_strategy ?? "balanced_review"}
          options={weaknessStrategies}
        />
      </div>

      <div className="grid gap-2">
        <Label>Rest days</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {weekDays.map((day) => (
            <label
              key={day.value}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                name="restDays"
                value={day.value}
                defaultChecked={restDays.has(day.value)}
                className="size-4 accent-primary"
              />
              {day.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:max-w-xs">
        <Label htmlFor="targetExamDate">Target exam date</Label>
        <Input
          id="targetExamDate"
          name="targetExamDate"
          type="date"
          defaultValue={preference?.target_exam_date ?? ""}
        />
      </div>

      {state.message ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-md border border-emerald-600/30 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full sm:w-fit">
        {pending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <Save aria-hidden="true" />
        )}
        Save study habits
      </Button>
    </form>
  );
}
