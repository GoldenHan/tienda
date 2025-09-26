
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/dashboard/stat-card';
import { Product, Sale, CashOutflow, Company } from '@/lib/types';
import { getProducts, getSales, getCashOutflows, getCompany } from '@/lib/firestore-helpers';
import { useAuth } from '@/context/auth-context';
import { DollarSign, Package, AlertTriangle, ShoppingCart, TrendingUp, BarChart3, Star, PackagePlus, PiggyBank, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { isToday, format, startOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { SalesChart } from '@/components/dashboard/sales-chart';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [outflows, setOutflows] = useState<CashOutflow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const isAdmin = user?.role === 'admin' || user?.role === 'primary-admin';

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
        const [productsData, salesData, companyData, outflowsData] = await Promise.all([
            getProducts(user.uid),
            getSales(user.uid),
            getCompany(user.uid),
            getCashOutflows(user.uid)
        ]);
        setProducts(productsData);
        setSales(salesData);
        setCompany(companyData);
        setOutflows(outflowsData);
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
  
  const formatCurrency = (amount: number, currency: 'NIO' | 'USD' = 'NIO') =>
    new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: currency,
    }).format(amount);


  const {
    todayRevenue,
    todaySalesCount,
    totalProducts,
    lowStockItems,
    lowStockProducts,
    employeeTodaySales,
    weeklySalesChartData,
    bestSellingProductsToday,
    todayProfit,
    pettyCashBalance,
  } = useMemo(() => {
    const today = new Date();
    const todaySales = sales.filter(sale => isSameDay(new Date(sale.date), today));
    const todayRevenue = todaySales.reduce((acc, sale) => acc + sale.grandTotal, 0);
    const todaySalesCount = todaySales.length;
    
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.quantity <= p.lowStockThreshold).sort((a,b) => a.quantity - b.quantity);
    const lowStockItems = lowStockProducts.length;

    const employeeTodaySales = sales.filter(sale => 
        sale.employeeId === user?.uid && isToday(new Date(sale.date))
    );

    const weekStart = startOfWeek(today, { locale: es });
    const weekDays = eachDayOfInterval({ start: weekStart, end: today });
    
    const weeklySalesChartData = weekDays.map(day => {
        const daySales = sales.filter(sale => isSameDay(new Date(sale.date), day));
        const total = daySales.reduce((acc, sale) => acc + sale.grandTotal, 0);
        return {
            name: format(day, 'EEE', { locale: es }),
            total,
        };
    });

    const productsMap = new Map(products.map(p => [p.id, p]));
    const todayProfit = todaySales.reduce((totalProfit, sale) => {
        const saleProfit = sale.items.reduce((currentSaleProfit, item) => {
            const product = productsMap.get(item.productId);
            const cost = product?.purchaseCost || 0;
            return currentSaleProfit + ((item.salePrice - cost) * item.quantity);
        }, 0);
        return totalProfit + saleProfit;
    }, 0);

    const productSalesToday: { [key: string]: { name: string; quantity: number; total: number; } } = {};
    todaySales.forEach(sale => {
        sale.items.forEach(item => {
            if (productSalesToday[item.productId]) {
                productSalesToday[item.productId].quantity += item.quantity;
                productSalesToday[item.productId].total += item.total;
            } else {
                productSalesToday[item.productId] = {
                    name: item.productName,
                    quantity: item.quantity,
                    total: item.total,
                };
            }
        });
    });

    const bestSellingProductsToday = Object.values(productSalesToday)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    const pettyCashOutflowsToday = outflows
      .filter(o => o.cashBox === 'petty' && isToday(new Date(o.date)))
      .reduce((sum, o) => sum + o.amount, 0);

    const pettyCashBalance = (company?.pettyCashInitial || 0) - pettyCashOutflowsToday;

    return { 
        todayRevenue, todaySalesCount, totalProducts, lowStockItems, lowStockProducts, 
        employeeTodaySales, weeklySalesChartData, bestSellingProductsToday, todayProfit,
        pettyCashBalance,
    };

  }, [sales, products, user, company, outflows]);

  if (loading) {
    return (
      <div className="flex flex-col p-4 sm:p-6 lg:p-8 space-y-6">
        <header>
           <Skeleton className="h-8 w-48" />
           <Skeleton className="h-4 w-72 mt-2" />
        </header>
        <main className="flex-1 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Skeleton className="h-28" />
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

  const welcomeMessage = user ? `Bienvenido de nuevo, ${user.name.split(' ')[0]}` : "Dashboard";
  const welcomeDescription = "Aquí tienes un resumen de la actividad de tu tienda.";

  const renderAdminDashboard = () => (
    <>
      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Ventas de Hoy"
          value={formatCurrency(todayRevenue)}
          icon={TrendingUp}
          description={`${todaySalesCount} transacciones`}
        />
        <StatCard
            title="Beneficio de Hoy"
            value={formatCurrency(todayProfit)}
            icon={DollarSign}
            description="Ganancia neta estimada"
        />
        <StatCard
          title="Total Productos"
          value={totalProducts.toString()}
          icon={Package}
          description="Tipos de producto en inventario"
        />
        <StatCard
          title="Alerta de Stock"
          value={lowStockItems.toString()}
          icon={AlertTriangle}
          description={`Productos con bajo stock`}
          variant={lowStockItems > 0 ? 'destructive' : 'default'}
        />
         <StatCard
          title="Fondo de Caja Chica"
          value={formatCurrency(pettyCashBalance)}
          icon={Briefcase}
          description="Dinero disponible para gastos"
        />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-3 backdrop-blur-sm bg-background/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Resumen de Ventas Semanales</CardTitle>
                <CardDescription>
                  Ingresos totales de los últimos 7 días.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <SalesChart data={weeklySalesChartData} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 backdrop-blur-sm bg-background/50">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Star className="text-amber-400 h-5 w-5" />
                        <CardTitle className="text-lg font-semibold">Más Vendidos Hoy</CardTitle>
                    </div>
                    <CardDescription>Productos con más unidades vendidas hoy.</CardDescription>
                </CardHeader>
                <CardContent>
                    {bestSellingProductsToday.length > 0 ? (
                        <div className="space-y-4">
                            {bestSellingProductsToday.map(p => (
                                <div key={p.name} className="flex justify-between items-center hover:bg-muted/50 p-2 rounded-md transition-colors">
                                    <p className="font-medium truncate" title={p.name}>{p.name}</p>
                                    <Badge variant="secondary">{p.quantity} vendidos</Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground text-center py-8">
                            <ShoppingCart className="mx-auto h-8 w-8 mb-2" />
                            Aún no se han realizado ventas hoy.
                        </div>
                    )}
                </CardContent>
            </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="backdrop-blur-sm bg-background/50">
              <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-destructive h-5 w-5" />
                    <CardTitle className="text-lg font-semibold">Productos con Stock Bajo</CardTitle>
                  </div>
                  <CardDescription>Estos productos necesitan reabastecimiento pronto.</CardDescription>
              </CardHeader>
              <CardContent>
                  {lowStockProducts.length > 0 ? (
                      <div className="space-y-4">
                          {lowStockProducts.slice(0,4).map(p => (
                              <div key={p.id} className="flex justify-between items-center hover:bg-muted/50 p-2 rounded-md transition-colors">
                                  <div>
                                      <p className="font-medium">{p.name}</p>
                                      <p className="text-sm text-muted-foreground">{formatCurrency(p.salePrice)}</p>
                                  </div>
                                  <Badge variant="destructive">{p.quantity} restantes</Badge>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="text-sm text-muted-foreground text-center py-8">
                        <Package className="mx-auto h-8 w-8 mb-2" />
                        ¡Excelente! No hay productos con bajo stock.
                      </div>
                  )}
              </CardContent>
          </Card>
          <Card className="backdrop-blur-sm bg-background/50">
            <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Tareas comunes para gestionar tu tienda.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                onClick={() => router.push('/dashboard/pos')}
                className="group relative cursor-pointer overflow-hidden rounded-xl p-6 text-white shadow-lg transition-transform duration-300 ease-in-out hover:scale-105 bg-gradient-to-br from-blue-500 to-blue-600"
                >
                <div className="relative z-10">
                    <ShoppingCart className="h-10 w-10 mb-3" />
                    <h3 className="text-xl font-bold">Nueva Venta</h3>
                    <p className="text-sm opacity-80">Ir al POS</p>
                </div>
                </div>
                <div
                onClick={() => router.push('/dashboard/inventory')}
                className="group relative cursor-pointer overflow-hidden rounded-xl p-6 text-white shadow-lg transition-transform duration-300 ease-in-out hover:scale-105 bg-gradient-to-br from-purple-500 to-purple-600"
                >
                <div className="relative z-10">
                    <PackagePlus className="h-10 w-10 mb-3" />
                    <h3 className="text-xl font-bold">Añadir Producto</h3>
                    <p className="text-sm opacity-80">Ir a Inventario</p>
                </div>
                </div>
                <div
                onClick={() => router.push('/dashboard/reports')}
                className="group relative cursor-pointer overflow-hidden rounded-xl p-6 text-white shadow-lg transition-transform duration-300 ease-in-out hover:scale-105 bg-gradient-to-br from-teal-500 to-teal-600"
                >
                <div className="relative z-10">
                    <BarChart3 className="h-10 w-10 mb-3" />
                    <h3 className="text-xl font-bold">Ver Reportes</h3>
                    <p className="text-sm opacity-80">Analizar rendimiento</p>
                </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </>
  );

  const renderEmployeeDashboard = () => (
    <Card className="backdrop-blur-sm bg-background/50">
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
    <div className="relative min-h-full w-full overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] dark:bg-neutral-950 dark:bg-[linear-gradient(to_right,#ffffff0d_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0d_1px,transparent_1px)]">
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px]"></div>
        </div>

      <div className="flex flex-col p-4 sm:p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              {welcomeMessage}
          </h1>
          <p className="text-lg text-muted-foreground">
            {isAdmin 
              ? welcomeDescription
              : "Aquí tienes un resumen de tu actividad de hoy."
            }
          </p>
        </header>
        <main className="flex-1 space-y-6">
          {isAdmin ? renderAdminDashboard() : renderEmployeeDashboard()}
        </main>
      </div>
    </div>
  );
}

    