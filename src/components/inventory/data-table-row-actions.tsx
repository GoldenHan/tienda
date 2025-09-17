"use client"

import { useState } from "react"
import { Row } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ProductForm } from "./product-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Product } from "@/lib/types"

interface DataTableRowActionsProps {
  row: Row<Product>
  onUpdateProduct: (product: Product) => void
  onDeleteProduct: (productId: string) => void
}

export function DataTableRowActions({ row, onUpdateProduct, onDeleteProduct }: DataTableRowActionsProps) {
  const product = row.original
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  return (
    <>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
             <DialogTrigger asChild>
              <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" />
                Editar Producto
              </DropdownMenuItem>
            </DialogTrigger>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onSelect={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar Producto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          <ProductForm 
            product={product} 
            onSubmit={(data) => {
              // We merge the updated data with the existing product data
              // This is important because the form only contains a subset of fields
              onUpdateProduct({ ...product, ...data })
              setShowEditDialog(false)
            }} 
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el
              producto "{product.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDeleteProduct(product.id)
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
