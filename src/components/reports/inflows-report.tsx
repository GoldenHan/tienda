
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { Inflow, Company } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "../ui/badge";
import { format as formatDateFns, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/context/auth-context";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { InflowReceipt } from "../cash-reconciliation/inflow-receipt";

interface InflowsReportProps {
  allInflows: Inflow[];
}

const formatCurrency = (amount: number, currency: "NIO" | "USD") =>
  new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: currency,
  }).format(amount);

export function InflowsReport({ allInflows }: InflowsReportProps) {
  const { user } = useAuth();
  const company = user?.company ?? null;
  const [selectedInflow, setSelectedInflow] = React.useState<Inflow | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);

  const handlePrintReceipt = () => {
    const printContent = document.getElementById("inflow-receipt-to-print");
    if (!printContent || !window) return;

    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Comprobante de Ingreso</title>');
    printWindow.document.write('<style>body { font-family: sans-serif; } @media print { @page { size: auto; margin: 0.5in; } }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
  };
  
  const openReceiptDialog = (inflow: Inflow) => {
    setSelectedInflow(inflow);
    setIsReceiptOpen(true);
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Caja</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-center">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allInflows.length > 0 ? (
              allInflows.map((inflow) => (
                <TableRow key={inflow.id}>
                  <TableCell>{formatDateFns(parseISO(inflow.date), "Pp", { locale: es })}</TableCell>
                  <TableCell className="font-medium">{inflow.reason}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {inflow.cashBox === 'general' ? 'C. General' : 'C. Chica'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600 dark:text-green-500">
                    {formatCurrency(inflow.total, inflow.currency)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" onClick={() => openReceiptDialog(inflow)}>
                        <Printer className="mr-2 h-4 w-4"/>
                        Recibo
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No se han registrado ingresos manuales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Comprobante de Ingreso</DialogTitle>
                <DialogDescription>
                    Puedes reimprimir el comprobante a continuación.
                </DialogDescription>
            </DialogHeader>
            {selectedInflow && user && company && (
                <InflowReceipt
                    inflow={selectedInflow}
                    company={company}
                    employeeName={user.name} 
                    onPrint={handlePrintReceipt}
                />
            )}
        </DialogContent>
    </Dialog>
    </>
  );
}
