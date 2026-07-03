import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ThemeContext,
  type ResolvedTheme,
  type Theme,
} from "./theme-context";

const STORAGE_KEY = "theme";

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(fallback: Theme): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage unavailable (private mode, etc.) — fall through
  }
  return fallback;
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() =>
    getStoredTheme(defaultTheme),
  );
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolve(getStoredTheme(defaultTheme)),
  );

  // Apply the resolved theme to <html> and, while following the system, keep it
  // in sync with OS preference changes.
  useEffect(() => {
    const apply = () => {
      const resolved = resolve(theme);
      document.documentElement.classList.toggle("dark", resolved === "dark");
      setResolvedTheme(resolved);
    };
    apply();

    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore persistence failures
    }
    setThemeState(next);
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
