
"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, FileDown, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Badge } from "../ui/badge";

interface InventoryReportProps {
  allProducts: Product[];
}

export function InventoryReport({ allProducts }: InventoryReportProps) {
  const { toast } = useToast();

  const totalInventoryValue = React.useMemo(() => {
    return allProducts.reduce((acc, product) => acc + (product.purchaseCost * product.quantity), 0);
  }, [allProducts]);
  
  const totalItems = React.useMemo(() => {
    return allProducts.reduce((acc, product) => acc + product.quantity, 0);
  }, [allProducts]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (allProducts.length === 0) {
      toast({
        variant: "destructive",
        title: "No hay datos para exportar",
      });
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(allProducts.map(p => ({
        Nombre: p.name,
        Cantidad: p.quantity,
        'Unidad Medida': p.unitOfMeasure,
        'Costo de Compra': p.purchaseCost,
        'Precio de Venta': p.salePrice,
        'Valor Total': p.purchaseCost * p.quantity,
        'Estado': p.quantity <= p.lowStockThreshold ? 'Poco Stock' : 'En Stock'
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
    XLSX.writeFile(workbook, "reporte_inventario.xlsx");
  };
  
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
    }).format(amount);

    const unitLabels: Record<Product['unitOfMeasure'], string> = {
        unidad: 'u',
        lb: 'lb',
        onz: 'oz',
        L: 'L',
    };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
            <DropdownMenuItem onClick={handleExport}>
              <FileDown className="mr-2" />
              Exportar a Excel (XLSX)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

       <div className="rounded-lg border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Costo Unitario</TableHead>
                    <TableHead className="text-right">Valor Total de Stock</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {allProducts.length > 0 ? (
                    allProducts.map((product) => (
                    <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                             <Badge variant={product.quantity <= product.lowStockThreshold ? "destructive" : "outline"}>
                                {product.quantity <= product.lowStockThreshold ? "Poco Stock" : "En Stock"}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-center">{product.quantity} {unitLabels[product.unitOfMeasure] || 'u'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(product.purchaseCost)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(product.purchaseCost * product.quantity)}</TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No hay productos en el inventario.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
                <TableFooter>
                <TableRow className="bg-muted/50">
                    <TableCell colSpan={2} className="font-bold">
                    Total General
                    </TableCell>
                    <TableCell className="text-center font-bold">{totalItems} unidades</TableCell>
                    <TableCell colSpan={2} className="text-right font-bold">
                    {formatCurrency(totalInventoryValue)}
                    </TableCell>
                </TableRow>
                </TableFooter>
            </Table>
        </div>
    </div>
  );
}
