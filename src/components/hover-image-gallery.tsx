"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { cn } from "@/lib/utils";

// Mirrors ProductThumb's own fallback behaviour (broken/missing image -> neutral icon), reimplemented
// here rather than reused: the sliding layer below needs the <img> on its own, not wrapped in
// ProductThumb's own sizing div — that div becomes this component's "frame" instead (see below).
function GalleryImage({ url, alt }: { url?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return (
      <div className="flex size-full items-center justify-center">
        <Package className="h-1/3 w-1/3 text-muted-foreground" aria-hidden />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      onError={() => setFailed(true)}
      className={cn("size-full", url.startsWith("/") ? "object-contain p-[8%]" : "object-cover")}
    />
  );
}

const slide = {
  enter: (direction: number) => ({ x: direction >= 0 ? "100%" : "-100%" }),
  center: { x: 0 },
  exit: (direction: number) => ({ x: direction >= 0 ? "-100%" : "100%" }),
};

/**
 * A product image with left/right arrows that appear on hover, for cycling through its photos
 * without leaving the card or opening the gallery strip. No-ops (no arrows at all) when there's
 * only one image — most of the catalog grid today, until the backend's listing endpoint carries
 * more than a single photo per product.
 *
 * Clicking an arrow pushes the image in the opposite direction (right arrow -> slides left, the new
 * photo entering from the right) — the familiar carousel/swipe feel, not a hard cut.
 *
 * Controlled (`index`/`onIndexChange`) when the caller already tracks the active image — e.g. the
 * product page, which keeps the thumbnail strip below in sync. Uncontrolled otherwise, for cards
 * in a grid that each need their own independent position.
 *
 * Unnamed `group`/`group-hover` on purpose: a card's whole clickable area (image, name, price) is
 * usually already wrapped in its own `.group` for its own hover effects, and hovering any of that —
 * not just the exact image pixels — should reveal these arrows too. `.group:hover` matches on any
 * ancestor with the class, so nesting this component's own `group` inside a card's is harmless and
 * means the gallery still works hovered standalone (e.g. the product detail page's main image).
 */
export function HoverImageGallery({
  images,
  alt,
  className,
  imgClassName,
  index: indexProp,
  onIndexChange,
}: {
  images: string[];
  alt: string;
  className?: string;
  imgClassName?: string;
  index?: number;
  onIndexChange?: (index: number) => void;
}) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [animating, setAnimating] = useState(false);
  const index = indexProp ?? internalIndex;
  const setIndex = onIndexChange ?? setInternalIndex;
  const hasMultiple = images.length > 1;

  function go(delta: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (animating) return;
    setAnimating(true);
    setDirection(delta);
    setIndex((index + delta + images.length) % images.length);
    window.setTimeout(() => setAnimating(false), 400);
  }

  return (
    <div className={cn("group relative", className)}>
      {/* The "frame": exactly ProductThumb's own box (shape, background, any padding the caller
          asked for via imgClassName) — kept as a normal, non-absolute element so it still
          establishes the card's size, the way a plain ProductThumb always did. */}
      <div className={cn("relative flex items-center justify-center overflow-hidden rounded-md bg-muted", imgClassName)}>
        {/* The "stage": a plain, unpadded positioning context sized to fill the frame's content box
            (respecting whatever padding the frame has), so the sliding layer's `inset-0` lines up
            with the photo's own edges rather than spilling into the frame's padding. */}
        <div className="relative size-full overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              <GalleryImage url={images[index]} alt={alt} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {hasMultiple && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => go(-1, e)}
            className="absolute top-1/2 left-1.5 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 shadow-sm ring-1 ring-border transition-opacity duration-200 ease-out-quint group-hover:opacity-100 hover:bg-background"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => go(1, e)}
            className="absolute top-1/2 right-1.5 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 shadow-sm ring-1 ring-border transition-opacity duration-200 ease-out-quint group-hover:opacity-100 hover:bg-background"
          >
            <ChevronRight className="size-4" />
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-1.5 z-10 flex justify-center gap-1 opacity-0 transition-opacity duration-200 ease-out-quint group-hover:opacity-100">
            {images.map((image, i) => (
              <span key={image + i} className={cn("size-1.5 rounded-full transition-colors", i === index ? "bg-primary" : "bg-background/70")} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
