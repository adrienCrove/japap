# Mise à jour requise du Backend pour la gestion des utilisateurs

## ⚠️ Modification du schéma Prisma nécessaire

Le formulaire de création d'utilisateur dans l'interface admin utilise un champ `status` qui **n'existe pas actuellement** dans le schéma Prisma.

### Changements requis

#### 1. Mettre à jour le schéma Prisma

**Fichier:** `japap-backend/prisma/schema.prisma`

**Modification à apporter au modèle User (ligne 11):**

```prisma
model User {
  id              String              @id @default(uuid())
  phone           String              @unique
  name            String?
  email           String?             // NOUVEAU - optionnel
  gender          String?
  role            String              @default("user")
  status          String              @default("pending")  // NOUVEAU - REQUIS
  reputationScore Int                 @default(100)       // Valeur par défaut mise à jour
  location        Json?
  birthDate       DateTime?           // NOUVEAU - optionnel
  notes           String?             // NOUVEAU - notes administratives
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt          // NOUVEAU - suivi des modifications
  alerts          Alert[]
  confirmations   AlertConfirmation[]
  notifications   Notification[]
  subscriptions   Subscription[]
}
```

**Champs ajoutés:**
- ✅ `status` - **REQUIS** - Valeurs: 'active', 'pending', 'suspended', 'blocked'
- ✅ `email` - Optionnel
- ✅ `birthDate` - Optionnel
- ✅ `notes` - Optionnel (notes administratives)
- ✅ `updatedAt` - Suivi automatique des modifications

**Champ modifié:**
- ✅ `reputationScore` - Valeur par défaut passée de 0 à 100

#### 2. Créer la migration Prisma

Après modification du schéma, exécuter:

```bash
cd japap-backend
npx prisma migrate dev --name add_user_status_and_fields
npx prisma generate
```

#### 3. Mettre à jour le controller utilisateur

**Fichier:** `japap-backend/src/controllers/usersController.js` (à créer si inexistant)

```javascript
// POST /api/users - Créer un utilisateur
exports.createUser = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      gender,
      role = 'user',
      status = 'active',
      reputationScore = 100,
      location,
      birthDate,
      notes
    } = req.body;

    // Validation
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Le numéro de téléphone est requis'
      });
    }

    // Vérifier si le numéro existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Un utilisateur avec ce numéro existe déjà'
      });
    }

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        gender,
        role,
        status,
        reputationScore,
        location,
        birthDate: birthDate ? new Date(birthDate) : null,
        notes
      }
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'Utilisateur créé avec succès'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'utilisateur'
    });
  }
};

// PUT /api/users/:id - Mettre à jour un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: user,
      message: 'Utilisateur mis à jour avec succès'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de l\'utilisateur'
    });
  }
};

// GET /api/users - Lister les utilisateurs
exports.getUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;

    const where = {};
    if (role && role !== 'all') where.role = role;
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des utilisateurs'
    });
  }
};
```

#### 4. Ajouter la route

**Fichier:** `japap-backend/src/routes/users.js` (à créer)

```javascript
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

// Routes CRUD utilisateurs
router.post('/', usersController.createUser);
router.get('/', usersController.getUsers);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

module.exports = router;
```

**Enregistrer la route dans `japap-backend/src/index.js`:**

```javascript
const usersRoutes = require('./routes/users');
app.use('/api/users', usersRoutes);
```

## Checklist de mise en œuvre

- [ ] Modifier `prisma/schema.prisma` avec les nouveaux champs
- [ ] Exécuter `npx prisma migrate dev`
- [ ] Exécuter `npx prisma generate`
- [ ] Créer `controllers/usersController.js`
- [ ] Créer `routes/users.js`
- [ ] Enregistrer la route dans `src/index.js`
- [ ] Tester la création d'utilisateur depuis l'interface admin
- [ ] Vérifier que les statuts fonctionnent correctement

## Valeurs autorisées pour `status`

- `active` - Utilisateur actif
- `pending` - En attente de validation
- `suspended` - Compte suspendu temporairement
- `blocked` - Compte bloqué définitivement

## Notes importantes

1. **Migration de données:** Si des utilisateurs existent déjà en base, la migration ajoutera automatiquement `status = 'pending'` à tous les utilisateurs existants.

2. **Rétrocompatibilité:** Le champ `status` a une valeur par défaut, donc il est compatible avec le code existant.

3. **Validation:** Ajouter une validation côté backend pour s'assurer que `status` est bien une des valeurs autorisées.

---

**Date de création:** 2025-01-04
**Créé par:** Claude Code - Interface Admin
