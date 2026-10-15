"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

/** What a page shows when it crashes while rendering; app/error.tsx hands it the error and Next's reset. */
export function ErrorView({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 py-20 text-center page-x">
      <TriangleAlert className="size-8 text-destructive" aria-hidden />
      <h1 className="font-serif text-2xl text-foreground">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        This page could not be shown. Please try again.
        {error.digest ? ` Reference: ${error.digest}.` : ""}
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
