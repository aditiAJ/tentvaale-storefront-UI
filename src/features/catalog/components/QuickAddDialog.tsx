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
import { usePlanActions } from "@/features/plans/hooks";
import { addItem as apiAddItem } from "@/features/plans/api";
import { PlanTargetFields, usePlanTarget } from "@/features/plans/target";
import { CreatePlanDialog } from "@/features/plans/components/CreatePlanDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { NumberStepper } from "@/components/number-stepper";
import { ProductThumb } from "@/components/product-thumb";
import { formatMoney } from "@/lib/money";
import { useMockStore } from "@/mock-data/store";
import { useProduct } from "../hooks";
import { quantityLabel, rateUnitLabel } from "../format";
import type { ProductCard } from "../types";

/**
 * The corner "Add" on a listing card. The card does not know stock or variants, so the dialog asks
 * for the product page's data first; a product with variants must have one chosen.
 *
 * It adds to one of the customer's draft plans (and one of its functions), saved on the backend.
 */
export function QuickAddDialog({ card, onClose }: { card: ProductCard | null; onClose: () => void }) {
  const router = useRouter();
  const { currentAccount } = useMockStore();
  const detail = useProduct(card?.slug);
  const product = detail.data;
  const target = usePlanTarget();
  const actions = usePlanActions(target.planId);
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<number | undefined>(undefined);
  const [showCreatePlan, setShowCreatePlan] = useState(false);

  const plan = target.plan;
  const variant = product?.variants.find((v) => v.id === variantId) ?? product?.variants[0];
  const rate = variant?.dailyRate ?? product?.dailyRate;
  const ceiling = variant?.maxOrderable ?? product?.maxOrderable;
  const perArea = product ? product.rateType !== "QTY" : false;

  async function handleAdd() {
    if (!product || !plan) return;
    const saved = await actions.addItem({
      subEventId: target.subEventId,
      productId: product.id,
      variantId: variant?.id ?? null,
      quantity: qty,
    });
    if (!saved) return;
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
            ) : (
              <div className="flex flex-col gap-4">
                <PlanTargetFields target={target} onCreatePlan={() => setShowCreatePlan(true)} />

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

            {currentAccount && product && (
              <DialogFooter>
                <Button variant="outline" nativeButton={false} render={<Link href={`/catalog/${card.slug}`}>View details</Link>} />
                {plan ? (
                  <Button className="gap-1.5" onClick={handleAdd}>
                    <Plus className="size-4" /> Add to plan
                  </Button>
                ) : (
                  <Button className="gap-1.5" onClick={() => setShowCreatePlan(true)}>
                    <Plus className="size-4" /> Create plan & add
                  </Button>
                )}
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>

      {product && (
        <CreatePlanDialog
          open={showCreatePlan}
          onOpenChange={setShowCreatePlan}
          initialName={`${product.name} Plan`}
          title="Create Plan & Add Item"
          submitLabel="Create Plan & Add"
          onCreated={async (newPlan) => {
            await apiAddItem(newPlan.id, {
              productId: product.id,
              variantId: variant?.id ?? null,
              quantity: qty,
            });
            toast.success(`Created "${newPlan.name}" and added ${product.name}!`);
            onClose();
            router.push(`/plans/${newPlan.id}`);
          }}
        />
      )}
    </Dialog>
  );
}
