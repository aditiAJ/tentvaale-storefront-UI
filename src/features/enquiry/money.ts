import type { EnquiryItem } from "./types";

// Matches the prototype's logistics maths exactly (Enquiry to Quote.dc.html).
export const CHARGES = {
  delivery: 24000,
  install: 42000,
  dismantle: 18000,
};

export function computeTotals(items: EnquiryItem[]) {
  const subtotal = items.reduce((a, it) => a + it.rate * it.qty, 0);
  const logistics = CHARGES.delivery + CHARGES.install + CHARGES.dismantle;
  const gst = (subtotal + logistics) * 0.18;
  const total = subtotal + logistics + gst;
  const deposit = Math.round((subtotal * 0.1) / 1000) * 1000;
  const pieceCount = items.reduce((a, it) => a + it.qty, 0);
  return { subtotal, logistics, gst, total, deposit, pieceCount, count: items.length };
}
