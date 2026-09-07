"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductThumb } from "@/components/product-thumb";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";

export default function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const router = useRouter();
  const { products, currentAccount, plans, addPlanItem } = useMockStore();

  const product = products.find((p) => p.id === productId);
  const myPlans = useMemo(
    () => plans.filter((p) => p.ownerAccountId === currentAccount?.id && p.status === "Draft"),
    [plans, currentAccount],
  );

  const [planId, setPlanId] = useState<string>(myPlans[0]?.id ?? "");
  const [subEventId, setSubEventId] = useState<string>("__general");
  const [quantity, setQuantity] = useState(1);
  const [length, setLength] = useState(10);

  if (!product) {
    return <div className="mx-auto w-full max-w-4xl px-4 py-10">Product not found.</div>;
  }

  const selectedPlan = myPlans.find((p) => p.id === planId);
  const needsDimensions = product.rateType !== "Qty";

  function handleAdd() {
    if (!currentAccount) {
      router.push("/signup");
      return;
    }
    if (!planId) {
      toast.error("Create a Plan first from the Plan Board.");
      return;
    }
    addPlanItem(planId, {
      productId: product!.id,
      quantity,
      subEventId: subEventId === "__general" ? null : subEventId,
      dimensions: needsDimensions ? { length } : undefined,
    });
    toast.success(`Added ${product!.name} to plan.`);
    router.push(`/plans/${planId}`);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Card>
        <CardHeader>
          <ProductThumb imageUrl={product.imageUrl} alt={product.name} className="mb-4 aspect-video w-full" />
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary">{product.category}</Badge>
            <Badge variant="outline">{product.rateType}</Badge>
          </div>
          <CardTitle className="text-2xl">{product.name}</CardTitle>
          <CardDescription>
            {formatRupees(product.basePrice)} / {product.rateType === "Qty" ? "unit" : product.rateType === "SqFt" ? "sq ft" : "running ft"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {needsDimensions ? (
            <div className="space-y-2">
              <Label htmlFor="length">{product.rateType === "SqFt" ? "Area (sq ft)" : "Length (running ft)"}</Label>
              <Input id="length" type="number" min={1} value={length} onChange={(e) => setLength(Number(e.target.value))} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input id="qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
          )}

          {currentAccount && (
            <>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={planId} onValueChange={(v) => setPlanId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {myPlans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedPlan && selectedPlan.subEvents.length > 0 && (
                <div className="space-y-2">
                  <Label>Tag to sub-event</Label>
                  <Select value={subEventId} onValueChange={(v) => setSubEventId(v ?? "__general")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__general">General (no sub-event)</SelectItem>
                      {selectedPlan.subEvents.map((se) => (
                        <SelectItem key={se.id} value={se.id}>
                          {se.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <Button className="w-full" onClick={handleAdd}>
            Add to Plan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
