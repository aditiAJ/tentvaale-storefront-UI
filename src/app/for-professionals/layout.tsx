import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Event Planners & Professionals",
  description:
    "Trade pricing, priority support and multi-client workspaces for event planners — partner with Tentvaale, Vadodara's best-known luxury decor and inventory supplier.",
};

export default function ForProfessionalsLayout({ children }: LayoutProps<"/for-professionals">) {
  return children;
}
