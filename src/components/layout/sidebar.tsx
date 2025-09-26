'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { Warehouse } from '@/components/icons'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'
import { ThemeToggle } from './theme-toggle'

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
  companyName: string;
  isAdmin: boolean;
}

export function AppSidebar({ companyName, isAdmin }: AppSidebarProps) {
  const pathname = usePathname()
  const { logout } = useAuth();

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
          <Warehouse className="h-6 w-6 text-primary" />
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
                <SidebarMenuButton onClick={logout} className="justify-start flex-1 group-data-[collapsible=icon]:w-auto">
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
