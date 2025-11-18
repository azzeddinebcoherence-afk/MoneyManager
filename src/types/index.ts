// src/types/index.ts - VERSION COMPLÈTEMENT UNIFIÉE

// ===== TYPES PRINCIPAUX UNIFIÉS =====
export * from './Alert';
export * from './Analytics';
export * from './AnnualCharge';
export * from './Backup';
export * from './Budget';
export * from './Category';
export * from './Chart';
export * from './Debt';
export * from './Export';
export * from './IslamicCharge';
export * from './Report';
export * from './Savings';
export * from './Security';
export * from './Sync';
export * from './User';

export interface IslamicFinancialSettings {
  zakatEnabled: boolean;
  zakatPercentage: number;
  islamicChargesEnabled: boolean;
  calculationMethod: 'UmmAlQura' | 'Fixed';
}

export interface ZakatCalculation {
  totalAssets: number;
  zakatAmount: number;
  nisab: number;
  isZakatDue: boolean;
  calculationDate: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'cash' | 'bank' | 'card' | 'savings' | 'investment' | 'loan' | 'other';
  balance: number;
  currency: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
}

// ✅ TYPE TRANSACTION UNIFIÉ AVEC RÉCURRENCE
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  currency?: string;
  category: string; // ID de la catégorie (peut être une sous-catégorie)
  subCategory?: string; // ✅ NOUVEAU : ID de la sous-catégorie spécifique
  accountId: string;
  description: string;
  date: string;
  createdAt: string;
  
  // Champs pour la récurrence
  isRecurring?: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceEndDate?: string;
  parentTransactionId?: string;
  nextOccurrence?: string;
  lastProcessed?: string;
  isActive?: boolean;
  isAnnualCharge?: boolean;
  annualChargeId?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  parentId?: string; // ✅ NOUVEAU : Référence à la catégorie parente
  level: number; // ✅ NOUVEAU : Niveau dans la hiérarchie (0 = catégorie principale, 1 = sous-catégorie)
  isActive: boolean;
  sortOrder: number; // ✅ NOUVEAU : Ordre d'affichage
  description?: string;
  budget?: number; // ✅ NOUVEAU : Budget optionnel pour la catégorie
  createdAt: string;
  updatedAt?: string;
  isSubCategory?: boolean;
}

export interface CreateCategoryData {
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  parentId?: string;
  level?: number;
  sortOrder?: number;
  description?: string;
  budget?: number;
  isActive?: boolean;
  isSubCategory?: boolean; // ✅ AJOUTÉ
}

export interface CategoryTree {
  category: Category;
  subCategories: Category[];
}

export interface Budget {
  id: string;
  name: string;
  category: string; // Peut être une catégorie principale ou sous-catégorie
  subCategory?: string; // ✅ NOUVEAU : Sous-catégorie spécifique
  amount: number;
  spent: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  isRead: boolean;
  data?: any;
  actionUrl?: string;
  createdAt: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  triggeredAt?: string;
}

// ===== TYPES POUR LES STATISTIQUES =====

export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netFlow: number;
  accountsCount: number;
  transactionsCount: number;
  recentTransactions: Transaction[];
  netWorth: number;
  budgetPerformance: {
    totalBudget: number;
    totalSpent: number;
    utilizationRate: number;
    overBudgetCount: number;
  };
  savingsProgress: number;
  debtProgress: number;
  loading: boolean;
}

export interface BudgetStats {
  totalBudgets: number;
  activeBudgets: number;
  totalSpent: number;
  totalBudget: number;
  averageUsage: number;
}

export interface AlertStats {
  total: number;
  unread: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
  subCategories: {
    subCategoryId: string;
    subCategoryName: string;
    totalAmount: number;
    transactionCount: number;
  }[];
}

// ===== TYPES POUR LES FORMULAIRES ET MODALES =====

export interface TransferData {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  date: string;
}

export interface FavoriteTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  accountId: string;
  isActive: boolean;
  createdAt: string;
}

export interface SearchFilters {
  type: 'all' | 'income' | 'expense';
  category: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  minAmount: string;
  maxAmount: string;
  isRecurring?: boolean;
}

