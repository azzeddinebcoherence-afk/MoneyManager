# 🔄 Système de Synchronisation lors de la Suppression de Charges

## 📋 Vue d'ensemble

Ce document explique comment la **suppression d'une charge annuelle** est **synchronisée automatiquement** à travers toute l'application, garantissant la cohérence des données sur **toutes les pages**.

---

## ✅ Ce qui se passe lors de la suppression

### 1️⃣ **Validation du mois courant**
```typescript
// ⚠️ Seules les charges DU MOIS COURANT peuvent être supprimées
const isCurrentMonth = 
  chargeDueDate.getMonth() === today.getMonth() && 
  chargeDueDate.getFullYear() === today.getFullYear();

if (!isCurrentMonth) {
  throw new Error('❌ Impossible de supprimer (mois passé/futur)');
}
```

**Protection** : Empêche la suppression de charges historiques ou futures

---

### 2️⃣ **Remboursement automatique du compte** 💰

```typescript
if (charge.isPaid && charge.accountId) {
  // Récupérer le solde actuel
  const oldBalance = account.balance;
  
  // Calculer le nouveau solde
  const newBalance = oldBalance + charge.amount;
  
  // Mettre à jour le compte dans la base de données
  await db.runAsync(
    `UPDATE accounts SET balance = ? WHERE id = ?`,
    [newBalance, charge.accountId]
  );
  
  console.log(`✅ Compte remboursé: ${oldBalance} → ${newBalance} MAD`);
}
```

**Garantie financière** : Si la charge était payée, l'argent est automatiquement recrédité

---

### 3️⃣ **Suppression de la transaction associée** 🗑️

```typescript
// Rechercher la transaction correspondante
const transaction = await db.getFirstAsync(
  `SELECT id FROM transactions 
   WHERE description LIKE ? 
   AND amount = ? 
   AND account_id = ?`,
  [`%${charge.name}%`, charge.amount, charge.accountId]
);

if (transaction) {
  // Supprimer la transaction
  await db.runAsync(
    `DELETE FROM transactions WHERE id = ?`,
    [transaction.id]
  );
  
  console.log(`✅ Transaction supprimée: ${transaction.id}`);
}
```

**Cohérence des données** : La transaction est supprimée de l'historique

---

### 4️⃣ **Suppression de la charge annuelle** ✂️

```typescript
await db.runAsync(
  `DELETE FROM annual_charges WHERE id = ?`,
  [chargeId]
);

console.log('✅ Charge annuelle supprimée');
```

---

### 5️⃣ **Déclenchement du refresh global** 🌐

```typescript
// Dans useAnnualCharges.ts
const deleteAnnualCharge = async (chargeId: string) => {
  await annualChargeService.deleteAnnualCharge(chargeId, userId);
  
  await loadCharges();           // ✅ Recharge les charges
  forceRefresh();                // ✅ Force le re-render local
  triggerGlobalRefresh();        // ✅ Déclenche le refresh GLOBAL
};
```

**Synchronisation totale** : Toutes les pages qui écoutent `refreshKey` se mettent à jour

---

## 🔗 Pages synchronisées automatiquement

### 1. **AnnualChargesScreen** 📅
- Liste des charges mise à jour instantanément
- Statistiques recalculées
- Filtres réappliqués

### 2. **DashboardScreen** 🏠
```typescript
// Écoute le refreshKey global
React.useEffect(() => {
  if (refreshKey > 0) {
    console.log('🔄 Dashboard: Refresh global, rechargement...');
    onRefresh(); // Recharge tous les widgets
  }
}, [refreshKey]);
```

**Widgets mis à jour** :
- Solde total des comptes ✅
- Graphiques de revenus/dépenses ✅
- Liste des transactions récentes ✅
- Prochaines charges annuelles ✅

### 3. **AccountsScreen** 💳
- Solde du compte remboursé visible immédiatement
- Historique des transactions actualisé

### 4. **TransactionsScreen** 📊
- Transaction supprimée disparaît de la liste
- Montants totaux recalculés

