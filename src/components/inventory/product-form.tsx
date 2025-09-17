"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Product } from "@/lib/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  purchaseCost: z.coerce.number().min(0, "Purchase cost must be positive"),
  salePrice: z.coerce.number().min(0, "Sale price must be positive"),
  quantity: z.coerce.number().int().min(0, "Quantity must be a whole number"),
  lowStockThreshold: z.coerce.number().int().min(0, "Threshold must be a whole number"),
});

type ProductFormData = z.infer<typeof formSchema>;

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => void;
}

export function ProductForm({ product, onSubmit }: ProductFormProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: product || {
      name: "",
      description: "",
      purchaseCost: 0,
      salePrice: 0,
      quantity: 0,
      lowStockThreshold: 0,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Artisan Mug" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="A short description of the product." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchaseCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Cost ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
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
                <FormLabel>Sale Price ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity in Stock</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lowStockThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Low Stock Threshold</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full">
          {product ? "Save Changes" : "Add Product"}
        </Button>
      </form>
    </Form>
  );
}
