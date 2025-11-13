// src/services/transactionService.ts - VERSION SANS CYCLE
import { Transaction } from '../types';
import { generateId } from '../utils/numberUtils';
import { getDatabase } from './database/sqlite';

export interface TransactionFilters {
  year?: number;
  month?: number;
  accountId?: string;
  type?: 'income' | 'expense';
  category?: string;
}

export interface MonthlyStats {
  income: number;
  expenses: number;
  transactions: Transaction[];
  transactionsCount: number;
}

export interface BalanceVerification {
  accountId: string;
  accountName: string;
  calculatedBalance: number;
  actualBalance: number;
  difference: number;
}

export interface CategoryStats {
  category: string;
  total: number;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
}

// ✅ FONCTIONS UTILITAIRES SÉPARÉES
const updateAccountBalanceFromTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<void> => {
  const db = await getDatabase();
  
  const account = await db.getFirstAsync<any>(
    'SELECT * FROM accounts WHERE id = ?',
    [transaction.accountId]
  );
  
  if (!account) {
    throw new Error(`Compte non trouvé: ${transaction.accountId}`);
  }

  let newBalance = account.balance;
  
  if (transaction.type === 'income') {
    newBalance = account.balance + Math.abs(transaction.amount);
  } else if (transaction.type === 'expense') {
    newBalance = account.balance - Math.abs(transaction.amount);
  }
  
  await db.runAsync(
    'UPDATE accounts SET balance = ? WHERE id = ?',
    [newBalance, transaction.accountId]
  );
  
  console.log('💰 [transactionService] Solde mis à jour:', {
    type: transaction.type,
    compte: transaction.accountId,
    ancienSolde: account.balance,
    nouveauSolde: newBalance,
    montant: transaction.amount
  });
};

const revertTransactionEffect = async (transaction: Transaction): Promise<void> => {
  const db = await getDatabase();
  
  const account = await db.getFirstAsync<any>(
    'SELECT * FROM accounts WHERE id = ?',
    [transaction.accountId]
  );
  
  if (account) {
    let newBalance = account.balance;
    
    if (transaction.type === 'income') {
      newBalance = account.balance - Math.abs(transaction.amount);
    } else if (transaction.type === 'expense') {
      newBalance = account.balance + Math.abs(transaction.amount);
    }
    
    await db.runAsync(
      'UPDATE accounts SET balance = ? WHERE id = ?',
      [newBalance, transaction.accountId]
    );
  }
};

const applyTransactionEffect = async (transaction: Transaction): Promise<void> => {
  const db = await getDatabase();
  
  const account = await db.getFirstAsync<any>(
    'SELECT * FROM accounts WHERE id = ?',
    [transaction.accountId]
  );
  
  if (account) {
    let newBalance = account.balance;
    
    if (transaction.type === 'income') {
      newBalance = account.balance + Math.abs(transaction.amount);
    } else if (transaction.type === 'expense') {
      newBalance = account.balance - Math.abs(transaction.amount);
    }
    
    await db.runAsync(
      'UPDATE accounts SET balance = ? WHERE id = ?',
      [newBalance, transaction.accountId]
    );
  }
};

const validateTransactionData = (transaction: Omit<Transaction, 'id' | 'createdAt'>): boolean => {
  if (typeof transaction.amount !== 'number' || isNaN(transaction.amount)) {
    throw new Error('Montant invalide');
  }
  
  if (!['income', 'expense'].includes(transaction.type)) {
    throw new Error('Type de transaction invalide');
  }
  
  if (!transaction.accountId) {
    throw new Error('Compte requis');
  }
  
  if (!transaction.date || isNaN(new Date(transaction.date).getTime())) {
    throw new Error('Date invalide');
  }
  
  return true;
};

