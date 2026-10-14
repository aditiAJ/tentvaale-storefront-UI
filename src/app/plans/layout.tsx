import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan Your Event",
  description:
    "Build a Plan for your event — combine products across every category into one styled, large event space, from an intimate gathering to a stadium-scale experience, then submit for a quotation.",
};

export default function PlansLayout({ children }: LayoutProps<"/plans">) {
  return children;
}
