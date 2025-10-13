# Configuration du Bot Telegram pour JAPAP

## 1. Créer un Bot Telegram

1. Ouvrir Telegram et chercher **@BotFather**
2. Envoyer `/newbot`
3. Suivre les instructions pour nommer votre bot
4. Copier le **token** fourni (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

## 2. Configurer le fichier .env

Ajouter le token dans votre fichier `.env` :

```env
TELEGRAM_BOT_TOKEN=votre_token_ici
NODE_ENV=development
```

## 3. Ajouter le Bot à votre Canal

1. Créer un canal Telegram ou utiliser un existant
2. Aller dans les paramètres du canal → Administrateurs
3. Ajouter votre bot comme administrateur
4. Lui donner les permissions "Publier des messages"

## 4. Récupérer l'ID du Canal

### Option A : Via le Bot
1. Poster un message dans le canal
2. Consulter les logs du backend JAPAP
3. Le `channelId` sera affiché dans les logs

### Option B : Via Web
1. Ouvrir le canal sur Telegram Web (web.telegram.org)
2. L'URL ressemblera à : `https://web.telegram.org/z/#-1001234567890`
3. L'ID du canal est le nombre après `#-` (ex: `-1001234567890`)

## 5. Enregistrer le Canal dans JAPAP

Utiliser l'interface admin pour ajouter une nouvelle source surveillée :

1. Aller dans **Dashboard → Diffusion → Liens & Sources**
2. Cliquer sur **Ajouter un lien**
3. Remplir :
   - **Nom** : Nom du canal (ex: "NZUIMANTO1")
   - **URL** : https://t.me/NZUIMANTO1
   - **Type de source** : Réseau social
   - **Plateforme** : Telegram
4. Cliquer sur **Ajouter**

5. Après création, éditer la source et ajouter dans `scrapingConfig` :
   ```json
   {
     "channelId": "-1001234567890"
   }
   ```

## 6. Modes de Fonctionnement

### Mode Développement (Polling)
- Par défaut quand `NODE_ENV != production`
- Le bot interroge régulièrement Telegram
- Pas besoin de webhook public

### Mode Production (Webhook)
- Activé quand `NODE_ENV=production`
- Nécessite une URL publique HTTPS
- Configurer le webhook :

```bash
curl -X POST https://api.telegram.org/bot<VOTRE_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://votre-domaine.com/api/webhooks/telegram"}'
```

## 7. Tester l'Intégration

1. Démarrer le backend : `npm run dev`
2. Vérifier les logs : `✅ Telegram Bot initialisé avec succès`
3. Poster un message test dans le canal surveillé :
   ```
   🚨 URGENT - Accident grave à Douala, quartier Akwa.
   Plusieurs véhicules impliqués.
   ```
4. Le backend devrait :
   - Détecter le message
   - Créer une alerte automatiquement
   - Logger : `✅ Alerte créée: TG-xxxxx`

## 8. Vérifier le Statut

Endpoint API pour vérifier si le bot fonctionne :

```bash
GET http://localhost:4000/api/webhooks/telegram/status
```

Réponse attendue :
```json
{
  "success": true,
  "data": {
    "initialized": true,
    "mode": "polling"
  }
}
```

## 9. Catégories Détectées Automatiquement

Le bot reconnaît ces mots-clés pour créer des alertes :

- **Accident** : accident, collision, choc, renversé, percuté, crash
- **Incendie** : incendie, feu, brûle, flamme, fumée
- **Vol** : vol, cambriolage, volé, braquage, voleur, arnaque
- **Disparition** : disparu, disparue, perdu, introuvable
- **Inondation** : inondation, inondé, eau, débordement, crue
- **Autres** : alerte, urgent, danger, attention, problème, aide

## 10. Dépannage

### Le bot ne reçoit pas les messages
- Vérifier que le bot est bien administrateur du canal
- Vérifier que le token est correct dans `.env`
- Vérifier les logs du backend pour les erreurs

### Les alertes ne sont pas créées
- Vérifier que le `channelId` est correct dans `scrapingConfig`
- Vérifier que la source est `isActive: true`
- Vérifier que le message contient des mots-clés reconnus

### Erreur "TELEGRAM_BOT_TOKEN non défini"
- Le fichier `.env` n'est pas chargé
- Ajouter `TELEGRAM_BOT_TOKEN=...` dans `.env`
- Redémarrer le serveur
