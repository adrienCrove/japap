# Configuration Google Maps API pour JAPAP

Ce guide explique comment configurer Google Maps API pour activer le géocodage inversé (conversion de coordonnées GPS en adresses lisibles) dans l'application JAPAP.

## Pourquoi Google Maps API ?

Sur Android, `expo-location` utilise **Google Play Services** pour le géocodage inversé. Sans une clé API Google Maps valide configurée, vous obtiendrez l'erreur :

```
java.io.IOException: iebh: UNAVAILABLE
```

**Note importante :** L'application JAPAP fonctionne avec ou sans Google Maps API grâce au système de fallback. Sans API, les coordonnées GPS brutes seront affichées au lieu des adresses.

---

## Étape 1 : Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Notez le **Project ID** de votre projet

---

## Étape 2 : Activer les APIs nécessaires

1. Dans Google Cloud Console, allez dans **APIs & Services > Library**
2. Recherchez et activez les APIs suivantes :

   ### Pour Android :
   - ✅ **Maps SDK for Android**
   - ✅ **Geocoding API**
   - ✅ **Places API** (optionnel, pour l'autocomplétion d'adresses)

   ### Pour iOS :
   - ✅ **Maps SDK for iOS**
   - ✅ **Geocoding API**

3. Cliquez sur **Enable** pour chaque API

---

## Étape 3 : Créer une clé API

1. Allez dans **APIs & Services > Credentials**
2. Cliquez sur **Create Credentials > API Key**
3. Une nouvelle clé API sera générée (ex: `AIzaSyD...`)
4. **IMPORTANT :** Copiez immédiatement cette clé !

---

## Étape 4 : Restreindre la clé API (Recommandé)

Pour sécuriser votre clé API et éviter les abus :

### Restriction d'application (Android)

1. Cliquez sur votre clé API dans la liste
2. Sous **Application restrictions**, sélectionnez **Android apps**
3. Cliquez sur **Add an item**
4. Entrez :
   - **Package name :** `com.votre.japap` (trouvez-le dans app.json)
   - **SHA-1 certificate fingerprint :** Obtenez-le avec :
     ```bash
     # Pour debug
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

     # Pour release (production)
     keytool -list -v -keystore /path/to/your-release-key.keystore
     ```

### Restriction d'API

1. Sous **API restrictions**, sélectionnez **Restrict key**
2. Cochez uniquement :
   - ✅ Maps SDK for Android
   - ✅ Maps SDK for iOS
   - ✅ Geocoding API
   - ✅ Places API (si utilisé)

3. Cliquez sur **Save**

---

## Étape 5 : Configurer l'application JAPAP

### 5.1 Mettre à jour `app.json`

Ouvrez `japap/app.json` et remplacez `YOUR_GOOGLE_MAPS_API_KEY` par votre vraie clé :

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "AIzaSyD...VOTRE_CLE_ICI"
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSyD...VOTRE_CLE_ICI"
        }
      }
    }
  }
}
```

### 5.2 Rebuild l'application

Après avoir modifié `app.json`, vous devez reconstruire l'application :

```bash
# Supprimer le build précédent
rm -rf .expo

# Android
npx expo run:android

