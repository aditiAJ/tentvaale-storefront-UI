"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaVariant } from "@/features/catalog/types";

// Falls back to a neutral icon placeholder when a product has no image, or the
// image fails to load (e.g. a /brand/products cut-out referenced before the
// file is added), rather than a broken-image icon. Plain <img>, not
// next/image — matches every other screen in this design, which hotlink
// photos directly rather than proxying them through Next's optimizer. Real
// transparency and WebP variant generation already happened at upload time
// (tentvaale-admin-UI's media-processing module), so a srcset here just lets
// the browser pick the right already-generated tier — Next re-optimising on
// top would be redundant work against the same bytes.
export function ProductThumb({
  imageUrl,
  imageVariants,
  alt,
  className,
  eager,
}: {
  imageUrl?: string;
  /** Size tiers for imageUrl. Omit (or empty) for media that predates variant generation — falls back to plain src. */
  imageVariants?: MediaVariant[];
  alt: string;
  className?: string;
  /** Set for thumbnails known to render above the fold; everything else lazy-loads. */
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const sorted = imageVariants?.length ? [...imageVariants].sort((a, b) => a.size - b.size) : undefined;

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden rounded-md bg-muted", className)}>
      {imageUrl && !failed ? (
        // Always contain, never crop — product photos (square, validated 1:1 at
        // upload) must stay fully visible; local /brand cutouts get extra padding
        // since they're not pre-validated to fill their square cleanly.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sorted?.[0]?.url ?? imageUrl}
          srcSet={sorted?.map((v) => `${v.url} ${v.size}w`).join(", ")}
          sizes={sorted ? "(min-width: 768px) 160px, 96px" : undefined}
          width={1200}
          height={1200}
          alt={alt}
          loading={eager ? undefined : "lazy"}
          onError={() => setFailed(true)}
          className={cn("size-full object-contain", imageUrl.startsWith("/") && "p-[8%]")}
        />
      ) : (
        <Package className="h-1/3 w-1/3 text-muted-foreground" aria-hidden />
      )}
    </div>
  );
}
