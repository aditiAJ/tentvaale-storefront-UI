"use client";

import Link from "next/link";
import { Search, Menu, Heart, User, X, FolderOpen } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useMockStore } from "@/mock-data/store";

// Flowstep screens 1 (desktop) / 2 (mobile). Desktop: full category rail +
// inline search + auth in one row. Mobile: hamburger + wordmark + icons, with
// a separate fixed bottom tab bar (site-mobile-nav.tsx) for primary nav.
const CATEGORIES = [
  { href: "/catalog?category=Furniture", label: "Furniture" },
  { href: "/catalog?category=Styling+Props", label: "Styling Props" },
  { href: "/catalog?category=Mirrors", label: "Mirrors" },
  { href: "/catalog?category=Carpets", label: "Carpets" },
  { href: "/catalog?category=Planters", label: "Planters" },
  { href: "/catalog?category=Lighting", label: "Lighting" },
  { href: "/collections/royal-heritage", label: "Themes" },
  { href: "/bundles/b1", label: "Bundles" },
];

// Flowstep screen 5 — authenticated desktop nav (Wishlist / My Plans / Account)
// replaces the signed-out Log In / Sign Up buttons.
function AuthActions() {
  const { currentAccount, wishlist } = useMockStore();

  if (currentAccount) {
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
        <Link href="/plans" className="flex items-center gap-1.5 text-sm text-foreground transition-colors hover:text-primary">
          <FolderOpen className="size-4" />
          <span>My Plans</span>
        </Link>
        <Link href="/account" className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-secondary" aria-label="Account">
          <User className="size-5 text-foreground" />
        </Link>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-5 shrink-0">
      <Link href="/login" className="rounded-full text-foreground text-sm border border-border px-4 py-1.5 transition-colors hover:border-primary">
        Log In
      </Link>
      <Link href="/signup" className="font-medium rounded-full bg-primary text-primary-foreground text-sm px-4 py-1.5 transition-colors hover:opacity-90">
        Sign Up
      </Link>
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
            {CATEGORIES.map((c) => (
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
                placeholder="Search products, bundles, themes..."
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
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 py-4 space-y-4">
          <div className="relative w-full">
            <Search className="-translate-y-1/2 text-muted-foreground absolute top-1/2 left-3 size-4" />
            <Input placeholder="Search venues, décor, themes..." className="rounded-full bg-card border-border pl-9 w-full" />
          </div>
          <ul className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
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
