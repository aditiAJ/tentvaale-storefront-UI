"use client";

import { useState } from "react";
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
import { planKeys, uploadCoverImage } from "../api";
import { NO_COVER_CHANGE, PlanCoverField, type CoverChange } from "./PlanCoverField";
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

/** A new plan starts empty: the customer types their own name, venue, dates and guests. */
export function getDefaultPlanValues() {
  return {
    eventType: "Wedding",
    name: "",
    venue: "",
    startDate: "",
    endDate: "",
    guestCount: undefined as number | undefined,
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
  /**
   * Ask for the plan's name only. The venue, dates and guest count are left empty (never invented)
   * for the customer to fill in on the plan page, whose checklist prompts for them.
   */
  nameOnly?: boolean;
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
  nameOnly = false,
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
  // The photo chosen for the new plan, kept until the plan exists to put it on.
  const [cover, setCover] = useState<CoverChange>(NO_COVER_CHANGE);

  /** Closes the form and forgets the chosen photo (a cancelled form must not leave it behind). */
  function requestClose() {
    setCover(NO_COVER_CHANGE);
    onOpenChange(false);
  }

  // Re-seed whenever the dialog opens, so a cancelled attempt never leaves its values behind.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setEventType(initialEventType ?? defaults.eventType);
      setName(initialName ?? defaults.name);
      setVenue(initialVenue ?? defaults.venue);
      setStartDate(initialStartDate ?? defaults.startDate);
      setEndDate(initialEndDate ?? defaults.endDate);
      setGuestCount(initialGuestCount ?? defaults.guestCount);
    }
  }

  function handleEventTypeChange(newType: string) {
    setEventType(newType);
  }

  const isValid = nameOnly
    ? name.trim() !== ""
    : name.trim() !== "" && venue.trim() !== "" && startDate !== "" && endDate !== "" && (guestCount ?? 0) > 0;
  const datesInvalid = startDate !== "" && endDate !== "" && endDate < startDate;

  async function handleCreate() {
    if (!isValid || datesInvalid || submitting) return;
    setSubmitting(true);
    try {
      const plan = await createPlan.mutateAsync(
        nameOnly
          ? { name: name.trim() }
          : { name: name.trim(), venue: venue.trim(), eventDate: startDate, eventEndDate: endDate, guestCount: Number(guestCount) },
      );

      if (cover.file) {
        try {
          const withPhoto = await uploadCoverImage(plan.id, cover.file);
          queryClient.setQueryData(planKeys.detail(plan.id), withPhoto);
        } catch (photoError) {
          // The plan exists; only the picture was refused. Say why, and let them add it from the plan page.
          toast.error(
            `Your plan was created, but the photo wasn't added: ${photoError instanceof ApiError ? photoError.message : "please try again from the plan page."}`,
          );
        }
      }

      // Invalidate plan lists immediately
      void queryClient.invalidateQueries({ queryKey: planKeys.all });

      if (onCreated) {
        await onCreated(plan);
      } else {
        toast.success(`Created "${plan.name}"`);
        router.push(`/plans/${plan.id}`);
      }
      setCover(NO_COVER_CHANGE);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't create the plan. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && (v ? onOpenChange(true) : requestClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {!nameOnly && (
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
          )}

          <div className="space-y-1.5">
            <Label htmlFor="plan-name">Event name *</Label>
            <Input
              id="plan-name"
              placeholder="e.g. Priya's Wedding"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {nameOnly && (
              <p className="text-xs text-muted-foreground">You can add the venue, dates and guest count on your plan page.</p>
            )}
          </div>

          {!nameOnly && (
          <>
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
          </>
          )}

          <PlanCoverField change={cover} onChange={setCover} disabled={submitting} />

          {datesInvalid && <p className="text-xs text-destructive">End date cannot be before the start date.</p>}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={requestClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!isValid || datesInvalid || submitting}>
            {submitting ? (cover.file ? "Creating and uploading…" : "Creating…") : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
