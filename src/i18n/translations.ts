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
  saving: string;
  modifying: string;
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
  newRecurringTransaction: string;
  deleteTransaction: string;
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
  cash: string;
  bank: string;
  card: string;
  
  // Budgets
  myBudgets: string;
  createBudget: string;
  spent: string;
  remaining: string;
  
  // Catégories
  myCategories: string;
  addCategory: string;
  editCategory: string;
  deleteCategory: string;
  newCategory: string;
  newMainCategory: string;
  parentCategory: string;
  subCategory: string;
  
  // Épargne
  savingsGoals: string;
  newSavingsGoal: string;
  editSavingsGoal: string;
  deleteSavingsGoal: string;
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
  // New screens
  insights: string;
  insightOfTheDay: string;
  habitAnalysis: string;
  suggestions: string;
  financialScore: string;
  searchPlaceholder: string;
  recentSearches: string;
  startTypingToSearch: string;
  recurringTransactions: string;
  monthlyTotal: string;
  monthlySubscriptions: string;
  addSubscription: string;
  nextCharge: string;
  
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
  
  // Formulaires et champs supplémentaires
  selectAccount: string;
  selectCategory: string;
  enterAmount: string;
  enterDescription: string;
  selectDate: string;
  recurring: string;
  frequency: string;
  endDateOptional: string;
  addTransaction: string;
  editTransaction: string;
  general: string;
  notifications: string;
  about: string;
  version: string;
  help: string;
  terms: string;
  password: string;
  biometric: string;
  pinCode: string;
  pushNotifications: string;
  backupAndRestore: string;
  user: string;
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
    saving: 'Enregistrement...',
    modifying: 'Modification...',
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
    newRecurringTransaction: 'Nouvelle Transaction Récurrente',
    deleteTransaction: 'Supprimer la transaction',
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
    cash: 'Espèces',
    bank: 'Banque',
    card: 'Carte',
    
    // Budgets
    myBudgets: 'Mes Budgets',
    createBudget: 'Créer un Budget',
    spent: 'Dépensé',
    remaining: 'Restant',
    
    // Catégories
    myCategories: 'Mes Catégories',
    addCategory: 'Ajouter une Catégorie',
    editCategory: 'Modifier la catégorie',
    deleteCategory: 'Supprimer la catégorie',
    newCategory: 'Nouvelle catégorie',
    newMainCategory: 'Nouvelle catégorie principale',
    parentCategory: 'Catégorie Parente',
    subCategory: 'Sous-catégorie',
    
    // Épargne
    savingsGoals: 'Objectifs d\'Épargne',
    newSavingsGoal: 'Nouvel objectif d\'épargne',
    editSavingsGoal: 'Modifier l\'objectif',
    deleteSavingsGoal: 'Supprimer l\'objectif',
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
    // Nouveaux écrans
    insights: 'Conseils & Insights',
    insightOfTheDay: 'Conseil du jour',
    habitAnalysis: 'Analyse de vos habitudes',
    suggestions: 'Suggestions d\'économies',
    financialScore: 'Votre score financier',
    searchPlaceholder: 'Rechercher une transaction, catégorie...',
    recentSearches: 'Recherches récentes',
    startTypingToSearch: 'Commencez à taper pour rechercher',
    recurringTransactions: 'Transactions Récurrentes',
    monthlyTotal: 'Total mensuel',
    monthlySubscriptions: 'Abonnements mensuels',
    addSubscription: '+ Ajouter un abonnement',
    nextCharge: 'Prochain prélèvement :',
    
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
    
    // Formulaires et champs supplémentaires
    selectAccount: 'Sélectionner un compte',
    selectCategory: 'Sélectionner une catégorie',
    enterAmount: 'Entrer le montant',
    enterDescription: 'Entrer une description',
    selectDate: 'Sélectionner une date',
    recurring: 'Récurrent',
    frequency: 'Fréquence',
    endDateOptional: 'Date de fin (optionnelle)',
    addTransaction: 'Ajouter une transaction',
    editTransaction: 'Modifier la transaction',
    general: 'Général',
    notifications: 'Notifications',
    about: 'À propos',
    version: 'Version',
    help: 'Aide',
    terms: 'Conditions',
    password: 'Mot de passe',
    biometric: 'Biométrie',
    pinCode: 'Code PIN',
    pushNotifications: 'Notifications push',
    backupAndRestore: 'Sauvegarde et restauration',
    user: 'Utilisateur',
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
    saving: 'Saving...',
    modifying: 'Modifying...',
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
    newRecurringTransaction: 'New Recurring Transaction',
    deleteTransaction: 'Delete transaction',
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
    cash: 'Cash',
    bank: 'Bank',
    card: 'Card',
    
    // Budgets
    myBudgets: 'My Budgets',
    createBudget: 'Create Budget',
    spent: 'Spent',
    remaining: 'Remaining',
    
    // Categories
    myCategories: 'My Categories',
    addCategory: 'Add Category',
    editCategory: 'Edit category',
    deleteCategory: 'Delete category',
    newCategory: 'New category',
    newMainCategory: 'New main category',
    parentCategory: 'Parent Category',
    subCategory: 'Sub-category',
    
    // Savings
    savingsGoals: 'Savings Goals',
    newSavingsGoal: 'New savings goal',
    editSavingsGoal: 'Edit goal',
    deleteSavingsGoal: 'Delete goal',
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
    // New screens
    insights: 'Insights & Tips',
    insightOfTheDay: 'Tip of the day',
    habitAnalysis: 'Analysis of your habits',
    suggestions: 'Savings suggestions',
    financialScore: 'Your financial score',
    searchPlaceholder: 'Search a transaction, category...',
    recentSearches: 'Recent searches',
    startTypingToSearch: 'Start typing to search',
    recurringTransactions: 'Recurring Transactions',
    monthlyTotal: 'Monthly total',
    monthlySubscriptions: 'Monthly subscriptions',
    addSubscription: '+ Add a subscription',
    nextCharge: 'Next charge:',
    
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
    
    // Additional form fields
    selectAccount: 'Select an account',
    selectCategory: 'Select a category',
    enterAmount: 'Enter amount',
    enterDescription: 'Enter description',
    selectDate: 'Select date',
    recurring: 'Recurring',
    frequency: 'Frequency',
    endDateOptional: 'End date (optional)',
    addTransaction: 'Add transaction',
    editTransaction: 'Edit transaction',
    general: 'General',
    notifications: 'Notifications',
    about: 'About',
    version: 'Version',
    help: 'Help',
    terms: 'Terms',
    password: 'Password',
    biometric: 'Biometric',
    pinCode: 'PIN Code',
    pushNotifications: 'Push notifications',
    backupAndRestore: 'Backup and restore',
    user: 'User',
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
    
    // الإجراءات الشائعة
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    saving: 'جاري الحفظ...',
    modifying: 'جاري التعديل...',
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
    newRecurringTransaction: 'معاملة متكررة جديدة',
    deleteTransaction: 'حذف المعاملة',
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
    cash: 'نقدي',
    bank: 'بنك',
    card: 'بطاقة',
    
    // الميزانيات
    myBudgets: 'ميزانياتي',
    createBudget: 'إنشاء ميزانية',
    spent: 'المنفق',
    remaining: 'المتبقي',
    
    // الفئات
    myCategories: 'فئاتي',
    addCategory: 'إضافة فئة',
    editCategory: 'تعديل الفئة',
    deleteCategory: 'حذف الفئة',
    newCategory: 'فئة جديدة',
    newMainCategory: 'فئة رئيسية جديدة',
    parentCategory: 'الفئة الرئيسية',
    subCategory: 'الفئة الفرعية',
    
    // المدخرات
    savingsGoals: 'أهداف الادخار',
    newSavingsGoal: 'هدف ادخار جديد',
    editSavingsGoal: 'تعديل الهدف',
    deleteSavingsGoal: 'حذف الهدف',
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
      // شاشات جديدة
      insights: 'نصائح و إحصاءات',
      insightOfTheDay: 'نصيحة اليوم',
      habitAnalysis: 'تحليل عاداتك',
      suggestions: 'اقتراحات التوفير',
      financialScore: 'درجتك المالية',
      searchPlaceholder: 'ابحث عن معاملة، فئة...',
      recentSearches: 'عمليات البحث الأخيرة',
      startTypingToSearch: 'ابدأ الكتابة للبحث',
      recurringTransactions: 'المعاملات المتكررة',
      monthlyTotal: 'إجمالي الشهري',
      monthlySubscriptions: 'اشتراكات شهرية',
      addSubscription: '+ إضافة اشتراك',
      nextCharge: 'الخصم التالي :',
    
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
    
    // حقول نموذج إضافية
    selectAccount: 'اختر حساب',
    selectCategory: 'اختر فئة',
    enterAmount: 'أدخل المبلغ',
    enterDescription: 'أدخل وصف',
    selectDate: 'اختر تاريخ',
    recurring: 'متكرر',
    frequency: 'التكرار',
    endDateOptional: 'تاريخ الانتهاء (اختياري)',
    addTransaction: 'إضافة معاملة',
    editTransaction: 'تعديل المعاملة',
    general: 'عام',
    notifications: 'الإشعارات',
    about: 'حول',
    version: 'الإصدار',
    help: 'مساعدة',
    terms: 'الشروط',
    password: 'كلمة المرور',
    biometric: 'القياسات الحيوية',
    pinCode: 'رمز PIN',
    pushNotifications: 'إشعارات فورية',
    backupAndRestore: 'نسخ واستعادة',
    user: 'مستخدم',
  },
};
