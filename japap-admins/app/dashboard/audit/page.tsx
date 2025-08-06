'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, User, AlertTriangle } from 'lucide-react';

export default function AuditPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Journal & Sécurité</h1>
          <p className="text-gray-600 mt-2">
            Traçabilité des actions et conformité
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter les journaux
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Journal d'Audit</span>
          </CardTitle>
          <CardDescription>
            Historique des actions effectuées sur la plateforme (qui, quoi, quand)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <FileText className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Section en construction</h3>
            <p>Le journal d'audit complet sera bientôt disponible ici.</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Conformité RGPD</span>
          </CardTitle>
          <CardDescription>
            Gestion des consentements et des demandes d'accès ou de suppression
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <User className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Section en construction</h3>
            <p>Les outils de conformité RGPD seront bientôt disponibles ici.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Alertes de Sécurité</span>
          </CardTitle>
          <CardDescription>
            Journal des événements de sécurité (IP suspecte, volume anormal, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Section en construction</h3>
            <p>Les alertes de sécurité seront bientôt disponibles ici.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}