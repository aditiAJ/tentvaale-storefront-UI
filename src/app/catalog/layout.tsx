import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Catalog",
  description:
    "Browse Tentvaale's full product catalog — thousands of inventory pieces across every décor category, from antique furniture to large event structures, ready to rent for your next event.",
};

export default function CatalogLayout({ children }: LayoutProps<"/catalog">) {
  return children;
}
