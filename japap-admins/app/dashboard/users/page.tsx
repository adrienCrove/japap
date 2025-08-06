'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { 
  User,
  Users,
  Star,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  Shield,
  Ban,
  MessageSquare,
  Download,
  Filter,
  Search,
  TrendingUp,
  Eye,
  Edit,
  MoreHorizontal,
  UserCheck,
  UserX,
  Calendar,
  Activity,
  Smartphone,
  Info
} from 'lucide-react';

interface UserAccount {
  id: string;
  phone: string;
  name?: string;
  gender?: string;
  role: 'user' | 'moderator' | 'admin';
  reputationScore: number;
  status: 'active' | 'blocked' | 'suspended';
  location?: {
    city: string;
    coordinates: [number, number];
  };
  stats: {
    alertsSubmitted: number;
    alertsConfirmed: number;
    alertsRejected: number;
    validationRate: number; // pourcentage d'alertes validées
  };
  devices: {
    platform: string;
    lastActive: string;
    pushToken?: string;
  }[];
  accountAge: string;
  lastActivity: string;
  createdAt: string;
  notes: string[];
  restrictions?: {
    type: 'rate_limit' | 'category_ban' | 'full_ban';
    until?: string;
    reason: string;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserAccount[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    reputation: 'all',
    activity: 'all'
  });

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      const mockUsers: UserAccount[] = [
        {
          id: 'user-123',
          phone: '+33 6 12 34 56 78',
          name: 'Marie Dupont',
          gender: 'female',
          role: 'user',
          reputationScore: 85,
          status: 'active',
          location: {
            city: 'Paris 8e',
            coordinates: [48.8698, 2.3076]
          },
          stats: {
            alertsSubmitted: 12,
            alertsConfirmed: 10,
            alertsRejected: 2,
            validationRate: 83.3
          },
          devices: [
            {
              platform: 'iOS',
              lastActive: '2025-01-04T10:30:00Z',
              pushToken: 'ios_token_123'
            }
          ],
          accountAge: '2 ans',
          lastActivity: '2025-01-04T10:30:00Z',
          createdAt: '2023-01-04T10:30:00Z',
          notes: [
            'Utilisateur fiable avec historique consistant',
            'Signalements toujours géolocalisés correctement'
          ]
        },
        {
          id: 'user-456',
          phone: '+33 6 98 76 54 32',
          name: 'Jean Martin',
          role: 'moderator',
          reputationScore: 95,
          status: 'active',
          location: {
            city: 'Lyon',
            coordinates: [45.7640, 4.8357]
          },
          stats: {
            alertsSubmitted: 45,
            alertsConfirmed: 42,
            alertsRejected: 3,
            validationRate: 93.3
          },
          devices: [
            {
              platform: 'Android',
              lastActive: '2025-01-04T09:15:00Z',
              pushToken: 'android_token_456'
            }
          ],
          accountAge: '3 ans',
          lastActivity: '2025-01-04T09:15:00Z',
          createdAt: '2022-01-04T10:30:00Z',
          notes: [
            'Promu modérateur en juin 2024',
            'Excellent taux de validation'
          ]
        },
        {
          id: 'user-789',
          phone: '+33 6 11 22 33 44',
          name: 'Sophie Laurent',
          role: 'user',
          reputationScore: 45,
          status: 'suspended',
          location: {
            city: 'Marseille',
            coordinates: [43.2965, 5.3698]
          },
          stats: {
            alertsSubmitted: 8,
            alertsConfirmed: 3,
            alertsRejected: 5,
            validationRate: 37.5
          },
          devices: [
            {
              platform: 'Android',
              lastActive: '2025-01-03T14:20:00Z'
            }
          ],
          accountAge: '6 mois',
          lastActivity: '2025-01-03T14:20:00Z',
          createdAt: '2024-07-04T10:30:00Z',
          restrictions: {
            type: 'rate_limit',
            until: '2025-01-11T00:00:00Z',
            reason: 'Trop de fausses alertes signalées'
          },
          notes: [
            'Suspension temporaire pour fausses alertes répétées',
            'À surveiller lors de la réactivation'
          ]
        },
        {
          id: 'user-999',
          phone: '+33 6 00 00 00 00',
          role: 'user',
          reputationScore: 15,
          status: 'blocked',
          stats: {
            alertsSubmitted: 1,
            alertsConfirmed: 0,
            alertsRejected: 1,
            validationRate: 0
          },
          devices: [
            {
              platform: 'iOS',
              lastActive: '2025-01-04T09:00:00Z'
            }
          ],
          accountAge: '1 jour',
          lastActivity: '2025-01-04T09:00:00Z',
          createdAt: '2025-01-03T10:30:00Z',
          restrictions: {
            type: 'full_ban',
            reason: 'Compte suspect - activité frauduleuse détectée'
          },
          notes: [
            'Compte bloqué définitivement',
            'Création de compte suspecte',
            'Première alerte immédiatement identifiée comme fausse'
          ]
        }
      ];
      
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = users.filter(user => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!user.phone.includes(searchTerm) && 
            !user.name?.toLowerCase().includes(searchLower) &&
            !user.id.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      if (filters.role !== 'all' && user.role !== filters.role) return false;
      if (filters.status !== 'all' && user.status !== filters.status) return false;
      if (filters.reputation !== 'all') {
        if (filters.reputation === 'high' && user.reputationScore < 80) return false;
        if (filters.reputation === 'medium' && (user.reputationScore < 50 || user.reputationScore >= 80)) return false;
        if (filters.reputation === 'low' && user.reputationScore >= 50) return false;
      }
      if (filters.activity !== 'all') {
        const lastActivity = new Date(user.lastActivity);
        const now = new Date();
        const diffHours = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
        
        if (filters.activity === 'recent' && diffHours > 24) return false;
        if (filters.activity === 'week' && diffHours > 168) return false;
        if (filters.activity === 'inactive' && diffHours <= 168) return false;
      }
      return true;
    });
    setFilteredUsers(filtered);
  }, [users, searchTerm, filters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'moderator': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReputationColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `Il y a ${diffDays}j`;
    } else if (diffHours > 0) {
      return `Il y a ${diffHours}h`;
    } else {
      return `Il y a ${diffMinutes}min`;
    }
  };

  const handleUserAction = (action: string, userId: string) => {
    console.log(`Action ${action} sur utilisateur ${userId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
            <p className="text-gray-600 mt-2">
              Gestion des comptes et système de réputation
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button className="bg-red-600 hover:bg-red-700">
              <UserCheck className="h-4 w-4 mr-2" />
              Nouveau modérateur
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">+12 cette semaine</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actifs</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</div>
              <p className="text-xs text-muted-foreground">{Math.round((users.filter(u => u.status === 'active').length / users.length) * 100)}% du total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Modérateurs</CardTitle>
              <Shield className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter(u => u.role === 'moderator').length}</div>
              <p className="text-xs text-muted-foreground">En ligne actuellement</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score Moyen</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(users.reduce((acc, u) => acc + u.reputationScore, 0) / users.length)}</div>
              <p className="text-xs text-muted-foreground">Réputation globale</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtres et Recherche</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-1">
                <label className="text-sm font-medium text-gray-700">Recherche</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="Nom, téléphone, ID..." className="pl-10 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Rôle</label>
                <Select value={filters.role} onValueChange={(value) => setFilters({...filters, role: value})}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Tous les rôles" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="moderator">Modérateur</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Statut</label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="suspended">Suspendu</SelectItem>
                    <SelectItem value="blocked">Bloqué</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Réputation</label>
                <Select value={filters.reputation} onValueChange={(value) => setFilters({...filters, reputation: value})}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Tous les scores" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les scores</SelectItem>
                    <SelectItem value="high">Élevée (80+)</SelectItem>
                    <SelectItem value="medium">Moyenne (50-79)</SelectItem>
                    <SelectItem value="low">Faible (&lt;50)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Activité</label>
                <Select value={filters.activity} onValueChange={(value) => setFilters({...filters, activity: value})}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Toute activité" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toute activité</SelectItem>
                    <SelectItem value="recent">Récente (24h)</SelectItem>
                    <SelectItem value="week">Cette semaine</SelectItem>
                    <SelectItem value="inactive">Inactifs (&gt;1 semaine)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs ({filteredUsers.length})</CardTitle>
            <CardDescription>Liste complète avec statistiques et actions de modération</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-gray-900">{user.name || 'Utilisateur Anonyme'}</h3>
                            <Badge className={getRoleColor(user.role)}>{user.role === 'admin' ? 'Admin' : user.role === 'moderator' ? 'Modérateur' : 'Utilisateur'}</Badge>
                            <Badge className={getStatusColor(user.status)}>{user.status === 'active' ? 'Actif' : user.status === 'suspended' ? 'Suspendu' : 'Bloqué'}</Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-1"><Phone className="h-3 w-3" /><span>{user.phone}</span></div>
                            <div className="flex items-center space-x-1"><Calendar className="h-3 w-3" /><span>{user.accountAge}</span></div>
                            {user.location && (<div className="flex items-center space-x-1"><MapPin className="h-3 w-3" /><span>{user.location.city}</span></div>)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <div className="flex items-center space-x-1"><Star className="h-4 w-4 text-yellow-500" /><span className={`font-bold ${getReputationColor(user.reputationScore)}`}>{user.reputationScore}</span></div>
                          <p className="text-xs text-gray-500">Score</p>
                        </div>
                        <div className="text-center"><span className="font-bold text-blue-600">{user.stats.alertsSubmitted}</span><p className="text-xs text-gray-500">Signalements</p></div>
                        <div className="text-center"><span className="font-bold text-green-600">{user.stats.alertsConfirmed}</span><p className="text-xs text-gray-500">Validées</p></div>
                        <div className="text-center"><span className="font-bold text-red-600">{user.stats.alertsRejected}</span><p className="text-xs text-gray-500">Rejetées</p></div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1"><Activity className="h-3 w-3" /><span>Taux validation: {user.stats.validationRate.toFixed(1)}%</span></div>
                          <div className="flex items-center space-x-1"><Clock className="h-3 w-3" /><span>Dernière activité: {formatTimeAgo(user.lastActivity)}</span></div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span>{user.devices[0]?.platform}</span>
                        </div>
                      </div>

                      {user.restrictions && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="flex items-center space-x-2">
                            <Ban className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">{user.restrictions.type === 'rate_limit' ? 'Limitation de débit' : user.restrictions.type === 'category_ban' ? 'Restriction catégorie' : 'Blocage complet'}</span>
                            {user.restrictions.until && (<span className="text-xs text-yellow-600">jusqu'au {new Date(user.restrictions.until).toLocaleDateString('fr-FR')}</span>)}
                          </div>
                          <p className="text-xs text-yellow-700 mt-1">{user.restrictions.reason}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}><Eye className="h-4 w-4 mr-1" />Voir</Button>
                      <Button size="sm" variant="outline"><Edit className="h-4 w-4 mr-1" />Éditer</Button>
                      <Button size="sm" variant="outline"><MessageSquare className="h-4 w-4 mr-1" />Message</Button>
                      <Button size="sm" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">Précédent</Button>
                <Button variant="outline" size="sm">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">Suivant</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {selectedUser && (
          <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
              <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                      <SheetTitle>Détails de l'utilisateur</SheetTitle>
                      <SheetDescription>
                          Informations complètes sur {selectedUser.name || 'cet utilisateur'}.
                      </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 py-4">
                      <Card>
                          <CardHeader>
                              <CardTitle className="flex items-center space-x-2">
                                  <User className="h-5 w-5" />
                                  <span>Informations générales</span>
                              </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                              <div className="flex justify-between"><span className="text-gray-500">Nom</span> <strong>{selectedUser.name || 'Non défini'}</strong></div>
                              <div className="flex justify-between"><span className="text-gray-500">Téléphone</span> <strong>{selectedUser.phone}</strong></div>
                              <div className="flex justify-between"><span className="text-gray-500">Rôle</span> <Badge className={getRoleColor(selectedUser.role)}>{selectedUser.role}</Badge></div>
                              <div className="flex justify-between"><span className="text-gray-500">Statut</span> <Badge className={getStatusColor(selectedUser.status)}>{selectedUser.status}</Badge></div>
                              <div className="flex justify-between"><span className="text-gray-500">Score de réputation</span> <strong className={getReputationColor(selectedUser.reputationScore)}>{selectedUser.reputationScore}</strong></div>
                              <div className="flex justify-between"><span className="text-gray-500">Membre depuis</span> <span>{selectedUser.accountAge}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Dernière activité</span> <span>{formatTimeAgo(selectedUser.lastActivity)}</span></div>
                              {selectedUser.location && <div className="flex justify-between"><span className="text-gray-500">Localisation</span> <span>{selectedUser.location.city}</span></div>}
                          </CardContent>
                      </Card>

                      <Card>
                          <CardHeader>
                              <CardTitle className="flex items-center space-x-2">
                                  <Activity className="h-5 w-5" />
                                  <span>Statistiques d'activité</span>
                              </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                              <div className="flex justify-between"><span className="text-gray-500">Alertes soumises</span> <strong>{selectedUser.stats.alertsSubmitted}</strong></div>
                              <div className="flex justify-between"><span className="text-gray-500">Alertes confirmées</span> <strong className="text-green-600">{selectedUser.stats.alertsConfirmed}</strong></div>
                              <div className="flex justify-between"><span className="text-gray-500">Alertes rejetées</span> <strong className="text-red-600">{selectedUser.stats.alertsRejected}</strong></div>
                              <div className="flex justify-between"><span className="text-gray-500">Taux de validation</span> <strong>{selectedUser.stats.validationRate.toFixed(1)}%</strong></div>
                          </CardContent>
                      </Card>

                      {selectedUser.restrictions && (
                          <Card className="border-yellow-300 bg-yellow-50">
                              <CardHeader>
                                  <CardTitle className="flex items-center space-x-2 text-yellow-800">
                                      <Ban className="h-5 w-5" />
                                      <span>Restrictions Actives</span>
                                  </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2 text-sm text-yellow-900">
                                  <div className="flex justify-between">
                                    <span className="text-yellow-700">Type</span> 
                                    <strong>{selectedUser.restrictions.type === 'rate_limit' ? 'Limitation de débit' : 'Blocage'}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-yellow-700">Raison</span> 
                                    <strong>{selectedUser.restrictions.reason}</strong>
                                  </div>
                                  {selectedUser.restrictions.until && <div className="flex justify-between"><span className="text-yellow-700">Jusqu'au</span> <strong>{new Date(selectedUser.restrictions.until).toLocaleDateString('fr-FR')}</strong></div>}
                              </CardContent>
                          </Card>
                      )}

                      <Card>
                          <CardHeader>
                              <CardTitle className="flex items-center space-x-2">
                                <Info className="h-5 w-5" />
                                <span>Notes du modérateur</span>
                              </CardTitle>
                          </CardHeader>
                          <CardContent>
                              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                  {selectedUser.notes.map((note, index) => <li key={index}>{note}</li>)}
                              </ul>
                          </CardContent>
                      </Card>
                  </div>
                  <SheetFooter>
                    <Button variant="outline" onClick={() => handleUserAction('suspend', selectedUser.id)}>Suspendre</Button>
                    <Button variant="destructive" onClick={() => handleUserAction('block', selectedUser.id)}>Bloquer</Button>
                    <SheetClose asChild>
                      <Button>Fermer</Button>
                    </SheetClose>
                  </SheetFooter>
              </SheetContent>
          </Sheet>
      )}
    </>
  );
}