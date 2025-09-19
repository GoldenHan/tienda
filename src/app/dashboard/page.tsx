
"use client";

import { useState, useEffect, useCallback } from 'react';
import StatCard from '@/components/dashboard/stat-card';
import { Product, Sale } from '@/lib/types';
import { getProducts, getSales } from '@/lib/firestore-helpers';
import { useAuth } from '@/context/auth-context';
import { DollarSign, Package, AlertTriangle, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async (companyId: string) => {
    setLoading(true);
    let productsData: Product[] = [];
    let salesData: Sale[] = [];
    let fetchError = false;

    try {
        productsData = await getProducts(companyId);
        setProducts(productsData);
    } catch (error) {
        console.error("Dashboard fetch error (Products):", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los productos.' });
        fetchError = true;
    }

    try {
        salesData = await getSales(companyId);
        setSales(salesData);
    } catch (error) {
        console.error("Dashboard fetch error (Sales):", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las ventas.' });
        fetchError = true;
    }
    
    if(!fetchError) {
        setProducts(productsData);
        setSales(salesData);
    }

    setLoading(false);

  }, [toast]);

  useEffect(() => {
    // We wait until auth is done and we have a user with a companyId
    if (!authLoading && user?.companyId) {
      fetchData(user.companyId);
    } else if (!authLoading && !user) {
       // If auth is done and there's no user, stop loading.
      setLoading(false);
    }
  }, [user, authLoading, fetchData]);

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.grandTotal, 0);
  const totalSalesCount = sales.length;

  const totalProfit = sales.reduce((acc, sale) => {
    const saleProfit = sale.items.reduce((itemAcc, item) => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const purchaseCost = typeof product.purchaseCost === 'number' ? product.purchaseCost : 0;
        return itemAcc + (item.total - purchaseCost * item.quantity);
      }
      return itemAcc;
    }, 0);
    return acc + saleProfit;
  }, 0);

  const lowStockItems = products.filter(p => p.quantity <= p.lowStockThreshold).length;
  
  if (loading) {
    return (
      <div className="flex flex-col">
        <header className="p-4 sm:p-6">
           <h1 className="text-2xl font-bold tracking-tight font-headline">
            Panel de Control
          </h1>
        </header>
        <main className="grid flex-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Panel de Control
        </h1>
      </header>
      <main className="grid flex-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
        <StatCard
          title="Ingresos Totales"
          value={totalRevenue.toLocaleString('es-NI', {
            style: 'currency',
            currency: 'NIO',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          icon={DollarSign}
          description="Ingresos totales de todas las ventas"
        />
        <StatCard
          title="Beneficio Total"
          value={totalProfit.toLocaleString('es-NI', {
            style: 'currency',
            currency: 'NIO',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          icon={DollarSign}
          description="Beneficio total de todas las ventas"
          variant="secondary"
        />
        <StatCard
          title="Ventas Totales"
          value={totalSalesCount.toString()}
          icon={ShoppingCart}
          description="Número total de transacciones de venta"
        />
        <StatCard
          title="Artículos con Poco Stock"
          value={lowStockItems.toString()}
          icon={AlertTriangle}
          description="Artículos que necesitan ser reabastecidos pronto"
          variant={lowStockItems > 0 ? 'destructive' : 'default'}
        />
      </main>
    </div>
  );
}
