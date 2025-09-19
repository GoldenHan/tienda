
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

const formSchema = z.object({
  total: z.coerce.number().min(0.01, "La cantidad debe ser mayor que cero."),
  reason: z.string().min(3, "El motivo es requerido (mín. 3 caracteres)."),
});

type InflowFormData = z.infer<typeof formSchema>;

interface InflowFormProps {
  onInflowAdded: () => void;
  date: Date;
}

export function InflowForm({ onInflowAdded, date }: InflowFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InflowFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      total: 0,
      reason: "",
    },
  });

  const handleFormSubmit = async (data: InflowFormData) => {
    setIsSubmitting(true);
    try {
      const newInflow = {
        date: date.toISOString(),
        total: data.total,
        reason: data.reason,
      };
      await addInflow(newInflow);
      toast({
        title: "Ingreso Registrado",
        description: `Se registró un ingreso de C$${data.total}.`,
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
        name="total"
        render={({ field }) => (
            <FormItem>
            <FormLabel>Monto (C$)</FormLabel>
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
                <Textarea placeholder="Ej. Aporte de capital" {...field} disabled={isSubmitting} />
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
