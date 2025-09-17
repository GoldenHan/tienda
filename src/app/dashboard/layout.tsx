"use client";

import { PropsWithChildren, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/context/auth-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

const ADMIN_ONLY_ROUTES = [
  "/dashboard/inventory",
  "/dashboard/reports",
  "/dashboard/sales",
  "/dashboard/settings",
];

export default function DashboardLayout({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Role-based access control
    if (user.role !== "admin" && ADMIN_ONLY_ROUTES.includes(pathname)) {
      router.replace("/dashboard/pos");
    }
  }, [user, loading, router, pathname]);

  if (loading || !user) {
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
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
