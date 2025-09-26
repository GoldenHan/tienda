
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getSales, getCashOutflows, getInflows, getReconciliationStatus, updateReconciliationStatus, getCompany, getCashTransfers } from '@/lib/firestore-helpers';
import { Sale, CashOutflow, Inflow, Reconciliation, Company, Currency, CashTransfer } from '@/lib/types';
import { isSameDay, startOfDay, format as formatDateFns } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Scale, Lock, Unlock, ChevronDown, PackagePlus, DollarSign, Repeat, ArrowRightLeft } from 'lucide-react';
import { OutflowForm } from '@/components/cash-reconciliation/outflow-form';
import { InflowForm } from '@/components/cash-reconciliation/inflow-form';
import { CashTransferForm } from '@/components/cash-reconciliation/cash-transfer-form';
import { ReconciliationTable } from '@/components/cash-reconciliation/reconciliation-table';
import { OutflowReceipt } from '@/components/cash-reconciliation/outflow-receipt';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


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
  const [transfers, setTransfers] = useState<CashTransfer[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [reconciliationStatus, setReconciliationStatus] = useState<Reconciliation['status']>('open');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isOutflowDialogOpen, setIsOutflowDialogOpen] = useState(false);
  const [isInflowDialogOpen, setIsInflowDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [lastOutflow, setLastOutflow] = useState<CashOutflow | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set initial date on client-side to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      setSelectedDate(startOfDay(new Date()));
    }
  }, []);

  const formattedDateId = useMemo(() => selectedDate ? formatDateFns(selectedDate, 'yyyy-MM-dd') : '', [selectedDate]);

  const fetchData = useCallback(async () => {
    if (!user || !formattedDateId) return;
    setLoading(true);
    try {
      const [salesData, outflowsData, inflowsData, transfersData, statusData, companyData] = await Promise.all([
        getSales(user.uid),
        getCashOutflows(user.uid),
        getInflows(user.uid),
        getCashTransfers(user.uid),
        getReconciliationStatus(formattedDateId, user.uid),
        getCompany(user.uid)
      ]);
      setSales(salesData);
      setOutflows(outflowsData);
      setInflows(inflowsData);
      setTransfers(transfersData);
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
    } else if (!user) {
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

 const handlePrintReceipt = () => {
    const printContent = document.getElementById("outflow-receipt-to-print");
    if (!printContent || !window) return;

    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Comprobante de Egreso</title>');
    printWindow.document.write('<style>body { font-family: sans-serif; } @media print { @page { size: auto; margin: 0.5in; } }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
  };


 const {
    dailyItems,
    pettyCashNioBalance, pettyCashUsdBalance,
    mainCashNioBalance, mainCashUsdBalance,
    consolidatedNioBalance
  } = useMemo(() => {
    if (!selectedDate || !company) {
      return { dailyItems: [], pettyCashNioBalance: 0, pettyCashUsdBalance: 0, mainCashNioBalance: 0, mainCashUsdBalance: 0, consolidatedNioBalance: 0 };
    }

    const dayFilter = (item: { date: string }) => isSameDay(new Date(item.date), selectedDate);

    // Filter all transactions for the selected day
    const dailySales = sales.filter(dayFilter);
    const dailyOutflows = outflows.filter(dayFilter);
    const dailyManualInflows = inflows.filter(dayFilter);
    const dailyTransfers = transfers.filter(dayFilter);

    // --- Petty Cash Calculations ---
    let pettyNio = company.pettyCashInitial || 0; // Start with the configured initial amount
    let pettyUsd = 0; // Assuming initial amount is only in NIO

    pettyNio += dailyManualInflows.filter(i => i.cashBox === 'petty' && i.currency === 'NIO').reduce((sum, i) => sum + i.total, 0);
    pettyUsd += dailyManualInflows.filter(i => i.cashBox === 'petty' && i.currency === 'USD').reduce((sum, i) => sum + i.total, 0);

    pettyNio -= dailyOutflows.filter(o => o.cashBox === 'petty' && o.currency === 'NIO').reduce((sum, o) => sum + o.amount, 0);
    pettyUsd -= dailyOutflows.filter(o => o.cashBox === 'petty' && o.currency === 'USD').reduce((sum, o) => sum + o.amount, 0);
    
    pettyNio += dailyTransfers.filter(t => t.toBox === 'petty' && t.currency === 'NIO').reduce((sum, t) => sum + t.amount, 0);
    pettyNio -= dailyTransfers.filter(t => t.fromBox === 'petty' && t.currency === 'NIO').reduce((sum, t) => sum + t.amount, 0);
    pettyUsd += dailyTransfers.filter(t => t.toBox === 'petty' && t.currency === 'USD').reduce((sum, t) => sum + t.amount, 0);
    pettyUsd -= dailyTransfers.filter(t => t.fromBox === 'petty' && t.currency === 'USD').reduce((sum, t) => sum + t.amount, 0);
    
    const pettyCashNioBalance = pettyNio;
    const pettyCashUsdBalance = pettyUsd;

    // --- Main Cash Calculations (Sales go here by default) ---
    const salesInflowsNio = dailySales.filter(s => s.paymentCurrency === 'NIO').reduce((sum, s) => sum + s.grandTotal, 0);
    const salesInflowsUsd = dailySales.filter(s => s.paymentCurrency === 'USD').reduce((sum, s) => sum + s.grandTotal, 0);
    const mainInflowsNio = dailyManualInflows.filter(i => i.cashBox === 'general' && i.currency === 'NIO').reduce((sum, i) => sum + i.total, 0);
    const mainInflowsUsd = dailyManualInflows.filter(i => i.cashBox === 'general' && i.currency === 'USD').reduce((sum, i) => sum + i.total, 0);
    const mainOutflowsNio = dailyOutflows.filter(o => o.cashBox === 'general' && o.currency === 'NIO').reduce((sum, o) => sum + o.amount, 0);
    const mainOutflowsUsd = dailyOutflows.filter(o => o.cashBox === 'general' && o.currency === 'USD').reduce((sum, o) => sum + o.amount, 0);
    const transfersToMainNio = dailyTransfers.filter(t => t.toBox === 'general' && t.currency === 'NIO').reduce((sum, t) => sum + t.amount, 0);
    const transfersFromMainNio = dailyTransfers.filter(t => t.fromBox === 'general' && t.currency === 'NIO').reduce((sum, t) => sum + t.amount, 0);
    const transfersToMainUsd = dailyTransfers.filter(t => t.toBox === 'general' && t.currency === 'USD').reduce((sum, t) => sum + t.amount, 0);
    const transfersFromMainUsd = dailyTransfers.filter(t => t.fromBox === 'general' && t.currency === 'USD').reduce((sum, t) => sum + t.amount, 0);
    
    const mainCashNioBalance = (salesInflowsNio + mainInflowsNio) - mainOutflowsNio + transfersToMainNio - transfersFromMainNio;
    const mainCashUsdBalance = (salesInflowsUsd + mainInflowsUsd) - mainOutflowsUsd + transfersToMainUsd - transfersFromMainUsd;

    // --- Consolidated Balance ---
    const exchangeRate = company?.exchangeRate || 36.5;
    const totalNio = mainCashNioBalance + pettyCashNioBalance;
    const totalUsd = mainCashUsdBalance + pettyCashUsdBalance;
    const consolidatedNioBalance = totalNio + (totalUsd * exchangeRate);

    // --- Combined list for table ---
    const allItems = [...dailySales, ...dailyOutflows, ...dailyManualInflows, ...dailyTransfers];
    const dailyItems = allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      dailyItems,
      pettyCashNioBalance, pettyCashUsdBalance,
      mainCashNioBalance, mainCashUsdBalance,
      consolidatedNioBalance
    };
  }, [sales, outflows, inflows, transfers, selectedDate, company]);


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
    <>
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
        <div className="flex flex-wrap gap-2 mb-6">
          <DatePicker date={selectedDate} onDateChange={(date) => date && setSelectedDate(startOfDay(date))} />
           
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
                    Añade un nuevo gasto o salida de dinero para el día seleccionado.
                  </DialogDescription>
                </DialogHeader>
                 <OutflowForm 
                    date={selectedDate}
                    balances={{
                        pettyNio: pettyCashNioBalance,
                        pettyUsd: pettyCashUsdBalance,
                        mainNio: mainCashNioBalance,
                        mainUsd: mainCashUsdBalance,
                    }}
                    onOutflowAdded={(newOutflow) => {
                        fetchData();
                        setLastOutflow(newOutflow);
                        setIsOutflowDialogOpen(false);
                        setIsReceiptDialogOpen(true);
                    }}
                />
              </DialogContent>
            </Dialog>
             <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" disabled={isClosed}>
                        <ArrowRightLeft className="mr-2"/>
                        Transferir entre Cajas
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Transferencia entre Cajas</DialogTitle>
                        <DialogDescription>Mueve dinero de la caja general a la caja chica o viceversa.</DialogDescription>
                    </DialogHeader>
                    <CashTransferForm 
                        date={selectedDate} 
                        balances={{
                            pettyNio: pettyCashNioBalance,
                            pettyUsd: pettyCashUsdBalance,
                            mainNio: mainCashNioBalance,
                            mainUsd: mainCashUsdBalance,
                        }}
                        onTransferAdded={() => {
                            fetchData();
                            setIsTransferDialogOpen(false);
                        }}
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Balance Caja General (C$)</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(mainCashNioBalance, 'NIO')}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Balance Caja General ($)</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(mainCashUsdBalance, 'USD')}</div>
                </CardContent>
            </Card>
             <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 col-span-1 md:col-span-2 lg:col-span-1">
                <CardHeader className="pb-2">
                    <CardDescription>Balance Total Consolidado (C$)</CardDescription>
                    <CardTitle className="text-3xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(consolidatedNioBalance, 'NIO')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Suma de todas las cajas en su equivalente en córdobas. T/C: {company?.exchangeRate || 'N/A'}</p>
                </CardContent>
            </Card>
        </div>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Balance Caja Chica (C$)</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(pettyCashNioBalance, 'NIO')}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Balance Caja Chica ($)</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(pettyCashUsdBalance, 'USD')}</div>
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
    <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Comprobante de Egreso</DialogTitle>
                <DialogDescription>
                    El egreso ha sido registrado. Puedes imprimir el comprobante a continuación.
                </DialogDescription>
            </DialogHeader>
            {lastOutflow && user && (
                <OutflowReceipt
                    outflow={lastOutflow}
                    company={company}
                    employeeName={user.name}
                    onPrint={handlePrintReceipt}
                />
            )}
        </DialogContent>
    </Dialog>
    </>
  );
}

