# 🕌 Prélèvement Automatique des Charges Islamiques

## 📋 Vue d'ensemble

Le système de prélèvement automatique des **charges islamiques** fonctionne de la même manière que les charges annuelles : lorsque la date d'échéance arrive, la charge est automatiquement déduite du compte associé.

---

## ✅ Comment ça fonctionne ?

### 1️⃣ **Déclenchement automatique**

Le système vérifie **automatiquement** à chaque ouverture de l'écran "Charges Annuelles" :

```typescript
// Au chargement de l'écran
loadData() {
  // 1. Traiter charges annuelles récurrentes (mois courant)
  await processAutoDeductCharges();
  
  // 2. Traiter charges islamiques dues (date arrivée)
  if (islamicSettings.isEnabled) {
    await processIslamicDueCharges();
  }
}
```

### 2️⃣ **Critères de traitement**

Une charge islamique est traitée automatiquement si **TOUS** ces critères sont remplis :

| Critère | Description | Requis |
|---------|-------------|--------|
| **`isEnabled`** | Charges islamiques activées dans les paramètres | ✅ Oui |
| **`isPaid`** | Charge non encore payée (`isPaid = false`) | ✅ Oui |
| **`dueDate`** | Date d'échéance arrivée (aujourd'hui ou passée) | ✅ Oui |
| **`autoDeduct`** | Prélèvement automatique activé | ✅ Oui |
| **`accountId`** | Compte bancaire associé (non NULL) | ✅ Oui |

### 3️⃣ **Différence avec les charges annuelles**

| Aspect | Charges Annuelles | Charges Islamiques |
|--------|-------------------|-------------------|
| **Filtre temporel** | Mois courant uniquement | Dès que la date arrive |
| **Raison** | Récurrence mensuelle/trimestrielle | Dates basées sur calendrier Hijri |
| **Exemples** | Loyer novembre, Assurance décembre | Aïd al-Fitr, Aïd al-Adha, Zakat |

---

## 🔄 Processus de traitement

### Étape par étape

```
1. Identification des charges dues
   ↓
   SELECT * FROM annual_charges 
   WHERE is_islamic = 1 
   AND is_paid = 0 
   AND due_date <= AUJOURD'HUI
   AND auto_deduct = 1
   AND account_id IS NOT NULL
   
2. Pour chaque charge trouvée :
   ↓
   a. Vérifier le solde du compte
   b. Créer une transaction (type: expense)
   c. Déduire le montant du compte
   d. Marquer la charge comme payée
   
3. Synchronisation globale
   ↓
   - Rafraîchir Dashboard
   - Mettre à jour Comptes
   - Actualiser Transactions
   - Recharger Statistiques
```

---

## 💰 Exemple concret

### Scénario : Zakat al-Fitr 2025

**Configuration initiale** :
```typescript
Charge: "Zakat al-Fitr"
Montant: 30 MAD
Date: 2025-04-30 (fin du Ramadan)
Type: Obligatoire
Compte: "Compte Principal"
autoDeduct: true
isPaid: false
```

**Chronologie** :

| Date | Action | État |
|------|--------|------|
| **25 avril** | Charge créée par le système | ⏳ En attente |
| **29 avril** | Aucune action (date pas encore arrivée) | ⏳ En attente |
| **30 avril** | 🔥 **Prélèvement automatique** | ✅ Payée |
| | → 30 MAD déduits du compte | |
| | → Transaction créée | |
| | → Charge marquée comme payée | |

**Résultat** :
```
Compte avant : 1,000 MAD
Prélèvement : -30 MAD
Compte après : 970 MAD

Transaction créée :
  - Type: Dépense
  - Catégorie: Islamic
  - Description: "Charge annuelle: Zakat al-Fitr"
  - Montant: 30 MAD
```

---

## 🎛️ Configuration

### Activer le prélèvement automatique

Pour qu'une charge islamique soit prélevée automatiquement :

#### 1. **Activer les charges islamiques**
```typescript
// Dans Paramètres → Charges Islamiques
islamicSettings.isEnabled = true
```

#### 2. **Générer les charges**
```typescript
// Génération automatique lors de l'activation du toggle
generateChargesForCurrentYear()
```

