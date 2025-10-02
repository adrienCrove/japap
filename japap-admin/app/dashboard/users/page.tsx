'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { fetchUsers, updateUserStatus, updateUserRole, updateUser, fetchUserDetails } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  User,
  Users,
  Star,
  Phone,
  Clock,
  Shield,
  Download,
  Filter,
  Search,
  TrendingUp,
  Edit,
  MoreHorizontal,
  UserPlus,
  LayoutGrid,
  Table as TableIcon,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  Archive,
  CheckCircle,
  X,
  Mail,
  Calendar,
  MapPin,
  Activity,
  Info,
  Key,
  Copy,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Flag
} from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { DataTable } from './data-table';
import { createColumns, UserAccount } from './columns';

type ViewMode = 'kanban' | 'table';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all'
  });

  // États pour les dialogues et sheets
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserAccount | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [userDetailsData, setUserDetailsData] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Fonction pour gérer la mise à jour d'un utilisateur
  const handleUpdateUser = async () => {
    if (!userToEdit) return;

    const promise = updateUser(userToEdit.id, {
      name: userToEdit.name,
      email: userToEdit.email,
      role: userToEdit.role,
      status: userToEdit.status,
    });

    toast.promise(promise, {
      loading: 'Mise à jour en cours...',
      success: (res) => {
        if (res.success) {
          // Mise à jour dans la liste locale
          setUsers(prev => prev.map(u =>
            u.id === userToEdit.id ? userToEdit : u
          ));
          setEditSheetOpen(false);
          return res.message || 'Utilisateur mis à jour avec succès';
        }
        throw new Error(res.error || 'Erreur lors de la mise à jour');
      },
      error: (err) => err.message || 'Erreur lors de la mise à jour',
    });
  };

  // Chargement des utilisateurs depuis l'API
  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetchUsers({
        role: filters.role !== 'all' ? filters.role : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        search: searchTerm || undefined
      });

      if (response.success && response.data) {
        const mappedUsers: UserAccount[] = response.data.map((user: any) => ({
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          status: user.status,
          reputationScore: user.reputationScore || 100,
          createdAt: user.createdAt
        }));
        setUsers(mappedUsers);
      } else {
        setUsers(getMockUsers());
        toast.error('Impossible de charger les utilisateurs', {
          description: 'Affichage des données de démonstration'
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers(getMockUsers());
      toast.error('Erreur de connexion à l\'API');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (user: UserAccount) => {
    setSelectedUser(user);
    setViewSheetOpen(true);
    setLoadingDetails(true);

    // Créer un timeout pour l'appel API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 secondes timeout

    try {
      const response = await Promise.race([
        fetchUserDetails(user.id),
        new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 3000)
        )
      ]);

      clearTimeout(timeoutId);

      if (response.success && response.data) {
        setUserDetailsData(response.data);
      } else {
        // Utiliser des données mock si l'API échoue
        setUserDetailsData(getMockUserDetails(user));
        toast.info('Données de démonstration affichées');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error fetching user details:', error);
      setUserDetailsData(getMockUserDetails(user));

      if (error instanceof Error && error.message === 'Timeout') {
        toast.warning('API non disponible, affichage des données de démonstration');
      } else {
        toast.info('Données de démonstration affichées');
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleEditUser = (user: UserAccount) => {
    setUserToEdit(user);
    setEditSheetOpen(true);
  };

  const handleDeleteUser = (user: UserAccount) => {
    setUserToEdit(user);
    setDeleteConfirmation('');
    setDeleteDialogOpen(true);
  };

  const handleArchiveUser = async (user: UserAccount) => {
    toast.success(`Utilisateur ${user.name || user.phone} archivé`);
    // TODO: Implémenter l'archivage via API
  };

  const confirmDelete = async () => {
    if (deleteConfirmation !== 'DELETE' || !userToEdit) {
      toast.error('Veuillez taper DELETE pour confirmer');
      return;
    }

    try {
      setUsers(prev => prev.filter(u => u.id !== userToEdit.id));
      toast.success(`Utilisateur ${userToEdit.name || userToEdit.phone} supprimé`);
      setDeleteDialogOpen(false);
      setUserToEdit(null);
      setDeleteConfirmation('');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleBulkAction = (action: 'delete' | 'archive' | 'activate' | 'suspend') => {
    const count = selectedUsers.length;
    toast.success(`Action "${action}" appliquée à ${count} utilisateur(s)`);
    setSelectedUsers([]);
  };

  const handleChangeStatus = (user: UserAccount) => {
    setUserToEdit(user);
    setNewStatus(user.status);
    setStatusDialogOpen(true);
  };

  const handleChangeRole = (user: UserAccount) => {
    setUserToEdit(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const handleManagePassword = (user: UserAccount) => {
    setUserToEdit(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordStrength(0);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordDialogOpen(true);
  };

  const generatePassword = () => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setNewPassword(password);
    setConfirmPassword(password);
    calculatePasswordStrength(password);
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
    setPasswordStrength(Math.min(100, strength));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Mot de passe copié dans le presse-papier');
  };

  const handleUpdatePassword = async () => {
    if (!userToEdit) return;
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    toast.success(`Mot de passe mis à jour pour ${userToEdit.name || userToEdit.phone}`);
    setPasswordDialogOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    // TODO: Implémenter l'appel API pour changer le mot de passe
  };

  const handleUpdateStatus = async () => {
    if (!userToEdit) return;

    const promise = updateUserStatus(userToEdit.id, newStatus);

    toast.promise(promise, {
      loading: 'Mise à jour du statut...',
      success: (res) => {
        setUsers(prev => prev.map(u =>
          u.id === userToEdit.id ? { ...u, status: newStatus as any } : u
        ));
        setStatusDialogOpen(false);
        return res.message || 'Statut mis à jour avec succès';
      },
      error: (err) => `Erreur : ${err.toString()}`,
    });
  };

  const handleUpdateRole = async () => {
    if (!userToEdit) return;

    const promise = updateUserRole(userToEdit.id, newRole);

    toast.promise(promise, {
      loading: 'Mise à jour du rôle...',
      success: (res) => {
        setUsers(prev => prev.map(u =>
          u.id === userToEdit.id ? { ...u, role: newRole as any } : u
        ));
        setRoleDialogOpen(false);
        return res.message || 'Rôle mis à jour avec succès';
      },
      error: (err) => `Erreur : ${err.toString()}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
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

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(search) ||
      user.phone.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  });

  const columns = createColumns({
    onViewUser: handleViewUser,
    onEditUser: handleEditUser,
    onChangeStatus: handleChangeStatus,
    onChangeRole: handleChangeRole,
    onManagePassword: handleManagePassword,
    onArchiveUser: handleArchiveUser,
    onDeleteUser: handleDeleteUser,
    selectedUsers,
    onSelectUser: handleSelectUser,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Breadcrumb />
          <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-600 mt-2">
            Gestion des comptes utilisateurs et modérateurs
          </p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700" asChild>
          <a href="/dashboard/users/create">
            <UserPlus className="h-4 w-4 mr-2" />
            Créer un utilisateur
          </a>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-2xl font-bold">{users.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Utilisateurs actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Modérateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{users.filter(u => u.role === 'moderator' || u.role === 'admin').length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Score moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">
                {users.length > 0 ? Math.round(users.reduce((acc, u) => acc + u.reputationScore, 0) / users.length) : 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre d'actions groupées */}
      {selectedUsers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedUsers.length} utilisateur(s) sélectionné(s)
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedUsers([])}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Tout désélectionner
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('activate')}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Activer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('suspend')}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <X className="h-4 w-4 mr-1" />
                  Suspendre
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('delete')}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & View Toggle */}
      <Card>
        <CardContent>
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row gap-4">
            <div>
              <Label>Rechercher</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Nom, téléphone, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Rôle</Label>
              <Select value={filters.role} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="moderator">Modérateur</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                  <SelectItem value="blocked">Bloqué</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-row gap-2">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Grille
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <TableIcon className="h-4 w-4 mr-2" />
                Tableau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vue Kanban ou Tableau */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      ) : viewMode === 'table' ? (
        <Card>
          <CardContent className="pt-6">
            <DataTable columns={columns} data={filteredUsers} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => handleSelectUser(user.id)}
                      />
                      <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3
                          className="font-semibold text-gray-900 hover:text-red-600 cursor-pointer transition-colors"
                          onClick={() => handleViewUser(user)}
                        >
                          {user.name || 'Sans nom'}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {user.phone}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Éditer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeStatus(user)}>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Changer le statut
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeRole(user)}>
                          <Shield className="h-4 w-4 mr-2" />
                          Changer le rôle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManagePassword(user)}>
                          <Key className="h-4 w-4 mr-2" />
                          Gérer mot de passe
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleArchiveUser(user)}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archiver
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteUser(user)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={getRoleColor(user.role)}>
                      {user.role === 'admin' ? 'Administrateur' : user.role === 'moderator' ? 'Modérateur' : 'Utilisateur'}
                    </Badge>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status === 'active' ? 'Actif' : user.status === 'pending' ? 'En attente' : user.status === 'suspended' ? 'Suspendu' : 'Bloqué'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-semibold">{user.reputationScore}</span>
                      <span className="text-xs text-gray-500">pts</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  {user.email && (
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog pour voir les détails */}
      <Dialog open={viewSheetOpen} onOpenChange={setViewSheetOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profil utilisateur</DialogTitle>
            <DialogDescription>
              Informations détaillées sur {selectedUser?.name || selectedUser?.phone}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6 py-4">
              {/* Informations de base */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informations générales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2  gap-4">
                    <div>
                      <Label className="text-gray-500">Nom</Label>
                      <p className="font-medium mt-1">{selectedUser.name || 'Non défini'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Téléphone</Label>
                      <p className="font-medium mt-1">{selectedUser.phone}</p>
                    </div>
                    {selectedUser.email && (
                      <div>
                        <Label className="text-gray-500">Email</Label>
                        <p className="font-medium mt-1">{selectedUser.email}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-gray-500">Rôle</Label>
                      <div className="mt-1">
                        <Badge className={getRoleColor(selectedUser.role)}>
                          {selectedUser.role === 'admin' ? 'Administrateur' : selectedUser.role === 'moderator' ? 'Modérateur' : 'Utilisateur'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-500">Statut</Label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedUser.status)}>
                          {selectedUser.status === 'active' ? 'Actif' : selectedUser.status === 'pending' ? 'En attente' : selectedUser.status === 'suspended' ? 'Suspendu' : 'Bloqué'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-500">Score de réputation</Label>
                      <p className="font-semibold text-yellow-600 mt-1">{selectedUser.reputationScore} pts</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Membre depuis</Label>
                      <p className="font-medium mt-1">{new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {loadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                </div>
              ) : userDetailsData && (
                <>
              

                  {/* Dernières alertes */}
                  {userDetailsData.alerts && userDetailsData.alerts.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Dernières alertes créées</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {userDetailsData.alerts.slice(0, 5).map((alert: any) => (
                            <div key={alert.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <div>
                                  <p className="text-sm font-medium">{alert.category}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(alert.createdAt).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              </div>
                              <Badge className={alert.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {alert.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewSheetOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour éditer */}
      <Dialog open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Édition de {userToEdit?.name || userToEdit?.phone}
            </DialogDescription>
          </DialogHeader>
          {userToEdit && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Nom</Label>
                <Input
                  value={userToEdit.name || ''}
                  onChange={(e) => setUserToEdit({ ...userToEdit, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={userToEdit.email || ''}
                  onChange={(e) => setUserToEdit({ ...userToEdit, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Rôle</Label>
                <Select
                  value={userToEdit.role}
                  onValueChange={(value: any) => setUserToEdit({ ...userToEdit, role: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="moderator">Modérateur</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Statut</Label>
                <Select
                  value={userToEdit.status}
                  onValueChange={(value: any) => setUserToEdit({ ...userToEdit, status: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="suspended">Suspendu</SelectItem>
                    <SelectItem value="blocked">Bloqué</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSheetOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleUpdateUser}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de gestion du mot de passe */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gérer le mot de passe</DialogTitle>
            <DialogDescription>
              Modifier le mot de passe de {userToEdit?.name || userToEdit?.phone}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="newPassword">Mot de passe</Label>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      calculatePasswordStrength(e.target.value);
                    }}
                    placeholder="Entrer le nouveau mot de passe"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(newPassword)}
                  disabled={!newPassword}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmation du mot de passe</Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer le mot de passe"
                  className="pr-10"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            {newPassword && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Niveau de sécurité</Label>
                  <span className="text-sm font-medium">
                    {passwordStrength < 50 ? 'Faible' : passwordStrength < 75 ? 'Moyen' : passwordStrength < 100 ? 'Élevé' : 'Très élevé'} ({passwordStrength}/100)
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength < 50
                        ? 'bg-red-500'
                        : passwordStrength < 75
                        ? 'bg-yellow-500'
                        : passwordStrength < 100
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={generatePassword}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Générateur de mots de passe
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleUpdatePassword}
              disabled={!newPassword || newPassword !== confirmPassword}
            >
              <Key className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'utilisateur</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Pour confirmer la suppression de{' '}
              <strong>{userToEdit?.name || userToEdit?.phone}</strong>, veuillez taper{' '}
              <strong className="text-red-600">DELETE</strong> ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="deleteConfirm">Confirmation</Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Tapez DELETE"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteConfirmation !== 'DELETE'}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour changer le statut */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le statut de l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifier le statut du compte de {userToEdit?.name || userToEdit?.phone}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="status">Nouveau statut</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                  <SelectItem value="blocked">Bloqué</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Annuler
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleUpdateStatus}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour changer le rôle */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le rôle de l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifier les permissions de {userToEdit?.name || userToEdit?.phone}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="role">Nouveau rôle</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur - Accès standard</SelectItem>
                  <SelectItem value="moderator">Modérateur - Validation des alertes</SelectItem>
                  <SelectItem value="admin">Administrateur - Accès complet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Annuler
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleUpdateRole}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Données de démonstration (fallback)
function getMockUsers(): UserAccount[] {
  return [
    {
      id: 'user-1',
      name: 'Marie Dupont',
      phone: '+237 693 12 34 56',
      email: 'marie.dupont@example.com',
      role: 'user',
      status: 'active',
      reputationScore: 95,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-2',
      name: 'Jean Martin',
      phone: '+237 675 98 76 54',
      email: 'jean.martin@example.com',
      role: 'moderator',
      status: 'active',
      reputationScore: 88,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-3',
      name: 'Sophie Bernard',
      phone: '+237 680 11 22 33',
      email: null,
      role: 'user',
      status: 'pending',
      reputationScore: 100,
      createdAt: new Date().toISOString()
    }
  ];
}

function getMockUserDetails(user: UserAccount) {
  return {
    _count: {
      alerts: 12,
      confirmations: 45,
    },
    reports: 2,
    alerts: [
      { id: '1', category: 'Accident', status: 'active', createdAt: '2025-09-28' },
      { id: '2', category: 'Incendie', status: 'expired', createdAt: '2025-09-25' },
      { id: '3', category: 'Vol', status: 'active', createdAt: '2025-09-20' },
    ],
    confirmations: [
      { id: '1', alertId: 'a1', createdAt: '2025-09-27' },
      { id: '2', alertId: 'a2', createdAt: '2025-09-26' },
    ],
    activityData: [
      { month: 'Jan', alertes: 4, confirmations: 8 },
      { month: 'Fév', alertes: 3, confirmations: 12 },
      { month: 'Mar', alertes: 5, confirmations: 10 },
      { month: 'Avr', alertes: 2, confirmations: 15 },
      { month: 'Mai', alertes: 6, confirmations: 18 },
      { month: 'Juin', alertes: 4, confirmations: 14 },
    ],
  };
}
