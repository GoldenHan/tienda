
"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/context/auth-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { getCompany } from "@/lib/firestore-helpers";
import { useToast } from "@/hooks/use-toast";

const ADMIN_ONLY_ROUTES = [
  "/dashboard/inventory",
  "/dashboard/reports",
  "/dashboard/sales",
  "/dashboard/settings",
  "/dashboard/users",
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
      // If auth is still loading, we wait. Don't do anything yet.
      return;
    }

    if (!user) {
      // If auth has finished and there's NO user, redirect to login.
      router.push("/login");
      return;
    }

    // If there IS a user, proceed with checks and data fetching.
    if (user.role !== "admin" && ADMIN_ONLY_ROUTES.includes(pathname)) {
      router.replace("/dashboard/pos");
      return;
    }

    const fetchCompany = async () => {
      // We know user.companyId exists if we got this far
      setCompanyLoading(true);
      try {
        const companyData = await getCompany(user.companyId);
        if (companyData) {
          setCompanyName(companyData.name);
        } else {
           toast({
            variant: "destructive",
            title: "Error de la empresa",
            description: `No se pudieron encontrar los datos para la empresa con ID: ${user.companyId}`,
          });
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
        toast({
          variant: "destructive",
          title: "Error al cargar la empresa",
          description: "No se pudieron obtener los datos de la empresa. Revisa los permisos.",
        });
      } finally {
        setCompanyLoading(false);
      }
    };

    fetchCompany();
    
  }, [user, authLoading, router, pathname, toast]);

  const isLoading = authLoading || companyLoading;

  if (isLoading || !user) {
    // Show a full-page loading skeleton while we wait for auth and company data
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

  // Once everything is loaded, render the real layout
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar companyName={companyName || "Mi Empresa"} />
        <SidebarInset className="flex-1 flex flex-col">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
