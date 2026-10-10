"use client";

import { VenueSelect } from "@/features/venues";
import { use, useEffect, useMemo, useRef, useState } from "react";
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
  LayoutList,
  ListChecks,
  ListTodo,
  MapPin,
  MoreHorizontal,
  MoveRight,
  Heart,
  ImagePlus,
  Package,
  PackageOpen,
  Split,
  Pencil,
  Plus,
  Repeat,
  Send,
  Sparkles,
  Trash2,
  Truck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ProductThumb } from "@/components/product-thumb";
import { DateWheelPicker } from "@/components/date-wheel-picker";
import { NumberStepper } from "@/components/number-stepper";
import { RentalTerms } from "@/components/rental-terms";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ApiError } from "@/services/api-client";
import { useRequireAccount } from "@/features/auth";
import { ItemPicker, type PickedLine } from "@/features/plans/components/ItemPicker";
import { PLAN_STATUS_LABEL, functionComplete, planGroupLabel, quoteBlocker, serves, type BoardItem, type BoardProduct, type BoardSubEvent } from "@/features/plans/board";
import { usePlanActions, useBoard } from "@/features/plans/hooks";
import { NO_COVER_CHANGE, PlanCoverField, type CoverChange } from "@/features/plans/components/PlanCoverField";
import { getProductUsage, needsSharingDecision, requiredQuantity, reuseBreakdown } from "@/features/plans/inventory-sharing";
import { usePlanNudges } from "@/features/plans/nudges";
import type { PlanStatus } from "@/features/plans/types";
import { registerProducts } from "@/mock-data/product-registry";
import { PlanQuotationLink } from "@/features/quotations";
import { useMockStore } from "@/mock-data/store";
import { FUNCTION_PRESETS, STARTER_SUGGESTIONS, formatEventDate, formatEventDateRange, formatRupees, rateTypeLabel } from "@/mock-data/seed";

type PlanItem = BoardItem;
type Product = BoardProduct;
type SubEvent = BoardSubEvent;

// Flowstep screens 19 (desktop) / 20 (mobile), fileId 8bd03b8a-4561-4b58-bb2d-ca011d84d53e.
const STATUS_STYLE: Record<PlanStatus, string> = {
  DRAFT: "border border-muted-foreground text-muted-foreground",
  SUBMITTED_FOR_QUOTATION: "border border-primary text-primary",
  QUOTED: "border border-primary text-primary",
  ORDERED: "bg-primary text-primary-foreground",
};

const EMPTY_SUB_EVENT = { name: "", eventDate: "", venue: "", venueId: "", setupDate: "", teardownDate: "", guestCount: "", startTime: "", endTime: "" };

// One calendar day before/after an ISO yyyy-mm-dd date, for the setup/tear-down defaults below.
// Built on Date.UTC/getUTCDate so it's correct regardless of the browser's local timezone offset
// (plain `new Date(iso)` + toISOString() rolls the date back a day in any zone ahead of UTC).
function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

// "Add items" outside the setup suggestions opens the same picker on the full catalog.
const BROWSE_PICKER: (typeof STARTER_SUGGESTIONS)[number] = { key: "browse", label: "product", categories: [] };

const SCROLL_FADE = "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)";

// A horizontally-scrolling strip whose edges fade only once it actually overflows — applying the
// fade unconditionally clips the first/last few pixels of content (e.g. a date label's leading
// digit) even when everything already fits and there's nothing to scroll to.
function ScrollFade({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("overflow-x-auto", className)}
      style={overflowing ? { maskImage: SCROLL_FADE, WebkitMaskImage: SCROLL_FADE } : undefined}
    >
      {children}
    </div>
  );
}

const NO_PRODUCTS: BoardProduct[] = [];

// "₹450 per unit" / "₹25 per sqft" — the rate type reads off the price
// instead of sitting in a column of its own.
function unitRateLabel(product: Product) {
  return `${formatRupees(product.basePrice)} ${rateTypeLabel(product.rateType)}`;
}

