"use client";

import { RouteError } from "@/components/route-error";

export default function MockExamsError({
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
      title="Mock exams could not be loaded"
      description="Your mock exam data is temporarily unavailable."
    />
  );
}
