export interface QuotationLink {
  id: string;
  planId: string;
  subEventId: string | null; // null = plan-level quotation
  adminQuotationId: string;
  statusCache: string;
}

// Quotation line as returned by the admin's negotiation flow, projected for the storefront.
// Full authority on pricing/status stays with admin (Contexts/Specs/13-Quotation-Management.md).
export interface QuotationLine {
  planItemId: string;
  adminProductId: string;
  productName: string;
  requestedQty: number;
  confirmedQty: number;
  unitPrice: number;
  lineStatus: "Confirmed" | "Adjusted" | "Rejected";
}

export interface QuotationDetail extends QuotationLink {
  lines: QuotationLine[];
  round: number; // negotiation round, full history kept (Flow 5)
  payableAmount: number;
  validUntil: string;
}
