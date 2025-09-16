import { products } from "@/lib/data"
import { ProductsTable } from "@/components/inventory/products-table"

export default function InventoryPage() {
  return (
    <div className="flex flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Inventory
        </h1>
        <p className="text-muted-foreground">
          Manage your products and track stock levels.
        </p>
      </header>
      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
        <ProductsTable data={products} />
      </main>
    </div>
  )
}
