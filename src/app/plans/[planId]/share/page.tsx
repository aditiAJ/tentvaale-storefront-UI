import { redirect } from "next/navigation";

// Sharing a plan with co-owners or view-only planners is a later phase (the plan is single-owner for
// now, decision B8). Old links to this address land back on the plan.
export default async function SharePage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  redirect(`/plans/${planId}`);
}
