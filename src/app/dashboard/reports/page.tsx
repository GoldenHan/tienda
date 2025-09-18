"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getSales } from "@/lib/firestore-helpers";
import { Sale } from "@/lib/types";
import { SalesReport } from "@/components/reports/sales-report";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSales = async () => {
      if (!user?.companyId) {
        setLoading(false);
        return;
      };
      
      setLoading(true);
      try {
        const salesData = await getSales(user.companyId);
        setSales(salesData);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los datos de ventas.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSales();
    
  }, [user, toast]);

  if (loading) {
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
          Filtra y exporta tus reportes de ventas.
        </p>
      </header>
      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
        <SalesReport allSales={sales} />
      </main>
    </div>
  );
}
