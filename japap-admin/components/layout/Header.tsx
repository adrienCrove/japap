'use client'

import { Bell, Menu, Settings } from 'lucide-react'
import {
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-white px-6">
    <SidebarTrigger>
      <Menu className="size-5" />
      <span className="sr-only">Toggle navigation menu</span>
    </SidebarTrigger>
    
    <div className="flex-1">
      <h1 className="text-xl font-semibold">Tableau de Bord</h1>
    </div>
    
    <div className="flex items-center gap-4">
      <div className="relative">
        <Button variant="ghost" size="icon">
          <Bell className="size-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-white bg-red-500"></span>
      </div>
      <Button variant="ghost" size="icon">
        <Settings className="size-5" />
        <span className="sr-only">Paramètres</span>
      </Button>
    </div>
  </header>
  )
}