
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getProducts, getSales, getCashOutflows, getInflows, getCashTransfers, getCompany } from '@/lib/firestore-helpers';
import { Product, Sale, CashOutflow, Inflow, CashTransfer, Company, Currency } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, ShoppingBag, DollarSign, PackagePlus, Trash2, PlusCircle, Search } from 'lucide-react';
import { isSameDay, startOfDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

type OrderItem = {
    product: Product;
    orderQuantity: number;
};

const formatCurrency = (amount: number, currency: Currency) =>
    new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: currency,
    }).format(amount);

export default function OrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [orderList, setOrderList] = useState<OrderItem[]>([]);
  
  // State for cash balances
  const [sales, setSales] = useState<Sale[]>([]);
  const [outflows, setOutflows] = useState<CashOutflow[]>([]);
  const [inflows, setInflows] = useState<Inflow[]>([]);
  const [transfers, setTransfers] = useState<CashTransfer[]>([]);
  const [company, setCompany] = useState<Company | null>(null);

  const [searchQuery, setSearchQuery] = useState('');


  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [productsData, salesData, outflowsData, inflowsData, transfersData, companyData] = await Promise.all([
        getProducts(user.uid),
        getSales(user.uid),
        getCashOutflows(user.uid),
        getInflows(user.uid),
        getCashTransfers(user.uid),
        getCompany(user.uid),
      ]);
      setAllProducts(productsData);
      setSales(salesData);
      setOutflows(outflowsData);
      setInflows(inflowsData);
      setTransfers(transfersData);
      setCompany(companyData);
    } catch (error) {
      console.error("Error fetching orders page data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos necesarios para la planificación de pedidos.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const { lowStockProducts, mainCashNioBalance, mainCashUsdBalance } = useMemo(() => {
    const today = startOfDay(new Date());
    const dayFilter = (item: { date: string }) => isSameDay(new Date(item.date), today);

    const products = allProducts.filter(p => p.quantity <= p.lowStockThreshold);

    // Calculate main cash box balance for today
    const dailySales = sales.filter(dayFilter);
    const dailyOutflows = outflows.filter(dayFilter);
    const dailyManualInflows = inflows.filter(dayFilter);
    const dailyTransfers = transfers.filter(dayFilter);

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

    const nioBalance = (salesInflowsNio + mainInflowsNio) - mainOutflowsNio + transfersToMainNio - transfersFromMainNio;
    const usdBalance = (salesInflowsUsd + mainInflowsUsd) - mainOutflowsUsd + transfersToMainUsd - transfersFromMainUsd;
    
    return { lowStockProducts: products, mainCashNioBalance: nioBalance, mainCashUsdBalance: usdBalance };

  }, [allProducts, sales, outflows, inflows, transfers]);
  
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return [];
    return allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allProducts, searchQuery]);


  const totalOrderCost = useMemo(() => {
    return orderList.reduce((total, item) => total + (item.product.purchaseCost * item.orderQuantity), 0);
  }, [orderList]);
  
  const handleAddToOrder = (product: Product, quantity: number = 1) => {
    setOrderList(prev => {
        const existingItem = prev.find(item => item.product.id === product.id);
        if (existingItem) {
            return prev.map(item => item.product.id === product.id ? { ...item, orderQuantity: item.orderQuantity + quantity } : item);
        }
        return [...prev, { product, orderQuantity: quantity }];
    });
    toast({
        description: `"${product.name}" añadido al pedido.`,
    })
  }

  const handleUpdateOrderQuantity = (productId: string, newQuantity: number) => {
    setOrderList(prev => {
        if (newQuantity <= 0) {
            return prev.filter(item => item.product.id !== productId);
        }
        return prev.map(item => item.product.id === productId ? { ...item, orderQuantity: newQuantity } : item);
    })
  }
  
  const handleRemoveFromOrder = (productId: string) => {
      setOrderList(prev => prev.filter(item => item.product.id !== productId));
  }
  
  const clearOrder = () => {
    setOrderList([]);
    toast({
        title: 'Pedido Limpiado',
        description: 'La lista de pedidos ha sido vaciada.',
    })
  }


  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">Planificador de Pedidos</h1>
        <p className="text-muted-foreground">Organiza tu próximo reabastecimiento de inventario.</p>
      </header>

      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0 grid gap-6 lg:grid-cols-3">
        {/* Columna Izquierda: Planificación y Sugerencias */}
        <div className="lg:col-span-1 space-y-6">
           <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign/> Presupuesto Disponible</CardTitle>
                    <CardDescription>Efectivo actual en la Caja General para planificar tus compras.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="text-2xl font-bold">{formatCurrency(mainCashNioBalance, 'NIO')}</div>
                    <div className="text-lg font-semibold text-muted-foreground">{formatCurrency(mainCashUsdBalance, 'USD')}</div>
                </CardContent>
           </Card>

           <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><AlertCircle className="text-destructive"/> Necesitan Reabastecimiento</CardTitle>
                    <CardDescription>Productos que han alcanzado su umbral mínimo de stock.</CardDescription>
                </CardHeader>
                <CardContent>
                    {lowStockProducts.length === 0 ? (
                        <p className="text-sm text-center text-muted-foreground py-4">¡Todo en orden! No hay productos con bajo stock.</p>
                    ) : (
                        <ScrollArea className="h-48">
                            <div className="space-y-3">
                            {lowStockProducts.map(p => (
                                <div key={p.id} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{p.name}</p>
                                        <p className="text-xs text-destructive">{p.quantity} restantes (Umbral: {p.lowStockThreshold})</p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => handleAddToOrder(p, p.lowStockThreshold * 2 - p.quantity)}>
                                        <PlusCircle/>
                                    </Button>
                                </div>
                            ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
           </Card>
        </div>

        {/* Columna Derecha: Borrador del Pedido */}
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                        <div>
                            <CardTitle className="flex items-center gap-2"><ShoppingBag/> Borrador de Pedido</CardTitle>
                            <CardDescription>Construye tu lista de compras aquí. No afectará tu inventario aún.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Popover onOpenChange={(open) => !open && setSearchQuery('')}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline"><Search className="mr-2"/> Buscar Producto</Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <div className="grid gap-4">
                                        <h4 className="font-medium leading-none">Añadir al pedido</h4>
                                        <Input
                                            placeholder="Buscar por nombre..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <ScrollArea className="h-48">
                                        {filteredProducts.length > 0 ? (
                                            <div className="space-y-2">
                                                {filteredProducts.map(p => (
                                                    <div key={p.id} className="flex items-center justify-between">
                                                        <p className="text-sm">{p.name}</p>
                                                        <Button size="sm" variant="ghost" onClick={() => handleAddToOrder(p)}>
                                                            <PlusCircle/>
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-center text-muted-foreground py-4">
                                                {searchQuery ? "No se encontraron productos." : "Escribe para buscar..."}
                                            </p>
                                        )}
                                        </ScrollArea>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <Button variant="destructive-outline" onClick={clearOrder} disabled={orderList.length === 0}><Trash2 className="mr-2"/> Limpiar</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="w-28 text-center">Cantidad</TableHead>
                                    <TableHead className="w-36 text-right">Costo Unit.</TableHead>
                                    <TableHead className="w-36 text-right">Subtotal</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orderList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            Tu lista de pedido está vacía.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orderList.map(item => (
                                        <TableRow key={item.product.id}>
                                            <TableCell className="font-medium">{item.product.name}</TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number" 
                                                    value={item.orderQuantity} 
                                                    onChange={(e) => handleUpdateOrderQuantity(item.product.id, parseInt(e.target.value) || 0)}
                                                    className="h-8 w-24 text-center"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.product.purchaseCost, 'NIO')}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(item.product.purchaseCost * item.orderQuantity, 'NIO')}</TableCell>
                                            <TableCell>
                                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleRemoveFromOrder(item.product.id)}>
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="bg-muted/50">
                                    <TableCell colSpan={3} className="text-right font-bold text-lg">Costo Total Estimado</TableCell>
                                    <TableCell colSpan={2} className="text-right font-bold text-lg text-primary">{formatCurrency(totalOrderCost, 'NIO')}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
