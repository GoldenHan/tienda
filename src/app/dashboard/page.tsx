
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import StatCard from '@/components/dashboard/stat-card';
import { Product, Sale } from '@/lib/types';
import { getProducts, getSales } from '@/lib/firestore-helpers';
import { useAuth } from '@/context/auth-context';
import { DollarSign, Package, AlertTriangle, ShoppingCart, Shield, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { subDays, format, isAfter, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
        const [productsData, salesData] = await Promise.all([
            getProducts(user.uid),
            getSales(user.uid)
        ]);
        setProducts(productsData);
        setSales(salesData);
    } catch (error) {
        console.error("Dashboard fetch error:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos del panel de control.' });
    } finally {
        setLoading(false);
    }
  }, [toast, user]);

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

  const last7DaysSalesData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i));
    const salesData = last7Days.map(day => ({
        name: format(day, 'EEE', { locale: es }),
        total: 0,
    })).reverse(); // Reverse to have the oldest day first

    const sevenDaysAgo = startOfDay(subDays(new Date(), 6));

    sales.forEach(sale => {
        const saleDate = new Date(sale.date);
        if (isAfter(saleDate, sevenDaysAgo)) {
            const dayName = format(saleDate, 'EEE', { locale: es });
            const dayData = salesData.find(d => d.name.toLowerCase() === dayName.toLowerCase());
            if (dayData) {
                dayData.total += sale.grandTotal;
            }
        }
    });

    return salesData;
  }, [sales]);
  
  if (loading) {
    return (
      <div className="flex flex-col p-4 sm:p-6 space-y-6">
        <header>
           <h1 className="text-2xl font-bold tracking-tight font-headline">
            Panel de Control
          </h1>
        </header>
        <main className="flex-1 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-80" />
        </main>
      </div>
    );
  }

  const welcomeMessage = user ? `¡Bienvenido de nuevo, ${user.name.split(' ')[0]}!` : "Panel de Control";

  const renderRoleIcon = () => {
    if (!user) return null;

    if (user.role === 'primary-admin') {
      return (
        <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
            <ShieldCheck className="mr-2 text-white" />
            Admin Principal
        </Badge>
      );
    }
    if (user.role === 'admin') {
      return (
         <Badge variant="secondary" className="bg-purple-600 text-white hover:bg-purple-700">
            <Shield className="mr-2" />
            Admin
        </Badge>
      );
    }
    return null;
  }

  return (
    <div className="flex flex-col">
      <header className="p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight font-headline">
            {welcomeMessage}
          </h1>
          {renderRoleIcon()}
        </div>
        <p className="text-muted-foreground">
          Aquí tienes un resumen de la actividad de tu negocio.
        </p>
      </header>
      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
            title="Ingresos Totales"
            value={totalRevenue.toLocaleString('es-NI', {
                style: 'currency',
                currency: 'NIO',
            })}
            icon={DollarSign}
            description="Ingresos totales de todas las ventas"
            />
            <StatCard
            title="Beneficio Total"
            value={totalProfit.toLocaleString('es-NI', {
                style: 'currency',
                currency: 'NIO',
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
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Ventas de la Última Semana</CardTitle>
                <CardDescription>
                    Un resumen de los ingresos por ventas de los últimos 7 días.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <SalesChart data={last7DaysSalesData} />
            </CardContent>
        </Card>
      </main>
    </div>
  );
}

