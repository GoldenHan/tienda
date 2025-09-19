
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SaleItem, CashOutflow, Inflow } from "@/lib/types";
import { Badge } from "../ui/badge";

type ReconciliationItem = (SaleItem & { type: 'sale', date: string }) | (CashOutflow & { type: 'outflow' }) | (Inflow & { type: 'inflow' });


interface ReconciliationTableProps {
  items: ReconciliationItem[];
}

export function ReconciliationTable({ items }: ReconciliationTableProps) {
    const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
    }).format(amount);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('es-NI', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderRow = (item: ReconciliationItem, index: number) => {
        const key = `item-${item.type}-${'id' in item ? item.id : ''}-${index}`;

        if (item.type === 'sale') {
            return (
                <TableRow key={key}>
                    <TableCell className="font-medium flex items-center gap-2">
                        <Badge variant="secondary">Venta</Badge>
                        <span>{item.productName}</span>
                    </TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-500">
                        {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatDate(item.date)}</TableCell>
                </TableRow>
            )
        }
        if (item.type === 'inflow') {
            return (
                <TableRow key={key}>
                    <TableCell className="font-medium flex items-center gap-2">
                        <Badge>Ingreso Manual</Badge>
                        <span>{item.reason}</span>
                    </TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-500">
                        {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatDate(item.date)}</TableCell>
                </TableRow>
            )
        }
        if (item.type === 'outflow') {
            return (
                 <TableRow key={key}>
                    <TableCell className="font-medium flex items-center gap-2">
                        <Badge variant="destructive">Egreso</Badge>
                        <span>{item.reason}</span>
                    </TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-right text-red-600 dark:text-red-500">
                        -{formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatDate(item.date)}</TableCell>
                </TableRow>
            )
        }
    }


  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-center">Cantidad</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="text-right">Hora</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length > 0 ? (
            items.map(renderRow)
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No hay movimientos para la fecha seleccionada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
