"use client";

import { RouteError } from "@/components/route-error";

export default function GroupProgressError({
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
      title="Group progress could not be loaded"
      description="Aggregate group progress is temporarily unavailable."
    />
  );
}
