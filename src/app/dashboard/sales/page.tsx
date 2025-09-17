
"use client";

import { useState } from "react";
import { SalesHistoryTable } from "@/components/sales/sales-history-table";
import { products as initialProducts, sales as initialSales } from "@/lib/data";
import { Product, Sale } from "@/lib/types";

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sales, setSales] = useState<Sale[]>(initialSales);

  // Note: The ability to log sales from this page has been removed.
  // All sales are now logged through the Point of Sale (POS) page.
  // The state management for sales and products will be lifted in a future step
  // to ensure data is consistent across all pages.

  return (
    <div className="flex flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Historial de Ventas
        </h1>
        <p className="text-muted-foreground">
          Consulta el historial de todas las transacciones de venta.
        </p>
      </header>
      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
        <SalesHistoryTable sales={sales} />
      </main>
    </div>
  );
}
