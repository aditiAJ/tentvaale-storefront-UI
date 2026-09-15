"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
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
  const { bundles, products, currentAccount, plans, addBundleToPlan } = useMockStore();

  const bundle = bundles.find((b) => b.id === bundleId);
  const included = useMemo(() => (bundle ? bundle.includedProductIds.map((id) => products.find((p) => p.id === id)).filter(Boolean) : []), [bundle, products]);
  const subtotal = included.reduce((sum, p) => sum + (p?.basePrice ?? 0), 0);
  const others = bundles.filter((b) => b.id !== bundleId);
  const myPlans = plans.filter((p) => p.ownerAccountId === currentAccount?.id && p.status === "Draft");

  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  if (!bundle) return <div className="mx-auto w-full max-w-4xl px-4 py-10">Bundle not found.</div>;

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
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/">Home</Link>
        <ChevronRight className="size-4" />
        <span>Bundles</span>
        <ChevronRight className="size-4" />
        <span className="text-foreground">{bundle.name}</span>
      </div>

      <section className="flex flex-col gap-4">
        <div className="h-72 w-full overflow-hidden rounded-xl bg-card md:h-[420px]">
          <ProductThumb imageUrl={bundle.imageUrl} alt={bundle.name} className="size-full rounded-xl" />
        </div>
      </section>

      <section className="mt-6 flex flex-col gap-2">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">{bundle.name}</h1>
        <p className="text-xl text-primary">From {formatRupees(subtotal)} / event</p>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">{bundle.description}</p>
      </section>

      <section className="mt-8 grid items-start gap-8 md:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl text-foreground">Included Items</h2>
          {included.map((p) =>
            p ? (
              <div key={p.id} className="flex items-center gap-4 rounded-lg bg-card p-4">
                <ProductThumb imageUrl={p.imageUrl} alt={p.name} className="size-16 shrink-0 rounded-lg" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h3 className="text-base font-medium text-foreground">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">Included — breaks into individually priced line items at checkout</p>
                  <div className="flex gap-4 pt-1 text-xs">
                    <button className="text-primary underline">Swap</button>
                    <button className="text-muted-foreground underline">Remove</button>
                  </div>
                </div>
              </div>
            ) : null,
          )}
        </div>

        <Card className="sticky top-6 hidden gap-6 border-border bg-card p-6 md:flex md:flex-col">
          <CardHeader className="gap-2 p-0">
            <CardTitle className="font-serif text-2xl text-foreground">Plan this bundle</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 p-0">
            <Button className="h-11 bg-primary text-primary-foreground" onClick={handleAdd}>
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
          <CardFooter className="justify-between border-t border-border p-0 pt-5">
            <span className="text-sm text-muted-foreground">Bundle subtotal</span>
            <span className="font-medium text-primary">{formatRupees(subtotal)}</span>
          </CardFooter>
        </Card>
      </section>

      <section className="mt-10 flex flex-col gap-5">
        <h2 className="font-serif text-2xl text-foreground">You might also like</h2>
        <div className="flex gap-4 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:gap-6">
          {others.map((b) => (
            <Card key={b.id} className="w-44 shrink-0 gap-4 border-border bg-card p-4 md:w-auto">
              <ProductThumb imageUrl={b.imageUrl} alt={b.name} className="h-32 rounded-lg md:h-48" />
              <CardHeader className="gap-2 p-0">
                <CardTitle className="font-serif text-xl text-foreground">{b.name}</CardTitle>
              </CardHeader>
              <CardFooter className="p-0">
                <Button variant="outline" className="w-full border-primary text-primary" nativeButton={false} render={<Link href={`/bundles/${b.id}`}>View Bundle</Link>} />
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Mobile sticky add bar */}
      <div className="fixed inset-x-0 bottom-16 z-30 flex items-center justify-between gap-4 border-t border-border bg-card p-4 md:hidden">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Bundle subtotal</span>
          <span className="font-serif text-lg text-foreground">{formatRupees(subtotal)}</span>
        </div>
        <Button className="h-11 flex-1 bg-primary text-primary-foreground" onClick={handleAdd}>
          Add Full Bundle to Plan
        </Button>
      </div>
    </div>
  );
}
