"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Search, ArrowRight, LayoutGrid, FileText, CreditCard, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductThumb } from "@/components/product-thumb";
import { useMockStore } from "@/mock-data/store";
import { formatRupees, rateTypeLabel } from "@/mock-data/seed";

// Flowstep screens 1 (desktop) / 2 (mobile), fileId 8bd03b8a-4561-4b58-bb2d-ca011d84d53e.
const OCCASIONS = ["Wedding", "Haldi", "Corporate", "Fashion Shoot", "Luxury Lounge"];

// Labels match Product.category in src/mock-data/seed.ts exactly — the link
// passes them straight to /catalog?category=, so a mismatch silently renders
// an empty catalog. Photo circles (not line icons) per the reference the user
// supplied — each a real Unsplash photo representative of the category.
const CATEGORIES = [
  { image: "https://images.unsplash.com/photo-1645108537414-b113b89c049d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200", label: "Furniture" },
  { image: "https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200", label: "Styling Props" },
  { image: "https://images.unsplash.com/photo-1775135595214-f945982d9cc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200", label: "Mirrors" },
  { image: "https://images.unsplash.com/photo-1757618978085-850cad5b020a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200", label: "Carpets" },
  { image: "https://images.unsplash.com/photo-1692616513667-5230c36f3afe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200", label: "Planters" },
  { image: "https://images.unsplash.com/photo-1556494403-f90163a73c21?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200", label: "Lighting" },
  { image: "https://images.unsplash.com/photo-1750107309391-37c2ff4c2d4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200", label: "Installation Setup" },
  { image: "https://images.unsplash.com/photo-1757810358892-680d8b58d799?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200", label: "Lounge Packages" },
];

const STATS = [
  { value: "12,000+", label: "Inventory Items" },
  { value: "3,500+", label: "Events Styled" },
  { value: "18", label: "Cities" },
  { value: "9", label: "Years" },
];

