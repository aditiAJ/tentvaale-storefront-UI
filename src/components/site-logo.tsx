import Image from "next/image";
import { cn } from "@/lib/utils";

/** "TENTVAALE" in spaced gold capitals, the way the Admin header sets it. */
export function SiteWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-sans font-semibold tracking-[0.3em] text-primary uppercase select-none", className)}>
      Tentvaale
    </span>
  );
}

/**
 * The tent from the Tentvaale logo, without the lettering under it: the logo file is the tent above the TENTVAALE
 * name, so the box shows only its top ~68% (the name is set as text, see SiteWordmark). Same crop as the Admin header.
 */
const ICON_SIZES = {
  sm: { box: "h-8 w-[61px]", img: "w-[61px]" },
  md: { box: "h-10 w-[76px]", img: "w-[76px]" },
  lg: { box: "h-14 w-[106px]", img: "w-[106px]" },
} as const;

export function SiteLogoIcon({ size = "md", className }: { size?: keyof typeof ICON_SIZES; className?: string }) {
  const s = ICON_SIZES[size];
  return (
    <span className={cn("block shrink-0 overflow-hidden", s.box, className)}>
      <Image
        src="/brand/logo/tentvaale-logo-full.png"
        alt=""
        width={207}
        height={160}
        className={cn("h-auto max-w-none", s.img)}
      />
    </span>
  );
}
