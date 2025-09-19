
"use client"

import { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { Package } from "lucide-react"

import { Product } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { DataTableRowActions } from "./data-table-row-actions"

export type ProductColumnActions = {
  onUpdateProduct: (product: Product) => void
  onDeleteProduct: (productId: string) => void
}

export const getColumns = ({ onUpdateProduct, onDeleteProduct }: ProductColumnActions): ColumnDef<Product>[] => [
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
    accessorKey: "quantity",
    header: ({ column }) => {
      return (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Cantidad
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      return <div className="text-center">{row.getValue("quantity")}</div>
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
            Precio de Venta
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("salePrice"))
      const formatted = new Intl.NumberFormat("es-NI", {
        style: "currency",
        currency: "NIO",
      }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return <DataTableRowActions row={row} onUpdateProduct={onUpdateProduct} onDeleteProduct={onDeleteProduct} />
    },
  },
]
