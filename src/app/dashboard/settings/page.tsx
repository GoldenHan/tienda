
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Unlock, Trash2, PlusCircle, UploadCloud } from "lucide-react";
import { Label } from "@/components/ui/label";
import { getClosedReconciliations, getCategories, getCompany, getCompanyIdForUser } from "@/lib/firestore-helpers";
import { updateCompanySettings, addCategory, updateReconciliationStatus, deleteCategory } from "@/lib/actions/setup";
import { uploadFileToStorage } from "@/lib/storage-helpers";
import { Reconciliation, Category, Company } from "@/lib/types";
import { format as formatDateFns, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "La contraseña actual es requerida." }),
  newPassword: z.string().min(6, { message: "La nueva contraseña debe tener al menos 6 caracteres." }),
});

const categoryFormSchema = z.object({
  newCategoryName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
});

const companySettingsSchema = z.object({
    name: z.string().min(2, "El nombre de la empresa es requerido."),
    exchangeRate: z.coerce.number().min(0, "La tasa de cambio debe ser un número positivo."),
    pettyCashInitial: z.coerce.number().min(0, "El fondo inicial debe ser un número positivo."),
});

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [closedReconciliations, setClosedReconciliations] = useState<Reconciliation[]>([]);
  const [isReconLoading, setIsReconLoading] = useState(true);
  const [isReopening, setIsReopening] = useState<string | null>(null);

  const [company, setCompany] = useState<Company | null>(null);
  const [isCompanyLoading, setIsCompanyLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState<string|null>(null);

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'primary-admin';

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const categoryForm = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { newCategoryName: "" },
  });
  
  const companySettingsForm = useForm<z.infer<typeof companySettingsSchema>>({
    resolver: zodResolver(companySettingsSchema),
  });
  
  const { reset: resetCompanyForm } = companySettingsForm;

  const fetchPageData = useCallback(async () => {
    if (!user || !isAdmin) {
        setIsReconLoading(false);
        setIsCategoryLoading(false);
        setIsCompanyLoading(false);
        return;
    };

    setIsReconLoading(true);
    setIsCategoryLoading(true);
    setIsCompanyLoading(true);
    try {
      const [closedData, categoriesData, companyData] = await Promise.all([
        getClosedReconciliations(user.uid),
        getCategories(user.uid),
        getCompany(user.uid),
      ]);
      setClosedReconciliations(closedData);
      setCategories(categoriesData);
      setCompany(companyData);
      if (companyData) {
        resetCompanyForm({
            name: companyData.name || "",
            exchangeRate: companyData.exchangeRate || 36.5,
            pettyCashInitial: companyData.pettyCashInitial || 0,
        });
        setPreviewUrl(companyData.logoUrl || null);
      }
    } catch (error) {
      console.error("Error fetching admin settings page data:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los datos de configuración." });
    } finally {
      setIsReconLoading(false);
      setIsCategoryLoading(false);
      setIsCompanyLoading(false);
    }
  }, [toast, user, isAdmin, resetCompanyForm]);


  useEffect(() => {
    if (user) {
        fetchPageData();
    }
  }, [user, fetchPageData]);

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

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

   async function onCompanySettingsSubmit(values: z.infer<typeof companySettingsSchema>) {
    if (!user) return;
    companySettingsForm.formState.isSubmitting;
    try {
      let logoUrl = company?.logoUrl || "";

      if (logoFile) {
        const companyId = await getCompanyIdForUser(user.uid);
        const path = `companies/${companyId}/logos`;
        logoUrl = await uploadFileToStorage(logoFile, path);
        toast({ title: "Logo Actualizado", description: "El nuevo logo ha sido subido." });
      }

      await updateCompanySettings({ ...values, logoUrl }, user.uid);
      
      toast({
        title: "Configuración Guardada",
        description: `La configuración de la empresa ha sido actualizada.`,
      });
      // Refetch data to show updates everywhere
      await fetchPageData();
    } catch (error: any) {
      console.error("Error updating company settings:", error);
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo guardar la configuración." });
    } finally {
       companySettingsForm.formState.isSubmitting;
    }
  }

  const handleReopenReconciliation = async (dateId: string) => {
    if (!user) return;
    setIsReopening(dateId);
    try {
        await updateReconciliationStatus(dateId, 'open', user.uid);
        toast({
            title: "Arqueo Reabierto",
            description: `El arqueo del día ${dateId} ahora puede ser editado.`,
        });
        await fetchPageData(); // Refresh list
    } catch (error) {
        console.error("Error reopening reconciliation:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo reabrir el arqueo." });
    } finally {
        setIsReopening(null);
    }
  };

  async function onCategorySubmit(values: z.infer<typeof categoryFormSchema>) {
    if (!user) return;
    setIsCategorySubmitting(true);
    try {
      await addCategory(values.newCategoryName, user.uid);
      toast({
        title: "Categoría Creada",
        description: `Se ha añadido la categoría "${values.newCategoryName}".`,
      });
      categoryForm.reset();
      await fetchPageData();
    } catch (error) {
      console.error("Error adding category:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo añadir la categoría." });
    } finally {
      setIsCategorySubmitting(false);
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    if (!user) return;
    setIsDeletingCategory(category.id);
    try {
      await deleteCategory(category.id, user.uid);
      toast({
        title: "Categoría Eliminada",
        description: `Se ha eliminado la categoría "${category.name}". Los productos asociados ya no tendrán categoría.`,
      });
      await fetchPageData();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la categoría." });
    } finally {
      setIsDeletingCategory(null);
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
        <Card className={isAdmin ? '' : 'md:col-span-2'}>
          <CardHeader>
            <CardTitle>Mi Cuenta</CardTitle>
            <CardDescription>Actualiza tu contraseña. Se recomienda cambiar la contraseña temporal asignada.</CardDescription>
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

        {isAdmin && (
            <>
                <Card>
                    <CardHeader>
                        <CardTitle>Configuración de la Empresa</CardTitle>
                        <CardDescription>
                            Define parámetros globales para tu negocio.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isCompanyLoading ? <Skeleton className="h-40 w-full"/> : (
                           <Form {...companySettingsForm}>
                            <form onSubmit={companySettingsForm.handleSubmit(onCompanySettingsSubmit)} className="space-y-6">
                                <FormItem>
                                  <FormLabel>Logo de la Empresa</FormLabel>
                                  <div className="flex items-center gap-4">
                                      <div className="relative w-24 h-24 rounded-full border flex items-center justify-center bg-muted">
                                        {previewUrl ? (
                                            <Image src={previewUrl} alt="Logo" fill className="object-cover rounded-full" />
                                        ) : (
                                            <UploadCloud className="w-8 h-8 text-muted-foreground" />
                                        )}
                                      </div>
                                      <Input id="logo-upload" type="file" accept="image/png, image/jpeg, image/webp" onChange={handleLogoChange} className="max-w-xs"/>
                                  </div>
                                </FormItem>

                                <FormField
                                control={companySettingsForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Nombre de la Empresa</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />

                                <FormField
                                control={companySettingsForm.control}
                                name="exchangeRate"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Tasa de Cambio (1 USD a NIO)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={companySettingsForm.control}
                                name="pettyCashInitial"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Fondo Inicial de Caja Chica (C$)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="1" {...field} />
                                    </FormControl>
                                    <FormDescription>El monto base para gastos menores diarios.</FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <Button type="submit" disabled={companySettingsForm.formState.isSubmitting}>
                                    {companySettingsForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Guardar Configuración"}
                                </Button>
                            </form>
                           </Form>
                        )}
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

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Gestionar Categorías de Productos</CardTitle>
                        <CardDescription>
                        Crea y elimina categorías para organizar tus productos en el punto de venta.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                            <Form {...categoryForm}>
                                <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                                <FormField
                                    control={categoryForm.control}
                                    name="newCategoryName"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Nueva Categoría</FormLabel>
                                        <FormControl>
                                        <div className="flex gap-2">
                                            <Input placeholder="Ej. Bebidas" {...field} disabled={isCategorySubmitting} />
                                            <Button type="submit" disabled={isCategorySubmitting}>
                                                {isCategorySubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle />}
                                            </Button>
                                        </div>
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                </form>
                            </Form>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Categorías Existentes</h4>
                                {isCategoryLoading ? (
                                <div className="space-y-2">
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                ) : categories.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4 border rounded-md">
                                        No hay categorías creadas.
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {categories.map(cat => (
                                            <li key={cat.id} className="flex items-center justify-between p-2 border rounded-md">
                                                <span className="font-medium">{cat.name}</span>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={isDeletingCategory === cat.id}>
                                                            {isDeletingCategory === cat.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Eliminar la categoría "{cat.name}"?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción no se puede deshacer. Los productos de esta categoría perderán su asignación, pero no serán eliminados.
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteCategory(cat)}>
                                                            Confirmar Eliminación
                                                        </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </>
        )}
      </main>
    </div>
  );
}

    