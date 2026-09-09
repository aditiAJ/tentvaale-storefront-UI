import { Info } from "lucide-react";

// Flowstep screen 51 (desktop) — static legal content page, no mobile variant fetched.
const SECTIONS = [
  {
    title: "1. Bookings & Plans",
    body: "Bookings are confirmed when you accept a plan and complete the required payment. A plan may include multiple event dates, products, services, and delivery arrangements. Availability is not held until Tentvaale confirms your order.",
  },
  {
    title: "2. Quotations & Orders",
    body: "Quotations are prepared according to the products, dates, venue, and requirements shared with us. A quotation is subject to availability and may change before confirmation. An order becomes binding once it has been confirmed by Tentvaale and the applicable payment has been received.",
  },
  {
    title: "3. Payments",
    body: "Payments must be made through the payment methods presented at checkout. Rental charges and security deposits are shown separately where applicable. Security deposits are held against loss or damage and are handled in accordance with the cancellation and inspection terms below.",
  },
  {
    title: "4. Cancellations",
    body: "Rental charges are non-refundable once an order is confirmed. If an order is cancelled before the event date, the security deposit is refunded immediately via Razorpay. If an order is cancelled after the event date, the security deposit enters Pending Review status and remains subject to an admin damage inspection before its release or adjustment.",
  },
  {
    title: "5. Delivery & Damages",
    body: "Customers are responsible for providing accurate delivery details, access, and venue information. Items must be used with reasonable care and returned in the condition in which they were delivered. Damage, loss, or missing items may be assessed during inspection and deducted from the security deposit where appropriate.",
  },
  {
    title: "6. Liability",
    body: "Tentvaale will take reasonable care in preparing and delivering confirmed orders. To the extent permitted by law, Tentvaale is not liable for indirect or consequential loss arising from delays, venue restrictions, circumstances beyond its reasonable control, or the misuse of rented items.",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <header className="mb-8 flex flex-col gap-2">
        <h1 className="font-serif text-4xl tracking-tight text-foreground">Terms &amp; Refund Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: October 2025</p>
      </header>

      <section className="mb-10 flex flex-col gap-5 rounded-lg border border-primary bg-card p-6">
        <div className="flex items-center gap-3">
          <Info className="size-5 text-primary" />
          <h2 className="font-serif text-2xl text-foreground">Refund Policy at a Glance</h2>
        </div>
        <ul className="flex list-disc flex-col gap-4 pl-6 text-lg leading-relaxed text-foreground">
          <li>Rental charges are non-refundable once an order is confirmed.</li>
          <li>Security deposits are refunded immediately via Razorpay if cancelled before the event date.</li>
          <li>Security deposits enter Pending Review status if cancelled after the event date, subject to admin damage inspection.</li>
        </ul>
      </section>

      <article className="flex flex-col gap-8 text-base leading-8 text-foreground/80">
        {SECTIONS.map((s) => (
          <section key={s.title} className="flex flex-col gap-2">
            <h2 className="font-serif text-2xl text-foreground">{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
      </article>
    </div>
  );
}
