"use client";

import { useState } from "react";
import { products as initialProducts, sales as initialSales } from "@/lib/data";
import { Product, Sale } from "@/lib/types";
import { ProductGrid } from "@/components/pos/product-grid";
import { Cart } from "@/components/pos/cart";
import { useToast } from "@/hooks/use-toast";

export type CartItem = Product & { quantityInCart: number };

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

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


  const handleCompleteSale = () => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Carrito vacío",
        description: "Añade productos al carrito antes de completar la venta.",
      });
      return;
    }
    // Update product quantities
    setProducts((prevProducts) => {
      let tempProducts = [...prevProducts];
      cart.forEach((cartItem) => {
        tempProducts = tempProducts.map((p) =>
          p.id === cartItem.id
            ? { ...p, quantity: p.quantity - cartItem.quantityInCart }
            : p
        );
      });
      return tempProducts;
    });

    // Add to sales history
    const newSales: Sale[] = cart.map((cartItem) => ({
      id: `sale_${Date.now()}_${cartItem.id}`,
      productName: cartItem.name,
      quantity: cartItem.quantityInCart,
      salePrice: cartItem.salePrice,
      total: cartItem.salePrice * cartItem.quantityInCart,
      date: new Date().toISOString().split("T")[0],
    }));

    setSales((prevSales) => [...newSales, ...prevSales]);
    
    // Clear cart
    setCart([]);

    toast({
      title: "Venta completada",
      description: "El stock de productos y el historial de ventas han sido actualizados.",
    });
  };

  return (
    <div className="flex h-full flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Punto de Venta (POS)
        </h1>
        <p className="text-muted-foreground">
          Selecciona productos para añadirlos al carrito y completar la venta.
        </p>
      </header>
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 pt-0 sm:p-6 sm:pt-0 overflow-hidden">
        <div className="lg:col-span-2 h-full overflow-y-auto">
           <ProductGrid products={products} onAddToCart={handleAddToCart} />
        </div>
        <div className="lg:col-span-1 h-full flex flex-col">
          <Cart 
            cartItems={cart}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveFromCart}
            onCompleteSale={handleCompleteSale}
          />
        </div>
      </main>
    </div>
  );
}
