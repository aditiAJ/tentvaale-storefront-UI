"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useInbox } from "@/features/notifications/hooks";

/** The bell in the header, with how many updates are unread. Hidden until the inbox has loaded. */
export function NotificationBell({ onNavigate }: { onNavigate?: () => void }) {
  const inbox = useInbox();
  if (!inbox.data) return null;
  const unread = inbox.data.unread;
  return (
    <Link
      href="/notifications"
      onClick={onNavigate}
      className="press relative flex size-10 items-center justify-center rounded-sm text-foreground transition-colors duration-200 ease-out-quint hover:bg-secondary hover:text-primary"
      aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
    >
      <Bell className="size-5" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 font-medium text-primary-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
