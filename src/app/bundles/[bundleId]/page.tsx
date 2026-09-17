"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem, SPRING } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DateWheelPicker } from "@/components/date-wheel-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductThumb } from "@/components/product-thumb";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";

// Flowstep screens 11 (desktop) / 12 (mobile). "Swap"/"Remove" per included
// item are shown for visual fidelity but aren't wired — the bundle always
// expands as a fixed set today.
export default function BundlePage({ params }: { params: Promise<{ bundleId: string }> }) {
  const { bundleId } = use(params);
  const router = useRouter();
  const reduce = useReducedMotion();
  const { bundles, products, currentAccount, plans, addBundleToPlan } = useMockStore();

  const bundle = bundles.find((b) => b.id === bundleId);
  const included = useMemo(() => (bundle ? bundle.includedProductIds.map((id) => products.find((p) => p.id === id)).filter(Boolean) : []), [bundle, products]);
  const subtotal = included.reduce((sum, p) => sum + (p?.basePrice ?? 0), 0);
  const others = bundles.filter((b) => b.id !== bundleId);
  const myPlans = plans.filter((p) => p.ownerAccountId === currentAccount?.id && p.status === "Draft");

  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  if (!bundle) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="font-serif text-2xl">Bundle not found</h1>
        <Button variant="outline" nativeButton={false} render={<Link href="/bundles">All bundles</Link>} />
      </div>
    );
  }

  function handleAdd() {
    if (!currentAccount) {
      router.push("/signup");
      return;
    }
    if (!planId) {
      toast.error("Choose a plan to add this bundle to.");
      return;
    }
    addBundleToPlan(planId, bundle!.id, { rentalStart: startDate || undefined, rentalEnd: endDate || undefined });
    toast.success(`${bundle!.name} added — ${included.length} items in your plan.`);
    router.push(`/plans/${planId}`);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-40 md:py-8 md:pb-8">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-primary">
          Home
        </Link>
        <ChevronRight className="size-3 opacity-60" />
        <Link href="/bundles" className="transition-colors hover:text-primary">
          Bundles
        </Link>
        <ChevronRight className="size-3 opacity-60" />
        <span className="truncate text-foreground">{bundle.name}</span>
      </nav>

      <Reveal immediate direction="up" distance={16}>
        <div className="h-72 w-full overflow-hidden rounded-2xl bg-muted shadow-e2 ring-1 ring-foreground/5 md:h-[420px]">
          <ProductThumb imageUrl={bundle.imageUrl} alt={bundle.name} className="size-full rounded-none bg-transparent" />
        </div>
      </Reveal>

      <Reveal immediate delay={0.08} className="mt-7 flex flex-col gap-2.5">
        <span className="text-xs font-medium tracking-[0.14em] text-primary uppercase">{bundle.occasion}</span>
        <h1 className="font-serif text-3xl leading-tight text-foreground md:text-4xl">{bundle.name}</h1>
        <p className="text-lg text-foreground/85">{bundle.tagline}</p>
        <p className="font-serif text-2xl text-primary">
          From {formatRupees(subtotal)} <span className="font-sans text-sm text-muted-foreground">/ event</span>
        </p>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">{bundle.description}</p>

        <dl className="mt-3 grid max-w-2xl grid-cols-3 gap-3">
          {[
            { label: "Guests", value: bundle.guests },
            { label: "Setup time", value: bundle.setupTime },
            { label: "Pieces", value: String(included.length) },
          ].map((f) => (
            <div key={f.label} className="rounded-xl border border-border bg-card px-4 py-3 shadow-e1">
              <dt className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase">{f.label}</dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">{f.value}</dd>
            </div>
          ))}
        </dl>

        <ul className="mt-3 grid max-w-3xl gap-2 sm:grid-cols-2">
          {bundle.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2.5 text-sm leading-6 text-foreground/85">
              <Check className="mt-1 size-4 shrink-0 text-primary" />
              {h}
            </li>
          ))}
        </ul>
      </Reveal>

      <section className="mt-10 grid items-start gap-8 md:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl text-foreground">Included Items</h2>
          <Stagger gap={0.05} className="flex flex-col gap-3">
            {included.map((p) =>
              p ? (
                <StaggerItem key={p.id} distance={12}>
                  <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-e1 transition-colors duration-200 ease-out-quint hover:border-primary/40">
                    <ProductThumb imageUrl={p.imageUrl} alt={p.name} className="size-16 shrink-0 rounded-lg" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <h3 className="text-base font-medium text-foreground">{p.name}</h3>
                      <p className="text-sm leading-6 text-muted-foreground">Included — breaks into individually priced line items at checkout</p>
                      <div className="flex gap-4 pt-1.5 text-xs">
                        <button className="text-primary underline-offset-4 transition-colors hover:underline">Swap</button>
                        <button className="text-muted-foreground underline-offset-4 transition-colors hover:text-destructive hover:underline">Remove</button>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ) : null,
            )}
          </Stagger>
        </div>

        <Card className="sticky top-24 hidden gap-6 border-border bg-card p-6 shadow-e2 md:flex md:flex-col">
          <CardHeader className="gap-2 p-0">
            <CardTitle className="font-serif text-2xl text-foreground">Plan this bundle</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 p-0">
            <Button size="lg" onClick={handleAdd}>
              Add Full Bundle to Plan
            </Button>
            <div className="flex flex-col gap-4 border-t border-border pt-5">
              <h3 className="text-sm font-medium text-foreground">Rental time-frame</h3>
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
            {currentAccount && (
              <Select value={planId} onValueChange={(v) => v && setPlanId(v)}>
                <SelectTrigger>
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
            )}
          </CardContent>
          <CardFooter className="justify-between rounded-none border-t border-border bg-transparent p-0 pt-5">
            <span className="text-sm text-muted-foreground">Bundle subtotal</span>
            <span className="font-serif text-xl text-primary">{formatRupees(subtotal)}</span>
          </CardFooter>
        </Card>
      </section>

      <section className="mt-14 flex flex-col gap-5">
        <h2 className="font-serif text-2xl text-foreground">You might also like</h2>
        <Stagger gap={0.06} className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0">
          {others.map((b) => (
            <StaggerItem key={b.id} className="flex w-44 shrink-0 flex-col md:w-auto">
              <Card interactive className="group h-full gap-4 border-border bg-card p-4">
                <div className="overflow-hidden rounded-xl bg-muted/60">
                  <ProductThumb
                    imageUrl={b.imageUrl}
                    alt={b.name}
                    className="h-32 rounded-none bg-transparent transition-transform duration-600 ease-out-quint group-hover:scale-[1.06] md:h-48"
                  />
                </div>
                <CardHeader className="gap-2 p-0">
                  <CardTitle className="font-serif text-xl text-foreground transition-colors duration-200 ease-out-quint group-hover:text-primary">
                    {b.name}
                  </CardTitle>
                </CardHeader>
                <CardFooter className="mt-auto rounded-none border-0 bg-transparent p-0">
                  <Button variant="outline" className="w-full" nativeButton={false} render={<Link href={`/bundles/${b.id}`}>View Bundle</Link>} />
                </CardFooter>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Mobile sticky add bar — slides up once, clears the tab bar. */}
      <motion.div
        initial={{ y: reduce ? 0 : 72 }}
        animate={{ y: 0 }}
        transition={reduce ? { duration: 0.01 } : SPRING.soft}
        className="fixed inset-x-0 bottom-16 z-30 flex items-center justify-between gap-4 border-t border-border bg-background/95 p-3.5 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.4)] supports-backdrop-filter:bg-background/85 supports-backdrop-filter:backdrop-blur-xl md:hidden"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground">Bundle subtotal</span>
          <span className="font-serif text-lg text-primary">{formatRupees(subtotal)}</span>
        </div>
        <Button size="lg" className="flex-1" onClick={handleAdd}>
          Add Full Bundle to Plan
        </Button>
      </motion.div>
    </div>
  );
}
