"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductThumb } from "@/components/product-thumb";
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
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <div className="flex items-center justify-center rounded-full border border-primary/30 p-6">
          <Heart className="size-24 stroke-[1.25] text-primary" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-2xl text-foreground">Your wishlist is empty</h1>
          <p className="text-sm leading-6 text-foreground/65">Save furniture, decor and themes you love, and turn them into a Plan whenever you&apos;re ready.</p>
        </div>
        <div className="flex w-full flex-col gap-3 pt-2">
          <Button className="h-12 rounded-lg bg-primary text-primary-foreground" nativeButton={false} render={<Link href="/catalog">Browse Catalog</Link>} />
          <Button variant="outline" className="h-12 rounded-lg border-primary text-primary" nativeButton={false} render={<Link href="/collections/royal-heritage">Explore Themes</Link>} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:py-12">
      <header className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl text-foreground md:text-4xl">My Wishlist</h1>
          <p className="text-sm text-muted-foreground">{items.length} saved item{items.length === 1 ? "" : "s"}</p>
        </div>
      </header>

      <div className="flex items-center justify-between border-y border-border py-4">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={selected.size === items.length && items.length > 0}
            onCheckedChange={(v) => setSelected(v ? new Set(items.map((p) => p!.id)) : new Set())}
          />
          <span>Select all</span>
        </label>
        <div className="flex items-center gap-2">
          <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
            <DialogTrigger render={<Button variant="outline" className="border-primary text-primary">Move to a Plan</Button>} />
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
            variant="outline"
            className="border-primary text-primary"
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {items.map((p) => {
          if (!p) return null;
          return (
            <Card key={p.id} className="relative gap-4 border-border bg-card p-4">
              <div className="absolute top-6 left-6 z-10">
                <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
              </div>
              <button className="absolute top-6 right-6 z-10 flex size-8 items-center justify-center rounded-full bg-background/70" onClick={() => toggleWishlist(p.id)}>
                <Heart className="size-5 fill-primary text-primary" />
              </button>
              <ProductThumb imageUrl={p.imageUrl} alt={p.name} className="aspect-[4/3] rounded-lg bg-muted" />
              <div className="flex flex-col gap-2">
                <Link href={`/catalog/${p.id}`} className="font-serif text-xl text-card-foreground hover:text-primary">
                  {p.name}
                </Link>
                <p className="text-sm text-muted-foreground">From {formatRupees(p.basePrice)} / day</p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-primary/60 px-2 py-1 text-xs text-primary">{rateTypeLabel(p.rateType)}</span>
                  <button className="text-sm text-primary underline-offset-4 hover:underline" onClick={() => toggleWishlist(p.id)}>
                    Remove
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="flex flex-col items-start justify-between gap-6 border-primary bg-card p-6 md:flex-row md:items-center">
        <div className="flex flex-col gap-2">
          <h2 className="font-serif text-2xl text-card-foreground">Ready to plan your event?</h2>
          <p className="text-sm text-muted-foreground">Turn your saved items into a Plan with dates and sub-events.</p>
        </div>
        <Button className="shrink-0 bg-primary text-primary-foreground" onClick={() => setMoveDialogOpen(true)}>
          Create a Plan from Selected Items
        </Button>
      </Card>
    </div>
  );
}
