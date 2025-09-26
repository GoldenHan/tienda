
"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { addInflow } from "@/lib/firestore-helpers";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { useAuth } from "@/context/auth-context";
import { Currency } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

const formSchema = z.object({
  total: z.coerce.number().min(0.01, "La cantidad debe ser mayor que cero."),
  reason: z.string().min(3, "El motivo es requerido (mín. 3 caracteres)."),
  currency: z.enum(["NIO", "USD"], { required_error: "Debes seleccionar una moneda." }),
  cashBox: z.enum(["general", "petty"], { required_error: "Debes seleccionar una caja." }),
});

type InflowFormData = z.infer<typeof formSchema>;

interface InflowFormProps {
  onInflowAdded: () => void;
  date: Date;
}

export function InflowForm({ onInflowAdded, date }: InflowFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InflowFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      total: 0,
      reason: "",
      currency: "NIO",
      cashBox: "general",
    },
  });

  const handleFormSubmit = async (data: InflowFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const newInflow = {
        date: date.toISOString(),
        total: data.total,
        reason: data.reason,
        currency: data.currency,
        cashBox: data.cashBox,
      };
      await addInflow(newInflow, user.uid);
      toast({
        title: "Ingreso Registrado",
        description: `Se registró un ingreso de ${data.currency === 'USD' ? '$' : 'C$'}${data.total} en la caja ${data.cashBox === 'general' ? 'General' : 'Chica'}.`,
      });
      form.reset();
      onInflowAdded();
    } catch (error) {
      console.error("Error al registrar ingreso:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo registrar el ingreso.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
         <FormField
            control={form.control}
            name="cashBox"
            render={({ field }) => (
                <FormItem className="space-y-3">
                <FormLabel>Caja de Destino</FormLabel>
                <FormControl>
                    <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                    disabled={isSubmitting}
                    >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="general" /></FormControl>
                        <FormLabel className="font-normal">Caja General</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="petty" /></FormControl>
                        <FormLabel className="font-normal">Caja Chica</FormLabel>
                    </FormItem>
                    </RadioGroup>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
                <FormItem className="space-y-3">
                <FormLabel>Moneda del Ingreso</FormLabel>
                <FormControl>
                    <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                    disabled={isSubmitting}
                    >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="NIO" /></FormControl>
                        <FormLabel className="font-normal">Córdobas (C$)</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="USD" /></FormControl>
                        <FormLabel className="font-normal">Dólares ($)</FormLabel>
                    </FormItem>
                    </RadioGroup>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
        control={form.control}
        name="total"
        render={({ field }) => (
            <FormItem>
            <FormLabel>Monto</FormLabel>
            <FormControl>
                <Input type="number" step="0.01" placeholder="Ej. 500.00" {...field} disabled={isSubmitting} />
            </FormControl>
            <FormMessage />
            </FormItem>
        )}
        />
        <FormField
        control={form.control}
        name="reason"
        render={({ field }) => (
            <FormItem>
            <FormLabel>Motivo del Ingreso</FormLabel>
            <FormControl>
                <Textarea placeholder="Ej. Aporte de capital para caja chica" {...field} disabled={isSubmitting} />
            </FormControl>
            <FormMessage />
            </FormItem>
        )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : "Registrar Ingreso"}
        </Button>
    </form>
    </Form>
  );
}

    