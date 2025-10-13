'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { login } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.emailOrPhone.trim()) {
      toast.error('Email ou numéro de téléphone requis');
      return;
    }

    if (!formData.password.trim()) {
      toast.error('Mot de passe requis');
      return;
    }

    setLoading(true);

    try {
      const response = await login({
        emailOrPhone: formData.emailOrPhone,
        password: formData.password
      });

      if (response.success && response.user) {
        // Vérifier que l'utilisateur a le rôle admin ou moderator
        if (response.user.role === 'admin' || response.user.role === 'moderator') {
          toast.success('Connexion réussie', {
            description: `Bienvenue ${response.user.name || response.user.phone}`
          });
          router.push('/dashboard');
        } else {
          toast.error('Accès refusé', {
            description: 'Vous devez être administrateur ou modérateur pour accéder au dashboard'
          });
        }
      } else {
        toast.error('Erreur de connexion', {
          description: response.error || 'Identifiants invalides'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">JAPAP Admin</h1>
          <p className="text-gray-600 mt-2">
            Connectez-vous pour accéder au tableau de bord
          </p>
        </div>

        {/* Login Card */}
        <Card>
         
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="emailOrPhone">Email ou Téléphone</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="emailOrPhone"
                    type="text"
                    placeholder="admin@example.com ou +237 6XX XXX XXX"
                    value={formData.emailOrPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emailOrPhone: e.target.value }))}
                    className="pl-10"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Votre mot de passe"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800">
                  Seuls les administrateurs et modérateurs peuvent accéder au dashboard.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Se connecter
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            JAPAP - Plateforme de signalement d&apos;incidents
          </p>
        </div>
      </div>
    </div>
  );
}
