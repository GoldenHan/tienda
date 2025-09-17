"use client";

import { useState, useEffect } from "react";
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
  const { toast } = useToast();

  const fetchData = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const [salesData, productsData] = await Promise.all([getSales(user.companyId), getProducts(user.companyId)]);
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
    if(user?.companyId) {
      fetchData();
    }
  }, [user]);

  const handleUpdateSale = async (updatedSale: Sale, originalSale: Sale) => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      await updateSaleAndAdjustStock(user.companyId, updatedSale, originalSale);

      toast({
        title: "Venta Actualizada",
        description: `La transacción ${updatedSale.id} ha sido modificada.`,
      });

    } catch (error: any) {
      console.error("Error al actualizar la venta:", error);
      toast({ variant: "destructive", title: "Error al Actualizar", description: error.message });
    } finally {
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
          <SalesHistoryAccordion sales={sales} products={products} onUpdateSale={handleUpdateSale} isLoading={loading} />
        )}
      </main>
    </div>
  );
}
