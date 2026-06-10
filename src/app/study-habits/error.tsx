"use client";

import { RouteError } from "@/components/route-error";

export default function StudyHabitsError({
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
      title="Study habits could not be loaded"
      description="Your preferences are still protected. Try loading them again."
    />
  );
}
