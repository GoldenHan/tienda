

"use client"

import { useState } from "react"
import { Row } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2, TrendingDown } from "lucide-react"

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import type { Product, Category } from "@/lib/types"
import { LossAdjustmentForm } from "./loss-adjustment-form"

interface DataTableRowActionsProps {
  row: Row<Product>
  onUpdateProduct: (product: Product) => void
  onDeleteProduct: (productId: string) => void
  onAdjustLoss: () => void;
  categories: Category[]
}

export function DataTableRowActions({ row, onUpdateProduct, onDeleteProduct, onAdjustLoss, categories }: DataTableRowActionsProps) {
  const product = row.original
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showLossDialog, setShowLossDialog] = useState(false)

  return (
    <>
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
          <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar Producto
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setShowLossDialog(true)}>
            <TrendingDown className="mr-2 h-4 w-4" />
            Ajustar por Pérdida
          </DropdownMenuItem>
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

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
             <DialogDescription>
              Realiza cambios en los detalles del producto. Haz clic en guardar cuando hayas terminado.
            </DialogDescription>
          </DialogHeader>
          <ProductForm 
            product={product} 
            categories={categories}
            onSubmit={(data) => {
              onUpdateProduct({ ...product, ...data })
              setShowEditDialog(false)
            }} 
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={showLossDialog} onOpenChange={setShowLossDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar por Pérdida/Merma</DialogTitle>
            <DialogDescription>
              Registra la cantidad de "{product.name}" que se ha perdido, vencido o dañado.
            </DialogDescription>
          </DialogHeader>
          <LossAdjustmentForm 
            product={product}
            onClose={() => setShowLossDialog(false)}
            onLossAdjusted={() => {
                onAdjustLoss();
                setShowLossDialog(false);
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
