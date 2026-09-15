"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMockStore } from "@/mock-data/store";

// Route guard for pages that need a signed-in account (Plan Board, account,
// quotations, checkout, orders). Redirects to /login if there's no session.
export function useRequireAccount() {
  const router = useRouter();
  const { currentAccount, hydrated } = useMockStore();

  // Wait for the saved session to load — otherwise a fresh tab or reload
  // sees "no account" for one render and bounces to /login.
  useEffect(() => {
    if (hydrated && !currentAccount) router.replace("/login");
  }, [hydrated, currentAccount, router]);

  return currentAccount;
}
