import type { EnquiryItem } from "./types";

// Matches the prototype's INV seed exactly (Enquiry to Quote.dc.html).
// Image paths point at /public/brand/products/ — save the 4 supplied product
// cutouts there (see chat) to make the thumbnails render; until then the
// pure-white card fill still shows correctly, just without the photo.
export const SEED_ITEMS: EnquiryItem[] = [
  {
    name: "Low Haveli Sofa",
    tier: "Heritage Collection",
    img: "/brand/products/low-haveli-sofa.png",
    rate: 18000,
    qty: 2,
    unit: "per piece · 3 days",
    sku: "TV-SOF-0042",
    loc: "WH01-F03-R02-L01",
    tone: "available",
    availText: "12 Available",
    quoteStatus: "Held",
  },
  {
    name: "Chiavari Chair",
    tier: "Banquet Seating",
    img: "/brand/products/chiavari-chair.png",
    rate: 450,
    qty: 120,
    unit: "per chair · 3 days",
    sku: "TV-CHR-0118",
    loc: "WH01-B07-R04-L02",
    tone: "available",
    availText: "400 Available",
    quoteStatus: "Held",
  },
  {
    name: "Tuscany Cane Bench",
    tier: "Premium Collection",
    img: "/brand/products/tuscany-bench.png",
    rate: 9500,
    qty: 6,
    unit: "per bench · 3 days",
    sku: "TV-BNC-0071",
    loc: "WH02-F01-R09-L03",
    tone: "hold",
    availText: "4 On Hold",
    quoteStatus: "Part hold",
  },
  {
    name: "Script Print Loveseat",
    tier: "Studio Collection",
    img: "/brand/products/script-print-loveseat.png",
    rate: 12000,
    qty: 4,
    unit: "per piece · 3 days",
    sku: "TV-LVS-0034",
    loc: "WH01-F05-R01-L01",
    tone: "available",
    availText: "9 Available",
    quoteStatus: "Held",
  },
];

export function formatRupees(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
