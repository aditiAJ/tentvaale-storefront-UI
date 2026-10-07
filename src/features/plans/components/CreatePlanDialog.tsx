"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateWheelPicker } from "@/components/date-wheel-picker";
import { NumberStepper } from "@/components/number-stepper";
import { ApiError } from "@/services/api-client";
import { planKeys } from "../api";
import { useCreatePlan } from "../hooks";
import type { Plan } from "../types";

export const EVENT_TYPES = [
  "Wedding",
  "Reception",
  "Sangeet & Mehendi",
  "Birthday Party",
  "Corporate Event",
  "Anniversary Celebration",
  "Festival & Cultural",
  "Private Gathering",
] as const;

export function getDefaultPlanValues() {
  const start = new Date();
  start.setDate(start.getDate() + 14); // 2 weeks out
  const end = new Date(start);
  end.setDate(end.getDate() + 1); // 1-day span

  const pad = (n: number) => String(n).padStart(2, "0");
  const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  return {
    eventType: "Wedding",
    name: "My Wedding Celebration",
    venue: "Main Venue / Banquet",
    startDate: toIso(start),
    endDate: toIso(end),
    guestCount: 150,
  };
}

export interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  initialEventType?: string;
  initialVenue?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  initialGuestCount?: number;
  title?: string;
  description?: string;
  submitLabel?: string;
  onCreated?: (plan: Plan) => Promise<void> | void;
}

export function CreatePlanDialog({
  open,
  onOpenChange,
  initialName,
  initialEventType,
  initialVenue,
  initialStartDate,
  initialEndDate,
  initialGuestCount,
  title = "Create a New Plan",
  description = "Set up your event plan. You can edit any details later.",
  submitLabel = "Create & Add to Plan",
  onCreated,
}: CreatePlanDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createPlan = useCreatePlan();
  const defaults = getDefaultPlanValues();

  const [eventType, setEventType] = useState(initialEventType ?? defaults.eventType);
  const [name, setName] = useState(initialName ?? defaults.name);
  const [venue, setVenue] = useState(initialVenue ?? defaults.venue);
  const [startDate, setStartDate] = useState(initialStartDate ?? defaults.startDate);
  const [endDate, setEndDate] = useState(initialEndDate ?? defaults.endDate);
  const [guestCount, setGuestCount] = useState<number | undefined>(initialGuestCount ?? defaults.guestCount);
  const [submitting, setSubmitting] = useState(false);

  // Re-seed defaults whenever the dialog opens or initial props change
  useEffect(() => {
    if (open) {
      const def = getDefaultPlanValues();
      setEventType(initialEventType ?? def.eventType);
      setName(initialName ?? (initialEventType ? `My ${initialEventType}` : def.name));
      setVenue(initialVenue ?? def.venue);
      setStartDate(initialStartDate ?? def.startDate);
      setEndDate(initialEndDate ?? def.endDate);
      setGuestCount(initialGuestCount ?? def.guestCount);
    }
  }, [open, initialName, initialEventType, initialVenue, initialStartDate, initialEndDate, initialGuestCount]);

  function handleEventTypeChange(newType: string) {
    setEventType(newType);
    // If the name was a default-style name, update it automatically to reflect the new event type
    if (!name || name.startsWith("My ") || name.endsWith("Celebration") || name.endsWith("Event")) {
      setName(`My ${newType} Celebration`);
    }
  }

  const isValid = name.trim() !== "" && venue.trim() !== "" && startDate !== "" && endDate !== "" && (guestCount ?? 0) > 0;
  const datesInvalid = startDate !== "" && endDate !== "" && endDate < startDate;

  async function handleCreate() {
    if (!isValid || datesInvalid || submitting) return;
    setSubmitting(true);
    try {
      const plan = await createPlan.mutateAsync({
        name: name.trim(),
        venue: venue.trim(),
        eventDate: startDate,
        eventEndDate: endDate,
        guestCount: Number(guestCount),
      });

      // Invalidate plan lists immediately
      void queryClient.invalidateQueries({ queryKey: planKeys.all });

      if (onCreated) {
        await onCreated(plan);
      } else {
        toast.success(`Created "${plan.name}"`);
        router.push(`/plans/${plan.id}`);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't create the plan. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="plan-event-type">Event type</Label>
            <Select value={eventType} onValueChange={(v) => v && handleEventTypeChange(v)}>
              <SelectTrigger id="plan-event-type" className="w-full">
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plan-name">Event name *</Label>
            <Input
              id="plan-name"
              placeholder="e.g. Priya's Wedding"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plan-venue">Venue *</Label>
            <Input
              id="plan-venue"
              placeholder="e.g. Taj Palace, Delhi"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plan-start">Start date *</Label>
              <DateWheelPicker
                id="plan-start"
                value={startDate}
                onChange={(v) => {
                  setStartDate(v);
                  if (endDate && v && endDate < v) setEndDate(v);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-end">End date *</Label>
              <DateWheelPicker
                id="plan-end"
                min={startDate || undefined}
                value={endDate}
                onChange={(v) => setEndDate(v)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-guests">Guest count *</Label>
            <NumberStepper
              id="plan-guests"
              optional
              placeholder="150"
              value={guestCount}
              onChange={(v) => setGuestCount(v)}
            />
          </div>

          {datesInvalid && <p className="text-xs text-destructive">End date cannot be before the start date.</p>}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!isValid || datesInvalid || submitting}>
            {submitting ? "Creating…" : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
