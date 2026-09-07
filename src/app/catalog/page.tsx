"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductThumb } from "@/components/product-thumb";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";

// Flow 1: browse products without an account. Pricing basis (Qty/SqFt/RFt)
// is shown per item, matching admin's Master_Product pricing rule.
export default function CatalogPage() {
  const { products } = useMockStore();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
      <p className="mt-1 text-muted-foreground">
        Products priced by quantity, area, or running length. Add pieces to your Plan Board.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Link key={product.id} href={`/catalog/${product.id}`}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <ProductThumb imageUrl={product.imageUrl} alt={product.name} className="mb-3 aspect-square w-full" />
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="secondary">{product.category}</Badge>
                  <Badge variant="outline">{product.rateType}</Badge>
                </div>
                <CardTitle className="text-base">{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {formatRupees(product.basePrice)} / {product.rateType === "Qty" ? "unit" : product.rateType === "SqFt" ? "sq ft" : "running ft"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
