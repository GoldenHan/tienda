
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Sale, CashOutflow, Inflow, Currency } from "@/lib/types";
import { Badge } from "../ui/badge";

type ReconciliationItem = Sale | CashOutflow | Inflow;


interface ReconciliationTableProps {
  items: ReconciliationItem[];
}

export function ReconciliationTable({ items }: ReconciliationTableProps) {
    const formatCurrency = (amount: number, currency: Currency) =>
        new Intl.NumberFormat("es-NI", {
          style: "currency",
          currency: currency,
        }).format(amount);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('es-NI', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderRow = (item: ReconciliationItem, index: number) => {
        if ('items' in item) { // Is a Sale
            return (
                <TableRow key={`${item.id}-${index}`}>
                    <TableCell className="font-medium flex items-center gap-2">
                        <Badge variant="secondary">Venta</Badge>
                        <span>Venta de {item.items.length} tipo(s) de producto</span>
                    </TableCell>
                    <TableCell className="text-center">{item.items.reduce((acc, curr) => acc + curr.quantity, 0)}</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-500">
                        {formatCurrency(item.grandTotal, item.paymentCurrency)}
                    </TableCell>
                    <TableCell className="text-center">{item.paymentCurrency}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatDate(item.date)}</TableCell>
                </TableRow>
            );
        }
        if ('total' in item) { // Is an Inflow
            return (
                <TableRow key={item.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                        <Badge>Ingreso Manual</Badge>
                        <span>{item.reason}</span>
                    </TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-500">
                        {formatCurrency(item.total, item.currency)}
                    </TableCell>
                    <TableCell className="text-center">{item.currency}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatDate(item.date)}</TableCell>
                </TableRow>
            )
        }
        if ('amount' in item) { // Is a CashOutflow
            return (
                 <TableRow key={item.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                        <Badge variant="destructive">Egreso</Badge>
                        <span>{item.reason}</span>
                    </TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-right text-red-600 dark:text-red-500">
                        -{formatCurrency(item.amount, item.currency)}
                    </TableCell>
                    <TableCell className="text-center">{item.currency}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatDate(item.date)}</TableCell>
                </TableRow>
            )
        }
        return null;
    }


  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-center">Cantidad</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="text-center">Moneda</TableHead>
            <TableHead className="text-right">Hora</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length > 0 ? (
            items.map(renderRow)
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No hay movimientos para la fecha seleccionada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

    