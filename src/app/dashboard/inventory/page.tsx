"use client";

import { useState } from "react";
import { ProductsTable } from "@/components/inventory/products-table";
import { products as initialProducts } from "@/lib/data";
import { Product } from "@/lib/types";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const handleAddProduct = (newProduct: Omit<Product, "id">) => {
    setProducts((prevProducts) => [
      ...prevProducts,
      {
        ...newProduct,
        id: `prod_${Date.now()}`,
        imageUrl: "https://picsum.photos/seed/placeholder/400/400", // Default placeholder
        imageHint: "new product",
      },
    ]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.id === updatedProduct.id ? updatedProduct : p
      )
    );
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prevProducts) =>
      prevProducts.filter((p) => p.id !== productId)
    );
  };

  return (
    <div className="flex flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Inventory
        </h1>
        <p className="text-muted-foreground">
          Manage your products and track stock levels.
        </p>
      </header>
      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
        <ProductsTable
          data={products}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
        />
      </main>
    </div>
  );
}
