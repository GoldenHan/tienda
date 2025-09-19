
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getSales, getCashOutflows, getInflows, getReconciliationStatus, updateReconciliationStatus } from '@/lib/firestore-helpers';
import { Sale, CashOutflow, Inflow, Reconciliation } from '@/lib/types';
import { isSameDay, startOfDay, format as formatDateFns } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Scale, Lock, Unlock } from 'lucide-react';
import { OutflowForm } from '@/components/cash-reconciliation/outflow-form';
import { InflowForm } from '@/components/cash-reconciliation/inflow-form';
import { ReconciliationTable } from '@/components/cash-reconciliation/reconciliation-table';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
    }).format(amount);

export default function CashReconciliationPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [outflows, setOutflows] = useState<CashOutflow[]>([]);
  const [inflows, setInflows] = useState<Inflow[]>([]);
  const [reconciliationStatus, setReconciliationStatus] = useState<Reconciliation['status']>('open');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [isOutflowDialogOpen, setIsOutflowDialogOpen] = useState(false);
  const [isInflowDialogOpen, setIsInflowDialogOpen] = useState(false);
  const { toast } = useToast();

  const formattedDateId = useMemo(() => formatDateFns(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesData, outflowsData, inflowsData, statusData] = await Promise.all([
        getSales(),
        getCashOutflows(),
        getInflows(),
        getReconciliationStatus(formattedDateId),
      ]);
      setSales(salesData);
      setOutflows(outflowsData);
      setInflows(inflowsData);
      setReconciliationStatus(statusData);

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
  }, [toast, formattedDateId]);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, fetchData, selectedDate]);

  const handleCloseReconciliation = async () => {
    setIsSubmitting(true);
    try {
      await updateReconciliationStatus(formattedDateId, 'closed');
      await fetchData(); // Refetch to update status
      toast({
        title: "Arqueo Cerrado",
        description: `El arqueo para el día ${formattedDateId} ha sido consolidado.`,
      });
    } catch (error) {
       console.error("Error al cerrar el arqueo:", error);
       toast({
         variant: "destructive",
         title: "Error",
         description: "No se pudo cerrar el arqueo.",
       });
    } finally {
      setIsSubmitting(false);
    }
  }


  const { dailySalesTotal, dailyInflowsTotal, dailyOutflowsTotal, dailyBalance, dailyItems } = useMemo(() => {
    const dailySales = sales.filter(sale => isSameDay(new Date(sale.date), selectedDate));
    const dailyOutflows = outflows.filter(outflow => isSameDay(new Date(outflow.date), selectedDate));
    const dailyManualInflows = inflows.filter(inflow => isSameDay(new Date(inflow.date), selectedDate));

    const dailySalesTotal = dailySales.reduce((acc, sale) => acc + sale.grandTotal, 0);
    const dailyInflowsTotal = dailyManualInflows.reduce((acc, inflow) => acc + inflow.total, 0);
    const totalIncome = dailySalesTotal + dailyInflowsTotal;

    const dailyOutflowsTotal = dailyOutflows.reduce((acc, outflow) => acc + outflow.amount, 0);
    
    const dailyBalance = totalIncome - dailyOutflowsTotal;

    const saleItems = dailySales.flatMap(sale => 
      sale.items.map(item => ({...item, type: 'sale' as const, date: sale.date }))
    );
    const outflowItems = dailyOutflows.map(outflow => ({...outflow, type: 'outflow' as const}));
    const inflowItems = dailyManualInflows.map(inflow => ({...inflow, type: 'inflow' as const}));

    const dailyItems = [...saleItems, ...outflowItems, ...inflowItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { dailySalesTotal: totalIncome, dailyInflowsTotal, dailyOutflowsTotal, dailyBalance, dailyItems };
  }, [sales, outflows, inflows, selectedDate]);

  const isClosed = reconciliationStatus === 'closed';

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
        <div className="lg:col-span-3"><Skeleton className="h-96" /></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
       <header className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
            <div>
                 <h1 className="text-2xl font-bold tracking-tight font-headline">Arqueo de Caja Diario</h1>
                 <p className="text-muted-foreground">Selecciona una fecha para ver el resumen de ingresos y egresos.</p>
            </div>
            {isClosed ? (
                <Badge variant="destructive" className="text-base gap-2">
                    <Lock className="h-4 w-4" />
                    Cerrado
                </Badge>
            ) : (
                 <Badge variant="secondary" className="text-base gap-2">
                    <Unlock className="h-4 w-4" />
                    Abierto
                </Badge>
            )}
        </div>
      </header>
      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <DatePicker date={selectedDate} onDateChange={(date) => date && setSelectedDate(startOfDay(date))} />
           <div className="flex gap-2">
                <Dialog open={isInflowDialogOpen} onOpenChange={setIsInflowDialogOpen}>
                  <DialogTrigger asChild>
                     <Button variant="outline" disabled={isClosed}>Añadir Ingreso</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registrar Ingreso Manual</DialogTitle>
                      <DialogDescription>
                        Añade un ingreso de dinero que no provenga de una venta de producto.
                      </DialogDescription>
                    </DialogHeader>
                    <InflowForm 
                        onInflowAdded={() => {
                            fetchData();
                            setIsInflowDialogOpen(false);
                        }} 
                        date={selectedDate}
                    />
                  </DialogContent>
                </Dialog>
                <Dialog open={isOutflowDialogOpen} onOpenChange={setIsOutflowDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive-outline" disabled={isClosed}>Añadir Egreso</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registrar Egreso</DialogTitle>
                      <DialogDescription>
                        Añade un nuevo gasto o salida de dinero de la caja para el día seleccionado.
                      </DialogDescription>
                    </DialogHeader>
                     <OutflowForm 
                        onOutflowAdded={() => {
                            fetchData();
                            setIsOutflowDialogOpen(false);
                        }}
                        date={selectedDate}
                    />
                  </DialogContent>
                </Dialog>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button disabled={isClosed || isSubmitting}>
                            <Lock className="mr-2" />
                            Cerrar Arqueo
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmas el cierre del arqueo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Una vez cerrado, no podrás añadir más ingresos o egresos para esta fecha.
                            Esta acción solo puede ser revertida desde la sección de Configuración.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCloseReconciliation}>Confirmar Cierre</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
           </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Totales ({formatDateFns(selectedDate, 'dd/MM')})</CardTitle>
                    <ArrowUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(dailySalesTotal)}</div>
                </CardContent>
            </Card>
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Egresos ({formatDateFns(selectedDate, 'dd/MM')})</CardTitle>
                    <ArrowDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-400">{formatCurrency(dailyOutflowsTotal)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Balance en Caja ({formatDateFns(selectedDate, 'dd/MM')})</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(dailyBalance)}</div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Movimientos del Día</CardTitle>
                <CardDescription>Detalle de todas las transacciones para la fecha seleccionada.</CardDescription>
            </CardHeader>
            <CardContent>
                <ReconciliationTable items={dailyItems} />
            </CardContent>
        </Card>
      </main>
    </div>
  );
}

