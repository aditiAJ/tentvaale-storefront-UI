"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRequireAccount } from "@/features/auth";
import { useInbox, useInboxActions } from "@/features/notifications/hooks";

const when = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** The customer's updates: a quotation ready, an order on its way, a deposit settled. Read from the backend. */
export default function NotificationsPage() {
  const account = useRequireAccount();
  const inbox = useInbox();
  const { read, readAll } = useInboxActions();
  if (!account) return null;

  const unread = inbox.data?.unread ?? 0;

  return (
    <div className="mx-auto w-full max-w-5xl py-8 md:py-12 page-x">
      <Reveal immediate className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-6">
        <h1 className="font-serif text-3xl text-foreground md:text-4xl">Notifications</h1>
        <div className="flex items-center gap-3">
          {unread > 0 && <Badge variant="accent">{unread} unread</Badge>}
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={() => readAll.mutate()} disabled={readAll.isPending}>
              Mark all read
            </Button>
          )}
        </div>
      </Reveal>

      {inbox.isPending && (
        <div className="flex flex-col gap-3 pt-8">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {inbox.isError && <p className="pt-8 text-sm text-muted-foreground">We couldn&apos;t load your notifications. Please try again.</p>}

      {inbox.data && inbox.data.items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
          <Bell className="size-8" />
          <p>Nothing yet. We&apos;ll tell you here when a quotation is ready or an order moves.</p>
        </div>
      )}

      <Stagger immediate gap={0.05} delay={0.05} className="flex flex-col gap-3 pt-8">
        {(inbox.data?.items ?? []).map((n) => {
          const isUnread = !n.readAt;
          const body = (
            <div
              className={cn(
                "flex w-full items-start gap-4 rounded-xl border bg-card px-5 py-4 text-left shadow-e1 transition-[border-color,background-color] duration-200",
                isUnread ? "border-primary/30 bg-primary/[0.04]" : "border-border",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  {isUnread && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                  <p className={cn("leading-6", isUnread ? "font-medium text-foreground" : "text-foreground/85")}>{n.title}</p>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{n.text}</p>
              </div>
              <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{when.format(new Date(n.createdAt))}</span>
            </div>
          );
          return (
            <StaggerItem key={n.id} distance={12}>
              {n.link ? (
                <Link href={n.link} onClick={() => isUnread && read.mutate(n.id)}>
                  {body}
                </Link>
              ) : (
                <button className="block w-full" onClick={() => isUnread && read.mutate(n.id)}>
                  {body}
                </button>
              )}
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}
