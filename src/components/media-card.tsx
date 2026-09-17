"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The image-led link card used for collections, bundles and themes.
 *
 * /collections, /bundles, the home page bands and the "Related Themes" rail
 * were each hand-rolling the same photo + title + blurb + meta card with
 * slightly different radii, hover behaviour and image sizes. One component
 * means one hover feel across all of them.
 */
export function MediaCard({
  href,
  image,
  title,
  eyebrow,
  description,
  tags,
  meta,
  metaEnd,
  imageHeight = "h-48 md:h-56",
  className,
  priority,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
}: {
  href: string;
  image: string;
  title: string;
  /** Small uppercase line above the title — occasion, palette. */
  eyebrow?: string;
  description?: string;
  /** Small pills under the description — categories, styles. */
  tags?: string[];
  /** Footer line, leading edge. */
  meta?: React.ReactNode;
  /** Footer line, trailing edge. */
  metaEnd?: React.ReactNode;
  imageHeight?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "surface-interactive group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-e1 hover:border-primary/50",
        className
      )}
    >
      <div className={cn("relative overflow-hidden bg-muted", imageHeight)}>
        <Image
          src={image}
          alt={title}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition-transform duration-600 ease-out-quint group-hover:scale-[1.06]"
        />
        {/* Gold wash on hover, matching the product cards in /catalog. */}
        <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-primary/15 to-transparent opacity-0 transition-opacity duration-300 ease-out-quint group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        {eyebrow && <span className="-mb-1.5 text-[10px] font-medium tracking-[0.14em] text-primary uppercase">{eyebrow}</span>}
        <h2 className="font-serif text-xl leading-snug text-foreground transition-colors duration-200 ease-out-quint group-hover:text-primary">
          {title}
        </h2>
        {description && <p className="line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="rounded-sm bg-primary/8 px-2.5 py-0.5 text-[11px] text-primary ring-1 ring-primary/25 ring-inset">
                {tag}
              </span>
            ))}
          </div>
        )}
        {(meta || metaEnd) && (
          <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-sm">
            <span className="text-foreground">{meta}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{metaEnd}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
