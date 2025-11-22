# Guide d'utilisation du NotificationService

## 📋 Vue d'ensemble

Le `NotificationService` gère automatiquement les notifications de l'application pour tous les événements importants. Il est déjà intégré dans `useTransactions` et peut être utilisé dans d'autres hooks et services.

## 🔔 Types de notifications disponibles

### Transactions
```typescript
// Transaction ajoutée
await notificationService.notifyTransactionAdded(150.50, 'Alimentation', 'expense', 'Dh');
// 💸 Dépense ajoutée: 150.50 Dh - Alimentation

// Transaction modifiée
await notificationService.notifyTransactionUpdated(200.00, 'Restaurant', 'Dh');
// ✏️ Transaction modifiée: 200.00 Dh - Restaurant

// Transaction supprimée
await notificationService.notifyTransactionDeleted('Restaurant');
// 🗑️ Transaction supprimée: La transaction "Restaurant" a été supprimée
```

### Paiements
```typescript
// Paiement automatique
await notificationService.notifyAutomaticPayment(500, 'Loyer', 'Dh');
// 🔄 Paiement automatique: 500.00 Dh versé à Loyer

// Paiement récurrent programmé
await notificationService.notifyRecurringPaymentScheduled(
  300, 
  'Électricité', 
  '15/12/2025', 
  'Dh'
);
// 📅 Paiement programmé: 300.00 Dh à Électricité - Prochain paiement: 15/12/2025
```

### Remboursements
```typescript
// Remboursement reçu
await notificationService.notifyRefundReceived(75, 'Ahmed', 'Dh');
// 💚 Remboursement reçu: 75.00 Dh de Ahmed

// Remboursement en attente
await notificationService.notifyRefundPending(100, 'Fatima', 'Dh');
// ⏳ Remboursement en attente: 100.00 Dh à Fatima
```

### Transferts
```typescript
// Transfert entre comptes
await notificationService.notifyTransfer(
  1000,
  'Compte Courant',
  'Compte Épargne',
  'Dh'
);
// ↔️ Transfert effectué: 1000.00 Dh de Compte Courant vers Compte Épargne
```

### Épargne et Objectifs
```typescript
// Objectif atteint
await notificationService.notifyGoalReached('Vacances 2025', 5000, 'Dh');
// 🎉 Objectif atteint !: Félicitations ! Vous avez atteint votre objectif "Vacances 2025"

// Progrès de l'objectif
await notificationService.notifyGoalProgress(
  'Nouvelle voiture',
  75,
  15000,
  20000,
  'Dh'
);
// 📊 Progrès épargne: 75%: "Nouvelle voiture" - 15000.00/20000.00 Dh

// Contribution à l'épargne
await notificationService.notifySavingsContribution(500, 'Urgences', 'Dh');
// 💎 Épargne ajoutée: 500.00 Dh ajouté à "Urgences"
```

### Système
```typescript
// Rapport mensuel
await notificationService.notifyMonthlyReport('Novembre', 2025);
// 📈 Rapport mensuel disponible: Votre rapport pour Novembre 2025 est prêt

// Synchronisation
await notificationService.notifySyncSuccess(45);
// ✅ Synchronisation terminée: 45 élément(s) synchronisé(s) avec succès

// Backup créé
await notificationService.notifyBackupCreated('2.5 MB', '21/11/2025');
// 💾 Sauvegarde créée: Backup du 21/11/2025 (2.5 MB) disponible

// Backup restauré
await notificationService.notifyBackupRestored('15/11/2025');
// ♻️ Sauvegarde restaurée: Données du 15/11/2025 restaurées avec succès
```

### Comptes
```typescript
// Compte créé
await notificationService.notifyAccountCreated('Compte Pro', 'Bancaire');
// 🏦 Compte créé: Nouveau compte "Compte Pro" (Bancaire) ajouté

// Compte modifié
await notificationService.notifyAccountUpdated('Compte Courant');
// ✏️ Compte modifié: Le compte "Compte Courant" a été mis à jour
```

### Budget
```typescript
// Budget créé
await notificationService.notifyBudgetCreated('Transport', 800, 'Dh');
// 📊 Budget créé: Budget "Transport" : 800.00 Dh
```

### Notifications génériques
```typescript
// Succès
await notificationService.notifySuccess(
  'Opération réussie',
  'Vos modifications ont été enregistrées'
);
// ✅ Opération réussie: Vos modifications ont été enregistrées

// Information
await notificationService.notifyInfo(
  'Mise à jour disponible',
  'Une nouvelle version de l\'app est disponible'
);
// ℹ️ Mise à jour disponible: Une nouvelle version de l'app est disponible
```

## 🔧 Intégration dans les hooks

