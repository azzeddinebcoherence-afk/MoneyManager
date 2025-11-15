// src/hooks/useMonthlyData.ts - VERSION CORRIGÉE ET AMÉLIORÉE
import { useCallback } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useTransactions } from './useTransactions';

export interface MonthlyData {
  year: number;
  month: number;
  income: number;
  expenses: number;
  netFlow: number;
  savingsRate: number;
  transactions: any[];
  transactionCount: number;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export interface UseMonthlyDataReturn {
  getMonthlyData: (year: number, month: number) => MonthlyData;
  getMonthlyOverview: (year: number) => MonthlyData[];
  getAvailableYears: () => number[]; // ✅ CORRECTION : C'est une fonction
  getCurrentMonthData: () => MonthlyData;
  getYearlySummary: (year: number) => {
    totalIncome: number;
    totalExpenses: number;
    totalNetFlow: number;
    averageSavingsRate: number;
    monthlyAverages: {
      income: number;
      expenses: number;
      netFlow: number;
    };
  };
}

export const useMonthlyData = (): UseMonthlyDataReturn => {
  const { transactions } = useTransactions();
  const { formatAmount } = useCurrency();

  const getMonthlyData = useCallback((year: number, month: number): MonthlyData => {
    const monthTransactions = transactions.filter(transaction => {
      const date = new Date(transaction.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netFlow = income - expenses;
    const savingsRate = income > 0 ? (netFlow / income) * 100 : 0;

    // Analyse par catégorie
    const categoryMap = new Map();
    monthTransactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const category = transaction.category || 'Non catégorisé';
        const current = categoryMap.get(category) || 0;
        categoryMap.set(category, current + Math.abs(transaction.amount));
      });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: expenses > 0 ? (amount / expenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      year,
      month,
      income,
      expenses,
      netFlow,
      savingsRate,
      transactions: monthTransactions,
      transactionCount: monthTransactions.length,
      categoryBreakdown
    };
  }, [transactions]);

  const getMonthlyOverview = useCallback((year: number): MonthlyData[] => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    return months
      .map(month => getMonthlyData(year, month))
      .filter(data => data.transactionCount > 0)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }, [getMonthlyData]);

  // ✅ CORRECTION : getAvailableYears est une fonction
  const getAvailableYears = useCallback((): number[] => {
    const years = new Set<number>();
    transactions.forEach(transaction => {
      const year = new Date(transaction.date).getFullYear();
      years.add(year);
    });
    
    // Ajouter l'année courante si aucune transaction
    const currentYear = new Date().getFullYear();
    if (years.size === 0) {
      years.add(currentYear);
    }
    
    // Ajouter les 2 prochaines années pour la planification
    years.add(currentYear + 1);
    years.add(currentYear + 2);
    
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const getCurrentMonthData = useCallback((): MonthlyData => {
    const now = new Date();
    return getMonthlyData(now.getFullYear(), now.getMonth());
  }, [getMonthlyData]);

  const getYearlySummary = useCallback((year: number) => {
    const monthlyData = getMonthlyOverview(year);
    
    const totalIncome = monthlyData.reduce((sum, month) => sum + month.income, 0);
    const totalExpenses = monthlyData.reduce((sum, month) => sum + month.expenses, 0);
    const totalNetFlow = monthlyData.reduce((sum, month) => sum + month.netFlow, 0);
    
    const monthsWithIncome = monthlyData.filter(month => month.income > 0);
    const averageSavingsRate = monthsWithIncome.length > 0 
      ? monthsWithIncome.reduce((sum, month) => sum + month.savingsRate, 0) / monthsWithIncome.length
      : 0;

    const monthlyAverages = {
      income: monthlyData.length > 0 ? totalIncome / monthlyData.length : 0,
      expenses: monthlyData.length > 0 ? totalExpenses / monthlyData.length : 0,
      netFlow: monthlyData.length > 0 ? totalNetFlow / monthlyData.length : 0,
    };

    return {
      totalIncome,
      totalExpenses,
      totalNetFlow,
      averageSavingsRate,
      monthlyAverages
    };
  }, [getMonthlyOverview]);

  return {
    getMonthlyData,
    getMonthlyOverview,
    getAvailableYears, // ✅ CORRECTION : Retourne la fonction
    getCurrentMonthData,
    getYearlySummary
  };
};

export default useMonthlyData;