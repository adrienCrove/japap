# Guide de démarrage rapide - Couche de trafic

## 🚀 Démarrage rapide en 3 étapes

### 1. Obtenir une clé API Google Maps

```bash
# Visitez : https://console.cloud.google.com/
# 1. Créez un projet
# 2. Activez "Maps JavaScript API"
# 3. Créez une clé API
```

### 2. Configurer l'environnement

```bash
# Copiez le fichier d'exemple
cp .env.example .env.local

# Éditez .env.local et ajoutez votre clé :
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="votre_cle_ici"
```

### 3. Ajouter le script Google Maps

Dans `app/layout.tsx`, ajoutez :

```tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 4. Tester

```bash
npm run dev
# Naviguez vers : http://localhost:3000/dashboard/map
# Activez le toggle "Trafic" dans la légende
```

## ✅ Vérification

- [ ] Clé API Google Maps configurée
- [ ] Script Google Maps chargé dans layout.tsx
- [ ] Variable d'environnement NEXT_PUBLIC_GOOGLE_MAPS_API_KEY définie
- [ ] Dashboard démarré avec `npm run dev`
- [ ] Page /dashboard/map accessible
- [ ] Toggle "Trafic" visible dans la légende

## 🔍 Dépannage express

**Pas de trafic visible ?**
- Vérifiez la console (F12) pour les erreurs
- Zoomez sur une grande ville (zoom 13-15)
- Vérifiez que votre clé API est valide
- Assurez-vous que Maps JavaScript API est activée

**Erreur "Google is not defined" ?**
- Vérifiez que le script est dans layout.tsx
- Redémarrez le serveur de développement

## 📚 Documentation complète

Pour plus de détails, consultez [TRAFFIC_LAYER_README.md](./TRAFFIC_LAYER_README.md)
