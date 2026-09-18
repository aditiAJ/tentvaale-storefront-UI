"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE, DUR } from "@/components/motion";
import { cn } from "@/lib/utils";

/** How far an icon travels before it is clear of the button. */
const TRAVEL = 18;

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
  // The icon shown is the destination, not the current theme: in dark mode you
  // see the sun you are about to switch to.
  const showSun = isDark;

  /**
   * Each icon belongs to one side of the button and always arrives from, and
   * leaves towards, that side: the sun lives above, the moon below. So a click
   * on the sun sends it up and brings the moon up from underneath, and a click
   * on the moon drops it down and lowers the sun in from above.
   *
   * Deriving the offset from the icon rather than from a "direction" state is
   * what makes the reverse click mirror correctly. React batches the theme
   * change with any state set in the same handler, so a shared direction value
   * would already have flipped by the time the outgoing icon animated — the
   * exiting icon would leave the wrong way. Keyed on the icon, each element
   * carries the offset it rendered with.
   */
  const offset = reduce ? 0 : showSun ? -TRAVEL : TRAVEL;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "press relative flex size-10 items-center justify-center overflow-hidden rounded-sm text-foreground transition-colors duration-200 ease-out-quint hover:bg-secondary hover:text-primary",
        className
      )}
    >
      {/* mode="wait" holds the incoming icon until the outgoing one has left,
          so the two never overlap mid-swap. */}
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={showSun ? "sun" : "moon"}
          initial={{ opacity: 0, y: offset }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: offset }}
          transition={{
            duration: reduce ? 0.01 : DUR.base,
            ease: EASE.out,
            // Fade a touch quicker than the travel, so the icon is already
            // faint by the edge of the button instead of clipping abruptly.
            opacity: { duration: reduce ? 0.01 : DUR.fast, ease: EASE.out },
          }}
          className="flex"
        >
          {showSun ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
