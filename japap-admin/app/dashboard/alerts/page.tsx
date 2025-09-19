'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import {
  fetchAlerts,
  performBulkAction,
  updateAlert,
  type Alert,
  type AlertsFilters,
  type BulkAction,
  type Pagination
} from '@/lib/api';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  Filter,
  Search,
  MoreHorizontal,
  CheckCircle,
  X,
  Edit,
  Eye,
  MessageSquare,
  Users,
  Archive,
  Radio,
  Loader2
} from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';

const PAGE_LIMIT = 10;

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [filters, setFilters] = useState<AlertsFilters>({
    status: 'all',
    category: 'all',
    severity: 'all',
    source: 'all',
    page: 1,
    limit: PAGE_LIMIT
  });

  const loadAlerts = useCallback(async (reset = true) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    const response = await fetchAlerts(filters);
    if (response.success && response.data) {
      if (reset) {
        setAlerts(response.data.alerts || []);
      } else {
        setAlerts(prev => [...prev, ...(response.data?.alerts || [])]);
      }
      setPagination(response.data.pagination);
    } else {
      toast.error("Erreur de chargement des alertes", {
        description: response.error,
      });
    }
    
    if (reset) {
      setLoading(false);
    } else {
      setLoadingMore(false);
    }
  }, [filters]);

  const loadMoreAlerts = useCallback(async () => {
    if (!pagination || pagination.page >= pagination.totalPages || loadingMore) return;
    
    const nextFilters = { ...filters, page: pagination.page + 1 };
    setLoadingMore(true);
    
    const response = await fetchAlerts(nextFilters);
    if (response.success && response.data) {
      setAlerts(prev => [...prev, ...(response.data?.alerts || [])]);
      setPagination(response.data.pagination);
    }
    setLoadingMore(false);
  }, [filters, pagination, loadingMore]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Intersection Observer pour l'infinite scroll
  const lastAlertElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && pagination && pagination.page < pagination.totalPages) {
        loadMoreAlerts();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, pagination, loadMoreAlerts]);

  const handleFilterChange = (key: keyof AlertsFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };
  
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'false': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'whatsapp': return '📱';
      case 'telegram': return '✈️';
      case 'app': return '📲';
      case 'web': return '🌐';
      default: return '❓';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `Il y a ${diffHours}h ${diffMinutes}min`;
    } else {
      return `Il y a ${diffMinutes}min`;
    }
  };

  const handleSelectAlert = (alertId: string) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const handleBulkAction = async (action: BulkAction) => {
    const promise = performBulkAction(action, selectedAlerts);
    
    toast.promise(promise, {
      loading: `Action en cours sur ${selectedAlerts.length} alerte(s)...`,
      success: (res) => {
        loadAlerts(); // Recharger les données
        setSelectedAlerts([]);
        return res.message || `Action '${action}' effectuée avec succès.`;
      },
      error: (err) => `Erreur lors de l'action : ${err.toString()}`,
    });
  };

  const handleEditAlert = (alert: Alert) => {
    setEditingAlert(alert);
    setEditDialogOpen(true);
  };

  const handleUpdateAlert = async (updatedData: Partial<Alert>) => {
    if (!editingAlert) return;

    const promise = updateAlert(editingAlert.id, updatedData);
    
    toast.promise(promise, {
      loading: 'Mise à jour en cours...',
      success: () => {
        loadAlerts(); // Recharger les données
        setEditDialogOpen(false);
        setEditingAlert(null);
        return 'Alerte mise à jour avec succès';
      },
      error: (err) => `Erreur lors de la mise à jour : ${err.toString()}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
        <Breadcrumb />
          <h1 className="text-3xl font-bold text-gray-900">Signalements</h1>
          <p className="text-gray-600 mt-2">
            Gestion des alertes et signalements reçus via les différents canaux
          </p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700" asChild>
          <Link href="/dashboard/alerts/create">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Créer une alerte manuelle
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtres</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">État</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Tous les états" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les états</SelectItem>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="expired">Expirées</SelectItem>
                  <SelectItem value="false">Fausses alertes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Catégorie</label>
              <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="Accident de circulation">Accident de circulation</SelectItem>
                  <SelectItem value="Incendie">Incendie</SelectItem>
                  <SelectItem value="Inondation">Inondation</SelectItem>
                  <SelectItem value="Éboulement">Éboulement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Gravité</label>
              <Select value={filters.severity} onValueChange={(value) => handleFilterChange('severity', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Toutes les gravités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les gravités</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Source</label>
              <Select value={filters.source} onValueChange={(value) => handleFilterChange('source', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Toutes les sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sources</SelectItem>
                  <SelectItem value="app">Application</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedAlerts.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedAlerts.length} alerte(s) sélectionnée(s)
                </span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedAlerts([])}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Tout désélectionner
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction('validate')}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Valider
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction('reject')}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <X className="h-4 w-4 mr-1" />
                  Rejeter
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction('archive')}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Archiver
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : (alerts?.length ?? 0) > 0 ? (
          alerts.map((alert, index) => (
            <Card 
              key={alert.id} 
              className="hover:shadow-md transition-shadow"
              ref={index === alerts.length - 6 ? lastAlertElementRef : null}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedAlerts.includes(alert.id)}
                    onChange={() => handleSelectAlert(alert.id)}
                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    aria-label={`Sélectionner l'alerte ${alert.id}`}
                  />
                  
                  {/* Alert Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header with Display Title */}
                        <div className="flex items-center space-x-3 mb-2">
                          <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                              {alert.category}
                            </span>
                          </div>
                          <Badge className={getStatusColor(alert.status)}>
                            {alert.status === 'active' ? 'Active' : 
                             alert.status === 'pending' ? 'En attente' :
                             alert.status === 'expired' ? 'Expirée' : 'Fausse alerte'}
                          </Badge>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity === 'critical' ? 'Critique' :
                             alert.severity === 'high' ? 'Élevée' :
                             alert.severity === 'medium' ? 'Moyenne' : 'Faible'}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {getSourceIcon(alert.source)} {alert.source}
                          </span>
                          
                          
                        </div>
                        {/* titre */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{alert.displayTitle}</h3>
                        </div>
                        <div className="flex text-xs items-center space-x-2 mb-2 text-gray-400">
                            {/* <MapPin className="h-4 w-4" /> */}
                            <span>{alert.location.address}</span>
                        </div>

                        {/* Category and Description */}
                        <div className="mb-3">                         
                          <p className="text-gray-700">{alert.description}</p>
                        </div>

                        {/* Location and User Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{alert.user?.phone || 'N/A'}</span>
                            <span className="text-green-600">(Score: {alert.user?.reputationScore || 'N/A'})</span>
                          </div>
                        </div>

                        {/* Confirmations and Time */}
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{alert.confirmations} confirmations</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatTimeAgo(alert.createdAt)}</span>
                          </div>
                          {alert.expiresAt && (
                            <div className="flex items-center space-x-1 text-orange-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Expire dans {Math.floor((new Date(alert.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60))}h</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditAlert(alert)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Éditer
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Commenter
                        </Button>
                        <Button size="sm" variant="outline">
                          <Radio className="h-4 w-4 mr-1" />
                          Diffuser
                        </Button>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center text-gray-500 py-12">
            <Search className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Aucune alerte trouvée</h3>
            <p>Essayez de modifier vos filtres pour voir plus de résultats.</p>
          </div>
        )}
        
        {/* Indicateur de chargement pour l'infinite scroll */}
        {loadingMore && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-red-600" />
            <span className="ml-2 text-gray-600">Chargement d&apos;autres alertes...</span>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Précédent
            </Button>
            {/* Generate page numbers logic here if needed */}
            <Button 
              variant="outline" 
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Suivants
            </Button>
          </div>
        </div>
      )}

      {/* Modale d'édition */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogClose onClose={() => setEditDialogOpen(false)} />
          <DialogHeader>
            <DialogTitle>Modifier l&apos;alerte</DialogTitle>
          </DialogHeader>
          {editingAlert && <EditAlertForm alert={editingAlert} onUpdate={handleUpdateAlert} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Composant de formulaire d'édition
interface EditAlertFormProps {
  alert: Alert;
  onUpdate: (data: Partial<Alert>) => void;
}

const EditAlertForm: React.FC<EditAlertFormProps> = ({ alert, onUpdate }) => {
  const [formData, setFormData] = useState({
    displayTitle: alert.displayTitle || '',
    description: alert.description || '',
    category: alert.category || '',
    severity: alert.severity || 'medium',
    status: alert.status || 'pending',
    location: {
      address: alert.location?.address || '',
      coordinates: alert.location?.coordinates || [0, 0]
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const handleChange = (field: string, value: string | number | [number, number]) => {
    if (field.startsWith('location.')) {
      const locationField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="displayTitle">Titre d&apos;affichage</Label>
        <Input
          id="displayTitle"
          value={formData.displayTitle}
          onChange={(e) => handleChange('displayTitle', e.target.value)}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Catégorie</Label>
          <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Accident de circulation">Accident de circulation</SelectItem>
              <SelectItem value="Incendie">Incendie</SelectItem>
              <SelectItem value="Inondation">Inondation</SelectItem>
              <SelectItem value="Éboulement">Éboulement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="severity">Gravité</Label>
          <Select value={formData.severity} onValueChange={(value) => handleChange('severity', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sélectionner une gravité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Faible</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="high">Élevée</SelectItem>
              <SelectItem value="critical">Critique</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="status">État</Label>
        <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Sélectionner un état" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expirée</SelectItem>
            <SelectItem value="false">Fausse alerte</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="address">Adresse</Label>
        <Input
          id="address"
          value={formData.location.address}
          onChange={(e) => handleChange('location.address', e.target.value)}
          className="mt-1"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => {}}>
          Annuler
        </Button>
        <Button type="submit" className="bg-red-600 hover:bg-red-700">
          Mettre à jour
        </Button>
      </div>
    </form>
  );
};
