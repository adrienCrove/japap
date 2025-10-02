'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Phone,
  Shield,
  ArrowLeft,
  Loader2,
  Star,
  UserPlus,
  Mail,
  Calendar
} from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { createUser } from '@/lib/api';

interface UserFormData {
  name: string;
  phone: string;
  email?: string;
  gender?: 'male' | 'female' | 'other';
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'pending' | 'suspended' | 'blocked';
  birthDate?: string;
  notes?: string;
}

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    phone: '',
    email: '',
    gender: undefined,
    role: 'user',
    status: 'active',
    birthDate: '',
    notes: ''
  });

  // Validation du numéro de téléphone camerounais
  const validatePhone = (phone: string): boolean => {
    // Format: 6XX XXX XXX ou +237 6XX XXX XXX
    const phoneRegex = /^(\+237)?6\d{8}$/;
    const cleanedPhone = phone.replace(/\s/g, '');
    return phoneRegex.test(cleanedPhone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!formData.name.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    if (!formData.phone.trim()) {
      toast.error('Le numéro de téléphone est requis');
      return;
    }

    if (!validatePhone(formData.phone)) {
      toast.error('Numéro de téléphone invalide', {
        description: 'Format attendu: 6XX XXX XXX ou +237 6XX XXX XXX'
      });
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: formData.name,
        phone: formData.phone.replace(/\s/g, ''),
        email: formData.email || undefined,
        gender: formData.gender,
        role: formData.role,
        status: formData.status,
        birthDate: formData.birthDate || undefined,
        notes: formData.notes || undefined
      };

      const response = await createUser(userData);

      if (response.success) {
        toast.success('Utilisateur créé avec succès', {
          description: `${formData.name} a été ajouté au système`
        });
        router.push('/dashboard/users');
      } else {
        toast.error('Erreur lors de la création', {
          description: response.error
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Erreur lors de la création de l\'utilisateur');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-6 mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb />
          <h1 className="text-3xl font-bold text-gray-900">Créer un utilisateur</h1>
          <p className="text-gray-600 mt-2">
            Ajouter un nouveau compte utilisateur au système
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations principales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Informations personnelles</span>
            </CardTitle>
            <CardDescription>
              Détails de base du nouvel utilisateur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Jean Dupont"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Numéro de téléphone *</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="6XX XXX XXX"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Format: 6XX XXX XXX ou +237 6XX XXX XXX
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email (optionnel)</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="gender">Genre</Label>
                <Select value={formData.gender} onValueChange={(value: any) => setFormData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner le genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Homme</SelectItem>
                    <SelectItem value="female">Femme</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="birthDate">Date de naissance (optionnel)</Label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rôle et Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Rôle et permissions</span>
            </CardTitle>
            <CardDescription>
              Définir le niveau d&apos;accès de l&apos;utilisateur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Rôle *</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleColor('user')}>Utilisateur</Badge>
                        <span className="text-xs text-gray-500">- Accès standard</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="moderator">
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleColor('moderator')}>Modérateur</Badge>
                        <span className="text-xs text-gray-500">- Validation des alertes</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleColor('admin')}>Administrateur</Badge>
                        <span className="text-xs text-gray-500">- Accès complet</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Statut du compte *</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <Badge className={getStatusColor('active')}>Actif</Badge>
                    </SelectItem>
                    <SelectItem value="pending">
                      <Badge className={getStatusColor('pending')}>En attente</Badge>
                    </SelectItem>
                    <SelectItem value="suspended">
                      <Badge className={getStatusColor('suspended')}>Suspendu</Badge>
                    </SelectItem>
                    <SelectItem value="blocked">
                      <Badge className={getStatusColor('blocked')}>Bloqué</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Star className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900">Score de réputation</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Le score de réputation initial est automatiquement défini à <strong>100 points</strong>.
                    Il évoluera en fonction des actions de l&apos;utilisateur sur la plateforme (signalements validés, confirmations, comportement).
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes administratives */}
        <Card>
          <CardHeader>
            <CardTitle>Notes administratives</CardTitle>
            <CardDescription>
              Informations supplémentaires (visible uniquement par les administrateurs)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              placeholder="Notes, observations, historique..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Créer l&apos;utilisateur
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
