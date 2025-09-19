
"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { addCashOutflow } from "@/lib/firestore-helpers";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { useAuth } from "@/context/auth-context";

const formSchema = z.object({
  amount: z.coerce.number().min(0.01, "La cantidad debe ser mayor que cero."),
  reason: z.string().min(3, "El motivo es requerido (mín. 3 caracteres)."),
});

type OutflowFormData = z.infer<typeof formSchema>;

interface OutflowFormProps {
  onOutflowAdded: () => void;
  date: Date;
}

export function OutflowForm({ onOutflowAdded, date }: OutflowFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OutflowFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      reason: "",
    },
  });

  const handleFormSubmit = async (data: OutflowFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const newOutflow = {
        date: date.toISOString(),
        amount: data.amount,
        reason: data.reason,
      };
      await addCashOutflow(newOutflow, user.uid);
      toast({
        title: "Egreso Registrado",
        description: `Se registró una salida de C$${data.amount}.`,
      });
      form.reset();
      onOutflowAdded();
    } catch (error) {
      console.error("Error al registrar egreso:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo registrar el egreso.",
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
        name="amount"
        render={({ field }) => (
            <FormItem>
            <FormLabel>Monto (C$)</FormLabel>
            <FormControl>
                <Input type="number" step="0.01" placeholder="Ej. 150.50" {...field} disabled={isSubmitting} />
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
            <FormLabel>Motivo del Egreso</FormLabel>
            <FormControl>
                <Textarea placeholder="Ej. Compra de agua para la oficina" {...field} disabled={isSubmitting} />
            </FormControl>
            <FormMessage />
            </FormItem>
        )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : "Registrar Egreso"}
        </Button>
    </form>
    </Form>
  );
}
