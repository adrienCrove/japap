'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart, Clock, Download } from 'lucide-react';

export default function StatisticsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
          <p className="text-gray-600 mt-2">
            Pilotage de l'activité et reporting
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter le rapport
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart className="h-5 w-5" />
            <span>Rapports de Volume</span>
          </CardTitle>
          <CardDescription>
            Volume des alertes par catégorie, zone et période
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <BarChart className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Section en construction</h3>
            <p>Les graphiques de volume seront bientôt disponibles ici.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Analyse des Délais</span>
          </CardTitle>
          <CardDescription>
            Délais moyens : détection → validation → diffusion → expiration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <Clock className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Section en construction</h3>
            <p>L'analyse des délais de traitement sera bientôt disponible ici.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Performance des Modérateurs</span>
          </CardTitle>
          <CardDescription>
            Analyse des performances et respect des SLA par les équipes de modération
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <TrendingUp className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Section en construction</h3>
            <p>Les statistiques de performance des modérateurs seront bientôt disponibles ici.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}