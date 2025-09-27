
"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/context/auth-context";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const ADMIN_ONLY_ROUTES = [
  "/dashboard/inventory",
  "/dashboard/reports",
  "/dashboard/sales",
  "/dashboard/users",
  "/dashboard/cash-reconciliation",
  "/dashboard/orders",
];

export default function DashboardLayout({ children }: PropsWithChildren) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // No tomar decisiones mientras la autenticación está en proceso
    if (authLoading) {
      return;
    }

    // Si la carga ha terminado y no hay usuario, redirigir al login
    if (!user) {
      router.replace("/login");
      return;
    }
    
    const isEmployee = user.role === 'employee';
    const isAdminOnlyRoute = ADMIN_ONLY_ROUTES.some(route => pathname.startsWith(route));

    if (isEmployee && isAdminOnlyRoute) {
        toast({
            variant: "destructive",
            title: "Acceso Denegado",
            description: "No tienes permiso para acceder a esta sección.",
        });
        router.replace('/dashboard');
        return;
    }
    
  }, [user, authLoading, router, pathname, toast]);

  // Mostrar un esqueleto de carga mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  // Si después de cargar, no hay usuario, no renderizar nada mientras se redirige
  if (!user) {
     return null;
  }

  const isAdmin = user.role === 'admin' || user.role === 'primary-admin';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar isAdmin={isAdmin} />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6 sticky top-0 z-30">
            <SidebarTrigger className="flex md:hidden" />
            <div className="flex-1" />
          </header>
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
