import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TextSize = "sm" | "base" | "lg" | "xl";
export type ColorTheme = "default" | "blue" | "green" | "rose";
export type Density = "comfortable" | "compact";

interface PreferencesState {
  isZenMode: boolean;
  textSize: TextSize;
  colorTheme: ColorTheme;
  density: Density;
  
  toggleZenMode: () => void;
  setTextSize: (size: TextSize) => void;
  setColorTheme: (theme: ColorTheme) => void;
  setDensity: (density: Density) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      isZenMode: false,
      textSize: "base",
      colorTheme: "default",
      density: "comfortable",
      
      toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),
      setTextSize: (textSize) => set({ textSize }),
      setColorTheme: (colorTheme) => set({ colorTheme }),
      setDensity: (density) => set({ density }),
    }),
    {
      name: "boardready-preferences", // name of the item in the storage (must be unique)
    }
  )
);
