# 🚀 Maestro Quick Start - JAPAP

Guide rapide pour exécuter les tests E2E avec Maestro en quelques minutes.

## ⚡ Installation rapide (5 minutes)

### 1. Installer Maestro

**Sur Windows** (PowerShell en administrateur) :
```powershell
irm https://get.maestro.mobile.dev | iex
```

**Sur macOS/Linux** :
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Vérifiez l'installation :
```bash
maestro --version
```

### 2. Démarrer le backend

```bash
cd japap-backend
npm run dev
```

Le backend doit être accessible sur `http://localhost:4000`

### 3. Créer l'utilisateur de test

```bash
cd japap
npm run test:setup
```

Vous devriez voir :
```
✅ Setup terminé avec succès !
📋 Credentials pour Maestro:
   Email:     maestro-test@japap.com
   Téléphone: +237600000000
   Password:  TestPassword123!
```

### 4. Builder et lancer l'app

```bash
cd japap
npx expo run:android  # ou npx expo run:ios
```

---

## 🎯 Lancer les tests

### Test complet (Happy Path création d'alerte)

```bash
npm run test:e2e:create-alert
```

### Tous les tests

```bash
npm run test:e2e
```

### Test de connexion uniquement

```bash
npm run test:e2e:login
```

---

## 📊 Résultat attendu

Si tout fonctionne, vous devriez voir :

```
📝 Test E2E: Création d'alerte
🔐 Phase 1: Connexion
✅ Phase 1 terminée: Utilisateur connecté
🗺️ Phase 2: Navigation vers création d'alerte
✅ Phase 2 terminée: Modal de sélection visible
📋 Phase 3: Sélection d'une catégorie d'alerte
✅ Phase 3 terminée: Catégorie sélectionnée
📍 Phase 4: Vérification de la localisation
✅ Phase 4 terminée: Localisation récupérée
✍️ Phase 5: Remplissage du formulaire
✅ Phase 5 terminée: Formulaire rempli
📤 Phase 6: Soumission de l'alerte
✅ Phase 6 terminée: Alerte soumise
✅ Phase 7: Vérification de la création
✅ Phase 7 terminée: Alerte créée avec succès!
📋 Phase 8: Vérification de l'alerte dans la liste
✅ Phase 8 terminée: Alerte visible dans la liste
🎉 Test E2E réussi: Alerte créée et visible!

✅ Flow completed successfully
```

---

## 🐛 Dépannage rapide

### Problème : "No devices found"

```bash
# Android
adb devices

# iOS
xcrun simctl list devices
```

### Problème : "Backend not accessible"

Vérifiez que le backend tourne :
```bash
curl http://localhost:4000/api/alerts
```

### Problème : "testID not found"

Rebuilder l'application :
```bash
rm -rf .expo
npx expo run:android --no-build-cache
```

### Problème : "User login failed"

Relancer le script de setup :
```bash
npm run test:setup
```

---

## 🎬 Mode interactif (Maestro Studio)

Pour debugger ou créer de nouveaux tests :

```bash
maestro studio
```

Puis ouvrez `.maestro/flows/create-alert.yaml` et exécutez pas à pas.

---

## 📚 Documentation complète

Pour plus de détails, consultez :
- [.maestro/README.md](.maestro/README.md) - Documentation complète
- [https://maestro.mobile.dev/](https://maestro.mobile.dev/) - Documentation officielle Maestro

---

## ✅ Checklist avant de lancer les tests

- [ ] Maestro installé (`maestro --version`)
- [ ] Backend démarré (`http://localhost:4000`)
- [ ] Utilisateur de test créé (`npm run test:setup`)
- [ ] Application buildée et lancée (`npx expo run:android`)
- [ ] Émulateur/Simulateur en cours d'exécution
- [ ] Google Maps API configurée (pour la localisation)

---

**Happy testing! 🎉**
