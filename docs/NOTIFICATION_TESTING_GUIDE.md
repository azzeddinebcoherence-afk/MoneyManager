# Guide de Test des Notifications Push

## ✅ Installation Complétée

Les packages suivants ont été installés avec succès :
- `expo-notifications@0.32.13`
- `expo-device@8.0.9`

## 🚀 Changements Effectués

### 1. App.tsx
- ✅ Import du hook `usePushNotifications`
- ✅ Initialisation automatique au démarrage
- ✅ Logs de confirmation dans la console

### 2. Navigation
- ✅ `NotificationSettingsScreen` ajouté à `ModernDrawerNavigator.tsx`
- ✅ Ajouté au `SettingsStack` pour accès via Paramètres
- ✅ Bouton de navigation dans `SettingsScreen`

### 3. Services
- ✅ `PushNotificationService` : Gestion native des notifications
- ✅ `NotificationService` : Service unifié (in-app + push)
- ✅ `usePushNotifications` : Hook React pour initialisation

## 📱 Comment Tester

### Test 1 : Sur Appareil Physique (OBLIGATOIRE)

**Important** : Les notifications push ne fonctionnent PAS sur simulateur/émulateur !

#### Android
```bash
# Construire et lancer sur appareil Android connecté
npx expo run:android
```

#### iOS
```bash
# Construire et lancer sur appareil iOS connecté
npx expo run:ios
```

### Test 2 : Vérifier l'Initialisation

1. **Ouvrir l'app sur l'appareil physique**
2. **Vérifier les logs Metro** :
   ```
   ✅ Notifications push activées
   ```
   OU
   ```
   ⚠️ Notifications push initialisées mais permissions non accordées
   ```

3. **Accorder les permissions** si demandé :
   - Android : Popup automatique au premier lancement
   - iOS : Popup système demandant l'autorisation

### Test 3 : Accéder aux Paramètres de Notification

1. Ouvrir l'app
2. Aller dans **Menu → Paramètres**
3. Taper sur **Notifications** (avec icône 🔔)
4. Vérifier que l'écran s'affiche correctement

### Test 4 : Tester une Notification

Dans l'écran **Paramètres de Notification** :

1. **Vérifier l'état** :
   - ✅ Vert = Permissions accordées
   - ⚠️ Orange = Permissions refusées

2. **Taper sur "Envoyer une notification de test"**
3. **Vérifier** :
   - Notification apparaît en haut de l'écran
   - Son joué (si activé)
   - Badge mis à jour sur l'icône de l'app

### Test 5 : Notification Automatique de Transaction

1. Aller dans **Transactions → Ajouter**
2. Créer une nouvelle transaction
3. **Vérifier** :
   - Notification push affichée : "💰 Transaction ajoutée"
   - Message : "Dépense de XXX Dh pour [Catégorie]"
   - Badge mis à jour

### Test 6 : Notification Planifiée

Dans **Paramètres de Notification** :

1. Taper sur **"Planifier rappel quotidien"**
2. Attendre jusqu'à 18h00 (ou modifier l'heure dans le code)
3. **Vérifier** : Notification reçue à l'heure programmée

### Test 7 : Configuration des Préférences

Dans **Paramètres de Notification** :

1. **Désactiver le son** : Toggle OFF
2. Tester notification → Pas de son ✅
3. **Désactiver les transactions** : Toggle OFF
4. Créer transaction → Pas de notification ✅
5. **Réactiver tout** : Toggle ON

## 🔧 Résolution de Problèmes

### Problème : Permissions non accordées

**Solution iOS** :
```
Réglages → [Nom de l'App] → Notifications → Autoriser les notifications
```

**Solution Android** :
```
Paramètres → Applications → [Nom de l'App] → Notifications → Activer
```

### Problème : Notifications ne s'affichent pas

**Vérifications** :
1. Test sur appareil physique (PAS émulateur)
2. Permissions accordées
3. Push activé dans l'app
4. Metro bundler en cours d'exécution
5. Logs console pour erreurs

### Problème : Badge ne s'actualise pas

**Solution** :
1. Aller dans Paramètres Notification
2. Taper sur "Effacer toutes les notifications"
3. Badge réinitialisé à 0

## 📊 Logs Attendus

### Initialisation Réussie
```
🚀 Démarrage de l'initialisation de l'application...
🔤 Chargement des polices Ionicons...
✅ Polices Ionicons chargées avec succès
✅ Notifications push activées
📬 [Push] Service initialized successfully
```

### Permission Refusée
```
⚠️ Notifications push initialisées mais permissions non accordées
⚠️ [Push] Notification permissions not granted
```

### Notification Envoyée
```
📬 Notification reçue: 💰 Transaction ajoutée
👆 Notification tapée: { category: "Alimentation", amount: 150 }
```

## 🎯 Fonctionnalités à Tester

- [x] Initialisation automatique au démarrage
- [x] Demande de permissions
- [x] Notification de test manuelle
- [x] Notification automatique (transaction)
- [x] Badge compteur
- [x] Notification planifiée
- [x] Configuration granulaire (son, vibration, types)
- [x] Persistance des préférences
- [x] Effacement des notifications
- [x] Navigation vers l'app au tap

## 📝 Notes Importantes

1. **Appareil Physique Obligatoire** : Les simulateurs ne supportent pas les notifications push
2. **iOS** : Nécessite un profil de provisioning valide
3. **Android** : Fonctionne directement avec `expo run:android`
4. **Badge** : iOS uniquement (Android utilise le centre de notifications)
5. **Son** : Nécessite fichiers audio dans `assets/` pour personnalisation

## 🔄 Prochaines Étapes

1. **Tester sur appareil physique**
2. **Intégrer dans d'autres hooks** :
   - `useSavings` : Objectifs d'épargne
   - `useTransfers` : Transferts entre comptes
   - `useBackup` : Sauvegardes
   - `useSync` : Synchronisation
3. **Programmer rappels récurrents** :
   - Vérification quotidienne (18h)
   - Rapport mensuel (dernier jour du mois)
   - Factures à venir (3 jours avant échéance)
4. **Monitoring** :
   - Taux d'ouverture des notifications
   - Préférences utilisateur
   - Optimisation timing

## ❓ Support

En cas de problème :
1. Vérifier les logs Metro
2. Consulter `PUSH_NOTIFICATIONS_SETUP.md`
3. Vérifier permissions appareil
4. Redémarrer l'app complètement
5. Reconstruire avec `npx expo run:[platform]`
