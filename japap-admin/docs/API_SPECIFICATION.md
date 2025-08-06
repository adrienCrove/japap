# JAPAP Admin - Spécification des API Backend

Cette documentation décrit toutes les API nécessaires côté `japap-backend` pour alimenter l'interface d'administration JAPAP.

## Base URL
```
http://localhost:3001/api
```

## Authentication
Toutes les routes nécessitent une authentification JWT avec rôle approprié.

```javascript
Headers: {
  'Authorization': 'Bearer {jwt_token}',
  'Content-Type': 'application/json'
}
```

---

## 📊 Dashboard APIs

### GET /dashboard/stats
Statistiques principales pour le tableau de bord.

**Response:**
```json
{
  "success": true,
  "data": {
    "activeAlerts": 24,
    "expiredAlerts": 8,
    "pendingAlerts": 12,
    "averageValidationTime": 45,
    "completedToday": 32,
    "delayedJobs": 3,
    "technicians": 18
  }
}
```

### GET /dashboard/alerts-by-category
Répartition des alertes par catégorie pour graphiques.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "category": "Accident de circulation",
      "count": 45,
      "percentage": 35.2,
      "severity": "high"
    },
    {
      "category": "Incendie",
      "count": 32,
      "percentage": 25.0,
      "severity": "critical"
    }
  ]
}
```

### GET /dashboard/top-zones
Top des zones avec le plus d'activité.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "zone-1",
      "name": "Centre Historique Paris",
      "alertCount": 12,
      "lastActivity": "2025-01-04T10:30:00Z",
      "coordinates": [48.8566, 2.3522]
    }
  ]
}
```

### GET /dashboard/top-users
Utilisateurs les plus fiables.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "name": "Marie Dupont",
      "phone": "+33 6 12 34 56 78",
      "reputationScore": 85,
      "alertCount": 12,
      "lastSignal": "2025-01-04T09:30:00Z"
    }
  ]
}
```

### GET /dashboard/recent-activity
Activité récente des alertes.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "jobId": "ALT-2843",
      "service": "Accident de circulation",
      "technician": "Marie Dubois",
      "eta": "10:30",
      "status": "validated",
      "location": "Avenue des Champs-Élysées",
      "severity": "high"
    }
  ]
}
```

---

## 🚨 Alerts/Signalements APIs

### GET /alerts
Liste paginée des alertes avec filtres.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): active|pending|expired|false
- `category` (string): Filtrer par catégorie
- `severity` (string): low|medium|high|critical
- `source` (string): app|whatsapp|telegram
- `zone` (string): ID de la zone
- `user` (string): ID utilisateur
- `startDate` (string): Date de début (ISO)
- `endDate` (string): Date de fin (ISO)

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "ALT-2843",
        "category": "Accident de circulation",
        "severity": "high",
        "status": "pending",
        "description": "Collision entre deux véhicules avenue des Champs-Élysées",
        "location": {
          "address": "Avenue des Champs-Élysées, 75008 Paris",
          "coordinates": [48.8698, 2.3076]
        },
        "user": {
          "id": "user-123",
          "phone": "+33 6 12 34 56 78",
          "reputationScore": 85
        },
        "confirmations": 3,
        "mediaUrl": "https://example.com/photo.jpg",
        "createdAt": "2025-01-04T09:30:00Z",
        "expiresAt": "2025-01-04T15:30:00Z",
        "source": "app"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8
    }
  }
}
```

### GET /alerts/:id
Détail d'une alerte spécifique.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ALT-2843",
    "category": "Accident de circulation",
    "severity": "high",
    "status": "pending",
    "description": "Collision entre deux véhicules avenue des Champs-Élysées",
    "location": {
      "address": "Avenue des Champs-Élysées, 75008 Paris",
      "coordinates": [48.8698, 2.3076]
    },
    "user": {
      "id": "user-123",
      "phone": "+33 6 12 34 56 78",
      "name": "Marie Dupont",
      "reputationScore": 85
    },
    "confirmations": [
      {
        "userId": "user-456",
        "type": "visual",
        "createdAt": "2025-01-04T09:35:00Z"
      }
    ],
    "mediaUrl": "https://example.com/photo.jpg",
    "createdAt": "2025-01-04T09:30:00Z",
    "expiresAt": "2025-01-04T15:30:00Z",
    "source": "app",
    "aiScore": 85,
    "communityScore": 78,
    "notes": [
      "Géolocalisation cohérente",
      "Photo de qualité"
    ]
  }
}
```

### PUT /alerts/:id/validate
Valider une alerte.

**Body:**
```json
{
  "moderatorId": "mod-123",
  "notes": "Alerte confirmée par les autorités",
  "diffusionChannels": ["whatsapp", "telegram"]
}
```

### PUT /alerts/:id/reject
Rejeter une alerte.

