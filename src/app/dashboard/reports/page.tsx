
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getSales, getProducts } from "@/lib/firestore-helpers";
import { Sale, Product } from "@/lib/types";
import { SalesReport } from "@/components/reports/sales-report";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryReport } from "@/components/reports/inventory-report";


export default function ReportsPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [salesData, productsData] = await Promise.all([
        getSales(user.uid),
        getProducts(user.uid)
      ]);
      setSales(salesData);
      setProducts(productsData);
    } catch (error) {
      console.error("Reports fetch error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos para los reportes.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);


  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col">
        <header className="p-4 sm:p-6">
          <h1 className="text-2xl font-bold tracking-tight font-headline">
            Generador de Reportes
          </h1>
          <p className="text-muted-foreground">
            Filtra y exporta tus reportes de ventas, beneficios e inventario.
          </p>
        </header>
        <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-10 w-full sm:w-[300px]" />
              <Skeleton className="h-10 w-full sm:w-40" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Generador de Reportes
        </h1>
        <p className="text-muted-foreground">
          Filtra y exporta tus reportes de ventas, beneficios e inventario.
        </p>
      </header>
      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
         <Tabs defaultValue="sales">
            <TabsList>
                <TabsTrigger value="sales">Ventas y Beneficios</TabsTrigger>
                <TabsTrigger value="inventory">Inventario</TabsTrigger>
            </TabsList>
            <TabsContent value="sales" className="mt-4">
                <SalesReport allSales={sales} allProducts={products} />
            </TabsContent>
            <TabsContent value="inventory" className="mt-4">
                <InventoryReport allProducts={products} />
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

    
