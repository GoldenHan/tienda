"use client";

import { useState } from "react";
import { LogSaleForm } from "@/components/sales/log-sale-form";
import { SalesHistoryTable } from "@/components/sales/sales-history-table";
import { products as initialProducts, sales as initialSales } from "@/lib/data";
import { Product, Sale } from "@/lib/types";

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sales, setSales] = useState<Sale[]>(initialSales);

  const handleLogSale = (saleData: {
    productId: string;
    quantity: number;
  }) => {
    const product = products.find((p) => p.id === saleData.productId);
    if (!product) return;

    // Update product quantity
    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.id === saleData.productId
          ? { ...p, quantity: p.quantity - saleData.quantity }
          : p
      )
    );

    // Add to sales history
    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      productName: product.name,
      quantity: saleData.quantity,
      salePrice: product.salePrice,
      total: product.salePrice * saleData.quantity,
      date: new Date().toISOString().split("T")[0],
    };
    setSales((prevSales) => [newSale, ...prevSales]);
  };

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
            <LogSaleForm products={products} onSaleLogged={handleLogSale} />
          </div>
          <div className="lg:col-span-2">
            <SalesHistoryTable sales={sales} />
          </div>
        </div>
      </main>
    </div>
  );
}
