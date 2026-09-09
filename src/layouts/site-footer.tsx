import Link from "next/link";

// Flowstep screens 1 (desktop 4-col grid) / 2 (mobile stacked). Bottom tab
// bar covers primary nav on mobile, so this stays reachable via scroll.
const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { href: "/catalog?category=furniture", label: "Furniture" },
      { href: "/catalog?category=mirrors", label: "Mirrors" },
      { href: "/catalog?category=carpets", label: "Carpets" },
      { href: "/catalog?category=lighting", label: "Lighting" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/about", label: "Careers" },
      { href: "/about", label: "Press" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/for-professionals", label: "For Professionals" },
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "FAQs" },
      { href: "/account#order-history", label: "Track Order" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/terms", label: "Privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-secondary mt-8 pt-12 pb-12 px-6 md:px-12 w-full pb-24 md:pb-12">
      <div className="grid gap-8 grid-cols-2 md:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <span className="font-medium text-primary text-sm">{col.title}</span>
            {col.links.map((l) => (
              <Link key={l.label} href={l.href} className="transition-colors text-muted-foreground text-sm hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-border flex mt-8 pt-6 flex-col md:flex-row gap-3 justify-between items-start md:items-center">
        <span className="font-serif text-primary text-xl tracking-wide">Tentvaale</span>
        <span className="text-muted-foreground text-xs">© 2026 Tentvaale. All rights reserved.</span>
      </div>
    </footer>
  );
}
