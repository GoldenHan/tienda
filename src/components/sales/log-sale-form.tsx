"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Product } from "@/lib/types"

const formSchema = z.object({
  productId: z.string().min(1, { message: "Please select a product." }),
  quantity: z.coerce.number().min(1, { message: "Quantity must be at least 1." }),
})

interface LogSaleFormProps {
  products: Product[];
  onSaleLogged: (data: { productId: string; quantity: number }) => void;
}

export function LogSaleForm({ products, onSaleLogged }: LogSaleFormProps) {
  const { toast } = useToast()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const product = products.find(p => p.id === values.productId)
    if (!product) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Product not found.`,
      })
      return;
    }
    
    if (product.quantity < values.quantity) {
       toast({
        variant: "destructive",
        title: "Not enough stock",
        description: `Only ${product.quantity} of ${product.name} available.`,
      })
      return;
    }

    onSaleLogged(values);

    toast({
      title: "Sale Logged",
      description: `Sold ${values.quantity} of ${product.name}.`,
    })
    form.reset()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log a New Sale</CardTitle>
        <CardDescription>Select a product and quantity to record a transaction.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id} disabled={product.quantity === 0}>
                          {product.name} ({product.quantity} in stock)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Log Sale</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
