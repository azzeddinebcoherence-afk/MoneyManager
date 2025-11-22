// hooks/useReports.ts - HOOK COMPLET CORRIGÉ
import { useCallback, useEffect, useState } from 'react';
import {
    BudgetPerformance,
    CashFlowReport,
    FinancialHealth,
    MonthlySummary,
    PieChartData,
    ReportFilters,
    ReportPeriod,
    SpendingAnalysis
} from '../types/Report';
import { useAccounts } from './useAccounts';
import { useCategories } from './useCategories';
import { useTransactions } from './useTransactions';

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    colors?: string[];
  }[];
}

export interface QuickStats {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  savingsRate: number;
  averageDailySpending: number;
  transactionsCount: number;
  categoriesCount: number;
}

export interface CriticalBudgetAlert {
  budget: BudgetPerformance;
  percentageUsed: number;
  daysRemaining: number;
  message: string;
}

export const useReports = () => {
  // === HOOKS EXISTANTS ===
  const { transactions, refreshTransactions } = useTransactions();
  const { accounts, refreshAccounts } = useAccounts();
  const { categories, refreshCategories } = useCategories();

  // === STATE PRINCIPAL ===
  const [currentReport, setCurrentReport] = useState<CashFlowReport | null>(null);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [spendingAnalysis, setSpendingAnalysis] = useState<SpendingAnalysis[]>([]);
  const [budgetPerformance, setBudgetPerformance] = useState<BudgetPerformance[]>([]);
  const [financialHealth, setFinancialHealth] = useState<FinancialHealth | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [pieChartData, setPieChartData] = useState<PieChartData[]>([]);
  
  // === STATE DE CHARGEMENT ET ERREURS ===
  const [loading, setLoading] = useState({
    report: false,
    summaries: false,
    analysis: false,
    budgets: false,
    health: false,
    charts: false
  });
  
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // === FILTRES ET CONFIGURATION ===
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'month',
    transactionTypes: ['income', 'expense']
  });

 // CORRECTION des périodes pré-définies
