
"use client"

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit } from "lucide-react";

import { Sale, Product } from "@/lib/types";
import { SalesHistoryTable } from "./sales-history-table";
import { EditSaleForm } from "./edit-sale-form";

interface SalesHistoryAccordionProps {
  sales: Sale[];
  products: Product[];
  onUpdateSale: (updatedSale: Sale) => void;
}

export function SalesHistoryAccordion({ sales, products, onUpdateSale }: SalesHistoryAccordionProps) {
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-NI', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  };

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg h-64">
        <h3 className="text-xl font-semibold">No hay ventas registradas</h3>
        <p className="text-muted-foreground mt-2">
          Realiza una venta desde la sección "Venta" para verla aquí.
        </p>
      </div>
    );
  }

  return (
    <>
      <Accordion type="single" collapsible className="w-full space-y-2">
        {sales.map((sale) => (
          <AccordionItem value={sale.id} key={sale.id} className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex justify-between items-center w-full pr-4">
                <div className="text-left">
                  <p className="font-semibold">Transacción: {sale.id}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(sale.date)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-lg">
                    {new Intl.NumberFormat("es-NI", {
                      style: "currency",
                      currency: "NIO",
                    }).format(sale.grandTotal)}
                  </p>
                  <Button variant="ghost" size="icon" onClick={(e) => {
                    e.stopPropagation();
                    setEditingSale(sale);
                  }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <SalesHistoryTable items={sale.items} total={sale.grandTotal} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Dialog open={!!editingSale} onOpenChange={(isOpen) => !isOpen && setEditingSale(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Transacción {editingSale?.id}</DialogTitle>
          </DialogHeader>
          {editingSale && (
            <EditSaleForm 
              sale={editingSale} 
              products={products}
              onSubmit={onUpdateSale} 
              onClose={() => setEditingSale(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