# iOS
npx expo run:ios
```

**Important :** Un simple rechargement (`r` dans le terminal) ne suffit pas, car les configurations natives doivent être régénérées.

---

## Étape 6 : Vérifier la configuration

### Test dans l'application

1. Lancez l'application sur un appareil physique (émulateur avec Google Play Services)
2. Allez dans la section de création d'alerte
3. Vérifiez les logs dans le terminal :

   **✅ Succès :**
   ```
   📍 Tentative de géocodage inversé pour: 48.8566, 2.3522
   ✅ Adresse trouvée: Avenue des Champs-Élysées, Paris, Île-de-France
   ```

   **❌ Échec (fallback activé) :**
   ```
   📍 Tentative de géocodage inversé pour: 48.8566, 2.3522
   ❌ Service de géocodage non disponible (Google Play Services manquant ou clé API invalide)
   ⚠️ Utilisation du fallback: Position GPS: 48.856600, 2.352200
   ```

### Test avec curl (Geocoding API)

Vous pouvez aussi tester directement l'API depuis votre terminal :

```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?latlng=48.8566,2.3522&key=VOTRE_CLE_API"
```

Réponse attendue :
```json
{
  "status": "OK",
  "results": [
    {
      "formatted_address": "...",
      ...
    }
  ]
}
```

---

## Dépannage

### Erreur : "UNAVAILABLE"

**Causes possibles :**
1. ❌ Clé API non configurée dans `app.json`
2. ❌ Application non rebuildée après modification de `app.json`
3. ❌ Google Play Services manquant sur l'appareil/émulateur
4. ❌ APIs non activées dans Google Cloud Console
5. ❌ Restrictions de clé API trop strictes
6. ❌ Quota API dépassé

**Solutions :**
1. ✅ Vérifiez que la clé est bien dans `app.json`
2. ✅ Rebuild l'application (`npx expo run:android`)
3. ✅ Utilisez un appareil réel ou un émulateur avec Google Play
4. ✅ Vérifiez que Geocoding API est activée
5. ✅ Temporairement, retirez les restrictions pour tester
6. ✅ Vérifiez les quotas dans Google Cloud Console

### Erreur : "API key not valid"

1. Vérifiez que vous avez copié la clé complète (commence par `AIza...`)
2. Vérifiez que les APIs sont bien activées
3. Vérifiez les restrictions d'API (essayez sans restriction d'abord)

### Erreur : "REQUEST_DENIED"

1. L'API Geocoding n'est pas activée
2. La clé API est restreinte et ne permet pas l'API Geocoding
3. Compte de facturation non configuré dans Google Cloud

### Timeout du géocodage

Si vous voyez constamment :
```
⏱️ Timeout du géocodage inversé après 5000ms
```

**Causes :**
1. Connexion internet lente/absente
2. Services Google Play surchargés
3. Quota API atteint

**Solution :** L'application utilisera automatiquement le fallback (coordonnées GPS).

---

## Quotas et tarification

### Quotas gratuits (Google Maps Platform)

- **Geocoding API :** $200 de crédit gratuit par mois
- Équivalent à **~40 000 requêtes gratuites par mois**
- Au-delà : $5 par 1000 requêtes

### Optimisation des coûts

L'application JAPAP est optimisée pour réduire les coûts :

1. ✅ **Cache local :** Les adresses récentes sont mises en cache
2. ✅ **Timeout de 5 secondes :** Évite les requêtes qui pendent
3. ✅ **Fallback automatique :** Si le géocodage échoue, on utilise les coordonnées GPS
4. ✅ **Demande uniquement quand nécessaire :** Pas de polling continu

### Monitoring des coûts

1. Allez dans [Google Cloud Console > Billing](https://console.cloud.google.com/billing)
2. Configurez des **alertes budgétaires** (ex: alerte à 80% de $200)
3. Surveillez l'utilisation dans **APIs & Services > Dashboard**

---

## Alternative : Géocodage côté serveur

Pour réduire encore plus les coûts ou éviter d'exposer la clé API, vous pouvez implémenter le géocodage côté backend :

### Avantages
- ✅ Clé API sécurisée (pas dans l'app mobile)
- ✅ Cache partagé entre tous les utilisateurs
- ✅ Meilleur contrôle des quotas
- ✅ Possibilité d'utiliser d'autres services (OpenStreetMap Nominatim, gratuit)

### Implémentation

1. Créer une route backend : `GET /api/geocode?lat=...&lng=...`
2. Le backend appelle Google Geocoding API
3. Le mobile appelle votre backend au lieu de Google directement

---

## Ressources

- [Google Maps Platform](https://developers.google.com/maps)
- [Geocoding API Documentation](https://developers.google.com/maps/documentation/geocoding)
- [Expo Location Documentation](https://docs.expo.dev/versions/latest/sdk/location/)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## Support

Pour toute question :
1. Vérifiez les logs dans le terminal (`console.log`)
2. Consultez ce guide étape par étape
3. Testez avec curl pour isoler le problème
4. Contactez l'équipe de développement JAPAP

---

**Note finale :** Grâce au système de fallback implémenté dans `locationService.ts`, l'application JAPAP fonctionne parfaitement même sans Google Maps API configurée. Les utilisateurs verront simplement des coordonnées GPS au lieu d'adresses lisibles.
