// src/hooks/useDashboard.ts - VERSION CORRIGÉE
import { useEffect, useState } from 'react';
import { useAccounts } from './useAccounts';
import { useAnalytics } from './useAnalytics';
import { useBudgets } from './useBudgets';
import { useDebts } from './useDebts';
import { useSavings } from './useSavings';
import { useTransactions } from './useTransactions';

export interface DashboardData {
  // Comptes
  totalBalance: number;
  accountsCount: number;
  accountsLoading: boolean;
  
  // Transactions
  recentTransactions: any[];
  transactionsLoading: boolean;
  
  // Transactions récurrentes
  recurringTransactionsCount: number;
  recurringTransactions: any[];
  recurringTransactionsLoading: boolean;
  
  // Budgets
  activeBudgets: any[];
  budgetsLoading: boolean;
  
  // Dettes
  activeDebts: any[];
  debtsLoading: boolean;
  
  // Épargnes
  activeSavingsGoals: any[];
  savingsLoading: boolean;
  
  // Analytics
  cashFlow: {
    income: number;
    expenses: number;
    netFlow: number;
  };
  financialHealth: number;
  isLoading: boolean;
  error: string | null;
}

export const useDashboard = (): DashboardData => {
  // Hooks existants
  const { 
    accounts, 
    totalBalance, 
    loading: accountsLoading 
  } = useAccounts();
  
  const { 
    transactions, 
    loading: transactionsLoading,
    getRecurringTransactions
  } = useTransactions();
  
  const { 
    budgets, 
    loading: budgetsLoading 
  } = useBudgets();
  
  const { 
    debts, 
    loading: debtsLoading 
  } = useDebts();
  
  const { 
    goals, 
    loading: savingsLoading 
  } = useSavings();
  
  const { 
    analytics, 
    loading: analyticsLoading 
  } = useAnalytics();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);
  const [recurringTransactionsLoading, setRecurringTransactionsLoading] = useState(true);

  // Charger les transactions récurrentes
  useEffect(() => {
    const loadRecurringTransactions = async () => {
      try {
        setRecurringTransactionsLoading(true);
        const recurring = getRecurringTransactions();
        setRecurringTransactions(recurring);
      } catch (error) {
        console.error('❌ [useDashboard] Error loading recurring transactions:', error);
      } finally {
        setRecurringTransactionsLoading(false);
      }
    };

    loadRecurringTransactions();
  }, [getRecurringTransactions]);

  useEffect(() => {
    const checkLoading = () => {
      const allLoaded = !accountsLoading && 
                       !transactionsLoading && 
                       !recurringTransactionsLoading && 
                       !budgetsLoading && 
                       !debtsLoading && 
                       !savingsLoading && 
                       !analyticsLoading;
      
      setIsLoading(!allLoaded);
    };

    checkLoading();
  }, [
    accountsLoading, 
    transactionsLoading, 
    recurringTransactionsLoading, 
    budgetsLoading, 
    debtsLoading, 
    savingsLoading, 
    analyticsLoading
  ]);

  // Données calculées
  const recentTransactions = transactions.slice(0, 5);
  const activeBudgets = budgets.filter((budget: any) => budget.isActive);
  const activeDebts = debts.filter((debt: any) => debt.status === 'active' || debt.status === 'overdue');
  const activeSavingsGoals = goals.filter((goal: any) => !goal.isCompleted);

  return {
    // Comptes
    totalBalance,
    accountsCount: accounts.length,
    accountsLoading,
    
    // Transactions
    recentTransactions,
    transactionsLoading,
    
    // Transactions récurrentes
    recurringTransactionsCount: recurringTransactions.length,
    recurringTransactions,
    recurringTransactionsLoading,
    
    // Budgets
    activeBudgets,
    budgetsLoading,
    
    // Dettes
    activeDebts,
    debtsLoading,
    
    // Épargnes
    activeSavingsGoals,
    savingsLoading,
    
    // Analytics
    cashFlow: analytics.cashFlow || { income: 0, expenses: 0, netFlow: 0 },
    financialHealth: analytics.financialHealth || 0,
    isLoading,
    error
  };
};

export default useDashboard;