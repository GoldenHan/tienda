"use client";

import { useState, useEffect } from "react";
import { SalesHistoryAccordion } from "@/components/sales/sales-history-accordion";
import { Product, Sale } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getSales, getProducts, updateSale, updateProduct } from "@/lib/firestore-helpers";
import { Skeleton } from "@/components/ui/skeleton";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesData, productsData] = await Promise.all([getSales(), getProducts()]);
      setSales(salesData);
      setProducts(productsData);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los datos." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateSale = async (updatedSale: Sale, originalSale: Sale) => {
     setLoading(true);
    try {
      // Adjust product stock based on the changes
      const stockUpdates: { [productId: string]: number } = {};

      // Calculate the difference in quantities for each item
      originalSale.items.forEach(originalItem => {
        const updatedItem = updatedSale.items.find(ui => ui.productId === originalItem.productId);
        const updatedQuantity = updatedItem ? updatedItem.quantity : 0;
        const quantityChange = originalItem.quantity - updatedQuantity; // Positive if quantity decreased, negative if increased
        stockUpdates[originalItem.productId] = (stockUpdates[originalItem.productId] || 0) + quantityChange;
      });

      // Apply the stock updates to Firestore
      const updatePromises = Object.keys(stockUpdates).map(async (productId) => {
        const product = products.find(p => p.id === productId);
        if (product) {
          const newQuantity = product.quantity + stockUpdates[productId];
           if (newQuantity < 0) {
            throw new Error(`Stock insuficiente para ${product.name}`);
          }
          return updateProduct(productId, { quantity: newQuantity });
        }
      });
      
      await Promise.all(updatePromises);
      
      // Update the sale document itself
      await updateSale(updatedSale.id, updatedSale);

      toast({
        title: "Venta Actualizada",
        description: `La transacción ${updatedSale.id} ha sido modificada.`,
      });

    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Error al Actualizar", description: error.message });
    } finally {
       // Refresh all data
       await fetchData();
    }
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
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <SalesHistoryAccordion sales={sales} products={products} onUpdateSale={handleUpdateSale} />
        )}
      </main>
    </div>
  );
}
