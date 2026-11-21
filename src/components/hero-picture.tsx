"use client";

import Image from "next/image";
import { useSiteHero } from "@/features/catalog/hooks";
import { cn } from "@/lib/utils";

const DEFAULT_PICTURE =
  "https://images.unsplash.com/photo-1729237261091-bae8eba0c60c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600";
const ALT = "Luxury event decor";
const FILL = "absolute inset-0 size-full object-cover";

/**
 * The picture across the top of the landing page, as the business set it in Settings: one for the light theme and an
 * optional one for dark mode (without it the light one is used in both). Until something is set, the standard picture.
 * The uploaded pictures are plain images, so no host has to be listed for them; the standard one goes through
 * next/image as before. Nothing is drawn until the answer is in, so the standard picture never flashes first.
 */
export function HeroPicture() {
  const hero = useSiteHero();
  if (hero.isPending) return <div className="size-full bg-muted" />;

  const light = hero.data?.light || null;
  const dark = hero.data?.dark || null;
  // A dark-mode picture hides the light one in dark mode; without one the light picture shows in both.
  const lightClass = cn(FILL, dark && "dark:hidden");

  return (
    <>
      {light ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={light} alt={ALT} fetchPriority="high" className={lightClass} />
      ) : (
        <Image src={DEFAULT_PICTURE} alt={ALT} fill priority sizes="100vw" className={lightClass} />
      )}
      {dark ? (
        // Lazy: a hidden image is only fetched once dark mode shows it.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dark} alt={ALT} loading="lazy" className={cn(FILL, "hidden dark:block")} />
      ) : null}
    </>
  );
}
