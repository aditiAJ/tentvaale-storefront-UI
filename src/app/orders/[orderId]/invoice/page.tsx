"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import {
  Armchair,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CalendarHeart,
  Clock,
  Diamond,
  Download,
  Flame,
  Flower2,
  Gem,
  GlassWater,
  Globe,
  Hand,
  Lamp,
  Mail,
  MapPin,
  Music,
  Package,
  PackageCheck,
  Phone,
  ReceiptText,
  ShieldCheck,
  Sofa,
  Sparkles,
  Tent,
  Truck,
  User,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { formatEventDate } from "@/mock-data/seed";
import { CATEGORIES } from "@/mock-data/taxonomy";
import type { Order, Plan, Product, Quotation } from "@/mock-data/types";

// Printable A4 invoice for one order, laid out like the Tentvaale "Event
// Selection" brochure: cover summary, then per event a detailed estimate page
// and a visual collection page, then payment & terms. "Download" uses the
// browser's Save as PDF — no PDF library needed.
// ponytail: one sheet per section; an event with a very long item list flows
// onto an extra printed page without a repeated header. Paginate lines if that
// becomes common.

const CONTACT = { phone: "87809 83664", email: "info@tentvaale.com", web: "www.tentvaale.com" };

// Categories print in this order; anything else follows alphabetically.
const CATEGORY_ORDER = CATEGORIES.map((c) => c.name);

function byCategoryOrder(a: string, b: string) {
  const rank = (c: string) => (CATEGORY_ORDER.includes(c) ? CATEGORY_ORDER.indexOf(c) : CATEGORY_ORDER.length);
  return rank(a) - rank(b) || a.localeCompare(b);
}

const CATEGORY_ICON: Record<string, LucideIcon> = {
  Furniture: Armchair,
  "Brass elements": Gem,
  "Flower props": Flower2,
  "Carpets and rugs": Diamond,
  "Small props": Sparkles,
  "Floor styling": Package,
  "Monumental installations": Tent,
  Lighting: Lamp,
  Fabric: Sofa,
};

function eventIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("haldi")) return Flame;
  if (n.includes("sangeet") || n.includes("music")) return Music;
  if (n.includes("wedding") || n.includes("engagement") || n.includes("ring")) return Gem;
  if (n.includes("mehendi") || n.includes("mehndi")) return Hand;
  if (n.includes("reception") || n.includes("cocktail")) return GlassWater;
  return CalendarHeart;
}

interface InvoiceLine {
  code: string;
  name: string;
  product?: Product;
  category: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
}

interface InvoiceEvent {
  key: string;
  name: string;
  date?: string;
  startTime?: string;
  venue?: string;
  lines: InvoiceLine[];
  categories: { name: string; lines: InvoiceLine[]; total: number }[];
  total: number;
}

