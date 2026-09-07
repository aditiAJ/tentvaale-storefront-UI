import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Flow 1: browse products, bundles, collections, categories — unauthenticated.
export default function CatalogPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
      <p className="mt-1 text-muted-foreground">
        Products, bundles, and collections. Pricing shown by quantity, area, or
        running length depending on the item.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Product grid goes here</CardTitle>
            <CardDescription>
              Wire up to features/catalog listProducts()/listBundles() with
              React Query, filterable by category.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
