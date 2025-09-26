
"use client";

import { Sale } from "@/lib/types";
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

const formatCurrency = (amount: number, currency: 'NIO' | 'USD') =>
  new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: currency,
  }).format(amount);

export function Invoice({ sale, companyName, onPrint }: InvoiceProps) {
  return (
    <div className="flex flex-col items-center">
      {/* This is the printable receipt area */}
      <div id="invoice-to-print" className="p-2 bg-white text-black font-mono w-full max-w-xs text-xs">
        <header className="text-center mb-4">
          <h1 className="text-base font-bold uppercase">{companyName}</h1>
          <p>Recibo de Venta</p>
        </header>

        <div className="mb-2">
            <p>No: {sale.id.substring(0, 8)}</p>
            <p>Fecha: {format(new Date(sale.date), "dd/MM/yy HH:mm", { locale: es })}</p>
            <p>Cajero: {sale.employeeName}</p>
        </div>
        
        <Separator className="my-2 border-dashed border-black" />

        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left font-bold">Cant.</th>
              <th className="text-left font-bold">Producto</th>
              <th className="text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.productId}>
                <td className="align-top">{item.quantity}x</td>
                <td className="align-top">
                    {item.productName}
                    <div className="text-gray-600">
                        ({formatCurrency(item.salePrice, sale.paymentCurrency)})
                    </div>
                </td>
                <td className="text-right align-top">{formatCurrency(item.total, sale.paymentCurrency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Separator className="my-2 border-dashed border-black" />

        <div className="space-y-1 text-right">
            <p className="font-bold text-sm">
                <span>TOTAL ({sale.paymentCurrency}): </span>
                <span>{formatCurrency(sale.grandTotal, sale.paymentCurrency)}</span>
            </p>
        </div>

        <footer className="text-center mt-4">
          <p>¡Gracias por su compra!</p>
        </footer>
      </div>

      {/* This is the on-screen button */}
      <div className="mt-6 flex justify-center">
        <Button onClick={onPrint}>
          <Printer className="mr-2" />
          Imprimir Recibo
        </Button>
      </div>
    </div>
  );
}