// ✅ FONCTION POUR METTRE À JOUR LES BUDGETS APRÈS UNE DÉPENSE (import dynamique)
const updateBudgetsAfterExpense = async (userId: string = 'default-user'): Promise<void> => {
  try {
    // Import dynamique pour éviter le cycle
    const { budgetService } = await import('./budgetService');
    await budgetService.updateBudgetSpentFromTransactions(userId);
    console.log('💰 [transactionService] Budgets mis à jour après transaction de dépense');
  } catch (budgetError) {
    console.warn('⚠️ [transactionService] Erreur mise à jour budgets:', budgetError);
    // Ne pas bloquer la création de transaction si erreur budgets
  }
};

export const transactionService = {
  // ✅ CRÉATION AVEC LOGIQUE COHÉRENTE
  async createTransaction(
    transactionData: Omit<Transaction, 'id' | 'createdAt'>, 
    userId: string = 'default-user'
  ): Promise<string> {
    try {
      console.log('🔄 [transactionService] Création transaction...', {
        type: transactionData.type,
        montant: transactionData.amount,
        compte: transactionData.accountId,
        catégorie: transactionData.category
      });
      
      // Validation des données
      validateTransactionData(transactionData);
      
      const db = await getDatabase();
      const transactionId = generateId();
      const createdAt = new Date().toISOString();
      
      // ✅ 1. CRÉER LA TRANSACTION
      await db.runAsync(
        `INSERT INTO transactions (id, user_id, amount, type, category, account_id, description, date, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId,
          userId,
          transactionData.amount,
          transactionData.type,
          transactionData.category,
          transactionData.accountId,
          transactionData.description || '',
          transactionData.date,
          createdAt
        ]
      );

      // ✅ 2. METTRE À JOUR LE SOLDE DU COMPTE
      await updateAccountBalanceFromTransaction(transactionData);

      // ✅ 3. METTRE À JOUR LES BUDGETS SI C'EST UNE DÉPENSE
      if (transactionData.type === 'expense') {
        await updateBudgetsAfterExpense(userId);
      }

      console.log('✅ [transactionService] Transaction créée et solde mis à jour:', transactionId);
      return transactionId;
    } catch (error) {
      console.error('❌ [transactionService] Erreur création transaction:', error);
      throw error;
    }
  },

  // ✅ MISE À JOUR AVEC GESTION COHÉRENTE DES SOLDES
  async updateTransaction(
    id: string, 
    updates: Partial<Transaction>, 
    userId: string = 'default-user'
  ): Promise<void> {
    try {
      console.log('🔄 [transactionService] Mise à jour transaction:', id);
      
      const db = await getDatabase();
      
      // Récupérer l'ancienne transaction
      const oldTransaction = await this.getTransactionById(id, userId);
      if (!oldTransaction) {
        throw new Error('Transaction non trouvée');
      }

      // Annuler l'effet de l'ancienne transaction
      if (oldTransaction.accountId) {
        await revertTransactionEffect(oldTransaction);
      }

      // Mettre à jour la transaction
      const setParts: string[] = [];
      const values: any[] = [];

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          const sqlKey = key === 'accountId' ? 'account_id' : 
                        key === 'createdAt' ? 'created_at' : key;
          setParts.push(`${sqlKey} = ?`);
          values.push(value);
        }
      });

      if (setParts.length > 0) {
        values.push(id, userId);
        
        await db.runAsync(
          `UPDATE transactions SET ${setParts.join(', ')} WHERE id = ? AND user_id = ?`,
          values
        );
      }

      // Appliquer la nouvelle transaction
      const updatedTransaction = { ...oldTransaction, ...updates };
      if (updatedTransaction.accountId) {
        await applyTransactionEffect(updatedTransaction);
      }

      // Mettre à jour les budgets si c'est une dépense
      if (updatedTransaction.type === 'expense') {
        await updateBudgetsAfterExpense(userId);
      }

      console.log('✅ [transactionService] Transaction mise à jour avec succès');
    } catch (error) {
      console.error('❌ [transactionService] Erreur mise à jour transaction:', error);
      throw error;
    }
  },

  // ✅ SUPPRESSION AVEC GESTION COHÉRENTE DES SOLDES
  async deleteTransaction(id: string, userId: string = 'default-user'): Promise<void> {
    try {
      console.log('🗑️ [transactionService] Suppression transaction:', id);
      
      const db = await getDatabase();
      
      // Récupérer la transaction avant suppression
      const transaction = await this.getTransactionById(id, userId);
      if (!transaction) {
        throw new Error('Transaction non trouvée');
      }

      // Annuler l'effet de la transaction
      if (transaction.accountId) {
        await revertTransactionEffect(transaction);
      }

      // Supprimer la transaction
      await db.runAsync(
        'DELETE FROM transactions WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      // Mettre à jour les budgets si c'était une dépense
      if (transaction.type === 'expense') {
        await updateBudgetsAfterExpense(userId);
      }

      console.log('✅ [transactionService] Transaction supprimée avec succès');
    } catch (error) {
      console.error('❌ [transactionService] Erreur suppression transaction:', error);
      throw error;
    }
  },

  // ✅ MÉTHODES DE RÉCUPÉRATION
  async getAllTransactions(userId: string = 'default-user'): Promise<Transaction[]> {
    try {
      const db = await getDatabase();
      const transactions = await db.getAllAsync<any>(
        `SELECT 
          id, 
          amount, 
          type, 
          category, 
          account_id as accountId,
          description, 
          date, 
          created_at as createdAt,
          user_id as userId
         FROM transactions 
         WHERE user_id = ? 
         ORDER BY date DESC, created_at DESC`,
        [userId]
      );
      return transactions || [];
    } catch (error) {
      console.error('❌ [transactionService] Erreur récupération transactions:', error);
      return [];
    }
  },

  async getFilteredTransactions(
    filters: TransactionFilters, 
    userId: string = 'default-user'
  ): Promise<Transaction[]> {
    try {
      const db = await getDatabase();
      let query = `SELECT 
          id, 
          amount, 
          type, 
          category, 
          account_id as accountId,
          description, 
          date, 
          created_at as createdAt,
          user_id as userId
         FROM transactions 
         WHERE user_id = ?`;
      
      const params: any[] = [userId];
      
      // Appliquer les filtres
      if (filters.year && filters.month) {
        query += ` AND strftime('%Y', date) = ? AND strftime('%m', date) = ?`;
        params.push(filters.year.toString(), filters.month.toString().padStart(2, '0'));
      }
      
      if (filters.accountId) {
        query += ` AND account_id = ?`;
        params.push(filters.accountId);
      }
      
      if (filters.type) {
        query += ` AND type = ?`;
        params.push(filters.type);
      }
      
      if (filters.category) {
        query += ` AND category = ?`;
        params.push(filters.category);
      }
      
      query += ` ORDER BY date DESC, created_at DESC`;
      
      const transactions = await db.getAllAsync<any>(query, params);
      return transactions || [];
    } catch (error) {
      console.error('❌ [transactionService] Erreur récupération transactions filtrées:', error);
      return [];
    }
  },

  async getTransactionById(id: string, userId: string = 'default-user'): Promise<Transaction | null> {
    try {
      const db = await getDatabase();
      const transaction = await db.getFirstAsync<any>(
        `SELECT 
          id, 
          amount, 
          type, 
          category, 
          account_id as accountId,
          description, 
          date, 
          created_at as createdAt
         FROM transactions 
         WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      return transaction;
    } catch (error) {
      console.error('❌ [transactionService] Erreur récupération transaction par ID:', error);
      return null;
    }
  },

  async getTransactionsByDateRange(
    startDate: string, 
    endDate: string, 
    userId: string = 'default-user'
  ): Promise<Transaction[]> {
    try {
      const db = await getDatabase();
      const transactions = await db.getAllAsync<any>(
        `SELECT 
          id, 
          amount, 
          type, 
          category, 
          account_id as accountId,
          description, 
          date, 
          created_at as createdAt
         FROM transactions 
         WHERE user_id = ? AND date BETWEEN ? AND ? 
         ORDER BY date DESC`,
        [userId, startDate, endDate]
      );
      return transactions || [];
    } catch (error) {
      console.error('❌ [transactionService] Erreur récupération transactions par date:', error);
      return [];
    }
  },

  async getTransactionsByCategory(categoryId: string, userId: string = 'default-user'): Promise<Transaction[]> {
    try {
      const db = await getDatabase();
      const transactions = await db.getAllAsync<any>(
        `SELECT 
          id, 
          amount, 
          type, 
          category, 
          account_id as accountId,
          description, 
          date, 
          created_at as createdAt
         FROM transactions 
         WHERE user_id = ? AND category = ? 
         ORDER BY date DESC`,
        [userId, categoryId]
      );
      return transactions || [];
    } catch (error) {
      console.error('❌ [transactionService] Erreur récupération transactions par catégorie:', error);
      return [];
    }
  },

  async getTransactionsByAccount(accountId: string, userId: string = 'default-user'): Promise<Transaction[]> {
    try {
      const db = await getDatabase();
      const transactions = await db.getAllAsync<any>(
        `SELECT 
          id, 
          amount, 
          type, 
          category, 
          account_id as accountId,
          description, 
          date, 
          created_at as createdAt
         FROM transactions 
         WHERE user_id = ? AND account_id = ? 
         ORDER BY date DESC`,
        [userId, accountId]
      );
      return transactions || [];
    } catch (error) {
      console.error('❌ [transactionService] Erreur récupération transactions par compte:', error);
      return [];
    }
  },

  // ✅ STATISTIQUES MENSUELLES
  async getMonthlyStats(
    year: number, 
    month: number, 
    accountId?: string, 
    userId: string = 'default-user'
  ): Promise<MonthlyStats> {
    try {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
      
      let query = `SELECT 
          id, 
          amount, 
          type, 
          category, 
          account_id as accountId,
          description, 
          date, 
          created_at as createdAt
         FROM transactions 
         WHERE user_id = ? AND date BETWEEN ? AND ?`;
      
      const params: any[] = [userId, startDate, endDate];
      
      if (accountId) {
        query += ` AND account_id = ?`;
        params.push(accountId);
      }
      
      query += ` ORDER BY date DESC`;
      
      const db = await getDatabase();
      const transactions = await db.getAllAsync<any>(query, params) || [];
      
      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
      const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return {
        income: Math.round(income * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
        transactions,
        transactionsCount: transactions.length
      };
    } catch (error) {
      console.error('❌ [transactionService] Erreur calcul stats mensuelles:', error);
      return { income: 0, expenses: 0, transactions: [], transactionsCount: 0 };
    }
  },

  async getRecentTransactions(limit: number = 5, userId: string = 'default-user'): Promise<Transaction[]> {
    try {
      const db = await getDatabase();
      const transactions = await db.getAllAsync<any>(
        `SELECT 
          id, 
          amount, 
          type, 
          category, 
          account_id as accountId,
          description, 
          date, 
          created_at as createdAt
         FROM transactions 
         WHERE user_id = ? 
         ORDER BY date DESC, created_at DESC 
         LIMIT ?`,
        [userId, limit]
      );
      return transactions || [];
    } catch (error) {
      console.error('❌ [transactionService] Erreur récupération transactions récentes:', error);
      return [];
    }
  },

  // ✅ CALCULS FINANCIERS
  async getTotalBalance(userId: string = 'default-user'): Promise<number> {
    try {
      const db = await getDatabase();
      const result = await db.getFirstAsync<{ total: number }>(
        `SELECT SUM(amount) as total FROM transactions WHERE user_id = ?`,
        [userId]
      );
      return result?.total || 0;
    } catch (error) {
      console.error('❌ [transactionService] Erreur calcul solde total:', error);
      return 0;
    }
  },

  async getTotalExpenses(startDate: string, endDate: string, userId: string = 'default-user'): Promise<number> {
    try {
      const db = await getDatabase();
      const result = await db.getFirstAsync<{ total: number }>(
        `SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'expense' AND date BETWEEN ? AND ?`,
        [userId, startDate, endDate]
      );
      return Math.abs(result?.total || 0);
    } catch (error) {
      console.error('❌ [transactionService] Erreur calcul dépenses totales:', error);
      return 0;
    }
  },

  async getTotalIncome(startDate: string, endDate: string, userId: string = 'default-user'): Promise<number> {
    try {
      const db = await getDatabase();
      const result = await db.getFirstAsync<{ total: number }>(
        `SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = 'income' AND date BETWEEN ? AND ?`,
        [userId, startDate, endDate]
      );
      return Math.abs(result?.total || 0);
    } catch (error) {
      console.error('❌ [transactionService] Erreur calcul revenus totaux:', error);
      return 0;
    }
  },

  // ✅ VÉRIFICATION ET RÉPARATION DES SOLDES
  async verifyAccountBalances(userId: string = 'default-user'): Promise<BalanceVerification[]> {
    try {
      const db = await getDatabase();
      
      const accounts = await db.getAllAsync<any>('SELECT * FROM accounts');
      const results: BalanceVerification[] = [];

      for (const account of accounts) {
        const calculatedBalance = await this.getCalculatedAccountBalance(account.id, userId);
        const actualBalance = account.balance;

        results.push({
          accountId: account.id,
          accountName: account.name,
          calculatedBalance: Math.round(calculatedBalance * 100) / 100,
          actualBalance: Math.round(actualBalance * 100) / 100,
          difference: Math.round((calculatedBalance - actualBalance) * 100) / 100
        });
      }

      return results;
    } catch (error) {
      console.error('❌ [transactionService] Erreur vérification soldes:', error);
      return [];
    }
  },

  async repairAccountBalances(userId: string = 'default-user'): Promise<void> {
    try {
      console.log('🔧 [transactionService] Réparation des soldes des comptes...');
      
      const db = await getDatabase();
      const accounts = await db.getAllAsync<any>('SELECT id FROM accounts');

      for (const account of accounts) {
        await this.recalculateAccountBalance(account.id, userId);
      }

      console.log('✅ [transactionService] Soldes réparés avec succès');
    } catch (error) {
      console.error('❌ [transactionService] Erreur réparation soldes:', error);
      throw error;
    }
  },

  async getCalculatedAccountBalance(accountId: string, userId: string = 'default-user'): Promise<number> {
    try {
      const db = await getDatabase();
      
      const result = await db.getFirstAsync<{ total: number }>(
        `SELECT SUM(amount) as total FROM transactions WHERE account_id = ? AND user_id = ?`,
        [accountId, userId]
      );
      
      return result?.total || 0;
    } catch (error) {
      console.error('❌ [transactionService] Erreur calcul solde compte:', error);
      return 0;
    }
  },

  async recalculateAccountBalance(accountId: string, userId: string = 'default-user'): Promise<number> {
    try {
      console.log('🧮 [transactionService] Recalcul solde basé sur transactions:', accountId);
      
      const db = await getDatabase();
      
      const transactions = await db.getAllAsync<any>(
        `SELECT type, amount FROM transactions WHERE account_id = ? AND user_id = ?`,
        [accountId, userId]
      );
      
      let newBalance = 0;
      transactions.forEach((transaction: any) => {
        if (transaction.type === 'income') {
          newBalance += Math.abs(Number(transaction.amount));
        } else if (transaction.type === 'expense') {
          newBalance -= Math.abs(Number(transaction.amount));
        }
      });
      
      const oldAccount = await db.getFirstAsync<any>(
        'SELECT balance, name FROM accounts WHERE id = ?',
        [accountId]
      );
      
      await db.runAsync(
        'UPDATE accounts SET balance = ? WHERE id = ?',
        [newBalance, accountId]
      );
      
      console.log('📈 [transactionService] Solde recalculé:', {
        compte: oldAccount?.name || accountId,
        ancienSolde: oldAccount?.balance || 0,
        nouveauSolde: newBalance,
        nombreTransactions: transactions.length
      });
      
      return newBalance;
    } catch (error) {
      console.error('❌ [transactionService] Erreur recalcul solde:', error);
      throw error;
    }
  },

  // ✅ STATISTIQUES AVANCÉES
  async getCategoryStats(userId: string = 'default-user'): Promise<CategoryStats[]> {
    try {
      const db = await getDatabase();
      
      const result = await db.getAllAsync<any>(
        `SELECT category, SUM(amount) as total, COUNT(*) as count 
         FROM transactions 
         WHERE user_id = ? AND type = 'expense'
         GROUP BY category 
         ORDER BY total DESC`,
        [userId]
      );
      
      return result.map(item => ({
        category: item.category,
        total: Math.abs(Math.round(item.total * 100) / 100),
        count: item.count
      }));
    } catch (error) {
      console.error('❌ [transactionService] Erreur statistiques catégories:', error);
      return [];
    }
  },

  async getMonthlyTrends(userId: string = 'default-user'): Promise<MonthlyTrend[]> {
    try {
      const db = await getDatabase();
      
      const result = await db.getAllAsync<any>(
        `SELECT 
          strftime('%Y-%m', date) as month,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
         FROM transactions 
         WHERE user_id = ? 
         GROUP BY month 
         ORDER BY month DESC 
         LIMIT 12`,
        [userId]
      );
      
      return result.map(item => ({
        month: item.month,
        income: Math.abs(Math.round(item.income * 100) / 100),
        expenses: Math.abs(Math.round(item.expenses * 100) / 100)
      }));
    } catch (error) {
      console.error('❌ [transactionService] Erreur tendances mensuelles:', error);
      return [];
    }
  },

  // ✅ NOUVELLES MÉTHODES UTILITAIRES
  async getTransactionsCount(userId: string = 'default-user'): Promise<number> {
    try {
      const db = await getDatabase();
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM transactions WHERE user_id = ?`,
        [userId]
      );
      return result?.count || 0;
    } catch (error) {
      console.error('❌ [transactionService] Erreur comptage transactions:', error);
      return 0;
    }
  },

  async getTransactionsByType(type: 'income' | 'expense', userId: string = 'default-user'): Promise<Transaction[]> {
    try {
      const db = await getDatabase();
      const transactions = await db.getAllAsync<any>(
        `SELECT 
          id, 
          amount, 
          type, 
          category, 
          account_id as accountId,
          description, 
          date, 
          created_at as createdAt
         FROM transactions 
         WHERE user_id = ? AND type = ? 
         ORDER BY date DESC`,
        [userId, type]
      );
      return transactions || [];
    } catch (error) {
      console.error('❌ [transactionService] Erreur récupération transactions par type:', error);
      return [];
    }
  },

  // ✅ MÉTHODE POUR FORCER LA SYNCHRONISATION DES BUDGETS
  async forceBudgetSync(userId: string = 'default-user'): Promise<void> {
    try {
      console.log('🔄 [transactionService] Synchronisation forcée des budgets...');
      await updateBudgetsAfterExpense(userId);
      console.log('✅ [transactionService] Synchronisation budgets terminée');
    } catch (error) {
      console.error('❌ [transactionService] Erreur synchronisation budgets:', error);
      throw error;
    }
  }
};

export default transactionService;