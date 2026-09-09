import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

// Falls back to a neutral icon placeholder when a product has no supplied
// image, rather than rendering nothing or a broken-image icon. Plain <img>,
// not next/image — matches every other screen in this design, which hotlink
// Unsplash photos directly rather than proxying them through Next's optimizer.
export function ProductThumb({ imageUrl, alt, className }: { imageUrl?: string; alt: string; className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden rounded-md bg-muted", className)}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={alt} className="size-full object-contain p-2" />
      ) : (
        <Package className="h-1/3 w-1/3 text-muted-foreground" aria-hidden />
      )}
    </div>
  );
}
