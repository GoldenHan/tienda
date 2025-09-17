
"use client";

import { useState } from "react";
import { SalesHistoryAccordion } from "@/components/sales/sales-history-accordion";
import { products as initialProducts, sales as initialSales } from "@/lib/data";
import { Product, Sale } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const { toast } = useToast();

  const handleUpdateSale = (updatedSale: Sale) => {
    setSales(prevSales => {
      const saleIndex = prevSales.findIndex(s => s.id === updatedSale.id);
      if (saleIndex === -1) return prevSales;

      const originalSale = prevSales[saleIndex];
      const newSales = [...prevSales];
      newSales[saleIndex] = updatedSale;

      // Adjust product stock based on the changes
      setProducts(prevProducts => {
        const updatedProducts = [...prevProducts];

        // Revert quantities from the original sale
        originalSale.items.forEach(item => {
          const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
          if (productIndex !== -1) {
            updatedProducts[productIndex].quantity += item.quantity;
          }
        });

        // Apply new quantities from the updated sale
        updatedSale.items.forEach(item => {
          const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
          if (productIndex !== -1) {
            updatedProducts[productIndex].quantity -= item.quantity;
          }
        });

        return updatedProducts;
      });
      
      toast({
        title: "Venta Actualizada",
        description: `La transacción ${updatedSale.id} ha sido modificada.`,
      });

      return newSales;
    });
  };

  return (
    <div className="flex flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Historial de Ventas
        </h1>
        <p className="text-muted-foreground">
          Consulta y edita el historial de todas las transacciones de venta.
        </p>
      </header>
      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
        <SalesHistoryAccordion sales={sales} products={products} onUpdateSale={handleUpdateSale} />
      </main>
    </div>
  );
}
