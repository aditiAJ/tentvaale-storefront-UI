import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { COMPANY, telHref } from "@/lib/company";
import { SocialLinks } from "@/components/social-icons";

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
    <footer className="mt-16 w-full border-t border-border bg-secondary">
      <div className="mx-auto w-full max-w-[110rem] pt-14 pb-12 page-x">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-6">
          {/* Wordmark leads the grid on desktop so the footer opens with the
              brand rather than a link column. */}
          <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
            <span className="font-serif text-2xl tracking-wide text-primary">Tentvaale</span>
            <p className="max-w-56 text-sm leading-6 text-muted-foreground">
              Furniture, décor and fully styled collections, rented for the day.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} className="flex flex-col gap-3" aria-label={col.title}>
              <span className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">{col.title}</span>
              {col.links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  // Underline grows from the left on hover instead of snapping
                  // on — cheap (transform on a pseudo-element) and it makes a
                  // wall of grey links feel responsive.
                  className="relative w-fit text-sm text-muted-foreground transition-colors duration-200 ease-out-quint after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-200 after:ease-out-quint hover:text-foreground hover:after:scale-x-100"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          ))}
          {/* Its own column rather than stacked under the wordmark - as part of
              the brand block it was three times the height of a link column and
              left a void under the short ones. */}
          <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
            <span className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Get in touch</span>
            <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <Phone className="mt-0.5 size-4 shrink-0" />
              <div className="flex flex-col">
                {COMPANY.phones.map((phone) => (
                  <a key={phone.e164} href={telHref(phone)} className="transition-colors hover:text-foreground">
                    {phone.display}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <span>{COMPANY.address.inline}</span>
            </div>
            {COMPANY.email && (
              <a href={`mailto:${COMPANY.email}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {COMPANY.email}
              </a>
            )}
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 md:flex-row md:items-center">
          <span className="text-xs text-muted-foreground">© 2026 Tentvaale. All rights reserved.</span>
          <SocialLinks size="sm" className="md:order-last" />
          <div className="flex items-center gap-5">
            <Link href="/terms" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="/faq" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              FAQs
            </Link>
            <Link href="/contact" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </div>
      {/* Clears the fixed mobile tab bar so the last row isn't sat on. */}
      <div className="h-16 md:hidden" aria-hidden />
    </footer>
  );
}
