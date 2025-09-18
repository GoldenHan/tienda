
"use client";

import { useState, useEffect, useCallback } from "react";
import { SalesHistoryAccordion } from "@/components/sales/sales-history-accordion";
import { Product, Sale } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { getSales, getProducts, updateSaleAndAdjustStock } from "@/lib/firestore-helpers";
import { Skeleton } from "@/components/ui/skeleton";

export default function SalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async (companyId: string) => {
    setLoading(true);
    try {
      const [salesData, productsData] = await Promise.all([
        getSales(companyId), 
        getProducts(companyId)
      ]);
      setSales(salesData);
      setProducts(productsData);
    } catch (error) {
      console.error("Sales page fetch error:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los datos." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if(user?.companyId) {
      fetchData(user.companyId);
    } else {
      setLoading(true);
    }
  }, [user, fetchData]);

  const handleUpdateSale = async (updatedSale: Sale, originalSale: Sale) => {
    if (!user?.companyId) return;
    setIsUpdating(true);
    try {
      await updateSaleAndAdjustStock(user.companyId, updatedSale, originalSale);
      toast({
        title: "Venta Actualizada",
        description: `La transacción ${updatedSale.id} ha sido modificada.`,
      });
      await fetchData(user.companyId); // Refresh data after update
    } catch (error: any) {
      console.error("Error al actualizar la venta:", error);
      toast({ variant: "destructive", title: "Error al Actualizar", description: error.message });
      await fetchData(user.companyId); // Re-fetch data even on error to show original state
    } finally {
      setIsUpdating(false);
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
          <SalesHistoryAccordion 
            sales={sales} 
            products={products} 
            onUpdateSale={handleUpdateSale} 
            isLoading={isUpdating} 
          />
        )}
      </main>
    </div>
  );
}
