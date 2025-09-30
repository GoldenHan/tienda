
"use client";

import { useState, useMemo } from 'react';
import { Product, Currency } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type CartItem = {
    product: Product;
    quantity: number;
    unit: string;
    totalPrice: number;
};

interface QuantityDialogProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(amount);

// Conversion factors relative to a base unit (e.g., lb)
const conversionFactors: Record<string, Record<string, number>> = {
  lb: { lb: 1, oz: 16 },
  kg: { kg: 1, g: 1000, lb: 2.20462 },
  L: { L: 1, ml: 1000 },
  qq: { qq: 1, lb: 100 },
};

export function QuantityDialog({ product, onClose, onAddToCart }: QuantityDialogProps) {
  const [quantity, setQuantity] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(product.stockingUnit);
  const { toast } = useToast();

  const handleQuickAdd = (amount: number, unit: string) => {
    const salePricePerStockingUnit = product.salePrice;
    
    // Convert the sold amount back to the base stocking unit for inventory deduction
    const factor = conversionFactors[product.stockingUnit]?.[unit] ?? 1;
    const quantityInStockingUnit = amount / factor;

    if (quantityInStockingUnit > product.quantity) {
        toast({ variant: "destructive", title: "Stock insuficiente" });
        return;
    }
    
    const totalPrice = salePricePerStockingUnit * quantityInStockingUnit;

    onAddToCart({
        product,
        quantity: quantityInStockingUnit,
        unit: `${amount} ${unit}`,
        totalPrice,
    });
  };
  
  const handleCustomAdd = () => {
    const customQuantity = parseFloat(quantity);
    if (isNaN(customQuantity) || customQuantity <= 0) {
        toast({ variant: "destructive", title: "Cantidad no válida" });
        return;
    }
    handleQuickAdd(customQuantity, selectedUnit);
  };
  
  const renderContent = () => {
    switch(product.stockingUnit) {
        case 'lb':
        case 'qq': // Quintal is based on lb
            return (
                <>
                 <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => handleQuickAdd(0.5, 'lb')}>1/2 lb</Button>
                    <Button variant="outline" onClick={() => handleQuickAdd(1, 'lb')}>1 lb</Button>
                </div>
                <div className="flex items-center gap-2">
                    <Input 
                        type="number"
                        placeholder="Escribe onzas (ej. 4)"
                        onChange={(e) => setQuantity(e.target.value)}
                        className="text-center"
                    />
                    <Button onClick={() => handleCustomAdd()} className="w-full">Añadir Onzas</Button>
                </div>
                </>
            );
        case 'L':
            return (
                 <>
                 <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" onClick={() => handleQuickAdd(0.25, 'L')}>1/4 L</Button>
                    <Button variant="outline" onClick={() => handleQuickAdd(0.5, 'L')}>1/2 L</Button>
                    <Button variant="outline" onClick={() => handleQuickAdd(1, 'L')}>1 L</Button>
                </div>
                 <div className="flex items-center gap-2">
                    <Input 
                        type="number"
                        placeholder="Escribe litros (ej. 1.5)"
                        onChange={(e) => setQuantity(e.target.value)}
                        className="text-center"
                    />
                    <Button onClick={() => handleCustomAdd()} className="w-full">Añadir Litros</Button>
                </div>
                </>
            );
        default:
            return (
                <div className="flex items-center gap-2">
                    <Input 
                        type="number"
                        placeholder={`Escribe cantidad en ${product.stockingUnit}`}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="text-center"
                    />
                    <Button onClick={() => handleCustomAdd()} className="w-full">Añadir</Button>
                </div>
            );
    }
  }

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vender: {product.name}</DialogTitle>
          <DialogDescription>
            Selecciona la cantidad que deseas vender. Stock disponible: {product.quantity} {product.stockingUnit}.
            Precio base: {formatCurrency(product.salePrice)} / {product.stockingUnit}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
