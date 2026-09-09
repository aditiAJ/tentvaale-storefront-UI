"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Armchair,
  Sparkles,
  Frame,
  Grid2x2,
  Flower2,
  Lightbulb,
  Wrench,
  Sofa,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Flowstep screens 1 (desktop) / 2 (mobile), fileId 8bd03b8a-4561-4b58-bb2d-ca011d84d53e.
const OCCASIONS = ["Wedding", "Haldi", "Corporate", "Fashion Shoot", "Luxury Lounge", "More"];

const CATEGORY_ICONS = [
  { icon: Armchair, label: "Furniture" },
  { icon: Sparkles, label: "Styling Props" },
  { icon: Frame, label: "Mirrors" },
  { icon: Grid2x2, label: "Carpets" },
  { icon: Flower2, label: "Planters" },
  { icon: Lightbulb, label: "Lighting" },
  { icon: Wrench, label: "Installation Setup" },
  { icon: Sofa, label: "Lounge Packages" },
];

const FEATURED_THEMES = [
  { title: "Royal Heritage", img: "https://images.unsplash.com/photo-1772127822552-ce9ef537bdcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600" },
  { title: "Monochrome Reception", img: "https://images.unsplash.com/photo-1716538878686-38567b89b5a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600" },
  { title: "Amber Dunes", img: "https://images.unsplash.com/photo-1632296521966-b19f0d728635?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600" },
  { title: "Garden Evening", img: "https://images.unsplash.com/photo-1651472652024-6ca9278d53a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600" },
];

const TRENDING_COLLECTIONS = [
  { title: "Furniture Edit", icon: Armchair },
  { title: "Mirror Walls", icon: Frame },
  { title: "Planter Styling", icon: Flower2 },
  { title: "Ambient Lighting", icon: Lightbulb },
];

const STATS = [
  { value: "12,000+", label: "Inventory Items" },
  { value: "3,500+", label: "Events Styled" },
  { value: "18", label: "Cities" },
  { value: "9", label: "Years" },
];

const PROJECTS = [
  { title: "Delhi Palace Wedding", img: "https://images.unsplash.com/photo-1729237261091-bae8eba0c60c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200" },
  { title: "Mumbai Corporate Gala", img: "https://images.unsplash.com/photo-1716538878686-38567b89b5a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200" },
  { title: "Goa Beach Reception", img: "https://images.unsplash.com/photo-1651472652024-6ca9278d53a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200" },
];

const CITIES = ["Delhi", "Mumbai", "Goa", "Bengaluru"];

