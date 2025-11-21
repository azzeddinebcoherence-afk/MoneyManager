// src/hooks/useAdvancedAnalytics.ts - VERSION CORRIGÉE
import { useMemo } from 'react';
import { useBudgets } from './useBudgets';
import { useDebts } from './useDebts';
import { useSavings } from './useSavings';
import { useTransactions } from './useTransactions';

export const useAdvancedAnalytics = () => {
  const { transactions } = useTransactions();
  const { budgets } = useBudgets();
  const { debts } = useDebts();
  const { goals: savingsGoals } = useSavings(); // Correction ici

  // Calculer les statistiques financières sans données utilisateur
  const financialHealth = useMemo(() => {
    const totalIncome = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    const totalDebt = debts.reduce((sum: number, debt: any) => sum + debt.currentAmount, 0);
    const totalSavings = savingsGoals.reduce((sum: number, goal: any) => sum + goal.currentAmount, 0);
    
    const netWorth = totalSavings - totalDebt;
    const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
    
    return {
      totalIncome,
      totalExpenses,
      netWorth,
      savingsRate,
      debtToIncomeRatio: totalIncome > 0 ? (totalDebt / totalIncome) * 100 : 0,
      financialScore: calculateFinancialScore(totalIncome, totalExpenses, totalDebt, totalSavings)
    };
  }, [transactions, debts, savingsGoals]);

  const spendingByCategory = useMemo(() => {
    const expenses = transactions.filter((t: any) => t.type === 'expense');
    const categoryMap: { [key: string]: number } = {};
    
    expenses.forEach((expense: any) => {
      const category = expense.category || 'Non catégorisé';
      categoryMap[category] = (categoryMap[category] || 0) + expense.amount;
    });
    
    return Object.entries(categoryMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Enriched spending analysis used by analytics screens (includes trend/currentMonth/status)
  const spendingAnalysis = useMemo(() => {
    return spendingByCategory.map(item => ({
      name: item.name,
      amount: item.amount,
      currentMonth: item.amount,
      trend: 0,
      status: 'on_track'
    }));
  }, [spendingByCategory]);

  const budgetPerformance = useMemo(() => {
    return budgets.map((budget: any) => {
      const categoryExpenses = transactions
        .filter((t: any) => t.type === 'expense' && t.category === budget.category)
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      
      const utilizationRate = budget.amount > 0 ? (categoryExpenses / budget.amount) * 100 : 0;
      
      return {
        ...budget,
        spent: categoryExpenses,
        remaining: Math.max(0, budget.amount - categoryExpenses),
        utilizationRate,
        status: utilizationRate >= 90 ? 'over' : utilizationRate >= 75 ? 'warning' : 'good'
      };
    });
  }, [budgets, transactions]);

  const debtAnalytics = useMemo(() => {
    const totalMonthlyDebtPayment = debts.reduce((sum: number, debt: any) => sum + (debt.monthlyPayment || 0), 0);
    const highestInterestDebt = debts.length > 0 
      ? debts.reduce((max: any, debt: any) => debt.interestRate > max.interestRate ? debt : max)
      : null;
    
    return {
      totalMonthlyDebtPayment,
      highestInterestDebt,
      debtFreeDate: calculateDebtFreeDate(debts),
      totalInterestPaid: calculateTotalInterest(debts)
    };
  }, [debts]);

  return {
    financialHealth,
    spendingByCategory,
    spendingAnalysis,
    loading: false,
    budgetPerformance,
    debtAnalytics,
    // Données utilisateur par défaut
    userData: {
      name: "Utilisateur",
      currency: "MAD"
    }
  };
};


// Fonctions utilitaires
const calculateFinancialScore = (
  income: number, 
  expenses: number, 
  debt: number, 
  savings: number
): number => {
  let score = 100;
  
  // Pénalité pour dépenses élevées
  if (expenses > income * 0.8) score -= 20;
  else if (expenses > income * 0.6) score -= 10;
  
  // Pénalité pour dette élevée
  if (debt > income * 12) score -= 30;
  else if (debt > income * 6) score -= 15;
  
  // Bonus pour épargne
  if (savings > income * 6) score += 20;
  else if (savings > income * 3) score += 10;
  
  return Math.max(0, Math.min(100, score));
};

const calculateDebtFreeDate = (debts: any[]): Date | null => {
  if (debts.length === 0) return null;
  
  // Calcul simplifié de la date de fin de dette
  const today = new Date();
  const maxDebtDuration = Math.max(...debts.map((debt: any) => {
    if (!debt.monthlyPayment || debt.monthlyPayment === 0) return 0;
    return debt.currentAmount / debt.monthlyPayment;
  }));
  
  today.setMonth(today.getMonth() + Math.ceil(maxDebtDuration));
  return today;
};

const calculateTotalInterest = (debts: any[]): number => {
  return debts.reduce((total: number, debt: any) => {
    if (!debt.monthlyPayment || debt.monthlyPayment === 0) return total;
    
    const monthlyRate = debt.interestRate / 100 / 12;
    const months = debt.currentAmount / debt.monthlyPayment;
    const totalPaid = debt.monthlyPayment * months;
    
    return total + (totalPaid - debt.currentAmount);
  }, 0);
};

export default useAdvancedAnalytics;