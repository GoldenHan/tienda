"use client"

import { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"

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
          Product
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const product = row.original
      return (
        <div className="flex items-center gap-4">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={40}
            height={40}
            className="rounded-md object-cover"
          />
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
            Quantity
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
    header: "Status",
    cell: ({ row }) => {
      const product = row.original
      const isLowStock = product.quantity <= product.lowStockThreshold
      return (
        <Badge variant={isLowStock ? "destructive" : "outline"}>
          {isLowStock ? "Low Stock" : "In Stock"}
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
            Sale Price
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("salePrice"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
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
