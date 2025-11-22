// src/services/NotificationService.ts
import { Alert, AlertPriority, AlertType } from '../types/Alert';
import { pushNotificationService } from './PushNotificationService';
import { secureStorage } from './storage/secureStorage';

/**
 * Service de gestion des notifications de l'application
 * Génère automatiquement des notifications pour les événements importants
 * Et envoie des notifications push natives
 */
class NotificationService {
  private userId: string = 'default-user';
  private pushEnabled: boolean = true;

  /**
   * Initialiser le service avec l'ID utilisateur
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Activer/désactiver les notifications push
   */
  setPushEnabled(enabled: boolean) {
    this.pushEnabled = enabled;
  }

  /**
   * Générer un ID unique pour la notification
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Créer une notification de base
   */
  private async createNotification(
    type: AlertType,
    title: string,
    message: string,
    priority: AlertPriority = 'low',
    data?: any
  ): Promise<Alert> {
    const notification: Alert = {
      id: this.generateId(),
      userId: this.userId,
      type,
      title,
      message,
      priority,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      read: false,
      data,
    };

    // Sauvegarder dans le stockage
    await this.saveNotification(notification);
    
    console.log(`📬 [Notification] ${type}: ${title}`);
    return notification;
  }

  /**
   * Sauvegarder la notification dans le stockage
   */
  private async saveNotification(notification: Alert): Promise<void> {
    try {
      const key = `alerts_${this.userId}`;
      const existing = await secureStorage.getItem(key);
      const notifications: Alert[] = existing ? JSON.parse(existing) : [];
      
      // Ajouter la nouvelle notification au début
      notifications.unshift(notification);
      
      // Limiter à 100 notifications
      if (notifications.length > 100) {
        notifications.splice(100);
      }
      
      await secureStorage.setItem(key, JSON.stringify(notifications));
    } catch (error) {
      console.error('❌ [NotificationService] Erreur sauvegarde:', error);
    }
  }

  // ==================== TRANSACTIONS ====================

  /**
   * Notification : Transaction ajoutée
   */
  async notifyTransactionAdded(
    amount: number,
    category: string,
    type: 'income' | 'expense',
    currency: string = 'Dh'
  ): Promise<Alert> {
    const emoji = type === 'income' ? '💰' : '💸';
    const action = type === 'income' ? 'Revenu ajouté' : 'Dépense ajoutée';
    
    // Envoyer notification push
    if (this.pushEnabled) {
      pushNotificationService.notifyTransactionAdded(amount, category, type).catch(err => {
        console.warn('⚠️ Notification push échouée:', err);
      });
    }
    
    return this.createNotification(
      'transaction',
      `${emoji} ${action}`,
      `${Math.abs(amount).toFixed(2)} ${currency} - ${category}`,
      'low',
      { amount, category, type }
    );
  }

  /**
   * Notification : Transaction modifiée
   */
  async notifyTransactionUpdated(
    amount: number,
    category: string,
    currency: string = 'Dh'
  ): Promise<Alert> {
    return this.createNotification(
      'transaction',
      '✏️ Transaction modifiée',
      `${Math.abs(amount).toFixed(2)} ${currency} - ${category}`,
      'low',
      { amount, category }
    );
  }

  /**
   * Notification : Transaction supprimée
   */
  async notifyTransactionDeleted(category: string): Promise<Alert> {
    return this.createNotification(
      'transaction',
      '🗑️ Transaction supprimée',
      `La transaction "${category}" a été supprimée`,
      'low',
      { category }
    );
  }

  // ==================== PAIEMENTS ====================

  /**
   * Notification : Paiement automatique effectué
   */
  async notifyAutomaticPayment(
    amount: number,
    recipient: string,
    currency: string = 'Dh'
  ): Promise<Alert> {
    return this.createNotification(
      'payment',
      '🔄 Paiement automatique',
      `${amount.toFixed(2)} ${currency} versé à ${recipient}`,
      'medium',
      { amount, recipient }
    );
  }

