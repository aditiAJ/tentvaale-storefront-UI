import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Curated Collections",
  description:
    "Shop curated, fully styled décor collections — luxury palettes and antique accents assembled by Vadodara's best event stylists for weddings, corporate events and more.",
};

export default function CollectionsLayout({ children }: LayoutProps<"/collections">) {
  return children;
}
