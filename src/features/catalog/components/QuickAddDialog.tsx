"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { NumberStepper } from "@/components/number-stepper";
import { ProductThumb } from "@/components/product-thumb";
import { formatMoney } from "@/lib/money";
import { useMockStore } from "@/mock-data/store";
import { useProduct } from "../hooks";
import { quantityLabel, rateUnitLabel } from "../format";
import { registerDetail } from "../plan-bridge";
import type { ProductCard } from "../types";

/**
 * The corner "Add" on a listing card. The card does not know stock or variants, so the dialog asks
 * for the product page's data first; a product with variants must have one chosen.
 *
 * Plans are still the local mock store's (storefront Phase 3), reached through the plan bridge.
 */
export function QuickAddDialog({ card, onClose }: { card: ProductCard | null; onClose: () => void }) {
  const router = useRouter();
  const { currentAccount, plans, addPlanItem } = useMockStore();
  const detail = useProduct(card?.slug);
  const product = detail.data;
  const myPlans = plans.filter((p) => p.ownerAccountId === currentAccount?.id && p.status === "Draft");
  const [planId, setPlanId] = useState("");
  const [subEventId, setSubEventId] = useState("__base");
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<number | undefined>(undefined);

  const plan = myPlans.find((p) => p.id === planId) ?? myPlans[0];
  const variant = product?.variants.find((v) => v.id === variantId) ?? product?.variants[0];
  const rate = variant?.dailyRate ?? product?.dailyRate;
  const ceiling = variant?.maxOrderable ?? product?.maxOrderable;
  const perArea = product ? product.rateType !== "QTY" : false;

  function handleAdd() {
    if (!product || !plan) return;
    const productId = registerDetail(product, variant);
    addPlanItem(plan.id, {
      productId,
      quantity: perArea ? 1 : qty,
      dimensions: perArea ? { length: qty } : undefined,
      subEventId: subEventId === "__base" ? null : subEventId,
    });
    toast.success(`Added ${product.name} to ${plan.name}`, { action: { label: "View plan", onClick: () => router.push(`/plans/${plan.id}`) } });
    onClose();
  }

  return (
    <Dialog open={card !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {card && (
          <>
            <DialogHeader>
              <DialogTitle>Add to plan</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
              <ProductThumb imageUrl={card.imageUrl} alt={card.name} className="size-14 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{card.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatMoney(card.dailyRate)} {rateUnitLabel(card.rateType)}
                </p>
              </div>
            </div>

            {!currentAccount ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <p className="text-sm text-muted-foreground">Sign in to save products to your event plan.</p>
                <Button nativeButton={false} render={<Link href="/signup">Sign up / Log in</Link>} />
              </div>
            ) : detail.isError ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <p className="text-sm text-muted-foreground">We couldn&apos;t load this product just now.</p>
                <Button variant="outline" onClick={() => detail.refetch()}>
                  Try again
                </Button>
              </div>
            ) : !product ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : !plan ? (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <p className="text-sm text-muted-foreground">You don&apos;t have a draft plan yet.</p>
                <Button nativeButton={false} render={<Link href="/plans">Create a plan</Link>} />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Plan</Label>
                    <Select
                      value={plan.id}
                      onValueChange={(v) => {
                        if (!v) return;
                        setPlanId(v);
                        setSubEventId("__base");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>{plan.name}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {myPlans.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Function</Label>
                    <Select value={subEventId} onValueChange={(v) => v && setSubEventId(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue>{subEventId === "__base" ? plan.generalLabel?.trim() || "Your event" : plan.subEvents.find((se) => se.id === subEventId)?.name}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__base">{plan.generalLabel?.trim() || "Your event"}</SelectItem>
                        {plan.subEvents.map((se) => (
                          <SelectItem key={se.id} value={se.id}>
                            {se.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {product.variants.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <Label>Option</Label>
                    <Select value={String(variant?.id)} onValueChange={(v) => v && setVariantId(Number(v))}>
                      <SelectTrigger className="w-full">
                        <SelectValue>{variant?.name}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {product.variants.map((v) => (
                          <SelectItem key={v.id} value={String(v.id)}>
                            {v.name} · {formatMoney(v.dailyRate)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <Label>{quantityLabel(product.rateType)}</Label>
                  <NumberStepper value={qty} onChange={setQty} max={perArea ? undefined : ceiling} aria-label="Quantity" />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Estimated</span>
                  <span className="font-serif text-lg text-primary">{rate ? formatMoney({ ...rate, amount: rate.amount * qty }) : "—"}</span>
                </div>
              </div>
            )}

            {currentAccount && plan && product && (
              <DialogFooter>
                <Button variant="outline" nativeButton={false} render={<Link href={`/catalog/${card.slug}`}>View details</Link>} />
                <Button className="gap-1.5" onClick={handleAdd}>
                  <Plus className="size-4" /> Add to plan
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
