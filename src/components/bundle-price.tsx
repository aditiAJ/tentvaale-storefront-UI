import { Badge } from "@/components/ui/badge";
import { formatMoney, type Money } from "@/lib/money";

/**
 * A bundle's price as the vendor set it: the one-day sum struck through, the discounted price, and
 * the percentage. A bundle with no discount shows the plain "From" price.
 */
export function BundlePrice({
  bundle,
}: {
  bundle: { fromPricePerEvent: Money; discountPercent?: number; discountedPrice?: Money };
}) {
  const percent = bundle.discountPercent ?? 0;
  if (percent <= 0 || !bundle.discountedPrice) {
    return <span className="font-serif text-lg text-primary">From {formatMoney(bundle.fromPricePerEvent)}</span>;
  }
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="text-sm text-muted-foreground line-through tabular-nums">{formatMoney(bundle.fromPricePerEvent)}</span>
      <span className="font-serif text-lg text-primary tabular-nums">{formatMoney(bundle.discountedPrice)}</span>
      <Badge variant="success">{percent}% off</Badge>
    </span>
  );
}