function money(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function rupees(n: number) {
  return "₹ " + Math.round(n).toLocaleString("en-IN");
}
function unitLabel(product: Product | undefined, qty: number) {
  if (product?.rateType === "SqFt") return `${qty} sqft`;
  if (product?.rateType === "RFt") return `${qty} ft`;
  return `${qty} ${qty === 1 ? "No." : "Nos."}`;
}
function timeLabel(hhmm?: string) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"} onwards`;
}
function longDate(iso?: string) {
  if (!iso) return "Date to be confirmed";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function belowThousand(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const restWords = rest < 20 ? ONES[rest] : `${TENS[Math.floor(rest / 10)]}${rest % 10 ? ` ${ONES[rest % 10]}` : ""}`;
  return [hundreds ? `${ONES[hundreds]} Hundred` : "", restWords].filter(Boolean).join(" ");
}
// Indian numbering: crore / lakh / thousand. 556960 -> "Rupees Five Lakh Fifty Six Thousand Nine Hundred Sixty Only".
function rupeesInWords(amount: number): string {
  let n = Math.round(amount);
  if (n === 0) return "Rupees Zero Only";
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${crore >= 1000 ? rupeesInWords(crore).replace(/^Rupees | Only$/g, "") : belowThousand(crore)} Crore`);
  if (lakh) parts.push(`${belowThousand(lakh)} Lakh`);
  if (thousand) parts.push(`${belowThousand(thousand)} Thousand`);
  if (n) parts.push(belowThousand(n));
  return `Rupees ${parts.join(" ")} Only`;
}

function buildEvents(order: Order, quotation: Quotation, plan: Plan, products: Product[]): InvoiceEvent[] {
  const accepted = quotation.lines.filter((l) => l.accepted && l.confirmedQty > 0);
  const subEvents = [...plan.subEvents].sort((a, b) => `${a.eventDate}T${a.startTime ?? ""}`.localeCompare(`${b.eventDate}T${b.startTime ?? ""}`));
  const groups = [...subEvents.map((se) => ({ key: se.id as string | null, se })), { key: null as string | null, se: undefined }];

  return groups
    .map(({ key, se }) => {
      const name = se?.name ?? (plan.generalLabel?.trim() || "Your event");
      const prefix = name.trim().charAt(0).toUpperCase() || "G";
      const lines: InvoiceLine[] = accepted
        .filter((l) => (plan.items.find((it) => it.id === l.planItemId)?.subEventId ?? quotation.subEventId ?? null) === key)
        .map((l) => {
          const product = products.find((p) => p.id === l.productId);
          return {
            code: "",
            name: l.productName,
            product,
            category: product?.category ?? "Other",
            qty: l.confirmedQty,
            unit: unitLabel(product, l.confirmedQty),
            rate: l.unitPrice,
            amount: l.unitPrice * l.confirmedQty,
          };
        });

      const categoryNames = [...new Set(lines.map((l) => l.category))].sort(byCategoryOrder);
      const categories = categoryNames.map((c) => ({ name: c, lines: lines.filter((l) => l.category === c), total: 0 }));
      // Codes follow the printed order (by category), e.g. H-01, H-02 …
      let i = 0;
      for (const cat of categories) {
        for (const line of cat.lines) line.code = `${prefix}-${String(++i).padStart(2, "0")}`;
        cat.total = cat.lines.reduce((s, l) => s + l.amount, 0);
      }

      return {
        key: key ?? "general",
        name,
        date: se?.eventDate,
        startTime: se?.startTime,
        venue: se?.venue ?? order.venue ?? plan.venue,
        lines,
        categories,
        total: lines.reduce((s, l) => s + l.amount, 0),
      };
    })
    .filter((e) => e.lines.length > 0);
}

/* ---------- building blocks ---------- */

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 56" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 22C16 16 26 9 32 2c6 7 16 14 29 20" />
      <path d="M13 18c0 14-3 25-9 34h16l2-6h20l2 6h16c-6-9-9-20-9-34" />
      <rect x="24" y="19" width="16" height="17" rx="4" />
      <path d="M20 27v10a4 4 0 0 0 4 4h16a4 4 0 0 0 4-4V27" />
    </svg>
  );
}

function Brand({ size = "md" }: { size?: "md" | "lg" }) {
  const lg = size === "lg";
  return (
    <div className="flex flex-col items-center text-[#d4a64a]">
      <LogoMark className={lg ? "h-20 w-24" : "h-14 w-16"} />
      <span className={`mt-1 font-serif font-medium tracking-[0.18em] ${lg ? "text-4xl" : "text-2xl"}`}>TENTVAALE</span>
      <span className={`tracking-[0.3em] text-[#f3e7cf] ${lg ? "text-[10px]" : "text-[8px]"}`}>EXPERIENCES, ELEVATED.</span>
      <Ornament className="mt-2 w-40" />
    </div>
  );
}

function Ornament({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <span className="h-px flex-1 bg-[#b8862f]/70" />
      <Diamond className="size-2.5 text-[#b8862f]" />
      <span className="h-px flex-1 bg-[#b8862f]/70" />
    </div>
  );
}

function MetaItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-[#d4a64a]" strokeWidth={1.5} />
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold tracking-[0.14em] text-[#d4a64a] uppercase">{label}</span>
        <span className="text-sm text-[#f7f1e6]">{value}</span>
      </div>
    </div>
  );
}

function IconBadge({ icon: Icon, size = "md" }: { icon: LucideIcon; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "size-16" : size === "sm" ? "size-9" : "size-11";
  const ic = size === "lg" ? "size-7" : size === "sm" ? "size-4" : "size-5";
  return (
    <span className={`flex ${box} shrink-0 items-center justify-center rounded-full border border-[#b8862f] text-[#b8862f]`}>
      <Icon className={ic} strokeWidth={1.5} />
    </span>
  );
}

function Sheet({ children }: { children: React.ReactNode }) {
  return <section className="invoice-sheet mx-auto flex min-h-[297mm] w-[210mm] flex-col bg-[#faf6ef] text-[#1a1a1a] shadow-2xl">{children}</section>;
}

function InnerHeader({ title, subtitle, page, total, dates, venue, billedTo }: { title: string; subtitle: string; page: number; total: number; dates: string; venue: string; billedTo: string }) {
  return (
    <header className="relative grid grid-cols-[180px_1fr_200px] items-center gap-4 border-b-4 border-[#b8862f] bg-[#0d0d0d] px-8 py-6">
      <Brand />
      <div className="flex flex-col items-center border-x border-[#b8862f]/40 px-4 text-center">
        <h2 className="font-serif text-2xl leading-tight tracking-wide text-[#d4a64a] uppercase">{title}</h2>
        <Ornament className="my-2 w-56" />
        <p className="text-xs tracking-wide text-[#f7f1e6]">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        <span className="self-end text-xs text-[#f7f1e6]">
          Page <span className="text-[#d4a64a]">{page}</span> of {total}
        </span>
        <MetaItem icon={CalendarDays} label="Event dates" value={dates} />
        <MetaItem icon={MapPin} label="Venue" value={venue} />
        <MetaItem icon={User} label="Billed to" value={billedTo} />
      </div>
    </header>
  );
}

function SheetFooter({ page, total, dark }: { page: number; total: number; dark?: boolean }) {
  return (
    <footer className={`mt-auto flex items-center gap-6 border-t border-[#b8862f]/50 px-8 py-4 text-xs ${dark ? "bg-[#0d0d0d] text-[#f7f1e6]" : "text-[#3a3a3a]"}`}>
      <div className="flex items-center gap-2 text-[#b8862f]">
        <LogoMark className="h-7 w-8" />
        <div className="flex flex-col leading-tight">
          <span className="font-serif text-sm tracking-[0.18em]">TENTVAALE</span>
          <span className="text-[7px] tracking-[0.25em]">EXPERIENCES, ELEVATED.</span>
        </div>
      </div>
      <span className="h-8 w-px bg-[#b8862f]/40" />
      <span className="flex items-center gap-1.5">
        <Phone className="size-3.5 text-[#b8862f]" /> {CONTACT.phone}
      </span>
      <span className="flex items-center gap-1.5">
        <Mail className="size-3.5 text-[#b8862f]" /> {CONTACT.email}
      </span>
      <span className="flex items-center gap-1.5">
        <Globe className="size-3.5 text-[#b8862f]" /> {CONTACT.web}
      </span>
      <span className="ml-auto text-[#b8862f]">
        Page {page} of {total}
      </span>
    </footer>
  );
}

function EventTitle({ index, event, compact }: { index: number; event: InvoiceEvent; compact?: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <IconBadge icon={eventIcon(event.name)} size="lg" />
      <div className={compact ? "flex items-center gap-5" : "flex flex-col gap-1"}>
        <h3 className="font-serif text-3xl text-[#9a6d1f] uppercase">
          {String(index + 1).padStart(2, "0")}. {event.name}
          {compact ? " Collection" : ""}
        </h3>
        <div className={`text-xs tracking-wide text-[#1a1a1a] uppercase ${compact ? "border-l border-[#b8862f]/50 pl-5" : ""}`}>
          <p>
            {longDate(event.date)}
            {event.startTime && <span className="mx-2 text-[#b8862f]">|</span>}
            {timeLabel(event.startTime)}
          </p>
          {!compact && event.venue && <p className="mt-0.5 normal-case">Venue: {event.venue}</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function OrderInvoicePage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const account = useRequireAccount();
  const { getOrder, getQuotation, getPlan, products, accounts } = useMockStore();
  const order = getOrder(orderId);
  const quotation = order ? getQuotation(order.quotationId) : undefined;
  const plan = order ? getPlan(order.planId) : undefined;
  const invoiceNo = order ? `TV-INV-${new Date(order.createdAt).getFullYear()}-${order.id.slice(-6).toUpperCase()}` : "";
  const ready = Boolean(account && order && quotation && plan);

  // Name the PDF after the invoice, and when opened via "Download Invoice"
  // (?download=1) open the print dialog once every product photo has loaded.
  useEffect(() => {
    if (!ready) return;
    const previousTitle = document.title;
    document.title = `Tentvaale-Invoice-${invoiceNo}`;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (new URLSearchParams(window.location.search).has("download")) {
      const pending = Array.from(document.images)
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            }),
        );
      Promise.all(pending).then(() => {
        if (!cancelled) timer = setTimeout(() => window.print(), 300);
      });
    }
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.title = previousTitle;
    };
  }, [ready, invoiceNo]);

  if (!account) return null;
  if (!order || !quotation || !plan) return <div className="mx-auto w-full max-w-4xl px-4 py-10">Order not found.</div>;

  const events = buildEvents(order, quotation, plan, products);
  const customer = accounts.find((a) => a.id === plan.ownerAccountId) ?? account;
  const subtotal = events.reduce((s, e) => s + e.total, 0);
  const balance = Math.max(0, subtotal - order.paidAmount);
  const dated = events.map((e) => e.date).filter(Boolean).sort() as string[];
  const firstDate = plan.eventStartDate ?? dated[0];
  const lastDate = plan.eventEndDate ?? dated[dated.length - 1];
  const dateRange = firstDate ? (lastDate && lastDate !== firstDate ? `${formatEventDate(firstDate)} – ${formatEventDate(lastDate)}` : formatEventDate(firstDate)) : "To be confirmed";
  const venue = order.venue ?? plan.venue ?? "To be confirmed";
  const status = order.cancelled ? { label: "Cancelled", note: "Refund as per policy" } : balance > 0 ? { label: "Partially Paid", note: `Balance ${rupees(balance)}` } : { label: "Paid", note: "Payment received" };

  // Summary columns: every category used, collapsed to 3 + "Other" when there are more than 4.
  const allCategories = [...new Set(events.flatMap((e) => e.categories.map((c) => c.name)))].sort(byCategoryOrder);
  const summaryColumns = allCategories.length > 4 ? [...allCategories.slice(0, 3), "Other"] : allCategories;
  const columnAmount = (e: InvoiceEvent, col: string) =>
    e.categories.filter((c) => (col === "Other" ? !summaryColumns.slice(0, 3).includes(c.name) : c.name === col)).reduce((s, c) => s + c.total, 0);

  const totalPages = 2 + events.length * 2;
  const inner = { dates: dateRange, venue, billedTo: customer.name };

  return (
    <div className="invoice-root min-h-screen bg-[#2a2622] pb-10">
      <style>{`
        @page { size: A4; margin: 0; }
        .invoice-root, .invoice-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          html, body { background: #faf6ef !important; }
          .invoice-root { background: none; padding: 0; }
          .invoice-toolbar { display: none !important; }
          .invoice-sheet { box-shadow: none; margin: 0 !important; break-after: page; }
          .invoice-sheet:last-child { break-after: auto; }
          .avoid-break { break-inside: avoid; }
        }
      `}</style>

      {/* Toolbar (screen only) */}
      <div className="invoice-toolbar sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#b8862f]/30 bg-[#0d0d0d]/95 px-4 py-3 backdrop-blur md:px-8">
        <Link href={`/orders/${orderId}`} className="flex items-center gap-2 text-sm text-[#f7f1e6] hover:text-[#d4a64a]">
          <ArrowLeft className="size-4" /> Back to order
        </Link>
        <span className="hidden text-sm text-[#f7f1e6]/70 sm:inline">Invoice {invoiceNo}</span>
        <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg bg-[#b8862f] px-4 py-2 text-sm font-medium text-[#0d0d0d] hover:bg-[#d4a64a]">
          <Download className="size-4" /> Download PDF
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="flex w-max flex-col gap-8 px-4 pt-8 print:gap-0 print:p-0 md:mx-auto">
          {/* ============ PAGE 1 — COVER & SUMMARY ============ */}
          <Sheet>
            <header className="relative grid grid-cols-[230px_1fr_220px] items-center gap-4 overflow-hidden rounded-b-[48px] bg-[#0d0d0d] px-8 py-8">
              <Brand size="lg" />
              <div className="flex flex-col items-center border-r border-[#b8862f]/40 pr-4 text-center">
                <h1 className="font-serif text-5xl leading-none tracking-wide text-[#d4a64a]">EVENT</h1>
                <h1 className="font-serif text-5xl leading-tight tracking-wide text-[#d4a64a]">INVOICE</h1>
                <p className="mt-1 font-serif text-lg text-[#d4a64a] italic">Your Event. Your Selection.</p>
                <Ornament className="mt-2 w-40" />
              </div>
              <div className="flex flex-col gap-3">
                <MetaItem icon={ReceiptText} label="Invoice no." value={invoiceNo} />
                <MetaItem icon={CalendarDays} label="Invoice date" value={longDate(order.createdAt)} />
                <MetaItem icon={Clock} label="Order ref." value={`#${order.id}`} />
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0 text-[#d4a64a]" strokeWidth={1.5} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold tracking-[0.14em] text-[#d4a64a] uppercase">Status</span>
                    <div className="mt-1 rounded border border-[#d4a64a] px-3 py-1">
                      <p className="text-sm font-semibold tracking-wider text-[#d4a64a] uppercase">{status.label}</p>
                      <p className="text-[11px] text-[#f7f1e6]">{status.note}</p>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <div className="flex flex-1 flex-col gap-7 px-8 pt-7 pb-6">
              {/* Info strip */}
              <div className="grid grid-cols-4 divide-x divide-[#b8862f]/30 border-b border-[#b8862f]/40 pb-5">
                {[
                  { icon: User, label: "Billed to", value: customer.name, sub: customer.email },
                  { icon: CalendarHeart, label: "Event", value: plan.name, sub: `${events.length} function${events.length === 1 ? "" : "s"}` },
                  { icon: CalendarDays, label: "Event dates", value: dateRange },
                  { icon: MapPin, label: "Venue", value: venue },
                ].map(({ icon, label, value, sub }) => (
                  <div key={label} className="flex items-center gap-3 px-3 first:pl-0">
                    <IconBadge icon={icon} />
                    <div className="flex min-w-0 flex-col">
                      <span className="text-[10px] font-semibold tracking-[0.12em] text-[#9a6d1f] uppercase">{label}</span>
                      <span className="truncate text-sm font-semibold">{value}</span>
                      {sub && <span className="truncate text-[11px] text-[#6b6257]">{sub}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* 01. Event wise summary */}
              <div className="avoid-break flex flex-col gap-3">
                <h2 className="text-lg font-semibold tracking-wide text-[#9a6d1f] uppercase">01. Event wise summary</h2>
                <div className="overflow-hidden rounded-lg border border-[#e7dcc8]">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#0d0d0d] text-[10px] font-semibold tracking-wider text-white uppercase">
                        <th className="px-3 py-3 text-left">Function / Event</th>
                        <th className="px-3 py-3">Date</th>
                        {summaryColumns.map((c) => (
                          <th key={c} className="px-3 py-3">
                            {c} (₹)
                          </th>
                        ))}
                        <th className="bg-[#b8862f] px-3 py-3">Subtotal (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((e) => (
                        <tr key={e.key} className="border-b border-[#e7dcc8] text-center">
                          <td className="px-3 py-3 text-left">
                            <span className="flex items-center gap-3">
                              <IconBadge icon={eventIcon(e.name)} size="sm" />
                              <span className="uppercase">{e.name}</span>
                            </span>
                          </td>
                          <td className="px-3 py-3 text-xs">
                            {e.date ? formatEventDate(e.date) : "—"}
                            {e.startTime && <span className="block text-[#6b6257]">{timeLabel(e.startTime).replace(" onwards", "")}</span>}
                          </td>
                          {summaryColumns.map((c) => (
                            <td key={c} className="px-3 py-3">
                              {columnAmount(e, c) ? Math.round(columnAmount(e, c)).toLocaleString("en-IN") : "—"}
                            </td>
                          ))}
                          <td className="px-3 py-3 font-serif text-lg text-[#9a6d1f]">{Math.round(e.total).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                      <tr className="bg-[#f3eadb] text-center font-semibold">
                        <td className="px-3 py-3 text-left uppercase" colSpan={2}>
                          Total
                        </td>
                        {summaryColumns.map((c) => (
                          <td key={c} className="px-3 py-3 text-[#9a6d1f]">
                            {Math.round(events.reduce((s, e) => s + columnAmount(e, c), 0)).toLocaleString("en-IN")}
                          </td>
                        ))}
                        <td className="px-3 py-3 font-serif text-xl text-[#9a6d1f]">{Math.round(subtotal).toLocaleString("en-IN")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 02. Commercial summary + grand total */}
              <div className="avoid-break grid grid-cols-[1fr_1.1fr] gap-6">
                <div className="flex flex-col gap-2 text-sm">
                  <h2 className="mb-1 text-lg font-semibold tracking-wide text-[#9a6d1f] uppercase">02. Commercial summary</h2>
                  <Row label="Subtotal" value={money(subtotal)} />
                  <Row label="Refundable security deposit (included)" value={money(order.depositAmount)} />
                  <div className="my-1 border-t border-[#b8862f]/50" />
                  <Row label="Amount paid" value={money(order.paidAmount)} strong />
                  <Row label="Balance due" value={money(balance)} />
                  <p className="mt-1 text-[11px] text-[#6b6257]">Taxes as applicable per government norms.</p>
                </div>
                <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-[#b8862f] bg-[#0d0d0d] px-6 py-6 text-center">
                  <span className="font-serif text-lg tracking-widest text-[#d4a64a] uppercase">Grand Total</span>
                  <Ornament className="my-2 w-32" />
                  <span className="font-serif text-4xl text-[#d4a64a]">₹ {money(subtotal)}</span>
                  <span className="mt-3 text-xs text-[#d4a64a]">Amount in words</span>
                  <span className="mt-1 text-sm text-[#f7f1e6]">{rupeesInWords(subtotal)}</span>
                  <Tent className="absolute -right-4 -bottom-6 size-32 text-[#b8862f]/15" strokeWidth={0.75} />
                </div>
              </div>

              {/* What's included */}
              <div className="avoid-break relative rounded-lg border border-[#e7dcc8] px-4 pt-5 pb-4">
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#faf6ef] px-3 text-sm font-semibold tracking-wide text-[#9a6d1f] uppercase">What&apos;s included</span>
                <div className="grid grid-cols-4 divide-x divide-[#e7dcc8] text-xs">
                  {[
                    { icon: Truck, label: "Delivery & Installation" },
                    { icon: ShieldCheck, label: "On-site Supervision" },
                    { icon: Wrench, label: "Basic Tool Kit & Ancillaries" },
                    { icon: PackageCheck, label: "Standard Packing & Handling" },
                  ].map(({ icon, label }) => (
                    <div key={label} className="flex items-center justify-center gap-2 px-2">
                      <IconBadge icon={icon} size="sm" />
                      <span className="max-w-24">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thank you + signatory */}
              <div className="avoid-break grid grid-cols-2 divide-x divide-[#b8862f]/40 rounded-lg border border-[#e7dcc8] bg-white/50 px-5 py-4">
                <div className="flex flex-col gap-1 pr-5">
                  <span className="font-serif text-4xl leading-none text-[#b8862f]">&ldquo;</span>
                  <p className="text-sm font-semibold">Thank you for choosing Tentvaale.</p>
                  <p className="text-xs text-[#6b6257]">We look forward to being a part of your special event.</p>
                </div>
                <div className="flex flex-col justify-end gap-1 pl-5 text-sm">
                  <span>For TENTVAALE</span>
                  <span className="mt-8 border-t border-[#b8862f]/60 pt-1 text-xs text-[#6b6257]">Authorised Signatory</span>
                </div>
              </div>
            </div>
            <SheetFooter page={1} total={totalPages} />
          </Sheet>

          {/* ============ PER EVENT — DETAILED + COLLECTION ============ */}
          {events.flatMap((event, index) => [
            <Sheet key={`${event.key}-detail`}>
              <InnerHeader title="Detailed Selection & Invoice" subtitle={`Invoice No. : ${invoiceNo}`} page={2 + index * 2} total={totalPages} {...inner} />
              <div className="flex flex-1 flex-col gap-5 px-8 pt-6 pb-6">
                <EventTitle index={index} event={event} />
                {event.categories.map((cat, ci) => {
                  const Icon = CATEGORY_ICON[cat.name] ?? Package;
                  return (
                    <div key={cat.name} className="avoid-break flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <IconBadge icon={Icon} size="sm" />
                        <h4 className="text-base font-semibold tracking-wide text-[#9a6d1f] uppercase">
                          {String.fromCharCode(65 + ci)}. {cat.name}
                        </h4>
                      </div>
                      <div className="overflow-hidden rounded-md border border-[#e7dcc8]">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-[#0d0d0d] text-[11px] font-semibold tracking-wider text-white uppercase">
                              <th className="w-16 border-r border-white/15 px-3 py-2.5">#</th>
                              <th className="border-r border-white/15 px-3 py-2.5">Item</th>
                              <th className="w-28 border-r border-white/15 px-3 py-2.5">Qty</th>
                              <th className="w-28 border-r border-white/15 px-3 py-2.5">Rate (₹)</th>
                              <th className="w-32 px-3 py-2.5">Amount (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cat.lines.map((l) => (
                              <tr key={l.code} className="border-b border-[#e7dcc8] text-center">
                                <td className="border-r border-[#e7dcc8] px-3 py-3 text-[#9a6d1f]">{l.code}</td>
                                <td className="border-r border-[#e7dcc8] px-4 py-3 text-left">{l.name}</td>
                                <td className="border-r border-[#e7dcc8] px-3 py-3">{l.unit}</td>
                                <td className="border-r border-[#e7dcc8] px-3 py-3">{money(l.rate)}</td>
                                <td className="px-3 py-3">{money(l.amount)}</td>
                              </tr>
                            ))}
                            <tr>
                              <td colSpan={4} className="border-r border-[#e7dcc8] px-4 py-2.5 text-right text-xs font-semibold tracking-wider uppercase">
                                {cat.name} total
                              </td>
                              <td className="px-3 py-2.5 text-center font-serif text-lg text-[#9a6d1f]">{money(cat.total)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
                <div className="avoid-break mt-auto flex items-stretch overflow-hidden rounded-md border border-[#b8862f]">
                  <div className="flex flex-1 items-center gap-3 bg-[#f3eadb] px-5 py-3">
                    <IconBadge icon={eventIcon(event.name)} size="sm" />
                    <span className="font-serif text-xl tracking-wide text-[#9a6d1f] uppercase">{event.name} selection total</span>
                  </div>
                  <div className="flex items-center bg-[#b8862f] px-6 font-serif text-2xl text-white">₹ {money(event.total)}</div>
                </div>
              </div>
              <SheetFooter page={2 + index * 2} total={totalPages} />
            </Sheet>,

            <Sheet key={`${event.key}-collection`}>
              <InnerHeader title="Selected Collection" subtitle="A visual reference of your selections" page={3 + index * 2} total={totalPages} {...inner} />
              <div className="flex flex-1 flex-col gap-5 px-8 pt-6 pb-6">
                <EventTitle index={index} event={event} compact />
                {event.categories.map((cat) => (
                  <div key={cat.name} className="avoid-break flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.14em] text-[#9a6d1f] uppercase">
                      <span className="h-px flex-1 bg-[#b8862f]/50" />
                      {cat.name}
                      <span className="h-px flex-1 bg-[#b8862f]/50" />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {cat.lines.map((l) => (
                        <div key={l.code} className="overflow-hidden rounded-md border border-[#e7dcc8] bg-white">
                          <div className="relative flex aspect-[4/3] items-center justify-center bg-[#efe6d6]">
                            {l.product?.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={l.product.imageUrl} alt={l.name} className="size-full object-cover" />
                            ) : (
                              <Package className="size-10 text-[#b8862f]/60" strokeWidth={1.25} />
                            )}
                            <span className="absolute top-2 left-2 rounded bg-[#9a6d1f] px-1.5 py-0.5 text-[10px] text-white">{l.code}</span>
                          </div>
                          <div className="flex items-baseline justify-between gap-2 px-3 py-2 text-xs">
                            <span className="truncate">{l.name}</span>
                            <span className="shrink-0 text-[#9a6d1f]">{l.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="avoid-break mt-auto flex justify-end">
                  <div className="flex items-center gap-5 rounded-lg border border-[#e7dcc8] bg-[#f3eadb] px-6 py-4">
                    <IconGlyph icon={eventIcon(event.name)} className="size-10 text-[#b8862f]/60" strokeWidth={1} />
                    <div className="flex flex-col items-center gap-2 border-l border-[#b8862f]/40 pl-5">
                      <span className="text-sm tracking-wider uppercase">{event.name} total</span>
                      <span className="rounded bg-[#9a6d1f] px-5 py-1.5 font-serif text-2xl text-white">{rupees(event.total)}</span>
                    </div>
                  </div>
                </div>
                <p className="flex items-center justify-center gap-2 rounded border border-[#b8862f]/40 px-4 py-2 text-xs">
                  <Sparkles className="size-3.5 text-[#b8862f]" />
                  <span>
                    <b className="text-[#9a6d1f]">NOTE:</b> Images are for reference only. Actual products may vary slightly in colour, texture &amp; finish.
                  </span>
                </p>
              </div>
              <SheetFooter page={3 + index * 2} total={totalPages} dark />
            </Sheet>,
          ])}

          {/* ============ LAST PAGE — PAYMENT & TERMS ============ */}
          <Sheet>
            <InnerHeader title="Payment, Terms & Confirmation" subtitle={`Invoice No. : ${invoiceNo}`} page={totalPages} total={totalPages} {...inner} />
            <div className="flex flex-1 flex-col gap-6 px-8 pt-6 pb-6">
              <div className="avoid-break grid grid-cols-2 gap-5">
                <div className="overflow-hidden rounded-lg border border-[#e7dcc8] bg-white/50">
                  <div className="bg-[#0d0d0d] py-3 text-center text-sm tracking-wider text-white uppercase">Payment details</div>
                  <div className="flex flex-col gap-2.5 px-5 py-4 text-sm">
                    <Row label="Order reference" value={`#${order.id}`} />
                    <Row label="Payment date" value={longDate(order.createdAt)} />
                    <Row label="Payment status" value={status.label} strong />
                    <Row label="Amount paid" value={`₹ ${money(order.paidAmount)}`} />
                    <Row label="Security deposit held" value={`₹ ${money(order.depositAmount)}`} />
                    <Row label="Deposit status" value={order.depositStatus === "RefundPending" ? "Refund pending" : order.depositStatus} />
                    <p className="mt-1 text-xs text-[#9a6d1f]">For payment queries, WhatsApp us on +91 {CONTACT.phone}</p>
                  </div>
                </div>
                <div className="overflow-hidden rounded-lg border border-[#e7dcc8] bg-white/50">
                  <div className="bg-[#0d0d0d] py-3 text-center text-sm tracking-wider text-white uppercase">Commercial summary</div>
                  <div className="flex flex-col gap-3 px-5 py-4 text-sm">
                    {events.map((e, i) => (
                      <div key={e.key} className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="flex size-5 items-center justify-center rounded-full bg-[#b8862f] text-[10px] text-white">{i + 1}</span>
                          {e.name}
                          {e.date && <span className="text-[#6b6257]">({formatEventDate(e.date)})</span>}
                        </span>
                        <span>{rupees(e.total)}</span>
                      </div>
                    ))}
                    <div className="border-t border-[#e7dcc8]" />
                    <Row label="SUB TOTAL" value={rupees(subtotal)} />
                    <Row label="PAID" value={rupees(order.paidAmount)} />
                    <div className="flex items-stretch overflow-hidden rounded border border-[#b8862f]">
                      <span className="flex-1 bg-[#f3eadb] px-3 py-2 font-semibold tracking-wide text-[#9a6d1f]">GRAND TOTAL</span>
                      <span className="bg-[#b8862f] px-4 py-2 font-serif text-lg text-white">{rupees(subtotal)}</span>
                    </div>
                    <p className="text-[11px] text-[#6b6257] italic">Taxes are as applicable as per government norms.</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="h-px flex-1 bg-[#b8862f]/50" />
                <h3 className="font-serif text-2xl text-[#9a6d1f] uppercase">Terms &amp; Conditions</h3>
                <span className="h-px flex-1 bg-[#b8862f]/50" />
              </div>
              <div className="grid grid-cols-2 gap-x-8">
                {[
                  { icon: CalendarDays, title: "Booking & Confirmation", body: "Your booking is confirmed against the payment recorded on this invoice." },
                  { icon: Clock, title: "Installation & Dismantling", body: "Installation & dismantling are included for the scheduled event dates." },
                  { icon: ReceiptText, title: "Payment Terms", body: "Rental charges are non-refundable once dispatched. The security deposit is refunded after return inspection." },
                  { icon: ShieldCheck, title: "Force Majeure", body: "Tentvaale is not liable for delays due to natural calamities, strikes or events beyond our control." },
                  { icon: Truck, title: "Transportation", body: "Transportation, loading & unloading are included within city limits." },
                  { icon: CalendarHeart, title: "Cancellation", body: "Cancellation must be requested in writing. Charges apply as per the timeline." },
                  { icon: Package, title: "Damage & Breakage", body: "Inform us immediately. Charges apply for any damage or breakage." },
                  { icon: Sparkles, title: "Others", body: "Additional items or services requested on-site will be charged extra." },
                ].map(({ icon, title, body }) => (
                  <div key={title} className="avoid-break flex items-start gap-3 border-b border-[#e7dcc8] py-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0d0d0d] text-[#f7f1e6]">
                      <IconGlyph icon={icon} className="size-4" strokeWidth={1.5} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold tracking-wide text-[#9a6d1f] uppercase">{title}</p>
                      <p className="text-xs text-[#3a3a3a]">{body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="avoid-break grid grid-cols-2 gap-6 rounded-md border-l-4 border-[#b8862f] bg-[#f3eadb] px-5 py-3 text-[11px]">
                <div>
                  <p className="mb-1 text-sm font-semibold tracking-wide text-[#9a6d1f] uppercase">Important notes</p>
                  <p>• All measurements are approximate.</p>
                  <p>• Colours &amp; textures may vary slightly from images.</p>
                </div>
                <div className="pt-6">
                  <p>• Items are subject to availability.</p>
                  <p>• Tentvaale may substitute an equivalent item if required.</p>
                </div>
              </div>

              <div className="avoid-break grid grid-cols-2 gap-8 rounded-lg border border-[#e7dcc8] px-6 py-5">
                <div className="flex flex-col gap-1 text-sm">
                  <p className="text-sm font-semibold tracking-wide text-[#9a6d1f] uppercase">Billed to</p>
                  <p className="font-semibold">{customer.name}</p>
                  <p className="text-[#6b6257]">{customer.email}</p>
                  {customer.phone && <p className="text-[#6b6257]">{customer.phone}</p>}
                  <p className="mt-2 text-xs text-[#6b6257]">Event: {plan.name}</p>
                </div>
                <div className="flex flex-col gap-3 text-sm">
                  <p className="text-sm font-semibold tracking-wide text-[#9a6d1f] uppercase">Authorised signatory</p>
                  {["Name", "Signature", "Date"].map((f) => (
                    <div key={f} className="flex items-end gap-3">
                      <span className="w-16 text-xs">{f}:</span>
                      <span className="flex-1 border-b border-[#1a1a1a]/40" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <footer className="mt-auto grid grid-cols-[1fr_auto_1fr] items-center gap-6 bg-[#0d0d0d] px-8 py-5 text-xs text-[#f7f1e6]">
              <div className="flex items-center gap-3 text-[#d4a64a]">
                <LogoMark className="h-10 w-12" />
                <div className="flex flex-col leading-tight">
                  <span className="font-serif text-lg tracking-[0.18em]">TENTVAALE</span>
                  <span className="text-[8px] tracking-[0.25em]">EXPERIENCES, ELEVATED.</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 border-x border-[#b8862f]/40 px-6">
                <span className="flex items-center gap-2">
                  <Phone className="size-3.5 text-[#d4a64a]" /> {CONTACT.phone}
                </span>
                <span className="flex items-center gap-2">
                  <Mail className="size-3.5 text-[#d4a64a]" /> {CONTACT.email}
                </span>
                <span className="flex items-center gap-2">
                  <Globe className="size-3.5 text-[#d4a64a]" /> {CONTACT.web}
                </span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="font-serif text-3xl text-[#d4a64a] italic">Thank You!</span>
                <span className="mt-1 tracking-wider uppercase">We look forward to creating extraordinary experiences for you.</span>
              </div>
            </footer>
          </Sheet>
        </div>
      </div>
    </div>
  );
}

function IconGlyph({ icon: Icon, className, strokeWidth }: { icon: LucideIcon; className?: string; strokeWidth?: number }) {
  return <Icon className={className} strokeWidth={strokeWidth} />;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "font-semibold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