// ✅ TYPE POUR CRÉATION DE TRANSACTION UNIFIÉE
export interface CreateTransactionData {
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  subCategory?: string; // ✅ NOUVEAU
  accountId: string;
  description: string;
  date: string;
  isRecurring?: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceEndDate?: string;
  isAnnualCharge?: boolean;
  annualChargeId?: string;
}

export interface SubCategory {
  id: string;
  name: string;
  type: 'expense' | 'income' | 'both';
  color: string;
  icon: string;
  parentId: string;
  isSubCategory: boolean;
  budget?: number;
  isActive?: boolean;
  createdAt: string;
}

export interface CategoryHierarchy {
  category: Category;
  subCategories: Category[];
  transactionCount: number;
  totalAmount: number;
}



// ===== TYPES POUR LES GRAPHIQUES ET RAPPORTS =====

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    colors?: string[];
  }[];
}

export interface ReportData {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  categories: {
    name: string;
    amount: number;
    percentage: number;
    color: string;
  }[];
}

// ===== TYPES POUR LA GESTION DES DONNÉES =====

export interface BackupData {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  annualCharges: any[];
  debts: any[];
  savingsGoals: any[];
  exportDate: string;
  version: string;
}

export interface UserPreferences {
  currency: string;
  dateFormat: string;
  language: string;
  theme: ThemeType;
  biometricAuth: boolean;
  autoBackup: boolean;
  defaultAccount?: string;
}

export interface AppSettings {
  firstLaunch: boolean;
  currentVersion: string;
  lastBackup?: string;
  premiumFeatures: boolean;
}

export interface AlertPreferences {
  budgetAlerts: boolean;
  spendingAlerts: boolean;
  weeklyReports: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
}

// ===== TYPES POUR LES COMPOSANTS =====

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
}

export interface AccountFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (account: Omit<Account, 'id' | 'createdAt'>) => void;
  editingAccount?: Account | null;
}

// ✅ FORMULAIRE DE TRANSACTION UNIFIÉ
export interface TransactionFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (transaction: CreateTransactionData) => void;
  editingTransaction?: Transaction | null;
  initialType?: 'expense' | 'income';
  isRecurring?: boolean;
}

export interface BudgetFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (budget: Omit<Budget, 'id' | 'createdAt' | 'spent'>) => void;
  editingBudget?: Budget | null;
}

export interface CategoryFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (category: CreateCategoryData) => void;
  editingCategory?: Category | null;
  parentCategory?: Category | null;
}

// Utiliser TransactionFormProps avec isRecurring=true

export interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
}

export interface BudgetProgressProps {
  spent: number;
  budget: number;
  showLabels?: boolean;
  height?: number;
}

export interface BudgetCardProps {
  budget: Budget;
  onPress: (budget: Budget) => void;
  onLongPress: (budget: Budget) => void;
  onToggle: (id: string, isActive: boolean) => void;
}

export interface BudgetAlertProps {
  alert: Alert;
  onPress: (alert: Alert) => void;
  onDismiss: (alertId: string) => void;
}

// ✅ CARTE DE TRANSACTION UNIFIÉE
export interface TransactionCardProps {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
  onLongPress?: (transaction: Transaction) => void;
  showRecurrenceBadge?: boolean;
}

// ===== TYPES POUR LA NAVIGATION =====

export type ThemeType = 'light' | 'dark';

export type RootDrawerParamList = {
  Dashboard: undefined;
  Accounts: undefined;
  Transactions: undefined;
  AddTransaction: { initialType?: 'expense' | 'income'; isRecurring?: boolean };
  EditTransaction: { transactionId: string };
  RecurringTransactions: undefined;
  Transfer: undefined;
  Categories: undefined;
  Budgets: undefined;
  Alerts: undefined;
  Reports: undefined;
  Export: undefined;
  HealthDetail: undefined;
  MonthlyTrends: undefined;
  CategoryAnalysis: undefined;
  BudgetReports: undefined;
  Profile: undefined;
  Settings: undefined;
  Backup: undefined;
  Premium: undefined;
  AccountDetail: { accountId: string };
  AnnualCharges: undefined;
  AddAnnualCharge: undefined;
  Debts: undefined;
  AddDebt: undefined;
  EditDebt: { debtId: string };
  DebtDetail: { debtId: string };
  Savings: undefined;
  AddSavingsGoal: undefined;
  EditSavingsGoal: { goalId: string };
  SavingsDetail: { goalId: string };
  NetWorth: undefined;
  CurrencySettings: undefined;
  MonthsOverview: undefined;
  MonthDetail: { year: number; month: number };
  AnalyticsDashboard: undefined;
  IslamicCharges: undefined;
};

