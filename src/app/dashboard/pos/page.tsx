
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Product, Sale, SaleItem, Category, Currency } from "@/lib/types";
import { ProductGrid } from "@/components/pos/product-grid";
import { Cart } from "@/components/pos/cart";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { getProducts, getCategories, getCompanyName } from "@/lib/firestore-helpers";
import { addSale } from "@/lib/actions/setup";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Invoice } from "@/components/pos/invoice";

export type CartItem = Product & { quantityInCart: number };
export type { Currency };

export default function POSPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompletingSale, setIsCompletingSale] = useState(false);
  const { toast } = useToast();
  
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [productsData, categoriesData, companyNameData] = await Promise.all([
        getProducts(user.uid),
        getCategories(user.uid),
        getCompanyName(user.uid),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setCompanyName(companyNameData);
    } catch (error) {
      console.error("POS fetch error:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los datos." });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if(user){
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, fetchData]);

  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantityInCart < product.quantity) {
          return prevCart.map((item) =>
            item.id === product.id
              ? { ...item, quantityInCart: item.quantityInCart + 1 }
              : item
          );
        } else {
          toast({
            variant: "destructive",
            title: "Stock insuficiente",
            description: `No hay más stock de ${product.name}.`,
          });
          return prevCart;
        }
      } else {
        if (product.quantity > 0) {
          return [...prevCart, { ...product, quantityInCart: 1 }];
        } else {
           toast({
            variant: "destructive",
            title: "Sin stock",
            description: `${product.name} está agotado.`,
          });
          return prevCart;
        }
      }
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };
  
  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCart(prevCart => {
        const productInStock = products.find(p => p.id === productId);
        if (!productInStock) return prevCart;

        if (quantity > productInStock.quantity) {
            toast({
                variant: "destructive",
                title: "Stock insuficiente",
                description: `Solo hay ${productInStock.quantity} unidades de ${productInStock.name}.`,
            });
            return prevCart.map(item => item.id === productId ? { ...item, quantityInCart: productInStock.quantity } : item);
        }

        if (quantity <= 0) {
            return prevCart.filter(item => item.id !== productId);
        }

        return prevCart.map(item => item.id === productId ? { ...item, quantityInCart: quantity } : item);
    });
  };


  const handleCompleteSale = async (paymentCurrency: Currency) => {
    if (!user) return;
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Carrito vacío",
        description: "Añade productos al carrito antes de completar la venta.",
      });
      return;
    }

    setIsCompletingSale(true);
    
    const newSaleItems: SaleItem[] = cart.map((cartItem) => ({
      productId: cartItem.id,
      productName: cartItem.name,
      quantity: cartItem.quantityInCart,
      salePrice: cartItem.salePrice,
      total: cartItem.salePrice * cartItem.quantityInCart,
    }));
    
    const saleData: Omit<Sale, 'id'> = {
      date: new Date().toISOString(),
      items: newSaleItems,
      grandTotal: newSaleItems.reduce((acc, item) => acc + item.total, 0),
      employeeId: user.uid,
      employeeName: user.name,
      paymentCurrency: paymentCurrency,
    };

    try {
      const saleId = await addSale(saleData, cart, user.uid);
      
      setCart([]);
      await fetchData(); 

      const completedSale = { ...saleData, id: saleId };
      setLastSale(completedSale);
      setIsInvoiceDialogOpen(true);

      toast({
        title: "Venta completada",
        description: "El stock y el historial de ventas han sido actualizados.",
      });

    } catch (error) {
      console.error("Error al completar la venta:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo completar la venta. Revisa los permisos de la base de datos." });
    } finally {
      setIsCompletingSale(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("invoice-to-print");
    if (!printContent) return;

    const styles = `
      body, html {
          margin: 0;
          padding: 0;
          font-family: 'monospace', sans-serif; /* Monospace for receipt look */
      }
      @media print {
        @page {
            margin: 0;
            size: 80mm auto; /* Adjust width as needed for POS printer */
        }
        body > *:not(#print-container) {
            display: none;
        }
        #print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
        }
      }
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Factura</title>');
    printWindow.document.write(`<style>${styles}</style>`);
    printWindow.document.write('</head><body><div id="print-container">');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</div></body></html>');
    printWindow.document.close();
    printWindow.focus();
    
    // Use timeout to ensure content is rendered before printing
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
};


  const categoryTabs = useMemo(() => [{ id: 'all', name: 'Todos' }, ...categories], [categories]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="lg:col-span-2 h-full overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-square" />)}
          </div>
        </div>
      );
    }

    return (
      <div className="lg:col-span-2 h-full overflow-y-auto">
        <Tabs defaultValue="all" className="flex flex-col h-full">
          <TabsList className="flex-shrink-0">
            {categoryTabs.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
            ))}
          </TabsList>
          {categoryTabs.map(cat => (
            <TabsContent key={cat.id} value={cat.id} className="flex-1 overflow-y-auto mt-4">
              <ProductGrid
                products={cat.id === 'all' ? products : products.filter(p => p.categoryId === cat.id)}
                onAddToCart={handleAddToCart}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  };


  return (
    <>
    <div className="flex h-full flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Punto de Venta
        </h1>
        <p className="text-muted-foreground">
          Selecciona una categoría y añade productos al carrito para completar la venta.
        </p>
      </header>
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 pt-0 sm:p-6 sm:pt-0 overflow-hidden">
        {renderContent()}
        <div className="lg:col-span-1 h-full flex flex-col">
          <Cart 
            cartItems={cart}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveFromCart}
            onCompleteSale={handleCompleteSale}
            disabled={isCompletingSale}
          />
        </div>
      </main>
    </div>
    <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Venta Realizada con Éxito</DialogTitle>
                <DialogDescription>
                    La venta ha sido registrada. Puedes imprimir el recibo a continuación.
                </DialogDescription>
            </DialogHeader>
            {lastSale && companyName && (
                <Invoice
                    sale={lastSale}
                    companyName={companyName}
                    onPrint={handlePrint}
                />
            )}
        </DialogContent>
    </Dialog>
    </>
  );
}
