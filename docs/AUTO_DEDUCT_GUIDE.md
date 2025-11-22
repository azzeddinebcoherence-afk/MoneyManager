# Guide du Prélèvement Automatique des Charges

## 📋 Vue d'ensemble

Le système de prélèvement automatique permet de traiter automatiquement les charges récurrentes du mois courant en déduisant leur montant directement du compte bancaire associé.

## 🚀 Fonctionnalités

### 1. Prélèvement automatique au chargement
- **Automatique** : Dès l'ouverture de l'écran des charges annuelles
- **Silencieux** : Traite les charges en arrière-plan
- **Intelligent** : Ne traite que les charges du mois courant

### 2. Bouton de traitement manuel
- **Visible** : Bouton "⚡ Prélever les charges récurrentes" 
- **Position** : En haut de l'écran, après le toggle des charges islamiques
- **Feedback** : Affiche le nombre de charges traitées et les erreurs éventuelles

### 3. Badge visuel sur les cartes
- **Indicateur "Auto"** : Badge orange avec icône éclair
- **Position** : À côté du badge "Charges Islamiques" si présent
- **Visible** : Sur toutes les charges avec `autoDeduct = true`

## ⚙️ Configuration d'une charge

Pour qu'une charge soit traitée automatiquement, elle doit répondre à **TOUS** ces critères :

### Critères obligatoires :
1. ✅ **`autoDeduct = 1`** : Prélèvement automatique activé
2. ✅ **`account_id`** : Compte bancaire associé (non NULL)
3. ✅ **`is_paid = 0`** : Charge non encore payée
4. ✅ **`is_active = 1`** : Charge active
5. ✅ **Mois courant** : La date d'échéance (`due_date`) doit être du mois et année actuels

### Validation supplémentaire :
- Le compte doit exister
- Le solde du compte doit être suffisant
- La charge ne doit pas être d'un mois passé ou futur

## 🔄 Flux de traitement

### Processus automatique

```
1. Chargement de l'écran
   ↓
2. Appel de processAutoDeductCharges()
   ↓
3. Récupération des charges éligibles (mois courant)
   ↓
4. Pour chaque charge :
   a. Validation (canPayCharge)
   b. Déduction du compte (createTransaction)
   c. Marquage comme payée (is_paid = 1)
   d. Si récurrente → génération prochaine occurrence
   ↓
5. Rechargement des données
   ↓
6. Affichage mis à jour
```

### Processus manuel (bouton)

```
1. Utilisateur clique sur "Prélever les charges récurrentes"
   ↓
2. Confirmation (Alert)
   ↓
3. Traitement identique au processus automatique
   ↓
4. Affichage du résultat :
   - Nombre de charges traitées
   - Liste des erreurs (si présentes)
```

## 💡 Cas d'utilisation

### Exemple 1 : Loyer mensuel
```typescript
{
  name: "Loyer",
  amount: 5000,
  category: "Logement",
  dueDate: "2025-11-01",
  isRecurring: true,
  recurrence: "monthly",
  autoDeduct: true,      // ✅ Prélèvement auto
  accountId: "account-1", // ✅ Compte associé
  isPaid: false
}
```
→ **Résultat** : Sera traité automatiquement le 1er novembre 2025

### Exemple 2 : Assurance trimestrielle
```typescript
{
  name: "Assurance Auto",
  amount: 1200,
  category: "Assurance",
  dueDate: "2025-12-01",
  isRecurring: true,
  recurrence: "quarterly",
  autoDeduct: true,
  accountId: "account-2",
  isPaid: false
}
```
→ **Résultat** : Sera traité en décembre 2025, pas avant

### Exemple 3 : Charge ponctuelle
```typescript
{
  name: "Réparation voiture",
  amount: 800,
  category: "Transport",
  dueDate: "2025-11-15",
  isRecurring: false,
  autoDeduct: true,
  accountId: "account-1",
  isPaid: false
}
```
→ **Résultat** : Sera traité en novembre 2025, aucune régénération

## 🛡️ Gestion des erreurs

### Messages d'erreur possibles :

1. **"Compte invalide"**
   - Le compte spécifié n'existe pas
   - Solution : Vérifier l'`accountId`

2. **"Solde insuffisant"**
   - Le compte n'a pas assez de fonds
   - Solution : Approvisionner le compte avant le traitement