export type MainStackParamList = {
  Drawer: undefined;
  Auth: undefined;
  Splash: undefined;
};

// ===== TYPES POUR LES HOOKS UNIFIÉS =====

export interface UseAccountsReturn {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  totalBalance: number;
  createAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<string>;
  updateAccount: (id: string, account: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  getAccountById: (id: string) => Promise<Account | null>;
  updateAccountBalance: (id: string, newBalance: number) => Promise<void>;
  getTotalBalance: () => Promise<number>;
  getAccountsByType: (type: string) => Promise<Account[]>;
  getAccountsCount: () => Promise<number>;
  searchAccounts: (searchTerm: string) => Promise<Account[]>;
  getAccountStats: () => Promise<{
    totalAccounts: number;
    totalBalance: number;
    accountsByType: Record<string, number>;
  }>;
  refreshAccounts: () => Promise<void>;
}

// ✅ HOOK DE TRANSACTIONS UNIFIÉ
export interface UseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  lastRefresh: Date;
  
  // Actions principales
  createTransaction: (transaction: CreateTransactionData) => Promise<string>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  processRecurringTransactions: () => Promise<{ processed: number; errors: string[] }>;
  refreshTransactions: (filters?: any) => Promise<void>;
  
  // Méthodes de recherche
  getTransactionById: (id: string) => Transaction | undefined;
  getRecurringTransactions: () => Transaction[];
  getNormalTransactions: () => Transaction[];
  getTransactionsByAccount: (accountId: string) => Transaction[];
  getTransactionsByType: (type: 'income' | 'expense') => Transaction[];
  getActiveRecurringTransactions: () => Transaction[];
  
  // Statistiques
  getStats: () => {
    total: number;
    recurring: number;
    normal: number;
    income: number;
    expenses: number;
    balance: number;
  };
}

export interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  
  // Actions principales
  createCategory: (category: CreateCategoryData) => Promise<string>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Méthodes pour les sous-catégories
  getSubCategories: (parentId: string) => Category[];
  getMainCategories: (type?: 'income' | 'expense' | 'both') => Category[];
  getCategoryHierarchy: () => CategoryHierarchy[];
  getCategoryWithSubCategories: (categoryId: string) => CategoryHierarchy | null;
  
  // Utilitaires
  getCategoryById: (id: string) => Category | undefined;
  getCategoriesByType: (type: 'income' | 'expense' | 'both') => Category[];
  initializeDefaultCategories: () => Promise<void>;
  refreshCategories: () => Promise<void>;
}

export const CATEGORY_ICONS = [
  'restaurant', 'car', 'home', 'game-controller', 'medical', 'cart', 
  'school', 'airplane', 'cash', 'trending-up', 'gift', 'trophy',
  'wifi', 'phone', 'water', 'flash', 'shirt', 'cut',
  'book', 'musical-notes', 'basketball', 'film', 'wine', 'cafe',
  'bus', 'train', 'bicycle', 'bed', 'paw', 'heart',
  'briefcase', 'construct', 'leaf', 'flower', 'rocket', 'star'
];

export const CATEGORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7DC6F', '#52C41A', '#FAAD14', '#722ED1', '#13C2C2',
  '#20B2AA', '#FF9500', '#5856D6', '#FF3B30', '#32D74B', '#FFD60A',
  '#007AFF', '#5AC8FA', '#FF2D55', '#BF5AF2', '#FF6B35', '#00C7BE'
];

