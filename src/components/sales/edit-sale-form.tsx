
"use client";

import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sale, Product } from "@/lib/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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
  onSubmit: (data: Sale) => void;
  onClose: () => void;
}

export function EditSaleForm({ sale, products, onSubmit, onClose }: EditSaleFormProps) {
  const { toast } = useToast();
  const form = useForm<EditSaleFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: sale.items.map(item => ({...item})),
    },
  });

  const { fields, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleFormSubmit = (data: EditSaleFormData) => {
    // Check if stock is sufficient for any increased quantities
    let stockError = false;
    data.items.forEach((editedItem, index) => {
      const originalItem = sale.items.find(i => i.productId === editedItem.productId);
      const productInStock = products.find(p => p.id === editedItem.productId);
      
      const originalQuantity = originalItem ? originalItem.quantity : 0;
      const quantityChange = editedItem.quantity - originalQuantity;

      if (productInStock && quantityChange > productInStock.quantity) {
        toast({
          variant: "destructive",
          title: "Stock Insuficiente",
          description: `No puedes aumentar la cantidad de "${editedItem.productName}". Solo hay ${productInStock.quantity} unidades adicionales disponibles en stock.`,
        });
        stockError = true;
      }
    });

    if (stockError) return;

    const updatedItems = data.items.map(item => ({
      ...item,
      total: item.quantity * item.salePrice
    }));
    
    const updatedSale: Sale = {
      ...sale,
      items: updatedItems,
      grandTotal: updatedItems.reduce((acc, item) => acc + item.total, 0),
    };
    
    onSubmit(updatedSale);
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
                          <Input type="number" {...field} />
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
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar Cambios</Button>
        </div>
      </form>
    </Form>
  );
}
