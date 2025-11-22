// src/i18n/translations.ts
export interface Translations {
  // Navigation
  dashboard: string;
  transactions: string;
  accounts: string;
  budgets: string;
  categories: string;
  savings: string;
  debts: string;
  reports: string;
  settings: string;
  profile: string;
  
  // Actions communes
  add: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  confirm: string;
  search: string;
  filter: string;
  export: string;
  import: string;
  refresh: string;
  
  // Dashboard
  totalBalance: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  recentTransactions: string;
  viewAll: string;
  
  // Transactions
  newTransaction: string;
  income: string;
  expense: string;
  transfer: string;
  amount: string;
  description: string;
  date: string;
  category: string;
  account: string;
  all: string;
  incomes: string;
  expenses: string;
  
  // Comptes
  myAccounts: string;
  addAccount: string;
  accountName: string;
  balance: string;
  
  // Budgets
  myBudgets: string;
  createBudget: string;
  spent: string;
  remaining: string;
  
  // Catégories
  myCategories: string;
  addCategory: string;
  parentCategory: string;
  subCategory: string;
  
  // Épargne
  savingsGoals: string;
  goalName: string;
  targetAmount: string;
  currentAmount: string;
  progress: string;
  
  // Dettes
  myDebts: string;
  debtName: string;
  totalDebt: string;
  remainingDebt: string;
  monthlyPayment: string;
  
  // Paramètres
  generalSettings: string;
  language: string;
  theme: string;
  currency: string;
  security: string;
  backup: string;
  
  // Messages
  success: string;
  error: string;
  loading: string;
  noData: string;
  confirmDelete: string;
  
  // Calendrier
  calendar: string;
  expenseCalendar: string;
  monthView: string;
  annualCharges: string;
  calendarExpenses: string;
  
  // Dashboard supplémentaire
  noDataThisMonth: string;
  netWorth: string;
  recentActivity: string;
  quickActions: string;
  alerts: string;
  currencies: string;
  islamicCharges: string;
  categoryAnalysis: string;
  
  // Traductions supplémentaires
  welcome: string;
  financialHealth: string;
  score: string;
  assets: string;
  liabilities: string;
  revenue: string;
  debt: string;
  annualCharge: string;
  deficit: string;
  
  // Boutons et actions supplémentaires
  back: string;
  next: string;
  done: string;
  close: string;
  select: string;
  selectAll: string;
  reset: string;
  apply: string;
  details: string;
  
  // Titres d'écrans
  allTransactions: string;
  myBudget: string;
  myGoals: string;
  notification: string;
  
  // Messages et états
  emptyState: string;
  noTransactions: string;
  noBudgets: string;
  noCategories: string;
  noGoals: string;
  noDebts: string;
  
  // Formulaires
  name: string;
  type: string;
  color: string;
  icon: string;
  notes: string;
  dueDate: string;
  startDate: string;
  endDate: string;
  
  // Statistiques
  total: string;
  today: string;
  thisWeek: string;
  thisMonth: string;
  thisYear: string;
  custom: string;
  
  // Temps
  daily: string;
  weekly: string;
  monthly: string;
  yearly: string;
  
  // Statuts
  active: string;
  inactive: string;
  completed: string;
  pending: string;
  paid: string;
  unpaid: string;
  
  // Mois
  january: string;
  february: string;
  march: string;
  april: string;
  may: string;
  june: string;
  july: string;
  august: string;
  september: string;
  october: string;
  november: string;
  december: string;
}

