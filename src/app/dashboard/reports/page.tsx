import { OverviewCharts } from "@/components/reports/overview-charts";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between gap-4 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">
            Reportes
          </h1>
          <p className="text-muted-foreground">
            Visualiza reportes de ventas, beneficios e inventario.
          </p>
        </div>
        <Button variant="outline">
          <Printer className="mr-2" />
          Imprimir Reporte
        </Button>
      </header>
      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
        <OverviewCharts />
      </main>
    </div>
  );
}
