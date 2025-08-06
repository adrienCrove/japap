'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio, Bot, MessageSquare, Settings, PlayCircle } from 'lucide-react';

export default function BroadcastPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Diffusion & Bots</h1>
          <p className="text-gray-600 mt-2">
            Paramétrage des canaux de diffusion et des automatisations
          </p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700">
          <PlayCircle className="h-4 w-4 mr-2" />
          Nouvelle Règle d'Automatisation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Radio className="h-5 w-5" />
            <span>Canaux de Diffusion</span>
          </CardTitle>
          <CardDescription>
            Statut des canaux connectés pour la diffusion des alertes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <Radio className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Section en construction</h3>
            <p>La gestion des canaux (WhatsApp, Telegram, Push) sera bientôt disponible ici.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>Règles d'Automatisation</span>
          </CardTitle>
          <CardDescription>
            Configuration des règles pour la diffusion automatique des alertes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <Bot className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Section en construction</h3>
            <p>La configuration des règles (ex: "Catégorie X + Zone Y → Canal Z") sera bientôt disponible ici.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Journal des Bots</span>
          </CardTitle>
          <CardDescription>
            Historique des messages reçus et des alertes créées par les bots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <MessageSquare className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Section en construction</h3>
            <p>Le journal des messages entrants sera bientôt disponible ici.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}