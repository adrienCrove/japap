export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  href: string;
  description?: string;
  badge?: string;
}

export const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    title: "Tableau de bord",
    icon: "BarChart3",
    href: "/dashboard",
    description: "Vue d'ensemble opérationnelle"
  },
  {
    id: "alerts",
    title: "Signalements",
    icon: "AlertTriangle",
    href: "/dashboard/alerts",
    description: "Gestion des alertes et signalements"
  },
  {
    id: "map",
    title: "Carte & Zones",
    icon: "Map",
    href: "/dashboard/map",
    description: "Vue cartographique et gestion des zones"
  },
  {
    id: "moderation",
    title: "Modération",
    icon: "Shield",
    href: "/dashboard/moderation",
    description: "File d'attente et validation"
  },
  {
    id: "users",
    title: "Utilisateurs",
    icon: "Users",
    href: "/dashboard/users",
    description: "Gestion des comptes et réputation"
  },
  {
    id: "broadcast",
    title: "Diffusion & Bots",
    icon: "Radio",
    href: "/dashboard/broadcast",
    description: "Canaux et automatisations"
  },
  {
    id: "notifications",
    title: "Notifications & Templates",
    icon: "Bell",
    href: "/dashboard/notifications",
    description: "Modèles et campagnes"
  },
  {
    id: "statistics",
    title: "Statistiques",
    icon: "TrendingUp",
    href: "/dashboard/statistics",
    description: "Pilotage et reporting"
  },
  {
    id: "audit",
    title: "Journal & Sécurité",
    icon: "FileText",
    href: "/dashboard/audit",
    description: "Traçabilité et conformité"
  },
  {
    id: "settings",
    title: "Paramètres",
    icon: "Settings",
    href: "/dashboard/settings",
    description: "Configuration système"
  }
];

export const quickActions = [
  {
    id: "create-alert",
    title: "Créer une alerte",
    icon: "Plus",
    href: "/dashboard/alerts/create"
  },
  {
    id: "moderate-queue",
    title: "File de modération",
    icon: "Clock",
    href: "/dashboard/moderation"
  },
  {
    id: "send-broadcast",
    title: "Envoyer diffusion",
    icon: "Send",
    href: "/dashboard/broadcast/send"
  }
];