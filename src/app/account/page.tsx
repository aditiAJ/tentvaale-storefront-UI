"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Reveal, SPRING, Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { planStatusLabel } from "@/mock-data/seed";

// Flowstep screen 40 (desktop) — mobile 41 not fetched; stacks naturally.
const NAV_SECTIONS = [
  { label: "Profile", id: "profile" },
  { label: "Addresses", id: "addresses" },
  { label: "Notifications", id: "notifications" },
  { label: "Shared Plans", id: "shared-plans" },
  { label: "Order History", id: "order-history" },
  { label: "Logout", id: "logout" },
];

/**
 * The account page is six near-identical panels. One component for the shell
 * and one for a list row removes five copies of the same padding, heading size
 * and divider rule — and means adjusting the panel look is a single edit.
 */
function Panel({
  id,
  title,
  action,
  children,
  muted,
}: {
  id?: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <StaggerItem id={id} distance={14} className="scroll-mt-28">
      <section
        className={cn(
          "rounded-2xl border border-border p-5 shadow-e1 md:p-6",
          muted ? "bg-card/60" : "bg-card"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-xl text-foreground">{title}</h2>
          {action}
        </div>
        <div className="mt-4">{children}</div>
      </section>
    </StaggerItem>
  );
}

/** A divided row inside a Panel. `first` suppresses the leading rule. */
function Row({ first, children }: { first?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-6 py-4",
        !first && "border-t border-border"
      )}
    >
      {children}
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="py-2 text-sm text-muted-foreground">{children}</p>;
}

export default function AccountPage() {
  const account = useRequireAccount();
  const router = useRouter();
  const { plans, orders, addresses, addAddress, removeAddress, logout } = useMockStore();

  const [emailNotify, setEmailNotify] = useState(true);
  const [whatsappNotify, setWhatsappNotify] = useState(true);
  const [addrDialogOpen, setAddrDialogOpen] = useState(false);
  const [addrLabel, setAddrLabel] = useState("");
  const [addrDetail, setAddrDetail] = useState("");
  const [activeSection, setActiveSection] = useState("profile");

  // Sidebar highlight follows the scroll position. rootMargin pins the trigger
  // line near the top of the viewport so a section lights up as its heading
  // reaches the sticky header, not when it merely enters at the bottom.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    for (const { id } of NAV_SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [account]);

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

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-8 px-4 py-10 md:px-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-24">
          <h1 className="font-serif text-3xl text-foreground">Account</h1>
          <nav className="mt-8 flex flex-col gap-1">
            {NAV_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={cn(
                  "relative rounded-lg px-4 py-2.5 text-sm transition-colors duration-200 ease-out-quint",
                  activeSection === s.id ? "text-primary" : "text-foreground/70 hover:text-foreground"
                )}
              >
                {/* One pill tracks the scrolled-to section. */}
                {activeSection === s.id && (
                  <motion.span layoutId="account-nav-pill" transition={SPRING.snappy} className="absolute inset-0 -z-10 rounded-lg bg-primary/10" />
                )}
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      <section className="max-w-4xl flex-1">
        <h1 className="mb-6 font-serif text-3xl text-foreground md:hidden">Account</h1>

        <Stagger immediate gap={0.05} className="flex flex-col gap-6">
          <Panel id="profile" title="Profile" action={
            <Button variant="outline" onClick={() => toast.info("Profile editing isn't wired up yet.")}>
              Edit Profile
            </Button>
          }>
            <div className="flex items-center gap-5">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-sm bg-primary/10 font-serif text-2xl text-primary ring-1 ring-primary/40">
                {account.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="mb-1 font-serif text-2xl text-foreground">{account.name}</h3>
                <p className="truncate text-sm text-muted-foreground">{account.email}</p>
                <p className="truncate text-sm text-muted-foreground">{account.phone || "No phone on file"}</p>
                <Badge variant="accent" className="mt-2.5">
                  {account.accountType === "Customer" ? "Customer" : "Event Planner"}
                </Badge>
              </div>
            </div>
          </Panel>

          <Panel
            id="addresses"
            title="Saved Addresses"
            action={
              <Dialog open={addrDialogOpen} onOpenChange={setAddrDialogOpen}>
                <DialogTrigger
                  render={
                    <Button variant="outline" className="gap-1.5">
                      <Plus className="size-4" /> Add Address
                    </Button>
                  }
                />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add address</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="addr-label">Label</Label>
                      <Input id="addr-label" placeholder="Home" value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addr-detail">Address</Label>
                      <Input
                        id="addr-detail"
                        placeholder="24 Carter Road, Bandra West, Mumbai 400050"
                        value={addrDetail}
                        onChange={(e) => setAddrDetail(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddAddress} disabled={!addrLabel.trim() || !addrDetail.trim()}>
                      Add
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            }
          >
            {addresses.length === 0 ? (
              <EmptyNote>No saved addresses yet.</EmptyNote>
            ) : (
              addresses.map((a, i) => (
                <Row key={a.id} first={i === 0}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{a.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p>
                  </div>
                  <div className="flex shrink-0 gap-4 text-sm">
                    <button className="text-primary underline-offset-4 transition-colors hover:underline" onClick={() => toast.info("Editing addresses isn't wired up yet.")}>
                      Edit
                    </button>
                    <button className="text-muted-foreground underline-offset-4 transition-colors hover:text-destructive hover:underline" onClick={() => removeAddress(a.id)}>
                      Remove
                    </button>
                  </div>
                </Row>
              ))
            )}
          </Panel>

          <Panel id="notifications" title="Notification Preferences">
            <Row first>
              <span className="text-sm text-foreground">Email notifications</span>
              <Switch checked={emailNotify} onCheckedChange={setEmailNotify} />
            </Row>
            <Row>
              <span className="text-sm text-foreground">WhatsApp notifications</span>
              <Switch checked={whatsappNotify} onCheckedChange={setWhatsappNotify} />
            </Row>
          </Panel>

          <Panel id="shared-plans" title="Shared / Co-Owned Plans">
            {sharedPlans.length === 0 ? (
              <EmptyNote>No shared plans yet.</EmptyNote>
            ) : (
              sharedPlans.map((p, i) => {
                const role = p.coOwners.find((c) => c.accountId === account.id)?.role;
                return (
                  <Row key={p.id} first={i === 0}>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">{p.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{role === "CoOwner" ? "Co-Owner" : "View-Only Planner"}</p>
                    </div>
                    <Link href={`/plans/${p.id}`} className="shrink-0 text-sm text-primary underline-offset-4 transition-colors hover:underline">
                      View Plan
                    </Link>
                  </Row>
                );
              })
            )}
          </Panel>

          <Panel
            id="order-history"
            title="Order History"
            action={
              <Link href="/orders" className="text-sm text-primary underline-offset-4 transition-colors hover:underline">
                View all orders
              </Link>
            }
          >
            {myOrders.length === 0 ? (
              <EmptyNote>No orders yet.</EmptyNote>
            ) : (
              myOrders.map((o, i) => {
                const p = myPlans.find((pl) => pl.id === o.planId);
                return (
                  <Row key={o.id} first={i === 0}>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">
                        Order #{o.id} — {p?.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p?.subEvents[0]?.eventDate ?? "No date"} — {p ? planStatusLabel(p.status) : "Unknown"}
                      </p>
                    </div>
                    <Link href={`/orders/${o.id}`} className="shrink-0 text-sm text-primary underline-offset-4 transition-colors hover:underline">
                      View Order
                    </Link>
                  </Row>
                );
              })
            )}
          </Panel>

          <Panel title="For Professionals" muted>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Are you an Event Planner managing multiple clients? Switch your account type to unlock planner tools.
              </p>
              <Button variant="outline" className="shrink-0" nativeButton={false} render={<Link href="/for-professionals">Learn More</Link>} />
            </div>
          </Panel>
        </Stagger>

        <Reveal id="logout" className="mt-6 flex scroll-mt-28 justify-end">
          <Button
            variant="destructive"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            Log Out
          </Button>
        </Reveal>
      </section>
    </div>
  );
}