### 5. **AnalyticsScreen** 📈
- Graphiques et statistiques recalculés
- Catégories de dépenses mises à jour

---

## 🧪 Scénario de test complet

### Scénario : Suppression d'une charge payée

**État initial** :
```
Charge: "Loyer Novembre 2025"
Montant: 5,000 MAD
État: Payée (isPaid = true)
Compte: "Compte Principal" (balance = 10,000 MAD)
Transaction: "Charge annuelle: Loyer" dans l'historique
```

**Action** :
```typescript
await deleteAnnualCharge('charge-123');
```

**Résultat attendu** :

| Élément | Avant | Après |
|---------|-------|-------|
| **Charge annuelle** | Existe dans `annual_charges` | ❌ Supprimée |
| **Solde du compte** | 10,000 MAD | ✅ 15,000 MAD (+5,000) |
| **Transaction** | Existe dans `transactions` | ❌ Supprimée |
| **Dashboard** | Affiche la charge | ✅ Mise à jour automatique |
| **Liste des charges** | 10 charges | ✅ 9 charges |

---

## 📊 Logs console détaillés

Lors de la suppression, vous verrez dans la console :

```
🗑️ [SUPPRESSION] Étape 1/6: Récupération des infos de la charge...
📋 [SUPPRESSION] Charge trouvée: {
  name: "Loyer",
  amount: 5000,
  isPaid: true,
  accountId: "account-123",
  dueDate: "2025-11-01"
}

📅 [SUPPRESSION] Étape 2/6: Vérification du mois...
✅ [SUPPRESSION] Mois courant validé

💰 [SUPPRESSION] Étape 3/6: Remboursement du compte...
   → Charge payée détectée, remboursement de 5000 MAD
✅ [SUPPRESSION] Compte account-123 remboursé:
   → Ancien solde: 10000 MAD
   → Nouveau solde: 15000 MAD (+5000 MAD)

🔍 [SUPPRESSION] Étape 4/6: Recherche de la transaction associée...
   → Transaction trouvée: transaction-456
✅ [SUPPRESSION] Transaction supprimée de la base de données

🗑️ [SUPPRESSION] Étape 5/6: Suppression de la charge annuelle...
✅ [SUPPRESSION] Étape 6/6: Charge annuelle supprimée avec succès!

📊 [SUPPRESSION] Résumé:
   → Charge "Loyer" supprimée
   → Compte remboursé: Oui
   → Transaction supprimée: Oui
🔄 [SUPPRESSION] Les modifications seront synchronisées sur toutes les pages

🔄 [useAnnualCharges] Rechargement des charges...
🔄 Dashboard: Refresh global détecté, rechargement automatique...
✅ Dashboard: Rechargement des données terminé
```

---

## 🛡️ Protections mises en place

### 1. **Protection temporelle**
- ✅ Seules les charges du **mois courant** peuvent être supprimées
- ❌ Les charges passées sont **verrouillées** (historique protégé)
- ❌ Les charges futures sont **non supprimables** (planification préservée)

### 2. **Intégrité financière**
- ✅ Remboursement **automatique** si charge payée
- ✅ Calcul exact du nouveau solde : `balance + charge.amount`
- ✅ Mise à jour immédiate dans la base de données

### 3. **Cohérence des données**
- ✅ Suppression de la transaction associée
- ✅ Recherche par description, montant et compte
- ✅ Tri par date de création (la plus récente)

### 4. **Synchronisation multi-écrans**
- ✅ Refresh global via `RefreshContext`
- ✅ Toutes les pages écoutent `refreshKey`
- ✅ Rechargement automatique des widgets

---

## 🔧 Architecture technique

### Flux de données

