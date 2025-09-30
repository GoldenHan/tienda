
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2, ShoppingCart, Loader2, ChevronsRight } from "lucide-react";
import type { CartItem, Currency } from "@/app/dashboard/pos/page";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";

interface CartProps {
  cartItems: CartItem[];
  exchangeRate: number;
  onUpdateQuantity: (productId: string, unit: string, newQuantity: number) => void;
  onRemoveItem: (productId: string, unit: string) => void;
  onCompleteSale: (paymentCurrency: Currency) => void;
  disabled?: boolean;
}

export function Cart({ cartItems, exchangeRate, onUpdateQuantity, onRemoveItem, onCompleteSale, disabled = false }: CartProps) {
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>('NIO');
  const [changeCurrency, setChangeCurrency] = useState<Currency>('NIO');
  const [amountReceived, setAmountReceived] = useState(0);

  const subtotalNio = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);

  // Reset states when cart changes
  useEffect(() => {
    setAmountReceived(0);
    setPaymentCurrency('NIO');
    setChangeCurrency('NIO');
  }, [cartItems]);
  
  const formatCurrency = (amount: number, currency: Currency) =>
    new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: currency,
    }).format(amount);

  const { change, totalToPayDisplay, isSaleCompletable } = (() => {
    if (cartItems.length === 0) {
      return { change: 0, totalToPayDisplay: formatCurrency(0, 'NIO'), isSaleCompletable: false };
    }

    let totalInPaymentCurrency = subtotalNio;
    if (paymentCurrency === 'USD') {
        totalInPaymentCurrency = subtotalNio / exchangeRate;
    }

    const hasReceivedEnough = amountReceived >= totalInPaymentCurrency;
    let changeAmount = 0;

    if (hasReceivedEnough) {
        const remainingAmountInPaymentCurrency = amountReceived - totalInPaymentCurrency;
        
        if (paymentCurrency === changeCurrency) {
            changeAmount = remainingAmountInPaymentCurrency;
        } else if (paymentCurrency === 'NIO' && changeCurrency === 'USD') {
            // Paid in NIO, wants change in USD
            changeAmount = remainingAmountInPaymentCurrency / exchangeRate;
        } else { // paymentCurrency === 'USD' && changeCurrency === 'NIO'
            // Paid in USD, wants change in NIO
            changeAmount = remainingAmountInPaymentCurrency * exchangeRate;
        }
    }
    
    return {
        change: changeAmount,
        totalToPayDisplay: formatCurrency(totalInPaymentCurrency, paymentCurrency),
        isSaleCompletable: hasReceivedEnough && !disabled
    }
  })();


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
              {cartItems.map((item, index) => (
                <div key={`${item.product.id}-${item.unit}-${index}`} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                       <Badge variant="outline" className="mr-1">{item.unit}</Badge>
                       {formatCurrency(item.totalPrice, 'NIO')}
                    </p>
                  </div>
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onRemoveItem(item.product.id, item.unit)} disabled={disabled}>
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
                <span className="text-lg">Total a Pagar:</span>
                <span className="font-bold text-lg text-primary">{totalToPayDisplay}</span>
            </div>
             <div className="flex justify-between items-center">
                <Label htmlFor="amount-received">Monto Recibido ({paymentCurrency})</Label>
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
             <div className="flex justify-between items-center text-lg font-bold text-green-600">
                <span>Vuelto</span>
                <span>{formatCurrency(change, changeCurrency)}</span>
            </div>

             <Separator />
            <div className="grid grid-cols-2 gap-4 pt-2">
                 <div>
                    <Label className="text-sm font-medium mb-2 block">Pagar en</Label>
                     <RadioGroup 
                        value={paymentCurrency} 
                        className="grid grid-cols-2 gap-2"
                        onValueChange={(value: Currency) => setPaymentCurrency(value)}
                        disabled={disabled}
                    >
                      <Label htmlFor="nio-pay" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                         <RadioGroupItem value="NIO" id="nio-pay" className="sr-only peer" />
                         C$
                      </Label>
                      <Label htmlFor="usd-pay" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                         <RadioGroupItem value="USD" id="usd-pay" className="sr-only peer" />
                         $
                      </Label>
                    </RadioGroup>
                </div>
                 <div>
                    <Label className="text-sm font-medium mb-2 block">Dar Vuelto en</Label>
                    <RadioGroup 
                        value={changeCurrency}
                        className="grid grid-cols-2 gap-2"
                        onValueChange={(value: Currency) => setChangeCurrency(value)}
                        disabled={disabled}
                    >
                      <Label htmlFor="nio-change" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                         <RadioGroupItem value="NIO" id="nio-change" className="sr-only peer" />
                         C$
                      </Label>
                      <Label htmlFor="usd-change" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                         <RadioGroupItem value="USD" id="usd-change" className="sr-only peer" />
                         $
                      </Label>
                    </RadioGroup>
                </div>
            </div>
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
