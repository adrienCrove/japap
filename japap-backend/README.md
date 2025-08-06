Japap - Backend Node.js

Japap est une plateforme communautaire de signalement et d'alerte en temps réel, permettant aux utilisateurs de publier des incidents (accidents, vols, disparitions, etc.) et de recevoir des notifications géolocalisées. Ce document présente la documentation complète du backend développé en Node.js.

🌐 Prérequis

Node.js >= 18.x

NPM

PostgreSQL

Redis (pour les alertes expirables)


📝 Fonctionnalités principales

Authentification des utilisateurs (JWT)

Signalement d'incidents (CRUD)

Envoi de notifications push (Firebase ou Expo)

Websockets (Socket.io) pour les alertes temps réel

Intégration API Meta / WhatsApp pour signalement externe

Carte des incidents (via Mapbox ou Google Maps)

Système de durée d'expiration dynamique par catégorie

Publication et diffusion d'alertes via bots WhatsApp & Telegram

⚙️ Stack technique

Composant

Technologie

Serveur backend

Node.js + Express.js

Temps réel

Socket.io

Base de données

MySQL / PostgreSQL

Cache / jobs

Redis + Node-Cron

Notifications

Expo / Firebase FCM

Bot WhatsApp

Meta Graph API

Bot Telegram

Telegram Bot API

📂 Arborescence du projet

 japap-backend/
 ├── src/
 │   ├── controllers/
 │   ├── routes/
 │   ├── models/
 │   ├── services/
 │   ├── utils/
 │   └── index.js
 ├── config/
 ├── .env
 ├── package.json
 └── README.md

🚀 Installation

git clone https://github.com/ton-org/japap-backend.git
cd japap-backend
npm install

Configurer le fichier .env :

PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=xxx
DB_NAME=japap
JWT_SECRET=your_secret_key
EXPO_PUSH_TOKEN=xxxx
REDIS_URL=redis://localhost:6379

Lancer le serveur :

npm run dev

## 🔧 API REST - Endpoints

### Authentification

#### `POST /api/auth/register`
Enregistre un nouvel utilisateur.
-   **Request Body:**
    ```json
    {
      "username": "string",
      "email": "string",
      "password": "string",
      "phone_number": "string"
    }
    ```
-   **Responses:**
    -   `201 Created`: Utilisateur créé avec succès.
    -   `400 Bad Request`: Données invalides.
    -   `409 Conflict`: L'email ou le nom d'utilisateur existe déjà.

#### `POST /api/auth/login`
Connecte un utilisateur et retourne un token JWT.
-   **Request Body:**
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```
-   **Responses:**
    -   `200 OK`: Connexion réussie. Retourne `{ "token": "string" }`.
    -   `401 Unauthorized`: Identifiants incorrects.

### Alertes

*Toutes les routes d'alertes nécessitent une authentification JWT via le header `Authorization: Bearer <token>`.*

#### `POST /api/alerts`
Crée un nouveau signalement.
-   **Request Body:**
    ```json
    {
      "category": "string (Accident, Vol, Disparition, Incident)",
      "severity": "string (normal, grave)",
      "latitude": "number",
      "longitude": "number",
      "description": "string",
      "address": "string"
    }
    ```
-   **Responses:**
    -   `201 Created`: Alerte créée.
    -   `400 Bad Request`: Données invalides.

#### `GET /api/alerts`
Récupère tous les signalements actifs.
-   **Query Params (optionnel):** `category`, `radius`, `lat`, `lon`
-   **Responses:**
    -   `200 OK`: Retourne une liste d'alertes.

#### `GET /api/alerts/nearby`
Récupère les alertes proches d'une localisation.
-   **Query Params:**
    -   `lat`: latitude
    -   `lon`: longitude
    -   `radius`: rayon en kilomètres (défaut: 10)
-   **Responses:**
    -   `200 OK`: Retourne une liste d'alertes.

#### `POST /api/alerts/:id/confirm`
Permet à un utilisateur de confirmer un signalement.
-   **Responses:**
    -   `200 OK`: Confirmation enregistrée.
    -   `404 Not Found`: Alerte non trouvée.

#### `POST /api/alerts/:id/expire`
Marque une alerte comme expirée (action réservée à l'auteur ou modérateurs).
-   **Responses:**
    -   `200 OK`: Alerte marquée comme expirée.
    -   `403 Forbidden`: Action non autorisée.
    -   `404 Not Found`: Alerte non trouvée.

### Utilisateur

#### `GET /api/user/notifications`
Récupère l'historique des notifications pour l'utilisateur connecté.
-   **Responses:**
    -   `200 OK`: Retourne une liste de notifications.

⌚ Durée des alertes selon la catégorie

Catégorie

Durée par défaut

Accident

20 min (normal), 2h (grave)

Vol

30 min

Disparition

Jusqu'à nouvelle info

Incident

1h

Gestion via Redis avec expiration automatique.

🛎️ Notifications push

Utilise Expo Push Notification ou Firebase Cloud Messaging :

Les utilisateurs reçoivent une notification si une alerte est publiée à moins de 10km de leur position.

Intégration future : segmentation par catégorie et abonnements à des zones.

🚫 Sécurité

Authentification JWT

Validation des données avec Joi / Zod

Limitation de création d'alertes (anti-spam)

Anonymisation possible

Journalisation des actions critiques

🌎 Websockets (Socket.io)

Connexion en temps réel pour recevoir les nouveaux signalements

Canal par zone / ville ou rayon géographique

🧱 Intégration Bots (WhatsApp & Telegram)

💌 Interprétation des messages entrants

Les utilisateurs peuvent signaler via bot en écrivant par exemple :

"Accident grave à Cocody, devant l'école X"

Le serveur analyse automatiquement :

Type d'incident : "Accident"

Gravite : "grave"

Lieu : "Cocody"

Le signalement est créé dans la base de données via l'API.

📢 Diffusion multicanal

Chaque nouveau signalement est publié automatiquement sur :

L'application Japap

Une chaîne WhatsApp ou un groupe Telegram

✨ Exemple de message diffusé par le bot :

📍 INCIDENT SIGNALÉ : ACCIDENT GRAVE
📌 Lieu : Cocody, devant l’école X
🕞 Heure : 10:45
⏳ Valide jusqu’à : 12:45
🚨 Restez vigilant dans la zone.

🚀 Technologies utilisées :

WhatsApp : Meta Graph API ou Twilio

Telegram : Bot Telegram API

Webhook Node.js pour recevoir et traiter les messages entrants

Services d'envoi pour diffuser vers les groupes

🎡 Roadmap technique

Sprint

Fonctionnalité

Statut

S1

CRUD Signalement + Auth

✅

S2

Notifications push / Socket.io

⏳

S3

Intégration WhatsApp & Telegram bots

⏳

S4

Dashboard admin / statistiques

⬜

🏆 Auteurs

Projet Japap développé par TABOLA