export interface SubCategoryStats {
  subCategoryId: string;
  subCategoryName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface CategoryWithStats {
  category: Category;
  stats: {
    totalAmount: number;
    transactionCount: number;
    subCategories: SubCategoryStats[];
  };
}


export interface UseBudgetsReturn {
  budgets: Budget[];
  loading: boolean;
  error: string | null;
  stats: BudgetStats;
  createBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'spent'>) => Promise<void>;
  updateBudget: (id: string, budget: Omit<Budget, 'id' | 'createdAt' | 'spent'>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getBudgetById: (id: string) => Promise<Budget | null>;
  getBudgetsByCategory: (category: string) => Promise<Budget[]>;
  getActiveBudgets: () => Promise<Budget[]>;
  toggleBudget: (id: string, isActive: boolean) => Promise<void>;
  updateSpentAmount: (id: string, spent: number) => Promise<void>;
  getBudgetStats: () => Promise<BudgetStats>;
  checkBudgetAlerts: () => Promise<BudgetAlert[]>;
  refreshBudgets: () => Promise<void>;
}

export interface UseAlertsReturn {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  createAlert: (alert: Omit<Alert, 'id' | 'createdAt'>) => Promise<void>;
  markAsRead: (alertId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteAlert: (alertId: string) => Promise<void>;
  deleteReadAlerts: () => Promise<void>;
  getAlertStats: () => Promise<AlertStats>;
  checkBudgetAlerts: () => Promise<Alert[]>;
  getAlertPreferences: () => Promise<AlertPreferences>;
  updateAlertPreferences: (preferences: Partial<AlertPreferences>) => Promise<void>;
  refreshAlerts: () => Promise<void>;
}

// ✅ SUPPRESSION DE UseRecurringTransactionsReturn
// Utiliser UseTransactionsReturn avec getRecurringTransactions()

export interface UseSearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  searchTransactions: (transactions: Transaction[]) => Transaction[];
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

// ===== TYPES POUR LES CONTEXTES =====

export interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  isDark: boolean;
}

export interface DatabaseContextType {
  dbInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  retryInitialization: () => void;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  hasPin: boolean;
  isLoading: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  setPin: (pin: string) => Promise<void>;
  clearPin: () => Promise<void>;
}

export interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatAmount: (amount: number, showSymbol?: boolean) => string;
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number;
}

// ===== TYPES POUR LES SERVICES =====

export interface DatabaseAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  color: string;
  created_at: string;
}

// ✅ TYPE BASE DE DONNÉES UNIFIÉ
export interface DatabaseTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  category: string;
  account_id: string;
  description: string;
  date: string;
  created_at: string;
  is_recurring: number;
  recurrence_type: string | null;
  recurrence_end_date: string | null;
  parent_transaction_id: string | null;
  next_occurrence: string | null;
  last_processed: string | null;
}

export interface DatabaseCategory {
  id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
}

export interface DatabaseBudget {
  id: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  period: string;
  start_date: string;
  end_date: string | null;
  is_active: number;
  created_at: string;
}

export interface DatabaseAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  is_read: number;
  data: string | null;
  action_url: string | null;
  created_at: string;
}

// ===== TYPES UTILITAIRES =====

export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'JPY' | 'MAD';

export type DateRange = 'today' | 'week' | 'month' | 'year' | 'custom';

export type SortOrder = 'asc' | 'desc';

export type SortField = 'date' | 'amount' | 'description' | 'category';

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy: SortField;
  sortOrder: SortOrder;
}

// ✅ FILTRES DE TRANSACTIONS UNIFIÉS
export interface TransactionFilters {
  year?: number;
  month?: number;
  accountId?: string;
  type?: 'income' | 'expense';
  category?: string;
  isRecurring?: boolean;
}

// ===== CONSTANTES =====

export const BUDGET_PERIODS = [
  { value: 'daily' as const, label: 'Quotidien' },
  { value: 'weekly' as const, label: 'Hebdomadaire' },
  { value: 'monthly' as const, label: 'Mensuel' },
  { value: 'yearly' as const, label: 'Annuel' },
];

