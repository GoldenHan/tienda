import { AppSidebar } from '@/components/layout/sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { PropsWithChildren } from 'react'

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
