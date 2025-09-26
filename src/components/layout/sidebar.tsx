
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React from 'react';
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  Settings,
  ShoppingCart,
  Tablet,
  Users,
  PiggyBank,
  PackagePlus,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { Warehouse } from '@/components/icons'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'
import { ThemeToggle } from './theme-toggle'
import { getCompany } from '@/lib/firestore-helpers';
import { Company } from '@/lib/types';


const allLinks = [
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard, adminOnly: false },
  { href: '/dashboard/pos', label: 'Venta', icon: Tablet, adminOnly: false },
  { href: '/dashboard/inventory', label: 'Inventario', icon: Boxes, adminOnly: true },
  { href: '/dashboard/orders', label: 'Pedidos', icon: PackagePlus, adminOnly: true },
  { href: '/dashboard/sales', label: 'Ventas', icon: ShoppingCart, adminOnly: true },
  { href: '/dashboard/cash-reconciliation', label: 'Arqueos', icon: PiggyBank, adminOnly: true },
  { href: '/dashboard/reports', label: 'Reportes', icon: BarChart3, adminOnly: true },
  { href: '/dashboard/users', label: 'Usuarios', icon: Users, adminOnly: true },
]

const bottomLinks = [
    { href: '/dashboard/settings', label: 'Configuración', icon: Settings, adminOnly: false },
]

interface AppSidebarProps {
  isAdmin: boolean;
}

export function AppSidebar({ isAdmin }: AppSidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth();
  const [company, setCompany] = React.useState<Company | null>(null);

  React.useEffect(() => {
    if (user) {
      getCompany(user.uid).then(setCompany);
    }
  }, [user]);

  const companyName = company?.name || 'Mi Empresa';
  const logoUrl = company?.logoUrl;

  const visibleLinks = allLinks.filter(link => !link.adminOnly || isAdmin);
  const visibleBottomLinks = bottomLinks.filter(link => !link.adminOnly || isAdmin);

  return (
    <Sidebar>
      <SidebarHeader>
        <div
          className={cn(
            'flex items-center gap-2 p-2 pl-3 transition-opacity duration-200',
            'group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:opacity-0'
          )}
        >
            {logoUrl ? (
                 <Image src={logoUrl} alt={companyName} width={24} height={24} className="rounded-full" />
            ) : (
                <Warehouse className="h-6 w-6 text-primary" />
            )}
          <h2 className="font-semibold text-lg tracking-tight">
            {companyName}
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {visibleLinks.map(link => (
            <SidebarMenuItem key={link.href}>
              <Link href={link.href} className="w-full">
                <SidebarMenuButton
                  isActive={pathname === link.href}
                  tooltip={{ children: link.label }}
                  className="justify-start"
                >
                  <link.icon />
                  <span>{link.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
            {visibleBottomLinks.map(link => (
                <SidebarMenuItem key={link.href}>
                    <Link href={link.href} className="w-full">
                        <SidebarMenuButton
                        isActive={pathname === link.href}
                        tooltip={{ children: link.label }}
                        className="justify-start"
                        >
                        <link.icon />
                        <span>{link.label}</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}
          <SidebarMenuItem>
             <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
                <SidebarMenuButton onClick={logout} className="justify-start flex-1 group-data-[collapsible=icon]:w-auto"
                tooltip={{children: 'Cerrar Sesión'}}
                >
                    <LogOut />
                    <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
                </SidebarMenuButton>
                <div className="group-data-[collapsible=icon]:hidden">
                    <ThemeToggle />
                </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
