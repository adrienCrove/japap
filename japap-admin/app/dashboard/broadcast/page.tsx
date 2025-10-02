'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Link,
  Eye,
  Edit3,
  Send,
  Plus,
  Trash2,
  Settings,
  Instagram,
  MessageCircle,
  RefreshCw,
  BarChart3,
  ExternalLink,
  Globe
} from 'lucide-react';

interface SocialLink {
  id: string;
  name: string;
  url: string;
  platform: 'whatsapp' | 'telegram';
  isActive: boolean;
  lastScraped: string;
  contentCount: number;
}

interface CollectedContent {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  source: string;
  platform: 'whatsapp' | 'telegram';
  collectedAt: string;
  status: 'pending' | 'edited' | 'published';
}

interface BroadcastChannel {
  id: string;
  name: string;
  platform: 'instagram' | 'whatsapp';
  isConnected: boolean;
  followerCount?: number;
  lastPost?: string;
}

export default function BroadcastPage() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    {
      id: '1',
      name: 'Groupe Alertes Dakar',
      url: 'https://chat.whatsapp.com/...',
      platform: 'whatsapp',
      isActive: true,
      lastScraped: '2024-01-15 14:30',
      contentCount: 24
    }
  ]);

  const [collectedContent, setCollectedContent] = useState<CollectedContent[]>([
    {
      id: '1',
      title: 'Alerte trafic Avenue Bourguiba',
      content: 'Embouteillage important signalé sur l\'Avenue Bourguiba suite à un accident...',
      source: 'Groupe Alertes Dakar',
      platform: 'whatsapp',
      collectedAt: '2024-01-15 14:25',
      status: 'pending'
    }
  ]);

  const [broadcastChannels, setBroadcastChannels] = useState<BroadcastChannel[]>([
    {
      id: '1',
      name: 'JAPAP Official',
      platform: 'instagram',
      isConnected: false,
      followerCount: 2450
    },
    {
      id: '2',
      name: 'Canal Diffusion JAPAP',
      platform: 'whatsapp',
      isConnected: false,
      lastPost: '2024-01-14 09:15'
    }
  ]);

  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [newLink, setNewLink] = useState({ name: '', url: '', platform: 'whatsapp' as const });

  const addSocialLink = () => {
    if (newLink.name && newLink.url) {
      const link: SocialLink = {
        id: Date.now().toString(),
        name: newLink.name,
        url: newLink.url,
        platform: newLink.platform,
        isActive: true,
        lastScraped: 'Jamais',
        contentCount: 0
      };
      setSocialLinks([...socialLinks, link]);
      setNewLink({ name: '', url: '', platform: 'whatsapp' });
      setIsAddLinkOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Diffusion Multi-Plateformes</h1>
          <p className="text-gray-600 mt-2">
            Collectez du contenu depuis WhatsApp/Telegram et diffusez sur Instagram et WhatsApp
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser Contenu
          </Button>
          <Button className="bg-red-600 hover:bg-red-700">
            <Send className="h-4 w-4 mr-2" />
            Diffuser Maintenant
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sources" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sources">Liens Sources</TabsTrigger>
          <TabsTrigger value="content">Contenu Collecté</TabsTrigger>
          <TabsTrigger value="channels">Canaux Diffusion</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Gestion des Liens Sources */}
        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Link className="h-5 w-5" />
                    <span>Liens Sources à Surveiller</span>
                  </CardTitle>
                  <CardDescription>
                    Configurez les liens WhatsApp et Telegram à surveiller pour collecter du contenu
                  </CardDescription>
                </div>
                <Dialog open={isAddLinkOpen} onOpenChange={setIsAddLinkOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter Lien
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter un nouveau lien source</DialogTitle>
                      <DialogDescription>
                        Ajoutez un lien WhatsApp ou Telegram à surveiller pour la collecte de contenu
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="link-name">Nom du lien</Label>
                        <Input
                          id="link-name"
                          value={newLink.name}
                          onChange={(e) => setNewLink({...newLink, name: e.target.value})}
                          placeholder="Ex: Groupe Alertes Dakar"
                        />
                      </div>
                      <div>
                        <Label htmlFor="link-url">URL du lien</Label>
                        <Input
                          id="link-url"
                          value={newLink.url}
                          onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                          placeholder="https://chat.whatsapp.com/..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="platform">Plateforme</Label>
                        <select
                          id="platform"
                          value={newLink.platform}
                          onChange={(e) => setNewLink({...newLink, platform: e.target.value as 'whatsapp' | 'telegram'})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          <option value="whatsapp">WhatsApp</option>
                          <option value="telegram">Telegram</option>
                        </select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsAddLinkOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={addSocialLink}>
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {socialLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {link.platform === 'whatsapp' ? (
                          <MessageCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Globe className="h-5 w-5 text-blue-600" />
                        )}
                        <div>
                          <h4 className="font-medium">{link.name}</h4>
                          <p className="text-sm text-gray-500 flex items-center">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {link.url.substring(0, 50)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={link.isActive ? "default" : "secondary"}>
                          {link.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                        <Badge variant="outline">
                          {link.contentCount} contenus
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>Dernier scan: {link.lastScraped}</span>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contenu Collecté */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Contenu Collecté</span>
              </CardTitle>
              <CardDescription>
                Contenu récupéré depuis vos liens sources - Éditez avant diffusion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collectedContent.map((content) => (
                  <div key={content.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant={content.status === 'pending' ? 'secondary' : content.status === 'edited' ? 'default' : 'outline'}>
                          {content.status === 'pending' ? 'En attente' : content.status === 'edited' ? 'Édité' : 'Publié'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {content.platform === 'whatsapp' ? 'WhatsApp' : 'Telegram'} • {content.collectedAt}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <h4 className="font-medium mb-2">{content.title}</h4>
                    <p className="text-gray-600 text-sm mb-2">{content.content}</p>
                    <p className="text-xs text-gray-400">Source: {content.source}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Canaux de Diffusion */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <span>Canaux de Diffusion</span>
              </CardTitle>
              <CardDescription>
                Configurez vos comptes Instagram et canaux WhatsApp pour la diffusion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {broadcastChannels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {channel.platform === 'instagram' ? (
                        <Instagram className="h-6 w-6 text-pink-600" />
                      ) : (
                        <MessageCircle className="h-6 w-6 text-green-600" />
                      )}
                      <div>
                        <h4 className="font-medium">{channel.name}</h4>
                        <p className="text-sm text-gray-500">
                          {channel.platform === 'instagram'
                            ? `${channel.followerCount} abonnés`
                            : `Dernier post: ${channel.lastPost}`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={channel.isConnected ? "default" : "secondary"}>
                        {channel.isConnected ? 'Connecté' : 'Non connecté'}
                      </Badge>
                      <Switch checked={channel.isConnected} />
                      <Button variant="outline" size="sm">
                        Configurer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Analytics & Performance</span>
              </CardTitle>
              <CardDescription>
                Statistiques de collecte et performance des diffusions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="text-2xl font-bold text-blue-600">24</h3>
                  <p className="text-sm text-gray-600">Contenus collectés (7j)</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="text-2xl font-bold text-green-600">12</h3>
                  <p className="text-sm text-gray-600">Publications diffusées</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="text-2xl font-bold text-purple-600">87%</h3>
                  <p className="text-sm text-gray-600">Taux d'engagement moyen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}