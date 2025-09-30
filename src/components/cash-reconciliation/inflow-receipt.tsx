
"use client";

import { Inflow, Company } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Printer } from "lucide-react";
import { Warehouse } from "@/components/icons";

interface InflowReceiptProps {
  inflow: Inflow;
  company: Company | null;
  employeeName: string;
  onPrint: () => void;
}

const numberToWords = (num: number): string => {
    // This is a simplified version for demonstration.
    // A full implementation is quite long.
    const integerPart = Math.floor(num);
    // You would typically use a library or a more extensive function for a real app.
    return `[${integerPart} en letras]`; 
};

const formatCurrency = (amount: number, currency: "NIO" | "USD") =>
  new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: currency,
  }).format(amount);

export function InflowReceipt({ inflow, company, employeeName, onPrint }: InflowReceiptProps) {
    const amountInWords = numberToWords(inflow.total);
    const cents = (inflow.total % 1).toFixed(2).substring(2);

  return (
    <div className="flex flex-col items-center">
      {/* Printable receipt area */}
      <div id="inflow-receipt-to-print" className="p-8 bg-white text-black font-sans w-full max-w-2xl text-sm border">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Warehouse className="h-12 w-12 text-blue-600" />
            <div>
                <h1 className="text-2xl font-bold uppercase">{company?.name || 'Mi Empresa'}</h1>
                <p className="text-gray-500">Comprobante de Ingreso</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">Recibo No.</p>
            <p className="text-blue-600 font-mono">{inflow.id.substring(0, 8)}</p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
                <p className="text-gray-500">Fecha de Emisión:</p>
                <p className="font-medium">{format(new Date(inflow.date), "d 'de' MMMM, yyyy", { locale: es })}</p>
            </div>
             <div className="text-right bg-gray-100 p-4 rounded-lg">
                <p className="text-gray-600 uppercase tracking-wider">Total del Ingreso</p>
                <p className="text-3xl font-bold text-green-700">{formatCurrency(inflow.total, inflow.currency)}</p>
            </div>
        </div>
        
        <div className="mb-8 p-4 border rounded-md">
            <p><span className="font-bold">Recibimos la suma de:</span> {amountInWords} y {cents}/100 {inflow.currency === 'NIO' ? 'Córdobas Netos' : 'Dólares Americanos'}.</p>
        </div>

        <div className="mb-12">
            <p className="text-gray-500">En concepto de:</p>
            <p className="font-medium">{inflow.reason}</p>
        </div>
        
        <Separator className="my-12" />

        <div className="grid grid-cols-2 gap-16 pt-8">
             <div className="text-center">
                <div className="border-t border-gray-400 pt-2">
                    <p className="font-medium">{employeeName}</p>
                    <p className="text-xs text-gray-500">(Elaborado por)</p>
                </div>
            </div>
            <div className="text-center">
                 <div className="border-t border-gray-400 pt-2">
                    <p className="font-medium">_________________________</p>
                    <p className="text-xs text-gray-500">(Recibido y Aprobado por)</p>
                </div>
            </div>
        </div>

        <footer className="text-center mt-12 text-xs text-gray-400">
            <p>Este es un comprobante de entrada de efectivo.</p>
        </footer>
      </div>

      {/* On-screen print button */}
      <div className="mt-6 flex justify-center">
        <Button onClick={onPrint}>
          <Printer className="mr-2" />
          Imprimir Comprobante
        </Button>
      </div>
    </div>
  );
}
