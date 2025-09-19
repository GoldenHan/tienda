
"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/context/auth-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { getCompanyName } from "@/lib/firestore-helpers";
import { useToast } from "@/hooks/use-toast";

const ADMIN_ONLY_ROUTES = [
  "/dashboard/inventory",
  "/dashboard/reports",
  "/dashboard/sales",
  "/dashboard/users",
  "/dashboard/cash-reconciliation",
];

export default function DashboardLayout({ children }: PropsWithChildren) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }
    
    // Check if the user is an employee and trying to access an admin-only route or the main dashboard
    const isEmployee = user.role === 'employee';
    const isAdminRoute = ADMIN_ONLY_ROUTES.includes(pathname) || pathname === '/dashboard';

    if (isEmployee && isAdminRoute) {
        router.replace('/dashboard/pos');
        return;
    }

    const fetchCompany = async () => {
      setCompanyLoading(true);
      try {
        const name = await getCompanyName(user.uid);
        setCompanyName(name);
      } catch (error) {
        console.error("Error fetching company name:", error);
        toast({
          variant: "destructive",
          title: "Error al cargar la empresa",
          description: "No se pudo obtener el nombre de la empresa.",
        });
        setCompanyName("Mi Empresa"); // Fallback name
      } finally {
        setCompanyLoading(false);
      }
    };

    fetchCompany();
    
  }, [user, authLoading, router, pathname, toast]);

  const isLoading = authLoading || companyLoading;

  if (authLoading || !user) {
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

  const isAdmin = user.role === 'admin' || user.role === 'primary-admin';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar companyName={companyName || "Cargando..."} isAdmin={isAdmin} />
        <SidebarInset className="flex-1 flex flex-col">
          {isLoading ? (
             <div className="flex h-full w-full items-center justify-center">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            </div>
          ) : children }
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
