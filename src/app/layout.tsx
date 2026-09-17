import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Manrope, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { SiteChrome } from "@/layouts/site-chrome";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Tentvaale brand type system (src/styles/tentvaale-tokens.css) — Playfair Display
// for headlines/money, Manrope for UI/labels/buttons, Inter for body copy.
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const interBrand = Inter({
  variable: "--font-inter-brand",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Tentvaale",
  description: "Plan, quote, and order event rentals.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // globals.css sets scroll-behavior: smooth for in-page anchors. This
      // attribute tells Next 16 to suspend it during route changes, otherwise
      // the jump to the top of a new page plays as a visible upward scroll.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${manrope.variable} ${interBrand.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
