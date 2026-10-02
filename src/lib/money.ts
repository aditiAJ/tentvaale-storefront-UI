/**
 * Money as the backend sends it: an amount and a currency, never a bare number. The amount arrives
 * as a JSON number (600 or 600.0 depending on the value), so it is read as a number here and only
 * ever formatted, not calculated on. Totals are the backend's to compute.
 */
export interface Money {
  amount: number;
  currency: string;
}

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const inrExact = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "₹4,500" for whole rupees, "₹4,500.50" when there are paise. Other currencies show their code. */
export function formatMoney(money: Money | null | undefined): string {
  if (!money) return "—";
  const whole = Number.isInteger(money.amount);
  if (money.currency === "INR") return "₹" + (whole ? inr : inrExact).format(money.amount);
  return `${money.currency} ${(whole ? inr : inrExact).format(money.amount)}`;
}
