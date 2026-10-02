"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMockStore } from "@/mock-data/store";
import { useSession } from "../session";

/**
 * Route guard for pages that need a signed-in customer (plans, account, quotations, checkout,
 * orders). Sends anyone who is not signed in to /login, remembering where they were going.
 *
 * Returns the account in the shape the (still mock-backed) pages expect, and only once it matches
 * the real session, so a page never renders for someone who is not actually signed in. While the
 * answer is on its way, or if the server cannot be reached, it returns null and does not redirect.
 */
export function useRequireAccount() {
  const router = useRouter();
  const pathname = usePathname();
  const { status, account: real, signedOutByUser } = useSession();
  const { currentAccount } = useMockStore();

  useEffect(() => {
    // Someone who just chose to log out is on their way home, not to the login page.
    if (status === "anonymous" && !signedOutByUser) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, signedOutByUser, router, pathname]);

  if (status !== "authenticated" || !real) return null;
  return currentAccount && currentAccount.id === real.id ? currentAccount : null;
}
