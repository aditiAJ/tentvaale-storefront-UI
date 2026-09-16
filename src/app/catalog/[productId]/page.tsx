"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem, SPRING } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DateWheelPicker } from "@/components/date-wheel-picker";
import { NumberStepper } from "@/components/number-stepper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductThumb } from "@/components/product-thumb";
import { useMockStore } from "@/mock-data/store";
import { formatRupees, rateTypeLabel } from "@/mock-data/seed";
import { CATEGORIES, GLOBAL_FACETS, facetValues, upholsteryOptions } from "@/mock-data/taxonomy";
import { FabricPicker } from "@/components/fabric-picker";

// Flowstep screens 9 (desktop) / 10 (mobile), fileId 8bd03b8a-4561-4b58-bb2d-ca011d84d53e.
// The "Added to Plan" confirmation (screens 52/54) is a dialog here rather
// than an immediate redirect, so the shopper can keep browsing complementary
// products from the same page.
export default function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const router = useRouter();
  const reduce = useReducedMotion();
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
  const [fabric, setFabric] = useState<string | undefined>(undefined);
  const [addedTo, setAddedTo] = useState<{ planId: string; planName: string; quantity: number; startDate: string; endDate: string } | null>(null);

  if (!product) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="font-serif text-2xl">Product not found</h1>
        <p className="text-sm text-muted-foreground">It may have been removed, or the link is out of date.</p>
        <Button variant="outline" nativeButton={false} render={<Link href="/catalog">Back to catalog</Link>} />
      </div>
    );
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
      fabric,
    });
    const plan = myPlans.find((p) => p.id === planId);
    setAddedTo({ planId, planName: plan?.name ?? "your plan", quantity, startDate, endDate });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground md:mb-6" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-primary">
          Home
        </Link>
        <ChevronRight className="size-3 opacity-60" />
        <Link href={`/catalog?category=${encodeURIComponent(product.category)}`} className="transition-colors hover:text-primary">
          {product.category}
        </Link>
        <ChevronRight className="size-3 opacity-60" />
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <section className="grid gap-6 md:grid-cols-[55%_45%] md:gap-8">
        {/* Image column sticks while the long configuration panel scrolls — the
            thing being bought stays on screen the whole time it's configured. */}
        <Reveal immediate direction="up" distance={16} className="md:sticky md:top-24 md:self-start">
          <ProductThumb
            imageUrl={product.imageUrl}
            alt={product.name}
            // Was a hardcoded #F5EFE6, which put an ivory slab on the charcoal
            // theme. `bg-muted` tracks whichever theme is active.
            className="h-[320px] rounded-2xl bg-muted p-6 shadow-e2 ring-1 ring-foreground/5 md:h-[560px]"
          />
        </Reveal>

        <Reveal immediate direction="up" distance={16} delay={0.08} className="flex flex-col gap-6 rounded-2xl bg-card p-5 shadow-e1 ring-1 ring-foreground/8 md:p-6">
          <div className="flex flex-col gap-4">
            <h1 className="font-serif text-3xl leading-tight text-foreground md:text-4xl">{product.name}</h1>
            <div className="flex flex-wrap gap-2">
              {[product.category, product.subcategory ?? "Standard"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary ring-1 ring-primary/30 ring-inset"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-end justify-between border-b border-primary/20 pb-5">
              <div>
                <p className="font-serif text-3xl text-foreground">
                  {formatRupees(product.basePrice)}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / {product.rateType === "Qty" ? "day" : rateTypeLabel(product.rateType)}
                  </span>
                </p>
                <p className="mt-1.5 text-sm text-primary">{rateTypeLabel(product.rateType).replace(/^\w/, (c) => c.toUpperCase())}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-serif text-xl text-foreground">Rental Dates</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-muted-foreground">Start date</Label>
                <DateWheelPicker value={startDate} onChange={setStartDate} />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-muted-foreground">End date</Label>
                <DateWheelPicker value={endDate} min={startDate || undefined} onChange={setEndDate} />
              </div>
            </div>
          </div>

          {(() => {
            // Every facet this product has a value for: size, the category's own facets, then the global ones.
            const facets = [...(CATEGORIES.find((c) => c.name === product.category)?.facets ?? []), ...GLOBAL_FACETS.filter((f) => f.key !== "price")];
            const rows = [...(product.size ? [["Size", product.size]] : []), ...facets.map((f) => [f.label, facetValues(f, product).join(", ")]).filter(([, v]) => v && v !== "—")];
            return rows.length > 0 ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                {rows.map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase">{label}</dt>
                    <dd className="mt-0.5 text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null;
          })()}

          {upholsteryOptions(product).length > 0 && (
            <div className="border-t border-border pt-4">
              <FabricPicker options={upholsteryOptions(product)} value={fabric} onChange={setFabric} />
            </div>
          )}

          {needsDimensions ? (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-foreground">{product.rateType === "SqFt" ? "Area (sq ft)" : "Length (running ft)"}</span>
              <NumberStepper value={length} onChange={setLength} aria-label="Size" />
            </div>
          ) : (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="font-serif text-xl text-foreground">Quantity</span>
              <NumberStepper value={quantity} onChange={setQuantity} aria-label="Quantity" />
            </div>
          )}

          <div className="flex items-center gap-2.5 rounded-xl bg-[color-mix(in_oklab,var(--success)_10%,transparent)] px-4 py-3 text-sm text-[var(--success)] ring-1 ring-[color-mix(in_oklab,var(--success)_28%,transparent)] ring-inset">
            <Check className="size-4 shrink-0" />
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
              <Button size="lg" className="w-full" onClick={handleAdd}>
                Add to Plan
              </Button>
            </>
          ) : (
            <Button size="lg" className="w-full" nativeButton={false} render={<Link href="/signup">Sign up to add to a plan</Link>} />
          )}
        </Reveal>
      </section>

      <section className="mt-14 flex flex-col gap-5">
        <h2 className="font-serif text-2xl text-foreground">Complementary Products</h2>
        <Stagger gap={0.05} className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {complementary.map((p) => (
            <StaggerItem key={p.id} className="flex flex-col">
              <Link
                href={`/catalog/${p.id}`}
                className="surface-interactive group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-e1 hover:border-primary/50"
              >
                <div className="overflow-hidden rounded-xl bg-muted/60">
                  <ProductThumb
                    imageUrl={p.imageUrl}
                    alt={p.name}
                    className="h-32 rounded-none bg-transparent transition-transform duration-600 ease-out-quint group-hover:scale-[1.06] md:h-44"
                  />
                </div>
                <h3 className="line-clamp-2 px-1 text-sm leading-snug font-medium text-foreground transition-colors duration-200 ease-out-quint group-hover:text-primary">
                  {p.name}
                </h3>
                <p className="mt-auto px-1 pb-1 text-sm text-muted-foreground">From {formatRupees(p.basePrice)} / day</p>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {currentAccount && myPlans.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          You don&apos;t have a Draft plan yet — <Link href="/plans" className="text-primary underline">create one</Link> to add items.
        </p>
      )}

      {/* Mobile sticky add bar — slides up once, above the fixed tab bar. */}
      {currentAccount && (
        <motion.div
          initial={{ y: reduce ? 0 : 64 }}
          animate={{ y: 0 }}
          transition={reduce ? { duration: 0.01 } : SPRING.soft}
          className="fixed inset-x-0 bottom-16 z-30 flex items-center gap-2 border-t border-border bg-background/95 p-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.4)] supports-backdrop-filter:bg-background/85 supports-backdrop-filter:backdrop-blur-xl md:hidden"
        >
          <Select value={planId} onValueChange={(v) => v && setPlanId(v)}>
            <SelectTrigger className="h-11 flex-1 border-primary/40 bg-card">
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
          <Button size="lg" onClick={handleAdd}>
            Add to Plan
          </Button>
        </motion.div>
      )}

      <Dialog open={!!addedTo} onOpenChange={(open) => !open && setAddedTo(null)}>
        <DialogContent className="text-center sm:max-w-md">
          <DialogHeader className="items-center gap-3">
            {/* The tick springs in a beat after the dialog lands, so the
                confirmation reads as a result rather than page furniture. */}
            <motion.div
              initial={{ scale: reduce ? 1 : 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={reduce ? { duration: 0.01 } : { ...SPRING.snappy, delay: 0.1 }}
              className="flex size-14 items-center justify-center rounded-full bg-primary/12 text-primary ring-1 ring-primary/40"
            >
              <Check className="size-7" />
            </motion.div>
            <DialogTitle className="font-serif text-3xl text-foreground">Added to Plan</DialogTitle>
            <p className="text-sm text-muted-foreground">{product.name} has been added to your plan.</p>
          </DialogHeader>
          {addedTo && (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
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
          <div className="flex flex-col gap-2.5">
            <Button size="lg" className="w-full" onClick={() => router.push(`/plans/${addedTo?.planId}`)}>
              View My Plans
            </Button>
            <Button size="lg" variant="outline" className="w-full" onClick={() => setAddedTo(null)}>
              Continue Browsing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
