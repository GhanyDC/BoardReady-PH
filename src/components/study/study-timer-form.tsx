"use client";

import { LoaderCircle, Pause, Play, RotateCcw, Save, Square } from "lucide-react";
import {
  type FormEvent,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { StudyTimerFormState } from "@/app/study-timer/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { activityTypes } from "@/lib/study";

type SubjectOption = {
  id: string;
  name: string;
};

type TopicOption = {
  id: string;
  subject_id: string;
  name: string;
};

type StudyTimerAction = (
  state: StudyTimerFormState,
  formData: FormData,
) => Promise<StudyTimerFormState>;

type TimerStatus = "idle" | "running" | "paused" | "ended";

type StudyTimerFormProps = {
  action: StudyTimerAction;
  subjects: SubjectOption[];
  topics: TopicOption[];
};

function formatClock(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

function nowIso() {
  return new Date().toISOString();
}

function createSessionToken() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function StudyTimerForm({
  action,
  subjects,
  topics,
}: StudyTimerFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const submitLockRef = useRef(false);
  const [activityType, setActivityType] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [sessionToken, setSessionToken] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [accumulatedMs, setAccumulatedMs] = useState(0);
  const [runStartedAtMs, setRunStartedAtMs] = useState<number | null>(null);
  const [displaySeconds, setDisplaySeconds] = useState(0);

  const filteredTopics = useMemo(
    () => topics.filter((topic) => topic.subject_id === subjectId),
    [subjectId, topics],
  );

  useEffect(() => {
    if (status !== "running" || runStartedAtMs === null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const elapsedMs = accumulatedMs + Date.now() - runStartedAtMs;
      setDisplaySeconds(Math.floor(elapsedMs / 1000));
    }, 500);

    return () => window.clearInterval(intervalId);
  }, [accumulatedMs, runStartedAtMs, status]);

  function currentElapsedMs() {
    if (status === "running" && runStartedAtMs !== null) {
      return accumulatedMs + Date.now() - runStartedAtMs;
    }

    return accumulatedMs;
  }

  function startTimer() {
    const now = Date.now();
    submitLockRef.current = false;
    setSessionToken(createSessionToken());
    setStartedAt(nowIso());
    setEndedAt("");
    setAccumulatedMs(0);
    setDisplaySeconds(0);
    setRunStartedAtMs(now);
    setStatus("running");
  }

  function pauseTimer() {
    const elapsedMs = currentElapsedMs();
    setAccumulatedMs(elapsedMs);
    setDisplaySeconds(Math.floor(elapsedMs / 1000));
    setRunStartedAtMs(null);
    setStatus("paused");
  }

  function resumeTimer() {
    setRunStartedAtMs(Date.now());
    setStatus("running");
  }

  function endTimer() {
    const elapsedMs = currentElapsedMs();
    setAccumulatedMs(elapsedMs);
    setDisplaySeconds(Math.floor(elapsedMs / 1000));
    setRunStartedAtMs(null);
    setEndedAt(nowIso());
    setStatus("ended");
  }

  function resetTimer() {
    submitLockRef.current = false;
    setStatus("idle");
    setSessionToken("");
    setStartedAt("");
    setEndedAt("");
    setAccumulatedMs(0);
    setRunStartedAtMs(null);
    setDisplaySeconds(0);
  }

  const canStart = status === "idle" && activityType !== "";
  const canPause = status === "running";
  const canResume = status === "paused";
  const canEnd = status === "running" || status === "paused";
  const canSave = status === "ended" && displaySeconds > 0;
  const savedCurrentSession = Boolean(
    state.success && state.sessionToken === sessionToken,
  );
  const saveDisabled = !canSave || pending || savedCurrentSession;

  useEffect(() => {
    if (!pending && !savedCurrentSession) {
      submitLockRef.current = false;
    }
  }, [pending, savedCurrentSession, state.errors, state.message]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submitLockRef.current || savedCurrentSession) {
      event.preventDefault();
      return;
    }

    submitLockRef.current = true;
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="grid gap-6">
      <input type="hidden" name="sessionToken" value={sessionToken} />
      <input type="hidden" name="startedAt" value={startedAt} />
      <input type="hidden" name="endedAt" value={endedAt} />
      <input type="hidden" name="durationSeconds" value={displaySeconds} />

      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-sm font-medium uppercase text-primary">Timer</p>
        <p className="mt-3 font-mono text-6xl font-semibold tracking-normal sm:text-7xl">
          {formatClock(displaySeconds)}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Paused time is excluded from saved duration.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="activityType">Activity type</Label>
          <select
            id="activityType"
            name="activityType"
            value={activityType}
            onChange={(event) => setActivityType(event.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            required
          >
            <option value="">Choose activity</option>
            {activityTypes.map((activityTypeOption) => (
              <option
                key={activityTypeOption.value}
                value={activityTypeOption.value}
              >
                {activityTypeOption.label}
              </option>
            ))}
          </select>
          {state.errors?.activityType ? (
            <p className="text-sm text-destructive">
              {state.errors.activityType[0]}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="subjectId">Subject</Label>
          <select
            id="subjectId"
            name="subjectId"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">General session</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="topicId">Topic</Label>
          <select
            id="topicId"
            name="topicId"
            disabled={!subjectId || filteredTopics.length === 0}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
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

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={startTimer} disabled={!canStart}>
          <Play aria-hidden="true" />
          Start
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={pauseTimer}
          disabled={!canPause}
        >
          <Pause aria-hidden="true" />
          Pause
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={resumeTimer}
          disabled={!canResume}
        >
          <Play aria-hidden="true" />
          Resume
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={endTimer}
          disabled={!canEnd}
        >
          <Square aria-hidden="true" />
          End
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={resetTimer}
          disabled={status === "idle"}
        >
          <RotateCcw aria-hidden="true" />
          Reset
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="grid gap-2">
          <Label htmlFor="focusRating">Focus rating</Label>
          <select
            id="focusRating"
            name="focusRating"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">No rating</option>
            {[1, 2, 3, 4, 5].map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="What did you cover? What should you revisit?"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          {state.errors?.notes ? (
            <p className="text-sm text-destructive">{state.errors.notes[0]}</p>
          ) : null}
        </div>
      </div>

      {state.errors?.durationSeconds ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.errors.durationSeconds[0]}
        </p>
      ) : null}

      {state.message ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      {savedCurrentSession ? (
        <div className="flex flex-col gap-3 rounded-md border border-emerald-600/30 bg-emerald-50 px-3 py-3 text-sm text-emerald-800 sm:flex-row sm:items-center sm:justify-between">
          <span>{state.success}</span>
          <Button type="button" variant="outline" size="sm" onClick={resetTimer}>
            Start another session
          </Button>
        </div>
      ) : null}

      <Button type="submit" disabled={saveDisabled} className="w-full sm:w-fit">
        {pending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <Save aria-hidden="true" />
        )}
        {savedCurrentSession ? "Session saved" : "Save session"}
      </Button>
    </form>
  );
}
