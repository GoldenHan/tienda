"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Define a type for the flattened sales data used in this component
type ReportSaleItem = {
  id: string; // Transaction ID
  productName: string;
  quantity: number;
  salePrice: number;
  total: number;
  date: string;
};

interface ReportTableProps {
  sales: ReportSaleItem[];
}

export function ReportTable({ sales }: ReportTableProps) {
  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
    }).format(amount);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "Pp", { locale: es });
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead className="text-center">Cantidad</TableHead>
            <TableHead className="text-right">Precio Unitario</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length > 0 ? (
            sales.map((sale, index) => (
              // Use a combination of sale ID and index for a more unique key in case of multiple items in one sale
              <TableRow key={`${sale.id}-${index}`}>
                <TableCell className="font-medium">{sale.productName}</TableCell>
                <TableCell className="text-center">{sale.quantity}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(sale.salePrice)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(sale.total)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatDate(sale.date)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No hay ventas en el rango de fechas seleccionado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="text-right font-bold">
              Ingresos Totales del Período
            </TableCell>
            <TableCell className="text-right font-bold">
              {formatCurrency(totalRevenue)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
