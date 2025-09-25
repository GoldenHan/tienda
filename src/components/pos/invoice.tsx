"use client";

import { Sale, Product } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Printer } from "lucide-react";

interface InvoiceProps {
  sale: Sale;
  companyName: string;
  onPrint: () => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
  }).format(amount);

export function Invoice({ sale, companyName, onPrint }: InvoiceProps) {
  return (
    <div className="flex flex-col">
      <div id="invoice-to-print" className="p-8 bg-white text-black rounded-lg w-full max-w-md mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-2xl font-bold font-headline">{companyName}</h1>
          <p className="text-sm">Factura de Venta</p>
        </header>
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <p className="font-semibold">Nº Transacción:</p>
            <p className="truncate">{sale.id}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Fecha y Hora:</p>
            <p>{format(new Date(sale.date), "Pp", { locale: es })}</p>
          </div>
          <div>
            <p className="font-semibold">Vendido por:</p>
            <p>{sale.employeeName}</p>
          </div>
        </div>
        <Separator className="my-4 bg-gray-300" />
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left font-semibold py-2">Producto</th>
              <th className="text-center font-semibold py-2">Cant.</th>
              <th className="text-right font-semibold py-2">Precio</th>
              <th className="text-right font-semibold py-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.productId} className="border-b border-gray-200">
                <td className="py-2">{item.productName}</td>
                <td className="text-center py-2">{item.quantity}</td>
                <td className="text-right py-2">{formatCurrency(item.salePrice)}</td>
                <td className="text-right py-2">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end mt-6">
          <div className="text-right">
            <p className="font-semibold text-lg">Total:</p>
            <p className="font-bold text-xl">{formatCurrency(sale.grandTotal)}</p>
          </div>
        </div>
        <footer className="text-center mt-8 text-xs text-gray-500">
          <p>Gracias por su compra.</p>
        </footer>
      </div>
      <div className="mt-6 flex justify-center">
        <Button onClick={onPrint}>
          <Printer className="mr-2" />
          Imprimir Factura
        </Button>
      </div>
    </div>
  );
}
