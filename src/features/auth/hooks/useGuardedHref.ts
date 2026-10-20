"use client";

import { useSession } from "../session";

/** Pages that only make sense signed in (each one's own guard would send an anonymous visitor to /login). */
const SIGN_IN_FIRST = ["/plans", "/orders", "/account"];

/**
 * For a link to a page that needs an account: a visitor who is already known to be signed out is sent
 * straight to the login page, with this page remembered. Without this the click loads the page, which
 * renders blank while it finds out nobody is signed in, then redirects to /login: two page loads and a flash.
 * While the session is still being asked about the plain link is kept, and the page's own guard handles it.
 */
export function useGuardedHref() {
  const { status } = useSession();
  return (href: string) =>
    status === "anonymous" && SIGN_IN_FIRST.some((page) => href === page || href.startsWith(`${page}/`))
      ? `/login?next=${encodeURIComponent(href)}`
      : href;
}
