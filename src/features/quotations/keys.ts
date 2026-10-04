export const quotationKeys = {
  all: ["quotations"] as const,
  detail: (requestId: string) => ["quotations", requestId] as const,
  requests: ["quotation-requests"] as const,
};
