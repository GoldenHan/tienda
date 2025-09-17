import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SaleItem } from "@/lib/types"

interface SalesHistoryTableProps {
  items: SaleItem[]
}

export function SalesHistoryTable({ items }: SalesHistoryTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead className="text-center">Cantidad</TableHead>
            <TableHead className="text-right">Precio Unitario</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.productId}>
              <TableCell className="font-medium">{item.productName}</TableCell>
              <TableCell className="text-center">{item.quantity}</TableCell>
              <TableCell className="text-right">
                {new Intl.NumberFormat("es-NI", {
                  style: "currency",
                  currency: "NIO",
                }).format(item.salePrice)}
              </TableCell>
              <TableCell className="text-right">
                {new Intl.NumberFormat("es-NI", {
                  style: "currency",
                  currency: "NIO",
                }).format(item.total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
