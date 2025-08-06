'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar'
import {
  BarChart3, AlertTriangle, Map, Shield, Users, Radio, Bell, TrendingUp, FileText, Settings, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { menuItems, MenuItem } from '@/lib/menuItems'
import { Button } from '@/components/ui/button'

const iconMap = {
  BarChart3, AlertTriangle, Map, Shield, Users, Radio, Bell, TrendingUp, FileText, Settings
}

const getIcon = (iconName: string) => {
  const Icon = iconMap[iconName as keyof typeof iconMap]
  return Icon ? <Icon className="size-5" /> : null
}

const MenuSection = ({ title, items, pathname }: { title: string, items: MenuItem[], pathname: string }) => (
  <SidebarGroup>
    <SidebarGroupLabel>{title}</SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                asChild
                className={cn(
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <Link href={item.href}>
                  {getIcon(item.icon)}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
)

export function AppSidebar() {
  const pathname = usePathname()

  const overviewMenuIds = ['dashboard', 'map', 'statistics'];
  const alertManagementMenuIds = ['alerts', 'moderation', 'notifications'];
  const communityMenuIds = ['users', 'broadcast'];
  const settingsMenuIds = ['settings', 'audit'];

  const overviewMenuItems = menuItems.filter(item => overviewMenuIds.includes(item.id));
  const alertManagementMenuItems = menuItems.filter(item => alertManagementMenuIds.includes(item.id));
  const communityMenuItems = menuItems.filter(item => communityMenuIds.includes(item.id));
  const settingsMenuItems = menuItems
    .filter(item => settingsMenuIds.includes(item.id))
    .map(item => item.id === 'settings' ? { ...item, title: 'Paramètres généraux' } : item);

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="flex size-8 items-center justify-center rounded-lg bg-red-600">
            <span className="text-lg font-bold text-white">J</span>
          </div>
          <span className="text-lg">JAPAP Admin</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <MenuSection title="Vue d’ensemble" items={overviewMenuItems} pathname={pathname} />
        <MenuSection title="Gestion des alertes" items={alertManagementMenuItems} pathname={pathname} />
        <MenuSection title="Communauté" items={communityMenuItems} pathname={pathname} />
        <MenuSection title="Paramètres" items={settingsMenuItems} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-gray-300">
            <span className="font-medium text-gray-600">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">Admin User</p>
            <p className="truncate text-xs text-gray-500">admin@japap.com</p>
          </div>
          <Button variant="ghost" size="icon" className="text-gray-500 transition-colors hover:text-gray-900">
            <LogOut className="size-5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
