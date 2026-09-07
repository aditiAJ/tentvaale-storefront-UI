import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

// Falls back to a neutral icon placeholder when a product has no supplied
// image, rather than rendering nothing or a broken-image icon.
export function ProductThumb({ imageUrl, alt, className }: { imageUrl?: string; alt: string; className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden rounded-md bg-muted", className)}>
      {imageUrl ? (
        <Image src={imageUrl} alt={alt} fill className="object-contain p-2" />
      ) : (
        <Package className="h-1/3 w-1/3 text-muted-foreground" aria-hidden />
      )}
    </div>
  );
}
