"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/dashboard/stat-card';
import { Product, Sale } from '@/lib/types';
import { getProducts, getSales } from '@/lib/firestore-helpers';
import { useAuth } from '@/context/auth-context';
import { DollarSign, Package, AlertTriangle, ShoppingCart, TrendingUp, PackagePlus, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { isToday, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const isAdmin = user?.role === 'admin' || user?.role === 'primary-admin';

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
  
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
    }).format(amount);


  const {
    todayRevenue,
    todaySalesCount,
    totalProducts,
    lowStockItems,
    lowStockProducts,
    recentSales,
    employeeTodaySales
  } = useMemo(() => {
    const todaySales = sales.filter(sale => isToday(new Date(sale.date)));
    
    const todayRevenue = todaySales.reduce((acc, sale) => acc + sale.grandTotal, 0);
    const todaySalesCount = todaySales.length;
    
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.quantity <= p.lowStockThreshold).sort((a,b) => a.quantity - b.quantity);
    const lowStockItems = lowStockProducts.length;

    const recentSales = sales.slice(0, 3);
    
    const employeeTodaySales = sales.filter(sale => 
        sale.employeeId === user?.uid && isToday(new Date(sale.date))
    );

    return { todayRevenue, todaySalesCount, totalProducts, lowStockItems, lowStockProducts, recentSales, employeeTodaySales };

  }, [sales, products, user]);

  if (loading) {
    return (
      <div className="flex flex-col p-4 sm:p-6 space-y-6">
        <header>
           <Skeleton className="h-8 w-48" />
           <Skeleton className="h-4 w-72 mt-2" />
        </header>
        <main className="flex-1 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
             <Skeleton className="h-48" />
        </main>
      </div>
    );
  }

  const welcomeMessage = user ? `Bienvenido, ${user.name.split(' ')[0]}` : "Dashboard";
  const welcomeDescription = "Aquí tienes un resumen de tu tienda.";

  const renderAdminDashboard = () => (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ventas de Hoy"
          value={formatCurrency(todayRevenue)}
          icon={DollarSign}
          description={`${todaySalesCount} transacciones`}
        />
        <StatCard
          title="Total Productos"
          value={totalProducts.toString()}
          icon={Package}
          description="En inventario"
        />
        <StatCard
          title="Stock Bajo"
          value={lowStockItems.toString()}
          icon={AlertTriangle}
          description={`Productos con < 10 unidades`}
          variant={lowStockItems > 0 ? 'destructive' : 'default'}
        />
         <StatCard
          title="Transacciones"
          value={todaySalesCount.toString()}
          icon={ShoppingCart}
          description="Ventas de hoy"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
              <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-destructive h-5 w-5" />
                    <CardTitle className="text-lg">Productos con Stock Bajo</CardTitle>
                  </div>
                  <CardDescription>Productos que necesitan reabastecimiento.</CardDescription>
              </CardHeader>
              <CardContent>
                  {lowStockProducts.length > 0 ? (
                      <div className="space-y-4">
                          {lowStockProducts.slice(0,4).map(p => (
                              <div key={p.id} className="flex justify-between items-center">
                                  <div>
                                      <p className="font-medium">{p.name}</p>
                                      <p className="text-sm text-muted-foreground">{formatCurrency(p.salePrice)}</p>
                                  </div>
                                  <Badge variant="destructive">{p.quantity} unidades</Badge>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">¡Excelente! No hay productos con bajo stock.</p>
                  )}
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-green-600 h-5 w-5" />
                    <CardTitle className="text-lg">Ventas Recientes</CardTitle>
                  </div>
                  <CardDescription>Últimas transacciones realizadas.</CardDescription>
              </CardHeader>
              <CardContent>
                   {recentSales.length > 0 ? (
                      <div className="space-y-4">
                          {recentSales.map(sale => (
                              <div key={sale.id} className="flex justify-between items-center">
                                  <div>
                                      <p className="font-medium">Venta #{sale.id.substring(0, 6)}</p>
                                      <p className="text-sm text-muted-foreground">{format(new Date(sale.date), "dd/MM, HH:mm", { locale: es })}</p>
                                  </div>
                                  <p className="font-semibold text-green-600 dark:text-green-500">{formatCurrency(sale.grandTotal)}</p>
                              </div>
                          ))}
                      </div>
                  ) : (
                       <p className="text-sm text-muted-foreground text-center py-8">Aún no se han realizado ventas.</p>
                  )}
              </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Tareas comunes para gestionar tu tienda.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button variant="outline" className="h-24 flex-col gap-2 text-base" onClick={() => router.push('/dashboard/inventory')}>
              <PackagePlus className="h-8 w-8 text-primary" />
              Agregar Producto
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 text-base" onClick={() => router.push('/dashboard/pos')}>
              <ShoppingCart className="h-8 w-8 text-primary" />
              Nueva Venta
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2 text-base" onClick={() => router.push('/dashboard/reports')}>
              <Eye className="h-8 w-8 text-primary" />
              Ver Reportes
            </Button>
        </CardContent>
      </Card>
    </>
  );

  const renderEmployeeDashboard = () => (
    <Card>
      <CardHeader>
        <CardTitle>Mis Ventas de Hoy</CardTitle>
        <CardDescription>Un resumen de las ventas que has realizado hoy.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID de Transacción</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeeTodaySales.length > 0 ? (
              employeeTodaySales.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium truncate max-w-[200px]">{sale.id}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(sale.grandTotal)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  Aún no has realizado ninguna venta hoy.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-3xl font-bold tracking-tight">
            {welcomeMessage}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? welcomeDescription
            : "Aquí tienes un resumen de tu actividad de hoy."
          }
        </p>
      </header>
      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0 space-y-6">
        {isAdmin ? renderAdminDashboard() : renderEmployeeDashboard()}
      </main>
    </div>
  );
}