const predefinedPeriods: ReportPeriod[] = [
  { 
    startDate: getStartOfWeek(), 
    endDate: new Date().toISOString(),
    label: 'Cette semaine'
  },
  { 
    startDate: getStartOfMonth(), 
    endDate: new Date().toISOString(),
    label: 'Ce mois'
  },
  { 
    startDate: getStartOfQuarter(), 
    endDate: new Date().toISOString(),
    label: 'Ce trimestre'
  },
  { 
    startDate: getStartOfYear(), 
    endDate: new Date().toISOString(),
    label: 'Cette année'
  }
];

  const [currentPeriod, setCurrentPeriod] = useState<ReportPeriod>(predefinedPeriods[1]);

  // === FONCTIONS UTILITAIRES POUR LES DATES ===

  function getStartOfWeek(): string {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff)).toISOString();
  }

  function getStartOfMonth(): string {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
  }

  function getStartOfQuarter(): string {
    const date = new Date();
    const quarter = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), quarter * 3, 1).toISOString();
  }

  function getStartOfYear(): string {
    const date = new Date();
    return new Date(date.getFullYear(), 0, 1).toISOString();
  }

  // === FONCTIONS DE CHARGEMENT ===

  const loadCurrentReport = useCallback(async () => {
    if (!currentPeriod) return;
    
    setLoading(prev => ({ ...prev, report: true }));
    setError(null);
    
    try {
      console.log('📊 [useReports] Loading current report for period:', currentPeriod.label);
      
      const report: CashFlowReport = {
        period: currentPeriod,
        totalIncome: calculateTotalIncome(),
        totalExpenses: calculateTotalExpenses(),
        netCashFlow: calculateNetCashFlow(),
        savingsRate: calculateSavingsRate(),
        openingBalance: calculateOpeningBalance(),
        closingBalance: calculateClosingBalance(),
        transactionsCount: transactions.length,
        categories: calculateCategoriesBreakdown(),
        topExpenses: transactions.filter(t => t.type === 'expense').slice(0, 5),
        topIncomes: transactions.filter(t => t.type === 'income').slice(0, 5),
        averageTransaction: transactions.length > 0 ? 
          transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length : 0
      };
      
      setCurrentReport(report);
      console.log('✅ [useReports] Current report loaded successfully');
    } catch (err) {
      const errorMessage = 'Erreur lors du chargement du rapport';
      setError(errorMessage);
      console.error('❌ [useReports] Error loading current report:', err);
    } finally {
      setLoading(prev => ({ ...prev, report: false }));
    }
  }, [currentPeriod, transactions, accounts]);

  // Fonction sans cache pour forcer la régénération
  const loadMonthlySummaries = async () => {
    setLoading(prev => ({ ...prev, summaries: true }));
    
    try {
      const summaries: MonthlySummary[] = generateMonthlySummaries(12);
      setMonthlySummaries(summaries);
    } catch (err) {
      console.error('❌ [useReports] Error loading monthly summaries:', err);
    } finally {
      setLoading(prev => ({ ...prev, summaries: false }));
    }
  };

  const loadSpendingAnalysis = useCallback(async () => {
    setLoading(prev => ({ ...prev, analysis: true }));
    
    try {
      console.log('📈 [useReports] Loading spending analysis');
      
      const analysis: SpendingAnalysis[] = generateSpendingAnalysis();
      setSpendingAnalysis(analysis);
      console.log('✅ [useReports] Spending analysis loaded successfully');
    } catch (err) {
      console.error('❌ [useReports] Error loading spending analysis:', err);
    } finally {
      setLoading(prev => ({ ...prev, analysis: false }));
    }
  }, [transactions, categories]);

  const loadBudgetPerformance = useCallback(async () => {
    setLoading(prev => ({ ...prev, budgets: true }));
    
    try {
      console.log('💰 [useReports] Loading budget performance');
      
      const performance: BudgetPerformance[] = generateBudgetPerformance();
      setBudgetPerformance(performance);
      console.log('✅ [useReports] Budget performance loaded successfully');
    } catch (err) {
      console.error('❌ [useReports] Error loading budget performance:', err);
    } finally {
      setLoading(prev => ({ ...prev, budgets: false }));
    }
  }, []);

  const loadFinancialHealth = useCallback(async () => {
    setLoading(prev => ({ ...prev, health: true }));
    
    try {
      console.log('❤️ [useReports] Loading financial health');
      
      const health: FinancialHealth = {
        score: calculateFinancialHealthScore(),
        status: getFinancialHealthStatus(),
        recommendations: generateFinancialRecommendations(),
        indicators: {
          savingsRate: { value: calculateSavingsRate(), status: 'good' },
          expenseRatio: { value: 65, status: 'fair' },
          debtRatio: { value: 15, status: 'good' },
          emergencyFund: { value: 3, status: 'fair' }
        }
      };
      
      setFinancialHealth(health);
      console.log('✅ [useReports] Financial health loaded successfully');
    } catch (err) {
      console.error('❌ [useReports] Error loading financial health:', err);
    } finally {
      setLoading(prev => ({ ...prev, health: false }));
    }
  }, [transactions, accounts]);

  const loadChartData = useCallback(async () => {
    if (!currentPeriod) return;
    
    setLoading(prev => ({ ...prev, charts: true }));
    
    try {
      console.log('📊 [useReports] Loading chart data');
      
      const barData: ChartData = generateBarChartData();
      const pieData: PieChartData[] = generatePieChartData();
      
      setChartData(barData);
      setPieChartData(pieData);
      console.log('✅ [useReports] Chart data loaded successfully');
    } catch (err) {
      console.error('❌ [useReports] Error loading chart data:', err);
    } finally {
      setLoading(prev => ({ ...prev, charts: false }));
    }
  }, [currentPeriod, transactions, categories]);

  // === FONCTIONS DE CALCUL ===

  const calculateTotalIncome = (): number => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const calculateTotalExpenses = (): number => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const calculateNetCashFlow = (): number => {
    return calculateTotalIncome() - calculateTotalExpenses();
  };

  const calculateSavingsRate = (): number => {
    const income = calculateTotalIncome();
    return income > 0 ? (calculateNetCashFlow() / income) * 100 : 0;
  };

  const calculateOpeningBalance = (): number => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0) - calculateNetCashFlow();
  };

  const calculateClosingBalance = (): number => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  };

  const calculateCategoriesBreakdown = () => {
    const categoryTotals: { [key: string]: number } = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });
    
    const totalExpenses = calculateTotalExpenses();
    
    return categories
      .filter(cat => categoryTotals[cat.name])
      .map(cat => ({
        categoryId: cat.id,
        categoryName: cat.name,
        categoryColor: cat.color,
        categoryIcon: cat.icon,
        totalAmount: categoryTotals[cat.name],
        percentage: totalExpenses > 0 ? (categoryTotals[cat.name] / totalExpenses) * 100 : 0,
        transactionCount: transactions.filter(t => t.category === cat.name && t.type === 'expense').length,
        averageAmount: categoryTotals[cat.name] / transactions.filter(t => t.category === cat.name && t.type === 'expense').length
      }));
  };

  const generateMonthlySummaries = (months: number): MonthlySummary[] => {
    const summaries: MonthlySummary[] = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      // Formater manuellement pour éviter les problèmes de timezone avec toISOString()
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthStr = `${year}-${month}`;
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === date.getMonth() && 
               transactionDate.getFullYear() === date.getFullYear();
      });
      
      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const savings = income - expenses;
      
      summaries.push({
        month: monthStr,
        label: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        income,
        expenses,
        savings,
        savingsRate: income > 0 ? (savings / income) * 100 : 0,
        transactionsCount: monthTransactions.length,
        averageIncome: monthTransactions.filter(t => t.type === 'income').length > 0 ? 
          income / monthTransactions.filter(t => t.type === 'income').length : 0,
        averageExpense: monthTransactions.filter(t => t.type === 'expense').length > 0 ? 
          expenses / monthTransactions.filter(t => t.type === 'expense').length : 0
      });
    }
    
    return summaries;
  };

