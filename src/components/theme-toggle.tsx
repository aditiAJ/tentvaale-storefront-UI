"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

// Light theme is opt-in (site defaults to the dark luxury design) — this
// toggle is the only way to reach it. Renders a stable-sized placeholder
// until mounted since next-themes can't know the resolved theme during SSR.
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount-detection read, not an ongoing subscription; matches the localStorage-hydration pattern in mock-data/store.tsx
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`size-9 ${className}`} />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary ${className}`}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
