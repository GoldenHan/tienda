
"use client";

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { getUsers, addEmployee } from '@/lib/firestore-helpers';
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

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async (companyId: string) => {
    setLoading(true);
    try {
      const usersData = await getUsers(companyId);
      setUsers(usersData);
    } catch (error) {
      console.error("Users fetch error:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los usuarios.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.companyId) {
      fetchUsers(user.companyId);
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleAddEmployee = async (data: EmployeeData) => {
    if (!user?.companyId) return;
    try {
      await addEmployee(user.companyId, data);
      await fetchUsers(user.companyId); // Refresh the user list
      setIsAddDialogOpen(false);
      toast({ title: 'Éxito', description: 'Empleado añadido correctamente.' });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo añadir el empleado.' });
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <header className="p-4 sm:p-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-headline">
                Gestión de Usuarios
              </h1>
              <p className="text-muted-foreground">
                Añade o gestiona los miembros de tu equipo.
              </p>
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
    <div className="flex flex-col">
      <header className="p-4 sm:p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground">
            Añade o gestiona los miembros de tu equipo.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Añadir Empleado</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Empleado</DialogTitle>
              <DialogDescription>
                Crea una cuenta para un nuevo miembro del equipo. Recibirá una contraseña temporal.
              </DialogDescription>
            </DialogHeader>
            <UserForm 
                onSubmit={handleAddEmployee} 
                onClose={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </header>
      <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
        {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg h-64">
                <h3 className="text-xl font-semibold">No hay usuarios registrados</h3>
                <p className="text-muted-foreground mt-2">
                Añade un empleado para empezar.
                </p>
            </div>
        ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {users.map(user => (
                    <Card key={user.uid}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-base">{user.name}</CardTitle>
                                    <CardDescription>{user.email}</CardDescription>
                                </div>
                            </div>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                {user.role === 'admin' ? 'Admin' : 'Empleado'}
                            </Badge>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        )}
      </main>
    </div>
  );
}