export default function Home() {
  const router = useRouter();
  const [availDate, setAvailDate] = useState("");
  const [availCity, setAvailCity] = useState("");

  function checkAvailability() {
    const params = new URLSearchParams();
    if (availDate) params.set("date", availDate);
    params.set("city", availCity || "Mumbai");
    router.push(`/check-availability?${params.toString()}`);
  }

  return (
    <div className="w-full">
      <section className="relative w-full h-[400px] md:h-[520px]">
        <img
          src="https://images.unsplash.com/photo-1729237261091-bae8eba0c60c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600"
          alt="Luxury event decor"
          className="size-full object-cover"
        />
        <div className="bg-linear-to-t md:bg-linear-to-r from-background via-background/70 to-transparent absolute inset-0" />
        <div className="flex absolute inset-0 px-6 md:px-12 flex-col justify-end md:justify-center gap-4 md:gap-6 pb-8 md:pb-0 max-w-2xl">
          <h1 className="font-serif text-foreground text-3xl md:text-5xl leading-tight">
            Design Every Detail of Your Event
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-lg">
            Rent furniture, decor and full styled themes for weddings, corporate events and shoots
          </p>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
            <Button className="rounded-full" size="lg" nativeButton={false} render={<Link href="/catalog">Explore Collection</Link>} />
            <Button variant="outline" className="rounded-full" size="lg" nativeButton={false} render={<Link href="/plans">Start Planning</Link>} />
          </div>
        </div>
      </section>

      <section className="flex pt-10 md:pt-12 px-6 md:px-12 pb-8 md:pb-12 flex-col items-center gap-6">
        <h2 className="font-serif text-foreground text-2xl md:text-3xl text-center">What are you creating today?</h2>
        <form action="/search" className="relative w-full max-w-2xl">
          <Search className="-translate-y-1/2 text-muted-foreground absolute top-1/2 left-4 size-5" />
          <input
            type="text"
            name="q"
            placeholder="Search venues, décor, themes..."
            className="rounded-full bg-muted text-foreground text-base border border-border py-3.5 md:py-4 pr-4 pl-12 w-full outline-none focus:border-primary"
          />
        </form>
        <div className="flex flex-wrap justify-center items-center gap-3">
          {OCCASIONS.map((o) => (
            <Link
              key={o}
              href={`/search?occasion=${encodeURIComponent(o)}`}
              className="transition-colors rounded-full text-sm border border-primary text-foreground px-5 py-2 hover:bg-primary hover:text-primary-foreground"
            >
              {o}
            </Link>
          ))}
        </div>
      </section>

      <section className="flex px-6 md:px-12 pb-8 md:pb-8 gap-4 md:gap-0 md:justify-between overflow-x-auto">
        {CATEGORY_ICONS.map(({ icon: Icon, label }) => (
          <Link key={label} href={`/catalog?category=${encodeURIComponent(label)}`} className="flex flex-col items-center shrink-0 md:w-full gap-2 w-16">
            <div className="rounded-full bg-secondary border border-primary/40 flex justify-center items-center size-16">
              <Icon className="text-primary size-6" />
            </div>
            <span className="text-center text-foreground text-xs md:text-sm">{label}</span>
          </Link>
        ))}
      </section>

      <section className="flex pt-8 px-6 md:px-12 pb-8 flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="font-serif text-foreground text-xl md:text-3xl">Featured Themes</h2>
          <Link href="/collections" className="transition-colors text-primary text-sm">
            View all
          </Link>
        </div>
        <div className="flex md:grid gap-6 grid-cols-4 overflow-x-auto pb-1">
          {FEATURED_THEMES.map((t) => (
            <Link key={t.title} href={`/collections/${encodeURIComponent(t.title.toLowerCase().replace(/\s+/g, "-"))}`} className="flex flex-col gap-2 shrink-0 w-[240px] md:w-auto">
              <div className="rounded-2xl h-40 md:h-56 overflow-hidden">
                <img src={t.img} alt={t.title} className="size-full object-cover" />
              </div>
              <span className="text-foreground text-sm md:text-base">{t.title}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex pt-8 px-6 md:px-12 pb-8 flex-col gap-6">
        <h2 className="font-serif text-foreground text-xl md:text-3xl">Trending Collections</h2>
        <div className="flex md:grid gap-4 md:gap-6 grid-cols-4 overflow-x-auto pb-1">
          {TRENDING_COLLECTIONS.map(({ icon: Icon, title }) => (
            <Link
              key={title}
              href={`/catalog?collection=${encodeURIComponent(title)}`}
              className="rounded-lg bg-card border border-border flex flex-col p-4 shrink-0 gap-2 w-40 md:w-auto md:h-40 md:justify-center"
            >
              <Icon className="text-primary size-5" />
              <span className="text-foreground text-sm">{title}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-6 md:px-12 pb-8">
        <Card className="rounded-2xl bg-secondary md:bg-secondary border-0 flex flex-col md:flex-row p-6 md:p-8 gap-4 justify-between items-start md:items-center w-full">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="rounded-full bg-primary/15 flex justify-center items-center size-12 md:size-14 shrink-0">
              <Sparkles className="text-primary size-6 md:size-7" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-serif text-foreground text-lg md:text-2xl">Let AI Plan Your Event</h3>
              <p className="text-muted-foreground text-sm">Answer a few questions and get a tailored décor plan in minutes</p>
            </div>
          </div>
          <Button className="rounded-full w-full md:w-auto" nativeButton={false} render={<Link href="/ai-planner">Try AI Planner</Link>} />
        </Card>
      </section>

      <section className="px-6 md:px-12 pb-8">
        <Card className="bg-card border-border p-6 md:p-8 gap-4 md:gap-6">
          <CardHeader className="p-0 gap-2">
            <h3 className="font-serif text-foreground text-xl md:text-2xl">Check Availability</h3>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row p-0 items-stretch md:items-end gap-4">
            <div className="flex flex-col flex-1 gap-2">
              <label className="text-muted-foreground text-sm">Date</label>
              <Input type="date" className="rounded-lg bg-muted border-border w-full" value={availDate} onChange={(e) => setAvailDate(e.target.value)} />
            </div>
            <div className="flex flex-col flex-1 gap-2">
              <label className="text-muted-foreground text-sm">City</label>
              <Select value={availCity} onValueChange={(v) => v && setAvailCity(v)}>
                <SelectTrigger className="bg-muted border-border w-full">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="rounded-full" onClick={checkAvailability}>
              Check Now
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="px-6 md:px-12 pb-8">
        <h2 className="font-serif text-foreground text-xl md:text-3xl mb-6">Why Tentvaale</h2>
        <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-lg bg-card border border-border flex flex-col p-4 md:p-0 md:border-0 md:bg-transparent gap-1">
              <span className="font-serif text-primary text-2xl md:text-4xl">{s.value}</span>
              <span className="text-muted-foreground md:text-foreground text-xs md:text-sm">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex pt-8 px-6 md:px-12 pb-8 flex-col gap-6">
        <h2 className="font-serif text-foreground text-xl md:text-3xl">Featured Projects</h2>
        <div className="flex md:grid gap-4 md:gap-6 grid-cols-3 overflow-x-auto pb-1">
          {PROJECTS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border relative shrink-0 w-[240px] md:w-auto h-44 md:h-64 overflow-hidden">
              <img src={p.img} alt={p.title} className="size-full object-cover" />
              <div className="bg-linear-to-t from-background to-transparent absolute inset-x-0 bottom-0 p-4">
                <span className="text-foreground text-sm">{p.title}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
