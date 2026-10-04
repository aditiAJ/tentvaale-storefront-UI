import { redirect } from "next/navigation";

// The AI planner has no recommendation engine behind it yet (storefront plan, decision B9), so it is
// hidden rather than shown with made-up suggestions. Old links land on the catalog.
export default function AiPlannerPage() {
  redirect("/catalog");
}
