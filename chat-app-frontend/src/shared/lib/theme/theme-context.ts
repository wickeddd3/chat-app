import { createContext } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeContextValue {
  /** The chosen setting, including "system". */
  theme: Theme;
  /** The actually-applied theme once "system" is resolved. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

// A concrete default (rather than undefined) so consumers rendered without the
// provider — e.g. a stray Toaster — degrade gracefully instead of throwing.
export const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {},
});
