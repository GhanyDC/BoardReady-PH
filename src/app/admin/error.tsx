"use client";

import { RouteError } from "@/components/route-error";

export default function AdminError({
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
      title="Admin area could not be loaded"
      description="The admin workspace is temporarily unavailable."
    />
  );
}