**Body:**
```json
{
  "moderatorId": "mod-123",
  "reason": "Fausse alerte confirmée",
  "adjustReputation": true
}
```

### PUT /alerts/:id
Éditer une alerte.

**Body:**
```json
{
  "category": "Accident de circulation",
  "severity": "medium",
  "description": "Description mise à jour",
  "location": {
    "address": "Nouvelle adresse",
    "coordinates": [48.8566, 2.3522]
  }
}
```

### POST /alerts/bulk-action
Action en lot sur plusieurs alertes.

**Body:**
```json
{
  "action": "validate|reject|archive",
  "alertIds": ["ALT-2843", "ALT-1843"],
  "moderatorId": "mod-123",
  "reason": "Raison de l'action"
}
```

---

## 🛡️ Moderation APIs

### GET /moderation/queue
File d'attente de modération avec priorités.

**Query Parameters:**
- `priority` (string): urgent|high|medium|low
- `assignedTo` (string): ID du modérateur
- `escalated` (boolean): Alertes escaladées seulement

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ALT-3241",
      "category": "Accident de circulation",
      "severity": "high",
      "description": "Collision majeure impliquant plusieurs véhicules",
      "location": {
        "address": "Autoroute A6, Sortie Fontainebleau",
        "coordinates": [48.4084, 2.7019]
      },
      "user": {
        "id": "user-987",
        "phone": "+33 6 12 34 56 78",
        "name": "Marie Dupont",
        "reputationScore": 85,
        "previousAlerts": 12,
        "accountAge": "2 ans"
      },
      "aiScore": 92,
      "communityScore": 88,
      "confirmations": 5,
      "rejections": 0,
      "mediaUrl": "/api/media/accident-a6.jpg",
      "duplicateChecker": {
        "isPotentialDuplicate": false,
        "similarAlerts": []
      },
      "createdAt": "2025-01-04T10:15:00Z",
      "source": "app",
      "priority": "urgent",
      "escalated": true,
      "assignedTo": null,
      "notes": [
        "Signalement cohérent avec les données GPS",
        "Photos de qualité montrant l'accident"
      ]
    }
  ]
}
```

### PUT /moderation/assign
Assigner une alerte à un modérateur.

**Body:**
```json
{
  "alertId": "ALT-3241",
  "moderatorId": "mod-123"
}
```

### POST /moderation/escalate
Escalader une alerte.

**Body:**
```json
{
  "alertId": "ALT-3241",
  "reason": "Gravité élevée nécessitant attention urgente"
}
```

---

## 🗺️ Map/Zones APIs

### GET /map/alerts
Alertes pour affichage sur carte.

**Query Parameters:**
- `bounds` (string): "lat1,lng1,lat2,lng2" pour viewport
- `timeRange` (string): 1h|6h|24h|7d
- `severity` (string): low|medium|high|critical
- `status` (string): active|pending|resolved

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ALT-2843",
      "category": "Accident de circulation",
      "severity": "high",
      "status": "active",
      "description": "Collision sur les Champs-Élysées",
      "location": {
        "lat": 48.8698,
        "lng": 2.3076,
        "address": "Avenue des Champs-Élysées, 75008 Paris"
      },
      "createdAt": "2025-01-04T10:30:00Z",
      "confirmations": 5
    }
  ]
}
```

### GET /zones
Liste des zones définies.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "zone-1",
      "name": "Centre Historique",
      "type": "polygon",
      "coordinates": [
        [48.8566, 2.3522],
        [48.8534, 2.3488],
        [48.8520, 2.3550],
        [48.8580, 2.3580]
      ],
      "categories": ["incendie", "accident"],
      "channels": ["WhatsApp_Urgence", "Telegram_Centre"],
      "moderators": ["Marie Dubois", "Jean Martin"],
      "alertCount": 12,
      "lastActivity": "2025-01-04T09:45:00Z",
      "active": true
    }
  ]
}
```

### POST /zones
Créer une nouvelle zone.

**Body:**
```json
{
  "name": "Nouvelle Zone",
  "type": "circle|polygon",
  "coordinates": [[48.8566, 2.3522]],
  "radius": 500,
  "categories": ["accident", "incendie"],
  "channels": ["WhatsApp_Zone"],
  "moderators": ["mod-123"],
  "active": true
}
```

### PUT /zones/:id
Modifier une zone.

### DELETE /zones/:id
Supprimer une zone.

---

## 👥 Users APIs

### GET /users
Liste paginée des utilisateurs.

**Query Parameters:**
- `page`, `limit`: Pagination
- `search` (string): Recherche par nom, téléphone, ID
- `role` (string): user|moderator|admin
- `status` (string): active|suspended|blocked
- `reputationMin`, `reputationMax` (number): Filtre par score
- `lastActivitySince` (string): Date ISO

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-123",
        "phone": "+33 6 12 34 56 78",
        "name": "Marie Dupont",
        "gender": "female",
        "role": "user",
        "reputationScore": 85,
        "status": "active",
        "location": {
          "city": "Paris 8e",
          "coordinates": [48.8698, 2.3076]
        },
        "stats": {
          "alertsSubmitted": 12,
          "alertsConfirmed": 10,
          "alertsRejected": 2,
          "validationRate": 83.3
        },
        "devices": [
          {
            "platform": "iOS",
            "lastActive": "2025-01-04T10:30:00Z",
            "pushToken": "ios_token_123"
          }
        ],
        "accountAge": "2 ans",
        "lastActivity": "2025-01-04T10:30:00Z",
        "createdAt": "2023-01-04T10:30:00Z",
        "restrictions": null
      }
    ],
    "pagination": {
      "total": 1250,
      "page": 1,
      "limit": 20,
      "totalPages": 63
    }
  }
}
```

