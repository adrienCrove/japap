'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Globe,
  AlertTriangle
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
  platform: 'instagram' | 'whatsapp' | 'telegram';
  credentials: {
    channelId?: string;
    accessToken?: string;
    botToken?: string;
    channelUsername?: string;
    username?: string;
  };
  isActive: boolean;
  followerCount?: number;
  lastBroadcast?: string;
  broadcastCount: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function BroadcastPage() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(true);

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

  const [broadcastChannels, setBroadcastChannels] = useState<BroadcastChannel[]>([]);

  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [newLink, setNewLink] = useState({
    name: '',
    url: '',
    sourceType: 'social' as 'social' | 'website' | 'rss',
    platform: 'whatsapp'
  });

  const [isAddChannelOpen, setIsAddChannelOpen] = useState(false);
  const [isEditChannelOpen, setIsEditChannelOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<BroadcastChannel | null>(null);
  const [newChannel, setNewChannel] = useState({
    name: '',
    platform: 'whatsapp' as 'whatsapp' | 'telegram' | 'instagram',
    credentials: {
      channelId: '',
      accessToken: '',
      botToken: '',
      channelUsername: '',
      username: ''
    },
    followerCount: 0
  });

  useEffect(() => {
    loadSocialLinks();
    loadBroadcastChannels();
  }, []);

  const loadSocialLinks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/social-links`);
      const data = await response.json();

      if (data.success && data.data) {
        const formattedLinks = data.data.map((link: any) => ({
          ...link,
          lastScraped: link.lastScraped
            ? new Date(link.lastScraped).toLocaleString('fr-FR')
            : 'Jamais'
        }));
        setSocialLinks(formattedLinks);
      }
    } catch (error) {
      console.error('Error loading social links:', error);
      toast.error('Impossible de charger les liens');
    } finally {
      setLoading(false);
    }
  };

  const addSocialLink = async () => {
    if (!newLink.name || !newLink.url) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/social-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLink)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Lien ajouté avec succès');
        loadSocialLinks();
        setNewLink({ name: '', url: '', sourceType: 'social', platform: 'whatsapp' });
        setIsAddLinkOpen(false);
      } else {
        toast.error(data.error || 'Erreur lors de l\'ajout du lien');
      }
    } catch (error) {
      console.error('Error adding social link:', error);
      toast.error('Erreur lors de l\'ajout du lien');
    }
  };

  const deleteSocialLink = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/social-links/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Lien supprimé avec succès');
        loadSocialLinks();
      } else {
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting social link:', error);
      toast.error('Erreur lors de la suppression du lien');
    }
  };

  const loadBroadcastChannels = async () => {
    setLoadingChannels(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/broadcast-channels`);
      const data = await response.json();

      if (data.success && data.data) {
        setBroadcastChannels(data.data);
      }
    } catch (error) {
      console.error('Error loading broadcast channels:', error);
      toast.error('Impossible de charger les canaux');
    } finally {
      setLoadingChannels(false);
    }
  };

  const addBroadcastChannel = async () => {
    if (!newChannel.name || !newChannel.platform) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    // Validation des credentials selon la plateforme
    const { platform, credentials } = newChannel;
    if (platform === 'whatsapp' && (!credentials.channelId || !credentials.accessToken)) {
      toast.error('WhatsApp nécessite Channel ID et Access Token');
      return;
    }
    if (platform === 'telegram' && (!credentials.botToken || !credentials.channelUsername)) {
      toast.error('Telegram nécessite Bot Token et Channel Username');
      return;
    }
    if (platform === 'instagram' && (!credentials.username || !credentials.accessToken)) {
      toast.error('Instagram nécessite Username et Access Token');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/broadcast-channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChannel)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Canal ajouté avec succès');
        loadBroadcastChannels();
        setNewChannel({
          name: '',
          platform: 'whatsapp',
          credentials: {
            channelId: '',
            accessToken: '',
            botToken: '',
            channelUsername: '',
            username: ''
          },
          followerCount: 0
        });
        setIsAddChannelOpen(false);
      } else {
        toast.error(data.error || 'Erreur lors de l\'ajout du canal');
      }
    } catch (error) {
      console.error('Error adding broadcast channel:', error);
      toast.error('Erreur lors de l\'ajout du canal');
    }
  };

  const toggleChannel = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/broadcast-channels/${id}/toggle`, {
        method: 'PATCH'
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        loadBroadcastChannels();
      } else {
        toast.error(data.error || 'Erreur lors du changement d\'état');
      }
    } catch (error) {
      console.error('Error toggling channel:', error);
      toast.error('Erreur lors du changement d\'état');
    }
  };

  const openEditChannel = (channel: BroadcastChannel) => {
    setEditingChannel(channel);
    setIsEditChannelOpen(true);
  };

  const updateBroadcastChannel = async () => {
    if (!editingChannel) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/broadcast-channels/${editingChannel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingChannel.name,
          credentials: editingChannel.credentials,
          followerCount: editingChannel.followerCount
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Canal modifié avec succès');
        loadBroadcastChannels();
        setIsEditChannelOpen(false);
        setEditingChannel(null);
      } else {
        toast.error(data.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Error updating channel:', error);
      toast.error('Erreur lors de la modification du canal');
    }
  };

  const openDeleteDialog = (id: string) => {
    setChannelToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteChannel = async () => {
    if (!channelToDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/broadcast-channels/${channelToDelete}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Canal supprimé avec succès');
        loadBroadcastChannels();
        setIsDeleteDialogOpen(false);
        setChannelToDelete(null);
      } else {
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting channel:', error);
      toast.error('Erreur lors de la suppression du canal');
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
                        <Label htmlFor="sourceType">Type de source</Label>
                        <Select
                          value={newLink.sourceType}
                          onValueChange={(value: 'social' | 'website' | 'rss') => setNewLink({...newLink, sourceType: value, platform: value === 'social' ? 'whatsapp' : value === 'website' ? 'news-site' : 'rss-feed'})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="social">Réseau social</SelectItem>
                            <SelectItem value="website">Site web</SelectItem>
                            <SelectItem value="rss">Flux RSS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {newLink.sourceType === 'social' && (
                        <div>
                          <Label htmlFor="platform">Plateforme</Label>
                          <Select
                            value={newLink.platform}
                            onValueChange={(value) => setNewLink({...newLink, platform: value})}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Sélectionner une plateforme" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="telegram">Telegram</SelectItem>
                              <SelectItem value="facebook">Facebook</SelectItem>
                              <SelectItem value="instagram">Instagram</SelectItem>
                              <SelectItem value="x">X (Twitter)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddLinkOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={addSocialLink}>
                        Ajouter
                      </Button>
                    </DialogFooter>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Êtes-vous sûr de vouloir supprimer ce lien ?')) {
                              deleteSocialLink(link.id);
                            }
                          }}
                        >
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
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Send className="h-5 w-5" />
                    <span>Canaux de Diffusion</span>
                  </CardTitle>
                  <CardDescription>
                    Configurez vos canaux WhatsApp, Telegram et Instagram pour diffuser les alertes
                  </CardDescription>
                </div>
                <Dialog open={isAddChannelOpen} onOpenChange={setIsAddChannelOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter Canal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter un canal de diffusion</DialogTitle>
                      <DialogDescription>
                        Configurez un nouveau canal pour diffuser vos alertes
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="channel-name">Nom du canal</Label>
                        <Input
                          id="channel-name"
                          value={newChannel.name}
                          onChange={(e) => setNewChannel({...newChannel, name: e.target.value})}
                          placeholder="Ex: Canal WhatsApp JAPAP"
                        />
                      </div>
                      <div>
                        <Label htmlFor="channel-platform">Plateforme</Label>
                        <Select
                          value={newChannel.platform}
                          onValueChange={(value: 'whatsapp' | 'telegram' | 'instagram') => setNewChannel({...newChannel, platform: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Sélectionner une plateforme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="telegram">Telegram</SelectItem>
                            <SelectItem value="instagram">Instagram</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {newChannel.platform === 'whatsapp' && (
                        <>
                          <div>
                            <Label htmlFor="whatsapp-channelId">Channel ID</Label>
                            <Input
                              id="whatsapp-channelId"
                              value={newChannel.credentials.channelId}
                              onChange={(e) => setNewChannel({...newChannel, credentials: {...newChannel.credentials, channelId: e.target.value}})}
                              placeholder="123456789"
                            />
                          </div>
                          <div>
                            <Label htmlFor="whatsapp-token">Access Token</Label>
                            <Input
                              id="whatsapp-token"
                              type="password"
                              value={newChannel.credentials.accessToken}
                              onChange={(e) => setNewChannel({...newChannel, credentials: {...newChannel.credentials, accessToken: e.target.value}})}
                              placeholder="EAAxxxxx..."
                            />
                          </div>
                        </>
                      )}

                      {newChannel.platform === 'telegram' && (
                        <>
                          <div>
                            <Label htmlFor="telegram-botToken">Bot Token</Label>
                            <Input
                              id="telegram-botToken"
                              type="password"
                              value={newChannel.credentials.botToken}
                              onChange={(e) => setNewChannel({...newChannel, credentials: {...newChannel.credentials, botToken: e.target.value}})}
                              placeholder="123456:ABC-DEF..."
                            />
                          </div>
                          <div>
                            <Label htmlFor="telegram-channelUsername">Channel Username</Label>
                            <Input
                              id="telegram-channelUsername"
                              value={newChannel.credentials.channelUsername}
                              onChange={(e) => setNewChannel({...newChannel, credentials: {...newChannel.credentials, channelUsername: e.target.value}})}
                              placeholder="@mon_canal"
                            />
                          </div>
                        </>
                      )}

                      {newChannel.platform === 'instagram' && (
                        <>
                          <div>
                            <Label htmlFor="instagram-username">Username</Label>
                            <Input
                              id="instagram-username"
                              value={newChannel.credentials.username}
                              onChange={(e) => setNewChannel({...newChannel, credentials: {...newChannel.credentials, username: e.target.value}})}
                              placeholder="japap_official"
                            />
                          </div>
                          <div>
                            <Label htmlFor="instagram-token">Access Token</Label>
                            <Input
                              id="instagram-token"
                              type="password"
                              value={newChannel.credentials.accessToken}
                              onChange={(e) => setNewChannel({...newChannel, credentials: {...newChannel.credentials, accessToken: e.target.value}})}
                              placeholder="IGQVJxxxxx..."
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <Label htmlFor="followerCount">Nombre d&apos;abonnés (optionnel)</Label>
                        <Input
                          id="followerCount"
                          type="number"
                          value={newChannel.followerCount || ''}
                          onChange={(e) => setNewChannel({...newChannel, followerCount: parseInt(e.target.value) || 0})}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddChannelOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={addBroadcastChannel}>
                        Ajouter
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingChannels ? (
                <div className="text-center py-8 text-gray-500">Chargement...</div>
              ) : broadcastChannels.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun canal configuré. Ajoutez votre premier canal de diffusion.
                </div>
              ) : (
                <div className="space-y-4">
                  {broadcastChannels.map((channel) => (
                    <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {channel.platform === 'instagram' ? (
                          <Instagram className="h-6 w-6 text-pink-600" />
                        ) : channel.platform === 'telegram' ? (
                          <MessageCircle className="h-6 w-6 text-blue-600" />
                        ) : (
                          <MessageCircle className="h-6 w-6 text-green-600" />
                        )}
                        <div>
                          <h4 className="font-medium">{channel.name}</h4>
                          <p className="text-sm text-gray-500">
                            {channel.followerCount ? `${channel.followerCount} abonnés` : ''}
                            {channel.lastBroadcast && ` • Dernière diffusion: ${new Date(channel.lastBroadcast).toLocaleDateString('fr-FR')}`}
                          </p>
                          <p className="text-xs text-gray-400">
                            {channel.broadcastCount} diffusion(s) effectuée(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={channel.isActive ? "default" : "secondary"}>
                          {channel.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                        <Switch
                          checked={channel.isActive}
                          onCheckedChange={() => toggleChannel(channel.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditChannel(channel)}
                          title="Modifier"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(channel.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Dialog d'édition de canal */}
      <Dialog open={isEditChannelOpen} onOpenChange={setIsEditChannelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le canal</DialogTitle>
            <DialogDescription>
              Modifiez les informations du canal de diffusion
            </DialogDescription>
          </DialogHeader>
          {editingChannel && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-channel-name">Nom du canal</Label>
                <Input
                  id="edit-channel-name"
                  value={editingChannel.name}
                  onChange={(e) => setEditingChannel({...editingChannel, name: e.target.value})}
                />
              </div>

              <div>
                <Label>Plateforme</Label>
                <Input value={editingChannel.platform} disabled className="bg-gray-100" />
                <p className="text-xs text-gray-500 mt-1">La plateforme ne peut pas être modifiée</p>
              </div>

              {editingChannel.platform === 'telegram' && (
                <>
                  <div>
                    <Label htmlFor="edit-telegram-botToken">Bot Token</Label>
                    <Input
                      id="edit-telegram-botToken"
                      type="password"
                      value={editingChannel.credentials.botToken || ''}
                      onChange={(e) => setEditingChannel({
                        ...editingChannel,
                        credentials: {...editingChannel.credentials, botToken: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-telegram-channelUsername">Channel Username</Label>
                    <Input
                      id="edit-telegram-channelUsername"
                      value={editingChannel.credentials.channelUsername || ''}
                      onChange={(e) => setEditingChannel({
                        ...editingChannel,
                        credentials: {...editingChannel.credentials, channelUsername: e.target.value}
                      })}
                      placeholder="@mon_canal"
                    />
                  </div>
                </>
              )}

              {editingChannel.platform === 'whatsapp' && (
                <>
                  <div>
                    <Label htmlFor="edit-whatsapp-channelId">Channel ID</Label>
                    <Input
                      id="edit-whatsapp-channelId"
                      value={editingChannel.credentials.channelId || ''}
                      onChange={(e) => setEditingChannel({
                        ...editingChannel,
                        credentials: {...editingChannel.credentials, channelId: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-whatsapp-token">Access Token</Label>
                    <Input
                      id="edit-whatsapp-token"
                      type="password"
                      value={editingChannel.credentials.accessToken || ''}
                      onChange={(e) => setEditingChannel({
                        ...editingChannel,
                        credentials: {...editingChannel.credentials, accessToken: e.target.value}
                      })}
                    />
                  </div>
                </>
              )}

              {editingChannel.platform === 'instagram' && (
                <>
                  <div>
                    <Label htmlFor="edit-instagram-username">Username</Label>
                    <Input
                      id="edit-instagram-username"
                      value={editingChannel.credentials.username || ''}
                      onChange={(e) => setEditingChannel({
                        ...editingChannel,
                        credentials: {...editingChannel.credentials, username: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-instagram-token">Access Token</Label>
                    <Input
                      id="edit-instagram-token"
                      type="password"
                      value={editingChannel.credentials.accessToken || ''}
                      onChange={(e) => setEditingChannel({
                        ...editingChannel,
                        credentials: {...editingChannel.credentials, accessToken: e.target.value}
                      })}
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="edit-followerCount">Nombre d&apos;abonnés (optionnel)</Label>
                <Input
                  id="edit-followerCount"
                  type="number"
                  value={editingChannel.followerCount || ''}
                  onChange={(e) => setEditingChannel({
                    ...editingChannel,
                    followerCount: parseInt(e.target.value) || 0
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditChannelOpen(false)}>
              Annuler
            </Button>
            <Button onClick={updateBroadcastChannel}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce canal de diffusion ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">
              Toutes les statistiques de diffusion associées seront également supprimées.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteChannel}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}