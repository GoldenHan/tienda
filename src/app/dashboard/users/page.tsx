
"use client";

import { useState, useEffect, useCallback } from 'react';
import { User } from '@/lib/types';
import { getUsers } from '@/lib/firestore-helpers';
import { addEmployee, promoteToAdmin } from '@/lib/actions/setup';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserForm } from '@/components/users/user-form';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { EmployeeData } from '@/lib/types';
import { Shield, ShieldCheck, ShieldPlus, UserPlus, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const usersData = await getUsers(user.uid);
      const otherUsers = usersData.filter(u => u.uid !== user?.uid);
      setUsers(otherUsers);
    } catch (error) {
      console.error("Users fetch error:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los usuarios.' });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (user) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [user, fetchUsers]);

  const handleAddEmployee = async (data: EmployeeData) => {
    if (!user) return;
    setIsProcessing('add');
    try {
      await addEmployee(data, user.uid);
      await fetchUsers(); 
      setIsAddDialogOpen(false);
      toast({ title: 'Éxito', description: 'Empleado añadido correctamente.' });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo añadir el empleado.' });
    } finally {
      setIsProcessing(null);
    }
  };

  const handlePromoteUser = async (userIdToPromote: string) => {
      if (!user) return;
      setIsProcessing(userIdToPromote);
      try {
          await promoteToAdmin(userIdToPromote, user.uid);
          await fetchUsers();
          toast({ title: 'Usuario Promovido', description: 'El usuario ahora tiene permisos de administrador.' });
      } catch (error: any) {
          console.error("Error al promover usuario:", error);
          toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo promover al usuario.' });
      } finally {
        setIsProcessing(null);
      }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
  }

  const renderRoleBadge = (u: User) => {
    switch (u.role) {
        case 'primary-admin':
            return (
                <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                    <ShieldCheck className="mr-2 text-white" />
                    Admin Principal
                </Badge>
            );
        case 'admin':
            return (
                <Badge variant="secondary" className="bg-purple-600 text-white hover:bg-purple-700">
                    <Shield className="mr-2" />
                    Admin
                </Badge>
            );
        default:
            return <Badge variant="outline">Empleado</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col">
        <header className="p-4 sm:p-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-headline">Gestión de Usuarios</h1>
              <p className="text-muted-foreground">Añade o gestiona los miembros de tu equipo.</p>
            </div>
            <Skeleton className="h-10 w-36" />
        </header>
        <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </CardHeader>
            </Card>
          ))}
        </main>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="flex flex-col">
      <header className="p-4 sm:p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Añade, promueve o gestiona los miembros de tu equipo.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
                <UserPlus className="mr-2" />
                Añadir Empleado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Empleado</DialogTitle>
              <DialogDescription>Crea una cuenta para un nuevo miembro del equipo. Recibirá una contraseña temporal.</DialogDescription>
            </DialogHeader>
            <UserForm 
                onSubmit={handleAddEmployee} 
                onClose={() => setIsAddDialogOpen(false)}
                isSubmitting={isProcessing === 'add'}
            />
          </DialogContent>
        </Dialog>
      </header>
      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
        {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg h-64">
                <h3 className="text-xl font-semibold">No hay otros usuarios registrados</h3>
                <p className="text-muted-foreground mt-2">Añade tu primer empleado para empezar a construir tu equipo.</p>
            </div>
        ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {users.map(u => (
                    <Card key={u.uid}>
                        <CardHeader className="flex flex-col">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-base">{u.name}</CardTitle>
                                        <CardDescription>{u.email}</CardDescription>
                                    </div>
                                </div>
                                {renderRoleBadge(u)}
                            </div>
                             {u.role === 'employee' && (
                                <div className="flex justify-end mt-4">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm" disabled={!!isProcessing}>
                                                {isProcessing === u.uid ? <Loader2 className="animate-spin" /> : <ShieldPlus className="mr-2" />}
                                                Promover
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Promover a {u.name} a Administrador?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción le dará al usuario acceso a todas las secciones de la aplicación, incluyendo Inventario, Reportes y gestión de Usuarios.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handlePromoteUser(u.uid)}>Confirmar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                             {u.role === 'admin' && (
                                <div className="flex justify-end items-center gap-2 mt-4 text-sm text-purple-600 font-medium h-9">
                                    <Shield className="h-4 w-4" />
                                    <span>Permisos de Administrador</span>
                                </div>
                            )}
                        </CardHeader>
                    </Card>
                ))}
            </div>
        )}
      </main>
    </div>
    </TooltipProvider>
  );
}
