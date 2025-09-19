
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getSales, getCashOutflows } from '@/lib/firestore-helpers';
import { Sale, CashOutflow } from '@/lib/types';
import { isToday } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Scale } from 'lucide-react';
import { OutflowForm } from '@/components/cash-reconciliation/outflow-form';
import { OutflowsTable } from '@/components/cash-reconciliation/outflows-table';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
    }).format(amount);

export default function CashReconciliationPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [outflows, setOutflows] = useState<CashOutflow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesData, outflowsData] = await Promise.all([
        getSales(),
        getCashOutflows(),
      ]);
      setSales(salesData);
      setOutflows(outflowsData);
    } catch (error) {
      console.error("Cash reconciliation fetch error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos para el arqueo.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, fetchData]);

  const { todaySalesTotal, todayOutflowsTotal, todayBalance, todayOutflows } = useMemo(() => {
    const todaySales = sales.filter(sale => isToday(new Date(sale.date)));
    const todayOutflows = outflows.filter(outflow => isToday(new Date(outflow.date)));

    const todaySalesTotal = todaySales.reduce((acc, sale) => acc + sale.grandTotal, 0);
    const todayOutflowsTotal = todayOutflows.reduce((acc, outflow) => acc + outflow.amount, 0);
    
    const todayBalance = todaySalesTotal - todayOutflowsTotal;

    return { todaySalesTotal, todayOutflowsTotal, todayBalance, todayOutflows };
  }, [sales, outflows]);


  if (loading) {
    return (
      <div className="flex flex-col p-4 sm:p-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Arqueo de Caja Diario</h1>
          <p className="text-muted-foreground">Resume los ingresos y egresos del día.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2"><Skeleton className="h-64" /></div>
            <div className="lg:col-span-3"><Skeleton className="h-64" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
       <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">Arqueo de Caja Diario</h1>
        <p className="text-muted-foreground">Resume los ingresos y egresos del día.</p>
      </header>
      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos por Ventas (Hoy)</CardTitle>
                    <ArrowUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(todaySalesTotal)}</div>
                </CardContent>
            </Card>
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Egresos (Hoy)</CardTitle>
                    <ArrowDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-400">{formatCurrency(todayOutflowsTotal)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Balance en Caja (Hoy)</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(todayBalance)}</div>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
                 <OutflowForm onOutflowAdded={fetchData} />
            </div>
            <div className="lg:col-span-3">
                 <Card>
                    <CardHeader>
                        <CardTitle>Lista de Egresos de Hoy</CardTitle>
                        <CardDescription>Todos los gastos registrados en el día actual.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <OutflowsTable outflows={todayOutflows} />
                    </CardContent>
                 </Card>
            </div>
        </div>
      </main>
    </div>
  );
}
