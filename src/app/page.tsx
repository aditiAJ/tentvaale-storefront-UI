"use client";

import { BundlePrice } from "@/components/bundle-price";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Search, ArrowRight, ChevronRight, ClipboardList, CalendarDays, FileText } from "lucide-react";
import { useSkipEntrance } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { MediaCard } from "@/components/media-card";
import { ProductThumb } from "@/components/product-thumb";
import { HoverImageGallery } from "@/components/hover-image-gallery";
import { formatMoney } from "@/lib/money";
import { rateUnitLabel } from "@/features/catalog/format";
import { useBundles, useCategories, useCollections, useOccasions, useProductPreview } from "@/features/catalog/hooks";

// Flowstep screens 1 (desktop) / 2 (mobile), fileId 8bd03b8a-4561-4b58-bb2d-ca011d84d53e.

const HOW_IT_WORKS = [
  { icon: Search, title: "Explore", description: "Browse our curated collection." },
  { icon: ClipboardList, title: "Build your selection", description: "Save pieces for each event function." },
  { icon: CalendarDays, title: "Share event details", description: "Add your city, venue and date." },
  { icon: FileText, title: "Receive your quote", description: "Our team checks availability and prepares your proposal." },
];

const PROJECTS = [
  { title: "Delhi Palace Wedding", img: "https://images.unsplash.com/photo-1729237261091-bae8eba0c60c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200" },
  { title: "Mumbai Corporate Gala", img: "https://images.unsplash.com/photo-1716538878686-38567b89b5a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200" },
  { title: "Goa Beach Reception", img: "https://images.unsplash.com/photo-1651472652024-6ca9278d53a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200" },
];

