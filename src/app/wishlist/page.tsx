"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { DUR, EASE, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductThumb } from "@/components/product-thumb";
import { cn } from "@/lib/utils";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { formatRupees, rateTypeLabel } from "@/mock-data/seed";

// Flowstep screens 15 (desktop, populated) / 16 (mobile, empty state).
// Both states are real here — which one shows depends on the actual wishlist.
export default function WishlistPage() {
  const account = useRequireAccount();
  const { products, wishlist, toggleWishlist, plans, createPlan, addPlanItem } = useMockStore();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");

  if (!account) return null;

  const items = wishlist.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  const myPlans = plans.filter((p) => p.ownerAccountId === account.id && p.status === "Draft");

  function toggleSelect(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function moveToPlan(planId: string) {
    const ids = selected.size > 0 ? Array.from(selected) : wishlist;
    for (const productId of ids) {
      addPlanItem(planId, { productId, quantity: 1, subEventId: null });
      toggleWishlist(productId);
    }
    setSelected(new Set());
    setMoveDialogOpen(false);
    toast.success(`Moved ${ids.length} item(s) to plan.`);
  }

  function createPlanFromSelected() {
    if (!newPlanName.trim()) return;
    const plan = createPlan(newPlanName.trim());
    moveToPlan(plan.id);
    setNewPlanName("");
  }

  if (items.length === 0) {
    return (
      <Reveal immediate className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-20 text-center">
        <div className="relative flex items-center justify-center rounded-full p-6 ring-1 ring-primary/25">
          <span className="absolute inset-4 rounded-full bg-primary/10 blur-2xl" aria-hidden />
          <Heart className="relative size-24 stroke-[1.25] text-primary" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-2xl text-foreground">Your wishlist is empty</h1>
          <p className="text-sm leading-6 text-muted-foreground">Save furniture, decor and themes you love, and turn them into a Plan whenever you&apos;re ready.</p>
        </div>
        <div className="flex w-full flex-col gap-3 pt-2">
          <Button size="lg" nativeButton={false} render={<Link href="/catalog">Browse Catalog</Link>} />
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/collections/royal-heritage">Explore Themes</Link>} />
        </div>
      </Reveal>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:py-12">
      <Reveal immediate className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl text-foreground md:text-4xl">My Wishlist</h1>
          <motion.p
            key={items.length}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.fast, ease: EASE.out }}
            className="text-sm text-muted-foreground"
          >
            <span className="font-medium text-foreground tabular-nums">{items.length}</span> saved item{items.length === 1 ? "" : "s"}
          </motion.p>
        </div>
      </Reveal>

      {/* Action bar sticks under the header so bulk actions stay reachable
          while scrolling a long wishlist. */}
      <div className="sticky top-16 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-y border-border bg-background/90 px-4 py-4 supports-backdrop-filter:bg-background/75 supports-backdrop-filter:backdrop-blur-lg md:top-20">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
          <Checkbox
            checked={selected.size === items.length && items.length > 0}
            onCheckedChange={(v) => setSelected(v ? new Set(items.map((p) => p!.id)) : new Set())}
          />
          <span>
            Select all
            {selected.size > 0 && <span className="ml-1.5 text-muted-foreground tabular-nums">({selected.size})</span>}
          </span>
        </label>
        <div className="flex items-center gap-2">
          <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
            <DialogTrigger render={<Button variant="outline">Move to a Plan</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Move to a plan</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                {myPlans.map((p) => (
                  <Button key={p.id} variant="outline" className="justify-start" onClick={() => moveToPlan(p.id)}>
                    {p.name}
                  </Button>
                ))}
                {myPlans.length === 0 && <p className="text-sm text-muted-foreground">No draft plans yet — create one below.</p>}
              </div>
              <div className="flex items-end gap-2 border-t border-border pt-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="new-plan">New plan name</Label>
                  <Input id="new-plan" value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} placeholder="Priya's Wedding" />
                </div>
                <Button onClick={createPlanFromSelected}>Create &amp; move</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="destructive"
            onClick={() => {
              const ids = selected.size > 0 ? Array.from(selected) : wishlist;
              ids.forEach((id) => toggleWishlist(id));
              setSelected(new Set());
            }}
          >
            Remove Selected
          </Button>
        </div>
      </div>

      {/* mode="popLayout" so removing a card lets the rest slide up to close
          the gap, rather than the grid snapping to a new arrangement. */}
      <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((p) => {
            if (!p) return null;
            const isSelected = selected.has(p.id);
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92, transition: { duration: DUR.fast, ease: EASE.in } }}
                transition={{ duration: DUR.slow, ease: EASE.out }}
              >
                <Card
                  className={cn(
                    "group relative h-full gap-4 border-border bg-card p-4 transition-[box-shadow,--tw-ring-color] duration-200 ease-out-quint",
                    // Selection is shown by the card's own ring, not just the
                    // checkbox — at a glance you can see what a bulk action hits.
                    isSelected && "ring-2 ring-primary/70",
                  )}
                >
                  <div className="absolute top-6 left-6 z-10">
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(p.id)} aria-label={`Select ${p.name}`} />
                  </div>
                  <button
                    className="press absolute top-6 right-6 z-10 flex size-9 items-center justify-center rounded-full bg-background/80 shadow-e1 backdrop-blur transition-colors hover:bg-background"
                    onClick={() => toggleWishlist(p.id)}
                    aria-label={`Remove ${p.name} from wishlist`}
                  >
                    <Heart className="size-5 fill-primary text-primary" />
                  </button>
                  <div className="overflow-hidden rounded-xl bg-muted">
                    <ProductThumb
                      imageUrl={p.imageUrl}
                      alt={p.name}
                      className="aspect-[4/3] rounded-none bg-transparent transition-transform duration-600 ease-out-quint group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/catalog/${p.id}`}
                      className="font-serif text-xl leading-snug text-card-foreground transition-colors duration-200 ease-out-quint hover:text-primary"
                    >
                      {p.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">From {formatRupees(p.basePrice)} / day</p>
                    <div className="flex items-center justify-between pt-1">
                      <Badge variant="accent">{rateTypeLabel(p.rateType)}</Badge>
                      <button
                        className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-destructive hover:underline"
                        onClick={() => toggleWishlist(p.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      <Reveal>
        <Card className="flex flex-col items-start justify-between gap-6 bg-card p-6 ring-primary/40 md:flex-row md:items-center">
          <div className="flex flex-col gap-2">
            <h2 className="font-serif text-2xl text-card-foreground">Ready to plan your event?</h2>
            <p className="text-sm text-muted-foreground">Turn your saved items into a Plan with dates and sub-events.</p>
          </div>
          <Button size="lg" className="shrink-0" onClick={() => setMoveDialogOpen(true)}>
            Create a Plan from Selected Items
          </Button>
        </Card>
      </Reveal>
    </div>
  );
}
