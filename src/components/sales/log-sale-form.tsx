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
  productId: z.string().min(1, { message: "Por favor, selecciona un producto." }),
  quantity: z.coerce.number().min(1, { message: "La cantidad debe ser al menos 1." }),
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
        description: `Producto no encontrado.`,
      })
      return;
    }
    
    if (product.quantity < values.quantity) {
       toast({
        variant: "destructive",
        title: "Stock insuficiente",
        description: `Solo hay ${product.quantity} de ${product.name} disponibles.`,
      })
      return;
    }

    onSaleLogged(values);

    toast({
      title: "Venta Registrada",
      description: `Se vendieron ${values.quantity} de ${product.name}.`,
    })
    form.reset()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Nueva Venta</CardTitle>
        <CardDescription>Selecciona un producto y cantidad para registrar una transacción.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Producto</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id} disabled={product.quantity === 0}>
                          {product.name} ({product.quantity} en stock)
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
                  <FormLabel>Cantidad</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Registrar Venta</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
