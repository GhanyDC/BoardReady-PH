"use client";

import { useEffect } from "react";
import { usePreferences } from "@/hooks/use-preferences";

export function PreferencesProvider() {
  const { colorTheme, density, textSize } = usePreferences();

  useEffect(() => {
    // Apply data attributes to the document element (html tag)
    // so that Tailwind CSS rules can target them.
    document.documentElement.setAttribute("data-theme", colorTheme);
    document.documentElement.setAttribute("data-density", density);
    document.documentElement.setAttribute("data-text-size", textSize);
  }, [colorTheme, density, textSize]);

  return null;
}
