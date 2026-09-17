"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateWheelPicker } from "@/components/date-wheel-picker";
import { AI_PLANNER_EVENT_TYPES } from "@/mock-data/seed";

// Flowstep screens 42 (desktop) / 43 (mobile) — a single responsive form, not
// pixel-matched per breakpoint like earlier screens, since 43 only swaps the
// slider for a native range input and stacks the two budget fields.
export default function AiPlannerPage() {
  const router = useRouter();

  const [eventType, setEventType] = useState("Wedding");
  const [guests, setGuests] = useState(250);
  const [budgetMin, setBudgetMin] = useState("50,000");
  const [budgetMax, setBudgetMax] = useState("2,00,000");
  const [keywords, setKeywords] = useState<string[]>(["Royal", "Gold Accents", "Floral"]);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [eventDate, setEventDate] = useState("2025-12-14");

  function addKeyword() {
    const k = keywordDraft.trim();
    if (!k || keywords.includes(k)) return;
    setKeywords((ks) => [...ks, k]);
    setKeywordDraft("");
  }

  function removeKeyword(k: string) {
    setKeywords((ks) => ks.filter((x) => x !== k));
  }

  function handleGenerate() {
    const params = new URLSearchParams({
      eventType,
      guests: String(guests),
      budgetMin,
      budgetMax,
      keywords: keywords.join(","),
      eventDate,
    });
    router.push(`/ai-planner/results?${params.toString()}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-10 md:py-12 page-x">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-serif text-4xl text-foreground">Design Your Event with AI</h1>
        <p className="text-sm leading-6 text-foreground/70">
          Answer a few questions and we will suggest products, bundles and themes for your event.
        </p>
      </div>

      <div className="flex flex-col gap-8 rounded-xl border border-primary/20 bg-card p-6 md:p-8">
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-foreground">Event Type</label>
          <div className="flex flex-wrap gap-2">
            {AI_PLANNER_EVENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setEventType(t)}
                className={
                  t === eventType
                    ? "rounded-sm border border-primary bg-primary px-4 py-2 text-sm text-primary-foreground"
                    : "rounded-sm border border-primary/40 px-4 py-2 text-sm text-foreground/80"
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label htmlFor="guests" className="text-sm font-medium text-foreground">
              Guest Count
            </label>
            <span className="text-sm text-primary">{guests} guests</span>
          </div>
          <input
            id="guests"
            type="range"
            min={20}
            max={1000}
            step={10}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="h-1 w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-foreground/50">
            <span>20</span>
            <span>1000</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-foreground">Budget Range</label>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="50,000"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              aria-label="Min ₹"
              className="rounded-lg border border-primary/40 bg-background px-4 py-3 text-sm text-foreground"
            />
            <input
              placeholder="2,00,000"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              aria-label="Max ₹"
              className="rounded-lg border border-primary/40 bg-background px-4 py-3 text-sm text-foreground"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-foreground">Style / Theme Keywords</label>
          <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-background px-3 py-2">
            {keywords.map((k) => (
              <span key={k} className="flex items-center gap-2 rounded-sm border border-primary/60 px-3 py-1 text-xs text-foreground">
                <span>{k}</span>
                <button type="button" className="text-primary" onClick={() => removeKeyword(k)}>
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <input
              value={keywordDraft}
              onChange={(e) => setKeywordDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              onBlur={addKeyword}
              placeholder="e.g. royal, pastel, minimal, floral"
              className="min-w-[160px] flex-1 bg-transparent py-1 text-sm text-foreground outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label htmlFor="event-date" className="text-sm font-medium text-foreground">
            Event Date
          </label>
          <DateWheelPicker id="event-date" value={eventDate} onChange={setEventDate} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button className="flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground" onClick={handleGenerate}>
          <Sparkles className="size-4" />
          Generate My Plan
        </Button>
        <Button variant="outline" className="w-full border-primary text-primary" nativeButton={false} render={<Link href="/catalog">Skip, I will browse myself</Link>} />
      </div>

      <p className="text-center text-xs text-foreground/50">
        Suggestions are a starting point — you can edit, remove or add anything afterwards.
      </p>
    </div>
  );
}
