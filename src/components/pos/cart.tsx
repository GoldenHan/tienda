import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2, ShoppingCart } from "lucide-react";
import type { CartItem } from "@/app/dashboard/pos/page";

interface CartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCompleteSale: () => void;
}

export function Cart({ cartItems, onUpdateQuantity, onRemoveItem, onCompleteSale }: CartProps) {
  const total = cartItems.reduce((acc, item) => acc + item.salePrice * item.quantityInCart, 0);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Carrito</CardTitle>
        <ShoppingCart className="text-muted-foreground" />
      </CardHeader>
      <Separator />
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-full">
          {cartItems.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
              Los productos que selecciones aparecerán aquí.
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                       {new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" }).format(item.salePrice)}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantityInCart}
                    onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value, 10))}
                    className="w-16 h-8 text-center"
                  />
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onRemoveItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                   </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <Separator />
      <CardFooter className="flex flex-col p-4 space-y-4">
        <div className="w-full space-y-2 text-sm">
            <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" }).format(total)}</span>
            </div>
        </div>
        <Button className="w-full" onClick={onCompleteSale} disabled={cartItems.length === 0}>
          Completar Venta
        </Button>
      </CardFooter>
    </Card>
  );
}
