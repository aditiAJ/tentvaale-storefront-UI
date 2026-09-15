"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Boxes,
  CalendarRange,
  Clock,
  GanttChartSquare,
  Info,
  Check,
  CheckCircle2,
  ChevronDown,
  LayoutList,
  ListChecks,
  Minus,
  MoveRight,
  Pencil,
  Plus,
  Repeat,
  Search,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProductThumb } from "@/components/product-thumb";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useRequireAccount } from "@/features/auth";
import { canSubmitPlan, useMockStore } from "@/mock-data/store";
import { getProductUsage, needsSharingDecision, requiredQuantity, reuseBreakdown } from "@/mock-data/inventory-sharing";
import { FUNCTION_PRESETS, STARTER_SUGGESTIONS, formatEventDate, formatEventDateRange, formatRupees, rateTypeLabel } from "@/mock-data/seed";
import type { PlanItem, PlanStatus, Product, SubEvent } from "@/mock-data/types";

// Flowstep screens 19 (desktop) / 20 (mobile), fileId 8bd03b8a-4561-4b58-bb2d-ca011d84d53e.
const STATUS_STYLE: Record<PlanStatus, string> = {
  Draft: "border border-muted-foreground text-muted-foreground",
  Submitted: "border border-primary text-primary",
  Quoted: "border border-primary text-primary",
  PartiallyAccepted: "border border-primary text-primary",
  Ordered: "bg-primary text-primary-foreground",
  Cancelled: "border border-destructive/60 bg-destructive/10 text-destructive",
};

const EMPTY_SUB_EVENT = { name: "", eventDate: "", venue: "", setupDate: "", teardownDate: "", guestCount: "", startTime: "", endTime: "" };

// One row of the event-details strip; renders a dash rather than collapsing so
// the strip keeps the same shape whether or not a field was filled in.
function DetailCell({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs tracking-wider text-muted-foreground uppercase">{label}</span>
      <span className="text-sm text-foreground">{value === undefined || value === "" ? "Not set" : value}</span>
    </div>
  );
}

