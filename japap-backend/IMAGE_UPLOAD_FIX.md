# 🔧 Fix: Erreur d'upload d'images (mod_security 406)

## Problème

L'erreur `Cannot GET /406.shtml` lors de l'upload d'images indique que le serveur cPanel/Apache bloque les requêtes à cause de **mod_security**.

## Causes identifiées

1. **Certificat SSL auto-signé** : Nécessite de désactiver la vérification SSL
2. **Règles mod_security trop strictes** : Bloquent les requêtes `multipart/form-data`
3. **Headers manquants** : Le serveur attend des headers spécifiques

## ✅ Solutions appliquées

### 1. Corrections dans le code

#### Fichiers modifiés :
- [uploadImg.js](src/routes/uploadImg.js)
- [test-remote-api.js](test-remote-api.js)

#### Changements effectués :

```javascript
const https = require('https');

// Agent HTTPS pour gérer les certificats auto-signés
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Désactive la vérification SSL
});

// Dans toutes les requêtes axios :
await axios.post(`${IMG_API_URL}/upload`, formData, {
  headers: {
    ...formData.getHeaders(),
    'x-api-key': IMG_API_KEY,
    'User-Agent': 'JAPAP-Backend/1.0',  // ✅ Ajouté
    'Accept': 'application/json',        // ✅ Ajouté
  },
  httpsAgent: httpsAgent,                // ✅ Ajouté
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  timeout: 30000,
});
```

### 2. Configuration serveur (optionnel)

Si les modifications du code ne suffisent pas, vous devez configurer le serveur distant.

#### Étapes sur le serveur `japap.adxcreation.com` :

1. **Télécharger le fichier `.htaccess.example`**
   ```bash
   cp .htaccess.example .htaccess
   ```

2. **L'uploader via FTP/cPanel** dans le dossier racine de l'API d'images

3. **Vérifier les permissions**
   ```bash
   chmod 644 .htaccess
   ```

4. **Redémarrer Apache** (si vous avez accès)
   ```bash
   sudo systemctl reload apache2
   ```

## 🧪 Tester la correction

Exécutez le script de test :

```bash
cd japap-backend
node test-remote-api.js
```

### Résultat attendu :

```
🧪 Test de l'API distante de stockage d'images

URL: https://japap.adxcreation.com
API Key: ✅ Configurée

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Test de connexion (GET /list)...
✅ Connexion réussie !
   Nombre d'images: 1

2️⃣  Test d'upload d'image...
✅ Upload réussi !
   Filename: 12345-test-image.png
   URL: https://japap.adxcreation.com/uploads/12345-test-image.png
   Size: 95 bytes

3️⃣  Test de suppression...
✅ Suppression réussie !

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Tests terminés
```

## 🔍 Dépannage

### Si l'erreur persiste :

1. **Vérifier les logs du serveur distant** :
   ```bash
   tail -f /var/log/apache2/error.log
   ```

2. **Désactiver complètement mod_security** (temporairement) :
   Ajouter dans `.htaccess` :
   ```apache
   <IfModule mod_security.c>
       SecRuleEngine Off
   </IfModule>
   ```

3. **Contacter votre hébergeur** :
   Si vous n'avez pas accès à la configuration Apache, demandez à votre hébergeur de :
   - Whitelister votre IP
   - Désactiver mod_security pour le dossier `/upload`
   - Augmenter les limites d'upload

4. **Vérifier la clé API** :
   ```bash
   echo $IMG_API_KEY
   ```

## 📚 Ressources

- [Documentation mod_security](https://github.com/SpiderLabs/ModSecurity/wiki)
- [Règles OWASP mod_security](https://coreruleset.org/)
- [Configuration Apache .htaccess](https://httpd.apache.org/docs/current/howto/htaccess.html)

## ⚠️ Notes de sécurité

- La désactivation de `rejectUnauthorized` est acceptable pour un certificat auto-signé que vous contrôlez
- En production, utilisez un certificat SSL valide (Let's Encrypt gratuit)
- Ne désactivez pas mod_security entièrement, uniquement les règles problématiques

## 🎯 Alternative : Stockage local

Si l'API distante reste inaccessible, le système bascule automatiquement vers le **stockage local** :

```javascript
// Fallback automatique dans uploadImg.js
if (!IMG_API_URL || !IMG_API_KEY || remoteError) {
  return await uploadLocal(file, res);
}
```

Les images seront stockées dans `japap-backend/public/uploads/`.
