
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Product, Sale, SaleItem, Category, Currency } from "@/lib/types";
import { ProductGrid } from "@/components/pos/product-grid";
import { Cart } from "@/components/pos/cart";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { getProducts, getCategories } from "@/lib/firestore-helpers";
import { addSale, markSaleForReview } from "@/lib/actions/setup";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Invoice } from "@/components/pos/invoice";
import { ReviewForm } from "@/components/sales/review-form";
import { QuantityDialog } from "@/components/pos/quantity-dialog";

export type CartItem = {
    product: Product;
    quantity: number; // The quantity to be sold, in stockingUnit
    unit: string; // The display unit (e.g., '1/2 lb', 'oz', 'unidad')
    totalPrice: number;
};
export type { Currency };

export default function POSPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const company = user?.company;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompletingSale, setIsCompletingSale] = useState(false);
  const { toast } = useToast();
  
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  
  // State for quantity dialog
  const [quantityDialogProduct, setQuantityDialogProduct] = useState<Product | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(user.uid),
        getCategories(user.uid),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
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

  const handleProductSelect = (product: Product) => {
    if (product.quantity <= 0) {
      toast({
        variant: "destructive",
        title: "Sin stock",
        description: `${product.name} está agotado.`,
      });
      return;
    }
    
    if (product.stockingUnit !== 'unidad') {
        setQuantityDialogProduct(product);
    } else {
        handleAddToCart({
            product,
            quantity: 1,
            unit: 'u',
            totalPrice: product.salePrice,
        });
    }
  };

  const handleAddToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex((i) => i.product.id === item.product.id && i.unit === item.unit);
      
      const totalQuantityInCart = prevCart
        .filter(i => i.product.id === item.product.id)
        .reduce((sum, i) => sum + i.quantity, 0);

      if (totalQuantityInCart + item.quantity > item.product.quantity) {
          toast({
            variant: "destructive",
            title: "Stock insuficiente",
            description: `No puedes añadir más ${item.product.name}. Stock disponible: ${item.product.quantity}.`,
          });
          return prevCart;
      }

      if (existingItemIndex > -1) {
        // Update existing item with same unit
        const newCart = [...prevCart];
        newCart[existingItemIndex] = {
            ...newCart[existingItemIndex],
            quantity: newCart[existingItemIndex].quantity + item.quantity,
            totalPrice: newCart[existingItemIndex].totalPrice + item.totalPrice,
        }
        return newCart;
      } else {
        // Add as a new item
        return [...prevCart, item];
      }
    });
    setQuantityDialogProduct(null);
  };

  const handleRemoveFromCart = (productId: string, unit: string) => {
    setCart((prevCart) => prevCart.filter((item) => !(item.product.id === productId && item.unit === unit)));
  };
  
  const handleUpdateCartQuantity = (productId: string, unit: string, newQuantity: number) => {
      setCart(prevCart => {
        const itemIndex = prevCart.findIndex(i => i.product.id === productId && i.unit === unit);
        if (itemIndex === -1) return prevCart;

        const item = prevCart[itemIndex];
        
        if (newQuantity <= 0) {
            return prevCart.filter((_, index) => index !== itemIndex);
        }

        const totalOtherItemsQuantity = prevCart
            .filter(i => i.product.id === productId && i.unit !== unit)
            .reduce((sum, i) => sum + i.quantity, 0);

        if (totalOtherItemsQuantity + newQuantity > item.product.quantity) {
            toast({
                variant: "destructive",
                title: "Stock insuficiente",
                description: `Solo hay ${item.product.quantity} ${item.product.stockingUnit} de ${item.product.name} en total.`,
            });
            return prevCart;
        }
        
        const newCart = [...prevCart];
        newCart[itemIndex] = {
            ...item,
            quantity: newQuantity,
            totalPrice: (item.totalPrice / item.quantity) * newQuantity,
        };
        return newCart;
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
      productId: cartItem.product.id,
      productName: cartItem.product.name,
      quantity: cartItem.quantity,
      salePrice: cartItem.totalPrice / cartItem.quantity,
      total: cartItem.totalPrice,
      unit: cartItem.unit,
    }));
    
    const saleData: Omit<Sale, 'id' | 'reviewNotes'> = {
      date: new Date().toISOString(),
      items: newSaleItems,
      grandTotal: newSaleItems.reduce((acc, item) => acc + item.total, 0),
      employeeId: user.uid,
      employeeName: user.name,
      paymentCurrency: paymentCurrency,
      needsReview: false,
    };
    
    // Server action needs a plain cart without product objects
    const plainCart = cart.map(item => ({
        id: item.product.id,
        quantityInCart: item.quantity, // This is the amount to deduct from stock
    }));

    try {
      const saleId = await addSale(saleData, plainCart, user.uid);
      
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

  const handleMarkForReview = async (notes: string) => {
    if (!user || !lastSale) return;
    try {
        await markSaleForReview(lastSale.id, notes, user.uid);
        toast({
            title: "Venta Marcada para Revisión",
            description: "Un administrador revisará esta transacción."
        });
        setIsReviewDialogOpen(false);
        setIsInvoiceDialogOpen(false);
    } catch (error) {
        console.error("Error marking sale for review:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo marcar la venta para revisión."
        });
    }
  }

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
    if (loading || !company) {
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
                onProductSelect={handleProductSelect}
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
            exchangeRate={company?.exchangeRate || 36.5}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveFromCart}
            onCompleteSale={handleCompleteSale}
            disabled={isCompletingSale}
          />
        </div>
      </main>
    </div>
    
    {quantityDialogProduct && (
      <QuantityDialog 
        product={quantityDialogProduct}
        onClose={() => setQuantityDialogProduct(null)}
        onAddToCart={handleAddToCart}
      />
    )}

    <Dialog open={isInvoiceDialogOpen} onOpenChange={(isOpen) => {
        if (!isOpen) setLastSale(null);
        setIsInvoiceDialogOpen(isOpen);
    }}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Venta Realizada con Éxito</DialogTitle>
                <DialogDescription>
                    La venta ha sido registrada. Puedes imprimir el recibo o marcarla para revisión.
                </DialogDescription>
            </DialogHeader>
            {lastSale && company?.name && (
                <Invoice
                    sale={lastSale}
                    companyName={company.name}
                    onPrint={handlePrint}
                    onMarkForReview={() => setIsReviewDialogOpen(true)}
                />
            )}
        </DialogContent>
    </Dialog>

    <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Marcar Venta para Revisión</DialogTitle>
                <DialogDescription>
                    Explica por qué esta venta necesita ser revisada por un administrador.
                </DialogDescription>
            </DialogHeader>
            <ReviewForm onSubmit={handleMarkForReview} onClose={() => setIsReviewDialogOpen(false)} />
        </DialogContent>
    </Dialog>
    </>
  );
}
