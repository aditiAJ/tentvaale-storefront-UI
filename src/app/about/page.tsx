import type { Metadata } from "next";
import { ShieldCheck, Sparkles, WandSparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "25 years styling Vadodara's most memorable events — from intimate sangeets to stadium-scale receptions. The legacy behind Tentvaale's best and famous luxury event decor and antique inventory.",
};

// Flowstep screen 47 (desktop) — static content page, no mobile variant fetched.
const STATS = [
  { value: "12,000+", label: "Inventory Pieces" },
  { value: "3,400+", label: "Events Styled" },
  { value: "6", label: "Cities" },
  { value: "25+", label: "Years of Legacy" },
];

const PHILOSOPHY = [
  { icon: Sparkles, title: "Detail-First", body: "Every prop earns its place in the frame." },
  { icon: ShieldCheck, title: "Built to Last", body: "Rental-grade quality, hotel-grade finish." },
  { icon: WandSparkles, title: "Quietly Bespoke", body: "Curated palettes, never off-the-shelf." },
];

export default function AboutPage() {
  return (
    <div className="w-full">
      <section className="relative h-[400px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1772127822552-ce9ef537bdcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600"
          alt="Moody event setting"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/45 to-background/90" />
        <div className="relative z-10 flex h-full items-center justify-center px-8 text-center">
          <div className="max-w-3xl">
            <h1 className="font-serif text-6xl leading-tight text-foreground">The Studio Behind Every Event</h1>
            <p className="mt-4 text-lg text-foreground/80">A 25-year Vadodara legacy, styling spaces across India.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-12 py-16 md:grid-cols-2 page-x">
        <div className="flex flex-col gap-6">
          <h2 className="font-serif text-4xl text-foreground">Our Story</h2>
          <div className="flex flex-col gap-4 text-base leading-7 text-foreground/75">
            <p>
              Tentvaale carries forward the legacy of Shyam Shankar Decorators Pvt Ltd, a name trusted across Vadodara, Gujarat for
              almost 25 years. What began as a city-rooted mandap and wedding décor house has grown into a styling studio working
              across six cities, from rooftop sangeets to stadium-scale receptions.
            </p>
            <p>
              Every piece in our inventory carries that same discipline forward — chosen for how it photographs and how it holds up
              under a five-day rental, because a legacy built over 25 years is one where luxury is also durable.
            </p>
          </div>
        </div>
        {/* mt-16 ~ the "Our Story" heading's line height + the gap-6 below it,
            so this grid's top lines up with the paragraph, not the heading. */}
        <div className="grid grid-cols-2 gap-4 md:mt-16">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col gap-1.5 rounded-xl border border-primary/20 bg-card p-5">
              <span className="font-serif text-2xl text-primary">{s.value}</span>
              <span className="text-sm text-foreground/70">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl pb-16 page-x">
        <h2 className="mb-8 font-serif text-4xl text-foreground">Our Styling Philosophy</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PHILOSOPHY.map((p) => (
            <div key={p.title} className="flex flex-col gap-4 rounded-xl border border-primary/20 bg-card p-8">
              <p.icon className="size-7 text-primary" />
              <h3 className="font-serif text-2xl text-foreground">{p.title}</h3>
              <p className="text-foreground/70">{p.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
