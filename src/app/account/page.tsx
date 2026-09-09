"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";

// Flowstep screen 40 (desktop) — mobile 41 not fetched; stacks naturally.
export default function AccountPage() {
  const account = useRequireAccount();
  const router = useRouter();
  const { plans, orders, addresses, addAddress, removeAddress, logout } = useMockStore();

  const [emailNotify, setEmailNotify] = useState(true);
  const [whatsappNotify, setWhatsappNotify] = useState(true);
  const [addrDialogOpen, setAddrDialogOpen] = useState(false);
  const [addrLabel, setAddrLabel] = useState("");
  const [addrDetail, setAddrDetail] = useState("");

  if (!account) return null;

  const myPlans = plans.filter((p) => p.ownerAccountId === account.id);
  const sharedPlans = plans.filter((p) => p.coOwners.some((c) => c.accountId === account.id));
  const myOrders = orders.filter((o) => myPlans.some((p) => p.id === o.planId));

  function handleAddAddress() {
    if (!addrLabel.trim() || !addrDetail.trim()) return;
    addAddress(addrLabel.trim(), addrDetail.trim());
    setAddrLabel("");
    setAddrDetail("");
    setAddrDialogOpen(false);
  }

  const NAV_SECTIONS = ["Profile", "Addresses", "Notifications", "Shared Plans", "Order History", "Logout"];

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-8 px-4 py-10 md:px-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <h1 className="font-serif text-3xl text-foreground">Account</h1>
        <nav className="mt-8 flex flex-col gap-2">
          {NAV_SECTIONS.map((s) => (
            <a key={s} href={`#${s.toLowerCase().replace(/\s+/g, "-")}`} className="rounded px-4 py-3 text-sm text-foreground/70 hover:text-primary">
              {s}
            </a>
          ))}
        </nav>
      </aside>

      <section className="max-w-4xl flex-1">
        <h1 className="mb-6 font-serif text-3xl text-foreground md:hidden">Account</h1>

        <div id="profile" className="mb-6 rounded-lg bg-card p-6">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-5">
              <div className="flex size-20 items-center justify-center rounded-full border border-primary bg-background font-serif text-2xl text-primary">
                {account.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="mb-1 font-serif text-2xl text-foreground">{account.name}</h2>
                <p className="mb-1 text-sm text-foreground/70">{account.email}</p>
                <p className="mb-1 text-sm text-foreground/70">{account.phone || "No phone on file"}</p>
                <Badge variant="outline" className="mt-2 border-primary text-primary">
                  {account.accountType === "Customer" ? "Customer" : "Event Planner"}
                </Badge>
              </div>
            </div>
            <Button variant="outline" className="border-primary text-primary" onClick={() => toast.info("Profile editing isn't wired up yet.")}>
              Edit Profile
            </Button>
          </div>
        </div>

        <div id="addresses" className="mb-6 rounded-lg bg-card p-6">
          <h2 className="font-serif text-xl text-foreground">Saved Addresses</h2>
          <div className="mt-4">
            {addresses.map((a, i) => (
              <div key={a.id} className={i > 0 ? "flex items-center justify-between gap-6 border-t border-primary/15 pt-4 pb-4" : "flex items-center justify-between gap-6 pb-4"}>
                <div>
                  <p className="text-sm font-medium text-foreground">{a.label}</p>
                  <p className="mt-1 text-sm text-foreground/65">{a.detail}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <button className="text-primary" onClick={() => toast.info("Editing addresses isn't wired up yet.")}>
                    Edit
                  </button>
                  <button className="text-primary" onClick={() => removeAddress(a.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {addresses.length === 0 && <p className="text-sm text-muted-foreground">No saved addresses yet.</p>}
          </div>
          <Dialog open={addrDialogOpen} onOpenChange={setAddrDialogOpen}>
            <DialogTrigger render={<Button variant="outline" className="mt-4 border-primary text-primary">+ Add Address</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add address</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="addr-label">Label</Label>
                  <Input id="addr-label" placeholder="Home" value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addr-detail">Address</Label>
                  <Input id="addr-detail" placeholder="24 Carter Road, Bandra West, Mumbai 400050" value={addrDetail} onChange={(e) => setAddrDetail(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddAddress}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div id="notifications" className="mb-6 rounded-lg bg-card p-6">
          <h2 className="font-serif text-xl text-foreground">Notification Preferences</h2>
          <div className="mt-4">
            <div className="flex items-center justify-between border-b border-primary/15 pt-4 pb-4">
              <span className="text-sm text-foreground">Email notifications</span>
              <Switch checked={emailNotify} onCheckedChange={setEmailNotify} />
            </div>
            <div className="flex items-center justify-between pt-4 pb-4">
              <span className="text-sm text-foreground">WhatsApp notifications</span>
              <Switch checked={whatsappNotify} onCheckedChange={setWhatsappNotify} />
            </div>
          </div>
        </div>

        <div id="shared-plans" className="mb-6 rounded-lg bg-card p-6">
          <h2 className="font-serif text-xl text-foreground">Shared / Co-Owned Plans</h2>
          <div className="mt-4">
            {sharedPlans.map((p, i) => {
              const role = p.coOwners.find((c) => c.accountId === account.id)?.role;
              return (
                <div key={p.id} className={i > 0 ? "flex items-center justify-between border-t border-primary/15 pt-4 pb-4" : "flex items-center justify-between pb-4"}>
                  <div>
                    <p className="text-sm text-foreground">{p.name}</p>
                    <p className="mt-1 text-xs text-foreground/60">{role === "CoOwner" ? "Co-Owner" : "View-Only Planner"}</p>
                  </div>
                  <Link href={`/plans/${p.id}`} className="text-sm text-primary">
                    View Plan
                  </Link>
                </div>
              );
            })}
            {sharedPlans.length === 0 && <p className="text-sm text-muted-foreground">No shared plans yet.</p>}
          </div>
        </div>

        <div id="order-history" className="mb-6 rounded-lg bg-card p-6">
          <h2 className="font-serif text-xl text-foreground">Order History</h2>
          <div className="mt-4">
            {myOrders.map((o, i) => {
              const p = myPlans.find((pl) => pl.id === o.planId);
              return (
                <div key={o.id} className={i > 0 ? "flex items-center justify-between border-t border-primary/15 pt-4 pb-4" : "flex items-center justify-between pb-4"}>
                  <div>
                    <p className="text-sm text-foreground">
                      Order #{o.id} — {p?.name}
                    </p>
                    <p className="mt-1 text-xs text-foreground/60">
                      {p?.subEvents[0]?.eventDate ?? "No date"} — {p?.status}
                    </p>
                  </div>
                  <Link href={`/orders/${o.id}`} className="text-sm text-primary">
                    View Order
                  </Link>
                </div>
              );
            })}
            {myOrders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-card/60 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-serif text-xl text-foreground">For Professionals</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/65">
                Are you an Event Planner managing multiple clients? Switch your account type to unlock planner tools.
              </p>
            </div>
            <Button variant="outline" className="shrink-0 border-primary text-primary" nativeButton={false} render={<Link href="/for-professionals">Learn More</Link>} />
          </div>
        </div>

        <div id="logout" className="flex justify-end">
          <Button
            variant="outline"
            className="border-destructive text-destructive"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            Log Out
          </Button>
        </div>
      </section>
    </div>
  );
}
