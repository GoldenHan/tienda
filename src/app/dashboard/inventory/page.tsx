
"use client";

import { useState, useEffect, useCallback } from "react";
import { ProductsTable } from "@/components/inventory/products-table";
import { Product } from "@/lib/types";
import { getProducts, addProduct, updateProduct, deleteProduct } from "@/lib/firestore-helpers";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export default function InventoryPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = useCallback(async (companyId: string) => {
    setLoading(true);
    try {
      const productsData = await getProducts(companyId);
      setProducts(productsData);
    } catch (error) {
      console.error("Inventory fetch error:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los productos." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user?.companyId) {
      fetchProducts(user.companyId);
    } else {
      setLoading(true); // Keep loading until user and companyId are available
    }
  }, [user, fetchProducts]);

  const handleAddProduct = async (newProductData: Omit<Product, 'id'>) => {
    if (!user?.companyId) return;
    try {
      await addProduct(user.companyId, newProductData);
      await fetchProducts(user.companyId); 
      toast({ title: "Éxito", description: "Producto añadido correctamente." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo añadir el producto." });
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    if (!user?.companyId) return;
    try {
      await updateProduct(user.companyId, updatedProduct.id, updatedProduct);
      await fetchProducts(user.companyId);
      toast({ title: "Éxito", description: "Producto actualizado correctamente." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el producto." });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!user?.companyId) return;
    try {
      await deleteProduct(user.companyId, productId);
      await fetchProducts(user.companyId);
      toast({ title: "Éxito", description: "Producto eliminado correctamente." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el producto." });
    }
  };

  return (
    <div className="flex flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Inventario
        </h1>
        <p className="text-muted-foreground">
          Gestiona tus productos y controla los niveles de stock.
        </p>
      </header>
      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
        {loading ? (
          <div className="space-y-4">
             <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <ProductsTable
            data={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}
      </main>
    </div>
  );
}
