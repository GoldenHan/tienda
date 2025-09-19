
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Unlock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { getClosedReconciliations, updateReconciliationStatus } from "@/lib/firestore-helpers";
import { Reconciliation } from "@/lib/types";
import { format as formatDateFns, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";


const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "La contraseña actual es requerida." }),
  newPassword: z.string().min(6, { message: "La nueva contraseña debe tener al menos 6 caracteres." }),
});

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [closedReconciliations, setClosedReconciliations] = useState<Reconciliation[]>([]);
  const [isReconLoading, setIsReconLoading] = useState(true);
  const [isReopening, setIsReopening] = useState<string | null>(null);

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const fetchReconciliations = useCallback(async () => {
    setIsReconLoading(true);
    try {
      const closedData = await getClosedReconciliations();
      setClosedReconciliations(closedData);
    } catch (error) {
      console.error("Error fetching closed reconciliations:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los arqueos cerrados." });
    } finally {
      setIsReconLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReconciliations();
  }, [fetchReconciliations]);

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    if (!user || !user.email) {
      toast({ variant: "destructive", title: "Error", description: "No hay ningún usuario conectado." });
      return;
    }

    setIsPasswordLoading(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, values.newPassword);
      
      toast({
        title: "Contraseña Actualizada",
        description: "Tu contraseña ha sido actualizada exitosamente.",
      });
      passwordForm.reset();
    } catch (error: any) {
      console.error("Error al actualizar contraseña:", error);
      toast({
        variant: "destructive",
        title: "Error al Actualizar la Contraseña",
        description: error.code === 'auth/wrong-password' 
          ? "La contraseña actual que ingresaste es incorrecta."
          : "Ocurrió un error. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  }

  const handleReopenReconciliation = async (dateId: string) => {
    setIsReopening(dateId);
    try {
        await updateReconciliationStatus(dateId, 'open');
        toast({
            title: "Arqueo Reabierto",
            description: `El arqueo del día ${dateId} ahora puede ser editado.`,
        });
        await fetchReconciliations(); // Refresh list
    } catch (error) {
        console.error("Error reopening reconciliation:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo reabrir el arqueo." });
    } finally {
        setIsReopening(null);
    }
  };

  return (
    <div className="flex flex-col">
      <header className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Configuración
        </h1>
        <p className="text-muted-foreground">Gestiona la configuración de tu cuenta y de la aplicación.</p>
      </header>
      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cuenta de Administrador</CardTitle>
            <CardDescription>Actualiza tus credenciales de administrador.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" readOnly defaultValue={user?.email || ""} />
                </div>
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña Actual</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isPasswordLoading}>
                  {isPasswordLoading ? <Loader2 className="animate-spin" /> : "Actualizar Contraseña"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Gestión de Arqueos Consolidados</CardTitle>
                <CardDescription>
                Aquí puedes reabrir arqueos cerrados para permitir su edición.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isReconLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : closedReconciliations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No hay arqueos cerrados actualmente.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {closedReconciliations.map(recon => (
                            <li key={recon.id} className="flex items-center justify-between p-2 border rounded-md">
                                <span className="font-medium">
                                    {formatDateFns(parseISO(recon.id), "d 'de' MMMM, yyyy", { locale: es })}
                                </span>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="secondary" size="sm" disabled={isReopening === recon.id}>
                                            {isReopening === recon.id ? (
                                                <Loader2 className="animate-spin mr-2" />
                                            ) : (
                                                <Unlock className="mr-2" />
                                            )}
                                            Reabrir
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>¿Reabrir el arqueo del {formatDateFns(parseISO(recon.id), "d 'de' MMMM", { locale: es })}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción permitirá que se realicen modificaciones en los ingresos y egresos de esta fecha. Podrás volver a cerrarlo más tarde.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleReopenReconciliation(recon.id)}>
                                            Confirmar
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}

