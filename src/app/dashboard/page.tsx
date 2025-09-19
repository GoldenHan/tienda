
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        const [productsData, salesData] = await Promise.all([
            getProducts(),
            getSales()
        ]);
        setProducts(productsData);
        setSales(salesData);
    } catch (error) {
        console.error("Dashboard fetch error:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos del panel de control.' });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, fetchData]);

  const totalRevenue = useMemo(() => sales.reduce((acc, sale) => acc + sale.grandTotal, 0), [sales]);
  const totalSalesCount = sales.length;

  const totalProfit = useMemo(() => {
    const productsMap = new Map(products.map(p => [p.id, p]));
    return sales.reduce((acc, sale) => {
        const saleProfit = sale.items.reduce((itemAcc, item) => {
            const product = productsMap.get(item.productId);
            if (product) {
                const purchaseCost = typeof product.purchaseCost === 'number' ? product.purchaseCost : 0;
                return itemAcc + (item.total - (purchaseCost * item.quantity));
            }
            return itemAcc;
        }, 0);
        return acc + saleProfit;
    }, 0);
  }, [sales, products]);

  const lowStockItems = useMemo(() => products.filter(p => p.quantity <= p.lowStockThreshold).length, [products]);
  
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
