"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Check, ChevronRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem, SPRING } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductThumb } from "@/components/product-thumb";
import { ApiError } from "@/services/api-client";
import { formatMoney } from "@/lib/money";
import { useMockStore } from "@/mock-data/store";
import { useBundle, useBundles } from "@/features/catalog/hooks";
import type { BundleDetail } from "@/features/catalog/types";
import { usePlanActions } from "@/features/plans/hooks";
import { addBundle as apiAddBundle } from "@/features/plans/api";
import { PlanTargetFields, usePlanTarget } from "@/features/plans/target";
import { CreatePlanDialog } from "@/features/plans/components/CreatePlanDialog";
import { formatEventDate, formatEventDateRange } from "@/mock-data/seed";
import type { Money } from "@/lib/money";

/** One line of the bundle as the shopper has set it up: each item, or the alternative swapped in. */
interface BundleLine {
  productId: number;
  variantId?: number | null;
  name: string;
  imageUrl?: string;
  dailyRate: Money;
  quantity: number;
}

// Flowstep screens 11 (desktop) / 12 (mobile).
// Each included item can be swapped for one of the alternatives the vendor allows for it (and only
// those). Anything else is edited in the plan afterwards, where a bundle is just its items.

function BundleSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl py-6 md:py-8 page-x">
      <Skeleton className="mb-6 h-4 w-56" />
      <Skeleton className="h-72 w-full rounded-2xl md:h-[420px]" />
      <div className="mt-7 flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    </div>
  );
}

export default function BundlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const query = useBundle(slug);
  const others = useBundles();
  const bundle = query.data;

  if (query.isPending) return <BundleSkeleton />;

  if (!bundle) {
    const missing = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 py-24 text-center page-x">
        <h1 className="font-serif text-2xl">{missing ? "Bundle not found" : "We couldn't load this bundle"}</h1>
        <div className="flex gap-2">
          {!missing && (
            <Button variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
          )}
          <Button variant="outline" nativeButton={false} render={<Link href="/bundles">All bundles</Link>} />
        </div>
      </div>
    );
  }

  // Keyed by slug so moving between bundles starts with its own swaps and dates.
  return <BundleView key={bundle.slug} bundle={bundle} others={(others.data ?? []).filter((b) => b.slug !== bundle.slug).slice(0, 3)} />;
}

