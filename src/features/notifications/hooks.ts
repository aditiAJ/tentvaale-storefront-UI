"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth/session";
import { getInbox, inboxKeys, markAllRead, markRead, type Inbox } from "@/features/notifications/api";

/** The signed-in customer's inbox, refreshed every minute; nothing is asked while signed out. */
export function useInbox() {
  const { status } = useSession();
  return useQuery({
    queryKey: inboxKeys.all,
    queryFn: ({ signal }) => getInbox(signal),
    enabled: status === "authenticated",
    refetchInterval: 60_000,
  });
}

export function useInboxActions() {
  const queryClient = useQueryClient();
  const update = (inbox: Inbox) => queryClient.setQueryData(inboxKeys.all, inbox);
  return {
    read: useMutation({ mutationFn: (id: string) => markRead(id), onSuccess: update }),
    readAll: useMutation({ mutationFn: () => markAllRead(), onSuccess: update }),
  };
}