  /**
   * Notification : Paiement récurrent programmé
   */
  async notifyRecurringPaymentScheduled(
    amount: number,
    recipient: string,
    nextDate: string,
    currency: string = 'Dh'
  ): Promise<Alert> {
    return this.createNotification(
      'payment',
      '📅 Paiement programmé',
      `${amount.toFixed(2)} ${currency} à ${recipient} - Prochain paiement: ${nextDate}`,
      'low',
      { amount, recipient, nextDate }
    );
  }

  // ==================== REMBOURSEMENTS ====================

  /**
   * Notification : Remboursement reçu
   */
  async notifyRefundReceived(
    amount: number,
    from: string,
    currency: string = 'Dh'
  ): Promise<Alert> {
    return this.createNotification(
      'refund',
      '💚 Remboursement reçu',
      `${amount.toFixed(2)} ${currency} de ${from}`,
      'medium',
      { amount, from }
    );
  }

  /**
   * Notification : Remboursement en attente
   */
  async notifyRefundPending(
    amount: number,
    to: string,
    currency: string = 'Dh'
  ): Promise<Alert> {
    return this.createNotification(
      'refund',
      '⏳ Remboursement en attente',
      `${amount.toFixed(2)} ${currency} à ${to}`,
      'low',
      { amount, to }
    );
  }

  // ==================== TRANSFERTS ====================

  /**
   * Notification : Transfert entre comptes
   */
  async notifyTransfer(
    amount: number,
    fromAccount: string,
    toAccount: string,
    currency: string = 'Dh'
  ): Promise<Alert> {
    return this.createNotification(
      'transfer',
      '↔️ Transfert effectué',
      `${amount.toFixed(2)} ${currency} de ${fromAccount} vers ${toAccount}`,
      'low',
      { amount, fromAccount, toAccount }
    );
  }

  // ==================== ÉPARGNE ====================

  /**
   * Notification : Objectif d'épargne atteint
   */
  async notifyGoalReached(goalName: string, amount: number, currency: string = 'Dh'): Promise<Alert> {
    return this.createNotification(
      'goal',
      '🎉 Objectif atteint !',
      `Félicitations ! Vous avez atteint votre objectif "${goalName}" (${amount.toFixed(2)} ${currency})`,
      'medium',
      { goalName, amount }
    );
  }

  /**
   * Notification : Progrès de l'objectif d'épargne
   */
  async notifyGoalProgress(
    goalName: string,
    percentage: number,
    current: number,
    target: number,
    currency: string = 'Dh'
  ): Promise<Alert> {
    return this.createNotification(
      'goal',
      `📊 Progrès épargne: ${percentage}%`,
      `"${goalName}" - ${current.toFixed(2)}/${target.toFixed(2)} ${currency}`,
      'low',
      { goalName, percentage, current, target }
    );
  }

  /**
   * Notification : Contribution à l'épargne
   */
  async notifySavingsContribution(
    amount: number,
    goalName: string,
    currency: string = 'Dh'
  ): Promise<Alert> {
    return this.createNotification(
      'savings',
      '💎 Épargne ajoutée',
      `${amount.toFixed(2)} ${currency} ajouté à "${goalName}"`,
      'low',
      { amount, goalName }
    );
  }

  // ==================== SYSTÈME ====================

  /**
   * Notification : Rapport mensuel disponible
   */
  async notifyMonthlyReport(month: string, year: number): Promise<Alert> {
    return this.createNotification(
      'report',
      '📈 Rapport mensuel disponible',
      `Votre rapport pour ${month} ${year} est prêt`,
      'low',
      { month, year }
    );
  }

  /**
   * Notification : Synchronisation réussie
   */
  async notifySyncSuccess(itemsCount: number): Promise<Alert> {
    return this.createNotification(
      'sync',
      '✅ Synchronisation terminée',
      `${itemsCount} élément(s) synchronisé(s) avec succès`,
      'low',
      { itemsCount }
    );
  }

