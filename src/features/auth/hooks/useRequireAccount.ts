"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMockStore } from "@/mock-data/store";

// Route guard for pages that need a signed-in account (Plan Board, account,
// quotations, checkout, orders). Redirects to /login if there's no session.
export function useRequireAccount() {
  const router = useRouter();
  const { currentAccount } = useMockStore();

  useEffect(() => {
    if (!currentAccount) router.replace("/login");
  }, [currentAccount, router]);

  return currentAccount;
}
