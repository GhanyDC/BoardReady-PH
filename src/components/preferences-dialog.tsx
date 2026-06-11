"use client";

import { useState, useEffect } from "react";
import { Settings, Palette, LayoutTemplate, Type, Focus } from "lucide-react";
import { usePreferences } from "@/hooks/use-preferences";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PreferencesDialog() {
  const [mounted, setMounted] = useState(false);
  const { colorTheme, setColorTheme, density, setDensity, textSize, setTextSize, isZenMode, toggleZenMode } = usePreferences();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Settings className="h-5 w-5" />
        <span className="sr-only">Workspace settings</span>
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Workspace settings">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Workspace settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Workspace Settings</DialogTitle>
          <DialogDescription>
            Customize your review environment to minimize fatigue and maximize focus.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-medium leading-none">
              <Palette className="h-4 w-4" />
              Color Accent
            </h4>
            <p className="text-sm text-muted-foreground">
              Select a primary color that works best for you.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={colorTheme === "default" ? "default" : "outline"}
                size="sm"
                onClick={() => setColorTheme("default")}
                className="w-20"
              >
                Slate
              </Button>
              <Button
                variant={colorTheme === "blue" ? "default" : "outline"}
                size="sm"
                onClick={() => setColorTheme("blue")}
                className="w-20"
              >
                Blue
              </Button>
              <Button
                variant={colorTheme === "green" ? "default" : "outline"}
                size="sm"
                onClick={() => setColorTheme("green")}
                className="w-20"
              >
                Green
              </Button>
              <Button
                variant={colorTheme === "rose" ? "default" : "outline"}
                size="sm"
                onClick={() => setColorTheme("rose")}
                className="w-20"
              >
                Rose
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-medium leading-none">
              <LayoutTemplate className="h-4 w-4" />
              Layout Density
            </h4>
            <p className="text-sm text-muted-foreground">
              Compact density removes extra padding to fit more data on screen.
            </p>
            <div className="flex gap-2">
              <Button
                variant={density === "comfortable" ? "default" : "outline"}
                size="sm"
                onClick={() => setDensity("comfortable")}
              >
                Comfortable
              </Button>
              <Button
                variant={density === "compact" ? "default" : "outline"}
                size="sm"
                onClick={() => setDensity("compact")}
              >
                Compact
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-medium leading-none">
              <Type className="h-4 w-4" />
              Text Scaling
            </h4>
            <p className="text-sm text-muted-foreground">
              Adjust the base font size for reading passages and questions.
            </p>
            <div className="flex gap-2">
              {(["sm", "base", "lg", "xl"] as const).map((size) => (
                <Button
                  key={size}
                  variant={textSize === size ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTextSize(size)}
                  className="w-16 capitalize"
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-medium leading-none">
              <Focus className="h-4 w-4" />
              Zen Mode
            </h4>
            <p className="text-sm text-muted-foreground">
              Hide sidebars and navigation to dedicate 100% of the screen to your task.
            </p>
            <div className="flex gap-2">
              <Button
                variant={isZenMode ? "default" : "outline"}
                size="sm"
                onClick={toggleZenMode}
              >
                {isZenMode ? "Disable Zen Mode" : "Enable Zen Mode"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
