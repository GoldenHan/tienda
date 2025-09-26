
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getSales, getCashOutflows, getInflows, getReconciliationStatus, updateReconciliationStatus, getCompany } from '@/lib/firestore-helpers';
import { Sale, CashOutflow, Inflow, Reconciliation, Company, Currency } from '@/lib/types';
import { isSameDay, startOfDay, format as formatDateFns } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Scale, Lock, Unlock, ChevronDown, PackagePlus, DollarSign, Repeat } from 'lucide-react';
import { OutflowForm } from '@/components/cash-reconciliation/outflow-form';
import { InflowForm } from '@/components/cash-reconciliation/inflow-form';
import { ReconciliationTable } from '@/components/cash-reconciliation/reconciliation-table';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


const formatCurrency = (amount: number, currency: Currency) =>
    new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: currency,
    }).format(amount);

export default function CashReconciliationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [outflows, setOutflows] = useState<CashOutflow[]>([]);
  const [inflows, setInflows] = useState<Inflow[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [reconciliationStatus, setReconciliationStatus] = useState<Reconciliation['status']>('open');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isOutflowDialogOpen, setIsOutflowDialogOpen] = useState(false);
  const [isInflowDialogOpen, setIsInflowDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set initial date on client-side to avoid hydration mismatch
    setSelectedDate(startOfDay(new Date()));
  }, []);

  const formattedDateId = useMemo(() => selectedDate ? formatDateFns(selectedDate, 'yyyy-MM-dd') : '', [selectedDate]);

  const fetchData = useCallback(async () => {
    if (!user || !formattedDateId) return;
    setLoading(true);
    try {
      const [salesData, outflowsData, inflowsData, statusData, companyData] = await Promise.all([
        getSales(user.uid),
        getCashOutflows(user.uid),
        getInflows(user.uid),
        getReconciliationStatus(formattedDateId, user.uid),
        getCompany(user.uid)
      ]);
      setSales(salesData);
      setOutflows(outflowsData);
      setInflows(inflowsData);
      setReconciliationStatus(statusData);
      setCompany(companyData);

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
  }, [toast, formattedDateId, user]);

  useEffect(() => {
    if (user && selectedDate) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, fetchData, selectedDate]);

  const handleCloseReconciliation = async () => {
    if (!user || !formattedDateId) return;
    setIsSubmitting(true);
    try {
      await updateReconciliationStatus(formattedDateId, 'closed', user.uid);
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


  const { 
      dailyNioIncomes, dailyUsdIncomes, 
      dailyNioOutflows, dailyUsdOutflows, 
      dailyNioBalance, dailyUsdBalance,
      dailyItems, consolidatedNioBalance
  } = useMemo(() => {
    if (!selectedDate) {
        return { dailyNioIncomes: 0, dailyUsdIncomes: 0, dailyNioOutflows: 0, dailyUsdOutflows: 0, dailyNioBalance: 0, dailyUsdBalance: 0, dailyItems: [], consolidatedNioBalance: 0 };
    }

    const dayFilter = (item: { date: string }) => isSameDay(new Date(item.date), selectedDate);

    const dailySales = sales.filter(dayFilter);
    const dailyOutflows = outflows.filter(dayFilter);
    const dailyManualInflows = inflows.filter(dayFilter);

    const dailyNioIncomes = 
      dailySales.filter(s => s.paymentCurrency === 'NIO').reduce((acc, s) => acc + s.grandTotal, 0) +
      dailyManualInflows.filter(i => i.currency === 'NIO').reduce((acc, i) => acc + i.total, 0);
    
    const dailyUsdIncomes =
      dailySales.filter(s => s.paymentCurrency === 'USD').reduce((acc, s) => acc + s.grandTotal, 0) +
      dailyManualInflows.filter(i => i.currency === 'USD').reduce((acc, i) => acc + i.total, 0);

    const dailyNioOutflows = dailyOutflows.filter(o => o.currency === 'NIO').reduce((acc, o) => acc + o.amount, 0);
    const dailyUsdOutflows = dailyOutflows.filter(o => o.currency === 'USD').reduce((acc, o) => acc + o.amount, 0);

    const dailyNioBalance = dailyNioIncomes - dailyNioOutflows;
    const dailyUsdBalance = dailyUsdIncomes - dailyUsdOutflows;

    const allItems = [...dailySales, ...dailyOutflows, ...dailyManualInflows];
    const dailyItems = allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const exchangeRate = company?.exchangeRate || 36.5;
    const consolidatedNioBalance = dailyNioBalance + (dailyUsdBalance * exchangeRate);

    return { 
        dailyNioIncomes, dailyUsdIncomes, 
        dailyNioOutflows, dailyUsdOutflows, 
        dailyNioBalance, dailyUsdBalance, 
        dailyItems, consolidatedNioBalance 
    };
  }, [sales, outflows, inflows, selectedDate, company]);

  const isClosed = reconciliationStatus === 'closed';

  if (loading || !selectedDate) {
    return (
      <div className="flex flex-col p-4 sm:p-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Arqueo de Caja Diario</h1>
          <p className="text-muted-foreground">Resume los ingresos y egresos del día.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28" />
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
                      <Button variant="outline" disabled={isClosed}>
                        Añadir Ingreso
                        <DollarSign className="ml-2" />
                      </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registrar Ingreso de Efectivo</DialogTitle>
                      <DialogDescription>
                        Añade un ingreso de dinero que no provenga de una venta (Ej. Aporte de capital).
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 mb-6">
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Totales (C$)</CardTitle>
                    <ArrowUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(dailyNioIncomes, 'NIO')}</div>
                </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Totales ($)</CardTitle>
                    <ArrowUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(dailyUsdIncomes, 'USD')}</div>
                </CardContent>
            </Card>
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Egresos (C$)</CardTitle>
                    <ArrowDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-400">{formatCurrency(dailyNioOutflows, 'NIO')}</div>
                </CardContent>
            </Card>
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Egresos ($)</CardTitle>
                    <ArrowDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-400">{formatCurrency(dailyUsdOutflows, 'USD')}</div>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Balance en Caja (C$)</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(dailyNioBalance, 'NIO')}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Balance en Caja ($)</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(dailyUsdBalance, 'USD')}</div>
                </CardContent>
            </Card>
             <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-2">
                    <CardDescription>Balance Consolidado (C$)</CardDescription>
                    <CardTitle className="text-3xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(consolidatedNioBalance, 'NIO')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Total en córdobas más el equivalente de dólares. Tasa de cambio: {company?.exchangeRate || 'N/A'}</p>
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

    