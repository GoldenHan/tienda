
"use client";

import * as React from "react";
import { addDays, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import * as XLSX from "xlsx";

import { Sale, Product, Company } from "@/lib/types";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, FileDown, Printer } from "lucide-react";
import { ReportTable, ReportSaleItem } from "./report-table";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Invoice } from "../pos/invoice";
import { useAuth } from "@/context/auth-context";


const flattenSalesData = (sales: Sale[], products: Product[]): ReportSaleItem[] => {
  const productsMap = new Map(products.map(p => [p.id, p]));
  
  return sales.flatMap(sale => 
    sale.items.map(item => {
      const product = productsMap.get(item.productId);
      const purchaseCost = product?.purchaseCost ?? 0;
      const profit = item.total - (purchaseCost * item.quantity);
      
      return {
        id: sale.id,
        productName: item.productName,
        quantity: item.quantity,
        salePrice: item.salePrice,
        purchaseCost: purchaseCost,
        total: item.total,
        profit: profit,
        date: sale.date,
      };
    })
  );
};


export function SalesReport({ allSales, allProducts }: SalesReportProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const company = user?.company ?? null;
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  
  const [selectedSale, setSelectedSale] = React.useState<Sale | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = React.useState(false);

  const flattenedSales = React.useMemo(() => flattenSalesData(allSales, allProducts), [allSales, allProducts]);

  const filteredSales = React.useMemo(() => {
    if (!date || !date.from) return [];
    
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
  
  const handlePrintReceipt = () => {
    const printContent = document.getElementById("invoice-to-print");
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=600,width=400');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Recibo</title>');
    printWindow.document.write('<style>body { font-family: monospace; font-size: 10px; } @media print { @page { size: 80mm auto; margin: 0; } }</style>');
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
  
  const openInvoiceDialog = (saleId: string) => {
    const saleToPrint = allSales.find(s => s.id === saleId);
    if (saleToPrint) {
        setSelectedSale(saleToPrint);
        setIsInvoiceOpen(true);
    } else {
        toast({ variant: "destructive", title: "Error", description: "No se encontró la venta para imprimir." });
    }
  }


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
                <th>Costo Compra</th>
                <th>Total Venta</th>
                <th>Beneficio</th>
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
                  <td>${sale.purchaseCost}</td>
                  <td>${sale.total}</td>
                  <td>${sale.profit}</td>
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
    <>
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
              Exportar a Excel (XLSX)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportToHTML}>
              <FileDown className="mr-2" />
              Exportar a HTML
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ReportTable sales={filteredSales} onPrintReceipt={openInvoiceDialog} />
    </div>

    <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Recibo de Venta</DialogTitle>
                <DialogDescription>
                    Puedes reimprimir el recibo a continuación.
                </DialogDescription>
            </DialogHeader>
            {selectedSale && company?.name && (
                <Invoice
                    sale={selectedSale}
                    companyName={company.name}
                    onPrint={handlePrintReceipt}
                />
            )}
        </DialogContent>
    </Dialog>
    </>
  );
}

    
