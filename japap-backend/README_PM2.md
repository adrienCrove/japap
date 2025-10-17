# Guide d'utilisation de PM2 pour JAPAP Backend

Ce guide explique comment utiliser PM2 pour gérer le backend JAPAP en développement et en production.

## Table des matières

1. [Installation](#installation)
2. [Commandes rapides](#commandes-rapides)
3. [Développement](#développement)
4. [Production](#production)
5. [Monitoring](#monitoring)
6. [Logs](#logs)
7. [Déploiement](#déploiement)
8. [Dépannage](#dépannage)

---

## Installation

PM2 est déjà inclus dans les devDependencies du projet. Pour l'installer :

```bash
npm install
```

Pour installer PM2 globalement (recommandé pour la production) :

```bash
npm install -g pm2
```

---

## Commandes rapides

### Démarrage

```bash
# Développement (avec watch mode)
npm run pm2:dev

# Production
npm run pm2:start
```

### Contrôle

```bash
# Arrêter l'application
npm run pm2:stop

# Redémarrer (avec downtime)
npm run pm2:restart

# Reload (sans downtime - recommandé en production)
npm run pm2:reload

# Supprimer de PM2
npm run pm2:delete
```

### Monitoring

```bash
# Voir les logs en temps réel
npm run pm2:logs

# Dashboard interactif
npm run pm2:monit

# Statut des applications
npm run pm2:status
```

---

## Développement

### Démarrage en mode développement

```bash
npm run pm2:dev
```

**Fonctionnalités activées :**
- ✅ Watch mode : redémarre automatiquement lors des changements de fichiers
- ✅ Mode fork : une seule instance
- ✅ Logs détaillés
- ✅ Variables d'environnement de développement

### Fichiers ignorés par le watch

Le watch ignore automatiquement :
- `node_modules/`
- `logs/`
- `public/uploads/`
- `.git/`
- Fichiers `.log`
- Fichiers `.env*`

---

## Production

### Démarrage en production

```bash
npm run pm2:start
```

**Fonctionnalités activées :**
- ✅ Mode cluster : utilise tous les CPU disponibles
- ✅ Autorestart : redémarre automatiquement en cas de crash
- ✅ Load balancing automatique
- ✅ Zero-downtime reload
- ✅ Gestion avancée de la mémoire (max 500MB par instance)

### Configuration avancée

Le fichier `ecosystem.config.js` contient toute la configuration :

```javascript
{
  name: 'japap-backend',
  instances: 'max',              // Utilise tous les CPUs
  exec_mode: 'cluster',          // Mode cluster
  max_memory_restart: '500M',    // Redémarre si > 500MB
  autorestart: true,             // Redémarrage automatique
  max_restarts: 10,              // Max 10 redémarrages
  min_uptime: '10s'              // Temps minimum d'exécution
}
```

### Reload sans downtime

En production, utilisez toujours `reload` au lieu de `restart` :

```bash
npm run pm2:reload
```

Cette commande effectue un rolling restart : PM2 redémarre les instances une par une, garantissant qu'il y a toujours au moins une instance active.

### Sauvegarder la configuration

Pour que PM2 redémarre automatiquement vos applications après un reboot :

```bash
npm run pm2:save
npm run pm2:startup
```

La commande `startup` vous donnera une commande à exécuter avec `sudo` pour configurer le démarrage automatique.

---

## Monitoring

### Voir le statut

```bash
npm run pm2:status
```

Affiche :
- Nom de l'application
- ID du processus
- Statut (online/stopped/errored)
- Nombre de redémarrages
- Uptime
- Utilisation CPU
- Utilisation mémoire

### Dashboard interactif

```bash
npm run pm2:monit
```

Interface temps réel avec :
- Graphiques CPU et mémoire
- Liste des processus
- Logs en direct
- Métadonnées

### Voir les logs

```bash
# Tous les logs en temps réel
npm run pm2:logs

# Logs d'une application spécifique
pm2 logs japap-backend

# Afficher les dernières lignes
pm2 logs --lines 100

# Vider les logs
pm2 flush
```

---

## Logs

Les logs sont stockés dans le dossier `logs/` :

- `logs/pm2-error.log` : Erreurs uniquement
- `logs/pm2-out.log` : Sortie standard (console.log)
- `logs/pm2-combined.log` : Tous les logs combinés

### Rotation des logs

Pour éviter que les logs ne prennent trop d'espace, installez le module de rotation :

```bash
pm2 install pm2-logrotate

# Configuration
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## Déploiement

### Configuration SSH

Le fichier `ecosystem.config.js` contient des configurations de déploiement pour production et staging.

**Étapes à configurer :**

1. Modifier les valeurs dans `ecosystem.config.js` :
   ```javascript
   deploy: {
     production: {
       user: 'votre_user_ssh',
       host: 'votre_serveur.com',
       repo: 'https://github.com/votre-user/japap.git',
       path: '/var/www/japap-backend'
     }
   }
   ```

2. Setup initial (première fois) :
   ```bash
   pm2 deploy ecosystem.config.js production setup
   ```

3. Déploiement :
   ```bash
   pm2 deploy ecosystem.config.js production
   ```

### Post-deploy automatique

Le script `post-deploy` s'exécute automatiquement après chaque déploiement :

```bash
npm install &&
npx prisma generate &&
npx prisma migrate deploy &&
pm2 reload ecosystem.config.js --env production &&
pm2 save
```

Cela effectue :
1. Installation des dépendances
2. Génération du client Prisma
3. Application des migrations de base de données
4. Reload de l'application sans downtime
5. Sauvegarde de la configuration PM2

---

## Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs d'erreur
npm run pm2:logs

# Vérifier le statut détaillé
pm2 show japap-backend

# Redémarrer complètement
npm run pm2:delete
npm run pm2:start
```

### Problèmes de mémoire

Si l'application consomme trop de mémoire :

1. Vérifier l'utilisation actuelle :
   ```bash
   npm run pm2:monit
   ```

2. Ajuster la limite dans `ecosystem.config.js` :
   ```javascript
   max_memory_restart: '1G'  // Augmenter à 1GB
   ```

3. Recharger la configuration :
   ```bash
   npm run pm2:reload
   ```

### Trop de redémarrages

Si l'application redémarre constamment :

```bash
# Voir les erreurs
npm run pm2:logs

# Vérifier le nombre de redémarrages
npm run pm2:status
```

Causes courantes :
- Erreur dans le code (vérifier les logs)
- Base de données inaccessible
- Variable d'environnement manquante
- Port déjà utilisé

### Watch mode ne fonctionne pas

En développement, si les changements ne sont pas détectés :

1. Vérifier que vous êtes bien en mode dev :
   ```bash
   npm run pm2:delete
   npm run pm2:dev
   ```

2. Vérifier les fichiers ignorés dans `ecosystem.config.js`

3. Augmenter le délai de watch :
   ```javascript
   watch_delay: 2000  // 2 secondes
   ```

### Supprimer complètement PM2

```bash
# Arrêter et supprimer toutes les applications
pm2 delete all

# Supprimer les dumps sauvegardés
pm2 cleardump

# Tuer le daemon PM2
pm2 kill
```

---

## Variables d'environnement

PM2 peut charger différents fichiers `.env` selon l'environnement :

### Développement
Utilise `.env` automatiquement via `dotenv` dans le code.

### Production
Créez un fichier `.env.production` basé sur `.env.production.example` :

```bash
cp .env.production.example .env.production
```

Puis éditez `.env.production` avec vos vraies valeurs de production.

**IMPORTANT :** Ne jamais commiter `.env.production` dans Git !

---

## Commandes PM2 utiles

```bash
# Liste complète des processus
pm2 list

# Détails d'une application
pm2 show japap-backend

# Redémarrer toutes les applications
pm2 restart all

# Arrêter toutes les applications
pm2 stop all

# Supprimer toutes les applications
pm2 delete all

# Voir les métriques en temps réel
pm2 monit

# Afficher les infos système
pm2 info japap-backend

# Tuer le daemon PM2 (attention !)
pm2 kill
```

---

## Ressources

- [Documentation officielle PM2](https://pm2.keymetrics.io/)
- [PM2 Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)
- [PM2 Process Management](https://pm2.keymetrics.io/docs/usage/process-management/)
- [PM2 Log Management](https://pm2.keymetrics.io/docs/usage/log-management/)

---

## Support

Pour toute question ou problème :
1. Consultez les logs : `npm run pm2:logs`
2. Vérifiez la documentation PM2
3. Contactez l'équipe de développement JAPAP
