
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2, ShoppingCart, Loader2, ChevronsRight, Minus, Plus } from "lucide-react";
import type { CartItem, Currency } from "@/app/dashboard/pos/page";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

interface CartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCompleteSale: (paymentCurrency: Currency) => void;
  disabled?: boolean;
}

export function Cart({ cartItems, onUpdateQuantity, onRemoveItem, onCompleteSale, disabled = false }: CartProps) {
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>('NIO');
  const [amountReceived, setAmountReceived] = useState(0);

  const subtotal = cartItems.reduce((acc, item) => acc + item.salePrice * item.quantityInCart, 0);
  const change = amountReceived > 0 && amountReceived >= subtotal ? amountReceived - subtotal : 0;
  
  const isSaleCompletable = cartItems.length > 0 && !disabled && amountReceived >= subtotal;
  
  // Reset amount received when cart changes
  useEffect(() => {
    setAmountReceived(0);
  }, [cartItems]);


  const formatCurrency = (amount: number, currency: Currency) =>
    new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: currency,
    }).format(amount);

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
                       {formatCurrency(item.salePrice, 'NIO')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                     <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.id, item.quantityInCart - 1)} disabled={disabled}>
                        <Minus className="h-4 w-4"/>
                    </Button>
                    <Input
                        type="number"
                        min="1"
                        value={item.quantityInCart}
                        onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value, 10) || 0)}
                        className="w-12 h-7 text-center hide-arrows"
                        disabled={disabled}
                    />
                     <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.id, item.quantityInCart + 1)} disabled={disabled}>
                        <Plus className="h-4 w-4"/>
                    </Button>
                  </div>
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onRemoveItem(item.id)} disabled={disabled}>
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
        <div className="w-full space-y-3">
             <div className="flex justify-between items-center text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal, 'NIO')}</span>
            </div>
             <div className="flex justify-between items-center">
                <Label htmlFor="amount-received">Monto Recibido</Label>
                <Input 
                    id="amount-received"
                    type="number" 
                    className="w-32 h-9 text-right"
                    placeholder="0.00"
                    value={amountReceived || ""}
                    onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                    disabled={cartItems.length === 0 || disabled}
                />
            </div>
             <div className="flex justify-between items-center text-lg font-bold text-primary">
                <span>Cambio</span>
                <span>{formatCurrency(change, paymentCurrency)}</span>
            </div>

             <Separator />

             <RadioGroup 
                defaultValue="NIO" 
                className="grid grid-cols-2 gap-4 pt-2"
                onValueChange={(value: Currency) => setPaymentCurrency(value)}
                disabled={disabled}
            >
              <div>
                <RadioGroupItem value="NIO" id="nio" className="peer sr-only" />
                <Label
                  htmlFor="nio"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Pagar en C$
                </Label>
              </div>
              <div>
                <RadioGroupItem value="USD" id="usd" className="peer sr-only" />
                <Label
                  htmlFor="usd"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Pagar en $
                </Label>
              </div>
            </RadioGroup>
        </div>
        <Button className="w-full" onClick={() => onCompleteSale(paymentCurrency)} disabled={!isSaleCompletable}>
          {disabled && <Loader2 className="animate-spin mr-2" />}
          Completar Venta
          <ChevronsRight className="ml-2"/>
        </Button>
      </CardFooter>
    </Card>
  );
}
