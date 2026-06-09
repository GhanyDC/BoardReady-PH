"use client";

import { Trash2 } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";

type DeleteExternalDrillFormProps = {
  action: (formData: FormData) => Promise<void>;
  logId: string;
};

export function DeleteExternalDrillForm({
  action,
  logId,
}: DeleteExternalDrillFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm("Delete this external drill log?")) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input type="hidden" name="logId" value={logId} />
      <Button type="submit" variant="destructive">
        <Trash2 aria-hidden="true" />
        Delete
      </Button>
    </form>
  );
}
