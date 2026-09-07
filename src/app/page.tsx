import Link from "next/link";
import { Button } from "@/components/ui/button";

// Flow 1: Anonymous Browse -> Signup. Visitors browse the catalog without an
// account; signup is only prompted when they try to add an item to a Plan.
export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        Plan your event, rent everything in one place
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Browse tents, furniture, and décor. Build a Plan for your event, request
        a quotation, and track delivery — all from one board.
      </p>
      <div className="flex gap-3">
        <Button
          size="lg"
          nativeButton={false}
          render={<Link href="/catalog">Browse catalog</Link>}
        />
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          render={<Link href="/signup">Start a plan</Link>}
        />
      </div>
    </div>
  );
}
