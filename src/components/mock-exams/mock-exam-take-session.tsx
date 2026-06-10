"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { difficultyLabel } from "@/lib/questions";

type TakeChoice = {
  id: string;
  choice_label: string;
  choice_text: string;
};

type TakeQuestion = {
  id: string;
  questionText: string;
  difficulty: string;
  subjectName: string;
  topicName: string;
  choices: TakeChoice[];
};

type MockExamTakeSessionProps = {
  attemptId: string;
  mockExamTitle: string;
  startedAt: string;
  timeLimitMinutes: number;
  questions: TakeQuestion[];
  action: (formData: FormData) => Promise<void>;
};

function formatRemaining(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getRemainingSeconds(startedAt: string, timeLimitMinutes: number) {
  const endAt = new Date(startedAt).getTime() + timeLimitMinutes * 60 * 1000;

  return Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
}

function readStoredAnswers(storageKey: string) {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(storageKey);

    return stored ? (JSON.parse(stored) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function MockExamTakeSession({
  attemptId,
  mockExamTitle,
  startedAt,
  timeLimitMinutes,
  questions,
  action,
}: MockExamTakeSessionProps) {
  const storageKey = useMemo(
    () => `boardready:mock-exam:${attemptId}:answers`,
    [attemptId],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [storageReady, setStorageReady] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getRemainingSeconds(startedAt, timeLimitMinutes),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter((question) => answers[question.id])
    .length;
  const unansweredCount = questions.length - answeredCount;
  const expired = remainingSeconds <= 0;

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      setAnswers(readStoredAnswers(storageKey));
      setStorageReady(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [storageKey]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(answers));
  }, [answers, storageKey, storageReady]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingSeconds(getRemainingSeconds(startedAt, timeLimitMinutes));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [startedAt, timeLimitMinutes]);

  function selectAnswer(questionId: string, choiceId: string) {
    setAnswers((current) => ({
      ...current,
      [questionId]: choiceId,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    const formData = new FormData();
    const elapsedSeconds = Math.min(
      timeLimitMinutes * 60,
      Math.max(
        0,
        Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
      ),
    );

    formData.set("attemptId", attemptId);
    formData.set("timeSpentSeconds", elapsedSeconds.toString());

    for (const question of questions) {
      formData.append("questionId", question.id);

      if (answers[question.id]) {
        formData.set(`answer:${question.id}`, answers[question.id]);
      }
    }

    await action(formData);
    setError("Submission did not complete. Please try again.");
    setSubmitting(false);
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No questions found</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This mock exam has no saved item set.
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase text-primary">
                Mock Exam
              </p>
              <CardTitle className="mt-2 leading-7">{mockExamTitle}</CardTitle>
            </div>
            <div className="grid gap-1 text-left md:text-right">
              <p className="text-2xl font-semibold tabular-nums">
                {formatRemaining(remainingSeconds)}
              </p>
              <p className="text-sm text-muted-foreground">
                {unansweredCount} unanswered
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {currentIndex + 1}/{questions.length}
            </Badge>
            <Badge variant="outline">{currentQuestion.subjectName}</Badge>
            <Badge variant="outline">{currentQuestion.topicName}</Badge>
            <Badge>{difficultyLabel(currentQuestion.difficulty)}</Badge>
          </div>

          {expired ? (
            <p className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="size-4" aria-hidden="true" />
              Time has expired. Submit your saved answers to finish the attempt.
            </p>
          ) : null}
        </CardHeader>

        <CardContent className="grid gap-6">
          <div>
            <p className="text-base font-semibold leading-7">
              {currentQuestion.questionText}
            </p>
          </div>

          <div className="grid gap-3">
            {currentQuestion.choices.map((choice) => (
              <label
                key={choice.id}
                className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-sm transition-colors hover:bg-accent"
              >
                <input
                  type="radio"
                  name={`question:${currentQuestion.id}`}
                  value={choice.id}
                  checked={answers[currentQuestion.id] === choice.id}
                  onChange={() => selectAnswer(currentQuestion.id, choice.id)}
                  disabled={submitting}
                  className="mt-1 size-4 accent-primary"
                />
                <span>
                  <span className="font-semibold">{choice.choice_label}.</span>{" "}
                  {choice.choice_text}
                </span>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={currentIndex === 0 || submitting}
              onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
            >
              <ArrowLeft aria-hidden="true" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={currentIndex === questions.length - 1 || submitting}
              onClick={() =>
                setCurrentIndex((index) =>
                  Math.min(questions.length - 1, index + 1),
                )
              }
            >
              Next
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 rounded-md border p-4">
        <div className="flex flex-wrap gap-2">
          {questions.map((question, index) => (
            <button
              key={question.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              disabled={submitting}
              className={`flex size-10 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                currentIndex === index
                  ? "border-primary bg-primary text-primary-foreground"
                  : answers[question.id]
                    ? "border-emerald-600/50 bg-emerald-50 text-emerald-800"
                    : "bg-background hover:bg-accent"
              }`}
              aria-label={`Question ${index + 1}`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={submitting} className="w-fit">
          {submitting ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : null}
          Submit exam
        </Button>
      </div>
    </form>
  );
}
