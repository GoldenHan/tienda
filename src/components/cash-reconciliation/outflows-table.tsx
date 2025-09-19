
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CashOutflow } from "@/lib/types";

interface OutflowsTableProps {
  outflows: CashOutflow[];
}

export function OutflowsTable({ outflows }: OutflowsTableProps) {
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

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Motivo</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="text-right">Hora</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {outflows.length > 0 ? (
            outflows.map((outflow) => (
              <TableRow key={outflow.id}>
                <TableCell className="font-medium">{outflow.reason}</TableCell>
                <TableCell className="text-right text-red-600 dark:text-red-500">
                  -{formatCurrency(outflow.amount)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatDate(outflow.date)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center">
                No se han registrado egresos hoy.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
