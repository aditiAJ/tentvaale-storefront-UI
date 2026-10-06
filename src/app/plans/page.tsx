"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, MapPin, Plus, Users } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateWheelPicker } from "@/components/date-wheel-picker";
import { NumberStepper } from "@/components/number-stepper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkeletonCard } from "@/components/ui/skeleton";
import { ApiError } from "@/services/api-client";
import { useRequireAccount } from "@/features/auth";
import { PLAN_STATUS_LABEL } from "@/features/plans/board";
import { useCreatePlan, usePlans } from "@/features/plans/hooks";
import type { PlanStatus, PlanSummary } from "@/features/plans/types";
import { useMockStore } from "@/mock-data/store";
import { formatEventDateRange } from "@/mock-data/seed";

// Flowstep screens 17 (desktop, populated) / 18 (mobile, empty state).
// Status colours come from the shared Badge variants rather than one-off border/text classes, so a
// finished plan looks like a finished anything.
const STATUS_VARIANT: Record<PlanStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  DRAFT: "outline",
  SUBMITTED_FOR_QUOTATION: "accent",
  QUOTED: "accent",
  ORDERED: "default",
};

function PlanCard({ plan }: { plan: PlanSummary }) {
  return (
    <Link href={`/plans/${plan.id}`} className="group flex h-full">
      <Card interactive className="w-full gap-4 overflow-hidden border-border bg-card p-0">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-serif text-xl leading-snug text-card-foreground transition-colors duration-200 ease-out-quint group-hover:text-primary">
              {plan.name}
            </h2>
            <span className="flex shrink-0 flex-col items-end gap-1">
              <Badge variant={STATUS_VARIANT[plan.status]}>{PLAN_STATUS_LABEL[plan.status]}</Badge>
              {plan.myRole && plan.myRole !== "OWNER" ? (
                <Badge variant="outline">Shared with you · {plan.myRole === "EDITOR" ? "editor" : "viewer"}</Badge>
              ) : null}
            </span>
          </div>
          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-primary" />
                {plan.eventDate ? formatEventDateRange(plan.eventDate, plan.eventEndDate) : "Date not set"}
              </span>
              <span className="shrink-0 tabular-nums">
                {plan.itemCount} item{plan.itemCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 text-primary" />
                <span className="truncate">{plan.venue || "Venue not set"}</span>
              </span>
              {plan.guestCount ? (
                <span className="flex shrink-0 items-center gap-1.5 tabular-nums">
                  <Users className="size-3.5 text-primary" />
                  {plan.guestCount}
                </span>
              ) : null}
            </div>
            <span className="text-xs">
              {plan.subEventCount} function{plan.subEventCount === 1 ? "" : "s"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function PlansPage() {
  const account = useRequireAccount();
  const router = useRouter();
  const { wishlist } = useMockStore();
  const plansQuery = usePlans();
  const createPlan = useCreatePlan();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", venue: "", eventStartDate: "", eventEndDate: "", guestCount: "" });
  // Filters by what the customer reads (two backend statuses share "Quotation requested").
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [sort, setSort] = useState<"event-date" | "name" | "status" | "newest">("event-date");

  const myPlans = useMemo(() => {
    let list = plansQuery.data ?? [];
    if (statusFilter !== "all") list = list.filter((p) => PLAN_STATUS_LABEL[p.status] === statusFilter);
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "status") sorted.sort((a, b) => a.status.localeCompare(b.status));
    if (sort === "event-date") sorted.sort((a, b) => (a.eventDate ?? "9999").localeCompare(b.eventDate ?? "9999"));
    // "newest" keeps the order the backend sent: newest first.
    return sorted;
  }, [plansQuery.data, statusFilter, sort]);

  if (!account) return null;

  // Every field is required: a plan without a venue, dates and a head count can't be quoted, so the
  // form blocks rather than creating a half-plan.
  const formComplete =
    form.name.trim() !== "" && form.venue.trim() !== "" && form.eventStartDate !== "" && form.eventEndDate !== "" && Number(form.guestCount) > 0;
  const datesInvalid = form.eventStartDate !== "" && form.eventEndDate !== "" && form.eventEndDate < form.eventStartDate;

  async function handleCreate() {
    if (!formComplete || datesInvalid) return;
    try {
      const plan = await createPlan.mutateAsync({
        name: form.name.trim(),
        venue: form.venue.trim(),
        eventDate: form.eventStartDate,
        eventEndDate: form.eventEndDate,
        guestCount: Number(form.guestCount),
      });
      setForm({ name: "", venue: "", eventStartDate: "", eventEndDate: "", guestCount: "" });
      setDialogOpen(false);
      toast.success(`Created "${plan.name}"`);
      router.push(`/plans/${plan.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't create the plan. Please try again.");
    }
  }

  const NewPlanDialog = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger
        render={
          <Button size="lg" className="gap-1.5">
            <Plus className="size-4" /> New Plan
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan-name">Event name *</Label>
            <Input id="plan-name" placeholder="Priya's Wedding" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-venue">Venue *</Label>
            <Input id="plan-venue" placeholder="Taj Palace, Delhi" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="plan-start">Start date *</Label>
              <DateWheelPicker id="plan-start" value={form.eventStartDate} onChange={(v) => setForm({ ...form, eventStartDate: v })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-end">End date *</Label>
              <DateWheelPicker id="plan-end" min={form.eventStartDate || undefined} value={form.eventEndDate} onChange={(v) => setForm({ ...form, eventEndDate: v })} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="plan-guests">Guest count *</Label>
            <NumberStepper
              id="plan-guests"
              optional
              placeholder="250"
              value={form.guestCount === "" ? undefined : Number(form.guestCount)}
              onChange={(v) => setForm({ ...form, guestCount: v === undefined ? "" : String(v) })}
            />
          </div>
          {datesInvalid && <p className="text-xs text-destructive">End date cannot be before the start date.</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={!formComplete || datesInvalid || createPlan.isPending}>
            {createPlan.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (plansQuery.isPending) {
    return (
      <div className="mx-auto w-full max-w-6xl py-8 page-x">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">My Plans</h1>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (plansQuery.isError) {
    return (
      <div role="alert" className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 py-20 text-center page-x">
        <h1 className="font-serif text-2xl text-foreground">We couldn&apos;t load your plans</h1>
        <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
        <Button variant="outline" onClick={() => plansQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if ((plansQuery.data ?? []).length === 0) {
    return (
      <Reveal immediate className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 py-20 text-center page-x">
        {/* Gold halo behind the glyph gives the empty state a focal point instead of a lone outlined square. */}
        <div className="relative flex size-20 items-center justify-center rounded-2xl bg-card text-primary shadow-e2 ring-1 ring-primary/40">
          <span className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl" aria-hidden />
          <CalendarDays className="relative size-10" />
        </div>
        <h1 className="font-serif text-2xl text-foreground">Start your first Plan</h1>
        <p className="max-w-[330px] text-sm leading-6 text-muted-foreground">
          {wishlist.length > 0
            ? `You have ${wishlist.length} item${wishlist.length === 1 ? "" : "s"} saved in your Wishlist. Turn them into a Plan with an event date and sub-events like Sangeet or Reception.`
            : "Browse the catalog and add pieces to a Plan with an event date and sub-events like Sangeet or Reception."}
        </p>
        <div className="flex w-full flex-col gap-2.5 pt-2">
          {wishlist.length > 0 && <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/wishlist">Create Plan from Wishlist</Link>} />}
          {NewPlanDialog}
        </div>
      </Reveal>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl py-8 page-x">
      <Reveal immediate className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">My Plans</h1>
        {NewPlanDialog}
      </Reveal>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-b border-border pb-6">
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-48 border-border bg-card">
            <SelectValue placeholder="All Statuses">{statusFilter === "all" ? "All Statuses" : statusFilter}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {[...new Set(Object.values(PLAN_STATUS_LABEL))].map((label) => (
              <SelectItem key={label} value={label}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => v && setSort(v as typeof sort)}>
          <SelectTrigger className="w-48 border-border bg-card">
            <SelectValue placeholder="Sort: Event Date">
              {{ "event-date": "Sort: Event Date", newest: "Sort: Newest", name: "Sort: Name", status: "Sort: Status" }[sort]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="event-date">Sort: Event Date</SelectItem>
            <SelectItem value="newest">Sort: Newest</SelectItem>
            <SelectItem value="name">Sort: Name</SelectItem>
            <SelectItem value="status">Sort: Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {myPlans.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">No plans with that status.</p>
      ) : (
        <Stagger
          // Re-keys on the filter/sort so a new result set cascades in.
          key={`${statusFilter}-${sort}`}
          immediate
          gap={0.05}
          className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {myPlans.map((plan) => (
            <StaggerItem key={plan.id} className="flex flex-col">
              <PlanCard plan={plan} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
