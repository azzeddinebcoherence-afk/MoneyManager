// src/types/Analytics.ts - VERSION CORRIGÉE
export interface CashFlowData {
  date: string;
  income: number;
  expenses: number;
  // net?: number; // ✅ Supprimé si non utilisé
}

export interface CategoryBreakdown {
  name: string;
  amount: number;
  type: 'income' | 'expense';
  percentage: number;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
}

export interface NetWorthData {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export interface FinancialReport {
  cashFlow: CashFlowData[];
  categories: CategoryBreakdown[];
  monthlyTrend: MonthlyTrend[];
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
}