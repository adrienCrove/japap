'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home } from 'lucide-react';
import {
  Breadcrumb as ShadcnBreadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import React from 'react';

const breadcrumbNameMap: { [key: string]: string } = {
  '/dashboard': 'Dashboard',
  '/dashboard/alerts': 'Alertes',
  '/dashboard/map': 'Carte & Zones',
  '/dashboard/moderation': 'Modération',
  '/dashboard/users': 'Utilisateurs',
};

export default function Breadcrumb() {
  const pathname = usePathname();

  // Ne pas afficher sur la page principale du dashboard
  if (pathname === '/dashboard') {
    return null;
  }

  const pathSegments = pathname.split('/').filter(Boolean);

  // Construire les éléments du fil d'Ariane à partir de l'URL
  const breadcrumbItems = pathSegments
    .map((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      return {
        href,
        label: breadcrumbNameMap[href] || segment.charAt(0).toUpperCase() + segment.slice(1),
      };
    })
    .slice(1); // Retirer le premier élément qui est '/dashboard'

  // Ne rien afficher s'il n'y a pas d'éléments
  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <ShadcnBreadcrumb className="mb-2 block items-center justify-center">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              <span className="sr-only">Dashboard</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {index === breadcrumbItems.length - 1 ? (
                <BreadcrumbPage className="font-semibold text-foreground">
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </ShadcnBreadcrumb>
  );
}