export const TRANSACTION_TYPES = [
  { value: 'expense' as const, label: 'Dépense', color: '#FF6B6B' },
  { value: 'income' as const, label: 'Revenu', color: '#52C41A' },
  { value: 'transfer' as const, label: 'Transfert', color: '#1890FF' },
];

export const ACCOUNT_TYPES = [
  { value: 'cash' as const, label: 'Espèces', icon: 'cash' },
  { value: 'bank' as const, label: 'Banque', icon: 'business' },
  { value: 'card' as const, label: 'Carte', icon: 'card' },
  { value: 'savings' as const, label: 'Épargne', icon: 'trending-up' },
];

// ✅ FRÉQUENCES POUR TRANSACTIONS RÉCURRENTES
export const FREQUENCY_OPTIONS = [
  { value: 'daily' as const, label: 'Quotidien' },
  { value: 'weekly' as const, label: 'Hebdomadaire' },
  { value: 'monthly' as const, label: 'Mensuel' },
  { value: 'yearly' as const, label: 'Annuel' },
];

// ===== TYPES POUR LES RÉPONSES D'API =====

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SyncData {
  lastSync: string;
  changes: {
    created: any[];
    updated: any[];
    deleted: string[];
  };
}

// ===== TYPES POUR LES ALERTES DE BUDGET =====

export interface BudgetAlert {
  id: string;
  budgetId: string;
  type: 'threshold' | 'exceeded' | 'warning';
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ===== TYPES POUR LES ÉVÉNEMENTS =====

export interface AppEvent {
  type: 'transaction_created' | 'budget_updated' | 'alert_triggered' | 'recurring_transaction_processed';
  data: any;
  timestamp: string;
}

// ===== TYPES POUR LES PREFERENCES =====

export interface NotificationSettings {
  enabled: boolean;
  budgetAlerts: boolean;
  spendingAlerts: boolean;
  weeklyReports: boolean;
  sound: boolean;
  vibration: boolean;
  recurringTransactionAlerts: boolean;
}

export interface DisplaySettings {
  currency: CurrencyCode;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  language: 'fr' | 'en' | 'es';
  theme: ThemeType;
  compactMode: boolean;
}

// ===== TYPES POUR L'ANALYSE =====

export interface SpendingAnalysis {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  comparison: number;
}

export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  recurringTransactions: number;
}

// ===== TYPES POUR LES OBJECTIFS =====

export interface FinancialHealth {
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
  lastUpdated: string;
}

export interface CashFlowReport {
  period: string;
  openingBalance: number;
  closingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  recurringExpenses: number;
  categories: {
    name: string;
    amount: number;
    percentage: number;
  }[];
}

export interface BudgetPerformance {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'under' | 'over' | 'on_track';
}

// ===== TYPES POUR L'EXPORT/IMPORT =====

export interface ExportOptions {
  includeTransactions: boolean;
  includeAccounts: boolean;
  includeCategories: boolean;
  includeBudgets: boolean;
  includeAnnualCharges: boolean;
  includeDebts: boolean;
  includeSavingsGoals: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  format: 'json' | 'csv' | 'pdf';
}

export interface ImportResult {
  success: boolean;
  imported: {
    accounts: number;
    transactions: number;
    categories: number;
    budgets: number;
    annualCharges: number;
    debts: number;
    savingsGoals: number;
  };
  errors: string[];
  warnings: string[];
}

// ===== TYPES POUR LES CALCULS FINANCIERS =====

export interface BalanceCalculation {
  accountsBalance: number;
  totalDebts: number;
  monthlyCharges: number;
  totalSavings: number;
  monthlyRecurring: number;
  realBalance: number;
  availableBalance: number;
}

export interface FinancialCommitments {
  totalMonthlyCommitments: number;
  breakdown: {
    debts: number;
    recurringExpenses: number;
    savings: number;
    annualCharges: number;
  };
  commitmentRatio: number;
}

// ===== TYPES POUR LES FORMULAIRES AVANCÉS =====

