"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  GanttChartSquare,
  History as HistoryIcon,
  LayoutList,
  ListChecks,
  ListTodo,
  MapPin,
  MoreHorizontal,
  MoveRight,
  Package,
  PackageOpen,
  Split,
  Pencil,
  Plus,
  Repeat,
  Search,
  Send,
  Share2,
  Sparkles,
  Trash2,
  Truck,
  UserPlus,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProductThumb } from "@/components/product-thumb";
import { DateWheelPicker } from "@/components/date-wheel-picker";
import { NumberStepper } from "@/components/number-stepper";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useRequireAccount } from "@/features/auth";
import { canSubmitPlan, planGroupLabel, useMockStore } from "@/mock-data/store";
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

// "Add items" outside the setup suggestions opens the same picker on the full catalog.
const BROWSE_PICKER: (typeof STARTER_SUGGESTIONS)[number] = { key: "browse", label: "product", categories: [] };

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
  const { getPlan, products, accounts, updatePlanDetails, renamePlanGroup, removeSubEvent, removePlanItem, movePlanItem, addPlanItem, setPlanItemQty, markSetupAdded, addSubEvent, updateSubEvent, setItemSharing, clearItemSharing } = useMockStore();
  const plan = getPlan(planId);

  // null = General, an id = that function, undefined = not chosen yet (auto-pick below).
  const [chosenTab, setActiveTab] = useState<string | null | undefined>(undefined);
  // Inline rename of the "Your event" group — null when not editing.
  const [baseNameDraft, setBaseNameDraft] = useState<string | null>(null);
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
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planForm, setPlanForm] = useState<{ name: string; venue: string; eventStartDate: string; eventEndDate: string; guestCount?: number }>({
    name: "",
    venue: "",
    eventStartDate: "",
    eventEndDate: "",
  });
  const [view, setView] = useState<"sub-events" | "dates" | "timeline" | "inventory" | "sharing">("sub-events");
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

  // Before anything is picked: open "Your event" if it has items (or there are
  // no functions), otherwise the first function. A removed function falls back the same way.
  const chosenStillExists = chosenTab === null || plan.subEvents.some((se) => se.id === chosenTab);
  const activeTab: string | null =
    chosenTab !== undefined && chosenStillExists ? chosenTab : plan.subEvents.length > 0 && !plan.items.some((it) => it.subEventId === null) ? plan.subEvents[0].id : null;
  const activeItems = plan.items.filter((it) => it.subEventId === activeTab);
  const activeSubEvent = activeTab ? plan.subEvents.find((se) => se.id === activeTab) : undefined;
  const baseName = planGroupLabel(plan);
  const activeLabel = activeSubEvent?.name ?? baseName;

  // Drives the "Shared with X" tag on line items and the Inventory view.
  const productUsage = getProductUsage(plan, products);

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

  // ⋯ on a line: move it to another function (so General items aren't
  // stranded) or remove it.
  function renderItemMenu(item: PlanItem) {
    const targets = [...plan!.subEvents.map((se) => ({ id: se.id as string | null, name: se.name })), { id: null as string | null, name: baseName }].filter(
      (t) => t.id !== item.subEventId,
    );
    const name = productById.get(item.productId)?.name ?? "item";
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={`More actions for ${name}`}>
              <MoreHorizontal className="size-4" />
            </button>
          }
        />
        <DropdownMenuContent align="end" className="w-52">
          {targets.length > 0 && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Move to</DropdownMenuLabel>
                {targets.map((t) => (
                  <DropdownMenuItem
                    key={t.id ?? "general"}
                    onClick={() => {
                      movePlanItem(planId, item.id, t.id);
                      toast.success(`Moved ${name} to ${t.name}`);
                    }}
                  >
                    <MoveRight className="size-4" /> {t.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              removePlanItem(planId, item.id);
              toast.success(`Removed ${name}`);
            }}
          >
            <Trash2 className="size-4" /> Remove
          </DropdownMenuItem>
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
    const dayLabel = (key: string) => (key === "general" ? baseName : key === "unscheduled" ? "Unscheduled" : formatEventDate(key));
    const daySubLabel = (key: string) => {
      if (key === "general") return "Not tied to a function";
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
                  active ? "glow border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40",
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
            ? renderDayCard(baseName, undefined, generalItems, subEventTotal(null))
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
  // Shared / Dedicated: products used by one function only on the left,
  // products used by 2+ functions (e.g. chairs at Haldi and Sangeet) on the
  // right, with the Reuse / Keep separate call and the reuse breakdown.
  function renderSharingView() {
    const decisions = plan!.itemSharing ?? {};
    const functionsOf = (u: (typeof productUsage)[number]) => [...new Set(u.occurrences.map((o) => o.subEventName))];
    const shared = productUsage.filter((u) => functionsOf(u).length >= 2);
    const dedicated = productUsage.filter((u) => functionsOf(u).length < 2);

    if (productUsage.length === 0) {
      return (
        <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Add items to your functions to see which ones are dedicated to a single function and which are shared across several.
        </p>
      );
    }

    const column = (title: string, hint: string, icon: LucideIcon, count: number, body: React.ReactNode) => {
      const Icon = icon;
      return (
        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="text-[11px] text-muted-foreground">{hint}</p>
              </div>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">{count}</span>
          </header>
          <ul className="flex flex-col divide-y divide-border">{body}</ul>
        </section>
      );
    };

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {column(
          "Dedicated",
          "Used in one function only",
          Package,
          dedicated.length,
          dedicated.length === 0 ? (
            <li className="p-6 text-center text-xs text-muted-foreground">Every product is used in more than one function.</li>
          ) : (
            dedicated.map((u) => {
              const qty = u.occurrences.reduce((s, o) => s + o.quantity, 0);
              return (
                <li key={u.productId} className="flex items-center gap-3 px-4 py-3">
                  <ProductThumb imageUrl={u.product.imageUrl} alt={u.product.name} className="size-10 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{u.product.name}</p>
                    <button
                      className="mt-0.5 w-fit rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setView("sub-events");
                        setActiveTab(u.occurrences[0].subEventId);
                      }}
                    >
                      {u.occurrences[0].subEventName}
                    </button>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums">× {qty}</span>
                </li>
              );
            })
          ),
        )}

        {column(
          "Shared",
          "Used across two or more functions",
          Repeat,
          shared.length,
          shared.length === 0 ? (
            <li className="p-6 text-center text-xs text-muted-foreground">No product is used in more than one function yet — add the same item (e.g. chairs) to Haldi and Sangeet to share it.</li>
          ) : (
            shared.map((u) => {
              const decision = decisions[u.productId];
              const isReused = decision === "Shared";
              const { steps, totalReused } = reuseBreakdown(u);
              const byName = new Map(steps.map((s) => [s.occurrence.itemId, s]));
              return (
                <li key={u.productId} className="flex flex-col gap-2.5 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ProductThumb imageUrl={u.product.imageUrl} alt={u.product.name} className="size-10 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{u.product.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Need <span className="text-foreground">{requiredQuantity(u, decision)}</span> units
                        {isReused && totalReused > 0 && <span className="text-primary"> · {totalReused} reused, saves {formatRupees(totalReused * u.product.basePrice)}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {u.occurrences.map((o) => {
                      const step = byName.get(o.itemId);
                      return (
                        <span key={o.itemId} className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px]">
                          <span className="text-foreground">{o.subEventName}</span>
                          <span className="text-muted-foreground">× {o.quantity}</span>
                          {isReused && step && step.reused > 0 && <span className="text-primary">({step.reused} reused)</span>}
                        </span>
                      );
                    })}
                  </div>
                  {needsSharingDecision(u) && (
                    <div className="flex items-center gap-1 rounded-full bg-muted p-0.5 text-[11px]">
                      {([
                        ["Shared", "Reuse same units"],
                        ["Dedicated", "Keep separate"],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => setItemSharing(planId, u.productId, value)}
                          className={cn("flex-1 rounded-full px-2 py-1 transition-all", decision === value ? "glow bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                  {!decision && needsSharingDecision(u) && <p className="text-[11px] text-muted-foreground">Not decided yet — quantities are added up until you choose.</p>}
                </li>
              );
            })
          ),
        )}
      </div>
    );
  }

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

  function openEditPlan() {
    setPlanForm({
      name: plan!.name,
      venue: plan!.venue ?? "",
      eventStartDate: plan!.eventStartDate ?? "",
      eventEndDate: plan!.eventEndDate ?? "",
      guestCount: plan!.guestCount,
    });
    setPlanDialogOpen(true);
  }

  function handleSavePlan() {
    if (!planForm.name.trim()) return;
    updatePlanDetails(planId, planForm.name.trim(), {
      venue: planForm.venue.trim() || undefined,
      eventStartDate: planForm.eventStartDate || undefined,
      eventEndDate: planForm.eventEndDate || undefined,
      guestCount: planForm.guestCount,
    });
    setPlanDialogOpen(false);
    toast.success("Event details updated");
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

  // ---- Page-level facts that drive the progress steps, to-dos and cards ----
  const functionsCount = plan.subEvents.length;
  const itemsCount = plan.items.length;
  const pendingSharing = productUsage.filter((u) => needsSharingDecision(u) && !plan!.itemSharing?.[u.productId]);
  const emptySubEvents = plan.subEvents.filter((se) => !plan!.items.some((it) => it.subEventId === se.id));
  const steps = [
    { label: "Event details", hint: "Dates, venue & guests", done: Boolean(plan.venue && startDate && plan.guestCount), onClick: openEditPlan },
    { label: "Add functions", hint: "Haldi, Sangeet, Wedding…", done: functionsCount > 0, onClick: openAddSubEvent },
    { label: "Pick items", hint: "Décor, furniture, lighting", done: itemsCount > 0 && emptySubEvents.length === 0, onClick: () => setView("sub-events") },
    { label: "Get a quote", hint: "Submit or order directly", done: plan.status !== "Draft", onClick: undefined },
  ];
  const currentStep = steps.findIndex((s) => !s.done);
  const todos = [
    ...emptySubEvents.map((se) => ({
      key: `empty-${se.id}`,
      text: `${se.name} has no items yet`,
      action: "Add items",
      onClick: () => {
        setView("sub-events");
        setActiveTab(se.id);
      },
    })),
    ...pendingSharing.map((u) => ({
      key: `share-${u.productId}`,
      text: `Decide if ${u.product.name} is reused between ${[...new Set(u.subEventOccurrences.map((o) => o.subEventName))].join(" & ")}`,
      action: "Decide",
      onClick: () => setView("inventory"),
    })),
  ];
  // "Your event" (renamable) always leads — it's where a newcomer starts adding.
  const functionCards = [
    { id: null as string | null, name: baseName, sub: "Items for the whole event" },
    ...plan.subEvents.map((se) => ({ id: se.id as string | null, name: se.name, sub: se.eventDate ? formatEventDate(se.eventDate) : "No date yet" })),
  ];

  function saveBaseName() {
    renamePlanGroup(planId, baseNameDraft ?? "");
    setBaseNameDraft(null);
  }

  function confirmRemoveSubEvent(se: SubEvent) {
    if (!window.confirm(`Remove ${se.name}? Its items will move to ${baseName}.`)) return;
    removeSubEvent(planId, se.id);
    setActiveTab(null);
    toast.success(`${se.name} removed`);
  }

  function openBrowsePicker() {
    openPicker(BROWSE_PICKER);
    setPickerShowAll(true);
  }

  const submitActions = canSubmit ? (
    <>
      <Button className="w-full gap-2 rounded-lg" disabled={itemsCount === 0} nativeButton={itemsCount === 0} render={itemsCount === 0 ? undefined : <Link href={`/plans/${planId}/submit`} />}>
        <Send className="size-4" /> Submit for Quotation
      </Button>
      <Button
        variant="outline"
        className="w-full gap-2 rounded-lg border-primary text-primary"
        disabled={itemsCount === 0}
        nativeButton={itemsCount === 0}
        render={itemsCount === 0 ? undefined : <Link href={`/plans/${planId}/direct-order`} />}
      >
        <Zap className="size-4" /> Direct Order (Pay Now)
      </Button>
    </>
  ) : (
    <p className="text-sm text-muted-foreground">View-only access — ask the plan owner to submit or order.</p>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-28 md:px-8 md:pb-12">
      <Link href="/plans" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft className="size-4" /> All plans
      </Link>

      {/* ================= HERO ================= */}
      <section className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between md:p-7">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-3xl text-foreground md:text-4xl">{plan.name}</h1>
              <span className={cn("rounded-full px-3 py-1 text-xs", STATUS_STYLE[plan.status])}>{plan.status}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <MetaChip icon={CalendarDays} value={startDate ? planDateLabel : undefined} empty="Add dates" onClick={openEditPlan} />
              <MetaChip icon={MapPin} value={plan.venue} empty="Add venue" onClick={openEditPlan} />
              <MetaChip icon={Users} value={plan.guestCount ? `${plan.guestCount} guests` : undefined} empty="Add guest count" onClick={openEditPlan} />
              <MetaChip icon={LayoutList} value={`${functionsCount} function${functionsCount === 1 ? "" : "s"} · ${itemsCount} item${itemsCount === 1 ? "" : "s"}`} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-1 flex -space-x-2">
              {collaborators.map((c, i) => (
                <span
                  key={c!.id}
                  title={c!.name}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 border-card text-xs font-medium",
                    i === 0 ? "bg-primary text-primary-foreground" : i === 1 ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {initials(c!.name)}
                </span>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg" nativeButton={false} render={<Link href={`/plans/${planId}/share`}><UserPlus className="size-4" /> Invite</Link>} />
            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg" onClick={openEditPlan}>
              <Pencil className="size-4" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg" nativeButton={false} render={<Link href={`/plans/${planId}/share`}><Share2 className="size-4" /> Share</Link>} />
            <Button variant="ghost" size="sm" className="gap-1.5 rounded-lg text-muted-foreground" onClick={() => setAuditLogOpen(true)}>
              <HistoryIcon className="size-4" /> Activity
            </Button>
          </div>
        </div>

        {/* Progress steps — tells a first-time planner what to do next */}
        <ol className="flex items-start border-t border-border px-3 pt-4 pb-3 md:px-6">
          {steps.map((s, i) => {
            const isCurrent = i === currentStep;
            const Tag = s.onClick ? "button" : "div";
            return (
              <li key={s.label} className="relative flex flex-1 flex-col items-center">
                {/* connector from the previous stage */}
                {i > 0 && <span className={cn("absolute top-2.75 right-1/2 h-0.5 w-full", steps[i - 1].done ? "bg-primary" : "bg-border")} />}
                <Tag {...(s.onClick ? { onClick: s.onClick, type: "button" as const } : {})} className={cn("group flex flex-col items-center gap-1.5 text-center", s.onClick && "cursor-pointer")}>
                  <span
                    className={cn(
                      "relative z-10 flex size-6 items-center justify-center rounded-full text-[11px] font-semibold ring-4 ring-card transition-colors",
                      s.done ? "bg-primary text-primary-foreground" : isCurrent ? "border-2 border-primary bg-card text-primary" : "border border-border bg-card text-muted-foreground",
                    )}
                  >
                    {s.done ? <Check className="size-3" /> : i + 1}
                  </span>
                  <span className={cn("text-xs leading-tight", s.done || isCurrent ? "text-foreground" : "text-muted-foreground", s.onClick && "group-hover:text-primary")}>{s.label}</span>
                  <span className={cn("hidden text-[11px] leading-tight md:block", isCurrent ? "text-primary" : "text-muted-foreground/70")}>{isCurrent ? "Up next" : s.done ? "Done" : s.hint}</span>
                </Tag>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ================= TO-DO ================= */}
      {todos.length > 0 && (
        <section className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <ListTodo className="size-4 text-primary" /> {todos.length} thing{todos.length === 1 ? "" : "s"} left to plan
          </p>
          <ul className="flex flex-col divide-y divide-primary/15">
            {todos.map((t) => (
              <li key={t.key} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-muted-foreground">{t.text}</span>
                <button className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline" onClick={t.onClick}>
                  {t.action} <ArrowRight className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* ================= VIEW SWITCH ================= */}
          <div className="-mx-1 overflow-x-auto px-1 py-1">
            <div className="inline-flex gap-1 rounded-full border border-border bg-card p-1">
              {([
                { key: "sub-events", label: "Functions", icon: LayoutList },
                { key: "dates", label: "By date", icon: CalendarRange },
                { key: "timeline", label: "Timeline", icon: GanttChartSquare },
                { key: "inventory", label: "Inventory", icon: Boxes },
                { key: "sharing", label: "Shared / Dedicated", icon: Split },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={cn(
                    "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium whitespace-nowrap transition-all duration-200",
                    view === key ? "glow bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          {view === "dates" ? (
            renderDateView()
          ) : view === "timeline" ? (
            renderTimelineView()
          ) : view === "inventory" ? (
            renderInventoryView()
          ) : view === "sharing" ? (
            renderSharingView()
          ) : (
            <>
              {/* ================= FUNCTION CARDS ================= */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {functionCards.map((f) => {
                  const active = activeTab === f.id;
                  const count = plan.items.filter((it) => it.subEventId === f.id).length;
                  return (
                    <button
                      key={f.id ?? "general"}
                      onClick={() => setActiveTab(f.id)}
                      title={f.sub}
                      className={cn(
                        "flex h-9 shrink-0 items-center gap-2 rounded-full border pr-1.5 pl-3.5 text-sm whitespace-nowrap transition-colors",
                        active ? "glow border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground/80 hover:border-primary/50 hover:text-foreground",
                      )}
                    >
                      {f.name}
                      <span className={cn("min-w-6 rounded-full px-1.5 py-0.5 text-[11px] tabular-nums", active ? "bg-primary-foreground/20" : count ? "bg-muted text-foreground" : "bg-muted text-muted-foreground")}>{count}</span>
                    </button>
                  );
                })}
                <button
                  onClick={openAddSubEvent}
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-border px-3.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Plus className="size-4" /> Add function
                </button>
              </div>

              {/* ================= SELECTED FUNCTION ================= */}
              <section className="overflow-hidden rounded-2xl border border-border bg-card">
                <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                  <div className="flex min-w-0 flex-col gap-1">
                    {activeSubEvent ? (
                      <>
                        <h2 className="truncate font-serif text-xl text-foreground">{activeSubEvent.name}</h2>
                        {(() => {
                          const se = activeSubEvent;
                          const facts = [
                            se.eventDate && { icon: CalendarDays, text: formatEventDate(se.eventDate) },
                            se.startTime && { icon: Clock, text: `${se.startTime}${se.endTime ? `–${se.endTime}` : ""}` },
                            se.venue && { icon: MapPin, text: se.venue },
                            se.guestCount && { icon: Users, text: `${se.guestCount} guests` },
                            (se.setupDate || se.teardownDate) && { icon: Truck, text: `Setup ${formatEventDate(se.setupDate) || "—"} → ${formatEventDate(se.teardownDate) || "—"}` },
                          ].filter(Boolean) as { icon: LucideIcon; text: string }[];
                          const missing = [!se.eventDate && "date", !se.startTime && "time", !se.venue && "venue", !se.guestCount && "guests"].filter(Boolean) as string[];
                          return (
                            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              {facts.map(({ icon: Icon, text }) => (
                                <span key={text} className="flex items-center gap-1">
                                  <Icon className="size-3.5 text-primary/80" /> {text}
                                </span>
                              ))}
                              {missing.length > 0 && (
                                <button className="flex items-center gap-1 text-primary hover:underline" onClick={() => openEditSubEvent(se)}>
                                  <Plus className="size-3" /> Add {missing.join(", ")}
                                </button>
                              )}
                            </p>
                          );
                        })()}
                      </>
                    ) : baseNameDraft !== null ? (
                      <form
                        className="flex items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          saveBaseName();
                        }}
                      >
                        <Input autoFocus value={baseNameDraft} onChange={(e) => setBaseNameDraft(e.target.value)} placeholder="e.g. Priya & Arjun's Wedding" className="h-9 max-w-xs font-serif text-lg" onKeyDown={(e) => e.key === "Escape" && setBaseNameDraft(null)} />
                        <Button type="submit" size="sm" className="rounded-lg">
                          Save
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="rounded-lg" onClick={() => setBaseNameDraft(null)}>
                          Cancel
                        </Button>
                      </form>
                    ) : (
                      <>
                        <button className="group flex w-fit items-center gap-2 text-left" onClick={() => setBaseNameDraft(plan.generalLabel ?? "")} title="Rename">
                          <h2 className="truncate font-serif text-xl text-foreground">{baseName}</h2>
                          <Pencil className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
                        </button>
                        <p className="text-xs text-muted-foreground">
                          {plan.generalLabel ? "Items for the whole event." : "Click the name to rename it — then add items, or split them into functions like Haldi or Sangeet."}
                        </p>
                      </>
                    )}
                  </div>
                  {activeSubEvent && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-primary" onClick={() => openEditSubEvent(activeSubEvent)} title="Edit details" aria-label="Edit details">
                        <Pencil className="size-4" />
                      </button>
                      <button className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" onClick={() => confirmRemoveSubEvent(activeSubEvent)} title="Remove function" aria-label="Remove function">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  )}
                </header>

                <div className="flex flex-col gap-5 p-5">
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

                  {/* Items */}
                  {activeItems.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
                      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <PackageOpen className="size-6" />
                      </span>
                      <div>
                        <p className="font-serif text-lg text-foreground">No items in {activeLabel} yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">Start with the setup suggestions above, or pick anything from the catalog.</p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Button className="gap-1.5 rounded-lg" onClick={openBrowsePicker}>
                          <Plus className="size-4" /> Add items
                        </Button>
                        <Button variant="outline" className="rounded-lg" nativeButton={false} render={<Link href="/catalog">Browse catalog</Link>} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="hidden grid-cols-[minmax(0,1fr)_130px_120px_36px] gap-4 px-2 pb-2 text-[11px] tracking-wider text-muted-foreground uppercase md:grid">
                        <span>Item</span>
                        <span>Qty</span>
                        <span className="text-right">Price</span>
                        <span />
                      </div>
                      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
                        {activeItems.map((item) => {
                          const product = productById.get(item.productId);
                          if (!product) return null;
                          const sharedWith = sharedWithLabel(item);
                          return (
                            <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 p-3 md:grid-cols-[minmax(0,1fr)_130px_120px_36px] md:gap-4">
                              <span className="flex min-w-0 items-center gap-3">
                                <ProductThumb imageUrl={product.imageUrl} alt={product.name} className="size-12 shrink-0" />
                                <span className="flex min-w-0 flex-col gap-0.5">
                                  <span className="truncate text-sm font-medium text-foreground">{product.name}</span>
                                  <span className="truncate text-xs text-muted-foreground">
                                    {product.subcategory ?? product.category} · {unitRateLabel(product)}
                                    {item.fabric && ` · ${item.fabric} upholstery`}
                                  </span>
                                  {sharedWith && (
                                    <span className="flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                                      <Repeat className="size-3" /> {sharedWith}
                                    </span>
                                  )}
                                </span>
                              </span>
                              <span className="order-3 flex items-center gap-2 text-xs text-muted-foreground md:order-none">
                                <NumberStepper id={`qty-${item.id}`} size="sm" aria-label={`${product.name} quantity`} value={lineQty(item)} onChange={(v) => setPlanItemQty(planId, item.id, v)} />
                                {item.dimensions && (product.rateType === "SqFt" ? "sqft" : "ft")}
                              </span>
                              <span className="order-4 text-right font-serif text-lg text-primary md:order-none">{formatRupees(linePrice(item))}</span>
                              <span className="justify-self-end">{renderItemMenu(item)}</span>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-1.5 rounded-lg border-primary text-primary" onClick={openBrowsePicker}>
                            <Plus className="size-4" /> Add items
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground" nativeButton={false} render={<Link href="/catalog">Browse catalog</Link>} />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {activeLabel} subtotal <span className="ml-2 font-serif text-xl text-primary">{formatRupees(subEventTotal(activeTab))}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        {/* ================= SIDEBAR ================= */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-20">
          <section className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs tracking-wider text-muted-foreground uppercase">Estimated total</p>
            <p className="mt-1 font-serif text-4xl text-primary">{formatRupees(planTotal)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {itemsCount} item{itemsCount === 1 ? "" : "s"} · final price confirmed in your quotation
            </p>

            {planTotal > 0 && (
              <ul className="mt-5 flex flex-col gap-3">
                {[...plan.subEvents.map((se) => ({ id: se.id as string | null, name: se.name })), { id: null as string | null, name: baseName }]
                  .map((f) => ({ ...f, total: subEventTotal(f.id) }))
                  .filter((f) => f.total > 0 || f.id !== null)
                  .map((f) => (
                    <li key={f.id ?? "general"}>
                      <button className="flex w-full flex-col gap-1.5 text-left" onClick={() => { setView("sub-events"); setActiveTab(f.id); }}>
                        <span className="flex items-center justify-between text-sm">
                          <span className={cn(activeTab === f.id && view === "sub-events" ? "text-primary" : "text-muted-foreground")}>{f.name}</span>
                          <span className="text-foreground">{formatRupees(f.total)}</span>
                        </span>
                        <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <span className="block h-full rounded-full bg-primary/70" style={{ width: `${planTotal ? (f.total / planTotal) * 100 : 0}%` }} />
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            )}

            <div className="mt-5 flex flex-col gap-2 border-t border-border pt-5">
              {submitActions}
              {itemsCount === 0 && canSubmit && <p className="text-center text-xs text-muted-foreground">Add at least one item to request a quote.</p>}
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" nativeButton={false} render={<Link href={`/plans/${planId}/summary`}><ListChecks className="size-4" /> View plan summary</Link>} />
            </div>
          </section>

          {renderSharedProducts()}
        </aside>
      </div>

                  <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-edit-name">Event name *</Label>
                    <Input id="plan-edit-name" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-edit-venue">Venue</Label>
                    <Input id="plan-edit-venue" placeholder="Taj Palace, Delhi" value={planForm.venue} onChange={(e) => setPlanForm({ ...planForm, venue: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="plan-edit-start">Start date</Label>
                      <DateWheelPicker
                        id="plan-edit-start"
                        value={planForm.eventStartDate}
                        onChange={(v) =>
                          setPlanForm({ ...planForm, eventStartDate: v, eventEndDate: planForm.eventEndDate && v && planForm.eventEndDate < v ? v : planForm.eventEndDate })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plan-edit-end">End date</Label>
                      <DateWheelPicker
                        id="plan-edit-end"
                        min={planForm.eventStartDate || undefined}
                        value={planForm.eventEndDate}
                        onChange={(v) => setPlanForm({ ...planForm, eventEndDate: v })}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="plan-edit-guests">Guest count</Label>
                    <NumberStepper
                      id="plan-edit-guests"
                      optional
                      placeholder="250"
                      value={planForm.guestCount}
                      onChange={(v) => setPlanForm({ ...planForm, guestCount: v })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSavePlan} disabled={!planForm.name.trim()}>
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

      <Dialog open={auditLogOpen} onOpenChange={setAuditLogOpen}>
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

      <Dialog open={subEventDialogOpen} onOpenChange={(open) => (open ? setSubEventDialogOpen(true) : closeSubEventDialog())}>
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
                  <DateWheelPicker id="se-date" value={subEventForm.eventDate} onChange={(v) => setSubEventForm({ ...subEventForm, eventDate: v })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="se-guests">Guest count</Label>
                  <NumberStepper
                    id="se-guests"
                    optional
                    placeholder="150"
                    value={subEventForm.guestCount === "" ? undefined : Number(subEventForm.guestCount)}
                    onChange={(v) => setSubEventForm({ ...subEventForm, guestCount: v === undefined ? "" : String(v) })}
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
                  <DateWheelPicker id="se-setup" value={subEventForm.setupDate} onChange={(v) => setSubEventForm({ ...subEventForm, setupDate: v })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="se-teardown">Tear-down date</Label>
                  <DateWheelPicker
                    id="se-teardown"
                    min={subEventForm.setupDate || undefined}
                    value={subEventForm.teardownDate}
                    onChange={(v) => setSubEventForm({ ...subEventForm, teardownDate: v })}
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

            {/* Product picker — opened by a starter suggestion, slides in from the right. */}
      <Sheet open={pickerFor !== null} onOpenChange={(open) => !open && setPickerFor(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
          <SheetHeader className="gap-1">
            <SheetTitle>{pickerFor?.key === BROWSE_PICKER.key ? "Add items" : `Choose a ${pickerFor?.label}`}</SheetTitle>
            <p className="text-sm text-muted-foreground">Adding to {activeLabel} · tick items and set quantities</p>
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
                {pickerFor?.key !== BROWSE_PICKER.key && (
                  <button className="text-primary hover:underline" onClick={() => setPickerShowAll((v) => !v)}>
                    {pickerShowAll ? "Suggested only" : "Show all products"}
                  </button>
                )}
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
                    <NumberStepper
                      size="sm"
                      className="shrink-0"
                      aria-label={`${prod.name} quantity`}
                      value={qty}
                      onChange={(v) => setPickerSelection((s) => ({ ...s, [prod.id]: v }))}
                    />
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

      {/* Mobile action bar — the sidebar's buttons are off-screen on phones */}
      <footer className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex min-w-0 flex-col">
          <span className="text-[11px] text-muted-foreground uppercase">Total</span>
          <span className="font-serif text-xl text-primary">{formatRupees(planTotal)}</span>
        </div>
        <div className="ml-auto flex gap-2">
          {canSubmit && itemsCount > 0 ? (
            <>
              <Button variant="outline" size="sm" className="rounded-lg border-primary text-primary" nativeButton={false} render={<Link href={`/plans/${planId}/direct-order`}>Order now</Link>} />
              <Button size="sm" className="rounded-lg" nativeButton={false} render={<Link href={`/plans/${planId}/submit`}>Get quote</Link>} />
            </>
          ) : (
            <Button size="sm" className="rounded-lg" onClick={openBrowsePicker}>
              <Plus className="size-4" /> Add items
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

function MetaChip({ icon: Icon, value, empty, onClick }: { icon: LucideIcon; value?: string; empty?: string; onClick?: () => void }) {
  const cls = cn(
    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
    value ? "border-border bg-background text-foreground" : "border-dashed border-border text-muted-foreground",
    onClick && "hover:border-primary/50 hover:text-primary",
  );
  const content = (
    <>
      <Icon className="size-3.5 text-primary" /> {value ?? empty}
    </>
  );
  return onClick ? (
    <button type="button" className={cls} onClick={onClick}>
      {content}
    </button>
  ) : (
    <span className={cls}>{content}</span>
  );
}
