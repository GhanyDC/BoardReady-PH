"use client";

import { useMemo, useState } from "react";
import { Play, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { questionDifficulties } from "@/lib/questions";
import { practiceModes } from "@/lib/practice";

type SubjectOption = {
  id: string;
  name: string;
};

type TopicOption = {
  id: string;
  subject_id: string;
  name: string;
};

type PracticeSetupFormProps = {
  subjects: SubjectOption[];
  topics: TopicOption[];
  defaults: {
    subject: string;
    topic: string;
    difficulty: string;
    count: number;
    mode: string;
  };
  availableCount: number;
};

export function PracticeSetupForm({
  subjects,
  topics,
  defaults,
  availableCount,
}: PracticeSetupFormProps) {
  const [subjectId, setSubjectId] = useState(defaults.subject);
  const filteredTopics = useMemo(
    () =>
      subjectId
        ? topics.filter((topic) => topic.subject_id === subjectId)
        : topics,
    [subjectId, topics],
  );
  const maxCount = Math.max(1, Math.min(availableCount, 50));
  const canStart = availableCount > 0;

  return (
    <form className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="subject">Subject</Label>
          <select
            id="subject"
            name="subject"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="topic">Topic</Label>
          <select
            id="topic"
            name="topic"
            defaultValue={defaults.topic}
            disabled={filteredTopics.length === 0}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
          >
            <option value="">All topics</option>
            {filteredTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <select
            id="difficulty"
            name="difficulty"
            defaultValue={defaults.difficulty}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">All difficulties</option>
            {questionDifficulties.map((difficulty) => (
              <option key={difficulty.value} value={difficulty.value}>
                {difficulty.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="count">Items</Label>
          <Input
            id="count"
            name="count"
            type="number"
            min={1}
            max={maxCount}
            defaultValue={Math.min(defaults.count, maxCount)}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="mode">Mode</Label>
          <select
            id="mode"
            name="mode"
            defaultValue={defaults.mode}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {practiceModes.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" formAction="/practice" variant="outline">
          <Search aria-hidden="true" />
          Check availability
        </Button>
        <Button type="submit" formAction="/practice/session" disabled={!canStart}>
          <Play aria-hidden="true" />
          Start drill
        </Button>
      </div>
    </form>
  );
}