// Every band below the hero shares this wrapper so gutters, max width and
// vertical rhythm stay identical down the page.
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`mx-auto w-full max-w-7xl py-6 md:py-10 page-x ${className}`}>{children}</section>;
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
  // Every band below the hero is the shop's own data; a band with nothing to show is left out
  // rather than rendered as an empty heading.
  const occasions = useOccasions().data ?? [];
  const categories = useCategories().data ?? [];
  const featuredProducts = useProductPreview({ sort: "NEWEST" }, 8).data?.items ?? [];
  const collections = useCollections().data ?? [];
  const bundles = useBundles().data ?? [];

  // Animate skill golden rules kept even at higher drama: only transform/
  // opacity animated (GPU-accelerated), ease-out on entrance, and always a
  // near-instant fallback for prefers-reduced-motion instead of disabling
  // the triggers outright.
  const reduceMotion = useReducedMotion();
  // Back/forward navigation: render already-revealed instead of blank.
  const skip = useSkipEntrance();
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
    // Landing page keeps the original, softer corner scale; the rest of the
    // app uses the tighter global --radius from globals.css.
    <div className="w-full [--radius:0.625rem]">
      <section className="relative h-110 w-full overflow-hidden md:h-140">
        <motion.div className="absolute inset-0" variants={heroImage} initial={skip ? "visible" : "hidden"} animate="visible">
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
          className="absolute inset-0 mx-auto flex max-w-7xl flex-col justify-end gap-3 pb-6 md:gap-4 md:pb-8 page-x"
          variants={heroContainer}
          initial={skip ? "visible" : "hidden"}
          animate="visible"
        >
          <motion.h1
            variants={heroItem}
            className="max-w-2xl font-serif leading-[1.1] font-semibold text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.85)]"
          >
            <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl">Create unforgettable</span>
            <span className="block text-3xl text-primary sm:text-4xl md:text-5xl lg:text-6xl">event spaces</span>
          </motion.h1>
          <motion.p variants={heroItem} className="max-w-lg text-sm text-white/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.85)] md:text-base">
            Explore furniture, décor and styled collections for weddings, corporate events and celebrations.
          </motion.p>
          <motion.div variants={heroItem} className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-4">
            <Button
              className="rounded-full"
              size="lg"
              nativeButton={false}
              render={
                <Link href="/catalog">
                  Browse the Collection <ChevronRight />
                </Link>
              }
            />
            <Button
              variant="outline"
              className="rounded-full border-transparent bg-white text-neutral-900 hover:border-transparent hover:bg-white/90 hover:text-neutral-900 dark:bg-white dark:hover:bg-white/90"
              size="lg"
              nativeButton={false}
              render={
                <Link href="/plans">
                  Build Your Event Selection <ChevronRight />
                </Link>
              }
            />
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
          {occasions.map((o) => (
            <Link
              key={o.id}
              href={`/catalog?occasion=${encodeURIComponent(o.slug)}`}
              className="rounded-full border border-primary px-5 py-2 text-sm text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              {o.name}
            </Link>
          ))}
        </div>

        {categories.length > 0 && (
          <motion.div
            className="mt-4 flex w-full flex-wrap justify-center gap-x-6 gap-y-6"
            variants={gridContainer}
            initial={skip ? "visible" : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
          >
            {categories.map((c) => (
              <motion.div key={c.id} variants={gridItem} className="w-20 md:w-24">
                <Link href={`/catalog?category=${encodeURIComponent(c.slug)}`} className="group flex flex-col items-center gap-2">
                  <ProductThumb
                    imageUrl={c.imageUrl}
                    alt={c.name}
                    className="size-16 rounded-full border border-primary/40 transition-colors group-hover:border-primary md:size-20"
                  />
                  <span className="text-center text-xs leading-tight text-foreground transition-colors group-hover:text-primary md:text-sm">
                    {c.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Section>

      <Section className="bg-card/40">
        <h2 className="mb-8 text-center font-serif text-2xl text-foreground md:text-3xl">A simpler way to bring your event together</h2>
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10"
          variants={gridContainer}
          initial={skip ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div key={step.title} variants={gridItem} className="relative flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-xs text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <step.icon className="size-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-base text-foreground">{step.title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.description}</p>
              </div>
              {/* Dotted link to the next step, desktop only. */}
              {i < HOW_IT_WORKS.length - 1 && (
                <span aria-hidden className="absolute top-1/2 -right-10 hidden w-10 border-t-2 border-dotted border-primary/40 lg:block" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {featuredProducts.length > 0 && (
      <Section>
        <SectionHeading title="Product Catalog" href="/catalog" linkLabel="Browse all" />
        <motion.div
          className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
          variants={gridContainer}
          initial={skip ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {featuredProducts.map((p) => (
            <motion.div key={p.id} variants={gridItem}>
              <Link href={`/catalog/${p.slug}`} className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-primary">
                <HoverImageGallery
                  images={p.imageUrls?.length ? p.imageUrls : p.imageUrl ? [p.imageUrl] : []}
                  alt={p.name}
                  imgClassName="h-36 w-full rounded-xl md:h-44"
                />
                <div className="flex flex-col gap-1 px-1 pb-1">
                  <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">{p.name}</span>
                  <span className="text-xs text-muted-foreground">From {formatMoney(p.dailyRate)} / day</span>
                  <span className="w-fit rounded-full border border-primary/40 px-2 py-0.5 text-[10px] text-primary">
                    {rateUnitLabel(p.rateType)}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Section>
      )}

      {collections.length > 0 && (
      <Section>
        <SectionHeading title="Featured Collections" href="/collections" />
        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={gridContainer}
          initial={skip ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {collections.slice(0, 4).map((c) => (
            <motion.div key={c.id} variants={gridItem} className="flex flex-col">
              <MediaCard
                href={`/collections/${c.slug}`}
                image={c.imageUrl}
                eyebrow={c.palette}
                title={c.name}
                description={c.description}
                tags={c.occasions.map((o) => o.name)}
                imageHeight="h-44 md:h-52"
              />
            </motion.div>
          ))}
        </motion.div>
      </Section>
      )}

      {bundles.length > 0 && (
      <Section>
        <SectionHeading title="Bundles" href="/bundles" />
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
          variants={gridContainer}
          initial={skip ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {bundles.slice(0, 6).map((b) => (
            <motion.div key={b.id} variants={gridItem} className="flex flex-col">
              <MediaCard
                href={`/bundles/${b.slug}`}
                image={b.imageUrl}
                eyebrow={b.occasions[0]?.name}
                title={b.name}
                description={b.tagline}
                meta={<BundlePrice bundle={b} />}
                metaEnd="per event"
                imageHeight="h-44 md:h-52"
              />
            </motion.div>
          ))}
        </motion.div>
      </Section>
      )}

      <Section>
        <SectionHeading title="Featured Projects" />
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
          variants={gridContainer}
          initial={skip ? "visible" : "hidden"}
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
