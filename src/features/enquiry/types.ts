export type AvailabilityTone = "available" | "hold" | "out";

export interface EnquiryItem {
  name: string;
  tier: string;
  img: string;
  rate: number;
  qty: number;
  unit: string;
  sku: string;
  loc: string;
  tone: AvailabilityTone;
  availText: string;
  quoteStatus: string;
}
