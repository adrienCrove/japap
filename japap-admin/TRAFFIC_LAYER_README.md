# Configuration de la couche de trafic Google Maps

## Vue d'ensemble

La fonctionnalité de visualisation du trafic en temps réel a été ajoutée au dashboard admin JAPAP. Elle utilise Google Maps Traffic Layer via le plugin `leaflet.gridlayer.googlemutant`.

## Fonctionnalités

- **Toggle ON/OFF** : Un switch dans la légende de la carte permet d'activer/désactiver l'affichage du trafic
- **Trafic en temps réel** : Les données de trafic sont actualisées automatiquement par Google Maps
- **Superposition** : La couche de trafic se superpose à OpenStreetMap sans masquer les alertes et zones existantes
- **Code couleur** :
  - 🟢 Vert : Trafic fluide
  - 🟡 Jaune/Orange : Trafic ralenti
  - 🔴 Rouge : Trafic dense/embouteillages

## Configuration de l'API Google Maps

### Étape 1 : Obtenir une clé API Google Maps

1. Accédez à [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API "Maps JavaScript API"
4. Créez des identifiants (clé API)
5. Restreignez la clé API pour plus de sécurité :
   - Restreindre par domaine (ajoutez vos domaines autorisés)
   - Restreindre les APIs autorisées (sélectionnez uniquement "Maps JavaScript API")

### Étape 2 : Configuration de l'environnement

Ajoutez votre clé API Google Maps dans le fichier `.env.local` :

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=votre_cle_api_ici
```

**⚠️ Important** :
- Ne commitez JAMAIS votre fichier `.env.local` contenant la clé API
- Ajoutez `.env.local` à votre `.gitignore`
- En production, configurez la clé API via les variables d'environnement de votre plateforme d'hébergement

### Étape 3 : Chargement du script Google Maps

Le script Google Maps doit être chargé dans le document. Ajoutez ceci dans `app/layout.tsx` ou dans `_document.tsx` :

```tsx
import Script from 'next/script'

// Dans votre composant Layout ou _document
<Script
  src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
  strategy="beforeInteractive"
/>
```

## Utilisation

### Dans le dashboard admin

1. Naviguez vers la page **Carte & Zones** (`/dashboard/map`)
2. Dans la légende en bas à droite de la carte, vous trouverez un nouveau contrôle "Trafic"
3. Activez le switch pour afficher la couche de trafic
4. Désactivez-le pour masquer la couche

### Zoom recommandé

Pour une meilleure visualisation du trafic, utilisez un niveau de zoom entre 12 et 18 (vues de ville ou quartier).

## Dépannage

### La couche de trafic ne s'affiche pas

1. **Vérifiez la clé API** : Assurez-vous que votre clé API Google Maps est valide et configurée
2. **Vérifiez la console** : Ouvrez la console du navigateur (F12) pour voir les erreurs éventuelles
3. **Vérifiez les quotas** : Assurez-vous que votre compte Google Cloud n'a pas dépassé les quotas gratuits
4. **Vérifiez les restrictions** : Si vous avez restreint votre clé API, assurez-vous que le domaine actuel est autorisé

### Erreur "Google is not defined"

Le script Google Maps n'est pas chargé. Vérifiez que vous avez ajouté le script dans `layout.tsx` ou `_document.tsx`.

### La couche de trafic ne se met pas à jour

Le trafic est mis à jour automatiquement par Google. Si vous ne voyez pas de changement, c'est probablement parce que le trafic est réellement stable dans la zone affichée.

## Limitations

- **Couverture géographique** : Google Maps Traffic Layer ne couvre pas toutes les régions avec la même précision. La couverture au Cameroun peut être partielle
- **Quotas API** : Google Maps impose des quotas d'utilisation. Plan gratuit : 28,000 chargements de carte par mois
- **Nécessite une connexion Internet** : La couche de trafic ne fonctionne pas hors ligne

## Désactivation

Si vous souhaitez désactiver temporairement la fonctionnalité de trafic :

1. Dans `app/dashboard/map/page.tsx`, changez :
```tsx
const [showTraffic, setShowTraffic] = useState(false); // Déjà désactivé par défaut
```

2. Ou supprimez le contrôle de la légende dans `components/map/LeafletMap.tsx`

## Coûts

- **Plan gratuit Google Maps** : 28,000 chargements de carte/mois (environ $200 de crédit gratuit)
- **Au-delà** : $7 pour 1,000 chargements supplémentaires
- **Recommandation** : Configurez des alertes de facturation dans Google Cloud Console

## Support

Pour toute question ou problème :
1. Consultez la [documentation officielle de Google Maps Platform](https://developers.google.com/maps/documentation)
2. Vérifiez les [limites et quotas](https://developers.google.com/maps/documentation/javascript/usage-and-billing)
3. Contactez l'équipe de développement JAPAP

---

**Date de mise en œuvre** : Janvier 2025
**Version** : 1.0.0
