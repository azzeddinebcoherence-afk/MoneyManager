// src/services/SmartAlertService.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { Alert, AlertPriority, AlertType } from '../types/Alert';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (data: any) => boolean;
  priority: AlertPriority;
  type: AlertType;
  generateAlert: (data: any) => Omit<Alert, 'id' | 'createdAt'>;
  isEnabled: boolean;
  cooldown?: number;
  lastTriggered?: number;
}

export interface AlertAnalysisResult {
  alerts: Alert[];
  triggeredRules: string[];
  analysisTimestamp: number;
}

export class SmartAlertService {
  private static instance: SmartAlertService;
  private rules: AlertRule[] = [];
  private cooldownCache: Map<string, number> = new Map();
  private fallbackMode: boolean = false;

  private constructor() {
    this.initializeRules();
  }

  static getInstance(): SmartAlertService {
    if (!SmartAlertService.instance) {
      SmartAlertService.instance = new SmartAlertService();
    }
    return SmartAlertService.instance;
  }

  async analyzeAndGenerateAlerts(userId: string = 'default-user'): Promise<AlertAnalysisResult> {
    try {
      console.log('🔍 [SmartAlertService] Analyse et génération d\'alertes...');

      const analysisData = await this.gatherAnalysisData(userId);
      const alerts: Alert[] = [];
      const triggeredRules: string[] = [];

      for (const rule of this.rules) {
        if (!rule.isEnabled) continue;

        if (this.isInCooldown(rule.id)) {
          continue;
        }

        try {
          if (rule.condition(analysisData)) {
            console.log(`🚨 Règle déclenchée: ${rule.name}`);
            
            const alertData = rule.generateAlert(analysisData);
            const alert: Alert = {
              ...alertData,
              id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
              userId,
              status: 'active',
              updatedAt: new Date().toISOString(),
              read: false
            };

            alerts.push(alert);
            triggeredRules.push(rule.name);

            if (rule.cooldown) {
              this.cooldownCache.set(rule.id, Date.now() + rule.cooldown);
            }
          }
        } catch (error) {
          console.error(`❌ Erreur dans la règle ${rule.name}:`, error);
        }
      }

      const result: AlertAnalysisResult = {
        alerts,
        triggeredRules,
        analysisTimestamp: Date.now()
      };

      console.log(`✅ [SmartAlertService] Analyse terminée: ${alerts.length} alertes générées`);
      return result;

    } catch (error) {
      console.error('❌ [SmartAlertService] Erreur analyse alertes:', error);
      throw error;
    }
  }

  async analyzeTransactionForAlerts(transaction: any, userId: string = 'default-user'): Promise<Alert[]> {
    try {
      console.log('💳 [SmartAlertService] Analyse transaction pour alertes...');

      const analysisData = await this.gatherAnalysisData(userId);
      analysisData.recentTransaction = transaction;

      const alerts: Alert[] = [];
      const transactionRules = this.rules.filter(rule => 
        rule.isEnabled && 
        rule.type === 'transaction' && 
        !this.isInCooldown(rule.id)
      );

      for (const rule of transactionRules) {
        try {
          if (rule.condition(analysisData)) {
            const alertData = rule.generateAlert(analysisData);
            const alert: Alert = {
              ...alertData,
              id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
              userId,
              status: 'active',
              updatedAt: new Date().toISOString(),
              read: false
            };

            alerts.push(alert);

            if (rule.cooldown) {
              this.cooldownCache.set(rule.id, Date.now() + rule.cooldown);
            }
          }
        } catch (error) {
          console.error(`❌ Erreur règle transaction ${rule.name}:`, error);
        }
      }

      console.log(`✅ [SmartAlertService] Analyse transaction: ${alerts.length} alertes`);
      return alerts;

    } catch (error) {
      console.error('❌ [SmartAlertService] Erreur analyse transaction:', error);
      return [];
    }
  }

