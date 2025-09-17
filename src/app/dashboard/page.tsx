import StatCard from '@/components/dashboard/stat-card'
import { products, sales } from '@/lib/data'
import { DollarSign, Package, AlertTriangle, ShoppingCart } from 'lucide-react'

export default function DashboardPage() {
  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0)
  const totalSales = sales.length

  const totalProfit = sales.reduce((acc, sale) => {
    const product = products.find(p => p.name === sale.productName)
    if (product) {
      return acc + (sale.total - product.purchaseCost * sale.quantity)
    }
    return acc
  }, 0)

  const lowStockItems = products.filter(
    p => p.quantity <= p.lowStockThreshold
  ).length

  return (
    <div className="flex flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Panel de Control
        </h1>
      </header>
      <main className="grid flex-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
        <StatCard
          title="Ingresos Totales"
          value={totalRevenue.toLocaleString('es-NI', {
            style: 'currency',
            currency: 'NIO',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          icon={DollarSign}
          description="Ingresos totales de todas las ventas"
        />
        <StatCard
          title="Beneficio Total"
          value={totalProfit.toLocaleString('es-NI', {
            style: 'currency',
            currency: 'NIO',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          icon={DollarSign}
          description="Beneficio total de todas las ventas"
          variant="secondary"
        />
        <StatCard
          title="Ventas Totales"
          value={totalSales.toString()}
          icon={ShoppingCart}
          description="Número total de transacciones de venta"
        />
        <StatCard
          title="Artículos con Poco Stock"
          value={lowStockItems.toString()}
          icon={AlertTriangle}
          description="Artículos que necesitan ser reabastecidos pronto"
          variant={lowStockItems > 0 ? 'destructive' : 'default'}
        />
      </main>
    </div>
  )
}
