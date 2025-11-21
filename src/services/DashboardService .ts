// src/services/dashboardService.ts - VERSION CORRIGÉE POUR TRANSACTIONS UNIFIÉES
import { Transaction } from '../types';
import { accountService } from './accountService';
import { calculationService } from './calculationService';
import { debtService } from './debtService';
import { savingsService } from './savingsService';
import { transactionService } from './transactionService';

export interface DashboardData {
  // Patrimoine et soldes
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  availableBalance: number;
  realBalance: number;
  
  // Flux financiers
  monthlyIncome: number;
  monthlyExpenses: number;
  netCashFlow: number;
  savingsRate: number;
  
  // Santé financière
  financialHealth: number;
  
  // Dettes et épargne
  totalDebts: number;
  monthlyDebtPayments: number;
  totalSavings: number;
  savingsProgress: number;
  
  // Transactions récentes
  recentTransactions: Transaction[];
  upcomingRecurring: Transaction[];
  
  // Alertes et notifications
  budgetAlerts: number;
  debtAlerts: number;
  savingsAlerts: number;
  
  // Statistiques mensuelles
  monthlyStats: {
    income: number;
    expenses: number;
    transactionsCount: number;
  };
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  netWorth: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export const dashboardService = {
  // ✅ PRINCIPALE : Récupérer toutes les données du dashboard
  async getDashboardData(userId: string = 'default-user'): Promise<DashboardData> {
    try {
      console.log('📊 [dashboardService] Chargement données dashboard...');
      
      const [
        accounts,
        debts,
        savingsGoals,
        recentTransactions,
        comprehensiveStats,
        financialHealth,
        activeRecurringTransactions
      ] = await Promise.all([
        accountService.getAllAccounts(),
        debtService.getAllDebts(userId),
        savingsService.getAllSavingsGoals(userId),
        this.getRecentTransactions(userId, 10),
        calculationService.getComprehensiveStats(userId),
        calculationService.calculateFinancialHealth(userId),
        transactionService.getRecurringTransactions(userId)
      ]);

      // Calculs supplémentaires
      const monthlyStats = await this.getCurrentMonthStats(userId);
      const upcomingRecurring = this.getUpcomingRecurringTransactions(activeRecurringTransactions);
      
      const totalDebts = debts
        .filter(debt => debt.status === 'active' || debt.status === 'overdue')
        .reduce((sum, debt) => sum + debt.currentAmount, 0);
        
      const monthlyDebtPayments = debts
        .filter(debt => debt.status === 'active' || debt.status === 'overdue')
        .reduce((sum, debt) => sum + (debt.monthlyPayment || 0), 0);
        
      const totalSavings = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
      const savingsProgress = savingsGoals.length > 0 
        ? (totalSavings / savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0)) * 100 
        : 0;

      // Alertes simples
      const budgetAlerts = await this.getBudgetAlerts(userId);
      const debtAlerts = debts.filter(debt => 
        debt.status === 'overdue' || 
        (debt.status === 'active' && new Date(debt.dueDate) < new Date())
      ).length;
      
      const savingsAlerts = savingsGoals.filter(goal => 
        !goal.isCompleted && 
        new Date(goal.targetDate) < new Date() &&
        goal.currentAmount < goal.targetAmount
      ).length;

      const dashboardData: DashboardData = {
        // Patrimoine et soldes
        netWorth: comprehensiveStats.netWorth.netWorth,
        totalAssets: comprehensiveStats.netWorth.totalAssets,
        totalLiabilities: comprehensiveStats.netWorth.totalLiabilities,
        availableBalance: comprehensiveStats.realBalance.availableBalance,
        realBalance: comprehensiveStats.realBalance.realBalance,
        
        // Flux financiers
        monthlyIncome: monthlyStats.income,
        monthlyExpenses: monthlyStats.expenses,
        netCashFlow: comprehensiveStats.cashFlow.netFlow,
        savingsRate: comprehensiveStats.cashFlow.savingsRate,
        
        // Santé financière
        financialHealth,
        
        // Dettes et épargne
        totalDebts,
        monthlyDebtPayments,
        totalSavings,
        savingsProgress: Math.min(savingsProgress, 100),
        
        // Transactions
        recentTransactions,
        upcomingRecurring,
        
        // Alertes
        budgetAlerts,
        debtAlerts,
        savingsAlerts,
        
        // Statistiques
        monthlyStats
      };

      console.log('✅ [dashboardService] Données dashboard chargées avec succès');
      return dashboardData;

    } catch (error) {
      console.error('❌ [dashboardService] Erreur chargement données dashboard:', error);
      
      // Retourner des données par défaut en cas d'erreur
      return this.getDefaultDashboardData();
    }
  },