  async getScheduledAlerts(userId: string = 'default-user'): Promise<Alert[]> {
    try {
      console.log('📅 [SmartAlertService] Récupération alertes planifiées...');

      const analysisData = await this.gatherAnalysisData(userId);
      const scheduledAlerts: Alert[] = [];

      const dailyRules = this.rules.filter(rule => 
        rule.isEnabled && 
        rule.type === 'summary' &&
        !this.isInCooldown(rule.id)
      );

      for (const rule of dailyRules) {
        try {
          if (rule.condition(analysisData)) {
            const alertData = rule.generateAlert(analysisData);
            const alert: Alert = {
              ...alertData,
              id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
              userId,
              status: 'active',
              updatedAt: new Date().toISOString(),
              read: false
            };

            scheduledAlerts.push(alert);

            this.cooldownCache.set(rule.id, Date.now() + (24 * 60 * 60 * 1000));
          }
        } catch (error) {
          console.error(`❌ Erreur règle quotidienne ${rule.name}:`, error);
        }
      }

      console.log(`✅ [SmartAlertService] Alertes planifiées: ${scheduledAlerts.length}`);
      return scheduledAlerts;

    } catch (error) {
      console.error('❌ [SmartAlertService] Erreur alertes planifiées:', error);
      return [];
    }
  }

  async analyzeBudgetsForAlerts(userId: string = 'default-user'): Promise<Alert[]> {
    try {
      console.log('💰 [SmartAlertService] Analyse budgets pour alertes...');

      const { budgetService } = await import('./budgetService.js');
      const budgets = await budgetService.getAllBudgets(userId);
      const analysisData = await this.gatherAnalysisData(userId);
      analysisData.budgets = budgets;

      const alerts: Alert[] = [];
      const budgetRules = this.rules.filter(rule => 
        rule.isEnabled && 
        rule.type === 'budget' &&
        !this.isInCooldown(rule.id)
      );

      for (const rule of budgetRules) {
        try {
          if (rule.condition(analysisData)) {
            const alertData = rule.generateAlert(analysisData);
            const alert: Alert = {
              ...alertData,
              id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
              userId,
              status: 'active',
              updatedAt: new Date().toISOString(),
              read: false
            };

            alerts.push(alert);

            if (rule.cooldown) {
              this.cooldownCache.set(rule.id, Date.now() + rule.cooldown);
            }
          }
        } catch (error) {
          console.error(`❌ Erreur règle budget ${rule.name}:`, error);
        }
      }

      console.log(`✅ [SmartAlertService] Analyse budgets: ${alerts.length} alertes`);
      return alerts;

    } catch (error) {
      console.error('❌ [SmartAlertService] Erreur analyse budgets:', error);
      return [];
    }
  }

  async analyzeDebtsForAlerts(userId: string = 'default-user'): Promise<Alert[]> {
    try {
      console.log('🏦 [SmartAlertService] Analyse dettes pour alertes...');

      const { debtService } = await import('./debtService.js');
      const debts = await debtService.getAllDebts(userId);
      const analysisData = await this.gatherAnalysisData(userId);
      analysisData.debts = debts;

      const alerts: Alert[] = [];
      const debtRules = this.rules.filter(rule => 
        rule.isEnabled && 
        rule.type === 'debt' &&
        !this.isInCooldown(rule.id)
      );

      for (const rule of debtRules) {
        try {
          if (rule.condition(analysisData)) {
            const alertData = rule.generateAlert(analysisData);
            const alert: Alert = {
              ...alertData,
              id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
              userId,
              status: 'active',
              updatedAt: new Date().toISOString(),
              read: false
            };

            alerts.push(alert);

            if (rule.cooldown) {
              this.cooldownCache.set(rule.id, Date.now() + rule.cooldown);
            }
          }
        } catch (error) {
          console.error(`❌ Erreur règle dette ${rule.name}:`, error);
        }
      }

      console.log(`✅ [SmartAlertService] Analyse dettes: ${alerts.length} alertes`);
      return alerts;

    } catch (error) {
      console.error('❌ [SmartAlertService] Erreur analyse dettes:', error);
      return [];
    }
  }

  async analyzeSavingsForAlerts(userId: string = 'default-user'): Promise<Alert[]> {
    try {
      console.log('🎯 [SmartAlertService] Analyse épargne pour alertes...');

      const { savingsService } = await import('./savingsService.js');
      const savingsGoals = await savingsService.getAllSavingsGoals(userId);
      const analysisData = await this.gatherAnalysisData(userId);
      analysisData.savingsGoals = savingsGoals;

      const alerts: Alert[] = [];
      const savingsRules = this.rules.filter(rule => 
        rule.isEnabled && 
        rule.type === 'savings' &&
        !this.isInCooldown(rule.id)
      );

      for (const rule of savingsRules) {
        try {
          if (rule.condition(analysisData)) {
            const alertData = rule.generateAlert(analysisData);
            const alert: Alert = {
              ...alertData,
              id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
              userId,
              status: 'active',
              updatedAt: new Date().toISOString(),
              read: false
            };

            alerts.push(alert);

            if (rule.cooldown) {
              this.cooldownCache.set(rule.id, Date.now() + rule.cooldown);
            }
          }
        } catch (error) {
          console.error(`❌ Erreur règle épargne ${rule.name}:`, error);
        }
      }

      console.log(`✅ [SmartAlertService] Analyse épargne: ${alerts.length} alertes`);
      return alerts;

    } catch (error) {
      console.error('❌ [SmartAlertService] Erreur analyse épargne:', error);
      return [];
    }
  }

