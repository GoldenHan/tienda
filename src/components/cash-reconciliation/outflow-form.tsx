
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
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import type { CashOutflow, Currency } from "@/lib/types";

const formSchema = z.object({
  amount: z.coerce.number().min(0.01, "La cantidad debe ser mayor que cero."),
  reason: z.string().min(3, "El motivo es requerido (mín. 3 caracteres)."),
  currency: z.enum(["NIO", "USD"], { required_error: "Debes seleccionar una moneda." }),
  cashBox: z.enum(["general", "petty"], { required_error: "Debes seleccionar una caja." }),
});

type OutflowFormData = z.infer<typeof formSchema>;

interface Balances {
    pettyNio: number;
    pettyUsd: number;
    mainNio: number;
    mainUsd: number;
}
interface OutflowFormProps {
  onOutflowAdded: (newOutflow: CashOutflow) => void;
  date: Date;
  balances: Balances;
}

export function OutflowForm({ onOutflowAdded, date, balances }: OutflowFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OutflowFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      reason: "",
      currency: "NIO",
      cashBox: "petty",
    },
  });
  
  const formatCurrency = (amount: number, currency: Currency) =>
    new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: currency,
    }).format(amount);

  const handleFormSubmit = async (data: OutflowFormData) => {
    if (!user) return;

    // --- Balance Validation ---
    const { amount, currency, cashBox } = data;
    let hasSufficientFunds = false;
    let availableBalance = 0;

    if (cashBox === 'petty') {
        availableBalance = currency === 'NIO' ? balances.pettyNio : balances.pettyUsd;
    } else { // general
        availableBalance = currency === 'NIO' ? balances.mainNio : balances.mainUsd;
    }
    
    hasSufficientFunds = amount <= availableBalance;

    if (!hasSufficientFunds) {
        toast({
            variant: "destructive",
            title: "Fondos Insuficientes",
            description: `No se puede registrar el egreso. Saldo disponible en ${cashBox === 'petty' ? 'Caja Chica' : 'Caja General'} (${currency}): ${formatCurrency(availableBalance, currency)}.`,
        });
        return;
    }
    // --- End Validation ---

    setIsSubmitting(true);
    try {
      const newOutflowData: Omit<CashOutflow, 'id'> = {
        date: date.toISOString(),
        amount: data.amount,
        reason: data.reason,
        currency: data.currency,
        cashBox: data.cashBox,
        type: 'manual',
      };
      const outflowId = await addCashOutflow(newOutflowData, user.uid);
      toast({
        title: "Egreso Registrado",
        description: `Se registró una salida de ${formatCurrency(data.amount, data.currency)} de la caja ${data.cashBox === 'general' ? 'General' : 'Chica'}.`,
      });
      form.reset();
      onOutflowAdded({ ...newOutflowData, id: outflowId });
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
            name="cashBox"
            render={({ field }) => (
                <FormItem className="space-y-3">
                <FormLabel>Caja de Origen</FormLabel>
                <FormControl>
                    <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                    disabled={isSubmitting}
                    >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="petty" /></FormControl>
                        <FormLabel className="font-normal">Caja Chica</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="general" /></FormControl>
                        <FormLabel className="font-normal">Caja General</FormLabel>
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
                <FormLabel>Moneda del Egreso</FormLabel>
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
        name="amount"
        render={({ field }) => (
            <FormItem>
            <FormLabel>Monto</FormLabel>
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
