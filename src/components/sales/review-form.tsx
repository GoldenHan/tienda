
"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  notes: z.string().min(10, "La nota debe tener al menos 10 caracteres.").max(500, "La nota es muy larga."),
});

interface ReviewFormProps {
  onSubmit: (notes: string) => Promise<void>;
  onClose: () => void;
}

export function ReviewForm({ onSubmit, onClose }: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { notes: "" },
  });

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    await onSubmit(data.notes);
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo de la Revisión</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ej: El cliente cambió de opinión sobre un producto después de pagar, se aplicó un descuento incorrecto, etc."
                  {...field}
                  rows={4}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin mr-2" />}
            Marcar y Enviar para Revisión
          </Button>
        </div>
      </form>
    </Form>
  );
}
