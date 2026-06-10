"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RouteErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
  title?: string;
  description?: string;
};

export function RouteError({
  error,
  unstable_retry,
  title = "This page could not be loaded",
  description = "Refresh the page or try again in a moment.",
}: RouteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => unstable_retry()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