export const translations: Record<'fr' | 'en' | 'ar', Translations> = {
  fr: {
    // Navigation
    dashboard: 'Tableau de Bord',
    transactions: 'Transactions',
    accounts: 'Comptes',
    budgets: 'Budgets',
    categories: 'Catégories',
    savings: 'Épargne',
    debts: 'Dettes',
    reports: 'Rapports',
    settings: 'Paramètres',
    profile: 'Profil',
    
    // Actions communes
    add: 'Ajouter',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    search: 'Rechercher',
    filter: 'Filtrer',
    export: 'Exporter',
    import: 'Importer',
    refresh: 'Actualiser',
    
    // Dashboard
    totalBalance: 'Solde Total',
    monthlyIncome: 'Revenus du Mois',
    monthlyExpenses: 'Dépenses du Mois',
    recentTransactions: 'Transactions Récentes',
    viewAll: 'Voir Tout',
    
    // Transactions
    newTransaction: 'Nouvelle Transaction',
    income: 'Revenu',
    expense: 'Dépense',
    transfer: 'Transfert',
    amount: 'Montant',
    description: 'Description',
    date: 'Date',
    category: 'Catégorie',
    account: 'Compte',
    all: 'Toutes',
    incomes: 'Revenus',
    expenses: 'Dépenses',
    
    // Comptes
    myAccounts: 'Mes Comptes',
    addAccount: 'Ajouter un Compte',
    accountName: 'Nom du Compte',
    balance: 'Solde',
    
    // Budgets
    myBudgets: 'Mes Budgets',
    createBudget: 'Créer un Budget',
    spent: 'Dépensé',
    remaining: 'Restant',
    
    // Catégories
    myCategories: 'Mes Catégories',
    addCategory: 'Ajouter une Catégorie',
    parentCategory: 'Catégorie Parente',
    subCategory: 'Sous-catégorie',
    
    // Épargne
    savingsGoals: 'Objectifs d\'Épargne',
    goalName: 'Nom de l\'Objectif',
    targetAmount: 'Montant Cible',
    currentAmount: 'Montant Actuel',
    progress: 'Progression',
    
    // Dettes
    myDebts: 'Mes Dettes',
    debtName: 'Nom de la Dette',
    totalDebt: 'Dette Totale',
    remainingDebt: 'Reste à Payer',
    monthlyPayment: 'Paiement Mensuel',
    
    // Paramètres
    generalSettings: 'Paramètres Généraux',
    language: 'Langue',
    theme: 'Thème',
    currency: 'Devise',
    security: 'Sécurité',
    backup: 'Sauvegarde',
    
    // Messages
    success: 'Succès',
    error: 'Erreur',
    loading: 'Chargement...',
    noData: 'Aucune donnée',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer ?',
    
    // Calendrier
    calendar: 'Calendrier',
    expenseCalendar: 'Calendrier des Dépenses',
    monthView: 'Vue par Mois',
    annualCharges: 'Charges Annuelles',
    calendarExpenses: 'Calendrier Dépenses',
    
    // Dashboard supplémentaire
    noDataThisMonth: 'Aucune donnée ce mois',
    netWorth: 'Patrimoine Net',
    recentActivity: 'Activité Récente',
    quickActions: 'Actions Rapides',
    alerts: 'Alertes',
    currencies: 'Devises',
    islamicCharges: 'Charges Islamiques',
    categoryAnalysis: 'Analyse par Catégorie',
    
    // Traductions supplémentaires
    welcome: 'Bienvenue',
    financialHealth: 'Santé Financière',
    score: 'Score',
    assets: 'Actifs',
    liabilities: 'Passifs',
    revenue: 'Revenus',
    debt: 'Dette',
    annualCharge: 'Charge Annuelle',
    deficit: 'Déficit',
    
    // Boutons et actions supplémentaires
    back: 'Retour',
    next: 'Suivant',
    done: 'Terminé',
    close: 'Fermer',
    select: 'Sélectionner',
    selectAll: 'Tout sélectionner',
    reset: 'Réinitialiser',
    apply: 'Appliquer',
    details: 'Détails',
    
    // Titres d'écrans
    allTransactions: 'Toutes les Transactions',
    myBudget: 'Mon Budget',
    myGoals: 'Mes Objectifs',
    notification: 'Notifications',
    
    // Messages et états
    emptyState: 'Aucun élément',
    noTransactions: 'Aucune transaction',
    noBudgets: 'Aucun budget',
    noCategories: 'Aucune catégorie',
    noGoals: 'Aucun objectif',
    noDebts: 'Aucune dette',
    
    // Formulaires
    name: 'Nom',
    type: 'Type',
    color: 'Couleur',
    icon: 'Icône',
    notes: 'Notes',
    dueDate: 'Date d\'échéance',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    
    // Statistiques
    total: 'Total',
    today: 'Aujourd\'hui',
    thisWeek: 'Cette semaine',
    thisMonth: 'Ce mois',
    thisYear: 'Cette année',
    custom: 'Personnalisé',
    
    // Temps
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    yearly: 'Annuel',
    
    // Statuts
    active: 'Actif',
    inactive: 'Inactif',
    completed: 'Complété',
    pending: 'En attente',
    paid: 'Payé',
    unpaid: 'Non payé',
    
    // Mois
    january: 'Janvier',
    february: 'Février',
    march: 'Mars',
    april: 'Avril',
    may: 'Mai',
    june: 'Juin',
    july: 'Juillet',
    august: 'Août',
    september: 'Septembre',
    october: 'Octobre',
    november: 'Novembre',
    december: 'Décembre',
  },
  
  en: {
    // Navigation
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    accounts: 'Accounts',
    budgets: 'Budgets',
    categories: 'Categories',
    savings: 'Savings',
    debts: 'Debts',
    reports: 'Reports',
    settings: 'Settings',
    profile: 'Profile',
    
    // Common actions
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    refresh: 'Refresh',
    
    // Dashboard
    totalBalance: 'Total Balance',
    monthlyIncome: 'Monthly Income',
    monthlyExpenses: 'Monthly Expenses',
    recentTransactions: 'Recent Transactions',
    viewAll: 'View All',
    
    // Transactions
    newTransaction: 'New Transaction',
    income: 'Income',
    expense: 'Expense',
    transfer: 'Transfer',
    amount: 'Amount',
    description: 'Description',
    date: 'Date',
    category: 'Category',
    account: 'Account',
    all: 'All',
    incomes: 'Incomes',
    expenses: 'Expenses',
    
    // Accounts
    myAccounts: 'My Accounts',
    addAccount: 'Add Account',
    accountName: 'Account Name',
    balance: 'Balance',
    
    // Budgets
    myBudgets: 'My Budgets',
    createBudget: 'Create Budget',
    spent: 'Spent',
    remaining: 'Remaining',
    
    // Categories
    myCategories: 'My Categories',
    addCategory: 'Add Category',
    parentCategory: 'Parent Category',
    subCategory: 'Sub-category',
    
    // Savings
    savingsGoals: 'Savings Goals',
    goalName: 'Goal Name',
    targetAmount: 'Target Amount',
    currentAmount: 'Current Amount',
    progress: 'Progress',
    
    // Debts
    myDebts: 'My Debts',
    debtName: 'Debt Name',
    totalDebt: 'Total Debt',
    remainingDebt: 'Remaining Debt',
    monthlyPayment: 'Monthly Payment',
    
    // Settings
    generalSettings: 'General Settings',
    language: 'Language',
    theme: 'Theme',
    currency: 'Currency',
    security: 'Security',
    backup: 'Backup',
    
    // Messages
    success: 'Success',
    error: 'Error',
    loading: 'Loading...',
    noData: 'No data',
    confirmDelete: 'Are you sure you want to delete?',
    
    // Calendar
    calendar: 'Calendar',
    expenseCalendar: 'Expense Calendar',
    monthView: 'Month View',
    annualCharges: 'Annual Charges',
    calendarExpenses: 'Expense Calendar',
    
    // Additional Dashboard
    noDataThisMonth: 'No data this month',
    netWorth: 'Net Worth',
    recentActivity: 'Recent Activity',
    quickActions: 'Quick Actions',
    alerts: 'Alerts',
    currencies: 'Currencies',
    islamicCharges: 'Islamic Charges',
    categoryAnalysis: 'Category Analysis',
    
    // Additional translations
    welcome: 'Welcome',
    financialHealth: 'Financial Health',
    score: 'Score',
    assets: 'Assets',
    liabilities: 'Liabilities',
    revenue: 'Revenue',
    debt: 'Debt',
    annualCharge: 'Annual Charge',
    deficit: 'Deficit',
    
    // Additional buttons and actions
    back: 'Back',
    next: 'Next',
    done: 'Done',
    close: 'Close',
    select: 'Select',
    selectAll: 'Select All',
    reset: 'Reset',
    apply: 'Apply',
    details: 'Details',
    
    // Screen titles
    allTransactions: 'All Transactions',
    myBudget: 'My Budget',
    myGoals: 'My Goals',
    notification: 'Notifications',
    
    // Messages and states
    emptyState: 'No items',
    noTransactions: 'No transactions',
    noBudgets: 'No budgets',
    noCategories: 'No categories',
    noGoals: 'No goals',
    noDebts: 'No debts',
    
    // Forms
    name: 'Name',
    type: 'Type',
    color: 'Color',
    icon: 'Icon',
    notes: 'Notes',
    dueDate: 'Due Date',
    startDate: 'Start Date',
    endDate: 'End Date',
    
    // Statistics
    total: 'Total',
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    thisYear: 'This Year',
    custom: 'Custom',
    
    // Time periods
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    
    // Status
    active: 'Active',
    inactive: 'Inactive',
    completed: 'Completed',
    pending: 'Pending',
    paid: 'Paid',
    unpaid: 'Unpaid',
    
    // Months
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December',
  },
  
  ar: {
    // التنقل
    dashboard: 'لوحة التحكم',
    transactions: 'المعاملات',
    accounts: 'الحسابات',
    budgets: 'الميزانيات',
    categories: 'الفئات',
    savings: 'المدخرات',
    debts: 'الديون',
    reports: 'التقارير',
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    
    // إجراءات شائعة
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    search: 'بحث',
    filter: 'تصفية',
    export: 'تصدير',
    import: 'استيراد',
    refresh: 'تحديث',
    
    // لوحة التحكم
    totalBalance: 'الرصيد الإجمالي',
    monthlyIncome: 'الدخل الشهري',
    monthlyExpenses: 'المصروفات الشهرية',
    recentTransactions: 'المعاملات الأخيرة',
    viewAll: 'عرض الكل',
    
    // المعاملات
    newTransaction: 'معاملة جديدة',
    income: 'دخل',
    expense: 'مصروف',
    transfer: 'تحويل',
    amount: 'المبلغ',
    description: 'الوصف',
    date: 'التاريخ',
    category: 'الفئة',
    account: 'الحساب',
    all: 'الكل',
    incomes: 'الإيرادات',
    expenses: 'المصروفات',
    
    // الحسابات
    myAccounts: 'حساباتي',
    addAccount: 'إضافة حساب',
    accountName: 'اسم الحساب',
    balance: 'الرصيد',
    
    // الميزانيات
    myBudgets: 'ميزانياتي',
    createBudget: 'إنشاء ميزانية',
    spent: 'المنفق',
    remaining: 'المتبقي',
    
    // الفئات
    myCategories: 'فئاتي',
    addCategory: 'إضافة فئة',
    parentCategory: 'الفئة الرئيسية',
    subCategory: 'الفئة الفرعية',
    
    // المدخرات
    savingsGoals: 'أهداف الادخار',
    goalName: 'اسم الهدف',
    targetAmount: 'المبلغ المستهدف',
    currentAmount: 'المبلغ الحالي',
    progress: 'التقدم',
    
    // الديون
    myDebts: 'ديوني',
    debtName: 'اسم الدين',
    totalDebt: 'إجمالي الدين',
    remainingDebt: 'المتبقي للسداد',
    monthlyPayment: 'الدفعة الشهرية',
    
    // الإعدادات
    generalSettings: 'الإعدادات العامة',
    language: 'اللغة',
    theme: 'المظهر',
    currency: 'العملة',
    security: 'الأمان',
    backup: 'النسخ الاحتياطي',
    
    // الرسائل
    success: 'نجح',
    error: 'خطأ',
    loading: 'جاري التحميل...',
    noData: 'لا توجد بيانات',
    confirmDelete: 'هل أنت متأكد من الحذف؟',
    
    // التقويم
    calendar: 'التقويم',
    expenseCalendar: 'تقويم المصروفات',
    monthView: 'عرض شهري',
    annualCharges: 'الرسوم السنوية',
    calendarExpenses: 'تقويم النفقات',
    
    // لوحة التحكم إضافي
    noDataThisMonth: 'لا توجد بيانات هذا الشهر',
    netWorth: 'صافي الثروة',
    recentActivity: 'النشاط الأخير',
    quickActions: 'إجراءات سريعة',
    alerts: 'التنبيهات',
    currencies: 'العملات',
    islamicCharges: 'الرسوم الإسلامية',
    categoryAnalysis: 'تحليل الفئات',
    
    // ترجمات إضافية
    welcome: 'مرحباً',
    financialHealth: 'الصحة المالية',
    score: 'النقاط',
    assets: 'الأصول',
    liabilities: 'الخصوم',
    revenue: 'الإيرادات',
    debt: 'الديون',
    annualCharge: 'رسوم سنوية',
    deficit: 'عجز',
    
    // أزرار وإجراءات إضافية
    back: 'رجوع',
    next: 'التالي',
    done: 'تم',
    close: 'إغلاق',
    select: 'اختيار',
    selectAll: 'تحديد الكل',
    reset: 'إعادة تعيين',
    apply: 'تطبيق',
    details: 'التفاصيل',
    
    // عناوين الشاشات
    allTransactions: 'جميع المعاملات',
    myBudget: 'ميزانيتي',
    myGoals: 'أهدافي',
    notification: 'الإشعارات',
    
    // رسائل وحالات
    emptyState: 'لا توجد عناصر',
    noTransactions: 'لا توجد معاملات',
    noBudgets: 'لا توجد ميزانيات',
    noCategories: 'لا توجد فئات',
    noGoals: 'لا توجد أهداف',
    noDebts: 'لا توجد ديون',
    
    // النماذج
    name: 'الاسم',
    type: 'النوع',
    color: 'اللون',
    icon: 'الأيقونة',
    notes: 'ملاحظات',
    dueDate: 'تاريخ الاستحقاق',
    startDate: 'تاريخ البدء',
    endDate: 'تاريخ الانتهاء',
    
    // الإحصائيات
    total: 'الإجمالي',
    today: 'اليوم',
    thisWeek: 'هذا الأسبوع',
    thisMonth: 'هذا الشهر',
    thisYear: 'هذه السنة',
    custom: 'مخصص',
    
    // الفترات الزمنية
    daily: 'يومي',
    weekly: 'أسبوعي',
    monthly: 'شهري',
    yearly: 'سنوي',
    
    // الحالة
    active: 'نشط',
    inactive: 'غير نشط',
    completed: 'مكتمل',
    pending: 'قيد الانتظار',
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
    
    // الأشهر
    january: 'يناير',
    february: 'فبراير',
    march: 'مارس',
    april: 'أبريل',
    may: 'مايو',
    june: 'يونيو',
    july: 'يوليو',
    august: 'أغسطس',
    september: 'سبتمبر',
    october: 'أكتوبر',
    november: 'نوفمبر',
    december: 'ديسمبر',
  },
};