  // ✅ STATISTIQUES DU MOIS COURANT
  async getCurrentMonthStats(userId: string = 'default-user'): Promise<{ income: number; expenses: number; transactionsCount: number }> {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      // ✅ CORRECTION : Utiliser le service unifié
      const monthlyTransactions = await transactionService.getFilteredTransactions({
        year: currentYear,
        month: currentMonth
      }, userId);

      // Exclure les transactions récurrentes parent
      const validTransactions = monthlyTransactions.filter(tx => 
        !(tx.isRecurring && !tx.parentTransactionId)
      );

      const income = validTransactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        
      const expenses = validTransactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      return {
        income,
        expenses,
        transactionsCount: validTransactions.length
      };
    } catch (error) {
      console.error('❌ [dashboardService] Erreur stats mois courant:', error);
      return { income: 0, expenses: 0, transactionsCount: 0 };
    }
  },

  // ✅ TRANSACTIONS RÉCENTES
  async getRecentTransactions(userId: string = 'default-user', limit: number = 10): Promise<Transaction[]> {
    try {
      // ✅ CORRECTION : Utiliser le service unifié avec filtrage
      const allTransactions = await transactionService.getAllTransactions(userId);
      
      // Trier par date et exclure les récurrentes parent
      const recentTransactions = allTransactions
        .filter(tx => !(tx.isRecurring && !tx.parentTransactionId))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);

      return recentTransactions;
    } catch (error) {
      console.error('❌ [dashboardService] Erreur transactions récentes:', error);
      return [];
    }
  },

  // ✅ TRANSACTIONS RÉCURRENTES À VENIR
  getUpcomingRecurringTransactions(recurringTransactions: Transaction[], limit: number = 5): Transaction[] {
    try {
      const now = new Date();
      
      return recurringTransactions
        .filter(tx => 
          tx.isRecurring && 
          tx.nextOccurrence && 
          new Date(tx.nextOccurrence) >= now
        )
        .sort((a, b) => new Date(a.nextOccurrence!).getTime() - new Date(b.nextOccurrence!).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('❌ [dashboardService] Erreur transactions récurrentes à venir:', error);
      return [];
    }
  },

  // ✅ TENDANCES MENSUELLES
  async getMonthlyTrends(userId: string = 'default-user', months: number = 6): Promise<MonthlyTrend[]> {
    try {
      const trends: MonthlyTrend[] = [];
      const now = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        // ✅ CORRECTION : Utiliser le service unifié
        const monthlyTransactions = await transactionService.getFilteredTransactions({
          year,
          month
        }, userId);

        // Exclure les récurrentes parent
        const validTransactions = monthlyTransactions.filter(tx => 
          !(tx.isRecurring && !tx.parentTransactionId)
        );

        const income = validTransactions
          .filter(tx => tx.type === 'income')
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
          
        const expenses = validTransactions
          .filter(tx => tx.type === 'expense')
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

        // Calcul simplifié du patrimoine (pourrait être amélioré)
        const netWorth = await calculationService.calculateNetWorth(userId);

        trends.push({
          month: `${year}-${month.toString().padStart(2, '0')}`,
          income,
          expenses,
          netWorth: netWorth.netWorth
        });
      }

      return trends;
    } catch (error) {
      console.error('❌ [dashboardService] Erreur tendances mensuelles:', error);
      return [];
    }
  },

  // ✅ DÉPENSES PAR CATÉGORIE
  async getCategorySpending(userId: string = 'default-user', period: 'month' | 'year' = 'month'): Promise<CategorySpending[]> {
    try {
      const now = new Date();
      let year = now.getFullYear();
      let month = period === 'month' ? now.getMonth() + 1 : undefined;
      
      // ✅ CORRECTION : Utiliser le service unifié
      const transactions = await transactionService.getFilteredTransactions({
        year,
        month
      }, userId);

      // Filtrer seulement les dépenses et exclure les récurrentes parent
      const expenses = transactions.filter(tx => 
        tx.type === 'expense' && 
        !(tx.isRecurring && !tx.parentTransactionId)
      );

      const totalExpenses = expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      // Grouper par catégorie
      const categoryMap = new Map<string, number>();
      
      expenses.forEach(tx => {
        const current = categoryMap.get(tx.category) || 0;
        categoryMap.set(tx.category, current + Math.abs(tx.amount));
      });

      // Convertir en tableau et calculer les pourcentages
      const categorySpending: CategorySpending[] = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
          color: this.getCategoryColor(category)
        }))
        .sort((a, b) => b.amount - a.amount);

      return categorySpending;
    } catch (error) {
      console.error('❌ [dashboardService] Erreur dépenses par catégorie:', error);
      return [];
    }
  },

  // ✅ ALERTES BUDGET
  async getBudgetAlerts(userId: string = 'default-user'): Promise<number> {
    try {
      // Implémentation simplifiée - à compléter avec le service budget
      const monthlyStats = await this.getCurrentMonthStats(userId);
      
      // Logique d'alerte basique
      let alerts = 0;
      
      if (monthlyStats.expenses > monthlyStats.income * 0.8) {
        alerts++; // Dépenses > 80% des revenus
      }
      
      if (monthlyStats.expenses > monthlyStats.income) {
        alerts++; // Dépenses > revenus
      }
      
      return alerts;
    } catch (error) {
      console.error('❌ [dashboardService] Erreur alertes budget:', error);
      return 0;
    }
  },

  // ✅ DONNÉES PAR DÉFAUT (fallback)
  getDefaultDashboardData(): DashboardData {
    return {
      netWorth: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      availableBalance: 0,
      realBalance: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      netCashFlow: 0,
      savingsRate: 0,
      financialHealth: 50,
      totalDebts: 0,
      monthlyDebtPayments: 0,
      totalSavings: 0,
      savingsProgress: 0,
      recentTransactions: [],
      upcomingRecurring: [],
      budgetAlerts: 0,
      debtAlerts: 0,
      savingsAlerts: 0,
      monthlyStats: {
        income: 0,
        expenses: 0,
        transactionsCount: 0
      }
    };
  },

  // ✅ COULEURS PAR CATÉGORIE (helper)
  getCategoryColor(category: string): string {
    const colorMap: { [key: string]: string } = {
      'Alimentation': '#FF6B6B',
      'Transport': '#4ECDC4',
      'Logement': '#45B7D1',
      'Loisirs': '#96CEB4',
      'Santé': '#FFEAA7',
      'Shopping': '#DDA0DD',
      'Éducation': '#98D8C8',
      'Voyages': '#F7DC6F',
      'Autres dépenses': '#778899',
      'Salaire': '#52C41A',
      'Investissements': '#FAAD14',
      'Cadeaux': '#722ED1',
      'Prime': '#13C2C2',
      'Autres revenus': '#20B2AA'
    };
    
    return colorMap[category] || '#6B7280';
  },

  // ✅ SYNCHRONISATION COMPLÈTE
  async syncDashboardData(userId: string = 'default-user'): Promise<void> {
    try {
      console.log('🔄 [dashboardService] Synchronisation données dashboard...');
      
      await Promise.all([
        accountService.getAllAccounts(),
        debtService.getAllDebts(userId),
        savingsService.getAllSavingsGoals(userId),
        transactionService.getAllTransactions(userId),
        transactionService.getRecurringTransactions(userId)
      ]);
      
      console.log('✅ [dashboardService] Synchronisation terminée');
    } catch (error) {
      console.error('❌ [dashboardService] Erreur synchronisation:', error);
      throw error;
    }
  },

  // ✅ VÉRIFICATION DONNÉES (pour debug)
  async debugDashboardData(userId: string = 'default-user'): Promise<any> {
    try {
      const [
        accounts,
        debts,
        savingsGoals,
        transactions,
        recurringTransactions,
        dashboardData
      ] = await Promise.all([
        accountService.getAllAccounts(),
        debtService.getAllDebts(userId),
        savingsService.getAllSavingsGoals(userId),
        transactionService.getAllTransactions(userId),
        transactionService.getRecurringTransactions(userId),
        this.getDashboardData(userId)
      ]);

      return {
        accounts: {
          count: accounts.length,
          totalBalance: accounts.reduce((sum, acc) => sum + acc.balance, 0)
        },
        debts: {
          count: debts.length,
          active: debts.filter(d => d.status === 'active').length,
          totalAmount: debts.reduce((sum, debt) => sum + debt.currentAmount, 0)
        },
        savings: {
          count: savingsGoals.length,
          totalAmount: savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0),
          totalTarget: savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0)
        },
        transactions: {
          total: transactions.length,
          recurring: transactions.filter(t => t.isRecurring).length,
          normal: transactions.filter(t => !t.isRecurring).length
        },
        recurring: {
          active: recurringTransactions.length,
          upcoming: recurringTransactions.filter(t => 
            t.nextOccurrence && new Date(t.nextOccurrence) >= new Date()
          ).length
        },
        dashboard: dashboardData
      };
    } catch (error) {
      console.error('❌ [dashboardService] Erreur debug:', error);
      return { error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }
};

export default dashboardService;