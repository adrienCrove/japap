'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  fetchDashboardStats, 
  fetchRecentActivity,
  type DashboardStats,
  type RecentActivity 
} from '@/lib/api';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Users, 
  TrendingUp,
  MapPin,
  Calendar,
  MoreHorizontal,
  ArrowRight,
  ExternalLink,
  Search
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCard } from '@/components/dashboard/AlertCard';
import type { HeatmapPoint } from '@/components/map/LeafletMap';

const Map = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Chargement de la carte...</p>
      </div>
    </div>
  )
});

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertSearchTerm, setAlertSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');

  const allAlerts = [
    {
      id: 'validation-required',
      status: "Validation Requise",
      badgeVariant: "yellow",
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
      title: "Validation requise pour ALT-2843",
      description: "Accident de circulation signalé par 3 utilisateurs - Nécessite validation modérateur",
      location: "Marché Ancien 3ème , Akwa, Douala",
      coordinates: [4.0483, 9.7043],
      createdAt: new Date().toISOString(),
      action: {
        label: "🔍 Explorer les solutions",
        variant: "link",
        className: "text-yellow-800",
      },
    },
    {
      id: 'alert-validated',
      status: "Alerte Validée",
      badgeVariant: "green",
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      title: "ALT-2846 - Inondation confirmée",
      description: "Diffusion automatique envoyée à 1,247 utilisateurs dans la zone affectée",
      location: "Non loin de Krystal palace , Akwa, Douala",
      coordinates: [4.0520, 9.7180],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      action: {
        label: "📱 Voir la diffusion",
        variant: "link",
        className: "text-green-800",
      },
    },
    {
      id: 'alert-expired',
      status: "Alerte Expirée",
      badgeVariant: "destructive",
      icon: <Clock className="h-5 w-5 text-red-600" />,
      title: "ALT-1932 expire dans 45 minutes",
      description: "Éboulement Route Nationale - Aucune confirmation reçue depuis 6h",
      location: "Agence commerciale Orange Cameroon , Akwa, Douala",
      coordinates: [3.8631, 11.5113],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      action: {
        label: "⏰ Prolonger l'alerte",
        variant: "link",
        className: "text-red-800",
      },
    },
    {
      id: 'false-alert',
      status: "Fausse Alerte",
      badgeVariant: "blue",
      icon: <Calendar className="h-5 w-5 text-blue-600" />,
      title: "ALT-1847 marquée comme non-fondée",
      description: "Réputation de l'utilisateur +33 6 12 34 56 78 ajustée (-10 points)",
      location: "2PF9+6Q7 Aéroport international, Douala, Cameroun",
      coordinates: [4.005, 9.721],
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      action: {
        label: "👤 Voir le profil",
        variant: "link",
        className: "text-blue-800",
      },
    },
    {
      id: 'new-alert',
      status: "Nouvelle Alerte",
      badgeVariant: "yellow",
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
      title: "ALT-3001 - Rassemblement suspect",
      description: "Signalement d'un attroupement inhabituel près de la gare centrale.",
      location: "Gare centrale , Akwa, Douala",
      coordinates: [4.0460, 9.7150],
      createdAt: new Date().toISOString(),
      action: {
        label: "🔍 Valider l'alerte",
        variant: "link",
        className: "text-yellow-800",
      },
    },
    {
      id: 'high-traffic',
      status: "Info Trafic",
      badgeVariant: "blue",
      icon: <MapPin className="h-5 w-5 text-blue-600" />,
      title: "INFO - Congestion A7",
      description: "Forte congestion signalée sur l'autoroute A7, sortie 23. Itinéraires alternatifs suggérés.",
      location: "Autoroute A7 , Akwa, Douala",
      coordinates: [4.0550, 9.7050],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      action: {
        label: "🗺️ Voir sur la carte",
        variant: "link",
        className: "text-blue-800",
      },
    },
    {
      id: 'system-update',
      status: "Système",
      badgeVariant: "default",
      icon: <TrendingUp className="h-5 w-5 text-gray-600" />,
      title: "Mise à jour du système",
      description: "Une mise à jour du système de cartographie est prévue ce soir à 23h00.",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      action: {
        label: "📄 Voir les détails",
        variant: "link",
        className: "text-gray-800",
      },
    },
    {
      id: 'resolved-fire',
      status: "Incendie Maîtrisé",
      badgeVariant: "green",
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      title: "ALT-2998 - Incendie maîtrisé",
      description: "Le feu de l'entrepôt a été maîtrisé par les services d'urgence. Zone sécurisée.",
      location: "Entrepôt de la ville , Akwa, Douala",
      coordinates: [3.8480, 11.5021],
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      action: {
        label: "✅ Archiver l'alerte",
        variant: "link",
        className: "text-green-800",
      },
    },
  ];

  const filteredAlerts = allAlerts
    .filter(alert => {
      const searchTermLower = alertSearchTerm.toLowerCase();
      return alert.title.toLowerCase().includes(searchTermLower) ||
             alert.description.toLowerCase().includes(searchTermLower);
    })
    .filter(alert => {
      return statusFilter === 'all' || alert.status === statusFilter;
    })
    .filter(alert => {
      if (periodFilter === 'all') return true;
      if (!alert.createdAt) return false;
      const alertDate = new Date(alert.createdAt);
      const now = new Date();
      
      if (periodFilter === 'today') {
        return alertDate.toDateString() === now.toDateString();
      }
      
      let daysToSubtract = 0;
      if (periodFilter === '7d') daysToSubtract = 7;
      if (periodFilter === '30d') daysToSubtract = 30;

      if (daysToSubtract > 0) {
        const periodStartDate = new Date();
        periodStartDate.setDate(now.getDate() - daysToSubtract);
        periodStartDate.setHours(0, 0, 0, 0);
        return alertDate >= periodStartDate;
      }
      
      return true;
    });

  const heatmapData: HeatmapPoint[] = allAlerts
    .filter(alert => alert.coordinates)
    .map(alert => [alert.coordinates![0], alert.coordinates![1], 0.5]); // Intensity can be adjusted

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      setTimeout(() => {
        setStats({
          activeAlerts: 24,
          expiredAlerts: 8,
          pendingAlerts: 12,
          averageValidationTime: 45,
          completedToday: 32,
          delayedJobs: 3,
          technicians: 18
        });

        setRecentActivity([
          {
            id: '1',
            jobId: 'ALT-2843',
            service: 'Accident de circulation',
            technician: 'Marie Dubois',
            eta: '10:30',
            status: 'validated',
            location: '',
            severity: 'high'
          },
          {
            id: '2',
            jobId: 'ALT-1843',
            service: 'Incendie de forêt',
            technician: 'Jean Martin',
            eta: '10:40',
            status: 'pending',
            location: '',
            severity: 'critical'
          },
          {
            id: '3',
            jobId: 'ALT-4842',
            service: 'Inondation',
            technician: 'Sophie Laurent',
            eta: '11:00',
            status: 'moderation',
            location: '',
            severity: 'high'
          },
          {
            id: '4',
            jobId: 'ALT-2840',
            service: 'Éboulement',
            technician: 'Pierre Moreau',
            eta: '12:00',
            status: 'false_alarm',
            location: '',
            severity: 'medium'
          }
        ]);

        setLoading(false);
      }, 1000);
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: RecentActivity['status']) => {
    switch (status) {
      case 'validated':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'moderation':
        return 'bg-blue-100 text-blue-800';
      case 'false_alarm':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: RecentActivity['status']) => {
    switch (status) {
      case 'validated': return 'Validée';
      case 'pending': return 'En attente';
      case 'moderation': return 'Modération';
      case 'false_alarm': return 'Fausse Alerte';
      default: return 'Inconnu';
    }
  }

  return (
    <div className="space-y-6">
      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Actives</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              +2.1% par rapport à hier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modérateurs Actifs</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.technicians}</div>
            <p className="text-xs text-muted-foreground">
              En ligne maintenant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validées Aujourd&apos;hui</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedToday}</div>
            <p className="text-xs text-muted-foreground">
              +12% par rapport à hier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.delayedJobs}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent modération
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts & Delays Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertes & Délais</CardTitle>
              <CardDescription>
                Équipes d&apos;intervention disponibles près des lieux d&apos;alerte en cours de traitement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher une alerte..."
                  className="pl-10"
                  value={alertSearchTerm}
                  onChange={(e) => setAlertSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex space-x-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {[...new Set(allAlerts.map(a => a.status))].map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filtrer par période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toute la période</SelectItem>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="7d">7 derniers jours</SelectItem>
                    <SelectItem value="30d">30 derniers jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredAlerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  status={alert.status}
                  badgeVariant={alert.badgeVariant as any}
                  icon={alert.icon}
                  title={alert.title}
                  description={alert.description}
                  location={alert.location}
                >
                  <Button variant={alert.action.variant as any} className={`${alert.action.className} p-0 h-auto text-sm font-semibold`}>
                    {alert.action.label}
                  </Button>
                </AlertCard>
              ))}

            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Activité Récente</CardTitle>
                <CardDescription>
                  Il y a currently 24 alertes en cours de traitement
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                Trier Par
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{activity.jobId}</span>
                      <Badge className={getStatusColor(activity.status)}>
                        {getStatusText(activity.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{activity.service}</p>
                    <p className="text-xs text-gray-500">Modérateur: {activity.technician}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{activity.eta}</p>
                    <Button variant="ghost" size="sm" className="h-auto p-0">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Alert Locations Card */}
          <Card>
            <CardHeader>
              <CardTitle>Zones d&apos;Alertes Actives</CardTitle>
              <CardDescription>
                Répartition géographique des alertes en cours au Cameroun
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded-lg">
                <Map 
                  heatmapData={heatmapData}
                  layers={{ heatmap: true }}
                  center={[6.0, 12.0]} // Centre sur le Cameroun
                  zoom={6}
                />
              </div>
            </CardContent>
          </Card>

           {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
          <CardDescription>Accès direct aux fonctionnalités principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button>
              <AlertTriangle className="h-4 w-4 mr-2" />
              File de Modération
            </Button>
            <Button variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Créer une alerte manuelle
            </Button>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Diffusion d&apos;urgence
            </Button>
            <Button variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              Vue carte temps réel
            </Button>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>

    </div>
  );
}