// "₹450 per unit" / "₹25 per sqft" — the rate type reads off the price
// instead of sitting in a column of its own.
function unitRateLabel(product: Product) {
  return `${formatRupees(product.basePrice)} ${rateTypeLabel(product.rateType)}`;
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function PlanDetailPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params);
  const account = useRequireAccount();
  const { getPlan, products, accounts, removeSubEvent, removePlanItem, movePlanItem, addPlanItem, setPlanItemQty, markSetupAdded, addSubEvent, updateSubEvent, setItemSharing, clearItemSharing } = useMockStore();
  const plan = getPlan(planId);

  const [activeTab, setActiveTab] = useState<string | null>(null); // null = General/Untagged
  // Keyed by sub-event id ("general" for the untagged list) so each
  // sub-event gets its own set of starter suggestions to work through.
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Record<string, string[]>>({});
  // Manual expand/collapse of "Complete your setup", per sub-event; unset = auto.
  const [setupOpen, setSetupOpen] = useState<Record<string, boolean>>({});
  const [subEventDialogOpen, setSubEventDialogOpen] = useState(false);
  const [subEventForm, setSubEventForm] = useState(EMPTY_SUB_EVENT);
  const [customFunctionName, setCustomFunctionName] = useState(false);
  // null = the dialog is adding a new sub-event; an id = editing that one.
  const [editingSubEventId, setEditingSubEventId] = useState<string | null>(null);
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  const [view, setView] = useState<"sub-events" | "dates" | "timeline" | "inventory">("sub-events");
  const [activeDate, setActiveDate] = useState<string | null>(null);
  // Which starter suggestion opened the product picker — null = picker closed.
  const [pickerFor, setPickerFor] = useState<(typeof STARTER_SUGGESTIONS)[number] | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerShowAll, setPickerShowAll] = useState(false);
  // productId -> quantity for everything ticked in the picker.
  const [pickerSelection, setPickerSelection] = useState<Record<string, number>>({});

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  if (!account) return null;
  if (!plan) return <div className="mx-auto w-full max-w-5xl px-4 py-10">Plan not found.</div>;

  const canSubmit = canSubmitPlan(plan, account.id);
  const owner = accounts.find((a) => a.id === plan.ownerAccountId);
  const collaborators = [owner, ...plan.coOwners.map((c) => accounts.find((a) => a.id === c.accountId))].filter(Boolean);

  const activeItems = plan.items.filter((it) => it.subEventId === activeTab);
  const activeSubEvent = activeTab ? plan.subEvents.find((se) => se.id === activeTab) : undefined;
  const activeLabel = activeSubEvent?.name ?? "General / Untagged";

  // Drives the "Shared with X" tag on line items and the Inventory view.
  const productUsage = getProductUsage(plan, products);

  // Gentle planning nudges, never framed as a shortage or a warning — just
  // things the customer hasn't gotten to yet.
  const healthPrompts: string[] = [
    ...productUsage
      .filter((u) => needsSharingDecision(u) && !plan!.itemSharing?.[u.productId])
      .map((u) => `You haven't confirmed whether ${u.product.name} is shared between ${[...new Set(u.subEventOccurrences.map((o) => o.subEventName))].join(" and ")}.`),
    ...plan.subEvents.filter((se) => !plan!.items.some((it) => it.subEventId === se.id)).map((se) => `${se.name} has no inventory added yet.`),
  ];
  function sharedWithLabel(item: PlanItem): string | null {
    if (plan!.itemSharing?.[item.productId] !== "Shared") return null;
    const usage = productUsage.find((u) => u.productId === item.productId);
    const others = usage?.subEventOccurrences.filter((o) => o.itemId !== item.id) ?? [];
    if (others.length === 0) return null;
    return `Shared with ${[...new Set(others.map((o) => o.subEventName))].join(", ")}`;
  }

  function lineQty(item: PlanItem) {
    return item.dimensions?.length ?? item.quantity;
  }
  function linePrice(item: PlanItem) {
    const product = productById.get(item.productId);
    return product ? product.basePrice * lineQty(item) : 0;
  }
  function subEventTotal(subEventId: string | null) {
    return plan!.items.filter((it) => it.subEventId === subEventId).reduce((sum, it) => sum + linePrice(it), 0);
  }
  const planTotal = plan.items.reduce((sum, it) => sum + linePrice(it), 0);

  const startDate = plan.eventStartDate ?? plan.subEvents[0]?.eventDate;
  const planDateLabel = formatEventDateRange(startDate, plan.eventEndDate);

  const suggestionScope = activeTab ?? "general";
  const availableSuggestions = STARTER_SUGGESTIONS.filter((s) => !(dismissedSuggestions[suggestionScope] ?? []).includes(s.key));
  const setupAddedKeys = plan.setupAdded?.[suggestionScope] ?? [];
  const setupAddedCount = availableSuggestions.filter((s) => setupAddedKeys.includes(s.key)).length;
  const setupComplete = setupAddedCount === availableSuggestions.length;
  // Open by default only while this sub-event is still empty; once anything is
  // added it collapses, but the customer can still expand it.
  const setupExpanded = setupOpen[suggestionScope] ?? (activeItems.length === 0 && !setupComplete);

  function dismissSuggestion(key: string) {
    setDismissedSuggestions((d) => ({ ...d, [suggestionScope]: [...(d[suggestionScope] ?? []), key] }));
  }

  // A suggestion opens the picker rather than adding a product outright — the
  // customer chooses which entry gate / stage / seating they actually want.
  const pickerProducts = !pickerFor
    ? []
    : products.filter((prod) => {
        const inCategory = pickerShowAll || pickerFor.categories.includes(prod.category);
        const matchesQuery = pickerQuery.trim() === "" || prod.name.toLowerCase().includes(pickerQuery.trim().toLowerCase());
        return inCategory && matchesQuery;
      });

  function openPicker(suggestion: (typeof STARTER_SUGGESTIONS)[number]) {
    setPickerFor(suggestion);
    setPickerQuery("");
    setPickerShowAll(false);
    setPickerSelection({});
  }

  // "+" on a line re-tags it to another sub-event, so an item parked in
  // General / Untagged isn't stranded there.
  function renderMoveMenu(item: PlanItem) {
    const targets = [{ id: null as string | null, name: "General / Untagged" }, ...plan!.subEvents.map((se) => ({ id: se.id as string | null, name: se.name }))].filter(
      (t) => t.id !== item.subEventId,
    );
    if (targets.length === 0) return null;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="text-muted-foreground hover:text-primary" aria-label="Move to sub-event">
              <Plus className="size-4" />
            </button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Move to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {targets.map((t) => (
              <DropdownMenuItem
                key={t.id ?? "general"}
                onClick={() => {
                  movePlanItem(planId, item.id, t.id);
                  toast.success(`Moved to ${t.name}`);
                }}
              >
                <MoveRight className="size-4" /> {t.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Date view: every sub-event that shares a calendar date, with its lines and
  // a total for the whole day. Sub-events with no date yet, and the general
  // untagged list, are grouped under their own headings so nothing is hidden.
  function renderDateView() {
    const byDate = new Map<string, SubEvent[]>();
    for (const se of plan!.subEvents) {
      const key = se.eventDate || "unscheduled";
      byDate.set(key, [...(byDate.get(key) ?? []), se]);
    }
    const generalItems = plan!.items.filter((it) => it.subEventId === null);
    if (generalItems.length > 0) byDate.set("general", []);

    const dates = [...byDate.keys()].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
    const selected = dates.includes(activeDate ?? "") ? activeDate! : dates[0];
    if (!selected) {
      return (
        <p className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Add a sub-event with a date to see the day-by-day view.
        </p>
      );
    }

    const dayTotal = (key: string) =>
      key === "general" ? subEventTotal(null) : (byDate.get(key) ?? []).reduce((sum, se) => sum + subEventTotal(se.id), 0);
    const dayLabel = (key: string) => (key === "general" ? "General" : key === "unscheduled" ? "Unscheduled" : formatEventDate(key));
    const daySubLabel = (key: string) => {
      if (key === "general") return "Untagged items";
      const count = (byDate.get(key) ?? []).length;
      return `${count} sub-event${count === 1 ? "" : "s"}`;
    };

    const selectedSubEvents = byDate.get(selected) ?? [];

    return (
      <div className="grid gap-6 pt-6 md:grid-cols-[240px_1fr]">
        {/* Date rail */}
        <aside className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {dates.map((key) => {
            const active = key === selected;
            return (
              <button
                key={key}
                onClick={() => setActiveDate(key)}
                className={cn(
                  "flex w-44 shrink-0 flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-colors md:w-auto",
                  active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40",
                )}
              >
                <span className={cn("font-serif text-base", active ? "text-primary" : "text-foreground")}>{dayLabel(key)}</span>
                <span className="text-xs text-muted-foreground">{daySubLabel(key)}</span>
                <span className={cn("text-sm", active ? "text-primary" : "text-muted-foreground")}>{formatRupees(dayTotal(key))}</span>
              </button>
            );
          })}
          <div className="hidden justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3 md:flex">
            <span className="text-sm text-foreground">Plan Total</span>
            <span className="font-serif text-lg text-primary">{formatRupees(planTotal)}</span>
          </div>
        </aside>

        {/* Selected day */}
        <div className="flex flex-col gap-5">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-serif text-2xl text-foreground">{dayLabel(selected)}</h2>
              <span className="text-sm text-muted-foreground">{daySubLabel(selected)}</span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-xs tracking-wider text-muted-foreground uppercase">Day total</span>
              <span className="font-serif text-3xl text-primary">{formatRupees(dayTotal(selected))}</span>
            </div>
          </header>

          {selected === "general"
            ? renderDayCard("General / Untagged", undefined, generalItems, subEventTotal(null))
            : selectedSubEvents.map((se) =>
                renderDayCard(
                  se.name,
                  se,
                  plan!.items.filter((it) => it.subEventId === se.id),
                  subEventTotal(se.id),
                ),
              )}
        </div>
      </div>
    );
  }

  // "general" and "unscheduled" always sort after real calendar dates.
  function rank(key: string) {
    return key === "general" ? 2 : key === "unscheduled" ? 1 : 0;
  }

  function renderDayCard(title: string, subEvent: SubEvent | undefined, items: PlanItem[], total: number) {
    return (
      <section key={subEvent?.id ?? title} className="overflow-hidden rounded-xl border border-border bg-card">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-serif text-lg text-foreground">{title}</h3>
            {subEvent && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                {subEvent.venue && <span>{subEvent.venue}</span>}
                {subEvent.guestCount ? <span>· {subEvent.guestCount} guests</span> : null}
                {subEvent.setupDate && <span>· Setup {formatEventDate(subEvent.setupDate)}</span>}
                {subEvent.teardownDate && <span>· Tear-down {formatEventDate(subEvent.teardownDate)}</span>}
              </div>
            )}
          </div>
          <span className="font-serif text-xl text-primary">{formatRupees(total)}</span>
        </header>
        {items.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-muted-foreground">No items yet.</p>
        ) : (
          items.map((item) => {
            const product = productById.get(item.productId);
            if (!product) return null;
            return (
              <div key={item.id} className="grid grid-cols-[2fr_1fr_1.2fr] items-center gap-4 border-b border-border px-5 py-3 text-sm last:border-b-0">
                <span className="flex items-center gap-3">
                  <ProductThumb imageUrl={product.imageUrl} alt={product.name} className="size-10 shrink-0" />
                  <span className="text-foreground">{product.name}</span>
                </span>
                <span className="text-muted-foreground">
                  {item.dimensions ? `${item.dimensions.length} ${product.rateType === "SqFt" ? "sqft" : "ft"}` : `Qty ${item.quantity}`}
                </span>
                <span className="flex flex-col text-right">
                  <span className="font-serif text-base text-primary">{formatRupees(linePrice(item))}</span>
                  <span className="text-xs text-muted-foreground">{unitRateLabel(product)}</span>
                </span>
              </div>
            );
          })
        )}
      </section>
    );
  }

  // Timeline: a horizontal band per sub-event that has a start time, laid out
  // against a single continuous time axis (earliest start -> latest end
  // across the plan). This is a planning aid, not a scheduler — it only ever
  // shows where things sit relative to each other; nothing here blocks
  // anything or calls it a "conflict".
  function renderTimelineView() {
    const scheduled = plan!.subEvents
      .filter((se) => se.eventDate && se.startTime)
      .map((se) => {
        const start = new Date(`${se.eventDate}T${se.startTime}`);
        const end = se.endTime ? new Date(`${se.eventDate}T${se.endTime}`) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
        return { se, start, end: end > start ? end : new Date(start.getTime() + 30 * 60 * 1000) };
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    const unscheduled = plan!.subEvents.filter((se) => !se.eventDate || !se.startTime);

    if (scheduled.length === 0) {
      return (
        <p className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Give a sub-event a date and start time to see it here, laid out against the others.
        </p>
      );
    }

    const axisMin = Math.min(...scheduled.map((s) => s.start.getTime()));
    const axisMax = Math.max(...scheduled.map((s) => s.end.getTime()));
    const span = Math.max(axisMax - axisMin, 60 * 60 * 1000);
    const pct = (t: number) => ((t - axisMin) / span) * 100;

    const dayTicks: { key: string; label: string; pct: number }[] = [];
    const seenDays = new Set<string>();
    for (const { se } of scheduled) {
      if (seenDays.has(se.eventDate)) continue;
      seenDays.add(se.eventDate);
      dayTicks.push({ key: se.eventDate, label: formatEventDate(se.eventDate), pct: Math.max(0, Math.min(100, pct(new Date(`${se.eventDate}T00:00`).getTime()))) });
    }
    dayTicks.sort((a, b) => a.pct - b.pct);

    // Merge every stretch where 2+ sub-events are concurrently running into
    // highlight bands — a sweep over start/end edges, not a conflict check.
    const edges = scheduled.flatMap(({ start, end }) => [
      { t: start.getTime(), delta: 1 },
      { t: end.getTime(), delta: -1 },
    ]);
    edges.sort((a, b) => a.t - b.t);
    const overlapRanges: { start: number; end: number }[] = [];
    let concurrent = 0;
    let rangeStart: number | null = null;
    for (const e of edges) {
      const was = concurrent >= 2;
      concurrent += e.delta;
      const is = concurrent >= 2;
      if (!was && is) rangeStart = e.t;
      if (was && !is && rangeStart !== null) {
        overlapRanges.push({ start: rangeStart, end: e.t });
        rangeStart = null;
      }
    }

    return (
      <div className="mt-6 flex flex-col gap-4">
        <div className="overflow-x-auto rounded-xl border border-border bg-card p-5">
          <div className="min-w-[640px]">
            <div className="relative mb-5 h-5 border-b border-border">
              {dayTicks.map((t) => (
                <span key={t.key} className="absolute top-0 -translate-x-1/2 text-[11px] whitespace-nowrap text-muted-foreground" style={{ left: `${t.pct}%` }}>
                  {t.label}
                </span>
              ))}
            </div>
            <div className="relative flex flex-col gap-3">
              {overlapRanges.map((r, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 rounded-lg bg-primary/10"
                  style={{ left: `${pct(r.start)}%`, width: `${Math.max(pct(r.end) - pct(r.start), 0.5)}%` }}
                />
              ))}
              {scheduled.map(({ se, start, end }) => {
                const left = pct(start.getTime());
                const width = Math.max(pct(end.getTime()) - left, 4);
                return (
                  <div key={se.id} className="relative h-12">
                    <button
                      onClick={() => {
                        setActiveTab(se.id);
                        setView("sub-events");
                      }}
                      className="absolute flex h-10 items-center gap-2 overflow-hidden rounded-lg border border-primary/50 bg-primary/15 px-3 text-left transition-colors hover:bg-primary/25"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      <span className="truncate text-sm font-medium text-foreground">{se.name}</span>
                      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                        {se.startTime}
                        {se.endTime ? `–${se.endTime}` : ""}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {overlapRanges.length > 0 && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block size-3 shrink-0 rounded-sm bg-primary/10" /> Highlighted bands mark sub-events that share the same time window — worth a look in the Inventory view for anything they could reuse.
          </p>
        )}

        {unscheduled.length > 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
            Not on the timeline yet (no start time set): {unscheduled.map((se) => se.name).join(", ")}
          </div>
        )}
      </div>
    );
  }

  // Inventory: every product used anywhere in the plan, grouped across
  // sub-events. Where a product appears in 2+ sub-events, this is the manual
  // Shared/Dedicated prompt — the customer's own call, never inferred from
  // the Timeline's overlap bands.
  function renderInventoryView() {
    const usage = productUsage;
    const decisions = plan!.itemSharing ?? {};

    if (usage.length === 0) {
      return (
        <p className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Add items to a sub-event to see them here, grouped by product across the whole plan.
        </p>
      );
    }

    return (
      <div className="mt-6 flex flex-col gap-4">
        {usage.map((u) => {
          const decision = decisions[u.productId];
          const decisionNeeded = needsSharingDecision(u);
          const qty = requiredQuantity(u, decision);
          return (
            <section key={u.productId} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div className="flex items-center gap-3">
                  <ProductThumb imageUrl={u.product.imageUrl} alt={u.product.name} className="size-10 shrink-0" />
                  <div>
                    <h3 className="font-serif text-lg text-foreground">{u.product.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Used by {u.occurrences.length} {u.occurrences.length === 1 ? "line" : "lines"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs tracking-wider text-muted-foreground uppercase">Required Quantity</span>
                  <p className="font-serif text-2xl text-primary">{qty}</p>
                </div>
              </div>

              <div className="flex flex-col divide-y divide-border">
                {u.occurrences.map((o) => (
                  <div key={o.itemId} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                    <span className="text-foreground">{o.subEventName}</span>
                    <span className="text-muted-foreground">{o.timeWindow ?? "No date set"}</span>
                    <span className="text-primary">Qty {o.quantity}</span>
                  </div>
                ))}
              </div>

              {decisionNeeded && (
                <div className="flex flex-col gap-3 border-t border-border bg-background/40 px-5 py-4">
                  <p className="text-sm text-foreground">
                    Same {u.product.name.toLowerCase()} used by {[...new Set(u.subEventOccurrences.map((o) => o.subEventName))].join(" and ")}?
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      className={cn(
                        "rounded-lg border px-4 py-2 text-sm transition-colors",
                        decision === "Shared" ? "border-primary bg-primary text-primary-foreground" : "border-primary text-primary hover:bg-primary/10",
                      )}
                      onClick={() => setItemSharing(planId, u.productId, "Shared")}
                    >
                      Yes, reuse these
                    </button>
                    <button
                      className={cn(
                        "rounded-lg border px-4 py-2 text-sm transition-colors",
                        decision === "Dedicated" ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                      onClick={() => setItemSharing(planId, u.productId, "Dedicated")}
                    >
                      No, keep separate
                    </button>
                    {decision && (
                      <button className="text-xs text-muted-foreground underline" onClick={() => clearItemSharing(planId, u.productId)}>
                        Undo
                      </button>
                    )}
                  </div>
                  {decision === "Shared" && <p className="text-xs text-primary">You&apos;ve marked these as shared — combined requirement: {qty}.</p>}
                  {decision === "Dedicated" && <p className="text-xs text-muted-foreground">Kept separate — quantities stack to {qty}.</p>}
                  {!decision && <p className="text-xs text-muted-foreground">Not yet confirmed — quantities are stacked ({qty}) until you decide.</p>}
                </div>
              )}
            </section>
          );
        })}
      </div>
    );
  }

  const selectedIds = Object.keys(pickerSelection);
  const allPickerSelected = pickerProducts.length > 0 && pickerProducts.every((p) => pickerSelection[p.id]);

  function togglePickerProduct(productId: string) {
    setPickerSelection((s) => {
      const next = { ...s };
      if (next[productId]) delete next[productId];
      else next[productId] = 1;
      return next;
    });
  }

  function toggleSelectAll() {
    setPickerSelection((s) => {
      const next = { ...s };
      for (const p of pickerProducts) {
        if (allPickerSelected) delete next[p.id];
        else next[p.id] ??= 1;
      }
      return next;
    });
  }

  function addSelectedFromPicker() {
    for (const productId of selectedIds) {
      addPlanItem(planId, { productId, quantity: pickerSelection[productId], subEventId: activeTab });
    }
    markSetupAdded(planId, suggestionScope, pickerFor!.key);
    setPickerFor(null);
    toast.success(`Added ${selectedIds.length} item${selectedIds.length === 1 ? "" : "s"} to ${activeLabel}`);
  }

  // Products used by 2+ sub-events. "Reuse" marks them Shared, so later
  // sub-events carry over units from earlier ones (Haldi 40 chairs, Sangeet
  // 100 -> 40 reused, 60 new); "Keep separate" stacks the quantities.
  function renderSharedProducts() {
    const shared = productUsage.filter(needsSharingDecision);
    if (shared.length === 0) return null;
    const decisions = plan!.itemSharing ?? {};
    const totalSaving = shared.reduce(
      (sum, u) => sum + (decisions[u.productId] === "Shared" ? reuseBreakdown(u).totalReused * u.product.basePrice : 0),
      0,
    );

    return (
      <aside className="h-fit rounded-xl bg-card p-6">
        <div className="flex items-center gap-2">
          <Repeat className="size-5 text-primary" />
          <h2 className="font-serif text-2xl text-foreground">Shared Products</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Used in more than one sub-event. Reuse them to rent fewer units.</p>

        <div className="mt-5 flex flex-col divide-y divide-border">
          {shared.map((u) => {
            const decision = decisions[u.productId];
            const isShared = decision === "Shared";
            const { steps, totalReused } = reuseBreakdown(u);
            return (
              <div key={u.productId} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <ProductThumb imageUrl={u.product.imageUrl} alt={u.product.name} className="size-9 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{u.product.name}</p>
                    <p className="text-xs text-muted-foreground">Need {requiredQuantity(u, decision)} units</p>
                  </div>
                </div>

                <ul className="flex flex-col gap-1.5 text-xs">
                  {steps.map(({ occurrence, reused, fresh }) => (
                    <li key={occurrence.itemId} className="flex items-baseline justify-between gap-2">
                      <span className="text-foreground">
                        {occurrence.subEventName} <span className="text-muted-foreground">· {occurrence.quantity}</span>
                      </span>
                      <span className={cn("text-right", isShared && reused > 0 ? "text-primary" : "text-muted-foreground")}>
                        {!isShared ? `${occurrence.quantity} new` : reused === 0 ? `${fresh} new` : fresh === 0 ? `${reused} reused` : `${reused} reused + ${fresh} new`}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-2">
                  <button
                    className={cn(
                      "flex-1 rounded-lg border px-2 py-1.5 text-xs transition-colors",
                      isShared ? "border-primary bg-primary text-primary-foreground" : "border-primary text-primary hover:bg-primary/10",
                    )}
                    onClick={() => setItemSharing(planId, u.productId, "Shared")}
                  >
                    Reuse
                  </button>
                  <button
                    className={cn(
                      "flex-1 rounded-lg border px-2 py-1.5 text-xs transition-colors",
                      decision === "Dedicated" ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                    onClick={() => setItemSharing(planId, u.productId, "Dedicated")}
                  >
                    Keep separate
                  </button>
                </div>
                {isShared && totalReused > 0 && (
                  <p className="text-xs text-primary">
                    {totalReused} reused · saves {formatRupees(totalReused * u.product.basePrice)}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {totalSaving > 0 && (
          <>
            <div className="my-5 border-t border-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Estimated reuse saving</span>
              <span className="font-serif text-xl text-primary">−{formatRupees(totalSaving)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Confirmed by our team in the quotation.</p>
          </>
        )}
      </aside>
    );
  }

  // Only name is required. Date, time, venue, setup/teardown and guest count
  // are logistics the customer often doesn't know yet — they stay optional
  // and can be left blank without blocking the sub-event.
  function handleSaveSubEvent() {
    const f = subEventForm;
    if (!f.name.trim()) return;
    const details = {
      venue: f.venue.trim() || undefined,
      setupDate: f.setupDate || undefined,
      teardownDate: f.teardownDate || undefined,
      guestCount: Number(f.guestCount) > 0 ? Number(f.guestCount) : undefined,
      startTime: f.startTime || undefined,
      endTime: f.endTime || undefined,
    };
    if (editingSubEventId) updateSubEvent(planId, editingSubEventId, f.name.trim(), f.eventDate, details);
    else addSubEvent(planId, f.name.trim(), f.eventDate, details);
    closeSubEventDialog();
  }

  function closeSubEventDialog() {
    setSubEventForm(EMPTY_SUB_EVENT);
    setCustomFunctionName(false);
    setEditingSubEventId(null);
    setSubEventDialogOpen(false);
  }

  function openAddSubEvent() {
    setSubEventForm(EMPTY_SUB_EVENT);
    setCustomFunctionName(false);
    setEditingSubEventId(null);
    setSubEventDialogOpen(true);
  }

  function openEditSubEvent(se: SubEvent) {
    setSubEventForm({
      name: se.name,
      eventDate: se.eventDate,
      venue: se.venue ?? "",
      setupDate: se.setupDate ?? "",
      teardownDate: se.teardownDate ?? "",
      guestCount: se.guestCount ? String(se.guestCount) : "",
      startTime: se.startTime ?? "",
      endTime: se.endTime ?? "",
    });
    setCustomFunctionName(!(FUNCTION_PRESETS as readonly string[]).includes(se.name));
    setEditingSubEventId(se.id);
    setSubEventDialogOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 md:px-8">
      {/* Header */}
      <section className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl text-foreground md:text-3xl">{plan.name}</h1>
            <Pencil className="size-4 text-muted-foreground" />
            <span className={cn("rounded-full px-3 py-1 text-xs", STATUS_STYLE[plan.status])}>{plan.status}</span>
          </div>
          {/* Venue, dates and head count ride under the name — a four-cell
              detail grid for four short values was mostly whitespace. */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span className="text-foreground">{planDateLabel}</span>
            <span className="text-border">|</span>
            <span>{plan.venue || "Venue not set"}</span>
            <span className="text-border">|</span>
            <span>{plan.guestCount ? `${plan.guestCount} guests` : "Guest count not set"}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {collaborators.map((c, i) => (
                <span
                  key={c!.id}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 border-background text-xs font-medium",
                    i === 0 ? "bg-primary text-primary-foreground" : i === 1 ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {initials(c!.name)}
                </span>
              ))}
            </div>
            <Button variant="outline" size="sm" className="rounded-full border-primary text-primary" nativeButton={false} render={<Link href={`/plans/${planId}/share`}>+ Invite</Link>} />
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={auditLogOpen} onOpenChange={setAuditLogOpen}>
              <DialogTrigger
                render={
                  <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground">
                    <Clock className="size-4" /> Audit Log
                  </button>
                }
              />
              <DialogContent className="max-h-[70vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Activity</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  {plan.auditLog
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <div key={entry.id} className="rounded-lg border border-border p-3 text-sm">
                        <span className="font-medium">{entry.action}</span> — {entry.detail}
                        <div className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  {plan.auditLog.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" className="gap-2 rounded-lg border-primary text-primary" nativeButton={false} render={<Link href={`/plans/${planId}/share`}><Share2 className="size-4" /> Share</Link>} />
          </div>
        </div>
      </section>

      {/* Plan Health — planning gaps, not shortages. Same visual weight as a
          checklist item, no red/warning styling. */}
      {healthPrompts.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          {healthPrompts.map((prompt, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{prompt}</span>
            </div>
          ))}
        </div>
      )}

      {/* View switch — per sub-event, everything grouped by calendar date, the
          Timeline overview, or the cross-plan Inventory / sharing view. */}
      <div className="flex flex-wrap items-center gap-2 pt-4">
        {([
          { key: "sub-events", label: "Sub-events", icon: LayoutList },
          { key: "dates", label: "Date view", icon: CalendarRange },
          { key: "timeline", label: "Timeline", icon: GanttChartSquare },
          { key: "inventory", label: "Inventory", icon: Boxes },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
              view === key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40",
            )}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      {view === "dates" ? (
        renderDateView()
      ) : view === "timeline" ? (
        renderTimelineView()
      ) : view === "inventory" ? (
        renderInventoryView()
      ) : (
        <>
      {/* Sub-event tabs */}
      <div className="flex items-center gap-6 overflow-x-auto border-b border-border pt-2">
        <button
          className={cn("shrink-0 border-b-2 py-4 text-sm", activeTab === null ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
          onClick={() => setActiveTab(null)}
        >
          General / Untagged
        </button>
        {plan.subEvents.map((se) => (
          <button
            key={se.id}
            className={cn("shrink-0 border-b-2 py-4 text-sm", activeTab === se.id ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
            onClick={() => setActiveTab(se.id)}
          >
            {se.name}
          </button>
        ))}
        <Dialog open={subEventDialogOpen} onOpenChange={(open) => (open ? setSubEventDialogOpen(true) : closeSubEventDialog())}>
          <DialogTrigger
            render={
              <button className="flex shrink-0 items-center gap-2 py-4 text-sm text-muted-foreground" onClick={openAddSubEvent}>
                <Plus className="size-4" /> Add Sub-Event
              </button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubEventId ? "Edit sub-event" : "Add sub-event"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Function *</Label>
                <div className="flex flex-wrap gap-2">
                  {FUNCTION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setCustomFunctionName(false);
                        setSubEventForm({ ...subEventForm, name: preset });
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        !customFunctionName && subEventForm.name === preset ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setCustomFunctionName(true);
                      setSubEventForm({ ...subEventForm, name: "" });
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      customFunctionName ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    Custom
                  </button>
                </div>
                {customFunctionName && (
                  <Input
                    id="se-name"
                    placeholder="e.g. Cocktail Hour"
                    value={subEventForm.name}
                    onChange={(e) => setSubEventForm({ ...subEventForm, name: e.target.value })}
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">Everything below is optional — fill in what you know now.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="se-date">Date</Label>
                  <Input
                    id="se-date"
                    type="date"
                    value={subEventForm.eventDate}
                    onChange={(e) => setSubEventForm({ ...subEventForm, eventDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="se-guests">Guest count</Label>
                  <Input
                    id="se-guests"
                    type="number"
                    min={1}
                    placeholder="150"
                    value={subEventForm.guestCount}
                    onChange={(e) => setSubEventForm({ ...subEventForm, guestCount: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="se-start-time">Start time</Label>
                  <Input
                    id="se-start-time"
                    type="time"
                    value={subEventForm.startTime}
                    onChange={(e) => setSubEventForm({ ...subEventForm, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="se-end-time">End time</Label>
                  <Input
                    id="se-end-time"
                    type="time"
                    min={subEventForm.startTime || undefined}
                    value={subEventForm.endTime}
                    onChange={(e) => setSubEventForm({ ...subEventForm, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="se-venue">Venue</Label>
                <Input
                  id="se-venue"
                  placeholder="Garden Lawn, Taj Palace"
                  value={subEventForm.venue}
                  onChange={(e) => setSubEventForm({ ...subEventForm, venue: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="se-setup">Setup date</Label>
                  <Input
                    id="se-setup"
                    type="date"
                    value={subEventForm.setupDate}
                    onChange={(e) => setSubEventForm({ ...subEventForm, setupDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="se-teardown">Tear-down date</Label>
                  <Input
                    id="se-teardown"
                    type="date"
                    min={subEventForm.setupDate || undefined}
                    value={subEventForm.teardownDate}
                    onChange={(e) => setSubEventForm({ ...subEventForm, teardownDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveSubEvent} disabled={!subEventForm.name.trim()}>
                {editingSubEventId ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {activeSubEvent && (
        <div className="flex flex-col gap-3 pt-4 md:flex-row md:items-end md:justify-between">
          <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-6">
            <DetailCell label="Date" value={formatEventDate(activeSubEvent.eventDate)} />
            <DetailCell label="Time" value={activeSubEvent.startTime ? `${activeSubEvent.startTime}${activeSubEvent.endTime ? `–${activeSubEvent.endTime}` : ""}` : undefined} />
            <DetailCell label="Venue" value={activeSubEvent.venue} />
            <DetailCell label="Setup" value={formatEventDate(activeSubEvent.setupDate)} />
            <DetailCell label="Tear-down" value={formatEventDate(activeSubEvent.teardownDate)} />
            <DetailCell label="Guests" value={activeSubEvent.guestCount} />
          </div>
          <div className="flex shrink-0 items-center gap-4 text-xs">
            <button className="text-muted-foreground hover:text-primary" onClick={() => openEditSubEvent(activeSubEvent)}>
              Edit details
            </button>
            <button
              className="text-muted-foreground hover:text-destructive"
              onClick={() => {
                removeSubEvent(planId, activeSubEvent.id);
                setActiveTab(null);
              }}
            >
              Remove this sub-event
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-8 pt-6 md:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-6">
          {/* Starter suggestions */}
          {availableSuggestions.length > 0 && setupComplete ? (
            // Every setup area filled — swap the checklist for a next-step banner.
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
              <span className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="size-5 text-primary" /> Setup complete for {activeLabel} — review quantities below, then get a quote.
              </span>
              <span className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-primary text-primary" nativeButton={false} render={<Link href={`/plans/${planId}/summary`}>View summary</Link>} />
                <Button size="sm" nativeButton={false} render={<Link href={`/plans/${planId}/submit`}>Submit for Quotation</Link>} />
              </span>
            </section>
          ) : availableSuggestions.length > 0 && (
            <section className="rounded-xl border border-dashed border-primary bg-card p-5">
              <button
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={() => setSetupOpen((o) => ({ ...o, [suggestionScope]: !setupExpanded }))}
                aria-expanded={setupExpanded}
              >
                <h2 className="font-serif text-xl text-foreground">Complete your setup</h2>
                <span className="flex items-center gap-3 text-xs text-muted-foreground">
                  {setupAddedCount} of {availableSuggestions.length} added
                  <ChevronDown className={cn("size-4 transition-transform", setupExpanded && "rotate-180")} />
                </span>
              </button>
              {setupExpanded && (
                <>
                  <p className="mt-1 text-xs text-muted-foreground">Adding to {activeLabel}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                    {availableSuggestions.map((s) => {
                      const added = setupAddedKeys.includes(s.key);
                      return (
                        <div
                          key={s.key}
                          className={cn("relative flex flex-col gap-3 rounded-lg border bg-background p-3", added ? "border-primary/60" : "border-border")}
                        >
                          {!added && (
                            <button className="absolute top-2 right-2 text-muted-foreground" onClick={() => dismissSuggestion(s.key)} aria-label={`Skip ${s.label}`}>
                              <X className="size-3" />
                            </button>
                          )}
                          {added ? <CheckCircle2 className="size-4 text-primary" /> : <Sparkles className="size-4 text-primary" />}
                          <span className="pr-2 text-sm text-foreground">{s.label}</span>
                          <button
                            className={cn("w-fit rounded-md px-2 py-1 text-xs", added ? "text-muted-foreground hover:text-primary" : "border border-primary text-primary")}
                            onClick={() => openPicker(s)}
                          >
                            {added ? "Added · add more" : "Add"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>
          )}

          {/* Line items */}
          <section className="overflow-hidden rounded-xl bg-card">
            <div className="hidden grid-cols-[2fr_1.4fr_1.4fr_120px] gap-4 border-b border-border px-5 py-3 text-xs tracking-wider text-muted-foreground uppercase md:grid">
              <span>Product</span>
              <span>Quantity/Dimensions</span>
              <span>Line Price</span>
              <span />
            </div>
            {activeItems.map((item) => {
              const product = productById.get(item.productId);
              if (!product) return null;
              const sharedWith = sharedWithLabel(item);
              return (
                <div key={item.id} className="border-b border-border p-4 last:border-b-0 md:grid md:grid-cols-[2fr_1.4fr_1.4fr_120px] md:items-center md:gap-4 md:px-5 md:py-4">
                  <span className="flex items-center gap-3">
                    <ProductThumb imageUrl={product.imageUrl} alt={product.name} className="size-10 shrink-0" />
                    <span className="flex flex-col gap-1">
                      <span className="text-sm text-foreground">{product.name}</span>
                      {sharedWith && (
                        <span className="w-fit rounded-full border border-primary/40 px-2 py-0.5 text-[10px] text-primary">{sharedWith}</span>
                      )}
                    </span>
                  </span>
                  <span className="mt-2 flex items-center gap-2 text-sm text-muted-foreground md:mt-0">
                    <span className="flex items-center rounded-lg border border-border">
                      <button
                        className="px-2 py-1 hover:text-primary disabled:opacity-40"
                        aria-label="Decrease quantity"
                        disabled={lineQty(item) <= 1}
                        onClick={() => setPlanItemQty(planId, item.id, lineQty(item) - 1)}
                      >
                        <Minus className="size-3" />
                      </button>
                      <input
                        id={`qty-${item.id}`}
                        type="number"
                        min={1}
                        className="w-12 bg-transparent text-center text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        value={lineQty(item)}
                        onChange={(e) => setPlanItemQty(planId, item.id, Number(e.target.value))}
                      />
                      <button
                        className="px-2 py-1 hover:text-primary"
                        aria-label="Increase quantity"
                        onClick={() => setPlanItemQty(planId, item.id, lineQty(item) + 1)}
                      >
                        <Plus className="size-3" />
                      </button>
                    </span>
                    {item.dimensions && (product.rateType === "SqFt" ? "sqft" : "ft")}
                  </span>
                  <span className="flex flex-col">
                    <span className="font-serif text-base text-primary">{formatRupees(linePrice(item))}</span>
                    <span className="text-xs text-muted-foreground">{unitRateLabel(product)}</span>
                  </span>
                  <div className="mt-2 flex items-center justify-end gap-3 md:mt-0">
                    {renderMoveMenu(item)}
                    {/* ponytail: quantity is edited inline, so edit just jumps to that field */}
                    <button
                      className="text-muted-foreground hover:text-primary"
                      aria-label="Edit quantity"
                      onClick={() => (document.getElementById(`qty-${item.id}`) as HTMLInputElement | null)?.select()}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button className="text-muted-foreground hover:text-destructive" onClick={() => removePlanItem(planId, item.id)}>
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {activeItems.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No items tagged to {activeLabel} yet.</p>}
          </section>


          <div className="flex justify-end border-t border-border pt-4">
            <span className="font-serif text-xl text-primary">{activeLabel} Subtotal: {formatRupees(subEventTotal(activeTab))}</span>
          </div>

          <Button variant="outline" className="w-fit border-primary text-primary" nativeButton={false} render={<Link href="/catalog">Browse catalog to add items</Link>} />
        </div>

        {/* Plan Total sidebar, with Shared Products underneath */}
        <div className="flex h-fit flex-col gap-6">
        <aside className="h-fit rounded-xl bg-card p-6">
          <h2 className="font-serif text-2xl text-foreground">Plan Total</h2>
          <div className="mt-6 flex flex-col gap-4 text-sm">
            {plan.subEvents.map((se) => (
              <div key={se.id} className="flex justify-between">
                <span className="text-muted-foreground">{se.name}</span>
                <span>{formatRupees(subEventTotal(se.id))}</span>
              </div>
            ))}
            <div className="flex justify-between">
              <span className="text-muted-foreground">General</span>
              <span>{formatRupees(subEventTotal(null))}</span>
            </div>
          </div>
          <div className="my-6 border-t border-border" />
          <div className="flex items-center justify-between">
            <span className="text-base text-foreground">Total</span>
            <span className="font-serif text-2xl text-primary">{formatRupees(planTotal)}</span>
          </div>
          <Button
            variant="outline"
            className="mt-6 w-full gap-2 rounded-lg border-primary text-primary"
            nativeButton={false}
            render={
              <Link href={`/plans/${planId}/summary`}>
                <ListChecks className="size-4" /> View Plan Summary
              </Link>
            }
          />
        </aside>

          {renderSharedProducts()}
        </div>
      </div>
        </>
      )}

      {/* Product picker — opened by a starter suggestion, slides in from the right. */}
      <Sheet open={pickerFor !== null} onOpenChange={(open) => !open && setPickerFor(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
          <SheetHeader className="gap-1">
            <SheetTitle>Choose a {pickerFor?.label}</SheetTitle>
            <p className="text-sm text-muted-foreground">Adding to {activeLabel}</p>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4 pb-3">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products"
                className="pl-9"
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {pickerShowAll ? "All products" : pickerFor?.categories.join(" · ")}
              </span>
              <span className="flex items-center gap-3">
                {pickerProducts.length > 0 && (
                  <button className="text-primary hover:underline" onClick={toggleSelectAll}>
                    {allPickerSelected ? "Clear all" : "Select all"}
                  </button>
                )}
                <button className="text-primary hover:underline" onClick={() => setPickerShowAll((v) => !v)}>
                  {pickerShowAll ? "Suggested only" : "Show all products"}
                </button>
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto border-t border-border">
            {pickerProducts.map((prod) => {
              const qty = pickerSelection[prod.id];
              return (
                <div
                  key={prod.id}
                  className={cn("flex w-full items-center gap-3 border-b border-border p-4 transition-colors", qty ? "bg-primary/5" : "hover:bg-secondary")}
                >
                  <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => togglePickerProduct(prod.id)} aria-pressed={!!qty}>
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded border",
                        qty ? "border-primary bg-primary text-primary-foreground" : "border-border",
                      )}
                    >
                      {qty && <Check className="size-3" />}
                    </span>
                    <ProductThumb imageUrl={prod.imageUrl} alt={prod.name} className="size-14 shrink-0" />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm text-foreground">{prod.name}</span>
                      <span className="text-xs text-muted-foreground">{prod.category}</span>
                      <span className="text-xs text-primary">{unitRateLabel(prod)}</span>
                    </span>
                  </button>
                  {qty && (
                    <span className="flex shrink-0 items-center rounded-lg border border-border text-sm">
                      <button
                        className="px-2 py-1 text-muted-foreground hover:text-primary disabled:opacity-40"
                        aria-label="Decrease quantity"
                        disabled={qty <= 1}
                        onClick={() => setPickerSelection((s) => ({ ...s, [prod.id]: qty - 1 }))}
                      >
                        <Minus className="size-3" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        className="w-10 bg-transparent text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        value={qty}
                        onChange={(e) => setPickerSelection((s) => ({ ...s, [prod.id]: Math.max(1, Math.floor(Number(e.target.value)) || 1) }))}
                      />
                      <button
                        className="px-2 py-1 text-muted-foreground hover:text-primary"
                        aria-label="Increase quantity"
                        onClick={() => setPickerSelection((s) => ({ ...s, [prod.id]: qty + 1 }))}
                      >
                        <Plus className="size-3" />
                      </button>
                    </span>
                  )}
                </div>
              );
            })}
            {pickerProducts.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">No products match. Try &quot;Show all products&quot;.</p>
            )}
          </div>
          <div className="border-t border-border p-4">
            <Button className="w-full" disabled={selectedIds.length === 0} onClick={addSelectedFromPicker}>
              {selectedIds.length === 0 ? "Select products to add" : `Add ${selectedIds.length} selected`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sticky footer actions */}
      <footer className="fixed inset-x-0 bottom-0 z-30 flex justify-end gap-4 border-t border-border bg-background px-4 py-4 md:px-8">
        {canSubmit ? (
          plan.items.length === 0 ? (
            <>
              <Button variant="outline" className="rounded-lg border-primary text-primary" disabled>
                Submit for Quotation
              </Button>
              <Button className="rounded-lg bg-primary text-primary-foreground" disabled>
                Direct Order (Pay Now)
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="rounded-lg border-primary text-primary" nativeButton={false} render={<Link href={`/plans/${planId}/submit`}>Submit for Quotation</Link>} />
              <Button className="rounded-lg bg-primary text-primary-foreground" nativeButton={false} render={<Link href={`/plans/${planId}/direct-order`}>Direct Order (Pay Now)</Link>} />
            </>
          )
        ) : (
          <span className="text-sm text-muted-foreground">View-only access — ask the plan owner to submit or order.</span>
        )}
      </footer>
    </div>
  );
}
