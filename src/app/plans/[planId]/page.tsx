"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Clock, Pencil, Plus, Share2, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { STARTER_SUGGESTIONS, formatRupees, rateTypeLabel } from "@/mock-data/seed";
import type { PlanItem, PlanStatus } from "@/mock-data/types";

// Flowstep screens 19 (desktop) / 20 (mobile), fileId 8bd03b8a-4561-4b58-bb2d-ca011d84d53e.
const STATUS_STYLE: Record<PlanStatus, string> = {
  Draft: "border border-muted-foreground text-muted-foreground",
  Submitted: "border border-primary text-primary",
  Quoted: "border border-primary text-primary",
  PartiallyAccepted: "border border-primary text-primary",
  Ordered: "bg-primary text-primary-foreground",
  Cancelled: "border border-destructive/60 bg-destructive/10 text-destructive",
};

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function PlanDetailPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params);
  const account = useRequireAccount();
  const { getPlan, products, accounts, removeSubEvent, removePlanItem, addPlanItem, addSubEvent } = useMockStore();
  const plan = getPlan(planId);

  const [activeTab, setActiveTab] = useState<string | null>(null); // null = General/Untagged
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [subEventDialogOpen, setSubEventDialogOpen] = useState(false);
  const [subEventName, setSubEventName] = useState("");
  const [subEventDate, setSubEventDate] = useState("");
  const [auditLogOpen, setAuditLogOpen] = useState(false);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  if (!account) return null;
  if (!plan) return <div className="mx-auto w-full max-w-5xl px-4 py-10">Plan not found.</div>;

  const isOwner = plan.ownerAccountId === account.id;
  const owner = accounts.find((a) => a.id === plan.ownerAccountId);
  const collaborators = [owner, ...plan.coOwners.map((c) => accounts.find((a) => a.id === c.accountId))].filter(Boolean);

  const activeItems = plan.items.filter((it) => it.subEventId === activeTab);
  const activeLabel = activeTab ? plan.subEvents.find((se) => se.id === activeTab)?.name : "General / Untagged";

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

  const availableSuggestions = STARTER_SUGGESTIONS.filter(
    (s) => !dismissedSuggestions.has(s.key) && !plan!.items.some((it) => it.productId === s.productId),
  );

  function acceptSuggestion(key: string, productId: string) {
    addPlanItem(planId, { productId, quantity: 1, subEventId: activeTab });
    setDismissedSuggestions((s) => new Set(s).add(key));
    toast.success("Added to plan");
  }

  function handleAddSubEvent() {
    if (!subEventName.trim() || !subEventDate) return;
    addSubEvent(planId, subEventName.trim(), subEventDate);
    setSubEventName("");
    setSubEventDate("");
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
          <p className="text-sm text-muted-foreground">{plan.subEvents[0]?.eventDate ?? "No date set"}</p>
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
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="se-name">Name</Label>
                <Input id="se-name" placeholder="Day 1 — Sangeet" value={subEventName} onChange={(e) => setSubEventName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="se-date">Date</Label>
                <Input id="se-date" type="date" value={subEventDate} onChange={(e) => setSubEventDate(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddSubEvent}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {activeTab && (
        <div className="flex justify-end pt-4">
          <button className="text-xs text-muted-foreground hover:text-destructive" onClick={() => { removeSubEvent(planId, activeTab); setActiveTab(null); }}>
            Remove this sub-event
          </button>
        </div>
      )}

      <div className="grid gap-8 pt-6 md:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-6">
          {/* Line items */}
          <section className="overflow-hidden rounded-xl bg-card">
            <div className="hidden grid-cols-[2fr_1.2fr_1.4fr_1fr_100px] gap-4 border-b border-border px-5 py-3 text-xs tracking-wider text-muted-foreground uppercase md:grid">
              <span>Product</span>
              <span>Quantity/Dimensions</span>
              <span>Rate Type</span>
              <span>Line Price</span>
              <span />
            </div>
            {activeItems.map((item) => {
              const product = productById.get(item.productId);
              if (!product) return null;
              return (
                <div key={item.id} className="border-b border-border p-4 last:border-b-0 md:grid md:grid-cols-[2fr_1.2fr_1.4fr_1fr_100px] md:items-center md:gap-4 md:px-5 md:py-4">
                  <span className="text-sm text-foreground">{product.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.dimensions ? `${item.dimensions.length} ${product.rateType === "SqFt" ? "sqft" : "ft"}` : `Qty ${item.quantity}`}
                  </span>
                  <span className="text-sm text-muted-foreground">{rateTypeLabel(product.rateType)}</span>
                  <span className="font-serif text-base text-primary">{formatRupees(linePrice(item))}</span>
                  <div className="mt-2 flex items-center justify-end gap-3 md:mt-0">
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

          {/* Starter suggestions */}
          {availableSuggestions.length > 0 && (
            <section className="rounded-xl border border-dashed border-primary bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl text-foreground">Complete your setup</h2>
                <span className="text-xs text-muted-foreground">Starter Suggestions</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {availableSuggestions.map((s) => (
                  <div key={s.key} className="relative flex flex-col gap-3 rounded-lg border border-border bg-background p-3">
                    <button className="absolute top-2 right-2 text-muted-foreground" onClick={() => setDismissedSuggestions((set) => new Set(set).add(s.key))}>
                      <X className="size-3" />
                    </button>
                    <Sparkles className="size-4 text-primary" />
                    <span className="pr-2 text-sm text-foreground">{s.label}</span>
                    <button className="w-fit rounded-md border border-primary px-2 py-1 text-xs text-primary" onClick={() => acceptSuggestion(s.key, s.productId)}>
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

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
