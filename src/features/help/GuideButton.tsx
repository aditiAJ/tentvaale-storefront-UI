"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Info } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { GUIDE_TOPICS, topicIdFor } from "./guide";

/**
 * The information icon in the header (MOM-03). It opens the guide for the screen the customer is on, with the other
 * topics below it. The text lives in ./guide.ts.
 */
export function GuideButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const currentId = topicIdFor(pathname);
  const current = GUIDE_TOPICS.find((t) => t.id === currentId) ?? GUIDE_TOPICS[0];
  const others = GUIDE_TOPICS.filter((t) => t.id !== current.id);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Help and user guide"
        title="Help and user guide"
        className={cn(
          "press relative flex size-10 items-center justify-center rounded-sm text-foreground transition-colors duration-200 ease-out-quint hover:bg-secondary hover:text-primary",
          className,
        )}
      >
        <Info className="size-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{current.title}</SheetTitle>
            <SheetDescription>{current.summary}</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-6 px-5 pb-8">
            <ol className="flex list-decimal flex-col gap-2.5 pl-5 text-sm leading-6 text-foreground marker:text-primary">
              {current.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            <div className="flex flex-col gap-2 border-t border-border pt-5">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">More guides</p>
              {others.map((topic) => (
                <details key={topic.id} className="group rounded-lg border border-border px-4 py-3">
                  <summary className="cursor-pointer text-sm font-medium text-foreground marker:text-primary">{topic.title}</summary>
                  <p className="mt-2 text-sm text-muted-foreground">{topic.summary}</p>
                  <ol className="mt-2 flex list-decimal flex-col gap-2 pl-5 text-sm leading-6 text-foreground marker:text-primary">
                    {topic.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </details>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
