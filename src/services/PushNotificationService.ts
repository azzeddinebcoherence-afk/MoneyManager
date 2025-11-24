// src/services/PushNotificationService.ts
import * as Notifications from 'expo-notifications';

/**
 * Service de gestion des notifications push natives
 * Gère l'envoi de notifications locales et push vers le téléphone
 */

// Configuration du comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface PushNotificationConfig {
  title: string;
  body: string;
  data?: any;
  categoryIdentifier?: string;
  priority?: 'default' | 'low' | 'high' | 'max';
  sound?: boolean | string;
  badge?: number;
}

interface ScheduledNotificationConfig extends PushNotificationConfig {
  trigger: {
    seconds?: number;
    date?: Date;
    repeats?: boolean;
    hour?: number;
    minute?: number;
    weekday?: number;
  };
}

class PushNotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;
  private navigationCallback: ((data: any) => void) | null = null;

  /**
   * Définir le callback de navigation pour le deep linking
   */
  setNavigationCallback(callback: (data: any) => void): void {
    this.navigationCallback = callback;
  }

  /**
   * Initialiser le service de notifications push
   */
  async initialize(): Promise<void> {
    try {
      // Désactivé en développement - nécessite un development build
      // Les notifications push ne fonctionnent pas dans Expo Go depuis SDK 53
      return;

    } catch (error) {
      // Erreur silencieuse - les notifications push ne sont pas critiques en dev
    }
  }

  /**
   * Obtenir le token Expo Push
   */
  private async getExpoPushToken(): Promise<string | null> {
    try {
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // À remplacer par votre ID de projet Expo
      })).data;
      return token;
    } catch (error) {
      // Erreur silencieuse - les notifications push ne sont pas critiques en dev
      return null;
    }
  }

  /**
   * Configurer les listeners de notifications
   */
  private setupNotificationListeners(): void {
    // Notification reçue en premier plan
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📬 [PushNotification] Notification reçue:', notification.request.content.title);
    });

    // Notification tapée par l'utilisateur
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 [PushNotification] Notification tapée:', response.notification.request.content.data);
      
      const data = response.notification.request.content.data;
      
      // Deep linking vers TransactionDetail si transactionId est présent
      if (data?.transactionId && this.navigationCallback) {
        this.navigationCallback({
          screen: 'TransactionDetail',
          params: { transactionId: data.transactionId }
        });
      } else if (this.navigationCallback && data?.screen) {
        // Support générique pour d'autres écrans
        this.navigationCallback({
          screen: data.screen,
          params: data.params || {}
        });
      }
    });
  }

  /**
   * Nettoyer les listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }

  /**
   * Envoyer une notification locale immédiate
   */
  async sendLocalNotification(config: PushNotificationConfig): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: config.title,
          body: config.body,
          data: config.data || {},
          sound: config.sound !== false ? 'default' : undefined,
          badge: config.badge,
          categoryIdentifier: config.categoryIdentifier,
          priority: this.mapPriority(config.priority),
        },
        trigger: null, // Immédiat
      });

      console.log(`📤 [PushNotification] Notification envoyée: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('❌ [PushNotification] Erreur envoi:', error);
      throw error;
    }
  }

  /**
   * Programmer une notification pour plus tard
   */
  async scheduleNotification(config: ScheduledNotificationConfig): Promise<string> {
    try {
      let trigger: any;
      
      if (config.trigger.date) {
        // Pour une date spécifique, utiliser Date directement
        trigger = config.trigger.date;
      } else if (config.trigger.hour !== undefined) {
        // Pour une notification quotidienne
        trigger = {
          hour: config.trigger.hour,
          minute: config.trigger.minute || 0,
          repeats: config.trigger.repeats || false,
        };
      } else {
        // Pour un délai en secondes
        trigger = {
          seconds: config.trigger.seconds || 60,
          repeats: config.trigger.repeats || false,
        };
      }
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: config.title,
          body: config.body,
          data: config.data || {},
          sound: config.sound !== false ? 'default' : undefined,
          badge: config.badge,
          categoryIdentifier: config.categoryIdentifier,
          priority: this.mapPriority(config.priority),
        },
        trigger,
      });

      console.log(`⏰ [PushNotification] Notification programmée: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('❌ [PushNotification] Erreur programmation:', error);
      throw error;
    }
  }

  /**
   * Mapper la priorité
   */
  private mapPriority(priority?: string): Notifications.AndroidNotificationPriority {
    switch (priority) {
      case 'max':
        return Notifications.AndroidNotificationPriority.MAX;
      case 'high':
        return Notifications.AndroidNotificationPriority.HIGH;
      case 'low':
        return Notifications.AndroidNotificationPriority.LOW;
      default:
        return Notifications.AndroidNotificationPriority.DEFAULT;
    }
  }

  // ==================== NOTIFICATIONS SPÉCIFIQUES ====================

  /**
   * Notification : Transaction ajoutée
   */
  async notifyTransactionAdded(amount: number, category: string, type: 'income' | 'expense'): Promise<void> {
    const emoji = type === 'income' ? '💰' : '💸';
    const action = type === 'income' ? 'Revenu ajouté' : 'Dépense ajoutée';
    
    await this.sendLocalNotification({
      title: `${emoji} ${action}`,
      body: `${Math.abs(amount).toFixed(2)} Dh - ${category}`,
      data: { type: 'transaction', amount, category },
      categoryIdentifier: 'transaction',
      priority: 'default',
    });
  }

  /**
   * Notification : Budget dépassé (CRITIQUE)
   */
  async notifyBudgetExceeded(category: string, spent: number, budget: number): Promise<void> {
    const percentage = ((spent / budget) * 100).toFixed(0);
    
    await this.sendLocalNotification({
      title: '⚠️ Budget dépassé !',
      body: `${category}: ${spent.toFixed(2)} Dh / ${budget.toFixed(2)} Dh (${percentage}%)`,
      data: { type: 'budget', category, spent, budget },
      categoryIdentifier: 'critical',
      priority: 'max',
      sound: true,
    });
  }

  /**
   * Notification : Objectif d'épargne atteint
   */
  async notifyGoalReached(goalName: string, amount: number): Promise<void> {
    await this.sendLocalNotification({
      title: '🎉 Objectif atteint !',
      body: `Félicitations ! "${goalName}" - ${amount.toFixed(2)} Dh`,
      data: { type: 'goal', goalName, amount },
      categoryIdentifier: 'info',
      priority: 'high',
      sound: true,
    });
  }

  /**
   * Notification : Rappel de facture
   */
  async notifyBillReminder(billName: string, amount: number, dueDate: string): Promise<void> {
    await this.sendLocalNotification({
      title: '📅 Rappel de paiement',
      body: `${billName} - ${amount.toFixed(2)} Dh - Échéance: ${dueDate}`,
      data: { type: 'bill', billName, amount, dueDate },
      categoryIdentifier: 'critical',
      priority: 'high',
      sound: true,
    });
  }

  /**
   * Notification : Dette à échéance proche
   */
  async notifyDebtDue(debtName: string, amount: number, daysLeft: number): Promise<void> {
    await this.sendLocalNotification({
      title: '⏰ Dette à rembourser',
      body: `${debtName} - ${amount.toFixed(2)} Dh dans ${daysLeft} jour(s)`,
      data: { type: 'debt', debtName, amount, daysLeft },
      categoryIdentifier: 'critical',
      priority: 'high',
      sound: true,
    });
  }

  /**
   * Notification : Rapport mensuel prêt
   */
  async notifyMonthlyReport(month: string, year: number): Promise<void> {
    await this.sendLocalNotification({
      title: '📊 Rapport mensuel disponible',
      body: `Votre rapport pour ${month} ${year} est prêt`,
      data: { type: 'report', month, year },
      categoryIdentifier: 'info',
      priority: 'default',
    });
  }

  /**
   * Notification : Synchronisation terminée
   */
  async notifySyncComplete(itemsCount: number): Promise<void> {
    await this.sendLocalNotification({
      title: '✅ Synchronisation terminée',
      body: `${itemsCount} élément(s) synchronisé(s)`,
      data: { type: 'sync', itemsCount },
      categoryIdentifier: 'info',
      priority: 'low',
      sound: false,
    });
  }

  /**
   * Notification : Backup créé
   */
  async notifyBackupCreated(size: string): Promise<void> {
    await this.sendLocalNotification({
      title: '💾 Sauvegarde créée',
      body: `Backup créé avec succès (${size})`,
      data: { type: 'backup', size },
      categoryIdentifier: 'info',
      priority: 'low',
      sound: false,
    });
  }

  /**
   * Notification : Paiement automatique effectué
   */
  async notifyAutomaticPayment(recipient: string, amount: number): Promise<void> {
    await this.sendLocalNotification({
      title: '🔄 Paiement automatique',
      body: `${amount.toFixed(2)} Dh versé à ${recipient}`,
      data: { type: 'payment', recipient, amount },
      categoryIdentifier: 'info',
      priority: 'default',
    });
  }

  /**
   * Notification : Remboursement reçu
   */
  async notifyRefundReceived(from: string, amount: number): Promise<void> {
    await this.sendLocalNotification({
      title: '💚 Remboursement reçu',
      body: `${amount.toFixed(2)} Dh de ${from}`,
      data: { type: 'refund', from, amount },
      categoryIdentifier: 'info',
      priority: 'default',
    });
  }

  // ==================== NOTIFICATIONS PROGRAMMÉES ====================

  /**
   * Programmer un rappel quotidien
   */
  async scheduleDailyReminder(hour: number, minute: number, message: string): Promise<string> {
    return this.scheduleNotification({
      title: '🔔 Rappel quotidien',
      body: message,
      data: { type: 'daily_reminder' },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
      priority: 'default',
    });
  }

  /**
   * Programmer un rappel de fin de mois
   */
  async scheduleMonthEndReminder(): Promise<string> {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    lastDay.setHours(18, 0, 0, 0);

    return this.scheduleNotification({
      title: '📊 Fin du mois',
      body: 'N\'oubliez pas de vérifier vos budgets et transactions',
      data: { type: 'month_end' },
      trigger: {
        date: lastDay,
        repeats: false,
      },
      priority: 'default',
    });
  }

  /**
   * Programmer un rappel de facture
   */
  async scheduleBillReminder(billName: string, amount: number, dueDate: Date): Promise<string> {
    // Rappel 3 jours avant l'échéance
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - 3);
    reminderDate.setHours(9, 0, 0, 0);

    return this.scheduleNotification({
      title: '💳 Rappel de facture',
      body: `${billName} - ${amount.toFixed(2)} Dh à payer dans 3 jours`,
      data: { type: 'bill_reminder', billName, amount },
      trigger: {
        date: reminderDate,
        repeats: false,
      },
      priority: 'high',
    });
  }

  // ==================== GESTION DES NOTIFICATIONS ====================

  /**
   * Annuler une notification programmée
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`🗑️ [PushNotification] Notification annulée: ${notificationId}`);
    } catch (error) {
      console.error('❌ [PushNotification] Erreur annulation:', error);
    }
  }

  /**
   * Annuler toutes les notifications programmées
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🗑️ [PushNotification] Toutes les notifications annulées');
    } catch (error) {
      console.error('❌ [PushNotification] Erreur annulation:', error);
    }
  }

  /**
   * Obtenir toutes les notifications programmées
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('❌ [PushNotification] Erreur récupération:', error);
      return [];
    }
  }

  /**
   * Effacer toutes les notifications affichées
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('🧹 [PushNotification] Notifications effacées');
    } catch (error) {
      console.error('❌ [PushNotification] Erreur effacement:', error);
    }
  }

  /**
   * Mettre à jour le badge de l'application
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('❌ [PushNotification] Erreur badge:', error);
    }
  }

  /**
   * Obtenir le nombre de badge actuel
   */
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('❌ [PushNotification] Erreur badge:', error);
      return 0;
    }
  }

  /**
   * Réinitialiser le badge
   */
  async resetBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  /**
   * Programmer le résumé financier quotidien à 20h00
   */
  async scheduleDailySummary(income: number = 0, expenses: number = 0, netFlow: number = 0): Promise<string | null> {
    try {
      // Annuler toute notification existante de résumé quotidien
      const scheduled = await this.getScheduledNotifications();
      for (const notif of scheduled) {
        if (notif.content.data?.type === 'daily_summary') {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }

      // Programmer pour 20h00 chaque jour
      return await this.scheduleNotification({
        title: '📊 Résumé financier du jour',
        body: `Aujourd'hui: ${income.toFixed(2)} MAD de revenus, ${expenses.toFixed(2)} MAD de dépenses. Solde: ${netFlow.toFixed(2)} MAD`,
        data: { 
          type: 'daily_summary',
          income,
          expenses,
          netFlow,
          date: new Date().toISOString()
        },
        priority: 'default',
        sound: true,
        trigger: {
          hour: 20,
          minute: 0,
          repeats: true, // Répéter chaque jour
        }
      });
    } catch (error) {
      // Erreur silencieuse - notifications pas critiques
      return null;
    }
  }
}

// Exporter une instance singleton
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
