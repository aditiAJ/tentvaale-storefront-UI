import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 py-20 text-center page-x">
      <SearchX className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="font-serif text-2xl text-foreground">We couldn&apos;t find that page</h1>
      <p className="text-sm text-muted-foreground">The link may be old, or the page may have moved.</p>
      <div className="flex gap-2">
        <Link href="/" className={buttonVariants()}>
          Back to home
        </Link>
        <Link href="/catalog" className={buttonVariants({ variant: "outline" })}>
          Browse the catalogue
        </Link>
      </div>
    </div>
  );
}
