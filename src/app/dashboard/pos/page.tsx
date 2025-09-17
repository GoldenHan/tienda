"use client";

import { useState, useEffect } from "react";
import { Product, Sale, SaleItem } from "@/lib/types";
import { ProductGrid } from "@/components/pos/product-grid";
import { Cart } from "@/components/pos/cart";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { getProducts, addSale } from "@/lib/firestore-helpers";
import { Skeleton } from "@/components/ui/skeleton";

export type CartItem = Product & { quantityInCart: number };

export default function POSPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    if (!user?.companyId) return;
    try {
      setLoading(true);
      const productsData = await getProducts(user.companyId);
      setProducts(productsData);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los productos." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(user?.companyId){
      fetchProducts();
    }
  }, [user]);

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


  const handleCompleteSale = async () => {
    if (!user?.companyId) return;
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Carrito vacío",
        description: "Añade productos al carrito antes de completar la venta.",
      });
      return;
    }

    setLoading(true);
    
    const newSaleItems: SaleItem[] = cart.map((cartItem) => ({
      productId: cartItem.id,
      productName: cartItem.name,
      quantity: cartItem.quantityInCart,
      salePrice: cartItem.salePrice,
      total: cartItem.salePrice * cartItem.quantityInCart,
    }));
    
    const newSale: Omit<Sale, 'id'> = {
      date: new Date().toISOString(),
      items: newSaleItems,
      grandTotal: newSaleItems.reduce((acc, item) => acc + item.total, 0),
    };

    try {
      await addSale(user.companyId, newSale, cart);
      
      setCart([]);
      await fetchProducts();

      toast({
        title: "Venta completada",
        description: "El stock y el historial de ventas han sido actualizados.",
      });

    } catch (error) {
      console.error("Error al completar la venta:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo completar la venta. Revisa los permisos de la base de datos." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Punto de Venta
        </h1>
        <p className="text-muted-foreground">
          Selecciona productos para añadirlos al carrito y completar la venta.
        </p>
      </header>
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 pt-0 sm:p-6 sm:pt-0 overflow-hidden">
        <div className="lg:col-span-2 h-full overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-square" />)}
            </div>
          ) : (
            <ProductGrid products={products} onAddToCart={handleAddToCart} />
          )}
        </div>
        <div className="lg:col-span-1 h-full flex flex-col">
          <Cart 
            cartItems={cart}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveFromCart}
            onCompleteSale={handleCompleteSale}
            disabled={loading}
          />
        </div>
      </main>
    </div>
  );
}