  addRule(rule: AlertRule): void {
    this.rules.push(rule);
    console.log(`✅ Règle ajoutée: ${rule.name}`);
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
    this.cooldownCache.delete(ruleId);
    console.log(`🗑️ Règle supprimée: ${ruleId}`);
  }

  enableRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.isEnabled = true;
      console.log(`✅ Règle activée: ${rule.name}`);
    }
  }

  disableRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.isEnabled = false;
      console.log(`❌ Règle désactivée: ${rule.name}`);
    }
  }

  getRules(): AlertRule[] {
    return [...this.rules];
  }

  private async gatherAnalysisData(userId: string): Promise<any> {
    try {
      // Si en mode fallback, retourner données minimales
      if (this.fallbackMode) {
        console.log('🔄 [SmartAlertService] Mode fallback activé');
        return this.getFallbackData(userId);
      }

      // Tentative de chargement normal avec gestion d'erreurs
      try {
        const { accountService } = await import('./accountService.js');
        const { transactionService } = await import('./transactionService.js');
        const { budgetService } = await import('./budgetService.js');
        const { debtService } = await import('./debtService.js');
        const { savingsService } = await import('./savingsService.js');
        const { calculationService } = await import('./calculationService.js');

        const [
          accounts,
          transactions,
          budgets,
          debts,
          savingsGoals,
          cashFlow,
          netWorth
        ] = await Promise.all([
          accountService.getAllAccounts(userId).catch(() => []),
          transactionService.getRecentTransactions(30, userId).catch(() => []),
          budgetService.getAllBudgets(userId).catch(() => []),
          debtService.getAllDebts(userId).catch(() => []),
          savingsService.getAllSavingsGoals(userId).catch(() => []),
          calculationService.calculateCashFlow(userId).catch(() => ({ income: 0, expenses: 0, netFlow: 0 })),
          calculationService.calculateNetWorth(userId).catch(() => 0)
        ]);

        return {
          accounts,
          transactions,
          budgets,
          debts,
          savingsGoals,
          cashFlow,
          netWorth,
          analysisTimestamp: Date.now(),
          userId,
          fallbackMode: false
        };
      } catch (error) {
        console.warn('⚠️ [SmartAlertService] Fallback to minimal data due to error:', error);
        this.fallbackMode = true;
        return this.getFallbackData(userId);
      }

    } catch (error) {
      console.error('❌ [SmartAlertService] Erreur collecte données analyse:', error);
      this.fallbackMode = true;
      return this.getFallbackData(userId);
    }
  }

  private getFallbackData(userId: string): any {
    return {
      accounts: [],
      transactions: [],
      budgets: [],
      debts: [],
      savingsGoals: [],
      cashFlow: { income: 0, expenses: 0, netFlow: 0 },
      netWorth: 0,
      analysisTimestamp: Date.now(),
      userId,
      fallbackMode: true
    };
  }

  private isInCooldown(ruleId: string): boolean {
    const cooldownEnd = this.cooldownCache.get(ruleId);
    if (!cooldownEnd) return false;
    
    if (Date.now() > cooldownEnd) {
      this.cooldownCache.delete(ruleId);
      return false;
    }
    
    return true;
  }

  private initializeRules(): void {
    console.log('🔄 [SmartAlertService] Initialisation des règles intelligentes...');

    // Règles pour les transactions
    this.addRule({
      id: 'large_transaction',
      name: 'Transaction importante',
      description: 'Alerte pour les transactions supérieures à 1000 MAD',
      priority: 'medium',
      type: 'transaction',
      isEnabled: true,
      cooldown: 30 * 60 * 1000,
      condition: (data) => {
        const transaction = data.recentTransaction;
        return transaction && 
               transaction.type === 'expense' && 
               Math.abs(transaction.amount) > 1000;
      },
      generateAlert: (data) => ({
        title: '💸 Transaction importante détectée',
        message: `Une transaction de ${Math.abs(data.recentTransaction.amount)} MAD a été enregistrée.`,
        type: 'transaction',
        priority: 'medium',
        category: 'spending',
        userId: data.userId,
        status: 'active',
        updatedAt: new Date().toISOString(),
        read: false,
        data: {
          transactionId: data.recentTransaction.id,
          amount: Math.abs(data.recentTransaction.amount),
          accountId: data.recentTransaction.accountId
        },
        actionUrl: 'TransactionDetail',
        actionLabel: 'Voir détails'
      })
    });

    // Règles pour les budgets
    this.addRule({
      id: 'budget_exceeded',
      name: 'Budget dépassé',
      description: 'Alerte quand un budget est dépassé à plus de 90%',
      priority: 'high',
      type: 'budget',
      isEnabled: true,
      cooldown: 2 * 60 * 60 * 1000,
      condition: (data) => {
        if (data.fallbackMode) return false;
        return data.budgets?.some((budget: any) => {
          const percentage = (budget.spent / budget.amount) * 100;
          return budget.isActive && percentage >= 90;
        }) || false;
      },
      generateAlert: (data) => {
        const exceededBudgets = data.budgets?.filter((budget: any) => {
          const percentage = (budget.spent / budget.amount) * 100;
          return budget.isActive && percentage >= 90;
        }) || [];
        
        const mainBudget = exceededBudgets[0];
        const percentage = mainBudget ? ((mainBudget.spent / mainBudget.amount) * 100).toFixed(1) : '0';
        
        return {
          title: '🚨 Budget presque épuisé',
          message: `Le budget "${mainBudget?.name}" est utilisé à ${percentage}%.`,
          type: 'budget',
          priority: 'high',
          category: 'budget',
          userId: data.userId,
          status: 'active',
          updatedAt: new Date().toISOString(),
          read: false,
          data: {
            budgetId: mainBudget?.id,
            budgetName: mainBudget?.name,
            spent: mainBudget?.spent,
            amount: mainBudget?.amount,
            percentage: percentage
          },
          actionUrl: 'Budgets',
          actionLabel: 'Gérer budgets'
        };
      }
    });

    // Règles pour les dettes
    this.addRule({
      id: 'debt_payment_due',
      name: 'Paiement de dette dû',
      description: 'Alerte pour les paiements de dettes dus dans les 3 jours',
      priority: 'critical',
      type: 'debt',
      isEnabled: true,
      cooldown: 24 * 60 * 60 * 1000,
      condition: (data) => {
        if (data.fallbackMode) return false;
        const today = new Date();
        return data.debts?.some((debt: any) => {
          if (debt.status !== 'active') return false;
          
          const nextPayment = debt.nextPaymentDate ? new Date(debt.nextPaymentDate) : new Date();
          const daysUntilDue = Math.ceil((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          return daysUntilDue <= 3 && daysUntilDue >= 0;
        }) || false;
      },
      generateAlert: (data) => {
        const dueDebts = data.debts?.filter((debt: any) => {
          const today = new Date();
          const nextPayment = debt.nextPaymentDate ? new Date(debt.nextPaymentDate) : new Date();
          const daysUntilDue = Math.ceil((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return debt.status === 'active' && daysUntilDue <= 3 && daysUntilDue >= 0;
        }) || [];
        
        const mainDebt = dueDebts[0];
        const nextPayment = mainDebt?.nextPaymentDate ? new Date(mainDebt.nextPaymentDate) : new Date();
        const daysUntilDue = Math.ceil((nextPayment.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        return {
          title: '📅 Paiement de dette imminent',
          message: `Le paiement pour "${mainDebt?.name}" est dû dans ${daysUntilDue} jour(s).`,
          type: 'debt',
          priority: 'critical',
          category: 'debt',
          userId: data.userId,
          status: 'active',
          updatedAt: new Date().toISOString(),
          read: false,
          data: {
            debtId: mainDebt?.id,
            debtName: mainDebt?.name,
            amountDue: mainDebt?.monthlyPayment,
            dueInDays: daysUntilDue
          },
          actionUrl: 'Debts',
          actionLabel: 'Gérer dettes'
        };
      }
    });

    // Règles pour l'épargne
    this.addRule({
      id: 'savings_goal_progress',
      name: 'Progression objectif épargne',
      description: 'Alerte quand un objectif d\'épargne atteint 75%',
      priority: 'low',
      type: 'savings',
      isEnabled: true,
      cooldown: 7 * 24 * 60 * 60 * 1000,
      condition: (data) => {
        if (data.fallbackMode) return false;
        return data.savingsGoals?.some((goal: any) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          return !goal.isCompleted && progress >= 75 && progress < 100;
        }) || false;
      },
      generateAlert: (data) => {
        const progressingGoals = data.savingsGoals?.filter((goal: any) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          return !goal.isCompleted && progress >= 75 && progress < 100;
        }) || [];
        
        const mainGoal = progressingGoals[0];
        const progress = mainGoal ? ((mainGoal.currentAmount / mainGoal.targetAmount) * 100).toFixed(1) : '0';
        
        return {
          title: '🎯 Objectif d\'épargne presque atteint',
          message: `"${mainGoal?.name}" est complété à ${progress}%.`,
          type: 'savings',
          priority: 'low',
          category: 'savings',
          userId: data.userId,
          status: 'active',
          updatedAt: new Date().toISOString(),
          read: false,
          data: {
            goalId: mainGoal?.id,
            goalName: mainGoal?.name,
            currentAmount: mainGoal?.currentAmount,
            targetAmount: mainGoal?.targetAmount,
            progress: progress
          },
          actionUrl: 'Savings',
          actionLabel: 'Voir épargne'
        };
      }
    });

    // Règles pour la santé financière
    this.addRule({
      id: 'low_balance',
      name: 'Solde faible',
      description: 'Alerte quand le solde d\'un compte est faible',
      priority: 'high',
      type: 'account',
      isEnabled: true,
      cooldown: 6 * 60 * 60 * 1000,
      condition: (data) => {
        if (data.fallbackMode) return false;
        return data.accounts?.some((account: any) => 
          account.isActive && account.balance < 100 && account.balance > 0
        ) || false;
      },
      generateAlert: (data) => {
        const lowBalanceAccounts = data.accounts?.filter((account: any) => 
          account.isActive && account.balance < 100 && account.balance > 0
        ) || [];
        
        const mainAccount = lowBalanceAccounts[0];
        
        return {
          title: '⚠️ Solde faible détecté',
          message: `Le compte "${mainAccount?.name}" a un solde faible: ${mainAccount?.balance} MAD`,
          type: 'account',
          priority: 'high',
          category: 'balance',
          userId: data.userId,
          status: 'active',
          updatedAt: new Date().toISOString(),
          read: false,
          data: {
            accountId: mainAccount?.id,
            accountName: mainAccount?.name,
            balance: mainAccount?.balance
          },
          actionUrl: 'Accounts',
          actionLabel: 'Voir comptes'
        };
      }
    });

    // Règles quotidiennes
    this.addRule({
      id: 'daily_summary',
      name: 'Résumé quotidien',
      description: 'Résumé financier quotidien',
      priority: 'low',
      type: 'summary',
      isEnabled: true,
      condition: (data) => true,
      generateAlert: (data) => {
        const totalExpenses = data.cashFlow?.expenses || 0;
        const totalIncome = data.cashFlow?.income || 0;
        const netFlow = data.cashFlow?.netFlow || 0;
        
        return {
          title: '📊 Résumé financier du jour',
          message: `Aujourd'hui: ${totalIncome} MAD de revenus, ${totalExpenses} MAD de dépenses. Solde: ${netFlow} MAD`,
          type: 'summary',
          priority: 'low',
          category: 'daily',
          userId: data.userId,
          status: 'active',
          updatedAt: new Date().toISOString(),
          read: false,
          data: {
            income: totalIncome,
            expenses: totalExpenses,
            netFlow: netFlow
          },
          actionUrl: 'Dashboard',
          actionLabel: 'Tableau de bord'
        };
      }
    });

    console.log(`✅ [SmartAlertService] ${this.rules.length} règles initialisées`);
  }

  clearCooldowns(): void {
    this.cooldownCache.clear();
    console.log('🔄 Cooldowns nettoyés');
  }

  getServiceStatus(): {
    totalRules: number;
    enabledRules: number;
    activeCooldowns: number;
    fallbackMode: boolean;
  } {
    return {
      totalRules: this.rules.length,
      enabledRules: this.rules.filter(rule => rule.isEnabled).length,
      activeCooldowns: this.cooldownCache.size,
      fallbackMode: this.fallbackMode
    };
  }

  // ✅ NOUVELLE MÉTHODE : Réinitialiser le mode fallback
  resetFallbackMode(): void {
    this.fallbackMode = false;
    console.log('🔄 Mode fallback réinitialisé');
  }
}

export default SmartAlertService.getInstance();