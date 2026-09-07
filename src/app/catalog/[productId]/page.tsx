import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Product detail: select rental time-frame, enter dimensions if priced by
// area/length (Flow 2), "add to Plan" prompts signup if anonymous (Flow 1).
export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Product {productId}</CardTitle>
          <CardDescription>
            Wire up to features/catalog getProduct(). Needs rate-type-aware
            pricing input (Qty vs SqFt vs RFt, see features/catalog/types.ts
            RateType) and an &quot;Add to Plan&quot; action that redirects to
            /signup when anonymous.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
