

"use client"

import { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { Package } from "lucide-react"

import { Product, Category } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { DataTableRowActions } from "./data-table-row-actions"

export type ProductColumnActions = {
  onUpdateProduct: (product: Product) => void
  onDeleteProduct: (productId: string) => void
  onAdjustLoss: () => void;
  categories: Category[]
}

export const getColumns = ({ onUpdateProduct, onDeleteProduct, onAdjustLoss, categories }: ProductColumnActions): ColumnDef<Product>[] => {
  const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

  const unitLabels: Record<Product['stockingUnit'], string> = {
    unidad: 'u',
    lb: 'lb',
    oz: 'oz',
    L: 'L',
    kg: 'kg',
    qq: 'qq'
  };

  return [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Producto
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const product = row.original
        const hasImage = product.imageUrl && product.imageUrl.startsWith('http');
        
        return (
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 flex-shrink-0 rounded-md bg-muted flex items-center justify-center">
               {hasImage ? (
                  <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="rounded-md object-cover h-full w-full"
                  />
              ) : (
                  <Package className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{product.name}</span>
              <span className="text-sm text-muted-foreground truncate max-w-xs">{product.description}</span>
            </div>
          </div>
        )
      },
    },
    {
        accessorKey: "categoryId",
        header: "Categoría",
        cell: ({ row }) => {
            const categoryId = row.getValue("categoryId") as string;
            const categoryName = categoryMap.get(categoryId) || "Sin categoría";
            return <span>{categoryName}</span>
        }
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Stock
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const quantity = row.getValue("quantity") as number;
        const unit = row.original.stockingUnit;
        const unitLabel = unitLabels[unit] || 'u';
        return <div className="text-center">{quantity} {unitLabel}</div>
      }
    },
    {
      id: "status",
      header: "Estado",
      cell: ({ row }) => {
        const product = row.original
        const isLowStock = product.quantity <= product.lowStockThreshold
        return (
          <Badge variant={isLowStock ? "destructive" : "outline"}>
            {isLowStock ? "Poco Stock" : "En Stock"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "salePrice",
      header: ({ column }) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Precio Base
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("salePrice"))
        const unitLabel = unitLabels[row.original.stockingUnit] || 'u';
        const formatted = new Intl.NumberFormat("es-NI", {
          style: "currency",
          currency: "NIO",
        }).format(amount)
        return <div className="text-right font-medium">{formatted} / {unitLabel}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return <DataTableRowActions row={row} onUpdateProduct={onUpdateProduct} onDeleteProduct={onDeleteProduct} onAdjustLoss={onAdjustLoss} categories={categories} />
      },
    },
  ]
}
