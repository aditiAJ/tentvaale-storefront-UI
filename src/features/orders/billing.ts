import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/services/api-client";
import type { Money } from "@/lib/money";

/** One payment the business has received and confirmed. Unconfirmed money is never shown here. */
export interface ReceivedPayment {
  id: string;
  purpose: "RENTAL" | "DEPOSIT";
  mode: string;
  amount: Money;
  paidOn: string;
  receiptNumber: string | null;
}

export interface ScheduleLine {
  id: string;
  label: string;
  dueOn: string;
  amount: Money;
  paid: boolean;
}

export interface OrderBilling {
  total: Money;
  creditApplied: Money;
  verifiedPaid: Money;
  balance: Money;
  depositRequired: Money;
  depositReceived: Money;
  payments: ReceivedPayment[];
  schedule: ScheduleLine[];
}

export type DocumentKind = "TAX_INVOICE" | "FINAL_INVOICE" | "RECEIPT";

export const DOCUMENT_LABEL: Record<DocumentKind, string> = {
  TAX_INVOICE: "Tax invoice",
  FINAL_INVOICE: "Final invoice",
  RECEIPT: "Receipt",
};

export interface DocumentBody {
  seller?: {
    name?: string;
    gstin?: string | null;
    pan?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    phone?: string | null;
    email?: string | null;
    bankName?: string | null;
    bankAccount?: string | null;
    bankIfsc?: string | null;
    upiId?: string | null;
    logoUrl?: string | null;
    signatureUrl?: string | null;
  };
  buyer?: { name?: string; email?: string | null; gstin?: string | null; state?: string | null };
  lines?: { description: string; quantity: number; days: number; amount: number }[];
  itemsTotal?: number;
  discounts?: number;
  delivery?: number;
  tax?: { rate: number; taxableAmount: number; cgst: number; sgst: number; igst: number; intraState: boolean };
  total?: number;
  securityDeposit?: number;
  creditNotesApplied?: number;
  rentalReceived?: number;
  balanceDue?: number;
  payment?: { purpose: string; mode: string; reference: string | null; paidOn: string; amount: number };
  orderTotal?: number;
  receivedToDate?: number;
  balanceAfter?: number;
}

export interface OrderDocument {
  id: string;
  kind: DocumentKind;
  number: string;
  orderId: string;
  orderNumber: string;
  issuedOn: string;
  total: Money;
  body: DocumentBody;
}

const base = (orderId: string) => `storefront/orders/${encodeURIComponent(orderId)}`;

export function useOrderBilling(orderId: string) {
  return useQuery({
    queryKey: ["orders", orderId, "billing"],
    queryFn: ({ signal }) => apiFetch<OrderBilling>(`${base(orderId)}/billing`, { signal }),
    retry: false,
    refetchOnWindowFocus: true,
  });
}

export function useOrderDocuments(orderId: string) {
  return useQuery({
    queryKey: ["orders", orderId, "documents"],
    queryFn: ({ signal }) => apiFetch<OrderDocument[]>(`${base(orderId)}/documents`, { signal }),
    retry: false,
    refetchOnWindowFocus: true,
  });
}

export function useOrderDocument(orderId: string, documentId: string) {
  return useQuery({
    queryKey: ["orders", orderId, "documents", documentId],
    queryFn: ({ signal }) => apiFetch<OrderDocument>(`${base(orderId)}/documents/${encodeURIComponent(documentId)}`, { signal }),
    retry: false,
  });
}