export default function PlanDetailPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params);
  const account = useRequireAccount();
  const { wishlist, toggleWishlist } = useMockStore();
  // The plan lives on the backend: read through `useBoard`, changed through `actions` (each change
  // is saved, and the plan it answers with replaces what is on screen).
  const { board: plan, query } = useBoard(planId);
  const actions = usePlanActions(planId);
  const nudges = usePlanNudges(planId);
  const products = plan?.products ?? NO_PRODUCTS;

  // null = General, an id = that function, undefined = not chosen yet (auto-pick below).
  const [chosenTab, setActiveTab] = useState<string | null | undefined>(undefined);
  // The function form is turning the main function (the items on no function yet) into a real one.
  const [promotingGeneral, setPromotingGeneral] = useState(false);
  // Keyed by sub-event id ("general" for the untagged list) so each
  // sub-event gets its own set of starter suggestions to work through.
  // Manual expand/collapse of "Complete your setup", per sub-event; unset = auto.
  const [setupOpen, setSetupOpen] = useState<Record<string, boolean>>({});
  const [subEventDialogOpen, setSubEventDialogOpen] = useState(false);
  const [subEventForm, setSubEventForm] = useState(EMPTY_SUB_EVENT);
  const [customFunctionName, setCustomFunctionName] = useState(false);
  // null = the dialog is adding a new sub-event; an id = editing that one.
  const [editingSubEventId, setEditingSubEventId] = useState<string | null>(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planForm, setPlanForm] = useState<{ name: string; venue: string; venueId?: string; eventStartDate: string; eventEndDate: string; guestCount?: number }>({
    name: "",
    venue: "",
    eventStartDate: "",
    eventEndDate: "",
  });
  // What the customer did to the event picture in the open Edit dialog; applied when they press Save.
  const [coverChange, setCoverChange] = useState<CoverChange>(NO_COVER_CHANGE);
  const [view, setView] = useState<"sub-events" | "dates" | "timeline" | "inventory" | "sharing">("sub-events");
  const [activeDate, setActiveDate] = useState<string | null>(null);
  // Which starter suggestion opened the product picker — null = picker closed.
  const [pickerFor, setPickerFor] = useState<(typeof STARTER_SUGGESTIONS)[number] | null>(null);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  if (!account) return null;
  if (query.isPending) return <PlanSkeleton />;
  if (!plan) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div role={missing ? undefined : "alert"} className="mx-auto flex w-full max-w-md flex-col items-center gap-4 py-24 text-center page-x">
        <h1 className="font-serif text-2xl text-foreground">{missing ? "Plan not found" : "We couldn't load this plan"}</h1>
        <p className="text-sm text-muted-foreground">{missing ? "It may have been deleted, or the link is out of date." : "Check your connection and try again."}</p>
        <div className="flex gap-2">
          {!missing && (
            <Button variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
          )}
          <Button variant="outline" nativeButton={false} render={<Link href="/plans">All plans</Link>} />
        </div>
      </div>
    );
  }

  // A plan sent for a quotation is the vendor's to work from: it can be read, not changed.
  const canSubmit = plan.editable && plan.role === "OWNER";

  // The main function stands for the items on no function yet: shown while there is no function, or while
  // some items still have none. Otherwise the first function opens. A removed function falls back the same way.
  const generalVisible = plan.subEvents.length === 0 || plan.items.some((it) => it.subEventIds.length === 0);
  const chosenStillExists = (chosenTab === null && generalVisible) || plan.subEvents.some((se) => se.id === chosenTab);
  const activeTab: string | null = chosenTab !== undefined && chosenStillExists ? chosenTab : generalVisible ? null : plan.subEvents[0].id;
  const activeItems = plan.items.filter((it) => serves(it, activeTab));
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
    return plan!.items.filter((it) => serves(it, subEventId)).reduce((sum, it) => sum + linePrice(it), 0);
  }
  const planGross = plan.items.reduce((sum, it) => sum + linePrice(it), 0);
  // A bundle's percentage comes off what its items add up to now (the server prices the groups).
  const bundleSaving = plan.bundles.reduce((sum, b) => sum + b.discountAmount.amount, 0);
  const planTotal = planGross - bundleSaving;

  const startDate = plan.eventStartDate ?? plan.subEvents[0]?.eventDate;
  const planDateLabel = formatEventDateRange(startDate, plan.eventEndDate);

  const suggestionScope = activeTab ?? "general";
  const availableSuggestions = STARTER_SUGGESTIONS.filter((s) => !(nudges.dismissed[suggestionScope] ?? []).includes(s.key));
  const setupAddedKeys = nudges.added[suggestionScope] ?? [];
  const setupAddedCount = availableSuggestions.filter((s) => setupAddedKeys.includes(s.key)).length;
  const setupComplete = setupAddedCount === availableSuggestions.length;
  // Open by default only while this sub-event is still empty; once anything is
  // added it collapses, but the customer can still expand it.
  const setupExpanded = setupOpen[suggestionScope] ?? (activeItems.length === 0 && !setupComplete);

  function dismissSuggestion(key: string) {
    nudges.dismiss(suggestionScope, key);
  }

  // A suggestion opens the picker rather than adding a product outright — the
  // customer chooses which entry gate / stage / seating they actually want.
  function openPicker(suggestion: (typeof STARTER_SUGGESTIONS)[number]) {
    setPickerFor(suggestion);
  }

  // ⋯ on a line: move it to another function (so General items aren't
  // stranded) or remove it.
  function renderItemMenu(item: PlanItem) {
    const targets = [...plan!.subEvents.map((se) => ({ id: se.id as string | null, name: se.name })), { id: null as string | null, name: baseName }].filter(
      (t) => t.id !== item.subEventId,
    );
    const name = productById.get(item.productId)?.name ?? "item";
    // One line can serve several functions (a tent on Haldi and Sangeet is charged once, for the days it is needed).
    const alsoUse = plan!.subEvents.filter((se) => !item.subEventIds.includes(se.id));
    const stopUsing = item.subEventIds.length > 1 ? plan!.subEvents.filter((se) => item.subEventIds.includes(se.id)) : [];
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
          {(alsoUse.length > 0 || stopUsing.length > 0) && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Used in</DropdownMenuLabel>
                {alsoUse.map((se) => (
                  <DropdownMenuItem
                    key={`add-${se.id}`}
                    onClick={async () => {
                      if (await actions.setFunctions(item.id, [...item.subEventIds, se.id])) toast.success(`${name} also used in ${se.name}`);
                    }}
                  >
                    <Plus className="size-4" /> Also use in {se.name}
                  </DropdownMenuItem>
                ))}
                {stopUsing.map((se) => (
                  <DropdownMenuItem
                    key={`stop-${se.id}`}
                    onClick={async () => {
                      if (await actions.setFunctions(item.id, item.subEventIds.filter((id) => id !== se.id))) toast.success(`${name} no longer used in ${se.name}`);
                    }}
                  >
                    <X className="size-4" /> Stop using in {se.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          )}
          {targets.length > 0 && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Move to</DropdownMenuLabel>
                {targets.map((t) => (
                  <DropdownMenuItem
                    key={t.id ?? "general"}
                    onClick={async () => {
                      if (await actions.moveItem(item.id, t.id)) toast.success(`Moved ${name} to ${t.name}`);
                    }}
                  >
                    <MoveRight className="size-4" /> {t.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          )}
          {/* Move to Wishlist: take it off the plan but keep it saved, rather
              than making "changed my mind" mean losing the item entirely. */}
          <DropdownMenuItem
            onClick={async () => {
              // The wishlist is still a per-browser list (a later phase); remember the product so it can show there.
              const product = productById.get(item.productId);
              if (product) registerProducts([product], { detailed: false });
              if (await actions.removeItem(item.id)) {
                if (!wishlist.includes(item.productId)) toggleWishlist(item.productId);
                toast.success(`Moved ${name} to your wishlist`);
              }
            }}
          >
            <Heart className="size-4" /> Move to Wishlist
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={async () => {
              if (await actions.removeItem(item.id)) toast.success(`Removed ${name}`);
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
    const generalItems = plan!.items.filter((it) => serves(it, null));
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
                  plan!.items.filter((it) => serves(it, se.id)),
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

    // Grouped by day, in order — a route of day-stops rather than a single
    // time-proportional axis, so a 3-day gap between functions doesn't burn
    // most of the screen on empty space. Overlap is flagged within a day only
    // (cross-day "overlap" isn't meaningful here).
    const byDay = new Map<string, typeof scheduled>();
    for (const item of scheduled) {
      const list = byDay.get(item.se.eventDate) ?? [];
      list.push(item);
      byDay.set(item.se.eventDate, list);
    }
    const days = [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, items]) => {
        const sorted = [...items].sort((a, b) => a.start.getTime() - b.start.getTime());
        return {
          date,
          label: formatEventDate(date),
          events: sorted.map((item, i) => ({
            se: item.se,
            overlaps: sorted.some((other, j) => j !== i && item.start < other.end && other.start < item.end),
          })),
        };
      });
    const hasOverlap = days.some((d) => d.events.some((e) => e.overlaps));

    return (
      <div className="mt-6 flex flex-col gap-4">
        <ScrollFade className="pb-1">
          <div className="flex min-w-min">
            {days.map((day, i) => (
              <div key={day.date} className="flex w-48 shrink-0 flex-col sm:w-56">
                {/* Route node, matching the progress-steps pattern above. */}
                <div className="relative flex items-center px-1">
                  <span className={cn("h-0.5 flex-1", i === 0 ? "bg-transparent" : "bg-border")} />
                  <span className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-sm border border-primary bg-card text-[11px] font-semibold text-primary ring-4 ring-background">
                    {i + 1}
                  </span>
                  <span className={cn("h-0.5 flex-1", i === days.length - 1 ? "bg-transparent" : "bg-border")} />
                </div>
                <div className="mt-2 px-1 text-xs font-medium whitespace-nowrap text-foreground">{day.label}</div>
                <div className="mt-3 flex flex-1 flex-col gap-2 rounded-xl border border-border bg-card p-2.5">
                  {day.events.map(({ se, overlaps }) => (
                    <button
                      key={se.id}
                      onClick={() => {
                        setActiveTab(se.id);
                        setView("sub-events");
                      }}
                      className={cn(
                        "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-primary/15",
                        overlaps ? "border-primary/60 bg-primary/10" : "border-border/80 bg-background/40",
                      )}
                    >
                      <span className="truncate text-sm font-medium text-foreground">{se.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {se.startTime}
                        {se.endTime ? `–${se.endTime}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollFade>

        {hasOverlap && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block size-3 shrink-0 rounded-sm border border-primary/60 bg-primary/10" /> Highlighted functions share a day and overlap in time — worth a look in the Inventory view for anything they could reuse.
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
            <span className="rounded-sm bg-muted px-2 py-0.5 text-xs tabular-nums">{count}</span>
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
                      className="mt-0.5 w-fit rounded-sm bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:text-primary"
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
                        <span key={o.itemId} className="flex items-center gap-1 rounded-sm border border-border px-2 py-0.5 text-[11px]">
                          <span className="text-foreground">{o.subEventName}</span>
                          <span className="text-muted-foreground">× {o.quantity}</span>
                          {isReused && step && step.reused > 0 && <span className="text-primary">({step.reused} reused)</span>}
                        </span>
                      );
                    })}
                  </div>
                  {needsSharingDecision(u) && (
                    <div className="flex items-center gap-1 rounded-sm bg-muted p-0.5 text-[11px]">
                      {([
                        ["Shared", "Reuse same units"],
                        ["Dedicated", "Keep separate"],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => void actions.decideSharing(u.productId, value === "Shared" ? "SHARED" : "DEDICATED")}
                          className={cn("flex-1 rounded-sm px-2 py-1 transition-all", decision === value ? "glow bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}
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
                      onClick={() => void actions.decideSharing(u.productId, "SHARED")}
                    >
                      Yes, reuse these
                    </button>
                    <button
                      className={cn(
                        "rounded-lg border px-4 py-2 text-sm transition-colors",
                        decision === "Dedicated" ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                      onClick={() => void actions.decideSharing(u.productId, "DEDICATED")}
                    >
                      No, keep separate
                    </button>
                    {decision && (
                      <button className="text-xs text-muted-foreground underline" onClick={() => void actions.decideSharing(u.productId, null)}>
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

  // Saves what was ticked in the picker, one line after another; the first refusal stops it.
  async function addPicked(lines: PickedLine[]): Promise<boolean> {
    for (const line of lines) {
      const saved = await actions.addItem({ subEventId: activeTab, productId: line.productId, variantId: line.variantId, quantity: line.quantity });
      if (!saved) return false;
    }
    nudges.markAdded(suggestionScope, pickerFor!.key);
    toast.success(`Added ${lines.length} item${lines.length === 1 ? "" : "s"} to ${activeLabel}`);
    return true;
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
                    onClick={() => void actions.decideSharing(u.productId, "SHARED")}
                  >
                    Reuse
                  </button>
                  <button
                    className={cn(
                      "flex-1 rounded-lg border px-2 py-1.5 text-xs transition-colors",
                      decision === "Dedicated" ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                    onClick={() => void actions.decideSharing(u.productId, "DEDICATED")}
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

  // Name, date, start time and venue are required; setup/teardown and guest count stay optional.
  const subEventFormValid = Boolean(
    subEventForm.name.trim() && subEventForm.eventDate && subEventForm.startTime && (subEventForm.venue.trim() || subEventForm.venueId),
  );

  async function handleSaveSubEvent() {
    const f = subEventForm;
    if (!subEventFormValid) return;
    const details = {
      venue: f.venue.trim() || undefined,
      venueId: f.venueId || null,
      setupDate: f.setupDate || undefined,
      teardownDate: f.teardownDate || undefined,
      guestCount: Number(f.guestCount) > 0 ? Number(f.guestCount) : undefined,
      startTime: f.startTime || undefined,
      endTime: f.endTime || undefined,
    };
    const input = {
      name: f.name.trim(),
      scheduledOn: f.eventDate || undefined,
      venue: details.venue,
      venueId: details.venueId,
      setupOn: details.setupDate,
      teardownOn: details.teardownDate,
      guestCount: details.guestCount,
      startTime: details.startTime,
      endTime: details.endTime,
    };
    const before = new Set(plan!.subEvents.map((se) => se.id));
    const saved = editingSubEventId ? await actions.updateSubEvent(editingSubEventId, input) : await actions.addSubEvent(input);
    if (!saved) return;
    if (promotingGeneral) {
      // The main function becomes this function: its items move onto it.
      const created = saved.subEvents.find((se) => !before.has(String(se.id)));
      if (created) {
        const id = String(created.id);
        for (const item of plan!.items.filter((it) => it.subEventIds.length === 0)) await actions.setFunctions(item.id, [id]);
        setActiveTab(id);
      }
    }
    closeSubEventDialog();
  }

  function closeSubEventDialog() {
    setSubEventForm(EMPTY_SUB_EVENT);
    setCustomFunctionName(false);
    setEditingSubEventId(null);
    setPromotingGeneral(false);
    setSubEventDialogOpen(false);
  }

  function openEditPlan() {
    setCoverChange(NO_COVER_CHANGE);
    setPlanForm({
      name: plan!.name,
      venue: plan!.venue ?? "",
      venueId: plan!.venueId ?? "",
      eventStartDate: plan!.eventStartDate ?? "",
      eventEndDate: plan!.eventEndDate ?? "",
      guestCount: plan!.guestCount,
    });
    setPlanDialogOpen(true);
  }

  async function handleSavePlan() {
    if (!planForm.name.trim()) return;
    const saved = await actions.updateDetails({
      name: planForm.name.trim(),
      venue: planForm.venue.trim() || undefined,
      venueId: planForm.venueId || null,
      eventDate: planForm.eventStartDate || undefined,
      eventEndDate: planForm.eventEndDate || undefined,
      guestCount: planForm.guestCount,
      // The details form does not touch this, so it must be sent back or it would be cleared.
      generalLabel: plan!.generalLabel,
    });
    if (!saved) return;
    // The picture goes after the details, so a refused photo never costs them the details they changed.
    if (coverChange.file) {
      if (!(await actions.setCoverImage(coverChange.file))) return;
    } else if (coverChange.removed) {
      if (!(await actions.removeCoverImage())) return;
    }
    setPlanDialogOpen(false);
    toast.success("Event details updated");
  }

  function openAddSubEvent() {
    setSubEventForm({
      ...EMPTY_SUB_EVENT,
      // Defaults from the plan's own dates, so they're filled in before a function-specific date is
      // even picked; the Date field's onChange below re-anchors them once it is, as long as neither
      // has been touched by hand yet.
      setupDate: startDate ? shiftDate(startDate, -1) : "",
      teardownDate: (plan!.eventEndDate || startDate) ? shiftDate(plan!.eventEndDate || startDate, 1) : "",
    });
    setCustomFunctionName(false);
    setEditingSubEventId(null);
    setPromotingGeneral(false);
    setSubEventDialogOpen(true);
  }

  // Editing the main function opens the function form; saving it makes a real function of it.
  function openEditGeneral() {
    const name = plan!.generalLabel?.trim() ?? "";
    setSubEventForm({
      ...EMPTY_SUB_EVENT,
      name,
      setupDate: startDate ? shiftDate(startDate, -1) : "",
      teardownDate: (plan!.eventEndDate || startDate) ? shiftDate(plan!.eventEndDate || startDate, 1) : "",
    });
    setCustomFunctionName(name !== "" && !(FUNCTION_PRESETS as readonly string[]).includes(name));
    setEditingSubEventId(null);
    setPromotingGeneral(true);
    setSubEventDialogOpen(true);
  }

  function openEditSubEvent(se: SubEvent) {
    setSubEventForm({
      name: se.name,
      eventDate: se.eventDate,
      venue: se.venue ?? "",
      venueId: se.venueId ?? "",
      setupDate: se.setupDate ?? (se.eventDate ? shiftDate(se.eventDate, -1) : ""),
      teardownDate: se.teardownDate ?? (se.eventDate ? shiftDate(se.eventDate, 1) : ""),
      guestCount: se.guestCount ? String(se.guestCount) : "",
      startTime: se.startTime ?? "",
      endTime: se.endTime ?? "",
    });
    setCustomFunctionName(!(FUNCTION_PRESETS as readonly string[]).includes(se.name));
    setEditingSubEventId(se.id);
    setPromotingGeneral(false);
    setSubEventDialogOpen(true);
  }

  // ---- Page-level facts that drive the progress steps, to-dos and cards ----
  const functionsCount = plan.subEvents.length;
  const itemsCount = plan.items.length;
  const pendingSharing = productUsage.filter((u) => needsSharingDecision(u) && !plan!.itemSharing?.[u.productId]);
  const emptySubEvents = plan.subEvents.filter((se) => !plan!.items.some((it) => serves(it, se.id)));
  const steps = [
    { label: "Event details", hint: "Dates, venue & guests", done: Boolean(plan.venue && startDate && plan.guestCount), onClick: openEditPlan },
    { label: "Add functions", hint: "Haldi, Sangeet, Wedding…", done: functionsCount > 0, onClick: openAddSubEvent },
    { label: "Pick items", hint: "Décor, furniture, lighting", done: itemsCount > 0 && emptySubEvents.length === 0, onClick: () => setView("sub-events") },
    { label: "Get a quote", hint: "Submit or order directly", done: plan.status !== "DRAFT", onClick: undefined },
  ];
  const currentStep = steps.findIndex((s) => !s.done);
  const blocker = quoteBlocker(plan);
  const incompleteFunctions = plan.subEvents.filter((se) => !functionComplete(se));
  const todos = [
    ...(generalVisible && itemsCount > 0
      ? [{ key: "general", text: `${baseName} needs a date, time and venue`, action: "Add details", onClick: openEditGeneral }]
      : []),
    ...incompleteFunctions.map((se) => ({
      key: `details-${se.id}`,
      text: `${se.name} needs ${[!se.eventDate && "a date", !se.startTime && "a time", !(se.venue?.trim() || se.venueId) && "a venue"].filter(Boolean).join(", ")}`,
      action: "Add details",
      onClick: () => openEditSubEvent(se),
    })),
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
  // The main function leads while it is shown: it's where a newcomer starts adding.
  const functionCards = [
    ...(generalVisible ? [{ id: null as string | null, name: baseName, sub: "Set its date, time and venue" }] : []),
    ...plan.subEvents.map((se) => ({ id: se.id as string | null, name: se.name, sub: se.eventDate ? formatEventDate(se.eventDate) : "No date yet" })),
  ];

  async function confirmRemoveSubEvent(se: SubEvent) {
    if (!window.confirm(`Remove ${se.name}? Its items will move to ${baseName}.`)) return;
    if (await actions.removeSubEvent(se.id)) {
      setActiveTab(null);
      toast.success(`${se.name} removed`);
    }
  }

  function openBrowsePicker() {
    openPicker(BROWSE_PICKER);
  }

  const submitActions = canSubmit ? (
    <div className="flex flex-col gap-1.5">
      <Button className="w-full gap-2 rounded-lg" disabled={blocker !== null} nativeButton={blocker !== null} render={blocker !== null ? undefined : <Link href={`/plans/${planId}/submit`} />}>
        <Send className="size-4" /> Submit for Quotation
      </Button>
      {blocker && itemsCount > 0 && <p className="text-xs text-muted-foreground">{blocker}</p>}
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">This plan has been sent for a quotation and can no longer be changed.</p>
  );

  return (
    <div className="mx-auto w-full max-w-7xl pt-6 pb-28 md:pb-12 page-x">
      <Link href="/plans" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft className="size-4" /> All plans
      </Link>

      {/* ================= HERO ================= */}
      <section className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
        {plan.coverImageUrl && (
          <div className="relative h-44 w-full bg-muted md:h-64">
            {/* A plain <img>: the picture is a storage address, which next/image has nothing to optimise. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={plan.coverImageUrl} alt={`${plan.name}`} className="size-full object-cover" />
            {plan.editable && (
              <button
                type="button"
                onClick={openEditPlan}
                className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur transition-colors hover:bg-black/75"
              >
                <ImagePlus className="size-3.5" /> Change photo
              </button>
            )}
          </div>
        )}
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between md:p-7">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-3xl text-foreground md:text-4xl">{plan.name}</h1>
              <span className={cn("rounded-sm px-3 py-1 text-xs", STATUS_STYLE[plan.status])}>{PLAN_STATUS_LABEL[plan.status]}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <MetaChip icon={CalendarDays} value={startDate ? planDateLabel : undefined} empty="Add dates" onClick={openEditPlan} />
              <MetaChip icon={MapPin} value={plan.venue} empty="Add venue" onClick={openEditPlan} />
              <MetaChip icon={Users} value={plan.guestCount ? `${plan.guestCount} guests` : undefined} empty="Add guest count" onClick={openEditPlan} />
              {plan.editable && !plan.coverImageUrl && <MetaChip icon={ImagePlus} empty="Add photo" onClick={openEditPlan} />}
              <MetaChip icon={LayoutList} value={`${functionsCount} function${functionsCount === 1 ? "" : "s"} · ${itemsCount} item${itemsCount === 1 ? "" : "s"}`} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg" onClick={openEditPlan} disabled={!plan.editable}>
              <Pencil className="size-4" /> Edit
            </Button>
            <Link href={`/plans/${plan.id}/share`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-sm hover:bg-muted">
              <Users className="size-4" /> {plan.role === "OWNER" ? "Share" : "People"}
            </Link>
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
                      "relative z-10 flex size-6 items-center justify-center rounded-sm text-[11px] font-semibold ring-4 ring-card transition-colors",
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

      {plan.status === "DRAFT" && plan.role === "VIEWER" && (
        <section className="mt-4 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-foreground">
          You were invited to look at this plan. You can view it but not change it.
        </section>
      )}

      {plan.status !== "DRAFT" && (
        <section className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
          This plan has been sent for a quotation, so it can be read but no longer changed. Our team will come back to you with the quotation.
          <PlanQuotationLink planId={plan.id} />
        </section>
      )}

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
            <div className="inline-flex gap-1 rounded-sm border border-border bg-card p-1">
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
                    "flex h-8 shrink-0 items-center gap-1.5 rounded-sm px-3.5 text-xs font-medium whitespace-nowrap transition-all duration-200",
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
                  const count = plan.items.filter((it) => serves(it, f.id)).length;
                  return (
                    <button
                      key={f.id ?? "general"}
                      onClick={() => setActiveTab(f.id)}
                      title={f.sub}
                      className={cn(
                        "flex h-9 shrink-0 items-center gap-2 rounded-sm border pr-1.5 pl-3.5 text-sm whitespace-nowrap transition-colors",
                        active ? "glow border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground/80 hover:border-primary/50 hover:text-foreground",
                      )}
                    >
                      {f.name}
                      <span className={cn("min-w-6 rounded-sm px-1.5 py-0.5 text-[11px] tabular-nums", active ? "bg-primary-foreground/20" : count ? "bg-muted text-foreground" : "bg-muted text-muted-foreground")}>{count}</span>
                    </button>
                  );
                })}
                <button
                  onClick={openAddSubEvent}
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-sm border border-dashed border-border px-3.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Plus className="size-4" /> Add function
                </button>
              </div>

              {/* ================= SELECTED FUNCTION ================= */}
              <fieldset disabled={!plan.editable} className="contents">
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
                    ) : (
                      <>
                        <h2 className="truncate font-serif text-xl text-foreground">{baseName}</h2>
                        <p className="text-xs text-muted-foreground">
                          A function of your event. Set its date, time and venue with the pencil, or add more functions like Haldi or Sangeet.
                        </p>
                      </>
                    )}
                  </div>
                  {!activeSubEvent && (
                    <button
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                      onClick={openEditGeneral}
                      title="Edit function"
                      aria-label="Edit function"
                    >
                      <Pencil className="size-4" />
                    </button>
                  )}
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
                {blocker ? (
                  <Button size="sm" disabled title={blocker}>
                    Submit for Quotation
                  </Button>
                ) : (
                  <Button size="sm" nativeButton={false} render={<Link href={`/plans/${planId}/submit`}>Submit for Quotation</Link>} />
                )}
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
                      <span className="flex size-12 items-center justify-center rounded-sm bg-primary/10 text-primary">
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
                                    {!product.available && " · No longer available"}
                                  </span>
                                  {sharedWith && (
                                    <span className="flex w-fit items-center gap-1 rounded-sm bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                                      <Repeat className="size-3" /> {sharedWith}
                                    </span>
                                  )}
                                </span>
                              </span>
                              <span className="order-3 flex items-center gap-2 text-xs text-muted-foreground md:order-none">
                                <NumberStepper id={`qty-${item.id}`} size="sm" aria-label={`${product.name} quantity`} value={lineQty(item)} onChange={(v) => void actions.setQuantity(item.id, v)} />
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
              </fieldset>
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
            {plan.bundles.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2 border-t border-border pt-3 text-xs">
                {plan.bundles.map((b) => (
                  <li key={b.groupId} className="flex items-baseline justify-between gap-2">
                    <span className="text-muted-foreground">
                      {b.name} · {b.discountPercent}% off
                    </span>
                    <span className="text-foreground tabular-nums">
                      <span className="mr-1.5 text-muted-foreground line-through">{formatRupees(b.itemsTotal.amount)}</span>
                      {formatRupees(b.effectivePrice.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

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
                        <span className="h-1.5 overflow-hidden rounded-sm bg-muted">
                          <span className="block h-full rounded-sm bg-primary/70" style={{ width: `${planTotal ? (f.total / planTotal) * 100 : 0}%` }} />
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

          {/* Terms sit in the sidebar next to the totals - the point in the
              flow where the customer is deciding to commit. */}
          <RentalTerms />
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
                    <VenueSelect
                      value={planForm.venueId}
                      onChange={(venueId, text) => setPlanForm({ ...planForm, venueId, venue: venueId ? text : planForm.venue })}
                    />
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
                  <PlanCoverField currentUrl={plan.coverImageUrl} change={coverChange} onChange={setCoverChange} disabled={actions.saving} />
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

      <Dialog open={subEventDialogOpen} onOpenChange={(open) => (open ? setSubEventDialogOpen(true) : closeSubEventDialog())}>
                  <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubEventId || promotingGeneral ? "Edit function" : "Add function"}</DialogTitle>
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
                        "rounded-sm border px-3 py-1.5 text-sm transition-colors",
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
                      "rounded-sm border px-3 py-1.5 text-sm transition-colors",
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
              <p className="text-xs text-muted-foreground">Date, start time and venue are needed; the rest can wait.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="se-date">Date *</Label>
                  <DateWheelPicker
                    id="se-date"
                    min={startDate || undefined}
                    max={plan.eventEndDate || startDate || undefined}
                    value={subEventForm.eventDate}
                    onChange={(v) =>
                      setSubEventForm({
                        ...subEventForm,
                        eventDate: v,
                        // Prefilled from the chosen date, once — never overwrites a value already picked.
                        setupDate: subEventForm.setupDate || (v ? shiftDate(v, -1) : ""),
                        teardownDate: subEventForm.teardownDate || (v ? shiftDate(v, 1) : ""),
                      })
                    }
                  />
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
                  <Label htmlFor="se-start-time">Start time *</Label>
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
                <Label htmlFor="se-venue">Venue *</Label>
                <VenueSelect
                  value={subEventForm.venueId}
                  noneLabel="Type it below"
                  onChange={(venueId, text) => setSubEventForm({ ...subEventForm, venueId, venue: venueId ? text : subEventForm.venue })}
                />
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
                  <DateWheelPicker id="se-teardown" value={subEventForm.teardownDate} onChange={(v) => setSubEventForm({ ...subEventForm, teardownDate: v })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveSubEvent} disabled={!subEventFormValid}>
                {editingSubEventId || promotingGeneral ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
      {/* Product picker: opened by a starter suggestion or "Add items", slides in from the right. */}
      <ItemPicker prompt={pickerFor} targetLabel={activeLabel} onClose={() => setPickerFor(null)} onAdd={addPicked} />

      {/* Mobile action bar — the sidebar's buttons are off-screen on phones */}
      <footer className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex min-w-0 flex-col">
          <span className="text-[11px] text-muted-foreground uppercase">Total</span>
          <span className="font-serif text-xl text-primary">{formatRupees(planTotal)}</span>
        </div>
        <div className="ml-auto flex gap-2">
          {canSubmit && itemsCount > 0 ? (
            blocker ? (
              <Button size="sm" className="rounded-lg" disabled title={blocker}>
                Get quote
              </Button>
            ) : (
              <Button size="sm" className="rounded-lg" nativeButton={false} render={<Link href={`/plans/${planId}/submit`}>Get quote</Link>} />
            )
          ) : canSubmit && (
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
    "flex items-center gap-1.5 rounded-sm border px-3 py-1 text-xs transition-colors",
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

function PlanSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl pt-6 pb-28 md:pb-12 page-x" aria-busy="true">
      <div className="shimmer h-4 w-24 rounded bg-muted/70" />
      <div className="shimmer mt-3 h-44 rounded-2xl bg-muted/70" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="shimmer h-96 rounded-2xl bg-muted/70" />
        <div className="shimmer h-72 rounded-2xl bg-muted/70" />
      </div>
    </div>
  );
}
