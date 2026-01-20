"use client";

import { useTheme } from "@/hooks/use-theme";

interface ThemeToggleProps {
  className?: string;
}

/**
 * Light/dark/system theme toggle button.
 */
export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  };

  const icons: Record<string, string> = {
    light: "☀",
    dark: "☾",
    system: "◐",
  };

  const labels: Record<string, string> = {
    light: "Light mode",
    dark: "Dark mode",
    system: "System theme",
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={`
        p-2 rounded-lg text-muted hover:text-ink dark:hover:text-paper
        hover:bg-ink/5 dark:hover:bg-paper/5 transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
        ${className}
      `}
      aria-label={`${labels[theme]}. Click to change.`}
    >
      <span className="text-lg" aria-hidden="true">
        {icons[theme]}
      </span>
    </button>
  );
}

export default ThemeToggle;
