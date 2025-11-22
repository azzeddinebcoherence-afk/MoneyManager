// src/types/Alert.ts - VERSION COMPLÈTEMENT CORRIGÉE
export type AlertType = 
  | 'budget' 
  | 'savings' 
  | 'debt' 
  | 'system' 
  | 'security' 
  | 'transaction'
  | 'bill'
  | 'reminder'
  | 'report'
  | 'account'
  | 'summary'
  | 'payment'        // Paiements automatiques
  | 'refund'         // Remboursements
  | 'transfer'       // Transferts entre comptes
  | 'goal'           // Objectifs d'épargne
  | 'backup'         // Sauvegardes
  | 'sync'           // Synchronisation
  | 'success'        // Confirmations générales
  | 'info';          // Informations générales

export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'dismissed' | 'resolved' | 'archived';

export interface Alert {
  id: string;
  userId: string;
  type: AlertType;
  title: string;
  message: string;
  priority: AlertPriority;
  status: AlertStatus;
  data?: any;
  actions?: AlertAction[];
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  read: boolean; // ✅ CORRIGÉ : 'read' au lieu de 'isRead'
  category?: string;
  source?: string;
  actionUrl?: string; // ✅ AJOUTÉ
  actionLabel?: string; // ✅ AJOUTÉ
}

export interface AlertAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'destructive';
  handler: () => void | Promise<void>;
}

export interface AlertPreferences {
  budgetAlerts: boolean;
  budgetThreshold: number;
  savingsAlerts: boolean;
  savingsProgressThreshold: number;
  debtAlerts: boolean;
  debtDueDateReminder: number;
  securityAlerts: boolean;
  largeTransactionThreshold: number;
  systemAlerts: boolean;
  billAlerts: boolean;
  billReminderDays: number;
  weeklyReports: boolean;
  monthlyReports: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  checkFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
}

export interface SmartAlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: AlertCondition[];
  actions: AlertAction[];
  priority: AlertPriority;
  cooldown?: number;
}

export interface AlertCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'matches';
  value: any;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  categories: {
    transactions: boolean;
    budgets: boolean;
    savings: boolean;
    debts: boolean;
    security: boolean;
    system: boolean;
  };
}

// Types pour les données spécifiques d'alerte
export interface BudgetAlertData {
  budgetId: string;
  budgetName: string;
  spent: number;
  limit: number;
  percentage: number;
  period: string;
}

export interface SavingsAlertData {
  goalId: string;
  goalName: string;
  currentAmount: number;
  targetAmount: number;
  percentage: number;
  deadline?: string;
}

export interface DebtAlertData {
  debtId: string;
  debtName: string;
  creditor: string;
  dueDate: string;
  amountDue: number;
  totalAmount: number;
  daysUntilDue: number;
}

export interface TransactionAlertData {
  transactionId: string;
  accountId: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  isLarge: boolean;
}

export interface BillAlertData {
  billId: string;
  billName: string;
  dueDate: string;
  amount: number;
  daysUntilDue: number;
  isRecurring: boolean;
}

export interface AlertStats {
  total: number;
  active: number;
  read: number;
  unread: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  byType: {
    [key in AlertType]?: number;
  };
}

export interface AlertFilters {
  status?: AlertStatus;
  priority?: AlertPriority;
  type?: AlertType;
  read?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}