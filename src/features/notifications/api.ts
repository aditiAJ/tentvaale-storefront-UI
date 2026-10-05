import { apiFetch } from "@/services/api-client";

/** The customer's inbox. Only the owner can read or clear it. */
export interface InboxEntry {
  id: string;
  title: string;
  text: string;
  link?: string;
  createdAt: string;
  readAt?: string;
}

export interface Inbox {
  items: InboxEntry[];
  unread: number;
}

export const getInbox = (signal?: AbortSignal) => apiFetch<Inbox>("storefront/notifications", { signal });
export const markRead = (id: string) => apiFetch<Inbox>(`storefront/notifications/${id}/read`, { method: "POST" });
export const markAllRead = () => apiFetch<Inbox>("storefront/notifications/read-all", { method: "POST" });

export const inboxKeys = { all: ["notifications"] as const };
