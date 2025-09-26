
"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { addCashTransfer } from "@/lib/actions/setup";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const formSchema = z.object({
  amount: z.coerce.number().min(0.01, "La cantidad debe ser mayor que cero."),
  currency: z.enum(["NIO", "USD"], { required_error: "Debes seleccionar una moneda." }),
  fromBox: z.enum(["general", "petty"], { required_error: "Debes seleccionar una caja de origen." }),
  toBox: z.enum(["general", "petty"], { required_error: "Debes seleccionar una caja de destino." }),
  reason: z.string().min(3, "El motivo es requerido.").max(50, "El motivo es muy largo."),
}).refine(data => data.fromBox !== data.toBox, {
  message: "La caja de origen y destino no pueden ser la misma.",
  path: ["toBox"],
});


type TransferFormData = z.infer<typeof formSchema>;

interface CashTransferFormProps {
  onTransferAdded: () => void;
  date: Date;
}

export function CashTransferForm({ onTransferAdded, date }: CashTransferFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TransferFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      currency: "NIO",
      fromBox: "general",
      toBox: "petty",
      reason: "Reposición de fondos",
    },
  });

  const handleFormSubmit = async (data: TransferFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const newTransfer = {
        date: date.toISOString(),
        amount: data.amount,
        currency: data.currency,
        fromBox: data.fromBox,
        toBox: data.toBox,
        reason: data.reason,
      };
      await addCashTransfer(newTransfer, user.uid);
      toast({
        title: "Transferencia Registrada",
        description: `Se movió ${data.currency === 'USD' ? '$' : 'C$'}${data.amount} correctamente.`,
      });
      form.reset();
      onTransferAdded();
    } catch (error) {
      console.error("Error al registrar transferencia:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo registrar la transferencia.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 pt-4">
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="fromBox"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Desde</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="general">Caja General</SelectItem>
                            <SelectItem value="petty">Caja Chica</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="toBox"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Hacia</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="general">Caja General</SelectItem>
                            <SelectItem value="petty">Caja Chica</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
                <FormItem className="space-y-3">
                <FormLabel>Moneda</FormLabel>
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
            <FormLabel>Monto a Transferir</FormLabel>
            <FormControl>
                <Input type="number" step="0.01" placeholder="Ej. 1000.00" {...field} disabled={isSubmitting} />
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
                <FormLabel>Motivo</FormLabel>
                <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                </FormControl>
                 <FormDescription>Ej: Reposición de fondos, depósito, etc.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmar Transferencia"}
        </Button>
    </form>
    </Form>
  );
}

    