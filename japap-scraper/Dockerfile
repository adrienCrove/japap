FROM node:18-alpine

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances de production
RUN npm ci --only=production

# Copier le code source
COPY . .

# Variables d'environnement par défaut (à surcharger)
ENV NODE_ENV=production
ENV SCRAPING_INTERVAL="0 */2 * * *"
ENV MAX_ARTICLES_PER_SOURCE=20
ENV RUN_ON_START=true

# Exposer le port (si besoin d'un serveur HTTP futur)
# EXPOSE 3001

# Healthcheck (optionnel - vérifie que le process tourne)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ps aux | grep -v grep | grep node || exit 1

# Commande de démarrage
CMD ["npm", "start"]
