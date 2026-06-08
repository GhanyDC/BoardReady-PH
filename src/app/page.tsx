import Link from "next/link";
import {
  BookOpenCheck,
  ClipboardCheck,
  Clock3,
  LockKeyhole,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BookOpenCheck aria-hidden="true" />
            </span>
            BoardReady PH
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-7">
          <Badge variant="success">Invite-only exam workspace</Badge>
          <div className="space-y-4">
            <h1 className="text-5xl font-semibold tracking-normal sm:text-6xl">
              BoardReady PH
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              A modular exam-prep and board-readiness platform for Philippine
              board, licensure, and major exam takers.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">Create account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">I already have access</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            {
              title: "Invite-only groups",
              description: "Access is scoped by group membership and role.",
              icon: LockKeyhole,
            },
            {
              title: "Exam tracks",
              description:
                "Start with the Psychometrician Licensure Exam and expand later.",
              icon: Clock3,
            },
            {
              title: "Board Readiness",
              description: "Weak areas, mock exams, and analytics follow next.",
              icon: Target,
            },
            {
              title: "Content boundary",
              description: "No uploads, scans, files, OCR, or hosted drills.",
              icon: ClipboardCheck,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex gap-4 rounded-lg border bg-card p-5 shadow-xs"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Icon aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