#### 3. **Associer un compte à chaque charge**
```typescript
// Pour chaque charge que vous voulez automatiser
charge.accountId = "account-123"
charge.autoDeduct = true
```

---

## 🕌 Charges islamiques communes

### Charges obligatoires (Fard)

| Charge | Date approximative | Montant type |
|--------|-------------------|--------------|
| **Zakat al-Fitr** | Fin du Ramadan | 30-50 MAD |
| **Zakat al-Mal** | Anniversaire Nisab | 2.5% de l'épargne |
| **Fidya Ramadan** | Pendant Ramadan | Variable |

### Charges recommandées (Sunnah)

| Charge | Date approximative | Montant type |
|--------|-------------------|--------------|
| **Sadaqa Aïd al-Fitr** | Jour de l'Aïd | 50-100 MAD |
| **Udhiya (sacrifice)** | Aïd al-Adha | 1,500-3,000 MAD |
| **Sadaqa Ramadan** | Durant Ramadan | Variable |

---

## 📊 Bouton de traitement manuel

### Interface utilisateur

```
┌─────────────────────────────────────────────────┐
│ ⚡ Prélever toutes les charges                  → │
│    Annuelles + Islamiques (si activées)          │
└─────────────────────────────────────────────────┘
```

### Fonctionnement

Quand vous cliquez sur ce bouton :

1. **Confirmation demandée** :
   ```
   💰 Prélèvement Automatique
   
   Traiter automatiquement toutes les charges 
   récurrentes (annuelles + islamiques) avec 
   prélèvement automatique activé ?
   
   [Annuler]  [Traiter]
   ```

2. **Traitement en parallèle** :
   - Charges annuelles du mois courant
   - Charges islamiques dont la date est arrivée

3. **Résultat détaillé** :
   ```
   ✅ Traitement réussi
   
   6 charge(s) traitée(s) automatiquement
   
   📋 Annuelles: 4
   🕌 Islamiques: 2
   ```

---

## 🔍 Logs console

Le système génère des logs détaillés :

```javascript
// Au chargement
🔄 Traitement des prélèvements automatiques...
📊 Charges annuelles: 3 traitée(s)

// Charges islamiques
🕌 [ISLAMIC] Traitement des charges islamiques dues...
📊 [ISLAMIC] 2 charge(s) islamique(s) due(s) trouvée(s)
💰 [ISLAMIC] Traitement auto: Zakat al-Fitr (30 MAD)
✅ [ISLAMIC] Charge traitée: Zakat al-Fitr
💰 [ISLAMIC] Traitement auto: Sadaqa Aïd (50 MAD)
✅ [ISLAMIC] Charge traitée: Sadaqa Aïd
✅ [ISLAMIC] Traitement terminé: 2 charge(s) traitée(s), 0 erreur(s)

// Résumé
✅ Total traité: 5 charge(s)
```

---

## 🛡️ Gestion des erreurs

### Erreurs possibles

#### 1. **Solde insuffisant**
```
❌ Erreur
Zakat al-Fitr: Solde insuffisant dans le compte
```
**Solution** : Approvisionner le compte avant la date d'échéance

#### 2. **Compte invalide**
```
❌ Erreur
Sadaqa Ramadan: Compte non trouvé
```
**Solution** : Vérifier que le compte existe et associer la charge

#### 3. **Prélèvement désactivé**
```
ℹ️ [ISLAMIC] Charge ignorée (pas de prélèvement auto): Udhiya
```
**Solution** : Activer `autoDeduct` pour cette charge

#### 4. **Charges islamiques désactivées**
```
⏸️ [ISLAMIC] Traitement ignoré - fonctionnalité désactivée
```
**Solution** : Activer le toggle "Charges Islamiques"

---

## 📈 Statistiques et suivi

### Dashboard mis à jour automatiquement

Après chaque prélèvement, les widgets suivants se mettent à jour :

- **Solde total** : Réduit du montant prélevé
- **Dépenses du mois** : Augmenté du montant
- **Graphiques** : Recalculés avec les nouvelles données
- **Prochaines charges** : Charge disparue de la liste

### Page Comptes

```
Compte Principal
Solde : 970 MAD (↓ 30 MAD)

Dernière transaction :
💸 Charge annuelle: Zakat al-Fitr
-30 MAD
```

