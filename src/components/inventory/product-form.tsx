"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Product } from "@/lib/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  imageUrl: z.string().url("Debe ser una URL válida"),
  quantity: z.coerce.number().int().min(0, "La cantidad debe ser un número entero"),
  salePrice: z.coerce.number().min(0, "El precio de venta debe ser positivo"),
});

// We create a new type that only includes the fields we want to edit.
// This makes the form more focused.
type ProductFormData = z.infer<typeof formSchema>;

interface ProductFormProps {
  // We accept the full Product type for default values
  product?: Product;
  // The onSubmit function receives only the data from the form
  onSubmit: (data: ProductFormData) => void;
}

export function ProductForm({ product, onSubmit }: ProductFormProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(formSchema),
    // We map the full product to the form data, providing defaults
    defaultValues: {
      name: product?.name || "",
      imageUrl: product?.imageUrl || "",
      quantity: product?.quantity || 0,
      salePrice: product?.salePrice || 0,
    },
  });

  // The submit handler now correctly uses the form's data type
  const handleFormSubmit = (data: ProductFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Producto</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Taza Artesanal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de la Imagen</FormLabel>
              <FormControl>
                <Input placeholder="https://ejemplo.com/imagen.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad en Stock</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio de Venta (C$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full">
          {product ? "Guardar Cambios" : "Añadir Producto"}
        </Button>
      </form>
    </Form>
  );
}
