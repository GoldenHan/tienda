
"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { addWithdrawal } from "@/lib/actions/setup";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import type { CashOutflow, Currency } from "@/lib/types";
import { Textarea } from "../ui/textarea";

const formSchema = z.object({
  amount: z.coerce.number().min(0.01, "La cantidad debe ser mayor que cero."),
  reason: z.string().min(3, "El motivo es requerido (mín. 3 caracteres)."),
});

type WithdrawalFormData = z.infer<typeof formSchema>;

interface WithdrawalFormProps {
  onWithdrawalAdded: (newOutflow: CashOutflow) => void;
  date: Date;
  mainNioBalance: number;
}

export function WithdrawalForm({ onWithdrawalAdded, date, mainNioBalance }: WithdrawalFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      reason: "Retiro de ganancias",
    },
  });
  
  const formatCurrency = (amount: number, currency: Currency) =>
    new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: currency,
    }).format(amount);

  const handleFormSubmit = async (data: WithdrawalFormData) => {
    if (!user) return;

    if (data.amount > mainNioBalance) {
        toast({
            variant: "destructive",
            title: "Fondos Insuficientes",
            description: `No se puede retirar. Saldo disponible en Caja General (C$): ${formatCurrency(mainNioBalance, 'NIO')}.`,
        });
        return;
    }

    setIsSubmitting(true);
    try {
      const withdrawalData: Omit<CashOutflow, 'id' | 'type'> & {type: 'withdrawal'} = {
        date: date.toISOString(),
        amount: data.amount,
        reason: data.reason,
        currency: 'NIO', // Withdrawals are always in NIO from general box
        cashBox: 'general',
        type: 'withdrawal',
      };
      const outflowId = await addWithdrawal(withdrawalData, user.uid);
      toast({
        title: "Retiro Registrado",
        description: `Se registró un retiro de ${formatCurrency(data.amount, 'NIO')}.`,
      });
      form.reset();
      onWithdrawalAdded({ ...withdrawalData, id: outflowId });
    } catch (error) {
      console.error("Error al registrar retiro:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo registrar el retiro.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 pt-4">
        <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
            <FormItem>
            <FormLabel>Monto a Retirar (C$)</FormLabel>
            <FormControl>
                <Input type="number" step="0.01" placeholder="Ej. 10000.00" {...field} disabled={isSubmitting} />
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
            <FormLabel>Motivo del Retiro</FormLabel>
            <FormControl>
                <Textarea placeholder="Ej. Retiro de ganancias semanales, pago de sueldo, etc." {...field} disabled={isSubmitting} />
            </FormControl>
            <FormMessage />
            </FormItem>
        )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmar Retiro"}
        </Button>
    </form>
    </Form>
  );
}
