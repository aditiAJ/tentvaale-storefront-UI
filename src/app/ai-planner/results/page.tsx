import { redirect } from "next/navigation";

// See ../page.tsx: the AI planner is hidden until it has a real recommendation engine.
export default function AiPlannerResultsPage() {
  redirect("/catalog");
}
