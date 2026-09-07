"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useMockStore } from "@/mock-data/store";

const NAV_LINKS = [
  { href: "/catalog", label: "Catalog" },
  { href: "/plans", label: "Plan Board" },
];

export function SiteHeader() {
  const router = useRouter();
  const { currentAccount, logout } = useMockStore();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Image src="/brand/logo/tentvaale-logo-mark.png" alt="" width={28} height={28} />
          Tentvaale
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {currentAccount ? (
            <>
              <Button variant="ghost" nativeButton={false} render={<Link href="/account">{currentAccount.name}</Link>} />
              <Button
                variant="outline"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" nativeButton={false} render={<Link href="/login">Log in</Link>} />
              <Button nativeButton={false} render={<Link href="/signup">Sign up</Link>} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
