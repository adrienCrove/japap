'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  CheckCircle,
  X,
  Clock,
  User,
  MapPin,
  MessageSquare,
  Eye,
  Star,
  TrendingUp,
  Users,
  Image as ImageIcon,
  ExternalLink,
  Flag,
  RotateCcw
} from 'lucide-react';

interface ModerationAlert {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: {
    address: string;
    coordinates: [number, number];
  };
  user: {
    id: string;
    phone: string;
    name?: string;
    reputationScore: number;
    previousAlerts: number;
    accountAge: string;
  };
  aiScore: number; // Score IA de confiance (0-100)
  communityScore: number; // Score communautaire basé sur confirmations
  confirmations: number;
  rejections: number;
  mediaUrl?: string;
  duplicateChecker: {
    isPotentialDuplicate: boolean;
    similarAlerts: string[];
  };
  createdAt: string;
  source: 'app' | 'whatsapp' | 'telegram';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  escalated: boolean;
  assignedTo?: string;
  notes: string[];
}

export default function ModerationPage() {
  const [alerts, setAlerts] = useState<ModerationAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<ModerationAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, urgent, high, medium, low
  const [sortBy, setSortBy] = useState('priority'); // priority, time, score

  useEffect(() => {
    // Simuler le chargement des données depuis l'API
    setTimeout(() => {
      const mockAlerts: ModerationAlert[] = [
        {
          id: 'ALT-3241',
          category: 'Accident de circulation',
          severity: 'high',
          description: 'Collision majeure impliquant plusieurs véhicules sur l\'autoroute A6',
          location: {
            address: 'Autoroute A6, Sortie Fontainebleau, 77300',
            coordinates: [48.4084, 2.7019]
          },
          user: {
            id: 'user-987',
            phone: '+33 6 12 34 56 78',
            name: 'Marie Dupont',
            reputationScore: 85,
            previousAlerts: 12,
            accountAge: '2 ans'
          },
          aiScore: 92,
          communityScore: 88,
          confirmations: 5,
          rejections: 0,
          mediaUrl: '/api/media/accident-a6.jpg',
          duplicateChecker: {
            isPotentialDuplicate: false,
            similarAlerts: []
          },
          createdAt: '2025-01-04T10:15:00Z',
          source: 'app',
          priority: 'urgent',
          escalated: true,
          notes: [
            'Signalement cohérent avec les données GPS',
            'Photos de qualité montrant l\'accident'
          ]
        },
        {
          id: 'ALT-3240',
          category: 'Incendie',
          severity: 'critical',
          description: 'Fumée épaisse visible depuis un bâtiment industriel',
          location: {
            address: 'Zone Industrielle de Gennevilliers, 92230',
            coordinates: [48.9333, 2.2833]
          },
          user: {
            id: 'user-654',
            phone: '+33 6 98 76 54 32',
            reputationScore: 45,
            previousAlerts: 3,
            accountAge: '6 mois'
          },
          aiScore: 67,
          communityScore: 52,
          confirmations: 2,
          rejections: 1,
          mediaUrl: '/api/media/fumee-industrie.jpg',
          duplicateChecker: {
            isPotentialDuplicate: true,
            similarAlerts: ['ALT-3238', 'ALT-3235']
          },
          createdAt: '2025-01-04T09:45:00Z',
          source: 'whatsapp',
          priority: 'high',
          escalated: false,
          assignedTo: 'moderator-1',
          notes: [
            'Score utilisateur faible - à vérifier',
            'Possible doublon avec ALT-3238'
          ]
        },
        {
          id: 'ALT-3239',
          category: 'Inondation',
          severity: 'medium',
          description: 'Accumulation d\'eau suite à orage intense',
          location: {
            address: 'Place de la République, 75011 Paris',
            coordinates: [48.8631, 2.3708]
          },
          user: {
            id: 'user-321',
            phone: '+33 6 11 22 33 44',
            reputationScore: 78,
            previousAlerts: 8,
            accountAge: '1 an'
          },
          aiScore: 74,
          communityScore: 71,
          confirmations: 3,
          rejections: 0,
          duplicateChecker: {
            isPotentialDuplicate: false,
            similarAlerts: []
          },
          createdAt: '2025-01-04T09:30:00Z',
          source: 'telegram',
          priority: 'medium',
          escalated: false,
          notes: [
            'Alerte cohérente avec les prévisions météo'
          ]
        },
        {
          id: 'ALT-3238',
          category: 'Fausse alerte',
          severity: 'low',
          description: 'Signalement d\'un incident inexistant - test utilisateur',
          location: {
            address: 'Rue de la Paix, 75001 Paris',
            coordinates: [48.8698, 2.3316]
          },
          user: {
            id: 'user-999',
            phone: '+33 6 00 00 00 00',
            reputationScore: 15,
            previousAlerts: 1,
            accountAge: '1 jour'
          },
          aiScore: 23,
          communityScore: 18,
          confirmations: 0,
          rejections: 4,
          duplicateChecker: {
            isPotentialDuplicate: false,
            similarAlerts: []
          },
          createdAt: '2025-01-04T09:00:00Z',
          source: 'app',
          priority: 'low',
          escalated: false,
          notes: [
            'Compte très récent - suspect',
            'Aucune confirmation obtenue',
            'Géolocalisation incohérente'
          ]
        }
      ];
      
      setAlerts(mockAlerts);
      setSelectedAlert(mockAlerts[0]);
      setLoading(false);
    }, 1000);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `Il y a ${diffMinutes}min`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return `Il y a ${diffHours}h`;
    }
  };

  const handleValidateAlert = (alertId: string) => {
    console.log('Validation de l\'alerte:', alertId);
    // Ici on appellerait l'API pour valider l'alerte
    setAlerts(alerts.filter(alert => alert.id !== alertId));
    if (selectedAlert?.id === alertId) {
      setSelectedAlert(alerts.find(alert => alert.id !== alertId) || null);
    }
  };

  const handleRejectAlert = (alertId: string) => {
    console.log('Rejet de l\'alerte:', alertId);
    // Ici on appellerait l'API pour rejeter l'alerte
    setAlerts(alerts.filter(alert => alert.id !== alertId));
    if (selectedAlert?.id === alertId) {
      setSelectedAlert(alerts.find(alert => alert.id !== alertId) || null);
    }
  };

  const handleRequestInfo = (alertId: string) => {
    console.log('Demande d\'informations complémentaires pour:', alertId);
    // Ici on appellerait l'API pour envoyer une demande d'info
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.priority === filter;
  });

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    } else if (sortBy === 'time') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'score') {
      return b.aiScore - a.aiScore;
    }
    return 0;
  });

  return (
    <div className="h-full flex">
      {/* Left Panel - Queue */}
      <div className="w-1/3 border-r border-gray-200 bg-gray-50">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <h1 className="text-2xl font-bold text-gray-900">File de Modération</h1>
          <p className="text-gray-600 mt-1">{alerts.length} alertes en attente</p>
          
          {/* Filters and Sort */}
          <div className="flex space-x-3 mt-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Toutes les priorités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priorité</SelectItem>
                <SelectItem value="time">Plus récent</SelectItem>
                <SelectItem value="score">Score IA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Alerts Queue */}
        <div className="overflow-y-auto h-full">
          {sortedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-white transition-colors ${
                selectedAlert?.id === alert.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
              onClick={() => setSelectedAlert(alert)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-semibold text-gray-900">{alert.id}</span>
                    <Badge className={getPriorityColor(alert.priority)}>
                      {alert.priority === 'urgent' ? 'URGENT' :
                       alert.priority === 'high' ? 'Élevée' :
                       alert.priority === 'medium' ? 'Moyenne' : 'Faible'}
                    </Badge>
                    {alert.escalated && (
                      <Flag className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                    {alert.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-3">
                      <span className={getScoreColor(alert.aiScore)}>
                        IA: {alert.aiScore}%
                      </span>
                      <span className={getScoreColor(alert.communityScore)}>
                        Community: {alert.communityScore}%
                      </span>
                    </div>
                    <span>{formatTimeAgo(alert.createdAt)}</span>
                  </div>
                  
                  {alert.duplicateChecker.isPotentialDuplicate && (
                    <div className="mt-2">
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Doublon potentiel
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Detail */}
      <div className="flex-1 bg-white">
        {selectedAlert ? (
          <div className="h-full flex flex-col">
            {/* Detail Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedAlert.id}</h2>
                    <Badge className={getPriorityColor(selectedAlert.priority)}>
                      {selectedAlert.priority === 'urgent' ? 'URGENT' :
                       selectedAlert.priority === 'high' ? 'Élevée' :
                       selectedAlert.priority === 'medium' ? 'Moyenne' : 'Faible'}
                    </Badge>
                    {selectedAlert.escalated && (
                      <Badge className="bg-red-100 text-red-800">
                        <Flag className="h-3 w-3 mr-1" />
                        Escaladée
                      </Badge>
                    )}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {selectedAlert.category}
                  </span>
                </div>
                
                {/* Quick Actions */}
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => handleValidateAlert(selectedAlert.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valider
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleRejectAlert(selectedAlert.id)}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleRequestInfo(selectedAlert.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Demander info
                  </Button>
                </div>
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Alert Description */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{selectedAlert.description}</p>
                    </CardContent>
                  </Card>

                  {/* Location */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MapPin className="h-5 w-5 mr-2" />
                        Localisation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{selectedAlert.location.address}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Coordonnées: {selectedAlert.location.coordinates.join(', ')}
                      </p>
                      <Button variant="outline" size="sm" className="mt-3">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Voir sur la carte
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Media */}
                  {selectedAlert.mediaUrl && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <ImageIcon className="h-5 w-5 mr-2" />
                          Pièces jointes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gray-100 rounded-lg p-4 text-center">
                          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Photo/Vidéo disponible</p>
                          <Button variant="outline" size="sm" className="mt-2">
                            <Eye className="h-4 w-4 mr-2" />
                            Voir le média
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* AI & Community Scores */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Aides à la Décision</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Score IA</span>
                        <span className={`font-bold ${getScoreColor(selectedAlert.aiScore)}`}>
                          {selectedAlert.aiScore}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Score Communautaire</span>
                        <span className={`font-bold ${getScoreColor(selectedAlert.communityScore)}`}>
                          {selectedAlert.communityScore}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Confirmations</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 font-bold">{selectedAlert.confirmations}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-red-600 font-bold">{selectedAlert.rejections}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* User Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <User className="h-5 w-5 mr-2" />
                        Informations Utilisateur
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Téléphone</span>
                        <span className="text-gray-700">{selectedAlert.user.phone}</span>
                      </div>
                      {selectedAlert.user.name && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Nom</span>
                          <span className="text-gray-700">{selectedAlert.user.name}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Score réputation</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className={`font-bold ${getScoreColor(selectedAlert.user.reputationScore)}`}>
                            {selectedAlert.user.reputationScore}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Alertes précédentes</span>
                        <span className="text-gray-700">{selectedAlert.user.previousAlerts}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Âge du compte</span>
                        <span className="text-gray-700">{selectedAlert.user.accountAge}</span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-3">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Voir l'historique complet
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Duplicate Checker */}
                  {selectedAlert.duplicateChecker.isPotentialDuplicate && (
                    <Card className="border-yellow-200 bg-yellow-50">
                      <CardHeader>
                        <CardTitle className="text-yellow-800">Doublon Potentiel Détecté</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-yellow-700 mb-3">
                          Cette alerte pourrait être similaire aux suivantes :
                        </p>
                        <div className="space-y-2">
                          {selectedAlert.duplicateChecker.similarAlerts.map((alertId) => (
                            <div key={alertId} className="flex items-center justify-between">
                              <span className="text-sm font-medium">{alertId}</span>
                              <Button variant="outline" size="sm">
                                Comparer
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Notes & Observations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedAlert.notes.map((note, index) => (
                          <div key={index} className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                            {note}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Sélectionnez une alerte pour voir les détails</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}