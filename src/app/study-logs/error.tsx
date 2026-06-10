"use client";

import { RouteError } from "@/components/route-error";

export default function StudyLogsError({
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
      title="Study logs could not be loaded"
      description="Your private study logs are temporarily unavailable."
    />
  );
}
