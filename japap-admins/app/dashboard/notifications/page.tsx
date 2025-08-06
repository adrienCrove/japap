'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Edit, Code, Users } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications & Templates</h1>
          <p className="text-gray-600 mt-2">
            Gestion des modèles de messages et des campagnes de notification
          </p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700">
          <Edit className="h-4 w-4 mr-2" />
          Nouveau Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <span>Templates Dynamiques</span>
          </CardTitle>
          <CardDescription>
            Modèles de messages avec placeholders (ex: {`{categorie}`}, {`{zone}`})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <Code className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Section en construction</h3>
            <p>La gestion des templates sera bientôt disponible ici.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Segments d'Audience</span>
          </CardTitle>
          <CardDescription>
            Création de segments d'utilisateurs pour des notifications ciblées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <Users className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Section en construction</h3>
            <p>La gestion des segments (par zone, catégorie, etc.) sera bientôt disponible ici.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Journal des Envois</span>
          </CardTitle>
          <CardDescription>
            Historique et métriques des notifications envoyées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <Bell className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Section en construction</h3>
            <p>Le journal des envois (délivré, lu, etc.) sera bientôt disponible ici.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}