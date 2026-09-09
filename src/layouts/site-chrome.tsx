"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { SiteMobileNav } from "./site-mobile-nav";

// The Enquiry-to-Quote flow ((enquiry-flow) route group) renders its own
// TopNav/footer chrome — skip the main site's here so routes under /enquiry
// and /quote don't get it twice.
function hasOwnChrome(pathname: string) {
  return pathname.startsWith("/enquiry") || pathname.startsWith("/quote");
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (hasOwnChrome(pathname)) return <>{children}</>;

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col pb-16 md:pb-0">{children}</main>
      <SiteFooter />
      <SiteMobileNav />
    </>
  );
}
