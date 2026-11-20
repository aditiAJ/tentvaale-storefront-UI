import { redirect } from "next/navigation";

/** The terms are the business's own, written in Settings: this old address opens that one page. */
export default function TermsPage() {
  redirect("/policies/terms");
}
