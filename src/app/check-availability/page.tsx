import { redirect } from "next/navigation";

// Availability for a date is confirmed on the quotation (storefront plan, decision B7); this page
// listed a fixed set of items all marked "Available", which would mislead, so it is hidden. Old links
// land on the catalog, where each product shows the most a customer can order.
export default function CheckAvailabilityPage() {
  redirect("/catalog");
}
