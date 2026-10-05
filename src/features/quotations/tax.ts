import type { Money } from "@/lib/money";
import type { QuotationTax } from "@/features/quotations/types";

/** The GST lines to show, in order: taxable amount, then CGST + SGST or IGST. Empty until a rate was applied. */
export function taxLines(tax?: QuotationTax): { label: string; value: Money }[] {
  if (!tax || tax.rate == null) return [];
  const lines = [{ label: "Taxable amount", value: tax.taxableAmount }];
  if (tax.intraState) {
    lines.push({ label: `CGST (${tax.rate / 2}%)`, value: tax.cgst }, { label: `SGST (${tax.rate / 2}%)`, value: tax.sgst });
  } else {
    lines.push({ label: `IGST (${tax.rate}%)`, value: tax.igst });
  }
  return lines;
}

export const POLICY_LABEL: Record<string, string> = {
  CANCELLATION: "Cancellation policy",
  DAMAGE: "Damage policy",
  DELIVERY: "Delivery policy",
  TERMS: "Terms and conditions",
};