```
┌─────────────────────────────────────────────────────────┐
│         AnnualChargesScreen (UI)                        │
│  [Bouton Supprimer] → handleDeleteCharge()             │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         useAnnualCharges (Hook)                         │
│  deleteAnnualCharge() → appelle le service             │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│      annualChargeService (Service Layer)                │
│  1. Valider mois courant                                │
│  2. Rembourser compte (UPDATE accounts)                 │
│  3. Supprimer transaction (DELETE transactions)         │
│  4. Supprimer charge (DELETE annual_charges)            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         SQLite Database                                 │
│  Tables: accounts, transactions, annual_charges         │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         RefreshContext (Global State)                   │
│  triggerGlobalRefresh() → refreshKey++                 │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        ▼             ▼             ▼             ▼
  Dashboard    Accounts      Transactions   Analytics
  (auto-refresh) (auto-update) (auto-update) (auto-refresh)
```

---

## 📝 Code clé

### Service (annualChargeService.ts)
```typescript
async deleteAnnualCharge(id: string, userId: string) {
  const charge = await this.getAnnualChargeById(id);
  
  // Validation mois courant
  if (!isCurrentMonth(charge.dueDate)) {
    throw new Error('Mois passé/futur non supprimable');
  }
  
  // Remboursement
  if (charge.isPaid && charge.accountId) {
    await refundAccount(charge.accountId, charge.amount);
    await deleteTransaction(charge);
  }
  
  // Suppression
  await db.runAsync('DELETE FROM annual_charges WHERE id = ?', [id]);
}
```

### Hook (useAnnualCharges.ts)
```typescript
const deleteAnnualCharge = async (chargeId: string) => {
  await annualChargeService.deleteAnnualCharge(chargeId, userId);
  await loadCharges();           // Reload local
  forceRefresh();                // Re-render local
  triggerGlobalRefresh();        // Global sync ✅
};
```

### Dashboard (DashboardScreen.tsx)
```typescript
const { refreshKey } = useRefresh();

React.useEffect(() => {
  if (refreshKey > 0) {
    onRefresh(); // Auto-reload all widgets
  }
}, [refreshKey]);
```

---

## 🎯 Résultat final

### ✅ Garanties offertes

1. **Cohérence financière totale** 💰
   - Les comptes sont toujours à jour
   - Aucune perte d'argent lors de suppression

2. **Synchronisation multi-écrans** 🌐
   - Dashboard, Comptes, Transactions, Analytics tous synchronisés
   - Pas besoin de refresh manuel

3. **Intégrité historique** 📜
   - Seules les charges du mois courant supprimables
   - Historique passé protégé

4. **Expérience utilisateur fluide** ✨
   - Feedback visuel immédiat
   - Messages d'erreur clairs
   - Logs détaillés pour le débogage

---

## 🐛 Débogage

### Vérifier qu'une charge a été correctement supprimée

```sql
-- Vérifier la charge
SELECT * FROM annual_charges WHERE id = 'charge-123';
-- Résultat attendu : Aucune ligne

-- Vérifier le compte
SELECT balance FROM accounts WHERE id = 'account-123';
-- Résultat attendu : Solde augmenté

-- Vérifier la transaction
SELECT * FROM transactions WHERE description LIKE '%Loyer%';
-- Résultat attendu : Transaction supprimée
```

### Vérifier la synchronisation

1. Ouvrir le Dashboard
2. Supprimer une charge payée
3. Observer la console :
   - ✅ Logs de suppression détaillés
   - ✅ Message "Refresh global détecté"
   - ✅ Message "Dashboard: Rechargement des données"

---

## 📚 Références

- **Service** : `src/services/annualChargeService.ts` (ligne 621-800)
- **Hook** : `src/hooks/useAnnualCharges.ts` (ligne 190-205)
- **UI** : `src/screens/AnnualChargesScreen.tsx` (ligne 147-175)
- **Context** : `src/context/RefreshContext.tsx`
- **Dashboard** : `src/screens/DashboardScreen.tsx` (ligne 440-448)

---

## ✨ Conclusion

Le système de suppression de charges est **complètement synchronisé** :

1. ✅ **Remboursement automatique** du compte
2. ✅ **Suppression de la transaction** associée
3. ✅ **Mise à jour instantanée** de toutes les pages
4. ✅ **Protection** des données historiques
5. ✅ **Logs détaillés** pour le suivi

**Résultat** : Une expérience utilisateur **cohérente** et **sans erreur** sur toute l'application ! 🚀
