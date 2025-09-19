
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isInitialSetupRequired, createInitialAdminUser } from "@/lib/actions/setup";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle } from "lucide-react";
import { Warehouse } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  companyName: z.string().min(2, { message: "El nombre de la empresa es requerido." }),
  adminName: z.string().min(2, { message: "Tu nombre es requerido." }),
  email: z.string().email({ message: "Por favor, introduce un email válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkSetup() {
      try {
        const required = await isInitialSetupRequired();
        setSetupRequired(required);
      } catch (error) {
        console.error("Error checking setup status:", error);
        toast({
            variant: "destructive",
            title: "Error de Verificación",
            description: "No se pudo comprobar el estado de la configuración. Revisa las reglas de Firestore y la conexión."
        });
        // If the check fails (e.g. permission error on a fresh DB), assume setup IS required.
        setSetupRequired(true);
      }
    }
    checkSetup();
  }, [toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      adminName: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await createInitialAdminUser(values);
      toast({
        title: "¡Empresa Registrada!",
        description: "Has creado la cuenta de administrador. Ahora inicia sesión.",
      });
      router.push("/login");
    } catch (error: any) {
      console.error("Error en el registro:", error);
      toast({
        variant: "destructive",
        title: "Error en el Registro",
        description: error.message || "No se pudo completar el registro.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const renderContent = () => {
    if (setupRequired === null) {
      return (
        <div className="space-y-4 p-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2 pt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      );
    }

    if (setupRequired) {
      return (
        <>
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Warehouse className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">Registra tu Empresa</CardTitle>
            <CardDescription>
              Crea la cuenta principal de administrador para empezar a usar la aplicación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Empresa</FormLabel>
                      <FormControl><Input placeholder="Mi Empresa S.A." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="adminName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tu Nombre Completo</FormLabel>
                      <FormControl><Input placeholder="Juan Pérez" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email del Administrador</FormLabel>
                      <FormControl><Input type="email" placeholder="admin@miempresa.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "Crear Empresa y Administrador"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </>
      );
    }

    return (
      <>
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-headline">Registro Deshabilitado</CardTitle>
          <CardDescription>
            La empresa principal para esta aplicación ya ha sido configurada. No se permiten nuevos registros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="underline">
              Inicia Sesión
            </Link>
          </div>
        </CardContent>
      </>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">{renderContent()}</Card>
    </div>
  );
}
