# Configuration Mobile - JAPAP

## Problème : "Network request failed"

Cette erreur se produit car l'application mobile ne peut pas se connecter à `localhost`.

## Solution

### Fichiers créés
- ✅ `.env.local` - Configuration locale avec votre IP (ignoré par git)
- ✅ `.env` - Configuration par défaut mise à jour

### Étapes pour connecter votre mobile

1. **Vérifier que le backend écoute sur toutes les interfaces**
   - Le backend écoute maintenant sur `0.0.0.0:4000`
   - Visible sur votre réseau local

2. **L'app mobile utilise maintenant votre IP locale**
   - Configuré dans `.env.local` : `http://10.104.105.73:4000/api`
   - Votre téléphone et PC doivent être sur le **même réseau Wi-Fi**

3. **Redémarrer l'application**
   ```bash
   # Dans le dossier japap/
   npx expo start --clear
   ```

4. **Redémarrer le backend** (pour appliquer le changement d'interface)
   ```bash
   # Dans le dossier japap-backend/
   npm run dev
   ```

### Si votre IP change

Votre IP locale peut changer si vous changez de réseau Wi-Fi. Dans ce cas :

1. Obtenir votre nouvelle IP :
   ```bash
   ipconfig  # Windows
   # Cherchez "Adresse IPv4" de la carte Wi-Fi
   ```

2. Mettre à jour `.env.local` :
   ```
   EXPO_PUBLIC_API_URL=http://[NOUVELLE_IP]:4000/api
   ```

3. Redémarrer l'app mobile avec `npx expo start --clear`

### Types d'appareil

#### Émulateur Android
Si vous utilisez un émulateur Android, utilisez plutôt :
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api
```

#### Appareil physique via Expo Go
Assurez-vous que :
- ✅ Votre téléphone et PC sont sur le même Wi-Fi
- ✅ Le pare-feu Windows autorise les connexions sur le port 4000
- ✅ Aucun VPN actif sur votre PC (ou configurez-le pour autoriser le réseau local)

### Vérifier la connexion

1. **Test depuis le navigateur mobile** :
   - Ouvrez `http://10.104.105.73:4000` sur votre téléphone
   - Vous devriez voir "Japap Backend is running!"

2. **Test de l'endpoint auth** :
   - Essayez `http://10.104.105.73:4000/api/auth/check-user` avec Postman ou le navigateur

### Dépannage

**Problème** : Toujours "Network request failed"
- Vérifiez que le backend tourne (`npm run dev`)
- Vérifiez que vous êtes sur le même Wi-Fi
- Redémarrez l'app avec `npx expo start --clear`
- Vérifiez le pare-feu Windows

**Problème** : Connexion refusée
- Le backend doit tourner avec `npm run dev`
- Vérifiez que le port 4000 n'est pas bloqué par le pare-feu

**Problème** : IP non valide
- Votre IP a peut-être changé
- Re-exécutez `ipconfig` et mettez à jour `.env.local`
