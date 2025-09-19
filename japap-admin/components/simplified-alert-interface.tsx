'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SIMPLIFIED_CATEGORIES, getCategoryByCode } from '@/lib/enhanced-categories';
import { MessageSquare, Send, AlertTriangle } from 'lucide-react';

interface SimplifiedAlertInterfaceProps {
  onSubmit: (data: any) => void;
  platform?: 'whatsapp' | 'telegram' | 'sms';
}

export default function SimplifiedAlertInterface({ 
  onSubmit, 
  platform = 'whatsapp' 
}: SimplifiedAlertInterfaceProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [senderPhone, setSenderPhone] = useState<string>('');

  const handleCategorySelect = (categoryCode: string) => {
    setSelectedCategory(categoryCode);
    const category = getCategoryByCode(categoryCode);
    if (category) {
      // Pré-remplir avec un template selon la catégorie
      const template = getMessageTemplate(categoryCode);
      setMessage(template);
    }
  };

  const getMessageTemplate = (categoryCode: string): string => {
    const templates: Record<string, string> = {
      'MEDC': 'URGENCE MÉDICALE\nVictime: [âge/genre]\nÉtat: [conscient/inconscient]\nSymptômes: [description]\nLieu: ',
      'FIRV': 'INCENDIE AVEC VICTIMES\nTaille: [petit/moyen/grand]\nVictimes: [nombre]\nLieu: ',
      'ACCG': 'ACCIDENT GRAVE\nVéhicules: [type et nombre]\nBlessés: [nombre]\nRoute bloquée: [oui/non]\nLieu: ',
      'ASGC': 'AGRESSION EN COURS\nType: [vol/agression]\nArme: [oui/non]\nNombre suspects: [nombre]\nLieu: ',
      'VOL': 'VOL/CAMBRIOLAGE\nType: [description]\nSuspects: [description]\nLieu: ',
      'DIS': 'DISPARITION\nNom: [nom complet]\nÂge: [âge]\nDernière localisation: ',
      'ELEC': 'PANNE ÉLECTRICITÉ\nZone affectée: [quartier]\nDepuis: [heure]\nLieu: ',
      'EAU': 'PANNE EAU\nZone affectée: [quartier]\nDepuis: [heure]\nLieu: ',
      'ROU': 'ROUTE BLOQUÉE\nCause: [accident/travaux/autre]\nAlternative: [oui/non]\nLieu: ',
      'ANI': 'ANIMAL DANGEREUX\nType: [description]\nComportement: [agressif/errant]\nLieu: '
    };
    
    return templates[categoryCode] || 'Description de l\'incident:\n\nLieu: ';
  };

  const handleSubmit = () => {
    if (!selectedCategory || !message.trim() || !location.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const category = getCategoryByCode(selectedCategory);
    if (!category) return;

    const alertData = {
      category: category.name,
      categoryCode: selectedCategory,
      severity: category.defaultSeverity,
      description: message,
      location: {
        address: location,
        coordinates: [0, 0] // À déterminer par géocodage
      },
      source: platform,
      status: 'pending',
      rawMessage: message,
      senderPhone: senderPhone,
      priority: category.priority,
      emergencyServices: category.emergencyServices
    };

    onSubmit(alertData);
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case 'whatsapp': return '📱';
      case 'telegram': return '✈️';
      case 'sms': return '💬';
      default: return '📱';
    }
  };

  const getPlatformColor = () => {
    switch (platform) {
      case 'whatsapp': return 'bg-green-100 text-green-800';
      case 'telegram': return 'bg-blue-100 text-blue-800';
      case 'sms': return 'bg-gray-100 text-gray-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Header Platform */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Interface {platform.toUpperCase()}</span>
            <Badge className={getPlatformColor()}>
              {getPlatformIcon()} {platform}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Numéro expéditeur */}
      <Card>
        <CardContent className="pt-4">
          <Input
            placeholder="Numéro de téléphone (+237...)"
            value={senderPhone}
            onChange={(e) => setSenderPhone(e.target.value)}
            className="text-sm"
          />
        </CardContent>
      </Card>

      {/* Sélection rapide catégorie */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Type d&apos;urgence</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Urgences Vitales */}
          <div>
            <p className="text-xs font-semibold text-red-600 mb-2">🚨 URGENCES</p>
            <div className="grid grid-cols-1 gap-1">
              {SIMPLIFIED_CATEGORIES.urgent.map((cat) => (
                <Button
                  key={cat.code}
                  variant={selectedCategory === cat.code ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategorySelect(cat.code)}
                  className={`justify-start text-xs h-8 ${
                    selectedCategory === cat.code 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'border-red-200 text-red-700 hover:bg-red-50'
                  }`}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Urgences Sécuritaires */}
          <div>
            <p className="text-xs font-semibold text-orange-600 mb-2">⚠️ SÉCURITÉ</p>
            <div className="grid grid-cols-1 gap-1">
              {SIMPLIFIED_CATEGORIES.security.map((cat) => (
                <Button
                  key={cat.code}
                  variant={selectedCategory === cat.code ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategorySelect(cat.code)}
                  className={`justify-start text-xs h-8 ${
                    selectedCategory === cat.code 
                      ? 'bg-orange-600 hover:bg-orange-700' 
                      : 'border-orange-200 text-orange-700 hover:bg-orange-50'
                  }`}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Alertes Communautaires */}
          <div>
            <p className="text-xs font-semibold text-yellow-600 mb-2">ℹ️ COMMUNAUTÉ</p>
            <div className="grid grid-cols-1 gap-1">
              {SIMPLIFIED_CATEGORIES.community.map((cat) => (
                <Button
                  key={cat.code}
                  variant={selectedCategory === cat.code ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategorySelect(cat.code)}
                  className={`justify-start text-xs h-8 ${
                    selectedCategory === cat.code 
                      ? 'bg-yellow-600 hover:bg-yellow-700' 
                      : 'border-yellow-200 text-yellow-700 hover:bg-yellow-50'
                  }`}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Message</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Décrivez la situation..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="text-sm resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {message.length}/500 caractères
          </p>
        </CardContent>
      </Card>

      {/* Localisation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Localisation</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Adresse ou lieu précis..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="text-sm"
          />
        </CardContent>
      </Card>

      {/* Informations catégorie sélectionnée */}
      {selectedCategory && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            {(() => {
              const category = getCategoryByCode(selectedCategory);
              return category ? (
                <div className="text-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-blue-900">
                      {category.icon} {category.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {category.code}
                    </Badge>
                  </div>
                  <p className="text-blue-700 text-xs mb-2">
                    {category.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {category.emergencyServices.map(service => (
                      <span 
                        key={service} 
                        className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </CardContent>
        </Card>
      )}

      {/* Bouton envoi */}
      <Button 
        onClick={handleSubmit}
        disabled={!selectedCategory || !message.trim() || !location.trim()}
        className="w-full"
        size="lg"
      >
        <Send className="h-4 w-4 mr-2" />
        Envoyer le signalement
      </Button>

      {/* Aide */}
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="pt-4">
          <p className="text-xs text-gray-600">
            💡 <strong>Conseil:</strong> Plus votre description est précise, 
            plus l&apos;intervention sera efficace. Indiquez l&apos;heure, 
            le nombre de personnes impliquées, et tout détail utile.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

