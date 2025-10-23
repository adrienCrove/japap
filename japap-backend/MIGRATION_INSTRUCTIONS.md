# Instructions de Migration Prisma - Ajout des champs utilisateur

## ⚠️ Actions requises pour activer la gestion complète des utilisateurs

Les fichiers backend ont été créés avec succès. Maintenant, vous devez exécuter la migration Prisma pour créer les nouveaux champs dans la base de données.

---

## 📋 Étapes à suivre

### 1. **Arrêter le serveur backend** (si en cours d'exécution)

```bash
# Appuyez sur Ctrl+C dans le terminal où le serveur tourne
```

### 2. **Naviguer vers le répertoire backend**

```bash
cd japap-backend
```

### 3. **Créer et exécuter la migration Prisma**

```bash
npx prisma migrate dev --name add_user_fields
```

Cette commande va :
- ✅ Créer un fichier de migration SQL
- ✅ Appliquer les changements à votre base de données PostgreSQL
- ✅ Régénérer le client Prisma avec les nouveaux champs

**Résultat attendu :**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "japap_db", schema "public" at "localhost:5432"

Applying migration `20250104_add_user_fields`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20250104_add_user_fields/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client
```

### 4. **Régénérer le client Prisma** (si la commande précédente échoue)

```bash
npx prisma generate
```

### 5. **Redémarrer le serveur backend**

```bash
npm run dev
# ou
npm start
```

---

## 🔍 Vérification de la migration

### Option 1 : Vérifier via Prisma Studio

```bash
npx prisma studio
```

Ouvrez http://localhost:5555 et vérifiez que le modèle `User` contient maintenant :
- ✅ `email`
- ✅ `status`
- ✅ `birthDate`
- ✅ `notes`
- ✅ `updatedAt`
- ✅ `reputationScore` (valeur par défaut = 100)

### Option 2 : Vérifier via une requête SQL

```bash
npx prisma db execute --stdin
```

Puis tapez :
```sql
\d "User"
```

Vous devriez voir tous les nouveaux champs.

---

## 📊 Changements appliqués au schéma

### Champs ajoutés au modèle `User` :

```prisma
model User {
  id              String              @id @default(uuid())
  phone           String              @unique
  name            String?
  email           String?             // ✅ NOUVEAU
  gender          String?
  role            String              @default("user")
  status          String              @default("pending")  // ✅ NOUVEAU
  reputationScore Int                 @default(100)       // ✅ MODIFIÉ (était 0)
  location        Json?
  birthDate       DateTime?           // ✅ NOUVEAU
  notes           String?             // ✅ NOUVEAU
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt          // ✅ NOUVEAU
  alerts          Alert[]
  confirmations   AlertConfirmation[]
  notifications   Notification[]
  subscriptions   Subscription[]
}
```

---

## 🧪 Tester la nouvelle API utilisateur

### 1. Créer un utilisateur

```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jean Dupont",
    "phone": "693123456",
    "email": "jean.dupont@example.com",
    "gender": "male",
    "role": "user",
    "status": "active",
    "reputationScore": 100,
    "location": {
      "address": "Yaoundé, Cameroun",
      "city": "Yaoundé",
      "coordinates": [3.8480, 11.5021]
    },
    "notes": "Utilisateur de test"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "Jean Dupont",
    "phone": "693123456",
    "email": "jean.dupont@example.com",
    "status": "active",
    "reputationScore": 100,
    ...
  },
  "message": "Utilisateur créé avec succès"
}
```

### 2. Lister les utilisateurs

```bash
curl http://localhost:4000/api/users
```

### 3. Filtrer par rôle

```bash
curl "http://localhost:4000/api/users?role=user&status=active"
```

### 4. Rechercher un utilisateur

```bash
curl "http://localhost:4000/api/users?search=Jean"
```

### 5. Mettre à jour un utilisateur

```bash
curl -X PUT http://localhost:4000/api/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "status": "suspended",
    "notes": "Compte suspendu pour vérification"
  }'
```

### 6. Changer le statut rapidement

```bash
curl -X PATCH http://localhost:4000/api/users/USER_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "blocked"}'
```

### 7. Ajuster le score de réputation

```bash
curl -X PATCH http://localhost:4000/api/users/USER_ID/reputation \
  -H "Content-Type: application/json" \
  -d '{"delta": 10}'  # Ajoute 10 points
```

---

## 🚨 En cas de problème

### Erreur : "Migration already applied"

Si la migration a déjà été appliquée :
```bash
npx prisma migrate resolve --applied add_user_fields
```

### Erreur : "Database connection failed"

Vérifiez votre fichier `.env` :
```env
DATABASE_URL="postgresql://user:password@localhost:5432/japap_db"
```

### Erreur : "Column already exists"

Si les champs existent déjà en base :
```bash
npx prisma db push --skip-generate
```

### Réinitialiser complètement la base (⚠️ ATTENTION : Perte de données)

```bash
npx prisma migrate reset
```

---

## ✅ Routes API disponibles

Une fois la migration effectuée, ces routes seront disponibles :

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/users` | Créer un utilisateur |
| GET | `/api/users` | Lister les utilisateurs (avec filtres) |
| GET | `/api/users/:id` | Obtenir un utilisateur |
| PUT | `/api/users/:id` | Mettre à jour un utilisateur |
| DELETE | `/api/users/:id` | Supprimer un utilisateur |
| PATCH | `/api/users/:id/status` | Changer le statut |
| PATCH | `/api/users/:id/reputation` | Ajuster la réputation |

---

## 📝 Notes importantes

1. **Utilisateurs existants** : Si des utilisateurs existent déjà en base, ils recevront automatiquement :
   - `status = "pending"`
   - `reputationScore = 100` (mise à jour de la valeur par défaut)
   - `updatedAt = now()`

2. **Validation** : Le controller valide automatiquement :
   - Format du numéro de téléphone camerounais (6XX XXX XXX)
   - Unicité du numéro de téléphone
   - Valeurs autorisées pour `role` et `status`

3. **Sécurité** : Les utilisateurs avec des alertes/confirmations ne peuvent pas être supprimés (protection des données liées).

---

**Date de création :** 2025-01-04
**Auteur :** Claude Code - Backend Update