### GET /users/:id
Détail d'un utilisateur.

### PUT /users/:id/role
Changer le rôle d'un utilisateur.

**Body:**
```json
{
  "role": "moderator",
  "reason": "Promotion suite à excellentes performances"
}
```

### PUT /users/:id/reputation
Ajuster la réputation.

**Body:**
```json
{
  "adjustment": -10,
  "reason": "Fausse alerte confirmée"
}
```

### PUT /users/:id/restrict
Appliquer une restriction.

**Body:**
```json
{
  "type": "rate_limit|category_ban|full_ban",
  "duration": "7d|30d|permanent",
  "reason": "Trop de fausses alertes"
}
```

### POST /users/:id/message
Envoyer un message à un utilisateur.

**Body:**
```json
{
  "type": "warning|info|suspension",
  "title": "Avertissement",
  "content": "Veuillez vérifier vos signalements...",
  "channels": ["push", "sms"]
}
```

---

## 📱 Broadcast/Notifications APIs

### GET /broadcast/channels
Liste des canaux de diffusion.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "whatsapp-urgence",
      "name": "WhatsApp Urgence",
      "type": "whatsapp",
      "status": "active",
      "subscriberCount": 1247,
      "lastMessage": "2025-01-04T10:30:00Z",
      "quotas": {
        "daily": 1000,
        "used": 45,
        "remaining": 955
      }
    }
  ]
}
```

### POST /broadcast/send
Envoyer une diffusion.

**Body:**
```json
{
  "channels": ["whatsapp-urgence", "telegram-paris"],
  "alertId": "ALT-2843",
  "template": "alert_validation",
  "segments": ["paris_8e", "emergency_subscribers"],
  "priority": "high"
}
```

### GET /broadcast/templates
Templates de messages.

### GET /broadcast/logs
Historique des envois.

---

## 📊 Statistics APIs

### GET /statistics/summary
Rapport de synthèse.

**Query Parameters:**
- `startDate`, `endDate` (string): Période
- `groupBy` (string): day|week|month

### GET /statistics/alerts
Statistiques détaillées des alertes.

### GET /statistics/users
Statistiques utilisateurs.

### GET /statistics/performance
Performance des modérateurs.

---

## 🔐 Auth APIs

### POST /auth/login
Connexion administrateur.

**Body:**
```json
{
  "email": "admin@japap.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "admin-1",
      "email": "admin@japap.com",
      "role": "admin",
      "permissions": ["users.read", "alerts.validate", "zones.create"]
    }
  }
}
```

### POST /auth/refresh
Renouveler le token.

### POST /auth/logout
Déconnexion.

---

## 📋 Audit/Logs APIs

### GET /audit/logs
Journal d'audit avec filtres.

**Query Parameters:**
- `action` (string): create|update|delete|validate|reject
- `resource` (string): alert|user|zone
- `userId` (string): Filtrer par utilisateur
- `startDate`, `endDate` (string): Période

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "log-123",
      "action": "validate",
      "resource": "alert",
      "resourceId": "ALT-2843",
      "userId": "mod-123",
      "userEmail": "moderator@japap.com",
      "details": {
        "previousStatus": "pending",
        "newStatus": "active",
        "reason": "Alerte confirmée par témoins"
      },
      "timestamp": "2025-01-04T10:30:00Z",
      "ipAddress": "192.168.1.100"
    }
  ]
}
```

---

## Error Responses

Toutes les API peuvent retourner ces codes d'erreur :

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Codes d'erreur communs :**
- `400` - Bad Request
- `401` - Unauthorized  
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

---

## WebSocket Events

Pour les mises à jour temps réel :

```javascript
// Connection
const socket = io('ws://localhost:3001', {
  auth: { token: jwt_token }
});

// Events
socket.on('alert:new', (alert) => {});
socket.on('alert:updated', (alert) => {});
socket.on('user:activity', (user) => {});
socket.on('stats:updated', (stats) => {});
```

Cette spécification couvre toutes les API nécessaires pour faire fonctionner l'interface d'administration JAPAP avec toutes ses fonctionnalités.