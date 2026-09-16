"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, LayoutGrid, Search, CalendarDays, User } from "lucide-react";
import { SPRING } from "@/components/motion";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/catalog", label: "Catalog", icon: LayoutGrid },
  { href: "/search", label: "Search", icon: Search },
  { href: "/plans", label: "Plans", icon: CalendarDays },
  { href: "/account", label: "Account", icon: User },
];

// Flowstep screen 2 etc. — fixed bottom tab bar, mobile only.
export function SiteMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-40 flex items-center justify-around border-t border-border bg-background/90 px-2 pb-[env(safe-area-inset-bottom)] supports-backdrop-filter:bg-background/75 supports-backdrop-filter:backdrop-blur-xl md:hidden"
      aria-label="Primary"
    >
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className="relative flex h-16 flex-1 flex-col items-center justify-center gap-1"
          >
            {/* One pill slides between tabs (layoutId) instead of five
                independently fading backgrounds — the movement is what tells
                you where you came from. */}
            {active && (
              <motion.span
                layoutId="mobile-tab-pill"
                transition={SPRING.snappy}
                className="absolute inset-x-2 inset-y-2 -z-10 rounded-xl bg-primary/10"
              />
            )}
            <Icon
              className={cn(
                "size-5 transition-colors duration-200 ease-out-quint",
                active ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium transition-colors duration-200 ease-out-quint",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
