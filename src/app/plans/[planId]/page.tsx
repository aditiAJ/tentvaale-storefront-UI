"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ProductThumb } from "@/components/product-thumb";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { STARTER_SUGGESTIONS, formatRupees } from "@/mock-data/seed";
import type { PlanItem } from "@/mock-data/types";

export default function PlanDetailPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params);
  const account = useRequireAccount();
  const router = useRouter();
  const { getPlan, products, addSubEvent, removeSubEvent, removePlanItem, adjustPlanItemQty, addPlanItem, submitPlanForQuotation } =
    useMockStore();
  const plan = getPlan(planId);

  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [addedSuggestions, setAddedSuggestions] = useState<Set<string>>(new Set());
  const [subEventDialogOpen, setSubEventDialogOpen] = useState(false);
  const [subEventName, setSubEventName] = useState("");
  const [subEventDate, setSubEventDate] = useState("");
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [granularity, setGranularity] = useState<"Plan" | "PerSubEvent">("Plan");

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  if (!account) return null;
  if (!plan) {
    return <div className="mx-auto w-full max-w-5xl px-4 py-10">Plan not found.</div>;
  }

  const isOwner = plan.ownerAccountId === account.id;
  const showSuggestions = plan.items.length === 0;

  const itemsBySubEvent = new Map<string | null, PlanItem[]>();
  itemsBySubEvent.set(null, []);
  for (const se of plan.subEvents) itemsBySubEvent.set(se.id, []);
  for (const item of plan.items) {
    const key = plan.subEvents.some((se) => se.id === item.subEventId) ? item.subEventId : null;
    itemsBySubEvent.get(key)!.push(item);
  }

  function acceptSuggestion(key: string, productId: string) {
    addPlanItem(planId, { productId, quantity: 1, subEventId: null });
    setAddedSuggestions((s) => new Set(s).add(key));
    toast.success("Added to plan");
  }

  function handleAddSubEvent() {
    if (!subEventName.trim() || !subEventDate) return;
    addSubEvent(planId, subEventName.trim(), subEventDate);
    setSubEventName("");
    setSubEventDate("");
    setSubEventDialogOpen(false);
  }

  function handleSubmit() {
    try {
      const quotations = submitPlanForQuotation(planId, granularity);
      setSubmitDialogOpen(false);
      toast.success(`Submitted — ${quotations.length} quotation${quotations.length === 1 ? "" : "s"} created`);
      router.push(`/quotations/${quotations[0].id}`);
    } catch {
      toast.error("Only the plan owner can submit for quotation.");
    }
  }

  const totalItems = plan.items.length;

  function ItemRow({ item }: { item: PlanItem }) {
    const product = productById.get(item.productId);
    if (!product) return null;
    return (
      <div className="flex items-center justify-between gap-4 rounded-md border p-3">
        <div className="flex items-center gap-3">
          <ProductThumb imageUrl={product.imageUrl} alt={product.name} className="h-12 w-12 shrink-0" />
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-muted-foreground">
              {product.rateType === "Qty" ? `Qty ${item.quantity}` : `${item.dimensions?.length ?? item.quantity} ${product.rateType === "SqFt" ? "sq ft" : "running ft"}`}
              {" · "}
              {formatRupees(product.basePrice * (item.dimensions?.length ?? item.quantity))}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {product.rateType === "Qty" && (
            <>
              <Button variant="outline" size="icon" onClick={() => adjustPlanItemQty(planId, item.id, -1)}>
                −
              </Button>
              <Button variant="outline" size="icon" onClick={() => adjustPlanItemQty(planId, item.id, 1)}>
                +
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={() => removePlanItem(planId, item.id)}>
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary">{plan.status}</Badge>
            {!isOwner && <Badge variant="outline">Shared with you</Badge>}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{plan.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href={`/plans/${planId}/share`}>Share / collaborate</Link>} />
          {isOwner ? (
            <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
              <DialogTrigger render={<Button disabled={totalItems === 0}>Submit for quotation</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit for quotation</DialogTitle>
                  <DialogDescription>Review before submitting — this starts admin&apos;s negotiation flow.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Quotation granularity</Label>
                    <div className="flex gap-2">
                      <Button variant={granularity === "Plan" ? "default" : "outline"} size="sm" onClick={() => setGranularity("Plan")}>
                        One combined quotation
                      </Button>
                      <Button
                        variant={granularity === "PerSubEvent" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGranularity("PerSubEvent")}
                        disabled={plan.subEvents.length === 0}
                      >
                        Per sub-event
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{totalItems} item(s) across {plan.subEvents.length} sub-event(s)</p>
                    {plan.items.map((it) => {
                      const product = productById.get(it.productId);
                      return (
                        <p key={it.id} className="text-muted-foreground">
                          {product?.name} — {product?.rateType === "Qty" ? it.quantity : `${it.dimensions?.length ?? it.quantity} ${product?.rateType}`}
                        </p>
                      );
                    })}
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSubmit}>Confirm submit</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button disabled title="Only the plan owner can submit for quotation">
              Submit for quotation
            </Button>
          )}
        </div>
      </div>

      {showSuggestions && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Starter suggestions</CardTitle>
            <CardDescription>Common pieces for a new event — accept or dismiss each.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {STARTER_SUGGESTIONS.filter((s) => !dismissedSuggestions.has(s.key) && !addedSuggestions.has(s.key)).map((s) => (
              <div key={s.key} className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
                <span>{s.label}</span>
                <button className="text-primary hover:underline" onClick={() => acceptSuggestion(s.key, s.productId)}>
                  Add
                </button>
                <button
                  className="text-muted-foreground hover:underline"
                  onClick={() => setDismissedSuggestions((set) => new Set(set).add(s.key))}
                >
                  Dismiss
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="items" className="mt-8">
        <TabsList>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Sub-events</h2>
            <Dialog open={subEventDialogOpen} onOpenChange={setSubEventDialogOpen}>
              <DialogTrigger render={<Button variant="outline" size="sm">Add sub-event</Button>} />
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

          {plan.subEvents.map((se) => (
            <div key={se.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  {se.name} <span className="text-sm font-normal text-muted-foreground">{se.eventDate}</span>
                </h3>
                <Button variant="ghost" size="sm" onClick={() => removeSubEvent(planId, se.id)}>
                  Remove sub-event
                </Button>
              </div>
              <div className="space-y-2">
                {itemsBySubEvent.get(se.id)?.map((item) => <ItemRow key={item.id} item={item} />)}
                {itemsBySubEvent.get(se.id)?.length === 0 && <p className="text-sm text-muted-foreground">No items tagged yet.</p>}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <h3 className="font-medium">General (not tagged to a sub-event)</h3>
            <div className="space-y-2">
              {itemsBySubEvent.get(null)?.map((item) => <ItemRow key={item.id} item={item} />)}
              {itemsBySubEvent.get(null)?.length === 0 && <p className="text-sm text-muted-foreground">Nothing here.</p>}
            </div>
          </div>

          <Button variant="outline" nativeButton={false} render={<Link href="/catalog">Browse catalog to add items</Link>} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-2">
          {plan.auditLog
            .slice()
            .reverse()
            .map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>
                  <span className="font-medium">{entry.action}</span> — {entry.detail}
                </span>
                <span className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
            ))}
          {plan.auditLog.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
