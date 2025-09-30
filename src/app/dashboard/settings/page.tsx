
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, GoogleAuthProvider, linkWithPopup } from "firebase/auth";

import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Unlock, Trash2, PlusCircle, UploadCloud, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { getClosedReconciliations, getCategories } from "@/lib/firestore-helpers";
import { updateCompanySettings, addCategory, updateReconciliationStatus, deleteCategory, setCompanySecurityCode, initiateCompanyWipe } from "@/lib/actions/setup";
import { uploadFileToStorage } from "@/lib/storage-helpers";
import { Reconciliation, Category, Company } from "@/lib/types";
import { format as formatDateFns, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription as DialogDescriptionComponent, DialogHeader as DialogHeaderComponent, DialogTitle as DialogTitleComponent } from "@/components/ui/dialog";

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

const securityCodeSchema = z.object({
    password: z.string().min(1, "Tu contraseña es requerida."),
    securityCode: z.string().min(4, "El código debe tener al menos 4 caracteres."),
});

const wipeDataSchema = z.object({
    password: z.string().min(1, "Tu contraseña es requerida."),
    securityCode: z.string().min(1, "El código de seguridad es requerido."),
    confirmationPhrase: z.string().refine(phrase => phrase === 'eliminar todos los datos', {
        message: "La frase de confirmación no coincide."
    }),
});

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [closedReconciliations, setClosedReconciliations] = useState<Reconciliation[]>([]);
  const [isReconLoading, setIsReconLoading] = useState(true);
  const [isReopening, setIsReopening] = useState<string | null>(null);

  const company = user?.company;
  const [isCompanyLoading, setIsCompanyLoading] = useState(true);
  const [isCompanySubmitting, setIsCompanySubmitting] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState<string|null>(null);

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Danger Zone State
  const [isSecurityCodeSubmitting, setIsSecurityCodeSubmitting] = useState(false);
  const [isWipeDialogOpen, setIsWipeDialogOpen] = useState(false);
  const [isWipingData, setIsWipingData] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'primary-admin';
  const isOwner = user?.role === 'primary-admin';


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
    defaultValues: {
        name: "",
        exchangeRate: 0,
        pettyCashInitial: 0,
    }
  });
  
  const securityCodeForm = useForm<z.infer<typeof securityCodeSchema>>({
    resolver: zodResolver(securityCodeSchema),
    defaultValues: { password: "", securityCode: "" },
  });
  
  const wipeDataForm = useForm<z.infer<typeof wipeDataSchema>>({
    resolver: zodResolver(wipeDataSchema),
    defaultValues: { password: "", securityCode: "", confirmationPhrase: "" },
  });

  const { reset: resetCompanyForm } = companySettingsForm;

  const fetchPageData = useCallback(async () => {
    if (!user || !isAdmin) {
        setIsReconLoading(false);
        setIsCategoryLoading(false);
        return;
    };

    setIsReconLoading(true);
    setIsCategoryLoading(true);
    try {
      const [closedData, categoriesData] = await Promise.all([
        getClosedReconciliations(user.uid),
        getCategories(user.uid),
      ]);
      setClosedReconciliations(closedData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching admin settings page data:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los datos de configuración." });
    } finally {
      setIsReconLoading(false);
      setIsCategoryLoading(false);
    }
  }, [toast, user, isAdmin]);


  useEffect(() => {
    if (user && isAdmin) {
        fetchPageData();
    }
    if (company) {
        resetCompanyForm({
            name: company.name || "",
            exchangeRate: company.exchangeRate || 36.5,
            pettyCashInitial: company.pettyCashInitial || 0,
        });
        setPreviewUrl(company.logoUrl || null);
        setIsCompanyLoading(false);
    }
  }, [user, isAdmin, company, resetCompanyForm, fetchPageData]);

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
    if (!user || !company) return;
    setIsCompanySubmitting(true);
    try {
      let logoUrl = company.logoUrl || "";

      if (logoFile) {
        const path = `companies/${company.id}/logos`;
        logoUrl = await uploadFileToStorage(logoFile, path);
        toast({ title: "Logo Actualizado", description: "El nuevo logo ha sido subido." });
      }

      await updateCompanySettings({ ...values, logoUrl }, user.uid);
      
      toast({
        title: "Configuración Guardada",
        description: `La configuración de la empresa ha sido actualizada. La página se recargará para reflejar los cambios.`,
      });
      
      // Force reload to update context everywhere
      window.location.reload();

    } catch (error: any) {
      console.error("Error updating company settings:", error);
      toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo guardar la configuración." });
    } finally {
       setIsCompanySubmitting(false);
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

  async function onSecurityCodeSubmit(values: z.infer<typeof securityCodeSchema>) {
    if (!user) return;
    setIsSecurityCodeSubmitting(true);
    try {
        await setCompanySecurityCode(values.password, values.securityCode, user.uid);
        toast({ title: "Código de Seguridad Configurado", description: "Ya puedes realizar acciones de alto riesgo." });
        window.location.reload();
    } catch (error: any) {
        console.error("Error setting security code:", error);
        toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo configurar el código." });
    } finally {
        setIsSecurityCodeSubmitting(false);
    }
  }
  
  async function onWipeDataSubmit(values: z.infer<typeof wipeDataSchema>) {
    if (!user) return;
    setIsWipingData(true);
    try {
        const result = await initiateCompanyWipe(values.password, values.securityCode, user.uid);
        toast({
            title: "Eliminación Iniciada",
            description: "El proceso de borrado de datos ha comenzado. Serás desconectado en breve.",
            duration: 10000,
        });
        setTimeout(() => {
            // Force logout and redirect
            user.company = null; // Clear company data locally
            window.location.href = '/login';
        }, 5000);
    } catch (error: any) {
        console.error("Error wiping data:", error);
        toast({ variant: "destructive", title: "Error de Eliminación", description: error.message || "No se pudo iniciar el borrado." });
    } finally {
        setIsWipingData(false);
        setIsWipeDialogOpen(false);
    }
  }


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
                        {isCompanyLoading || authLoading ? <Skeleton className="h-40 w-full"/> : (
                           <Form {...companySettingsForm}>
                            <form onSubmit={companySettingsForm.handleSubmit(onCompanySettingsSubmit)} className="space-y-6">
                                <FormItem>
                                  <FormLabel>Logo de la Empresa</FormLabel>
                                  <div className="flex items-center gap-4">
                                      <div className="relative w-24 h-24 rounded-full border flex items-center justify-center bg-muted">
                                        {previewUrl ? (
                                            <Image src={previewUrl} alt="Logo" width={96} height={96} className="object-cover rounded-full" />
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
                                <Button type="submit" disabled={isCompanySubmitting}>
                                    {isCompanySubmitting ? <Loader2 className="animate-spin" /> : "Guardar Configuración"}
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
        {isOwner && (
            <Card className="md:col-span-2 border-destructive bg-destructive/5">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                        <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
                    </div>
                    <CardDescription className="text-destructive/80">
                        Las acciones en esta sección son irreversibles y pueden causar la pérdida permanente de datos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!company?.securityCodeSet ? (
                        <div className="p-4 border border-dashed border-destructive/50 rounded-lg">
                            <h4 className="font-semibold">Configurar Código de Seguridad</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                Para realizar acciones de alto riesgo, como eliminar todos los datos de la empresa, primero debes configurar un código de seguridad.
                                Este código se te pedirá junto con tu contraseña.
                            </p>
                            <Form {...securityCodeForm}>
                                <form onSubmit={securityCodeForm.handleSubmit(onSecurityCodeSubmit)} className="space-y-4">
                                    <FormField control={securityCodeForm.control} name="password" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tu Contraseña Actual</FormLabel>
                                            <FormControl><Input type="password" {...field} disabled={isSecurityCodeSubmitting} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={securityCodeForm.control} name="securityCode" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nuevo Código de Seguridad</FormLabel>
                                            <FormControl><Input type="password" placeholder="Crea un código de 4+ caracteres" {...field} disabled={isSecurityCodeSubmitting} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <Button type="submit" variant="destructive" disabled={isSecurityCodeSubmitting}>
                                        {isSecurityCodeSubmitting && <Loader2 className="animate-spin mr-2"/>}
                                        Guardar Código de Seguridad
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
                            <div>
                                <h4 className="font-semibold">Eliminar Todos los Datos de la Empresa</h4>
                                <p className="text-sm text-muted-foreground">Esta acción eliminará permanentemente todos los productos, ventas, arqueos y usuarios. No se puede deshacer.</p>
                            </div>
                            <Dialog open={isWipeDialogOpen} onOpenChange={setIsWipeDialogOpen}>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">Eliminar Datos</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción es irreversible. Se eliminarán todos los productos, ventas, arqueos, categorías y usuarios de la empresa.
                                                La cuenta del propietario permanecerá, pero la empresa se restablecerá.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>He cambiado de opinión</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => setIsWipeDialogOpen(true)}>
                                                Entiendo, proceder a la verificación final
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <DialogContent>
                                    <DialogHeaderComponent>
                                        <DialogTitleComponent>Verificación Final</DialogTitleComponent>
                                        <DialogDescriptionComponent>
                                             Para confirmar, introduce tu contraseña, tu código de seguridad y escribe la frase <strong className="text-destructive">eliminar todos los datos</strong> en el campo de abajo.
                                        </DialogDescriptionComponent>
                                    </DialogHeaderComponent>
                                     <Form {...wipeDataForm}>
                                        <form onSubmit={wipeDataForm.handleSubmit(onWipeDataSubmit)} className="space-y-4 pt-4">
                                            <FormField control={wipeDataForm.control} name="password" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Contraseña</FormLabel>
                                                    <FormControl><Input type="password" {...field} disabled={isWipingData} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={wipeDataForm.control} name="securityCode" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Código de Seguridad</FormLabel>
                                                    <FormControl><Input type="password" {...field} disabled={isWipingData} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={wipeDataForm.control} name="confirmationPhrase" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Frase de Confirmación</FormLabel>
                                                    <FormControl><Input {...field} disabled={isWipingData} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <Button type="submit" variant="destructive" className="w-full" disabled={isWipingData}>
                                                {isWipingData && <Loader2 className="animate-spin mr-2"/>}
                                                Eliminar Permanentemente Todos los Datos
                                            </Button>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </CardContent>
            </Card>
        )}
      </main>
    </div>
  );
}
