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
          Dashboard
        </h1>
      </header>
      <main className="grid flex-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={DollarSign}
          description="Total revenue from all sales"
        />
        <StatCard
          title="Total Profit"
          value={`$${totalProfit.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={DollarSign}
          description="Total profit from all sales"
          variant="secondary"
        />
        <StatCard
          title="Total Sales"
          value={totalSales.toString()}
          icon={ShoppingCart}
          description="Total number of sales transactions"
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockItems.toString()}
          icon={AlertTriangle}
          description="Items needing to be restocked soon"
          variant={lowStockItems > 0 ? 'destructive' : 'default'}
        />
      </main>
    </div>
  )
}
