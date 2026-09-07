import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";

// Thin outline icons — real lucide-react components rather than the prototype's
// remote-SVG CSS-mask approach (ds/_ds_bundle.js Icon.jsx), since self-hosting
// Lucide is what the handoff README recommends for production anyway.
const SIZES = { sm: 16, md: 20, lg: 24, xl: 32 } as const;

type IconSizeToken = keyof typeof SIZES;

function toPascalCase(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export interface IconProps extends Omit<LucideProps, "size" | "color"> {
  /** Lucide slug, e.g. "calendar-days", "arrow-right". */
  name: string;
  size?: IconSizeToken | number;
  color?: string;
}

export function Icon({ name, size = "md", color = "var(--icon-color)", ...rest }: IconProps) {
  const px = typeof size === "number" ? size : SIZES[size];
  const Cmp = (LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>)[
    toPascalCase(name)
  ];
  if (!Cmp) return null;
  return <Cmp size={px} color={color} strokeWidth={1.75} aria-hidden {...rest} />;
}
