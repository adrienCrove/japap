# Documentation des tests Maestro pour JAPAP

Ce dossier contient tous les tests E2E (End-to-End) pour l'application mobile JAPAP, utilisant [Maestro](https://maestro.mobile.dev/).

## Table des matières

1. [Installation de Maestro](#installation-de-maestro)
2. [Structure des tests](#structure-des-tests)
3. [Configuration](#configuration)
4. [Lancer les tests](#lancer-les-tests)
5. [Écrire de nouveaux tests](#écrire-de-nouveaux-tests)
6. [Dépannage](#dépannage)
7. [CI/CD](#cicd)

---

## Installation de Maestro

### Sur Windows

```bash
# Méthode 1: Via Scoop (recommandé)
scoop bucket add maestro https://github.com/mobile-dev-inc/maestro
scoop install maestro

# Méthode 2: Via PowerShell
irm https://get.maestro.mobile.dev | iex
```

### Sur macOS/Linux

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

### Vérifier l'installation

```bash
maestro --version
```

Vous devriez voir quelque chose comme : `Maestro version 1.x.x`

---

## Structure des tests

```
.maestro/
├── config.yaml              # Configuration globale
├── flows/                   # Tests E2E
│   ├── login.yaml          # Flow de connexion réutilisable
│   ├── create-alert.yaml   # Test complet de création d'alerte
│   └── helpers/            # Sous-flows réutilisables (à venir)
└── README.md               # Cette documentation
```

### Fichiers de test

- **`config.yaml`** : Configuration globale (variables d'environnement, timeouts, credentials)
- **`login.yaml`** : Flow de connexion réutilisable, appelé par d'autres tests
- **`create-alert.yaml`** : Test E2E complet du flux de création d'alerte (Happy Path)

---

## Configuration

### Variables d'environnement

Le fichier `config.yaml` contient les variables suivantes :

```yaml
env:
  API_URL: "http://10.0.2.2:4000/api"      # Backend (10.0.2.2 = localhost depuis émulateur Android)
  TEST_EMAIL: "maestro-test@japap.com"      # Email de l'utilisateur de test
  TEST_PHONE: "+237600000000"               # Téléphone de l'utilisateur de test
  TEST_PASSWORD: "TestPassword123!"         # Mot de passe de l'utilisateur de test
  DEFAULT_TIMEOUT: 10000                    # Timeout par défaut (ms)
  NETWORK_TIMEOUT: 15000                    # Timeout réseau (ms)
  LOCATION_TIMEOUT: 8000                    # Timeout localisation (ms)
```

### Utilisateur de test

Avant de lancer les tests, créez l'utilisateur de test :

```bash
cd japap
npm run test:setup
```

Ce script va :
1. ✅ Vérifier si le backend est accessible
2. ✅ Vérifier si l'utilisateur de test existe
3. ✅ Créer l'utilisateur s'il n'existe pas
4. ✅ Tester la connexion

---

## Lancer les tests

### Prérequis

1. **Backend démarré** :
   ```bash
   cd japap-backend
   npm run dev
   ```

2. **Application buildée et lancée** :
   ```bash
   cd japap
   npx expo run:android  # ou npx expo run:ios
   ```

3. **Utilisateur de test créé** :
   ```bash
   npm run test:setup
   ```

### Commandes de test

#### Tous les tests

```bash
npm run test:e2e
```

#### Test spécifique : Création d'alerte

```bash
npm run test:e2e:create-alert
```

#### Test spécifique : Login

```bash
npm run test:e2e:login
```

#### En mode interactif (avec Maestro Studio)

```bash
maestro studio
```

Puis dans Studio, ouvrez le flow `.maestro/flows/create-alert.yaml` et exécutez-le pas à pas.

---

## Écrire de nouveaux tests

### Structure d'un test Maestro

```yaml
appId: com.joker95.japap
---
# Étape 1: Description
- runScript: echo "📝 Démarrage du test"

# Étape 2: Lancer l'app
- launchApp:
    clearState: true

# Étape 3: Interactions
- tapOn:
    id: "mon-bouton"
- inputText: "Mon texte"

# Étape 4: Assertions
- assertVisible:
    text: "Succès"
```

### Bonnes pratiques

1. **Utiliser des testID** : Toujours préférer `id: "testID"` plutôt que `text: "Texte"`
   - ✅ `id: "alert-submit-button"`
   - ❌ `text: "Envoyer"`

2. **Attendre les animations** : Utiliser `waitForAnimationToEnd` après les actions importantes
   ```yaml
   - tapOn:
       id: "submit-button"
   - waitForAnimationToEnd
   ```

3. **Timeouts** : Utiliser des timeouts pour les opérations longues
   ```yaml
   - assertVisible:
       id: "loading-indicator"
       timeout: 10000
   ```

4. **Logging** : Ajouter des logs pour le debugging
   ```yaml
   - runScript: echo "✅ Étape 1 terminée"
   ```

5. **Réutiliser des flows** : Utiliser `runFlow` pour les actions communes
   ```yaml
   - runFlow: login.yaml
   ```

### Sélecteurs disponibles

- **Par testID** (recommandé) :
  ```yaml
  - tapOn:
      id: "alert-submit-button"
  ```

- **Par texte** :
  ```yaml
  - tapOn:
      text: "Envoyer"
  ```

- **Par index** :
  ```yaml
  - tapOn:
      index: 0  # Premier élément
  ```

- **Avec regex** :
  ```yaml
  - tapOn:
      text: "Se connecter|Login|Connexion"  # OU logique
  ```

---

## TestID ajoutés

### CategorySelectionModal

- `category-close-button` : Bouton de fermeture du modal
- `category-modal-title` : Titre "Que se passe-t-il ?"
- `category-card-{CODE}` : Cards de catégories (ex: `category-card-ACCG`)

### AlertDetailFormModal

- `alert-back-button` : Bouton retour
- `alert-description-input` : Champ de description
- `alert-record-button` : Bouton micro
- `alert-photo-button` : Bouton photo
- `alert-location-button` : Bouton localisation
- `alert-location-text` : Texte de l'adresse
- `alert-submit-button` : Bouton "Envoyer"

### Navigation (Tabs)

- `tab-create` : Onglet "Créer"
- `tab-alerts` : Onglet "Alertes"

---

## Dépannage

### Maestro ne trouve pas l'appareil

```bash
# Lister les appareils connectés
maestro test --help

# Vérifier ADB (Android)
adb devices

# Vérifier les simulateurs (iOS)
xcrun simctl list devices
```

### L'application ne se lance pas

```bash
# Rebuild l'application
cd japap
npx expo run:android --no-build-cache
```

### TestID non trouvés

Vérifiez que vous avez bien rebuild l'application après avoir ajouté les testID :

```bash
rm -rf .expo
npx expo run:android
```

### Backend non accessible

Vérifiez que le backend tourne et est accessible :

```bash
# Depuis l'émulateur Android, 10.0.2.2 = localhost de votre machine
curl http://10.0.2.2:4000/api/alerts

# Depuis votre machine
curl http://localhost:4000/api/alerts
```

### Timeout lors du géocodage

Si le test échoue à cause de la localisation :

1. Vérifiez que Google Maps API est configurée dans `app.json`
2. Augmentez `LOCATION_TIMEOUT` dans `config.yaml`
3. Vérifiez les permissions de localisation sur l'appareil

---

## CI/CD

### GitHub Actions (à venir)

Exemple de workflow pour exécuter les tests Maestro en CI :

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Maestro
        run: |
          curl -Ls "https://get.maestro.mobile.dev" | bash
          echo "$HOME/.maestro/bin" >> $GITHUB_PATH

      - name: Install dependencies
        run: cd japap && npm install

      - name: Build Android app
        run: cd japap && npx expo build:android

      - name: Run E2E tests
        run: cd japap && npm run test:e2e
```

### Maestro Cloud

Pour exécuter les tests sur le cloud Maestro (appareils réels) :

```bash
npm run test:e2e:cloud
```

---

## Ressources

- [Documentation officielle Maestro](https://maestro.mobile.dev/)
- [Exemples de tests](https://github.com/mobile-dev-inc/maestro/tree/main/maestro-test/src/test/resources/workspace)
- [Maestro Studio](https://maestro.mobile.dev/getting-started/maestro-studio)
- [API Reference](https://maestro.mobile.dev/api-reference)

---

## Support

Pour toute question ou problème :

1. Consultez cette documentation
2. Vérifiez les logs des tests : `maestro test --debug`
3. Utilisez Maestro Studio pour debugger interactivement
4. Contactez l'équipe de développement JAPAP

---

**Bon testing ! 🎉**