### Page Transactions

```
30 avril 2025
💸 Charge annuelle: Zakat al-Fitr
    Catégorie: Islamic
    Compte: Compte Principal
    -30 MAD
```

---

## 🎯 Bonnes pratiques

### 1. **Configurer à l'avance**
```typescript
// Dès la génération des charges
- Associer un compte à chaque charge
- Activer autoDeduct si souhaité
- Vérifier les montants par défaut
```

### 2. **Surveiller les dates**
```typescript
// Les charges islamiques suivent le calendrier Hijri
// Les dates peuvent varier de 10-15 jours d'une année à l'autre
- Vérifier chaque année
- Ajuster les montants si nécessaire
```

### 3. **Maintenir un solde suffisant**
```typescript
// Avant les grandes fêtes (Ramadan, Aïd)
- Provisionner le compte
- Vérifier les charges à venir
- Activer les alertes
```

### 4. **Tester le système**
```typescript
// Utiliser le bouton manuel pour tester
- Cliquer sur "Prélever toutes les charges"
- Vérifier le feedback
- Confirmer la synchronisation
```

---

## 🔧 Code technique

### Service (islamicChargeService.ts)

```typescript
async processDueIslamicCharges(userId: string) {
  const today = new Date();
  const islamicCharges = await getIslamicAnnualCharges(userId);
  
  // Filtrer charges dues
  const dueCharges = islamicCharges.filter(charge => 
    !charge.isPaid && 
    new Date(charge.dueDate) <= today &&
    charge.autoDeduct &&
    charge.accountId
  );
  
  // Traiter chaque charge
  for (const charge of dueCharges) {
    await payCharge(charge.id, charge.accountId, userId);
  }
  
  return { processed: dueCharges.length, errors: [] };
}
```

### Hook (useIslamicCharges.ts)

```typescript
const processDueCharges = async () => {
  if (!settings.isEnabled) return { processed: 0, errors: [] };
  
  const result = await islamicChargeService.processDueIslamicCharges(userId);
  
  if (result.processed > 0) {
    await loadIslamicCharges(); // Refresh
  }
  
  return result;
};
```

### UI (AnnualChargesScreen.tsx)

```typescript
const loadData = async () => {
  // 1. Charges annuelles
  const annualResult = await processAutoDeductCharges();
  
  // 2. Charges islamiques
  if (islamicSettings.isEnabled) {
    const islamicResult = await processIslamicDueCharges();
  }
  
  // 3. Rafraîchir l'interface
  await refreshAll();
};
```

---

## 📊 Comparaison des deux systèmes

| Aspect | Charges Annuelles | Charges Islamiques |
|--------|-------------------|-------------------|
| **Base temporelle** | Calendrier grégorien | Calendrier Hijri |
| **Filtre** | Mois courant | Date arrivée |
| **Récurrence** | Mensuel/Trimestriel/Annuel | Variable selon fête |
| **Exemples** | Loyer, Assurance, Abonnements | Zakat, Sadaqa, Fidya |
| **Génération** | Manuelle | Automatique (via calendrier) |
| **Suppression** | Possible (mois courant) | Via toggle ON/OFF |

---

## ✨ Résumé

Le système de prélèvement automatique des charges islamiques offre :

1. ✅ **Traitement automatique** dès que la date arrive
2. ✅ **Synchronisation totale** avec Dashboard, Comptes, Transactions
3. ✅ **Logs détaillés** pour suivre chaque opération
4. ✅ **Gestion d'erreurs** avec messages clairs
5. ✅ **Bouton manuel** pour traiter à la demande
6. ✅ **Protection financière** (vérification solde)
7. ✅ **Respect du calendrier Hijri** (dates précises)

**Résultat** : Gestion automatisée et respectueuse de vos obligations religieuses ! 🕌✨

---

## 📚 Références

- **Service** : `src/services/islamicChargeService.ts` (ligne 215-285)
- **Hook** : `src/hooks/useIslamicCharges.ts` (ligne 340-370)
- **UI** : `src/screens/AnnualChargesScreen.tsx` (ligne 80-110)
- **Calendrier** : `src/services/islamicCalendarService.ts`
