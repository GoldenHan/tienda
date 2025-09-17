"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/auth-context";
import { createCompanyAndAdmin } from "@/app/setup/actions";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Warehouse } from "lucide-react";
import type { EmployeeData } from "@/lib/types";

const formSchema = z.object({
  companyName: z.string().min(2, { message: "El nombre de la empresa debe tener al menos 2 caracteres." }),
});

export default function SetupPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationData, setRegistrationData] = useState<EmployeeData | null>(null);

  useEffect(() => {
    // If user is loaded and already has a company, redirect them.
    if (!loading && user?.companyId) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem('registrationData');
      if (!storedData) {
        toast({
            variant: 'destructive',
            title: 'Faltan datos de registro',
            description: 'Por favor, comienza desde la página de registro.',
        });
        router.push('/register');
        return;
      }
      setRegistrationData(JSON.parse(storedData));
    } catch (error) {
      console.error("Error reading from sessionStorage", error);
      router.push('/register');
    }
  }, [router, toast]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!registrationData) {
        toast({ variant: "destructive", title: "Error", description: "No se encontraron los datos de registro." });
        return;
    }

    setIsSubmitting(true);
    try {
      const result = await createCompanyAndAdmin({
          companyName: values.companyName,
          adminEmail: registrationData.email,
          adminName: registrationData.name,
          adminPassword: registrationData.password
      });

      if (result.error) {
        throw new Error(result.error);
      }
      
      // Clear the session storage
      sessionStorage.removeItem('registrationData');

      toast({
        title: "¡Registro Completo!",
        description: "Tu negocio está listo. Iniciando sesión...",
      });
      
      // Log the user in with the credentials they just created
      await login(registrationData.email, registrationData.password);

      router.push("/dashboard");

    } catch (error: any) {
      console.error("Error al configurar la empresa:", error);
      let errorMessage = error.message || "No se pudo crear la empresa.";
      if (error.message.includes('auth/email-already-exists')) {
          errorMessage = 'Este correo electrónico ya está registrado. Por favor, inicia sesión.';
      }
      toast({
        variant: "destructive",
        title: "Error en la configuración",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading || !registrationData) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
           <div className="mb-4 flex justify-center">
            <Warehouse className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Configura tu Negocio</CardTitle>
          <CardDescription>
            ¡Ya casi está! Solo dinos el nombre de tu empresa para terminar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Mi Tienda Increíble" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Finalizar Configuración"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