export interface DebtFormData {
  name: string;
  initialAmount: string;
  interestRate: string;
  monthlyPayment: string;
  dueDate: string;
  creditor: string;
  type: 'personal' | 'mortgage' | 'credit_card' | 'loan' | 'other';
  paymentAccountId: string;
  autoPay: boolean;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
  category: 'vacation' | 'emergency' | 'house' | 'car' | 'education' | 'retirement' | 'other';
  color: string;
  icon: string;
  isCompleted: boolean;
  createdAt: string;
  savingsAccountId?: string;
  contributionAccountId?: string;
}

export interface CreateSavingsGoalData {
  name: string;
  targetAmount: number;
  targetDate: string;
  monthlyContribution: number;
  category: SavingsGoal['category'];
  color: string;
  icon: string;
  savingsAccountId?: string;
  contributionAccountId?: string;
}

export interface UpdateSavingsGoalData {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  monthlyContribution?: number;
  category?: SavingsGoal['category'];
  color?: string;
  icon?: string;
  isCompleted?: boolean;
  savingsAccountId?: string;
  contributionAccountId?: string;
}

export interface SavingsGoalFormData {
  name: string;
  targetAmount: string;
  monthlyContribution: string;
  targetDate: string;
  category: 'vacation' | 'emergency' | 'house' | 'car' | 'education' | 'retirement' | 'other';
  color: string;
  icon: string;
  savingsAccountId: string;
  contributionAccountId: string;
}

export interface AnnualChargeFormData {
  name: string;
  amount: string;
  dueDate: string;
  category: string;
  reminderDays: string;
  accountId: string;
  autoDeduct: boolean;
  notes: string;
  paymentMethod: string;
  recurrence: 'yearly' | 'monthly' | 'quarterly' | 'none';
}

// ===== TYPES POUR LES RAPPORTS DÉTAILLÉS =====

export interface NetWorthReport {
  period: string;
  assets: {
    cash: number;
    bankAccounts: number;
    investments: number;
    otherAssets: number;
  };
  liabilities: {
    debts: number;
    loans: number;
    creditCards: number;
    otherLiabilities: number;
  };
  netWorth: number;
  trend: number;
}

export interface CategorySpendingReport {
  category: string;
  budgeted: number;
  spent: number;
  percentage: number;
  trend: number;
  transactions: Transaction[];
  recurringTransactions: number;
}

// ===== TYPES POUR LES DONNÉES DE SYNCHRONISATION =====

export interface SyncConflict {
  local: any;
  remote: any;
  type: 'account' | 'transaction' | 'budget' | 'category';
  resolution?: 'local' | 'remote' | 'merge';
}

export interface BackupMetadata {
  id: string;
  timestamp: string;
  size: number;
  version: string;
  records: {
    accounts: number;
    transactions: number;
    categories: number;
    budgets: number;
    annualCharges: number;
    debts: number;
    savingsGoals: number;
    recurringTransactions: number;
  };
}

// ===== TYPES POUR LES COMPOSANTS GRAPHIQUES =====

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export interface LineChartData {
  label: string;
  value: number;
}

export interface BarChartData {
  label: string;
  values: number[];
  colors: string[];
}

// ===== TYPES POUR LES HOOKS AVANCÉS =====

export interface UseDashboardReturn {
  stats: DashboardStats;
  refreshDashboard: () => Promise<void>;
  loading: boolean;
  error: string | null;
  processAutoPayments: () => Promise<void>;
  calculateFinancialCommitments: () => Promise<FinancialCommitments>;
  accounts: Account[];
  transactions: Transaction[];
  recurringTransactions: Transaction[];
  charges: any[];
  debts: any[];
  goals: any[];
}

export interface UseAnnualChargesReturn {
  charges: any[];
  loading: boolean;
  error: string | null;
  createCharge: (chargeData: any) => Promise<string>;
  updateAnnualCharge: (chargeId: string, updates: any) => Promise<void>;
  deleteAnnualCharge: (chargeId: string) => Promise<void>;
  togglePaidStatus: (chargeId: string, isPaid: boolean) => Promise<void>;
  refreshAnnualCharges: () => Promise<void>;
  getChargeById: (chargeId: string) => Promise<any | null>;
  getChargesByCategory: () => any[];
  getStats: () => Promise<any>;
  getChargesByStatus: (status: 'all' | 'paid' | 'pending' | 'upcoming' | 'overdue') => Promise<any[]>;
  processDueCharges: () => Promise<any>;
  clearError: () => void;
}

