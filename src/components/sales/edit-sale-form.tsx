
"use client";

import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sale, Product } from "@/lib/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const saleItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.coerce.number().min(0, "La cantidad no puede ser negativa."),
  salePrice: z.number(),
});

const formSchema = z.object({
  items: z.array(saleItemSchema),
});

type EditSaleFormData = z.infer<typeof formSchema>;

interface EditSaleFormProps {
  sale: Sale;
  products: Product[];
  onSubmit: (updatedSale: Sale, originalSale: Sale) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export function EditSaleForm({ sale, products, onSubmit, onClose, isSubmitting }: EditSaleFormProps) {
  const { toast } = useToast();
  const form = useForm<EditSaleFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: sale.items.map(item => ({...item})),
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleFormSubmit = (data: EditSaleFormData) => {
    // Check if stock is sufficient for any increased quantities
    let stockError = false;
    data.items.forEach((editedItem) => {
      const originalItem = sale.items.find(i => i.productId === editedItem.productId);
      const productInStock = products.find(p => p.id === editedItem.productId);
      
      const originalQuantity = originalItem ? originalItem.quantity : 0;
      const quantityChange = editedItem.quantity - originalQuantity; // Positive if quantity increased

      // The available stock is the current stock in the DB plus what was in the original sale
      const availableStock = (productInStock?.quantity ?? 0) + originalQuantity;

      if (editedItem.quantity > availableStock) {
        toast({
          variant: "destructive",
          title: "Stock Insuficiente",
          description: `No puedes aumentar la cantidad de "${editedItem.productName}". Solo hay ${availableStock} unidades en total disponibles.`,
        });
        stockError = true;
      }
    });

    if (stockError) return;

    const updatedItems = data.items
      .filter(item => item.quantity > 0) // Remove items with quantity 0
      .map(item => ({
        ...item,
        total: item.quantity * item.salePrice
    }));
    
    const updatedSale: Sale = {
      ...sale,
      items: updatedItems,
      grandTotal: updatedItems.reduce((acc, item) => acc + item.total, 0),
    };
    
    onSubmit(updatedSale, sale);
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="space-y-4 max-h-96 overflow-y-auto p-1">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-4 p-4 border rounded-lg">
              <div className="flex-1 space-y-2">
                <p className="font-semibold">{field.productName}</p>
                 <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} disabled={isSubmitting}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
              <Button 
                type="button" 
                variant="destructive" 
                size="icon" 
                onClick={() => {
                  form.setValue(`items.${index}.quantity`, 0);
                  toast({
                    description: `"${field.productName}" se eliminará al guardar.`,
                  });
                }}
                disabled={isSubmitting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin mr-2" />}
              Guardar Cambios
            </Button>
        </div>
      </form>
    </Form>
  );
}
