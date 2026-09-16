"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, Heart, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE, DUR, SPRING } from "@/components/motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
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

/** True once the page has scrolled past the header's own height. */
function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}

/**
 * Count chip on the wishlist icon. Pops when the number changes so adding an
 * item is acknowledged in the chrome, not just by the toast — the spring is
 * keyed on the count itself so a re-render alone doesn't retrigger it.
 */
function CountBadge({ count }: { count: number }) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: reduce ? 1 : 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: reduce ? 1 : 0.4, opacity: 0 }}
          transition={reduce ? { duration: 0.01 } : SPRING.snappy}
          className="pointer-events-none absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 font-semibold text-primary-foreground tabular-nums shadow-e1"
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// Flowstep screen 5 — Wishlist and Account stay visible in both states (the
// mock store keeps a wishlist for anonymous visitors too); only the Log In /
// Sign Up pair drops away once an account is active.
function AuthActions({ onNavigate }: { onNavigate?: () => void }) {
  const { currentAccount, wishlist } = useMockStore();

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Link
        href="/wishlist"
        onClick={onNavigate}
        className="press relative flex size-10 items-center justify-center rounded-full text-foreground transition-colors duration-200 ease-out-quint hover:bg-secondary hover:text-primary"
        aria-label={`Wishlist${wishlist.length ? ` (${wishlist.length} items)` : ""}`}
      >
        <Heart className="size-5" />
        <CountBadge count={wishlist.length} />
      </Link>
      <Link
        href="/account"
        onClick={onNavigate}
        className="press flex size-10 items-center justify-center rounded-full text-foreground transition-colors duration-200 ease-out-quint hover:bg-secondary hover:text-primary"
        aria-label="Account"
      >
        <User className="size-5" />
      </Link>
      <ThemeToggle />
      {!currentAccount && (
        <div className="ml-1.5 flex items-center gap-2">
          <Link
            href="/login"
            onClick={onNavigate}
            className="press rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors duration-200 ease-out-quint hover:border-primary hover:text-primary"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            onClick={onNavigate}
            className="press rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[0_1px_2px_0_rgba(34,29,23,0.18)] transition-shadow duration-200 ease-out-quint hover:shadow-[0_4px_14px_-4px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
          >
            Sign Up
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * Desktop nav item. The active underline is a shared layout element
 * (layoutId), so moving between sections slides one rule across rather than
 * cross-fading five separate ones.
 */
function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative block px-1 py-1.5 text-sm transition-colors duration-200 ease-out-quint",
        active ? "text-primary" : "text-foreground hover:text-primary"
      )}
    >
      {label}
      {active && (
        <motion.span
          layoutId="nav-underline"
          transition={SPRING.snappy}
          className="absolute -bottom-0.5 left-0 h-0.5 w-full rounded-full bg-primary"
        />
      )}
    </Link>
  );
}

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const scrolled = useScrolled();
  const reduce = useReducedMotion();

  // Route change closes the menu — otherwise it stays open behind the new page.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out-quint",
        // Flat against the page at rest; lifts onto a blurred, shadowed plane
        // once content scrolls beneath it, so the header stays legible over
        // photography without sitting on a hard bar the whole time.
        scrolled
          ? "border-border bg-background/85 shadow-e2 supports-backdrop-filter:bg-background/70 supports-backdrop-filter:backdrop-blur-xl"
          : "border-transparent bg-background"
      )}
    >
      {/* Desktop */}
      <nav className="hidden w-full md:block">
        <div className="mx-auto flex w-full max-w-[110rem] items-center gap-6 px-8 py-3">
          <Link href="/" className="press flex shrink-0 items-center" aria-label="Tentvaale home">
            <span className="font-serif text-2xl tracking-wide text-primary transition-colors duration-200 ease-out-quint hover:text-[color-mix(in_oklab,var(--primary),white_18%)]">
              Tentvaale
            </span>
          </Link>
          <ul className="flex shrink-0 items-center gap-5">
            {NAV_LINKS.map((c) => (
              <li key={c.label}>
                <NavItem href={c.href} label={c.label} active={isActive(c.href)} />
              </li>
            ))}
          </ul>
          <form action="/search" className="flex flex-1 justify-center px-4">
            <div className="group relative w-full max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-200 ease-out-quint group-focus-within:text-primary" />
              <input
                type="text"
                name="q"
                placeholder="Search products, collections, bundles..."
                className="h-10 w-full rounded-full border border-border bg-muted pr-4 pl-10 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-out-quint placeholder:text-muted-foreground hover:border-primary/40 focus:border-primary focus:bg-background focus:shadow-[0_0_0_3px_var(--ring)]"
              />
            </div>
          </form>
          <AuthActions />
        </div>
      </nav>

      {/* Mobile */}
      <div className="flex h-14 items-center justify-between px-4 md:hidden">
        <button
          className="press -ml-2 flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {/* Cross-fade + quarter-turn between the two glyphs rather than a hard swap. */}
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              key={mobileMenuOpen ? "close" : "open"}
              initial={{ opacity: 0, rotate: reduce ? 0 : -90, scale: reduce ? 1 : 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: reduce ? 0 : 90, scale: reduce ? 1 : 0.7 }}
              transition={{ duration: reduce ? 0.01 : DUR.fast, ease: EASE.out }}
              className="flex"
            >
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </motion.span>
          </AnimatePresence>
        </button>
        <Link href="/" className="font-serif text-xl tracking-wide text-primary" aria-label="Tentvaale home">
          Tentvaale
        </Link>
        <div className="flex items-center gap-0.5">
          <MobileWishlistLink />
          <Link
            href="/account"
            className="press flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
            aria-label="Account"
          >
            <User className="size-5" />
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: reduce ? 0.01 : DUR.base, ease: EASE.inOut },
              opacity: { duration: reduce ? 0.01 : DUR.fast, ease: EASE.out },
            }}
            className="overflow-hidden border-b border-border bg-background md:hidden"
          >
            <div className="space-y-4 px-4 py-4">
              <form action="/search" className="relative w-full">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search products, collections, bundles..."
                  className="h-11 w-full rounded-full border border-border bg-card pr-4 pl-10 text-sm outline-none transition-colors focus:border-primary"
                />
              </form>
              {/* Links cascade in behind the panel opening, 40ms apart. */}
              <motion.ul
                className="grid grid-cols-2 gap-1"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: reduce ? 0 : 0.04, delayChildren: reduce ? 0 : 0.06 } } }}
              >
                {NAV_LINKS.map((c) => (
                  <motion.li
                    key={c.label}
                    variants={{
                      hidden: { opacity: 0, y: reduce ? 0 : 8 },
                      visible: { opacity: 1, y: 0, transition: { duration: reduce ? 0.01 : DUR.base, ease: EASE.out } },
                    }}
                  >
                    <Link
                      href={c.href}
                      className={cn(
                        "block rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 ease-out-quint",
                        isActive(c.href) ? "bg-primary/10 font-medium text-primary" : "text-foreground hover:bg-secondary"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {c.label}
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
              <div className="border-t border-border pt-3">
                <AuthActions onNavigate={() => setMobileMenuOpen(false)} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/** Wishlist icon in the mobile bar, with the same count chip as desktop. */
function MobileWishlistLink() {
  const { wishlist } = useMockStore();

  return (
    <Link
      href="/wishlist"
      className="press relative flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
      aria-label={`Wishlist${wishlist.length ? ` (${wishlist.length} items)` : ""}`}
    >
      <Heart className="size-5" />
      <CountBadge count={wishlist.length} />
    </Link>
  );
}