export interface UseDebtsReturn {
  debts: any[];
  loading: boolean;
  error: string | null;
  stats: any;
  createDebt: (debtData: any) => Promise<string>;
  updateDebt: (id: string, updates: any) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  makePayment: (debtId: string, amount: number, fromAccountId?: string) => Promise<void>;
  processAutoPayments: () => Promise<{ processed: number; errors: string[] }>;
  getPaymentHistory: (debtId: string) => Promise<any[]>;
  checkOverdueDebts: () => Promise<void>;
  getExtendedStats: () => Promise<any>;
  refreshDebts: () => Promise<void>;
  clearError: () => void;
  calculateAmortizationSchedule: (debt: any) => any[];
  calculatePayoffTime: (debt: any, monthlyPayment: number) => number;
  getActiveDebts: () => any[];
  getPaidDebts: () => any[];
}

export interface UseSavingsReturn {
  goals: any[];
  loading: boolean;
  error: string | null;
  stats: any;
  createGoal: (goalData: any) => Promise<string>;
  updateGoal: (goalId: string, updates: any) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  addContribution: (goalId: string, amount: number, fromAccountId?: string) => Promise<void>;
  processAutoContributions: () => Promise<{ processed: number; errors: string[] }>;
  markGoalAsCompleted: (goalId: string) => Promise<void>;
  getGoalById: (goalId: string) => Promise<any | null>;
  getContributionHistory: (goalId: string) => Promise<any>;
  getServiceStats: () => Promise<any>;
  refreshGoals: () => Promise<void>;
  clearError: () => void;
  calculateTimeToGoal: (goal: any) => number;
  calculateProgressPercentage: (goal: any) => number;
  calculateRequiredMonthlySavings: (targetAmount: number, currentAmount: number, targetDate: string) => number;
  calculateGoalAchievementDate: (targetAmount: number, currentAmount: number, monthlyContribution: number) => string;
  getPriorityGoals: () => any[];
  checkCompletedGoals: () => any[];
  getActiveGoals: () => any[];
  getCompletedGoals: () => any[];
  getGoalsByCategory: (category: any) => any[];
  getOverdueGoals: () => any[];
  getUpcomingGoals: () => any[];
}

// ===== EXPORT DU TYPE PRINCIPAL POUR LES HOOKS =====

export type UseSavingsGoalReturn = ReturnType<typeof useSavings>;
export type UseDebtsReturnType = ReturnType<typeof useDebts>;
export type UseAnnualChargesReturnType = ReturnType<typeof useAnnualCharges>;
export type UseDashboardReturnType = ReturnType<typeof useDashboard>;
export type UseTransactionsReturnType = ReturnType<typeof useTransactions>;

// Déclarations des fonctions de hooks pour le typage
declare function useSavings(userId?: string): UseSavingsReturn;
declare function useDebts(userId?: string): UseDebtsReturn;
declare function useAnnualCharges(userId?: string): UseAnnualChargesReturn;
declare function useDashboard(userId?: string): UseDashboardReturn;
declare function useTransactions(userId?: string): UseTransactionsReturn;

// ===== TYPES POUR LES ÉTATS DE COMPOSANTS =====

export interface ComponentState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// ===== TYPES POUR LES RÉPONSES DES SERVICES =====

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: string[];
}

// ===== TYPES POUR LES VALIDATIONS =====

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FormValidation<T> {
  validate: (data: T) => ValidationResult;
  schema?: any;
}

// ✅ TYPE POUR MIGRATION
export interface MigrationResult {
  success: boolean;
  steps: {
    schema: boolean;
    data: boolean;
    cleanup: boolean;
  };
  stats: {
    transactionsMigrated: number;
    recurringTransactionsMigrated: number;
  };
  errors: string[];
}

// ✅ TYPE POUR TRAITEMENT DES RÉCURRENTES
export interface RecurringProcessingResult {
  processed: number;
  errors: string[];
  generatedTransactions: Transaction[];
}