"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/context/auth-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { getCompany } from "@/lib/firestore-helpers";

const ADMIN_ONLY_ROUTES = [
  "/dashboard/inventory",
  "/dashboard/reports",
  "/dashboard/sales",
  "/dashboard/settings",
  "/dashboard/users",
];

export default function DashboardLayout({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user || !user.companyId) {
      router.push("/login");
      return;
    }

    if (user.role !== "admin" && ADMIN_ONLY_ROUTES.includes(pathname)) {
      router.replace("/dashboard/pos");
    }

    const fetchCompany = async () => {
      try {
        const companyData = await getCompany(user.companyId);
        if (companyData) {
          setCompanyName(companyData.name);
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      } finally {
        setCompanyLoading(false);
      }
    };

    fetchCompany();
    
  }, [user, loading, router, pathname]);

  if (loading || companyLoading || !user) {
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
