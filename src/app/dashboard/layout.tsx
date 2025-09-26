
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
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }
    
    setIsAccessDenied(false);
    const isEmployee = user.role === 'employee';
    const isAdminOnlyRoute = ADMIN_ONLY_ROUTES.some(route => pathname.startsWith(route));

    if (isEmployee && isAdminOnlyRoute) {
        setIsAccessDenied(true);
        toast({
            variant: "destructive",
            title: "Acceso Denegado",
            description: "No tienes permiso para acceder a esta sección.",
        });
        router.replace('/dashboard');
        return;
    }
    
  }, [user, authLoading, router, pathname, toast]);

  if (authLoading || isAccessDenied) {
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

  if (!user) {
     return null; // Don't render anything while redirecting
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