  /**
   * Notification : Backup créé
   */
  async notifyBackupCreated(size: string, date: string): Promise<Alert> {
    return this.createNotification(
      'backup',
      '💾 Sauvegarde créée',
      `Backup du ${date} (${size}) disponible`,
      'low',
      { size, date }
    );
  }

  /**
   * Notification : Backup restauré
   */
  async notifyBackupRestored(date: string): Promise<Alert> {
    return this.createNotification(
      'backup',
      '♻️ Sauvegarde restaurée',
      `Données du ${date} restaurées avec succès`,
      'medium',
      { date }
    );
  }

  // ==================== COMPTE ====================

  /**
   * Notification : Nouveau compte créé
   */
  async notifyAccountCreated(accountName: string, type: string): Promise<Alert> {
    return this.createNotification(
      'account',
      '🏦 Compte créé',
      `Nouveau compte "${accountName}" (${type}) ajouté`,
      'low',
      { accountName, type }
    );
  }

  /**
   * Notification : Compte modifié
   */
  async notifyAccountUpdated(accountName: string): Promise<Alert> {
    return this.createNotification(
      'account',
      '✏️ Compte modifié',
      `Le compte "${accountName}" a été mis à jour`,
      'low',
      { accountName }
    );
  }

  // ==================== BUDGET ====================

  /**
   * Notification : Budget créé
   */
  async notifyBudgetCreated(category: string, amount: number, currency: string = 'Dh'): Promise<Alert> {
    return this.createNotification(
      'budget',
      '📊 Budget créé',
      `Budget "${category}" : ${amount.toFixed(2)} ${currency}`,
      'low',
      { category, amount }
    );
  }

  // ==================== SUCCÈS GÉNÉRAL ====================

  /**
   * Notification de succès générique
   */
  async notifySuccess(title: string, message: string, data?: any): Promise<Alert> {
    return this.createNotification(
      'success',
      `✅ ${title}`,
      message,
      'low',
      data
    );
  }

  /**
   * Notification d'information générique
   */
  async notifyInfo(title: string, message: string, data?: any): Promise<Alert> {
    return this.createNotification(
      'info',
      `ℹ️ ${title}`,
      message,
      'low',
      data
    );
  }

  // ==================== UTILITAIRES ====================

  /**
   * Obtenir toutes les notifications
   */
  async getNotifications(): Promise<Alert[]> {
    try {
      const key = `alerts_${this.userId}`;
      const stored = await secureStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ [NotificationService] Erreur lecture:', error);
      return [];
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.read = true;
        notification.updatedAt = new Date().toISOString();
        
        const key = `alerts_${this.userId}`;
        await secureStorage.setItem(key, JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('❌ [NotificationService] Erreur markAsRead:', error);
    }
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const filtered = notifications.filter(n => n.id !== notificationId);
      
      const key = `alerts_${this.userId}`;
      await secureStorage.setItem(key, JSON.stringify(filtered));
    } catch (error) {
      console.error('❌ [NotificationService] Erreur delete:', error);
    }
  }

  /**
   * Nettoyer les vieilles notifications (> 30 jours)
   */
  async cleanOldNotifications(daysToKeep: number = 30): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const filtered = notifications.filter(n => {
        const createdDate = new Date(n.createdAt);
        return createdDate > cutoffDate;
      });
      
      const key = `alerts_${this.userId}`;
      await secureStorage.setItem(key, JSON.stringify(filtered));
      
      console.log(`🧹 [NotificationService] ${notifications.length - filtered.length} notifications supprimées`);
    } catch (error) {
      console.error('❌ [NotificationService] Erreur clean:', error);
    }
  }
}

// Exporter une instance singleton
export const notificationService = new NotificationService();
export default notificationService;