### Exemple : useTransfers.ts
```typescript
import { notificationService } from '../services/NotificationService';

export const useTransfers = () => {
  const createTransfer = async (
    amount: number,
    fromAccountId: string,
    toAccountId: string
  ) => {
    try {
      // Logique de transfert...
      
      // Notification automatique
      await notificationService.notifyTransfer(
        amount,
        fromAccount.name,
        toAccount.name,
        'Dh'
      );
      
    } catch (error) {
      // Gestion d'erreur...
    }
  };
};
```

### Exemple : useSavings.ts
```typescript
import { notificationService } from '../services/NotificationService';

export const useSavings = () => {
  const addContribution = async (goalId: string, amount: number) => {
    try {
      // Logique d'ajout...
      
      // Notification de contribution
      await notificationService.notifySavingsContribution(
        amount,
        goal.name,
        'Dh'
      );
      
      // Vérifier si objectif atteint
      if (newTotal >= goal.target) {
        await notificationService.notifyGoalReached(
          goal.name,
          goal.target,
          'Dh'
        );
      } else {
        // Notification de progrès tous les 25%
        const percentage = (newTotal / goal.target) * 100;
        if (percentage % 25 === 0) {
          await notificationService.notifyGoalProgress(
            goal.name,
            percentage,
            newTotal,
            goal.target,
            'Dh'
          );
        }
      }
      
    } catch (error) {
      // Gestion d'erreur...
    }
  };
};
```

### Exemple : useBackup.ts
```typescript
import { notificationService } from '../services/NotificationService';

export const useBackup = () => {
  const createBackup = async () => {
    try {
      const backup = await backupService.create();
      
      // Notification de backup créé
      await notificationService.notifyBackupCreated(
        backup.size,
        backup.date
      );
      
    } catch (error) {
      // Gestion d'erreur...
    }
  };

  const restoreBackup = async (backupId: string) => {
    try {
      const backup = await backupService.restore(backupId);
      
      // Notification de restauration
      await notificationService.notifyBackupRestored(backup.date);
      
    } catch (error) {
      // Gestion d'erreur...
    }
  };
};
```

## 🛠️ Méthodes utilitaires

```typescript
// Récupérer toutes les notifications
const notifications = await notificationService.getNotifications();

// Marquer comme lue
await notificationService.markAsRead(notificationId);

// Supprimer une notification
await notificationService.deleteNotification(notificationId);

// Nettoyer les notifications de plus de 30 jours
await notificationService.cleanOldNotifications(30);

// Définir l'utilisateur actif
notificationService.setUserId('user-123');
```

## 📱 Affichage dans l'interface

Les notifications sont automatiquement affichées dans :
- **NotificationsScreen** : Vue chronologique par date (Aujourd'hui, Hier, Cette semaine)
- **Dashboard** : Badge rouge avec compteur sur l'icône de notification
- **AlertsScreen** : Alertes urgentes (budget dépassé, dettes, etc.)

## 🎨 Icônes et couleurs

Chaque type de notification a une icône et une couleur spécifique :

| Type | Icône | Couleur de fond | Couleur icône |
|------|-------|-----------------|---------------|
| transaction | swap-horizontal | #E3F2FD | #007AFF |
| payment | card | #E8F5E9 | #34C759 |
| refund | arrow-undo | #E8F5E9 | #34C759 |
| transfer | git-compare | #FFF4E3 | #FF9500 |
| savings | trending-up | #E3F9E5 | #34C759 |
| goal | trophy | #FFF9E6 | #FFD60A |
| account | wallet | #E8EAFF | #5856D6 |
| report | bar-chart | #F4EBFF | #AF52DE |
| backup | cloud-upload | #E3F2FD | #007AFF |
| sync | refresh-circle | #E3F2FD | #007AFF |
| success | checkmark-circle | #E3F9E5 | #34C759 |
| info | information-circle | #E3F2FD | #007AFF |

## ⚙️ Configuration

Le service stocke les notifications dans `secureStorage` avec la clé `alerts_{userId}`.

Limite : **100 notifications** par utilisateur (les plus anciennes sont automatiquement supprimées).

Nettoyage automatique : Supprimer les notifications de plus de **30 jours** avec `cleanOldNotifications()`.

## 🔄 Bonnes pratiques

1. **Toujours notifier les actions importantes** : transactions, transferts, paiements
2. **Utiliser le bon type** : choisir entre `notification` (info) et `alerte` (action requise)
3. **Messages clairs et concis** : titre court + message descriptif
4. **Inclure les montants** : toujours afficher la valeur avec la devise
5. **Nettoyer régulièrement** : appeler `cleanOldNotifications()` périodiquement

## 🚀 Prochaines étapes

Pour intégrer dans d'autres hooks :
1. Importer le service : `import { notificationService } from '../services/NotificationService';`
2. Appeler la méthode appropriée après l'action réussie
3. Gérer les erreurs sans bloquer l'opération principale
4. Tester l'affichage dans NotificationsScreen et le badge du Dashboard