function BundleView({ bundle, others }: { bundle: BundleDetail; others: { id: number; slug: string; name: string; imageUrl?: string }[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { currentAccount } = useMockStore();
  const target = usePlanTarget();
  const actions = usePlanActions(target.planId);

  // item index -> index into that item's swap options (undefined = the bundle's own pick).
  const [swaps, setSwaps] = useState<Record<number, number | undefined>>({});

  /** The lines as they stand: each item, or the alternative the shopper swapped it for. */
  const lines: (BundleLine & { slug: string; swappable: boolean; swapped: boolean })[] = useMemo(
    () =>
      bundle.items.map((item, i) => {
        const option = swaps[i] === undefined ? undefined : item.swapOptions[swaps[i]!];
        return {
          productId: option?.productId ?? item.productId,
          variantId: option ? option.variantId : item.variantId,
          name: option?.name ?? item.name,
          slug: option?.slug ?? item.slug,
          imageUrl: option ? undefined : item.imageUrl,
          dailyRate: option?.dailyRate ?? item.dailyRate,
          quantity: item.quantity,
          swappable: item.swapOptions.length > 0,
          swapped: !!option,
        };
      }),
    [bundle.items, swaps],
  );
  // A display estimate for one day; the quotation is what prices the plan.
  const subtotal = lines.reduce((sum, l) => sum + l.dailyRate.amount * l.quantity, 0);
  const subtotalMoney = { ...bundle.fromPricePerEvent, amount: subtotal };
  const percent = bundle.discountPercent ?? 0;
  // The same percentage applies to what the shopper has set up (swaps change the sum, not the percentage).
  const discountedMoney = { ...bundle.fromPricePerEvent, amount: Math.round(subtotal * (100 - percent)) / 100 };
  // What the "create a plan" popup was opened for: to keep customizing, or to send for a quotation.
  const [createFor, setCreateFor] = useState<"customize" | "send" | null>(null);

  /**
   * The rental window comes from the plan, never from a free calendar: a bundle placed on a function
   * is charged for that function's date (the backend works the days out), and one placed on the whole
   * event for the event's own dates.
   */
  const chosenFunction = target.subEventId ? target.subEvents.find((s) => s.id === target.subEventId) : undefined;
  const rentalStart = target.subEventId ? undefined : target.plan?.eventDate;
  const rentalEnd = target.subEventId ? undefined : target.plan?.eventEndDate;
  const rentalNote = !target.plan
    ? null
    : chosenFunction
      ? chosenFunction.scheduledOn
        ? { ok: true, text: `Rented for ${chosenFunction.name}: ${formatEventDate(chosenFunction.scheduledOn)}.` }
        : { ok: false, text: `${chosenFunction.name} has no date yet. Add one on your plan so the right days are priced.` }
      : target.plan.eventDate
        ? { ok: true, text: `Rented for your event: ${formatEventDateRange(target.plan.eventDate, target.plan.eventEndDate)}.` }
        : { ok: false, text: "Your plan has no event dates yet. Add them on the plan page so the right days are priced." };
  const chosenSwaps = bundle.items.flatMap((item, i) => {
    const option = swaps[i] === undefined ? undefined : item.swapOptions[swaps[i]!];
    return option ? [{ productId: item.productId, variantId: item.variantId, toProductId: option.productId, toVariantId: option.variantId }] : [];
  });

  /**
   * Puts the bundle into the shopper's plan (their swaps included), then either shows them the plan
   * or the page where the plan is reviewed and sent. A bundle is never sent without being in a plan
   * first, so what goes to the vendor is what they can see and change.
   */
  async function handleAdd(then: "customize" | "send") {
    if (!currentAccount) {
      router.push("/signup");
      return;
    }
    if (!target.planId) {
      setCreateFor(then);
      return;
    }
    const saved = await actions.addBundle({
      bundleSlug: bundle.slug,
      subEventId: target.subEventId,
      rentalStart,
      rentalEnd,
      swaps: chosenSwaps,
    });
    if (!saved) return;
    if (then === "send") {
      toast.success(`${bundle.name} added to ${saved.name}. Check it, then send it for a quotation.`);
      router.push(`/plans/${target.planId}/submit`);
    } else {
      toast.success(`${bundle.name} added: ${lines.length} items in your plan.`);
      router.push(`/plans/${target.planId}`);
    }
  }

  const guests = bundle.guestMin && bundle.guestMax ? `${bundle.guestMin}–${bundle.guestMax}` : bundle.guestMax ? `Up to ${bundle.guestMax}` : bundle.guestMin ? `${bundle.guestMin}+` : "Any";

  return (
    <div className="mx-auto w-full max-w-6xl py-6 pb-40 md:py-8 md:pb-8 page-x">
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
        {bundle.occasions.length > 0 && (
          <span className="text-xs font-medium tracking-[0.14em] text-primary uppercase">{bundle.occasions.map((o) => o.name).join(" · ")}</span>
        )}
        <h1 className="font-serif text-3xl leading-tight text-foreground md:text-4xl">{bundle.name}</h1>
        {bundle.tagline && <p className="text-lg text-foreground/85">{bundle.tagline}</p>}
        <p className="flex flex-wrap items-baseline gap-2 font-serif text-2xl text-primary">
          {percent > 0 ? (
            <>
              <span className="text-lg text-muted-foreground line-through tabular-nums">{formatMoney(subtotalMoney)}</span>
              <span className="tabular-nums">{formatMoney(discountedMoney)}</span>
            </>
          ) : (
            <>From {formatMoney(subtotalMoney)}</>
          )}
          <span className="font-sans text-sm text-muted-foreground">for one day{percent > 0 ? ` · ${percent}% off` : ""}</span>
        </p>
        {bundle.description && <p className="max-w-3xl text-base leading-7 text-muted-foreground">{bundle.description}</p>}

        <dl className="mt-3 grid max-w-2xl grid-cols-3 gap-3">
          {[
            { label: "Guests", value: guests },
            { label: "Setup time", value: bundle.setupHours ? `${bundle.setupHours} hr` : "—" },
            { label: "Pieces", value: String(lines.length) },
          ].map((f) => (
            <div key={f.label} className="rounded-xl border border-border bg-card px-4 py-3 shadow-e1">
              <dt className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase">{f.label}</dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">{f.value}</dd>
            </div>
          ))}
        </dl>

        {bundle.highlights.length > 0 && (
          <ul className="mt-3 grid max-w-3xl gap-2 sm:grid-cols-2">
            {bundle.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2.5 text-sm leading-6 text-foreground/85">
                <Check className="mt-1 size-4 shrink-0 text-primary" />
                {h}
              </li>
            ))}
          </ul>
        )}
      </Reveal>

      <section className="mt-10 grid items-start gap-8 md:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl text-foreground">Included Items</h2>
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing in this bundle is available right now.</p>
          ) : (
            <Stagger gap={0.05} className="flex flex-col gap-3">
              {lines.map((line, i) => (
                <StaggerItem key={`${bundle.items[i].productId}-${bundle.items[i].variantId ?? 0}`} distance={12}>
                  <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-e1 transition-colors duration-200 ease-out-quint hover:border-primary/40">
                    <ProductThumb imageUrl={line.imageUrl ?? bundle.items[i].imageUrl} alt={line.name} className="size-16 shrink-0 rounded-lg" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <h3 className="text-base font-medium text-foreground">
                        <Link href={`/catalog/${line.slug}`} className="transition-colors hover:text-primary">
                          {line.name}
                        </Link>
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {line.quantity > 1 ? `${line.quantity} × ` : ""}
                        {formatMoney(line.dailyRate)} · priced individually in your quotation
                      </p>
                      {line.swappable && (
                        <div className="pt-1.5">
                          <Label className="sr-only">Choose variant for {bundle.items[i].name}</Label>
                          <Select
                            value={swaps[i] === undefined ? "__own" : String(swaps[i])}
                            onValueChange={(v) => setSwaps((s) => ({ ...s, [i]: v === "__own" ? undefined : Number(v) }))}
                          >
                            <SelectTrigger className="h-8 w-full max-w-xs text-xs">
                              <SelectValue>{line.swapped ? "Swapped" : "Choose variant…"}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__own">{bundle.items[i].name} (included)</SelectItem>
                              {bundle.items[i].swapOptions.map((o, j) => (
                                <SelectItem key={`${o.productId}-${o.variantId ?? 0}`} value={String(j)}>
                                  {o.name} · {formatMoney(o.dailyRate)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>

        <Card className="sticky top-24 hidden gap-6 border-border bg-card p-6 shadow-e2 md:flex md:flex-col">
          <CardHeader className="gap-2 p-0">
            <CardTitle className="font-serif text-2xl text-foreground">Plan this bundle</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 p-0">
            <Button size="lg" onClick={() => handleAdd("customize")} disabled={lines.length === 0 || actions.saving}>
              Customize
            </Button>
            <Button size="lg" variant="outline" onClick={() => handleAdd("send")} disabled={lines.length === 0 || actions.saving}>
              {actions.saving ? "Adding…" : "Send for quotation"}
            </Button>
            <div className="flex flex-col gap-3 border-t border-border pt-5">
              <h3 className="text-sm font-medium text-foreground">Which plan, and when</h3>
              {currentAccount && <PlanTargetFields target={target} className="flex flex-col gap-3" onCreatePlan={() => setCreateFor("customize")} />}
              {rentalNote && (
                <p className={`flex items-start gap-2 text-xs leading-5 ${rentalNote.ok ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"}`}>
                  <CalendarDays className="mt-0.5 size-3.5 shrink-0" />
                  {rentalNote.text}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="justify-between rounded-none border-t border-border bg-transparent p-0 pt-5">
            <span className="text-sm text-muted-foreground">Bundle, one day{percent > 0 ? ` (${percent}% off)` : ""}</span>
            <span className="font-serif text-xl text-primary">{formatMoney(percent > 0 ? discountedMoney : subtotalMoney)}</span>
          </CardFooter>
        </Card>
      </section>

      {others.length > 0 && (
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
                    <CardTitle className="font-serif text-xl text-foreground transition-colors duration-200 ease-out-quint group-hover:text-primary">{b.name}</CardTitle>
                  </CardHeader>
                  <CardFooter className="mt-auto rounded-none border-0 bg-transparent p-0">
                    <Button variant="outline" className="w-full" nativeButton={false} render={<Link href={`/bundles/${b.slug}`}>View Bundle</Link>} />
                  </CardFooter>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      {/* Mobile sticky add bar: slides up once, clears the tab bar. */}
      <motion.div
        initial={{ y: reduce ? 0 : 72 }}
        animate={{ y: 0 }}
        transition={reduce ? { duration: 0.01 } : SPRING.soft}
        className="fixed inset-x-0 bottom-16 z-30 flex items-center justify-between gap-4 border-t border-border bg-background/95 p-3.5 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.4)] supports-backdrop-filter:bg-background/85 supports-backdrop-filter:backdrop-blur-xl md:hidden"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground">Bundle, one day{percent > 0 ? ` (${percent}% off)` : ""}</span>
          <span className="font-serif text-lg text-primary">{formatMoney(percent > 0 ? discountedMoney : subtotalMoney)}</span>
        </div>
        <Button size="lg" variant="outline" onClick={() => handleAdd("send")} disabled={lines.length === 0 || actions.saving}>
          Send
        </Button>
        <Button size="lg" className="flex-1" onClick={() => handleAdd("customize")} disabled={lines.length === 0 || actions.saving}>
          Customize
        </Button>
      </motion.div>

      <CreatePlanDialog
        open={createFor !== null}
        onOpenChange={(open) => !open && setCreateFor(null)}
        initialName={`${bundle.name} Event`}
        initialEventType={bundle.occasions[0]?.name ?? "Wedding"}
        initialGuestCount={bundle.guestMin ?? 100}
        title={`Create a plan for ${bundle.name}`}
        submitLabel={createFor === "send" ? "Create plan & review" : "Create plan & add bundle"}
        onCreated={async (newPlan) => {
          const then = createFor ?? "customize";
          // A new plan has no functions yet, so the bundle goes on the whole event (the event's own dates).
          await apiAddBundle(newPlan.id, {
            bundleSlug: bundle.slug,
            subEventId: null,
            rentalStart: newPlan.eventDate,
            rentalEnd: newPlan.eventEndDate,
            swaps: chosenSwaps,
          });
          toast.success(`Created "${newPlan.name}" and added ${bundle.name}.`);
          router.push(then === "send" ? `/plans/${newPlan.id}/submit` : `/plans/${newPlan.id}`);
        }}
      />
    </div>
  );
}
