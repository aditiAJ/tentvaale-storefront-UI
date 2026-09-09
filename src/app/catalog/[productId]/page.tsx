"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductThumb } from "@/components/product-thumb";
import { useMockStore } from "@/mock-data/store";
import { formatRupees, rateTypeLabel } from "@/mock-data/seed";

// Flowstep screens 9 (desktop) / 10 (mobile), fileId 8bd03b8a-4561-4b58-bb2d-ca011d84d53e.
// The "Added to Plan" confirmation (screens 52/54) is a dialog here rather
// than an immediate redirect, so the shopper can keep browsing complementary
// products from the same page.
export default function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const router = useRouter();
  const { products, currentAccount, plans, addPlanItem } = useMockStore();

  const product = products.find((p) => p.id === productId);
  const complementary = useMemo(() => products.filter((p) => p.id !== productId).slice(0, 4), [products, productId]);
  const myPlans = useMemo(() => plans.filter((p) => p.ownerAccountId === currentAccount?.id && p.status === "Draft"), [plans, currentAccount]);

  const [planId, setPlanId] = useState<string>("");
  const [subEventId, setSubEventId] = useState<string>("__general");
  const [quantity, setQuantity] = useState(1);
  const [length, setLength] = useState(10);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [addedTo, setAddedTo] = useState<{ planId: string; planName: string; quantity: number; startDate: string; endDate: string } | null>(null);

  if (!product) {
    return <div className="mx-auto w-full max-w-4xl px-4 py-10">Product not found.</div>;
  }

  const selectedPlan = myPlans.find((p) => p.id === planId);
  const needsDimensions = product.rateType !== "Qty";

  function handleAdd() {
    if (!currentAccount) {
      router.push("/signup");
      return;
    }
    if (!planId) {
      toast.error("Choose a plan to add this to.");
      return;
    }
    addPlanItem(planId, {
      productId: product!.id,
      quantity,
      subEventId: subEventId === "__general" ? null : subEventId,
      dimensions: needsDimensions ? { length } : undefined,
      rentalStart: startDate || undefined,
      rentalEnd: endDate || undefined,
    });
    const plan = myPlans.find((p) => p.id === planId);
    setAddedTo({ planId, planName: plan?.name ?? "your plan", quantity, startDate, endDate });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground md:mb-6">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={`/catalog?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </div>

      <section className="grid gap-8 md:grid-cols-[55%_45%]">
        <ProductThumb imageUrl={product.imageUrl} alt={product.name} className="h-[320px] rounded-xl bg-[#F5EFE6] p-6 md:h-[560px]" />

        <div className="flex flex-col gap-6 rounded-xl bg-card p-6">
          <div className="flex flex-col gap-4">
            <h1 className="font-serif text-3xl text-foreground md:text-4xl">{product.name}</h1>
            <div className="flex flex-wrap gap-2">
              {[product.category, "Standard"].map((tag) => (
                <span key={tag} className="rounded-full border border-primary px-3 py-1 text-xs text-primary">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-end justify-between border-b border-primary/20 pb-5">
              <div>
                <p className="font-medium text-2xl text-foreground">
                  {formatRupees(product.basePrice)} / {product.rateType === "Qty" ? "day" : rateTypeLabel(product.rateType)}
                </p>
                <p className="mt-1 text-sm text-primary">{rateTypeLabel(product.rateType).replace(/^\w/, (c) => c.toUpperCase())}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-serif text-xl text-foreground">Rental Dates</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-muted-foreground">Start date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-muted-foreground">End date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>

          {needsDimensions ? (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-foreground">{product.rateType === "SqFt" ? "Area (sq ft)" : "Length (running ft)"}</span>
              <Input type="number" min={1} value={length} onChange={(e) => setLength(Number(e.target.value))} className="w-28" />
            </div>
          ) : (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="font-serif text-xl text-foreground">Quantity</span>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="rounded-full border-primary text-primary" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                  <Minus className="size-4" />
                </Button>
                <span className="w-5 text-center text-lg">{quantity}</span>
                <Button variant="outline" size="icon" className="rounded-full border-primary text-primary" onClick={() => setQuantity((q) => q + 1)}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-sm text-primary">
            <Check className="size-4" />
            Available for selected dates
          </div>

          {currentAccount ? (
            <>
              <div className="hidden flex-col gap-2 md:flex">
                <Label className="text-sm text-muted-foreground">Add to</Label>
                <Select value={planId} onValueChange={(v) => v && setPlanId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a Plan" />
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
              {selectedPlan && selectedPlan.subEvents.length > 0 && (
                <div className="flex flex-col gap-2">
                  <Label className="text-sm text-muted-foreground">Tag to sub-event</Label>
                  <Select value={subEventId} onValueChange={(v) => v && setSubEventId(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__general">General (no sub-event)</SelectItem>
                      {selectedPlan.subEvents.map((se) => (
                        <SelectItem key={se.id} value={se.id}>
                          {se.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button className="w-full rounded-lg bg-primary text-primary-foreground" onClick={handleAdd}>
                Add to Plan
              </Button>
            </>
          ) : (
            <Button className="w-full rounded-lg bg-primary text-primary-foreground" nativeButton={false} render={<Link href="/signup">Sign up to add to a plan</Link>} />
          )}
        </div>
      </section>

      <section className="mt-10 flex flex-col gap-4">
        <h2 className="font-serif text-2xl text-foreground">Complementary Products</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {complementary.map((p) => (
            <Link key={p.id} href={`/catalog/${p.id}`} className="flex flex-col gap-3 rounded-xl bg-card p-3">
              <ProductThumb imageUrl={p.imageUrl} alt={p.name} className="h-32 rounded-lg md:h-44" />
              <h3 className="text-sm text-foreground">{p.name}</h3>
              <p className="text-sm text-muted-foreground">From {formatRupees(p.basePrice)} / day</p>
            </Link>
          ))}
        </div>
      </section>

      {currentAccount && myPlans.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          You don&apos;t have a Draft plan yet — <Link href="/plans" className="text-primary underline">create one</Link> to add items.
        </p>
      )}

      {/* Mobile sticky add bar */}
      {currentAccount && (
        <div className="fixed inset-x-0 bottom-16 z-30 flex items-center gap-2 border-t border-primary/20 bg-background p-4 md:hidden">
          <Select value={planId} onValueChange={(v) => v && setPlanId(v)}>
            <SelectTrigger className="h-11 flex-1 border-primary/50 bg-card">
              <SelectValue placeholder="Add to: Select a Plan" />
            </SelectTrigger>
            <SelectContent>
              {myPlans.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="h-11 bg-primary text-primary-foreground" onClick={handleAdd}>
            Add to Plan
          </Button>
        </div>
      )}

      <Dialog open={!!addedTo} onOpenChange={(open) => !open && setAddedTo(null)}>
        <DialogContent className="text-center sm:max-w-md">
          <DialogHeader className="items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-full border border-primary text-primary">
              <Check className="size-7" />
            </div>
            <DialogTitle className="font-serif text-3xl text-foreground">Added to Plan</DialogTitle>
            <p className="text-foreground">{product.name} has been added to your plan.</p>
          </DialogHeader>
          {addedTo && (
            <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-background p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Rental dates</span>
                <span className="text-foreground">{addedTo.startDate && addedTo.endDate ? `${addedTo.startDate} – ${addedTo.endDate}` : "—"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Quantity</span>
                <span className="text-foreground">{addedTo.quantity}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Destination plan</span>
                <span className="text-right text-primary">{addedTo.planName}</span>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Button className="w-full bg-primary text-primary-foreground" onClick={() => router.push(`/plans/${addedTo?.planId}`)}>
              View My Plans
            </Button>
            <Button variant="outline" className="w-full border-primary text-primary" onClick={() => setAddedTo(null)}>
              Continue Browsing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
