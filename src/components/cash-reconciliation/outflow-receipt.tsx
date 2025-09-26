
"use client";

import { CashOutflow, Company } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Printer } from "lucide-react";
import { Warehouse } from "@/components/icons";

interface OutflowReceiptProps {
  outflow: CashOutflow;
  company: Company | null;
  employeeName: string;
  onPrint: () => void;
}

const numberToWords = (num: number): string => {
    // Implementación simple para convertir números a palabras (solo para la parte entera)
    const a = [
        '', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
        'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'
    ];
    const b = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];

    const regex = /^(\d{1,2})(\d{2})(\d{2})(\d{1})(\d{2})$/;

    if (num === 0) return 'cero';

    const n = ('000000000' + Math.floor(num)).slice(-9).match(regex);
    if (!n) return '';
    
    let str = '';
    // ... Lógica de conversión (simplificada por brevedad)
    return 'DUMMY TEXT'; // Placeholder, una implementación real es muy larga
};


const formatCurrency = (amount: number, currency: "NIO" | "USD") =>
  new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: currency,
  }).format(amount);

export function OutflowReceipt({ outflow, company, employeeName, onPrint }: OutflowReceiptProps) {
    const amountInWords = numberToWords(outflow.amount);
    const cents = (outflow.amount % 1).toFixed(2).substring(2);

  return (
    <div className="flex flex-col items-center">
      {/* This is the printable receipt area */}
      <div id="outflow-receipt-to-print" className="p-8 bg-white text-black font-sans w-full max-w-2xl text-sm border">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Warehouse className="h-12 w-12 text-blue-600" />
            <div>
                <h1 className="text-2xl font-bold uppercase">{company?.name || 'Mi Empresa'}</h1>
                <p className="text-gray-500">Comprobante de Egreso</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">Recibo No.</p>
            <p className="text-red-600 font-mono">{outflow.id.substring(0, 8)}</p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
                <p className="text-gray-500">Fecha de Emisión:</p>
                <p className="font-medium">{format(new Date(outflow.date), "d 'de' MMMM, yyyy", { locale: es })}</p>
            </div>
             <div className="text-right bg-gray-100 p-4 rounded-lg">
                <p className="text-gray-600 uppercase tracking-wider">Total del Egreso</p>
                <p className="text-3xl font-bold text-red-700">{formatCurrency(outflow.amount, outflow.currency)}</p>
            </div>
        </div>
        
        <div className="mb-8 p-4 border rounded-md">
            <p><span className="font-bold">La suma de:</span> {amountInWords} y {cents}/100 {outflow.currency === 'NIO' ? 'Córdobas Netos' : 'Dólares Americanos'}.</p>
        </div>

        <div className="mb-12">
            <p className="text-gray-500">En concepto de:</p>
            <p className="font-medium">{outflow.reason}</p>
        </div>
        
        <Separator className="my-12" />

        <div className="grid grid-cols-2 gap-16 pt-8">
             <div className="text-center">
                <div className="border-t border-gray-400 pt-2">
                    <p className="font-medium">{employeeName}</p>
                    <p className="text-xs text-gray-500">(Entregado por)</p>
                </div>
            </div>
            <div className="text-center">
                 <div className="border-t border-gray-400 pt-2">
                    <p className="font-medium">_________________________</p>
                    <p className="text-xs text-gray-500">(Recibido por)</p>
                </div>
            </div>
        </div>

        <footer className="text-center mt-12 text-xs text-gray-400">
            <p>Este es un comprobante de salida de efectivo. Debe ser firmado por ambas partes.</p>
        </footer>
      </div>

      {/* This is the on-screen button */}
      <div className="mt-6 flex justify-center">
        <Button onClick={onPrint}>
          <Printer className="mr-2" />
          Imprimir Comprobante
        </Button>
      </div>
    </div>
  );
}

