
"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Product } from "@/lib/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Textarea } from "../ui/textarea";
import { adjustStockForLoss } from "@/lib/actions/setup";

const formSchema = z.object({
  lostQuantity: z.coerce.number().min(0.01, "La cantidad debe ser mayor a 0."),
  reason: z.string().min(3, "El motivo es requerido.").max(100, "El motivo es muy largo."),
});

type LossFormData = z.infer<typeof formSchema>;

interface LossAdjustmentFormProps {
  product: Product;
  onClose: () => void;
  onLossAdjusted: () => void;
}

export function LossAdjustmentForm({ product, onClose, onLossAdjusted }: LossAdjustmentFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LossFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lostQuantity: 0,
      reason: "Producto vencido",
    },
  });

  const handleFormSubmit = async (data: LossFormData) => {
    if (!user) return;
    
    if (data.lostQuantity > product.quantity) {
        toast({
            variant: "destructive",
            title: "Cantidad Inválida",
            description: `La cantidad perdida (${data.lostQuantity}) no puede ser mayor que el stock actual (${product.quantity}).`,
        });
        return;
    }

    setIsSubmitting(true);
    try {
      await adjustStockForLoss(product.id, data.lostQuantity, data.reason, user.uid);
      toast({
        title: "Ajuste por Pérdida Registrado",
        description: `Se redujo el stock de "${product.name}" y se registró la pérdida financiera.`,
      });
      onLossAdjusted();
    } catch (error: any) {
      console.error("Error al ajustar por pérdida:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo registrar la pérdida.",
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
            name="lostQuantity"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Cantidad Perdida (en {product.stockingUnit})</FormLabel>
                <FormControl>
                    <Input type="number" step="any" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormDescription>Stock actual: {product.quantity} {product.stockingUnit}</FormDescription>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Motivo de la Pérdida</FormLabel>
                <FormControl>
                    <Textarea placeholder="Ej: Vencido, Dañado por transporte, Robo..." {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmar Pérdida"}
            </Button>
        </div>
    </form>
    </Form>
  );
}
