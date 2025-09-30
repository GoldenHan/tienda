

"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CashOutflow, Company } from "@/lib/types";
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
import { OutflowReceipt } from "../cash-reconciliation/outflow-receipt";

interface OutflowsReportProps {
  allOutflows: CashOutflow[];
}

const formatCurrency = (amount: number, currency: "NIO" | "USD") =>
  new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: currency,
  }).format(amount);

export function OutflowsReport({ allOutflows }: OutflowsReportProps) {
  const { user } = useAuth();
  const company = user?.company ?? null;
  const [selectedOutflow, setSelectedOutflow] = React.useState<CashOutflow | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);

  const handlePrintReceipt = () => {
    const printContent = document.getElementById("outflow-receipt-to-print");
    if (!printContent || !window) return;

    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Comprobante de Egreso</title>');
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
  
  const openReceiptDialog = (outflow: CashOutflow) => {
    setSelectedOutflow(outflow);
    setIsReceiptOpen(true);
  }
  
  const getBadgeVariant = (type: CashOutflow['type']): "default" | "secondary" | "destructive" => {
    switch(type) {
        case 'restock': return 'default';
        case 'withdrawal': return 'secondary';
        case 'loss': return 'destructive';
        default: return 'secondary';
    }
  }
  const getTypeText = (type: CashOutflow['type']): string => {
    switch(type) {
        case 'restock': return 'Abastecimiento';
        case 'withdrawal': return 'Retiro';
        case 'loss': return 'Pérdida/Merma';
        case 'adjustment': return 'Ajuste Venta';
        default: return 'Manual';
    }
  }


  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Caja</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-center">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allOutflows.length > 0 ? (
              allOutflows.map((outflow) => (
                <TableRow key={outflow.id}>
                  <TableCell>{formatDateFns(parseISO(outflow.date), "Pp", { locale: es })}</TableCell>
                  <TableCell className="font-medium">{outflow.reason}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(outflow.type)}>
                      {getTypeText(outflow.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {outflow.cashBox === 'general' ? 'C. General' : 'C. Chica'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    -{formatCurrency(outflow.amount, outflow.currency)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" onClick={() => openReceiptDialog(outflow)}>
                        <Printer className="mr-2 h-4 w-4"/>
                        Recibo
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No se han registrado egresos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Comprobante de Egreso</DialogTitle>
                <DialogDescription>
                    Puedes reimprimir el comprobante a continuación.
                </DialogDescription>
            </DialogHeader>
            {selectedOutflow && user && company && (
                <OutflowReceipt
                    outflow={selectedOutflow}
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
