"use client";

import { useState } from "react";
import { ProductsTable } from "@/components/inventory/products-table";
import { products as initialProducts } from "@/lib/data";
import { Product } from "@/lib/types";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const handleAddProduct = (newProductData: Omit<Product, 'id' | 'description' | 'purchaseCost' | 'lowStockThreshold' | 'imageHint'>) => {
    setProducts((prevProducts) => [
      ...prevProducts,
      {
        ...newProductData,
        id: `prod_${Date.now()}`,
        // Provide default values for fields not in the form
        description: "Nueva descripción de producto.",
        purchaseCost: newProductData.salePrice * 0.5, // Example default
        lowStockThreshold: 10, // Example default
        imageHint: "nuevo producto",
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
          Inventario
        </h1>
        <p className="text-muted-foreground">
          Gestiona tus productos y controla los niveles de stock.
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
