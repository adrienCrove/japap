'use client'

import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Header } from '@/components/layout/Header'
import { Toaster } from '@/components/ui/sonner'
import Breadcrumb from '@/components/layout/Breadcrumb'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto bg-gray-50/40 p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster position="bottom-right" richColors />
    </>
  )
}
