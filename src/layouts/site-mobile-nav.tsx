"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, CalendarDays, User } from "lucide-react";
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
    <nav className="md:hidden bg-background border-t border-border flex fixed right-0 bottom-0 left-0 z-40 px-2 justify-around items-center h-16">
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link key={tab.href} href={tab.href} className="flex flex-col justify-center items-center flex-1 gap-1">
            <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("font-medium text-[10px]", active ? "text-primary" : "text-muted-foreground")}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
