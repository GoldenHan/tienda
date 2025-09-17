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
  Tablet
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
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Boxes },
  { href: '/dashboard/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/dashboard/pos', label: 'POS', icon: Tablet },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth();

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
          {links.map(link => (
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
