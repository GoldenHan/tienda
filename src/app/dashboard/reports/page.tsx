"use client";

import { useState } from "react";
import { sales as initialSales } from "@/lib/data";
import { Sale } from "@/lib/types";
import { SalesReport } from "@/components/reports/sales-report";

export default function ReportsPage() {
  const [sales, setSales] = useState<Sale[]>(initialSales);

  return (
    <div className="flex flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Generador de Reportes
        </h1>
        <p className="text-muted-foreground">
          Filtra y exporta tus reportes de ventas.
        </p>
      </header>
      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
        <SalesReport allSales={sales} />
      </main>
    </div>
  );
}
