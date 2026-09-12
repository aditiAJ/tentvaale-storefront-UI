"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarRange, Clock, LayoutList, MoveRight, Pencil, Plus, Search, Share2, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProductThumb } from "@/components/product-thumb";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { STARTER_SUGGESTIONS, formatEventDate, formatEventDateRange, formatRupees, rateTypeLabel } from "@/mock-data/seed";
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

const EMPTY_SUB_EVENT = { name: "", eventDate: "", venue: "", setupDate: "", teardownDate: "", guestCount: "" };

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
  const { getPlan, products, accounts, removeSubEvent, removePlanItem, movePlanItem, addPlanItem, addSubEvent } = useMockStore();
  const plan = getPlan(planId);

  const [activeTab, setActiveTab] = useState<string | null>(null); // null = General/Untagged
  // Keyed by sub-event id ("general" for the untagged list) so each
  // sub-event gets its own set of starter suggestions to work through.
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Record<string, string[]>>({});
  const [subEventDialogOpen, setSubEventDialogOpen] = useState(false);
  const [subEventForm, setSubEventForm] = useState(EMPTY_SUB_EVENT);
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  const [view, setView] = useState<"sub-events" | "dates">("sub-events");
  const [activeDate, setActiveDate] = useState<string | null>(null);
  // Which starter suggestion opened the product picker — null = picker closed.
  const [pickerFor, setPickerFor] = useState<(typeof STARTER_SUGGESTIONS)[number] | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerShowAll, setPickerShowAll] = useState(false);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  if (!account) return null;
  if (!plan) return <div className="mx-auto w-full max-w-5xl px-4 py-10">Plan not found.</div>;

  const isOwner = plan.ownerAccountId === account.id;
  const owner = accounts.find((a) => a.id === plan.ownerAccountId);
  const collaborators = [owner, ...plan.coOwners.map((c) => accounts.find((a) => a.id === c.accountId))].filter(Boolean);

  const activeItems = plan.items.filter((it) => it.subEventId === activeTab);
  const activeSubEvent = activeTab ? plan.subEvents.find((se) => se.id === activeTab) : undefined;
  const activeLabel = activeSubEvent?.name ?? "General / Untagged";

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

  function addFromPicker(product: Product) {
    addPlanItem(planId, { productId: product.id, quantity: 1, subEventId: activeTab });
    dismissSuggestion(pickerFor!.key);
    setPickerFor(null);
    toast.success(`Added ${product.name} to ${activeLabel}`);
  }

  // Only name is required. Date, venue, setup/teardown and guest count are
  // logistics the customer often doesn't know yet — they stay optional and can
  // be left blank without blocking the sub-event.
  function handleAddSubEvent() {
    const f = subEventForm;
    if (!f.name.trim()) return;
    addSubEvent(planId, f.name.trim(), f.eventDate, {
      venue: f.venue.trim() || undefined,
      setupDate: f.setupDate || undefined,
      teardownDate: f.teardownDate || undefined,
      guestCount: Number(f.guestCount) > 0 ? Number(f.guestCount) : undefined,
    });
    setSubEventForm(EMPTY_SUB_EVENT);
    setSubEventDialogOpen(false);
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

      {/* View switch — per sub-event, or everything grouped by calendar date. */}
      <div className="flex items-center gap-2 pt-4">
        {([
          { key: "sub-events", label: "Sub-events", icon: LayoutList },
          { key: "dates", label: "Date view", icon: CalendarRange },
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
        <Dialog open={subEventDialogOpen} onOpenChange={setSubEventDialogOpen}>
          <DialogTrigger
            render={
              <button className="flex shrink-0 items-center gap-2 py-4 text-sm text-muted-foreground">
                <Plus className="size-4" /> Add Sub-Event
              </button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add sub-event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="se-name">Name *</Label>
                <Input
                  id="se-name"
                  placeholder="Day 1 — Sangeet"
                  value={subEventForm.name}
                  onChange={(e) => setSubEventForm({ ...subEventForm, name: e.target.value })}
                />
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
              <Button onClick={handleAddSubEvent} disabled={!subEventForm.name.trim()}>
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {activeSubEvent && (
        <div className="flex flex-col gap-3 pt-4 md:flex-row md:items-end md:justify-between">
          <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-5">
            <DetailCell label="Date" value={formatEventDate(activeSubEvent.eventDate)} />
            <DetailCell label="Venue" value={activeSubEvent.venue} />
            <DetailCell label="Setup" value={formatEventDate(activeSubEvent.setupDate)} />
            <DetailCell label="Tear-down" value={formatEventDate(activeSubEvent.teardownDate)} />
            <DetailCell label="Guests" value={activeSubEvent.guestCount} />
          </div>
          <button
            className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => {
              removeSubEvent(planId, activeSubEvent.id);
              setActiveTab(null);
            }}
          >
            Remove this sub-event
          </button>
        </div>
      )}

      <div className="grid gap-8 pt-6 md:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-6">
          {/* Starter suggestions */}
          {availableSuggestions.length > 0 && (
            <section className="rounded-xl border border-dashed border-primary bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl text-foreground">Complete your setup</h2>
                <span className="text-xs text-muted-foreground">Adding to {activeLabel}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {availableSuggestions.map((s) => (
                  <div key={s.key} className="relative flex flex-col gap-3 rounded-lg border border-border bg-background p-3">
                    <button className="absolute top-2 right-2 text-muted-foreground" onClick={() => dismissSuggestion(s.key)}>
                      <X className="size-3" />
                    </button>
                    <Sparkles className="size-4 text-primary" />
                    <span className="pr-2 text-sm text-foreground">{s.label}</span>
                    <button className="w-fit rounded-md border border-primary px-2 py-1 text-xs text-primary" onClick={() => openPicker(s)}>
                      Add
                    </button>
                  </div>
                ))}
              </div>
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
              return (
                <div key={item.id} className="border-b border-border p-4 last:border-b-0 md:grid md:grid-cols-[2fr_1.4fr_1.4fr_120px] md:items-center md:gap-4 md:px-5 md:py-4">
                  <span className="flex items-center gap-3">
                    <ProductThumb imageUrl={product.imageUrl} alt={product.name} className="size-10 shrink-0" />
                    <span className="text-sm text-foreground">{product.name}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {item.dimensions ? `${item.dimensions.length} ${product.rateType === "SqFt" ? "sqft" : "ft"}` : `Qty ${item.quantity}`}
                  </span>
                  <span className="flex flex-col">
                    <span className="font-serif text-base text-primary">{formatRupees(linePrice(item))}</span>
                    <span className="text-xs text-muted-foreground">{unitRateLabel(product)}</span>
                  </span>
                  <div className="mt-2 flex items-center justify-end gap-3 md:mt-0">
                    {renderMoveMenu(item)}
                    <button className="text-muted-foreground" onClick={() => toast.info("Editing line items isn't wired up yet — remove and re-add instead.")}>
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

        {/* Plan Total sidebar */}
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
        </aside>
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
              <button className="text-primary hover:underline" onClick={() => setPickerShowAll((v) => !v)}>
                {pickerShowAll ? "Suggested only" : "Show all products"}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto border-t border-border">
            {pickerProducts.map((prod) => (
              <button
                key={prod.id}
                className="flex w-full items-center gap-3 border-b border-border p-4 text-left transition-colors hover:bg-secondary"
                onClick={() => addFromPicker(prod)}
              >
                <ProductThumb imageUrl={prod.imageUrl} alt={prod.name} className="size-14 shrink-0" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm text-foreground">{prod.name}</span>
                  <span className="text-xs text-muted-foreground">{prod.category}</span>
                  <span className="text-xs text-primary">{unitRateLabel(prod)}</span>
                </span>
                <Plus className="ml-auto size-4 shrink-0 text-primary" />
              </button>
            ))}
            {pickerProducts.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">No products match. Try &quot;Show all products&quot;.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sticky footer actions */}
      <footer className="fixed inset-x-0 bottom-0 z-30 flex justify-end gap-4 border-t border-border bg-background px-4 py-4 md:px-8">
        {isOwner ? (
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
          <span className="text-sm text-muted-foreground">Only the plan owner can submit or order.</span>
        )}
      </footer>
    </div>
  );
}
