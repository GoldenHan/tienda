"use client";

import * as React from "react";
import { addDays, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import * as XLSX from "xlsx";

import { Sale } from "@/lib/types";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, FileDown, Printer } from "lucide-react";
import { ReportTable } from "./report-table";
import { useToast } from "@/hooks/use-toast";

interface SalesReportProps {
  allSales: Sale[];
}

// Helper to flatten sales data for the report
const flattenSales = (sales: Sale[]) => {
  return sales.flatMap(sale => 
    sale.items.map(item => ({
      id: sale.id, // Transaction ID
      productName: item.productName,
      quantity: item.quantity,
      salePrice: item.salePrice,
      total: item.total,
      date: sale.date,
    }))
  );
};


export function SalesReport({ allSales }: SalesReportProps) {
  const { toast } = useToast();
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const flattenedSales = React.useMemo(() => flattenSales(allSales), [allSales]);

  const filteredSales = React.useMemo(() => {
    if (!date || !date.from) return [];
    
    // Ensure we cover the entire day for the start and end dates
    const startDate = startOfDay(date.from);
    const endDate = endOfDay(date.to || date.from);

    return flattenedSales.filter((sale) =>
      isWithinInterval(parseISO(sale.date), {
        start: startDate,
        end: endDate,
      })
    );
  }, [flattenedSales, date]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportToCSV = () => {
    if (filteredSales.length === 0) {
      toast({
        variant: "destructive",
        title: "No hay datos para exportar",
        description: "Selecciona un rango de fechas con ventas.",
      });
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(filteredSales);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");
    XLSX.writeFile(workbook, "reporte_ventas.xlsx");
  };

  const handleExportToHTML = () => {
    if (filteredSales.length === 0) {
      toast({
        variant: "destructive",
        title: "No hay datos para exportar",
        description: "Selecciona un rango de fechas con ventas.",
      });
      return;
    }
    const tableHtml = `
      <html>
        <head>
          <title>Reporte de Ventas</title>
          <style>
            body { font-family: sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            th { background-color: #4CAF50; color: white; }
          </style>
        </head>
        <body>
          <h1>Reporte de Ventas</h1>
          <table>
            <thead>
              <tr>
                <th>ID Venta</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Total</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSales
                .map(
                  (sale) => `
                <tr>
                  <td>${sale.id}</td>
                  <td>${sale.productName}</td>
                  <td>${sale.quantity}</td>
                  <td>${sale.salePrice}</td>
                  <td>${sale.total}</td>
                  <td>${new Date(sale.date).toLocaleString('es-NI')}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const blob = new Blob([tableHtml], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "reporte_ventas.html";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DateRangePicker date={date} onDateChange={setDate} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <FileDown className="mr-2" />
              Exportar
              <ChevronDown className="ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handlePrint}>
              <Printer className="mr-2" />
              Imprimir / Guardar como PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportToCSV}>
              <FileDown className="mr-2" />
              Exportar a Excel (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportToHTML}>
              <FileDown className="mr-2" />
              Exportar a HTML
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ReportTable sales={filteredSales} />
    </div>
  );
}
