"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { COLLECTIONS } from "@/mock-data/seed";
import type { Plan, PlanStatus } from "@/mock-data/types";

// Flowstep screens 17 (desktop, populated) / 18 (mobile, empty state).
const STATUS_STYLE: Record<PlanStatus, string> = {
  Draft: "border border-muted-foreground text-muted-foreground",
  Submitted: "border border-primary text-primary",
  Quoted: "border border-primary text-primary",
  PartiallyAccepted: "border border-primary text-primary",
  Ordered: "bg-primary text-primary-foreground",
  Cancelled: "border border-destructive/60 bg-destructive/10 text-destructive",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function PlanCard({ plan }: { plan: Plan }) {
  const { accounts } = useMockStore();
  const cover = COLLECTIONS[plan.id.charCodeAt(plan.id.length - 1) % COLLECTIONS.length]?.heroImageUrl;
  const eventDate = plan.subEvents[0]?.eventDate;
  const owner = accounts.find((a) => a.id === plan.ownerAccountId);
  const collaborators = [owner, ...plan.coOwners.map((c) => accounts.find((a) => a.id === c.accountId))].filter(Boolean);

  return (
    <Link href={`/plans/${plan.id}`}>
      <Card className="cursor-pointer gap-4 overflow-hidden border-border bg-card p-0 transition-colors hover:border-primary">
        {cover && <img src={cover} alt="" className="h-48 w-full object-cover" />}
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-serif text-xl text-card-foreground">{plan.name}</h2>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${STATUS_STYLE[plan.status]}`}>{plan.status}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{eventDate ?? "No date set"}</span>
            <span>{plan.items.length} items</span>
          </div>
          <div className="flex items-center">
            {collaborators.map((c, i) => (
              <span
                key={c!.id}
                className={`flex size-8 items-center justify-center rounded-full border-2 border-card text-xs font-medium ${i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"} ${i > 0 ? "-ml-2" : ""}`}
              >
                {initials(c!.name)}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function PlansPage() {
  const account = useRequireAccount();
  const { plans, wishlist, createPlan } = useMockStore();
  const [name, setName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | PlanStatus>("all");
  const [sort, setSort] = useState<"event-date" | "name" | "status">("event-date");

  const myPlans = useMemo(() => {
    if (!account) return [];
    let list = plans.filter((p) => p.ownerAccountId === account.id || p.coOwners.some((c) => c.accountId === account.id));
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "status") sorted.sort((a, b) => a.status.localeCompare(b.status));
    if (sort === "event-date") sorted.sort((a, b) => (a.subEvents[0]?.eventDate ?? "9999").localeCompare(b.subEvents[0]?.eventDate ?? "9999"));
    return sorted;
  }, [plans, account, statusFilter, sort]);

  if (!account) return null;

  function handleCreate() {
    if (!name.trim()) return;
    const plan = createPlan(name.trim());
    setName("");
    setDialogOpen(false);
    toast.success(`Created "${plan.name}"`);
  }

  const NewPlanDialog = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger render={<Button className="rounded bg-primary text-primary-foreground">+ New Plan</Button>} />
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
  );

  if (myPlans.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="flex size-20 items-center justify-center rounded-2xl border border-primary bg-card text-primary">
          <CalendarDays className="size-10" />
        </div>
        <h1 className="font-serif text-2xl text-foreground">Start your first Plan</h1>
        <p className="max-w-[330px] text-sm leading-6 text-foreground/70">
          {wishlist.length > 0
            ? `You have ${wishlist.length} item${wishlist.length === 1 ? "" : "s"} saved in your Wishlist. Turn them into a Plan with an event date and sub-events like Sangeet or Reception.`
            : "Browse the catalog and add pieces to a Plan with an event date and sub-events like Sangeet or Reception."}
        </p>
        <div className="flex w-full flex-col gap-2 pt-2">
          {wishlist.length > 0 && (
            <Button className="rounded-lg bg-primary text-primary-foreground" nativeButton={false} render={<Link href="/wishlist">Create Plan from Wishlist</Link>} />
          )}
          {NewPlanDialog}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-12">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">My Plans</h1>
        {NewPlanDialog}
      </div>

      <div className="mt-8 flex items-center gap-4 border-b border-border pb-6">
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v as "all" | PlanStatus)}>
          <SelectTrigger className="w-44 rounded border-border bg-card">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Submitted">Submitted</SelectItem>
            <SelectItem value="Quoted">Quoted</SelectItem>
            <SelectItem value="PartiallyAccepted">Partially Accepted</SelectItem>
            <SelectItem value="Ordered">Ordered</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => v && setSort(v as "event-date" | "name" | "status")}>
          <SelectTrigger className="w-48 rounded border-border bg-card">
            <SelectValue placeholder="Sort: Event Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="event-date">Sort: Event Date</SelectItem>
            <SelectItem value="name">Sort: Name</SelectItem>
            <SelectItem value="status">Sort: Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {myPlans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}
