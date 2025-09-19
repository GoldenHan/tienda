
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, writeBatch, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

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
import { Loader2 } from "lucide-react";
import { Warehouse } from "@/components/icons";

const formSchema = z.object({
  companyName: z.string().min(2, { message: "El nombre de la empresa debe tener al menos 2 caracteres." }),
  adminName: z.string().min(2, { message: "Tu nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce un email válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
     if (!auth || !db) {
      toast({ variant: "destructive", title: "Error de configuración", description: "Firebase no está inicializado." });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const adminUser = userCredential.user;
      
      const batch = writeBatch(db);

      // 2. Create the new company document with a unique ID
      const companyDocRef = doc(collection(db, "companies"));
      batch.set(companyDocRef, {
          name: values.companyName,
          adminUid: adminUser.uid,
          createdAt: serverTimestamp(),
      });

      // 3. Create the user document in the root /users collection
      // This is the source of truth for roles and company association, used by security rules.
      const userDocRef = doc(db, "users", adminUser.uid);
      batch.set(userDocRef, {
          uid: adminUser.uid,
          email: values.email,
          name: values.adminName,
          role: "admin", // The first user is always an admin
          companyId: companyDocRef.id,
          createdAt: serverTimestamp(),
      });
      
      // Commit the batch transaction
      await batch.commit();
      
      toast({
        title: "¡Registro Completo!",
        description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
      });
      
      router.push("/login");

    } catch (error: any) {
      console.error("Error en el registro:", error);
      let errorMessage = "No se pudo completar el registro. Inténtalo de nuevo.";
      if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Este correo electrónico ya está registrado. Por favor, inicia sesión.';
      } else if (error.code === 'permission-denied') {
          errorMessage = 'Error de permisos. Revisa las reglas de seguridad de Firestore.';
      }
      toast({
        variant: "destructive",
        title: "Error en el Registro",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
           <div className="mb-4 flex justify-center">
            <Warehouse className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Crear tu Cuenta</CardTitle>
          <CardDescription>
            Registra tu negocio y tu cuenta de administrador.
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
                    <FormControl>
                      <Input placeholder="Ej. Mi Tienda Increíble" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="adminName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tu Nombre (Administrador)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tu Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@email.com" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Crear Cuenta"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="underline">
              Inicia Sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
