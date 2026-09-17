"use client";

import { FileText, CreditCard, TriangleAlert, Truck } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRequireAccount } from "@/features/auth";

// Flowstep screen 38 (desktop) — mobile 39 not fetched; stacks naturally.
// No real notification-generation system exists yet (would need to hook into
// every store action that currently just shows a toast) — this is demo
// content matching the design, not derived from live account activity.
const NOTIFICATIONS: { icon: typeof FileText; tone: "accent" | "warning"; text: string; time: string; unread: boolean }[] = [
  { icon: FileText, tone: "accent", text: "Quotation Round 3 ready for Rhea & Arjun Wedding — review and accept", time: "2:15 PM", unread: true },
  { icon: CreditCard, tone: "accent", text: "Payment received for Priya's Haldi — Order #TV-33902 confirmed", time: "11:02 AM", unread: true },
  // Was text-amber-400, a raw Tailwind colour outside the palette. --warning
  // is the themed equivalent and tracks light/dark.
  { icon: TriangleAlert, tone: "warning", text: "Quotation for Rhea & Arjun Wedding expires in 5 days", time: "4:40 PM", unread: false },
  { icon: Truck, tone: "accent", text: "Order #TV-58213 dispatched from warehouse", time: "9:20 AM", unread: false },
  { icon: FileText, tone: "accent", text: "Quotation Round 1 submitted for review", time: "6:05 PM", unread: false },
];

export default function NotificationsPage() {
  const account = useRequireAccount();
  if (!account) return null;

  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
      <Reveal immediate className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-6">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">Notifications</h1>
        {unreadCount > 0 && <Badge variant="accent">{unreadCount} unread</Badge>}
      </Reveal>

      <Stagger immediate gap={0.05} delay={0.05} className="flex flex-col gap-3 pt-8">
        {NOTIFICATIONS.map((n, i) => {
          const Icon = n.icon;
          return (
            <StaggerItem key={i} distance={12}>
              <button
                className={cn(
                  "flex w-full items-center gap-4 rounded-xl border bg-card px-5 py-4 text-left shadow-e1 transition-[border-color,background-color,transform,box-shadow] duration-200 ease-out-quint hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-e2 active:translate-y-0",
                  // Unread rows carry a tinted surface and a gold leading edge
                  // so the queue can be triaged without reading every line.
                  n.unread ? "border-primary/30 bg-primary/[0.04]" : "border-border",
                )}
              >
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-sm",
                    n.tone === "warning"
                      ? "bg-[color-mix(in_oklab,var(--warning)_14%,transparent)] text-[var(--warning)]"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    {n.unread && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                    <p className={cn("leading-6", n.unread ? "font-medium text-foreground" : "text-foreground/85")}>{n.text}</p>
                  </div>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{n.time}</span>
              </button>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}
