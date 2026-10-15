import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers about ordering, Plans, payments, delivery and accounts — everything you need to know before renting event decor and inventory from Tentvaale.",
};

export default function FaqLayout({ children }: LayoutProps<"/faq">) {
  return children;
}
