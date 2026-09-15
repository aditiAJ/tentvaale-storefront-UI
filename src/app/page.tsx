"use client";

import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductThumb } from "@/components/product-thumb";
import { useMockStore } from "@/mock-data/store";
import { formatRupees, rateTypeLabel } from "@/mock-data/seed";
import { CATEGORIES } from "@/mock-data/taxonomy";

// Flowstep screens 1 (desktop) / 2 (mobile), fileId 8bd03b8a-4561-4b58-bb2d-ca011d84d53e.
const OCCASIONS = ["Wedding", "Haldi", "Corporate", "Fashion Shoot", "Luxury Lounge"];


const STATS = [
  { value: "12,000+", label: "Inventory Items" },
  { value: "3,500+", label: "Events Styled" },
  { value: "18", label: "Cities" },
  { value: "9", label: "Years" },
];

const PROJECTS = [
  { title: "Delhi Palace Wedding", img: "https://images.unsplash.com/photo-1729237261091-bae8eba0c60c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200" },
  { title: "Mumbai Corporate Gala", img: "https://images.unsplash.com/photo-1716538878686-38567b89b5a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200" },
  { title: "Goa Beach Reception", img: "https://images.unsplash.com/photo-1651472652024-6ca9278d53a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200" },
];

// Every band below the hero shares this wrapper so gutters, max width and
// vertical rhythm stay identical down the page.
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`mx-auto w-full max-w-7xl px-6 py-10 md:px-12 md:py-14 ${className}`}>{children}</section>;
}

function SectionHeading({ title, href, linkLabel = "View all" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="font-serif text-2xl text-foreground md:text-3xl">{title}</h2>
      {href && (
        <Link href={href} className="flex shrink-0 items-center gap-1 text-sm text-primary transition-opacity hover:opacity-70">
          {linkLabel}
          <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  const { products, collections, bundles } = useMockStore();
  const featuredProducts = products.slice(0, 8);

  return (
    <div className="w-full">
      <section className="relative h-110 w-full md:h-140">
        <img
          src="https://images.unsplash.com/photo-1729237261091-bae8eba0c60c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600"
          alt="Luxury event decor"
          className="size-full object-cover"
        />
        {/* Fade confined to the bottom band only — the rest of the photo stays fully visible, undimmed. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/85 via-black/40 to-transparent" />
        <div className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-end gap-4 px-6 pb-8 md:gap-6 md:px-12 md:pb-12">
          <h1 className="max-w-2xl font-serif text-3xl leading-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.85)] md:text-5xl">
            Design Every Detail of Your Event
          </h1>
          <p className="max-w-lg text-base text-white/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.85)] md:text-lg">
            Rent furniture, décor and fully styled collections for weddings, corporate events and shoots.
          </p>
          <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-4">
            <Button className="rounded-full" size="lg" nativeButton={false} render={<Link href="/catalog">Browse Product Catalog</Link>} />
            <Button variant="outline" className="rounded-full" size="lg" nativeButton={false} render={<Link href="/plans">Start a Plan Event</Link>} />
          </div>
        </div>
      </section>

      <Section className="flex flex-col items-center gap-6">
        <h2 className="text-center font-serif text-2xl text-foreground md:text-3xl">What are you creating today?</h2>
        <form action="/search" className="relative w-full max-w-2xl">
          <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="q"
            placeholder="Search products, collections, bundles..."
            className="w-full rounded-full border border-border bg-muted py-3.5 pr-4 pl-12 text-base text-foreground outline-none transition-colors focus:border-primary md:py-4"
          />
        </form>
        <div className="flex flex-wrap justify-center gap-3">
          {OCCASIONS.map((o) => (
            <Link
              key={o}
              href={`/search?occasion=${encodeURIComponent(o)}`}
              className="rounded-full border border-primary px-5 py-2 text-sm text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              {o}
            </Link>
          ))}
        </div>

        <div className="mt-4 grid w-full grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5 md:grid-cols-9">
          {CATEGORIES.map(({ image, name: label }) => (
            <Link key={label} href={`/catalog?category=${encodeURIComponent(label)}`} className="group flex flex-col items-center gap-2">
              <div className="size-16 overflow-hidden rounded-full border border-primary/40 transition-colors group-hover:border-primary md:size-20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt={label} className="size-full object-cover transition-transform duration-300 group-hover:scale-110" />
              </div>
              <span className="text-center text-xs leading-tight text-foreground transition-colors group-hover:text-primary md:text-sm">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading title="Product Catalog" href="/catalog" linkLabel="Browse all" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {featuredProducts.map((p) => (
            <Link
              key={p.id}
              href={`/catalog/${p.id}`}
              className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-primary"
            >
              <ProductThumb imageUrl={p.imageUrl} alt={p.name} className="h-36 w-full rounded-xl md:h-44" />
              <div className="flex flex-col gap-1 px-1 pb-1">
                <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">{p.name}</span>
                <span className="text-xs text-muted-foreground">From {formatRupees(p.basePrice)} / day</span>
                <span className="w-fit rounded-full border border-primary/40 px-2 py-0.5 text-[10px] text-primary">
                  {rateTypeLabel(p.rateType)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading title="Featured Collections" href="/collections" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((c) => (
            <Link key={c.id} href={`/collections/${c.id}`} className="group flex flex-col gap-3">
              <div className="h-44 overflow-hidden rounded-2xl md:h-56">
                <img
                  src={c.heroImageUrl}
                  alt={c.name}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-serif text-lg text-foreground transition-colors group-hover:text-primary">{c.name}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground md:text-sm">{c.tagline}</span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading title="Bundles" href="/bundles" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {bundles.map((b) => (
            <Link
              key={b.id}
              href={`/bundles/${b.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary"
            >
              <div className="h-44 overflow-hidden md:h-52">
                <img
                  src={b.imageUrl}
                  alt={b.name}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <span className="font-serif text-lg text-foreground transition-colors group-hover:text-primary">{b.name}</span>
                <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">{b.description}</p>
                <span className="text-xs text-muted-foreground">{b.includedProductIds.length} items included</span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading title="Why Tentvaale" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-5">
              <span className="font-serif text-2xl text-primary md:text-4xl">{s.value}</span>
              <span className="text-xs text-muted-foreground md:text-sm">{s.label}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading title="Featured Projects" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PROJECTS.map((p) => (
            <div key={p.title} className="relative h-52 overflow-hidden rounded-2xl border border-border md:h-64">
              <img src={p.img} alt={p.title} className="size-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-background to-transparent p-4">
                <span className="text-sm text-foreground">{p.title}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