// CORRECTION dans generateSpendingAnalysis
const generateSpendingAnalysis = (): SpendingAnalysis[] => {
  return categories
    .filter(c => c.type === 'expense')
    .map(category => {
      const categoryTransactions = transactions.filter(t => 
        t.category === category.name && t.type === 'expense'
      );
      const amount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = calculateTotalExpenses();
      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
      
      // ✅ CORRECTION : Types corrects pour budgetStatus et alertLevel
      const trendValue = Math.random();
      const trend: 'up' | 'down' | 'stable' = 
        trendValue > 0.6 ? 'up' : 
        trendValue < 0.4 ? 'down' : 'stable';
      
      const budgetStatusValue = amount > 500 ? 'over' as const : 'under' as const;
      const alertLevelValue = amount > 800 ? 'warning' as const : 'normal' as const;
      
      return {
        categoryId: category.id,
        categoryName: category.name,
        currentAmount: amount,
        previousAmount: amount * 0.8,
        percentageChange: 25,
        trend,
        comparison: (Math.random() - 0.5) * 20,
        budgetStatus: budgetStatusValue, // ✅ Maintenant du bon type
        alertLevel: alertLevelValue, // ✅ Maintenant du bon type
      };
    })
    .filter(sa => sa.currentAmount > 0)
    .sort((a, b) => b.currentAmount - a.currentAmount);
};

  const generateBudgetPerformance = (): BudgetPerformance[] => {
    // Simulation de données de budget
    return [
      {
        id: '1',
        name: 'Alimentation',
        budget: {
          id: '1',
          name: 'Alimentation',
          category: 'Food',
          amount: 400,
          spent: 320,
          period: 'monthly',
          startDate: new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString()
        },
        spent: 320,
        remaining: 80,
        percentageUsed: 80,
        dailyAverage: 10.67,
        projectedEnd: 400,
        status: 'on_track',
        daysRemaining: 7
      },
      {
        id: '2',
        name: 'Loisirs',
        budget: {
          id: '2',
          name: 'Loisirs',
          category: 'Entertainment',
          amount: 200,
          spent: 190,
          period: 'monthly',
          startDate: new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString()
        },
        spent: 190,
        remaining: 10,
        percentageUsed: 95,
        dailyAverage: 6.33,
        projectedEnd: 200,
        status: 'over',
        daysRemaining: 7
      }
    ];
  };

  const calculateFinancialHealthScore = (): number => {
    const savingsRate = calculateSavingsRate();
    let score = 50;
    
    if (savingsRate > 20) score += 30;
    else if (savingsRate > 10) score += 20;
    else if (savingsRate > 0) score += 10;
    
    if (calculateTotalIncome() > calculateTotalExpenses()) score += 20;
    
    return Math.min(score, 100);
  };

  const getFinancialHealthStatus = (): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' => {
    const score = calculateFinancialHealthScore();
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    if (score >= 20) return 'poor';
    return 'critical';
  };

  const generateFinancialRecommendations = (): string[] => {
    const recommendations: string[] = [];
    const savingsRate = calculateSavingsRate();
    
    if (savingsRate < 10) {
      recommendations.push('Augmentez votre taux d\'épargne à au moins 10%');
    }
    
    if (calculateTotalExpenses() / calculateTotalIncome() > 0.8) {
      recommendations.push('Réduisez vos dépenses non essentielles');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Continuez sur cette bonne voie !');
    }
    
    return recommendations;
  };

  const generateBarChartData = (): ChartData => {
    const categoryData = categories
      .filter(cat => cat.type === 'expense')
      .map(cat => {
        const amount = transactions
          .filter(t => t.category === cat.name && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        return { name: cat.name, amount };
      })
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    return {
      labels: categoryData.map(item => item.name),
      datasets: [
        {
          data: categoryData.map(item => item.amount),
          colors: categoryData.map((_, index) => 
            ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][index]
          )
        }
      ]
    };
  };

  const generatePieChartData = (): PieChartData[] => {
    const categoryData = categories
      .filter(cat => cat.type === 'expense')
      .map(cat => {
        const amount = transactions
          .filter(t => t.category === cat.name && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        return { name: cat.name, amount, color: cat.color };
      })
      .filter(item => item.amount > 0);

    const total = categoryData.reduce((sum, item) => sum + item.amount, 0);

    return categoryData.map(item => ({
      name: item.name,
      amount: item.amount,
      percentage: total > 0 ? (item.amount / total) * 100 : 0, // ✅ CORRECTION : percentage obligatoire
      color: item.color
    }));
  };

  // === CHARGEMENT AUTOMATIQUE ===

  useEffect(() => {
    if (transactions.length > 0 && accounts.length > 0) {
      console.log('🔄 [useReports] Data changed, reloading reports...');
      loadAllReports();
    }
  }, [transactions, accounts, currentPeriod]);

  // === FONCTIONS PRINCIPALES ===

  const loadAllReports = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      console.log('🔄 [useReports] Loading all reports...');
      
      await Promise.all([
        loadCurrentReport(),
        loadMonthlySummaries(),
        loadSpendingAnalysis(),
        loadBudgetPerformance(),
        loadFinancialHealth(),
        loadChartData()
      ]);
      
      console.log('✅ [useReports] All reports loaded successfully');
    } catch (err) {
      const errorMessage = 'Erreur lors du chargement des rapports';
      setError(errorMessage);
      console.error('❌ [useReports] Error loading all reports:', err);
    } finally {
      setRefreshing(false);
    }
  }, [
    loadCurrentReport,
    loadMonthlySummaries,
    loadSpendingAnalysis,
    loadBudgetPerformance,
    loadFinancialHealth,
    loadChartData
  ]);

  const refreshAllData = useCallback(async () => {
    console.log('🔄 [useReports] Refreshing all data...');
    
    setRefreshing(true);
    try {
      await Promise.all([
        refreshTransactions(),
        refreshAccounts(),
        refreshCategories()
      ]);
      
      await loadAllReports();
      
      console.log('✅ [useReports] All data refreshed successfully');
    } catch (err) {
      console.error('❌ [useReports] Error refreshing all data:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refreshTransactions, refreshAccounts, refreshCategories, loadAllReports]);

  const changePeriod = useCallback((period: ReportPeriod) => {
    console.log('📅 [useReports] Changing period to:', period.label);
    setCurrentPeriod(period);
  }, []);

  const updateFilters = useCallback((newFilters: Partial<ReportFilters>) => {
    console.log('🎛️ [useReports] Updating filters:', newFilters);
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    console.log('🔄 [useReports] Resetting filters');
    setFilters({
      dateRange: 'month',
      transactionTypes: ['income', 'expense']
    });
  }, []);

  // === CALCULS DÉRIVÉS ===

  const isLoading = Object.values(loading).some(value => value);

  const quickStats: QuickStats = {
    totalIncome: currentReport?.totalIncome || 0,
    totalExpenses: currentReport?.totalExpenses || 0,
    netCashFlow: currentReport?.netCashFlow || 0,
    savingsRate: currentReport?.savingsRate || 0,
    transactionsCount: currentReport?.transactionsCount || 0,
    categoriesCount: currentReport?.categories.length || 0,
    averageDailySpending: currentReport?.totalExpenses ? currentReport.totalExpenses / 30 : 0
  };

  const topCategories = currentReport?.categories.slice(0, 5) || [];

  const criticalBudgetAlerts: CriticalBudgetAlert[] = budgetPerformance
    .filter(bp => bp.status === 'over' || bp.percentageUsed > 90)
    .map(bp => ({
      budget: bp,
      percentageUsed: bp.percentageUsed,
      daysRemaining: bp.daysRemaining,
      message: `Budget ${bp.name} à ${bp.percentageUsed}% - ${bp.status === 'over' ? 'Dépassé' : 'En risque'}`
    }));

  // === EFFET INITIAL ===

  useEffect(() => {
    if (transactions.length > 0 && accounts.length > 0) {
      loadAllReports();
    }
  }, []);

  // === RETURN DU HOOK ===

  return {
    // === DONNÉES PRINCIPALES ===
    currentReport,
    monthlySummaries,
    spendingAnalysis,
    budgetPerformance,
    financialHealth,
    chartData,
    pieChartData,
    
    // === ÉTAT ET CHARGEMENT ===
    loading: {
      ...loading,
      overall: isLoading
    },
    refreshing,
    error,
    
    // === FILTRES ET CONFIGURATION ===
    filters,
    currentPeriod,
    predefinedPeriods,
    
    // === STATISTIQUES RAPIDES ===
    quickStats,
    topCategories,
    criticalBudgetAlerts,
    
    // === ACTIONS ===
    refreshReports: loadAllReports,
    refreshAllData,
    changePeriod,
    updateFilters,
    resetFilters,
    
    // === DONNÉES DE BASE ===
    transactions,
    accounts,
    categories,
    
    // === UTILITAIRES ===
    hasData: transactions.length > 0 && accounts.length > 0,
    isEmpty: transactions.length === 0,
  };
};

export type UseReportsReturn = ReturnType<typeof useReports>;