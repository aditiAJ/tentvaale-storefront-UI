import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Flow 2: Plan Board — a customer can have multiple Plans open at once
// (multiple weddings, etc). Default wishlist-style Plan is created on signup.
export default function PlansPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plan Board</h1>
          <p className="mt-1 text-muted-foreground">
            Your event plans, each with optional sub-events.
          </p>
        </div>
        <Button>New plan</Button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Plan list goes here</CardTitle>
            <CardDescription>
              Wire up to features/plans listPlans()/createPlan(). Each card
              links to /plans/[planId].
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
