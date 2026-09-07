import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Plan detail: sub-events, tagged items, co-owners/share (Flow 3), submit for
// quotation or go direct to order (Flow 4). Owner-only actions must be
// server-enforced, not just hidden in the UI (co-owners can edit, not submit).
export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Plan {planId}</h1>
        <div className="flex gap-2">
          <Button variant="outline">Share / collaborate</Button>
          <Button>Submit for quotation</Button>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Sub-events &amp; items go here</CardTitle>
            <CardDescription>
              Wire up to features/plans getPlan(). Items tagged to a
              sub-event, the plan generally, or left on the untagged wishlist
              list. Submit dialog needs a confirmation summary before calling
              submitPlanForQuotation() (Flow 4) — plan vs per-sub-event
              granularity, and a Direct Order fork that skips straight to
              checkout.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
