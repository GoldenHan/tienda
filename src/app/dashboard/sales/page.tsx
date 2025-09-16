import { LogSaleForm } from "@/components/sales/log-sale-form";
import { SalesHistoryTable } from "@/components/sales/sales-history-table";
import { products, sales } from "@/lib/data";

export default function SalesPage() {
  return (
    <div className="flex flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Sales
        </h1>
        <p className="text-muted-foreground">
          Log new sales and view transaction history.
        </p>
      </header>
      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <LogSaleForm products={products} />
          </div>
          <div className="lg:col-span-2">
            <SalesHistoryTable sales={sales} />
          </div>
        </div>
      </main>
    </div>
  );
}
