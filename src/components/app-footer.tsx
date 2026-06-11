"use client";

import { useState, useEffect } from "react";
import { ClipboardList } from "lucide-react";
import { usePreferences } from "@/hooks/use-preferences";

export function AppFooter() {
  const [mounted, setMounted] = useState(false);
  const isZenMode = usePreferences((state) => state.isZenMode);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (mounted && isZenMode) {
    return null;
  }

  return (
    <footer className="mx-auto flex w-full max-w-[1440px] items-center gap-2 px-4 pb-8 pt-4 text-sm text-muted-foreground sm:px-6 lg:px-8">
      <ClipboardList className="size-4" aria-hidden="true" />
      Private exam-prep workspace
    </footer>
  );
}
