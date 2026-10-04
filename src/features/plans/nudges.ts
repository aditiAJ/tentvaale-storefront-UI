"use client";

import { useCallback, useState } from "react";

/**
 * The "Complete your setup" checklist on a plan (entry gate, passage, seating, stage, photo booth):
 * which areas the customer has already filled and which they skipped, per function. It is a prompt
 * to think of things, not part of the plan, so it lives in this browser rather than on the backend;
 * a new device simply starts the checklist again.
 */
interface Nudges {
  /** scope ("general" or a function id) -> suggestion keys already filled */
  added: Record<string, string[]>;
  /** scope -> suggestion keys the customer skipped */
  dismissed: Record<string, string[]>;
}

const EMPTY: Nudges = { added: {}, dismissed: {} };
const key = (planId: string) => `tentvaale:plan-setup:${planId}`;

function read(planId: string): Nudges {
  try {
    const raw = window.localStorage.getItem(key(planId));
    const parsed = raw ? (JSON.parse(raw) as Partial<Nudges>) : {};
    return { added: parsed.added ?? {}, dismissed: parsed.dismissed ?? {} };
  } catch {
    return EMPTY;
  }
}

function write(planId: string, value: Nudges) {
  try {
    window.localStorage.setItem(key(planId), JSON.stringify(value));
  } catch {
    // Storage blocked or full: the checklist just starts again next visit.
  }
}

export function usePlanNudges(planId: string) {
  // Read lazily; the page renders a loading state until the plan arrives, so this never shows on the server.
  const [state, setState] = useState<Nudges>(() => (typeof window === "undefined" ? EMPTY : read(planId)));

  const update = useCallback(
    (change: (current: Nudges) => Nudges) => {
      setState((current) => {
        const next = change(current);
        write(planId, next);
        return next;
      });
    },
    [planId],
  );

  return {
    added: state.added,
    dismissed: state.dismissed,
    markAdded: (scope: string, suggestion: string) =>
      update((s) => ({ ...s, added: { ...s.added, [scope]: [...new Set([...(s.added[scope] ?? []), suggestion])] } })),
    dismiss: (scope: string, suggestion: string) =>
      update((s) => ({ ...s, dismissed: { ...s.dismissed, [scope]: [...new Set([...(s.dismissed[scope] ?? []), suggestion])] } })),
  };
}
