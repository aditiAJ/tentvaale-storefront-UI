"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants, type Transition } from "framer-motion";

/**
 * The product's shared motion vocabulary.
 *
 * Every animation in the storefront pulls its curve and duration from here so
 * a card reveal on /catalog feels like a card reveal on /plans. The curves are
 * the same ones exposed to CSS in globals.css (--ease-out-quint et al) — keep
 * the two in sync if either changes.
 *
 * Rules this module encodes (from .agents/skills/animate):
 *  - only transform and opacity are animated (GPU-compositable)
 *  - entrances ease-out, exits ease-in and ~75% of the entrance duration
 *  - prefers-reduced-motion collapses the distance, it does not remove the
 *    state change — content still appears, it just doesn't travel
 */

export const EASE = {
  /** Entrances, reveals, anything arriving. */
  out: [0.23, 1, 0.32, 1],
  /** Elements moving from A to B on screen. */
  inOut: [0.645, 0.045, 0.355, 1],
  /** Exits. */
  in: [0.32, 0, 0.67, 0],
} as const;

export const DUR = {
  fast: 0.16,
  base: 0.26,
  slow: 0.42,
  hero: 0.7,
} as const;

/** Interruptible motion — layout shifts, shared-element morphs, drags. */
export const SPRING = {
  /** Snappy, for indicators and small travel. */
  snappy: { type: "spring", stiffness: 420, damping: 34, mass: 0.7 },
  /** Softer, for panels and larger surfaces. */
  soft: { type: "spring", stiffness: 260, damping: 30 },
} satisfies Record<string, Transition>;

/** Shared viewport config: reveal once, when a third of the block is on screen. */
export const VIEWPORT = { once: true, amount: 0.2 } as const;

// Back/forward navigation restores the old scroll position immediately, so
// entrance animations would leave the restored viewport blank until each
// reveal fires again. A popstate marks the next ~second of mounts as a
// restore; components mounted in that window start in their final state.
let restoringUntil = 0;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    restoringUntil = Date.now() + 1000;
  });
}

/** True when this component mounted as part of a back/forward navigation. */
export function useSkipEntrance() {
  const [skip] = React.useState(() => typeof window !== "undefined" && Date.now() < restoringUntil);
  return skip;
}

type Dir = "up" | "down" | "left" | "right" | "none";

function offset(direction: Dir, distance: number) {
  switch (direction) {
    case "up":
      return { y: distance };
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
    default:
      return {};
  }
}

/** Build the enter/exit variant pair used by Reveal, FadeIn and StaggerItem. */
export function useRevealVariants({
  direction = "up",
  distance = 16,
  scale,
  duration = DUR.slow,
}: { direction?: Dir; distance?: number; scale?: number; duration?: number } = {}): Variants {
  const reduce = useReducedMotion();
  return {
    hidden: {
      opacity: 0,
      ...(reduce ? {} : offset(direction, distance)),
      ...(reduce || scale === undefined ? {} : { scale }),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration: reduce ? 0.01 : duration, ease: EASE.out },
    },
  };
}

type RevealProps = React.ComponentProps<typeof motion.div> & {
  direction?: Dir;
  distance?: number;
  scale?: number;
  duration?: number;
  delay?: number;
  /** Reveal on mount instead of waiting for the block to scroll into view. */
  immediate?: boolean;
};

/**
 * Scroll-triggered entrance for a block of content. Fires once, so scrolling
 * back up doesn't replay it — replaying reveals on every pass is the fastest
 * way to make motion feel like decoration.
 */
export function Reveal({
  direction,
  distance,
  scale,
  duration,
  delay = 0,
  immediate = false,
  transition,
  ...props
}: RevealProps) {
  const reduce = useReducedMotion();
  const skip = useSkipEntrance();
  const variants = useRevealVariants({ direction, distance, scale, duration });

  return (
    <motion.div
      variants={variants}
      initial={skip ? "visible" : "hidden"}
      {...(immediate ? { animate: "visible" } : { whileInView: "visible", viewport: VIEWPORT })}
      transition={{ delay: reduce ? 0 : delay, ...transition }}
      {...props}
    />
  );
}

/** Mount-time entrance. Same curve as Reveal, no scroll dependency. */
export function FadeIn(props: Omit<RevealProps, "immediate">) {
  return <Reveal immediate {...props} />;
}

type StaggerProps = React.ComponentProps<typeof motion.div> & {
  /** Seconds between children. Keep small — 0.04–0.08 for grids, 0.1+ drags. */
  gap?: number;
  delay?: number;
  /** Stagger on mount instead of on scroll. */
  immediate?: boolean;
};

/**
 * Parent for a list or grid whose children are <StaggerItem>. The children
 * inherit "hidden"/"visible" through variant propagation, so only this element
 * needs the scroll trigger — one IntersectionObserver per grid, not per card.
 */
export function Stagger({ gap = 0.06, delay = 0, immediate = false, ...props }: StaggerProps) {
  const reduce = useReducedMotion();
  const skip = useSkipEntrance();
  const variants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduce ? 0 : gap,
        delayChildren: reduce ? 0 : delay,
      },
    },
  };

  return (
    <motion.div
      variants={variants}
      initial={skip ? "visible" : "hidden"}
      {...(immediate ? { animate: "visible" } : { whileInView: "visible", viewport: VIEWPORT })}
      {...props}
    />
  );
}

/** A single child of <Stagger>. Takes its timing from the parent. */
export function StaggerItem({
  direction,
  distance = 18,
  scale,
  duration = DUR.slow,
  ...props
}: Omit<RevealProps, "delay" | "immediate">) {
  const variants = useRevealVariants({ direction, distance, scale, duration });
  return <motion.div variants={variants} {...props} />;
}

/**
 * Route-level entrance. Keyed by pathname at the call site, so each navigation
 * mounts a fresh instance and replays the fade — no AnimatePresence, because
 * the App Router unmounts the old tree before the new one commits and an exit
 * animation there either never runs or double-renders the outgoing page.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const skip = useSkipEntrance();

  return (
    <motion.div
      className="flex flex-1 flex-col"
      initial={skip ? false : { opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.01 : DUR.base, ease: EASE.out }}
    >
      {children}
    </motion.div>
  );
}

export { motion, useReducedMotion, type Variants };
