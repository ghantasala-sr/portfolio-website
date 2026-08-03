"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Render a stable shell until mounted; the theme is unknown on the server,
  // so labelling it either way would be a hydration mismatch.
  const isDark = mounted ? resolvedTheme !== "light" : true;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={
        mounted
          ? `Switch to ${isDark ? "blueprint (light)" : "instrument (dark)"} theme`
          : "Toggle theme"
      }
      data-cursor="link"
      data-magnetic
      className="group flex h-8 items-center gap-2 border border-line px-2.5 text-muted transition-colors hover:border-line-strong hover:text-text"
    >
      <span className="label hidden transition-colors group-hover:text-text sm:inline">
        {isDark ? "DARK" : "LIGHT"}
      </span>
      <span
        aria-hidden="true"
        className="relative block h-3 w-3 shrink-0 overflow-hidden"
      >
        {/* Filled square = dark, outlined = light. Reads as an instrument
            state indicator rather than a sun/moon cliché. */}
        <span
          className="absolute inset-0 border transition-all duration-500"
          style={{
            borderColor: "var(--accent)",
            background: isDark ? "var(--accent)" : "transparent",
            rotate: isDark ? "0deg" : "45deg",
          }}
        />
      </span>
    </button>
  );
}
