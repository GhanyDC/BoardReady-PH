"use client";

import { RouteError } from "@/components/route-error";

export default function ExternalDrillsError({
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
      title="External drills could not be loaded"
      description="Your drill scores and notes remain private. Try again in a moment."
    />
  );
}
