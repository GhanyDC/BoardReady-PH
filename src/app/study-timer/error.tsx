"use client";

import { RouteError } from "@/components/route-error";

export default function StudyTimerError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <RouteError
      error={error}
      unstable_retry={unstable_retry}
      title="Study timer could not be loaded"
      description="The timer page is temporarily unavailable."
    />
  );
}
