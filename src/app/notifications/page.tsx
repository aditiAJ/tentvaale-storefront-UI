"use client";

import { FileText, CreditCard, TriangleAlert, Truck } from "lucide-react";
import { useRequireAccount } from "@/features/auth";

// Flowstep screen 38 (desktop) — mobile 39 not fetched; stacks naturally.
// No real notification-generation system exists yet (would need to hook into
// every store action that currently just shows a toast) — this is demo
// content matching the design, not derived from live account activity.
const NOTIFICATIONS: { icon: typeof FileText; iconColor: string; text: string; time: string; unread: boolean }[] = [
  { icon: FileText, iconColor: "text-primary", text: "Quotation Round 3 ready for Rhea & Arjun Wedding — review and accept", time: "2:15 PM", unread: true },
  { icon: CreditCard, iconColor: "text-primary", text: "Payment received for Priya's Haldi — Order #TV-33902 confirmed", time: "11:02 AM", unread: true },
  { icon: TriangleAlert, iconColor: "text-amber-400", text: "Quotation for Rhea & Arjun Wedding expires in 5 days", time: "4:40 PM", unread: false },
  { icon: Truck, iconColor: "text-primary", text: "Order #TV-58213 dispatched from warehouse", time: "9:20 AM", unread: false },
  { icon: FileText, iconColor: "text-primary", text: "Quotation Round 1 submitted for review", time: "6:05 PM", unread: false },
];

export default function NotificationsPage() {
  const account = useRequireAccount();
  if (!account) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
      <div className="border-b border-border pb-6">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">Notifications</h1>
      </div>
      <div className="flex flex-col gap-3 pt-8">
        {NOTIFICATIONS.map((n, i) => {
          const Icon = n.icon;
          return (
            <button key={i} className="flex items-center gap-4 rounded-lg border border-border bg-card px-5 py-4 text-left transition-colors hover:border-primary">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <Icon className={`size-5 ${n.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  {n.unread && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
                  <p className="text-foreground">{n.text}</p>
                </div>
              </div>
              <span className="shrink-0 text-sm text-muted-foreground">{n.time}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
