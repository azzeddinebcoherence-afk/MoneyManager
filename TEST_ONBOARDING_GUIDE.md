# ✅ Guide de Test - Onboarding Charges Islamiques

## 🎯 Objectif
Vérifier que l'onboarding des charges islamiques fonctionne correctement et que l'utilisateur peut choisir d'activer ou non cette fonctionnalité.

## 🧪 Tests à Effectuer

### 1. Test Onboarding Initial
**Situation:** Premier lancement après authentification
- [ ] L'écran d'onboarding islamique s'affiche automatiquement
- [ ] Le titre "Charges Islamiques" et l'icône 🌙 sont visibles
- [ ] La description explique clairement la fonctionnalité
- [ ] Deux boutons sont présents : "Oui, activer" et "Non, peut-être plus tard"

### 2. Test Activation (Bouton "Oui, activer")
**Actions:**
1. Cliquer sur "Oui, activer"
2. Attendre la fin du processus de chargement

**Résultats attendus:**
- [ ] Loader affiché pendant le traitement
- [ ] Pas d'erreur affichée
- [ ] Transition vers l'app principale
- [ ] Les charges islamiques sont générées automatiquement
- [ ] Dans les paramètres : Toggle "Charges Islamiques" = ACTIVÉ

### 3. Test Désactivation (Bouton "Non, peut-être plus tard")
**Actions:**
1. Cliquer sur "Non, peut-être plus tard"

**Résultats attendus:**
- [ ] Transition immédiate vers l'app principale
- [ ] Dans les paramètres : Toggle "Charges Islamiques" = DÉSACTIVÉ
- [ ] Aucune charge islamique générée

### 4. Test Changement d'Avis (après désactivation)
**Actions:**
1. Aller dans Paramètres > Charges Islamiques
2. Activer le toggle "Charges Islamiques"

**Résultats attendus:**
- [ ] Génération automatique des charges islamiques
- [ ] Alert de confirmation affiché
- [ ] Charges visibles dans "Charges Annuelles" avec filtre islamique

### 5. Test Changement d'Avis (après activation)
**Actions:**
1. Aller dans Paramètres > Charges Islamiques
2. Désactiver le toggle "Charges Islamiques"

**Résultats attendus:**
- [ ] Alert de confirmation de suppression
- [ ] Charges islamiques supprimées de la base de données
- [ ] Seules les charges annuelles normales restent visibles

### 6. Test Navigation
**Après activation des charges islamiques:**
- [ ] Dans "Charges Annuelles" : bouton "🕌 Charges islamiques" visible
- [ ] Clic sur le bouton permet de filtrer les charges islamiques uniquement
- [ ] Charges affichées avec informations correctes (noms, dates, montants)

### 7. Test Persistance
**Actions:**
1. Fermer complètement l'app
2. Relancer l'app

**Résultats attendus:**
- [ ] L'onboarding ne s'affiche plus
- [ ] Les paramètres choisis sont conservés
- [ ] Les charges générées sont toujours présentes

## 🐛 Points de Vigilance

### Erreurs Possibles
- **Erreur génération:** Si les charges ne se génèrent pas, vérifier les logs console
- **Erreur navigation:** Si l'app crash après l'onboarding, vérifier les imports
- **Erreur persistance:** Si les paramètres ne sont pas sauvegardés, vérifier AsyncStorage

### Logs à Surveiller
Ouvrir la console de développement et chercher :
- `✅ Charges islamiques générées pour 2025`
- `💾 Paramètres islamiques sauvegardés`
- `🗑️ X charges islamiques supprimées`
- Aucun log d'erreur `❌`

## 🔧 Dépannage

### Si l'onboarding ne s'affiche pas :
1. Supprimer les données de l'app
2. Ou exécuter : `AsyncStorage.removeItem('@islamic_onboarding_completed')`

### Si les charges ne se génèrent pas :
1. Vérifier que `islamicSettings.isEnabled = true`
2. Vérifier les logs dans IslamicCalendarService
3. Contrôler la base de données SQLite

### Si l'app crash :
1. Vérifier les imports dans App.tsx
2. Contrôler que tous les Context Providers sont bien configurés
3. Regarder les erreurs Metro/Expo

## ✅ Critères de Succès

L'onboarding est considéré comme réussi si :
1. ✅ L'utilisateur voit l'écran d'onboarding au premier lancement
2. ✅ Il peut choisir d'activer ou désactiver les charges islamiques
3. ✅ Son choix est respecté et persistant
4. ✅ Les charges se génèrent automatiquement si activées
5. ✅ Il peut changer d'avis dans les paramètres
6. ✅ Aucun crash ou erreur bloquante

---

**Note:** Ce test doit être effectué sur un appareil physique ou un émulateur propre pour simuler une vraie première utilisation.