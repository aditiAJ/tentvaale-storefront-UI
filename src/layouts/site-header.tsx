"use client";

import Link from "next/link";
import { Search, Menu, Heart, User, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { useMockStore } from "@/mock-data/store";

// Flowstep screens 1 (desktop) / 2 (mobile). Desktop: full nav rail +
// inline search + auth in one row. Mobile: hamburger + wordmark + icons, with
// a separate fixed bottom tab bar (site-mobile-nav.tsx) for primary nav.
const NAV_LINKS = [
  { href: "/collections", label: "Featured Collections" },
  { href: "/bundles", label: "Bundles" },
  { href: "/catalog", label: "Product Catalog" },
  { href: "/plans", label: "Plan Event" },
  { href: "/about", label: "About" },
];

// Flowstep screen 5 — Wishlist and Account stay visible in both states (the
// mock store keeps a wishlist for anonymous visitors too); only the Log In /
// Sign Up pair drops away once an account is active.
function AuthActions() {
  const { currentAccount, wishlist } = useMockStore();

  return (
    <div className="flex items-center gap-5 shrink-0">
      <Link href="/wishlist" className="relative flex size-9 items-center justify-center rounded-full transition-colors hover:bg-secondary" aria-label="Wishlist">
        <Heart className="size-5 text-foreground" />
        {wishlist.length > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium leading-4 text-primary-foreground">
            {wishlist.length}
          </span>
        )}
      </Link>
      <Link href="/account" className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-secondary" aria-label="Account">
        <User className="size-5 text-foreground" />
      </Link>
      {!currentAccount && (
        <>
          <Link href="/login" className="rounded-full text-foreground text-sm border border-border px-4 py-1.5 transition-colors hover:border-primary">
            Log In
          </Link>
          <Link href="/signup" className="font-medium rounded-full bg-primary text-primary-foreground text-sm px-4 py-1.5 transition-colors hover:opacity-90">
            Sign Up
          </Link>
        </>
      )}
      <ThemeToggle />
    </div>
  );
}

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <nav className="hidden md:block bg-background border-b border-border w-full">
        <div className="flex py-3 px-8 items-center gap-6">
          <Link href="/" className="flex items-center shrink-0">
            <span className="font-serif text-primary text-2xl tracking-wide">Tentvaale</span>
          </Link>
          <ul className="flex items-center shrink-0 gap-5">
            {NAV_LINKS.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="transition-colors text-foreground text-sm hover:text-primary">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
          <form action="/search" className="flex px-4 justify-center flex-1">
            <div className="relative w-full max-w-md">
              <Search className="-translate-y-1/2 text-muted-foreground absolute top-1/2 left-3 size-4" />
              <input
                type="text"
                name="q"
                placeholder="Search products, collections, bundles..."
                className="rounded-full bg-muted text-foreground text-sm border border-border py-2 pr-4 pl-9 w-full outline-none focus:border-primary"
              />
            </div>
          </form>
          <AuthActions />
        </div>
      </nav>

      {/* Mobile */}
      <div className="md:hidden bg-background border-b border-border flex px-4 justify-between items-center h-14">
        <button className="text-foreground -ml-2 p-2" onClick={() => setMobileMenuOpen((v) => !v)} aria-label="Menu">
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
        <Link href="/" className="font-serif text-primary text-xl tracking-wide">
          Tentvaale
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/wishlist" className="text-foreground p-2" aria-label="Wishlist">
            <Heart className="size-5" />
          </Link>
          <Link href="/account" className="text-foreground p-2" aria-label="Account">
            <User className="size-5" />
          </Link>
          <ThemeToggle />
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 py-4 space-y-4">
          <div className="relative w-full">
            <Search className="-translate-y-1/2 text-muted-foreground absolute top-1/2 left-3 size-4" />
            <Input placeholder="Search products, collections, bundles..." className="rounded-full bg-card border-border pl-9 w-full" />
          </div>
          <ul className="grid grid-cols-2 gap-2">
            {NAV_LINKS.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="block text-foreground text-sm py-1" onClick={() => setMobileMenuOpen(false)}>
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="pt-2 border-t border-border">
            <AuthActions />
          </div>
        </div>
      )}
    </>
  );
}
