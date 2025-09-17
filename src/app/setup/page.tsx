
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/auth-context";
import { createCompanyAndAdmin } from "@/app/setup/actions";
import { auth } from "@/lib/firebase";

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
import { Skeleton } from "@/components/ui/skeleton";


const formSchema = z.object({
  companyName: z.string().min(2, { message: "El nombre de la empresa debe tener al menos 2 caracteres." }),
});

export default function SetupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If user is loaded and already has a company, redirect them.
    if (!loading && user?.companyId) {
      router.replace("/dashboard");
    }
    // If user is loaded and not authenticated, send to login
    if (!loading && !user) {
        router.replace('/login');
    }
  }, [user, loading, router]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !user.email) {
        toast({ variant: "destructive", title: "Error", description: "Debes estar autenticado." });
        return;
    }

    setIsSubmitting(true);
    try {
      const result = await createCompanyAndAdmin({
          companyName: values.companyName,
          adminUid: user.uid,
          adminName: user.name || "Admin",
          adminEmail: user.email
      });

      if (result.error) {
        throw new Error(result.error);
      }
      
      toast({
        title: "¡Empresa Configurada!",
        description: "Tu negocio está listo. Redirigiendo al panel de control...",
      });
      // Force a reload of user data to get new companyId and role
      if (auth?.currentUser) {
        await auth.currentUser.getIdToken(true); 
      }
      router.push("/dashboard");

    } catch (error: any) {
      console.error("Error al configurar la empresa:", error);
      toast({
        variant: "destructive",
        title: "Error en la configuración",
        description: error.message || "No se pudo crear la empresa.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading || !user) {
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
