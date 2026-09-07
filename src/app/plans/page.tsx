"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";

// Flow 2: Plan Board — a customer can have multiple Plans open at once.
export default function PlansPage() {
  const account = useRequireAccount();
  const { plans, createPlan } = useMockStore();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  if (!account) return null;

  const myPlans = plans.filter((p) => p.ownerAccountId === account.id || p.coOwners.some((c) => c.accountId === account.id));

  function handleCreate() {
    if (!name.trim()) return;
    const plan = createPlan(name.trim());
    setName("");
    setOpen(false);
    toast.success(`Created "${plan.name}"`);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plan Board</h1>
          <p className="mt-1 text-muted-foreground">Your event plans, each with optional sub-events.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button>New plan</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="plan-name">Plan name</Label>
              <Input id="plan-name" placeholder="Priya's Wedding" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <DialogFooter>
              <Button onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {myPlans.map((plan) => {
          const isOwner = plan.ownerAccountId === account.id;
          return (
            <Link key={plan.id} href={`/plans/${plan.id}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="secondary">{plan.status}</Badge>
                    {!isOwner && <Badge variant="outline">Shared with you</Badge>}
                  </div>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.items.length} item{plan.items.length === 1 ? "" : "s"} · {plan.subEvents.length} sub-event
                    {plan.subEvents.length === 1 ? "" : "s"}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
        {myPlans.length === 0 && <p className="text-muted-foreground">No plans yet — create one to get started.</p>}
      </div>
    </div>
  );
}
