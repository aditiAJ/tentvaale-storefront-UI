import type { CustomerQuotation, QuotationStage } from "@/features/quotations/types";
import { POLICY_LABEL } from "@/features/quotations/tax";
import { apiFetch } from "@/services/api-client";
import type { DocFunction, QuotationDoc } from "./QuotationDocument";
import { loadImageData, loadMarkData, loadQrCodes } from "./pdfAssets";

const amount = (money: { amount: number | string } | null | undefined) => Number(money?.amount ?? 0);

/** "Round Table (Red)" is the product "Round Table" in the variant "Red". */
function splitName(name: string): [string, string | null] {
  const match = /^(.*) \((.+)\)$/.exec(name);
  return match ? [match[1], match[2]] : [name, null];
}

function statusOf(stage: QuotationStage): { status: string; note: string } {
  switch (stage) {
    case "ACCEPTED":
    case "ORDERED":
      return { status: "CONFIRMED", note: "Accepted" };
    case "REJECTED":
    case "CLOSED":
      return { status: "CLOSED", note: "Not going ahead" };
    case "EXPIRED":
      return { status: "EXPIRED", note: "Validity has passed" };
    default:
      return { status: "ESTIMATE", note: "Pending Confirmation" };
  }
}

/**
 * Everything the quotation document prints, from the quotation the customer was sent: the lines grouped by function
 * and category, the totals as the backend worked them out (nothing is calculated here), and the logo, signature,
 * pictures and QR codes loaded as data. Anything that cannot be loaded is simply left out.
 */
export async function buildQuotationDoc(
  q: CustomerQuotation,
  customer: { name: string; email: string | null },
): Promise<QuotationDoc> {
  const groups = new Map<string, DocFunction>();
  for (const line of q.lines) {
    const key = line.functionName ? `${line.functionName}|${line.functionDate ?? ""}` : "";
    let group = groups.get(key);
    if (!group) {
      // A quotation with no functions is one event: it takes the quotation's own date and venue.
      group = line.functionName
        ? { name: line.functionName, date: line.functionDate ?? null, startTime: line.functionStartTime ?? null, venue: line.functionVenue ?? null, lines: [] }
        : { name: "Your Event", date: q.eventDate ?? null, startTime: null, venue: q.venue ?? null, lines: [] };
      groups.set(key, group);
    }
    const [name, variant] = splitName(line.productName);
    group.lines.push({
      name,
      variant,
      quantity: line.quantity,
      days: line.rentalDays,
      rate: amount(line.unitRatePerDay),
      amount: amount(line.lineTotal),
      category: line.categoryName ?? "Items",
      image: line.imageUrl ?? null,
    });
  }

  const company = q.company;
  const urls = [...new Set(q.lines.map((l) => l.imageUrl).filter((u): u is string => Boolean(u)))];
  const [logo, signature, pictures] = await Promise.all([
    loadMarkData(company?.logoUrl),
    loadMarkData(company?.signatureUrl),
    Promise.all(urls.map(async (url) => [url, await loadImageData(url)] as const)),
  ]);
  const images: Record<string, string> = {};
  for (const [url, data] of pictures) if (data) images[url] = data;

  // The text of each policy at the version the quotation was sent with. A policy that cannot be read is left out.
  const policyTexts = (
    await Promise.all(
      (q.policies ?? []).map(async (ref) => {
        try {
          const found = await apiFetch<{ title: string; version: number; body: string }>(
            `storefront/policies/${ref.kind}?version=${ref.version}`,
          );
          return found.body.trim() ? { title: found.title, version: found.version, body: found.body } : null;
        } catch {
          return null;
        }
      }),
    )
  ).filter((p): p is { title: string; version: number; body: string } => p !== null);

  const name = company?.name ?? "Tentvaale";
  const qr = await loadQrCodes({ name, upiId: company?.upiId ?? null, phone: company?.primaryPhone ?? null });
  const tax = q.tax && q.tax.rate != null ? q.tax : null;
  const waived = q.depositWaiver?.waived ?? false;
  const { status, note } = statusOf(q.stage);

  return {
    number: q.quotationNumber,
    issuedOn: q.sentAt?.slice(0, 10) ?? null,
    validUntil: q.validUntil ?? null,
    status,
    statusNote: note,
    customerName: customer.name,
    customerEmail: customer.email,
    eventDate: q.eventDate ?? null,
    venue: q.venue ?? null,
    functions: [...groups.values()],
    subtotal: q.subtotalAmount ? amount(q.subtotalAmount) : null,
    bundleDiscounts: (q.bundleDiscounts ?? []).map((d) => ({ label: `${d.name} (${d.percent}% off)`, amount: amount(d.amount) })),
    discount: amount(q.discountAmount),
    taxable: tax ? amount(tax.taxableAmount) : null,
    taxes: !tax
      ? []
      : tax.intraState
        ? [
            { label: `CGST (${(tax.rate ?? 0) / 2}%)`, amount: amount(tax.cgst) },
            { label: `SGST (${(tax.rate ?? 0) / 2}%)`, amount: amount(tax.sgst) },
          ]
        : [{ label: `IGST (${tax.rate ?? 0}%)`, amount: amount(tax.igst) }],
    delivery: amount(q.deliveryCharge),
    total: amount(q.totalAmount),
    deposit: {
      label: waived ? "Security deposit (waived)" : "Refundable security deposit (not taxed)",
      amount: waived ? amount(q.depositWaiver?.amount) : amount(q.securityDeposit),
    },
    policies: (q.policies ?? []).map((p) => `${POLICY_LABEL[p.kind] ?? p.kind} (v${p.version})`),
    policyTexts,
    company: {
      name,
      address: [company?.addressLine, company?.city, company?.state, company?.postalCode].filter(Boolean).join(", ") || null,
      gstin: company?.gstin ?? null,
      pan: company?.pan ?? null,
      phone: company?.primaryPhone ?? null,
      email: company?.publicEmail ?? null,
      website: company?.websiteUrl ?? null,
      bankName: company?.bankName ?? null,
      bankAccount: company?.bankAccount ?? null,
      bankIfsc: company?.bankIfsc ?? null,
      upiId: company?.upiId ?? null,
      logo,
      signature,
    },
    images,
    picturesMissing: urls.length - Object.keys(images).length,
    qr,
  };
}
