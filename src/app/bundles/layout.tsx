import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Bundles",
  description:
    "Ready-made bundles for every occasion — luxury furniture, décor and antique props packaged together so you can style a large event space in a single order.",
};

export default function BundlesLayout({ children }: LayoutProps<"/bundles">) {
  return children;
}
