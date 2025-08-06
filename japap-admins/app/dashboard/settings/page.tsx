'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Tag, Star, Users, Key, Database } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600 mt-2">
            Configuration globale du système JAPAP
          </p>
        </div>
        <Button>
          Sauvegarder les modifications
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <span>Catégories & Taxonomie</span>
          </CardTitle>
          <CardDescription>
            Gestion des catégories d'alertes, icônes, couleurs et ordre
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <Tag className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Section en construction</h3>
            <p>La gestion de la taxonomie sera bientôt disponible ici.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5" />
            <span>Scores & Réputation</span>
          </CardTitle>
          <CardDescription>
            Configuration des pondérations et seuils de confiance pour les scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <Star className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Section en construction</h3>
            <p>La configuration des scores sera bientôt disponible ici.</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Rôles & Permissions</span>
          </CardTitle>
          <CardDescription>
            Configuration de la matrice RBAC pour les différents rôles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <Users className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Section en construction</h3>
            <p>La gestion des permissions sera bientôt disponible ici.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Intégrations & Clés API</span>
          </CardTitle>
          <CardDescription>
            Gestion des clés API pour les services tiers (Mapbox, Meta, Telegram, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <Key className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Section en construction</h3>
            <p>La gestion des intégrations sera bientôt disponible ici.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Stockage & Tâches Planifiées</span>
          </CardTitle>
          <CardDescription>
            Configuration du stockage (S3/Cloud) et des tâches cron
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <Database className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Section en construction</h3>
            <p>La configuration du stockage et des tâches planifiées sera bientôt disponible ici.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}