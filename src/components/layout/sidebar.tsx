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
  Users
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

const links = [
  { href: '/dashboard', label: 'Panel de Control', icon: LayoutDashboard, adminOnly: false },
  { href: '/dashboard/inventory', label: 'Inventario', icon: Boxes, adminOnly: true },
  { href: '/dashboard/sales', label: 'Ventas', icon: ShoppingCart, adminOnly: true },
  { href: '/dashboard/pos', label: 'Venta', icon: Tablet, adminOnly: false },
  { href: '/dashboard/reports', label: 'Reportes', icon: BarChart3, adminOnly: true },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings, adminOnly: true },
  { href: '/dashboard/users', label: 'Usuarios', icon: Users, adminOnly: true },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth();

  const visibleLinks = links.filter(link => !link.adminOnly || user?.role === 'admin');

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
          <h2 className="font-headline text-lg font-semibold tracking-tight">
            San José
          </h2>
        </div>
        <div className="p-2 md:hidden">
          <SidebarTrigger />
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
          <SidebarMenuItem asChild>
            <SidebarMenuButton onClick={logout} className="justify-start w-full">
              <LogOut />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
