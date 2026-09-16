"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE, DUR } from "@/components/motion";
import { cn } from "@/lib/utils";

// Light theme is opt-in (site defaults to the dark luxury design) — this
// toggle is the only way to reach it. Renders a stable-sized placeholder
// until mounted since next-themes can't know the resolved theme during SSR.
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount-detection read, not an ongoing subscription; matches the localStorage-hydration pattern in mock-data/store.tsx
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn("size-10", className)} />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "press relative flex size-10 items-center justify-center overflow-hidden rounded-full text-foreground transition-colors duration-200 ease-out-quint hover:bg-secondary hover:text-primary",
        className
      )}
    >
      {/* The outgoing icon sinks and rotates out while the incoming one rises
          in — the vertical travel reads as sun/moon changing places. */}
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={isDark ? "sun" : "moon"}
          initial={{ opacity: 0, y: reduce ? 0 : 12, rotate: reduce ? 0 : -45 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0, y: reduce ? 0 : -12, rotate: reduce ? 0 : 45 }}
          transition={{ duration: reduce ? 0.01 : DUR.base, ease: EASE.out }}
          className="flex"
        >
          {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
