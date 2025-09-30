
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Sale, CashOutflow, Inflow, Currency, CashTransfer, SaleItem } from "@/lib/types";
import { Badge } from "../ui/badge";
import { ArrowRightLeft, ShoppingCart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

type ReconciliationItem = Sale | CashOutflow | Inflow | CashTransfer;


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
    
    const renderCashBox = (box: 'general' | 'petty') => {
        return box === 'general' ? <Badge variant="secondary">C. General</Badge> : <Badge variant="outline">C. Chica</Badge>;
    }

    const renderCartCell = (cartItems: SaleItem[]) => (
        <TooltipProvider>
            <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                    <span className="flex items-center gap-2 cursor-help">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        {cartItems.length} producto(s)
                    </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs bg-popover text-popover-foreground p-3">
                    <ul className="space-y-1">
                        {cartItems.map(item => (
                            <li key={item.productId} className="flex justify-between gap-4">
                                <span className="truncate">{item.quantity}x {item.productName}</span>
                                <span className="font-mono">{formatCurrency(item.total, 'NIO')}</span>
                            </li>
                        ))}
                    </ul>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    const renderRow = (item: ReconciliationItem, index: number) => {
        if ('items' in item) { // Is a Sale
            return (
                <TableRow key={`${item.id}-${index}`}>
                    <TableCell className="font-medium flex items-center gap-2">
                        <Badge variant="secondary">Venta</Badge>
                        <span>Venta #{item.id.substring(0,6)}...</span>
                    </TableCell>
                    <TableCell className="text-center">{renderCartCell(item.items)}</TableCell>
                     <TableCell className="text-center">{renderCashBox('general')}</TableCell>
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
                    <TableCell className="text-center">{renderCashBox(item.cashBox)}</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-500">
                        {formatCurrency(item.total, item.currency)}
                    </TableCell>
                    <TableCell className="text-center">{item.currency}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatDate(item.date)}</TableCell>
                </TableRow>
            )
        }
        if ('fromBox' in item) { // is a CashTransfer
             return (
                <TableRow key={item.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                        <Badge variant="outline" className="border-blue-500">Transferencia</Badge>
                        <span>{item.reason}</span>
                    </TableCell>
                    <TableCell className="text-center">-</TableCell>
                     <TableCell className="text-center">
                        <div className='flex items-center justify-center gap-1'>
                            {renderCashBox(item.fromBox)} <ArrowRightLeft className="h-3 w-3"/> {renderCashBox(item.toBox)}
                        </div>
                     </TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-right text-blue-600 dark:text-blue-500">
                        {formatCurrency(item.amount, item.currency)}
                    </TableCell>
                    <TableCell className="text-center">{item.currency}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatDate(item.date)}</TableCell>
                </TableRow>
            );
        }
        if ('amount' in item) { // Is a CashOutflow
            return (
                 <TableRow key={item.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                        <Badge variant="destructive">Egreso</Badge>
                        <span>{item.reason}</span>
                    </TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">{renderCashBox(item.cashBox)}</TableCell>
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
            <TableHead className="text-center">Carrito</TableHead>
            <TableHead className="text-center">Caja</TableHead>
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
              <TableCell colSpan={7} className="h-24 text-center">
                No hay movimientos para la fecha seleccionada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
