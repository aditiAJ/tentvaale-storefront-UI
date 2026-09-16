"use client";

import { usePathname } from "next/navigation";
import { PageTransition } from "@/components/motion";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { SiteMobileNav } from "./site-mobile-nav";

// The Enquiry-to-Quote flow ((enquiry-flow) route group) renders its own
// TopNav/footer chrome — skip the main site's here so routes under /enquiry
// and /quote don't get it twice.
// Printable invoices (/orders/[id]/invoice) are bare A4 sheets too.
function hasOwnChrome(pathname: string) {
  return pathname.startsWith("/enquiry") || pathname.startsWith("/quote") || pathname.endsWith("/invoice");
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (hasOwnChrome(pathname)) return <>{children}</>;

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col pb-16 md:pb-0">
        {/* Keyed by pathname so every navigation mounts a fresh transition and
            replays the entrance — a route change should feel like a change. */}
        <PageTransition key={pathname}>{children}</PageTransition>
      </main>
      <SiteFooter />
      <SiteMobileNav />
    </>
  );
}
