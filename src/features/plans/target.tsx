"use client";

import { useState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { planGroupLabel } from "./board";
import { usePlan, usePlans } from "./hooks";

const WHOLE_PLAN = "__whole";

/**
 * "Add this to which plan, and which function of it?" for every place that adds something to a
 * plan (product page, quick add, bundle, wishlist). Only draft plans can be added to. The first
 * draft (the newest) is chosen until the customer picks another.
 */
export function usePlanTarget() {
  const plans = usePlans();
  const drafts = (plans.data ?? []).filter((p) => p.status === "DRAFT");
  const [chosenPlan, setChosenPlan] = useState<string>("");
  const [chosenSubEvent, setChosenSubEvent] = useState<string>(WHOLE_PLAN);

  const planId = drafts.some((p) => p.id === chosenPlan) ? chosenPlan : (drafts[0]?.id ?? "");
  const plan = usePlan(planId);
  const subEvents = plan.data?.subEvents ?? [];
  const subEventId = subEvents.some((s) => s.id === chosenSubEvent) ? chosenSubEvent : WHOLE_PLAN;

  return {
    /** The customer's draft plans, newest first. */
    drafts,
    loading: plans.isPending,
    /** "" until the plans have loaded, or when there is no draft. */
    planId,
    /** The chosen plan in full (for its functions and its name), once loaded. */
    plan: plan.data,
    subEvents,
    /** The chosen function's id, or null for the plan as a whole; what the backend takes. */
    subEventId: subEventId === WHOLE_PLAN ? null : subEventId,
    wholeLabel: plan.data ? planGroupLabel(plan.data) : "Your event",
    setPlanId: (id: string) => {
      setChosenPlan(id);
      setChosenSubEvent(WHOLE_PLAN);
    },
    setSubEventId: (id: string | null) => setChosenSubEvent(id ?? WHOLE_PLAN),
  };
}

export type PlanTarget = ReturnType<typeof usePlanTarget>;

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** The two selects. Shows a prompt or button to create a plan when the customer has no draft. */
export function PlanTargetFields({
  target,
  className,
  onCreatePlan,
}: {
  target: PlanTarget;
  className?: string;
  onCreatePlan?: () => void;
}) {
  if (target.loading) return <p className="text-sm text-muted-foreground">Loading your plans…</p>;
  if (target.drafts.length === 0) {
    return (
      <div className={className ?? "flex flex-col items-center gap-2 py-2 text-center"}>
        <p className="text-xs text-muted-foreground">You don&apos;t have a draft plan yet.</p>
        {onCreatePlan ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCreatePlan}
            className="gap-1.5 text-xs text-primary"
          >
            <Plus className="size-3.5" /> Create a draft plan
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link href="/plans" className="text-primary underline">create one</Link> to add items.
          </p>
        )}
      </div>
    );
  }
  const planName = target.drafts.find((p) => p.id === target.planId)?.name;
  const functionName = target.subEventId ? target.subEvents.find((s) => s.id === target.subEventId)?.name : target.wholeLabel;
  return (
    <div className={className ?? "grid grid-cols-2 gap-3"}>
      <div className="flex flex-col gap-1.5">
        <Label>Plan</Label>
        <Select
          value={target.planId}
          onValueChange={(v) => {
            if (v === "__new") {
              onCreatePlan?.();
            } else if (v) {
              target.setPlanId(v);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a Plan">{planName}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {target.drafts.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
            {onCreatePlan && (
              <SelectItem value="__new" className="text-primary font-medium">
                + Create new plan…
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Function</Label>
        <Select value={target.subEventId ?? WHOLE_PLAN} onValueChange={(v) => v && target.setSubEventId(v === WHOLE_PLAN ? null : v)}>
          <SelectTrigger className="w-full">
            <SelectValue>{functionName}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={WHOLE_PLAN}>{target.wholeLabel}</SelectItem>
            {target.subEvents.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
