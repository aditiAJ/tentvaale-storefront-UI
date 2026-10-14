import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Tentvaale, Vadodara's famous name in event decor rentals, to plan your next event, request a quotation, or check inventory availability.",
};

export default function ContactLayout({ children }: LayoutProps<"/contact">) {
  return children;
}