3. **"Cette charge appartient à un mois passé/futur"**
   - La charge n'est pas du mois courant
   - Solution : Attendre le bon mois ou modifier la date

4. **"Charge déjà payée"**
   - La charge a déjà `is_paid = 1`
   - Solution : Vérifier l'état avant le traitement

## 📊 Interface utilisateur

### Bouton de prélèvement

```tsx
┌─────────────────────────────────────────────────┐
│ ⚡ Prélever les charges récurrentes            → │
│    Traiter automatiquement le mois courant       │
└─────────────────────────────────────────────────┘
```

### Badge sur les cartes

```tsx
┌──────────────────────────────────────┐
│ 🏠 Loyer              [⚡ Auto] [⭐]  │
│    Logement                           │
│                                       │
│ 5,000.00 MAD                         │
└──────────────────────────────────────┘
```

### Feedback de succès

```
✅ Traitement réussi

3 charge(s) traitée(s) automatiquement.

• Loyer - 5,000 MAD
• Assurance - 1,200 MAD
• Électricité - 450 MAD
```

### Feedback si aucune charge

```
ℹ️ Information

Aucune charge à traiter automatiquement ce mois.

Vérifiez que:
• Les charges ont le prélèvement automatique activé
• Un compte est associé
• Les charges sont du mois courant
```

## 🔧 Code technique

### Activer le prélèvement automatique

```typescript
// Lors de la création
const chargeData = {
  ...otherFields,
  autoDeduct: true,
  accountId: 'account-123'
};

await annualChargeService.createAnnualCharge(chargeData, userId);
```

### Appel manuel

```typescript
const result = await processAutoDeductCharges();

console.log(`Charges traitées: ${result.processed}`);
console.log(`Erreurs: ${result.errors.length}`);
```

### Service sous-jacent

```typescript
// Dans annualChargeService.ts
async processDueCharges(userId: string): Promise<{
  processed: number;
  errors: string[];
}> {
  // 1. Récupère les charges du mois courant avec auto_deduct = 1
  // 2. Valide chaque charge
  // 3. Paye et déduit du compte
  // 4. Génère la prochaine occurrence si récurrente
  // 5. Retourne le résultat
}
```

## 📝 Notes importantes

1. **Mois courant uniquement** : Seules les charges avec une date d'échéance dans le mois et l'année actuels sont traitées
2. **Transaction automatique** : Une transaction de type "expense" est créée automatiquement
3. **Récurrence** : Si la charge est récurrente, la prochaine occurrence est générée automatiquement après paiement
4. **Réversibilité** : Pour annuler, il faut supprimer la charge (avec remboursement automatique si du mois courant)
5. **Performance** : Le traitement est asynchrone et ne bloque pas l'interface

## 🎯 Bonnes pratiques

1. ✅ **Toujours associer un compte** avant d'activer `autoDeduct`
2. ✅ **Vérifier le solde** du compte régulièrement
3. ✅ **Utiliser la récurrence** pour les charges mensuelles/trimestrielles/annuelles
4. ✅ **Contrôler manuellement** via le bouton avant la fin du mois
5. ✅ **Surveiller les erreurs** dans les alertes de feedback

## 🐛 Débogage

### Logs console

```javascript
// Au chargement
🔄 Traitement de N charges dues ce mois (MM/AAAA)

// Pour chaque charge
💰 Déduction automatique du compte: { charge, amount, accountId }
✅ Charge traitée automatiquement: [nom]

// Fin de traitement
✅ Traitement automatique terminé: N charges traitées, M erreurs
```

### Vérifier si une charge sera traitée

```sql
SELECT * FROM annual_charges 
WHERE user_id = ? 
AND is_paid = 0 
AND auto_deduct = 1 
AND account_id IS NOT NULL 
AND is_active = 1
AND strftime('%Y', due_date) = '2025'
AND strftime('%m', due_date) = '11';
```

## 📚 Références

- Service : `src/services/annualChargeService.ts` - méthode `processDueCharges()`
- Hook : `src/hooks/useAnnualCharges.ts` - méthode `processAutoDeductCharges()`
- UI : `src/screens/AnnualChargesScreen.tsx` - bouton et badge "Auto"
- Types : `src/types/AnnualCharge.ts` - interface `AnnualCharge`
