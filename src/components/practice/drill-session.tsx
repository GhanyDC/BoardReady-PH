"use client";

import { type FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";

import type { SavePracticeAttemptResult } from "@/app/practice/session/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { difficultyLabel } from "@/lib/questions";

type DrillChoice = {
  id: string;
  choice_label: string;
  choice_text: string;
  explanation: string | null;
  is_correct: boolean;
};

type DrillQuestion = {
  id: string;
  question_text: string;
  difficulty: string;
  rationale: string;
  subjectName: string;
  topicName: string;
  choices: DrillChoice[];
};

type AttemptResult = {
  questionId: string;
  isCorrect: boolean;
};

type DrillSessionProps = {
  questions: DrillQuestion[];
  attemptType: string;
  action: (formData: FormData) => Promise<SavePracticeAttemptResult>;
};

export function DrillSession({
  questions,
  attemptType,
  action,
}: DrillSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState("");
  const [confidenceRating, setConfidenceRating] = useState("3");
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [feedback, setFeedback] = useState<AttemptResult | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [questionStartedAt, setQuestionStartedAt] = useState(0);
  const currentQuestion = questions[currentIndex];
  const complete = currentIndex >= questions.length;
  const correctCount = results.filter((result) => result.isCorrect).length;
  const selectedChoice = currentQuestion?.choices.find(
    (choice) => choice.id === selectedChoiceId,
  );
  const correctChoice = currentQuestion?.choices.find(
    (choice) => choice.is_correct,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentQuestion || saving || feedback) {
      return;
    }

    if (!selectedChoiceId) {
      setError("Choose an answer before submitting.");
      return;
    }

    setSaving(true);
    setError("");

    const formData = new FormData();
    formData.set("questionId", currentQuestion.id);
    formData.set("selectedChoiceId", selectedChoiceId);
    formData.set("attemptType", attemptType);
    formData.set("confidenceRating", confidenceRating);
    formData.set(
      "timeSpentSeconds",
      (
        questionStartedAt > 0
          ? Math.max(0, Math.floor((Date.now() - questionStartedAt) / 1000))
          : 0
      ).toString(),
    );

    const result = await action(formData);

    if (result.message || !result.attempt) {
      setError(result.message ?? "Answer could not be saved.");
      setSaving(false);
      return;
    }

    const nextFeedback = {
      questionId: currentQuestion.id,
      isCorrect: result.attempt.isCorrect,
    };
    setFeedback(nextFeedback);
    setResults((currentResults) => [...currentResults, nextFeedback]);
    setSaving(false);
  }

  function moveNext() {
    setFeedback(null);
    setSelectedChoiceId("");
    setConfidenceRating("3");
    setError("");
    setCurrentIndex((index) => index + 1);
    setQuestionStartedAt(Date.now());
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No questions available</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Adjust the setup filters or wait for an admin to publish questions.
        </CardContent>
      </Card>
    );
  }

  if (complete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drill complete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-3xl font-semibold">
            {correctCount}/{results.length} correct
          </p>
          <p className="text-sm text-muted-foreground">
            Your attempts were saved to your active group and exam track.
          </p>
          <Button asChild>
            <a href="/practice">Start another drill</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {currentIndex + 1}/{questions.length}
          </Badge>
          <Badge variant="outline">{currentQuestion.subjectName}</Badge>
          <Badge variant="outline">{currentQuestion.topicName}</Badge>
          <Badge>{difficultyLabel(currentQuestion.difficulty)}</Badge>
        </div>
        <CardTitle className="leading-7">{currentQuestion.question_text}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-3">
            {currentQuestion.choices.map((choice) => (
              <label
                key={choice.id}
                className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-sm transition-colors hover:bg-accent"
              >
                <input
                  type="radio"
                  name="selectedChoiceId"
                  value={choice.id}
                  checked={selectedChoiceId === choice.id}
                  onChange={(event) => {
                    if (questionStartedAt === 0) {
                      setQuestionStartedAt(Date.now());
                    }

                    setSelectedChoiceId(event.target.value);
                  }}
                  disabled={Boolean(feedback) || saving}
                  className="mt-1 size-4 accent-primary"
                />
                <span>
                  <span className="font-semibold">{choice.choice_label}.</span>{" "}
                  {choice.choice_text}
                </span>
              </label>
            ))}
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-medium">Confidence</p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <label
                  key={rating}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <input
                    type="radio"
                    name="confidenceRating"
                    value={rating}
                    checked={confidenceRating === rating.toString()}
                    onChange={(event) => setConfidenceRating(event.target.value)}
                    disabled={Boolean(feedback) || saving}
                    className="size-4 accent-primary"
                  />
                  {rating}
                </label>
              ))}
            </div>
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {feedback ? (
            <div className="grid gap-4 rounded-md border px-3 py-3 text-sm">
              <div className="flex items-center gap-2">
                {feedback.isCorrect ? (
                  <CheckCircle2 className="size-5 text-emerald-600" />
                ) : (
                  <XCircle className="size-5 text-destructive" />
                )}
                <span>{feedback.isCorrect ? "Correct" : "Incorrect"}</span>
              </div>

              <div className="grid gap-2 text-muted-foreground">
                <p>
                  Correct answer:{" "}
                  <span className="font-medium text-foreground">
                    {correctChoice
                      ? `${correctChoice.choice_label}. ${correctChoice.choice_text}`
                      : "Unavailable"}
                  </span>
                </p>
                <p>
                  Your answer:{" "}
                  <span className="font-medium text-foreground">
                    {selectedChoice
                      ? `${selectedChoice.choice_label}. ${selectedChoice.choice_text}`
                      : "Unavailable"}
                  </span>
                </p>
                <p>Confidence: {confidenceRating}/5</p>
              </div>

              {currentQuestion.rationale ? (
                <div className="rounded-md bg-muted px-3 py-2">
                  <p className="font-medium text-foreground">Rationale</p>
                  <p className="mt-1 leading-6 text-muted-foreground">
                    {currentQuestion.rationale}
                  </p>
                </div>
              ) : null}

              <div className="grid gap-2">
                <p className="font-medium">Choice explanations</p>
                {currentQuestion.choices.map((choice) => (
                  <div key={choice.id} className="rounded-md border px-3 py-2">
                    <p className="font-medium">
                      {choice.choice_label}. {choice.choice_text}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {choice.explanation || "No explanation provided."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving || Boolean(feedback)}>
              {saving ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : null}
              Submit answer
            </Button>
            <Button type="button" variant="outline" onClick={moveNext} disabled={!feedback}>
              {currentIndex + 1 === questions.length ? "Finish" : "Next question"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
