"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

// Falls back to a neutral icon placeholder when a product has no image, or the
// image fails to load (e.g. a /brand/products cut-out referenced before the
// file is added), rather than a broken-image icon. Plain <img>, not
// next/image — matches every other screen in this design, which hotlink
// photos directly rather than proxying them through Next's optimizer.
export function ProductThumb({ imageUrl, alt, className }: { imageUrl?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden rounded-md bg-muted", className)}>
      {imageUrl && !failed ? (
        // Local /brand PNGs are transparent studio cut-outs and need breathing
        // room; remote photos are full-bleed scenes and should fill the frame.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={alt}
          onError={() => setFailed(true)}
          className={cn("size-full", imageUrl.startsWith("/") ? "object-contain p-[8%]" : "object-cover")}
        />
      ) : (
        <Package className="h-1/3 w-1/3 text-muted-foreground" aria-hidden />
      )}
    </div>
  );
}
