# 🔐 Système d'Authentification - Guide Complet

## 📱 Écrans créés

### 1. **LoginScreen** (Mis à jour)
- **Emplacement** : `src/screens/auth/LoginScreen.tsx`
- **Fonctionnalités** :
  - Connexion avec email/mot de passe
  - Validation en temps réel des champs
  - Affichage/masquage du mot de passe (icône œil)
  - Gestion des états de chargement
  - Messages d'erreur contextuels
  - Lien vers "Mot de passe oublié"
  - Lien vers "Créer un compte" (si pas encore inscrit)

### 2. **RegisterScreen** (Nouveau ✨)
- **Emplacement** : `src/screens/auth/RegisterScreen.tsx`
- **Fonctionnalités** :
  - Inscription avec email/mot de passe
  - Confirmation du mot de passe
  - Validation stricte :
    - Format email valide
    - Mot de passe min 6 caractères
    - Les deux mots de passe doivent correspondre
  - Affichage/masquage des mots de passe
  - Bouton retour vers connexion
  - Création automatique du compte et connexion

### 3. **ForgotPasswordScreen** (Nouveau ✨)
- **Emplacement** : `src/screens/auth/ForgotPasswordScreen.tsx`
- **Fonctionnalités** :
  - Processus en 2 étapes :
    - **Étape 1** : Saisie de l'email
    - **Étape 2** : Code de vérification + nouveau mot de passe
  - Code de test : `123456` (simulé pour le développement)
  - Validation complète des champs
  - Affichage/masquage des mots de passe
  - Lien "Renvoyer le code"
  - Bouton retour vers connexion

## 🔄 Flux de Navigation

```
LoginScreen
    ├─► "Créer un compte" → RegisterScreen
    │                           └─► Inscription réussie → LoginScreen (auto-connecté)
    │
    ├─► "Mot de passe oublié" → ForgotPasswordScreen
    │                                ├─► Étape 1: Email
    │                                ├─► Étape 2: Code + Nouveau MDP
    │                                └─► Réinitialisation réussie → LoginScreen
    │
    └─► Connexion réussie → Application principale (Dashboard)
```

## 🛠️ Services Backend

### PasswordAuth Service
- **Emplacement** : `src/services/auth/passwordAuth.ts`
- **Nouvelles méthodes** :
  - `resetPassword(newPassword)` - Réinitialise le mot de passe sans demander l'ancien
  - `changePassword(current, new)` - Change le mot de passe (besoin de l'ancien)
  - `updateEmail(newEmail, password)` - Met à jour l'email avec confirmation
  - `validateEmail(email)` - Validation format email
  - `isSessionExpired(date)` - Vérifie expiration de session (30 jours)

## 🎨 Design et UX

### Style unifié
- **Couleur principale** : #6C63FF (violet moderne)
- **Palette** :
  - Fond : #f6f7fb (gris clair)
  - Cartes : #ffffff
  - Texte principal : #17233C
  - Texte secondaire : #6B7280
  - Erreur : #EF4444
  - Succès : #10B981

### Composants communs
- Icônes Ionicons dans tous les champs
- États de chargement avec ActivityIndicator
- Boutons avec ombres et feedback tactile
- Messages d'erreur sous chaque champ
- Animations de transition fluides

## 📝 Validation des champs

### Email
✅ Requis
✅ Format valide (regex : `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
✅ Pas d'espaces

### Mot de passe
✅ Requis
✅ Minimum 6 caractères
✅ Confirmation identique (pour inscription/réinitialisation)

### Code de vérification
✅ Requis
✅ 6 chiffres
✅ Validation côté serveur (pour le moment code test : 123456)

## 🔒 Sécurité

- **Encryption** : Tous les mots de passe sont chiffrés avec `EncryptionService`
- **Stockage sécurisé** : Utilisation de `expo-secure-store`
- **Session timeout** : 30 jours d'inactivité = déconnexion automatique
- **Pas de mot de passe en clair** : Jamais stocké ou affiché

## 🚀 Intégration App.tsx

### Routes ajoutées
```tsx
<Stack.Navigator>
  {!user ? (
    <>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </>
  ) : (
    <Stack.Screen name="Main" component={ModernDrawerNavigator} />
  )}
</Stack.Navigator>
```

## 📱 Utilisation

### Pour tester l'inscription
1. Ouvrir l'app
2. Cliquer sur "Créer un compte" (si pas encore inscrit)
3. Remplir email + mot de passe + confirmation
4. ✅ Compte créé et connecté automatiquement

### Pour tester la connexion
1. Ouvrir l'app
2. Entrer email + mot de passe
3. Cliquer sur "Se connecter"
4. ✅ Accès à l'application

### Pour tester la réinitialisation
1. Sur LoginScreen, cliquer "Mot de passe oublié ?"
2. Entrer votre email
3. Cliquer "Envoyer le code"
4. Entrer le code : **123456**
5. Entrer nouveau mot de passe + confirmation
6. ✅ Mot de passe réinitialisé

## 🐛 Notes de développement

- **Code de vérification simulé** : Dans une version production, implémenter l'envoi d'email avec un service comme SendGrid, AWS SES, ou Firebase
- **Validation serveur** : Ajouter une validation côté backend pour le code de vérification
- **Rate limiting** : Limiter le nombre de tentatives de connexion/réinitialisation
- **2FA** : Considérer l'ajout d'une authentification à deux facteurs pour plus de sécurité

## ✅ Checklist de test

- [ ] Inscription avec email valide
- [ ] Inscription avec email invalide (erreur)
- [ ] Inscription avec mot de passe < 6 caractères (erreur)
- [ ] Inscription avec mots de passe différents (erreur)
- [ ] Connexion avec bonnes credentials
- [ ] Connexion avec mauvaises credentials (erreur)
- [ ] Mot de passe oublié - envoi code
- [ ] Mot de passe oublié - code invalide (erreur)
- [ ] Mot de passe oublié - réinitialisation réussie
- [ ] Navigation entre les écrans (retour arrière)
- [ ] États de chargement visibles
- [ ] Affichage/masquage mot de passe fonctionne