// Mirrors the real flow: browse -> Plan with sub-events -> Submit for
// Quotation or Direct Order -> pay -> delivery status on the Order page.
const HOW_IT_WORKS = [
  {
    icon: LayoutGrid,
    title: "Browse & Build a Plan",
    description: "Browse the catalog and add pieces to a Plan, sorted by function like Haldi or Sangeet.",
  },
  {
    icon: FileText,
    title: "Submit or Order Direct",
    description: "Get a quotation, or skip ahead with Direct Order at listed prices.",
  },
  {
    icon: CreditCard,
    title: "Review & Pay",
    description: "Pay securely online. The full amount is collected upfront, so there are no surprises.",
  },
  {
    icon: Truck,
    title: "Delivery & Setup",
    description: "We deliver and set up everything in time for your event, or you can pick it up yourself if that works better for you.",
  },
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

  // Animate skill golden rules kept even at higher drama: only transform/
  // opacity animated (GPU-accelerated), ease-out on entrance, and always a
  // near-instant fallback for prefers-reduced-motion instead of disabling
  // the triggers outright.
  const reduceMotion = useReducedMotion();
  const easeOutQuint = [0.23, 1, 0.32, 1] as const;

  const heroImage: Variants = {
    hidden: { scale: reduceMotion ? 1 : 1.18 },
    visible: { scale: 1, transition: { duration: reduceMotion ? 0.01 : 2.2, ease: easeOutQuint } },
  };
  const heroContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.18, delayChildren: reduceMotion ? 0 : 0.35 } },
  };
  const heroItem: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 40, scale: reduceMotion ? 1 : 0.96 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: reduceMotion ? 0.01 : 0.8, ease: easeOutQuint } },
  };

  const gridContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.09 } },
  };
  const gridItem: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 36, scale: reduceMotion ? 1 : 0.92 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: reduceMotion ? 0.01 : 0.65, ease: easeOutQuint } },
  };

  return (
    <div className="w-full">
      <section className="relative h-110 w-full overflow-hidden md:h-140">
        <motion.div className="absolute inset-0" variants={heroImage} initial="hidden" animate="visible">
          <Image
            src="https://images.unsplash.com/photo-1729237261091-bae8eba0c60c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600"
            alt="Luxury event decor"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
        {/* Fade confined to the bottom band only — the rest of the photo stays fully visible, undimmed. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/85 via-black/40 to-transparent" />
        <motion.div
          className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-end gap-4 px-6 pb-8 md:gap-6 md:px-12 md:pb-12"
          variants={heroContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 variants={heroItem} className="max-w-2xl font-serif text-3xl leading-tight text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.85)] md:text-5xl">
            Design Every Detail of Your Event
          </motion.h1>
          <motion.p variants={heroItem} className="max-w-lg text-base text-white/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.85)] md:text-lg">
            Rent furniture, décor and fully styled collections for weddings, corporate events and shoots.
          </motion.p>
          <motion.div variants={heroItem} className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-4">
            <Button className="rounded-full" size="lg" nativeButton={false} render={<Link href="/catalog">Browse Product Catalog</Link>} />
            <Button variant="outline" className="rounded-full" size="lg" nativeButton={false} render={<Link href="/plans">Start a Plan Event</Link>} />
          </motion.div>
        </motion.div>
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

        <motion.div
          className="mt-4 grid w-full grid-cols-4 gap-x-4 gap-y-6 md:grid-cols-8"
          variants={gridContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
        >
          {CATEGORIES.map(({ image, label }) => (
            <motion.div key={label} variants={gridItem}>
              <Link href={`/catalog?category=${encodeURIComponent(label)}`} className="group flex flex-col items-center gap-2">
                <div className="size-16 overflow-hidden rounded-full border border-primary/40 transition-colors group-hover:border-primary md:size-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt={label} className="size-full object-cover transition-transform duration-300 group-hover:scale-110" />
                </div>
                <span className="text-center text-xs leading-tight text-foreground transition-colors group-hover:text-primary md:text-sm">
                  {label}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      <Section className="bg-card/40">
        <SectionHeading title="How It Works" />
        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={gridContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div key={step.title} variants={gridItem} className="relative flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
              <span className="font-serif text-xl text-primary/30">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                <step.icon className="size-4 text-primary" />
              </div>
              <h3 className="font-serif text-base text-foreground">{step.title}</h3>
              <p className="text-xs leading-5 text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      <Section>
        <SectionHeading title="Product Catalog" href="/catalog" linkLabel="Browse all" />
        <motion.div
          className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
          variants={gridContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {featuredProducts.map((p) => (
            <motion.div key={p.id} variants={gridItem}>
              <Link href={`/catalog/${p.id}`} className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-primary">
                <ProductThumb imageUrl={p.imageUrl} alt={p.name} className="h-36 w-full rounded-xl md:h-44" />
                <div className="flex flex-col gap-1 px-1 pb-1">
                  <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">{p.name}</span>
                  <span className="text-xs text-muted-foreground">From {formatRupees(p.basePrice)} / day</span>
                  <span className="w-fit rounded-full border border-primary/40 px-2 py-0.5 text-[10px] text-primary">
                    {rateTypeLabel(p.rateType)}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      <Section>
        <SectionHeading title="Featured Collections" href="/collections" />
        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={gridContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {collections.map((c) => (
            <motion.div key={c.id} variants={gridItem}>
              <Link href={`/collections/${c.id}`} className="group flex h-full flex-col gap-3">
                <div className="relative h-44 overflow-hidden rounded-2xl md:h-56">
                  <Image
                    src={c.heroImageUrl}
                    alt={c.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-lg text-foreground transition-colors group-hover:text-primary">{c.name}</span>
                  <span className="line-clamp-2 text-xs text-muted-foreground md:text-sm">{c.tagline}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      <Section>
        <SectionHeading title="Bundles" href="/bundles" />
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
          variants={gridContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {bundles.map((b) => (
            <motion.div key={b.id} variants={gridItem}>
              <Link
                href={`/bundles/${b.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary"
              >
                <div className="relative h-44 overflow-hidden md:h-52">
                  <Image
                    src={b.imageUrl}
                    alt={b.name}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <span className="font-serif text-lg text-foreground transition-colors group-hover:text-primary">{b.name}</span>
                  <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">{b.description}</p>
                  <span className="text-xs text-muted-foreground">{b.includedProductIds.length} items included</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      <Section>
        <SectionHeading title="Why Tentvaale" />
        <motion.div
          className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
          variants={gridContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
        >
          {STATS.map((s) => (
            <motion.div key={s.label} variants={gridItem} className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-5">
              <span className="font-serif text-2xl text-primary md:text-4xl">{s.value}</span>
              <span className="text-xs text-muted-foreground md:text-sm">{s.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      <Section>
        <SectionHeading title="Featured Projects" />
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
          variants={gridContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {PROJECTS.map((p) => (
            <motion.div key={p.title} variants={gridItem} className="relative h-52 overflow-hidden rounded-2xl border border-border md:h-64">
              <Image src={p.img} alt={p.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-background to-transparent p-4">
                <span className="text-sm text-foreground">{p.title}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>
    </div>
  );
}
