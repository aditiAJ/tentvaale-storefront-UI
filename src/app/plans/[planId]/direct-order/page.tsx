import Link from "next/link";
import { Button } from "@/components/ui/button";

// Ordering straight from a plan at listed prices, without a quotation, needs the payment and pricing
// rules to be settled first (a later phase). Until then a plan is priced by submitting it for a quotation.
export default async function DirectOrderPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 py-24 text-center page-x">
      <h1 className="font-serif text-2xl text-foreground">Direct order is coming soon</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        For now, send your plan for a quotation. Our team prices it and comes back to you; you pay only once you accept.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" nativeButton={false} render={<Link href={`/plans/${planId}`}>Back to my plan</Link>} />
        <Button nativeButton={false} render={<Link href={`/plans/${planId}/submit`}>Submit for Quotation</Link>} />
      </div>
    </div>
  );
}
