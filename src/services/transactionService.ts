// src/services/transactionService.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { Transaction } from '../types';
import { generateId } from '../utils/numberUtils';
import { budgetService } from './budgetService';
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

// ✅ FONCTIONS UTILITAIRES CORRIGÉES
const updateAccountBalanceFromTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<void> => {
  const db = await getDatabase();
  
  // ✅ CORRECTION : Identifier les transactions de transfert par leur CATÉGORIE
  const isTransferTransaction = 
    transaction.category === 'transfert' || 
    transaction.category === 'épargne' ||
    transaction.category === 'remboursement épargne' ||
    (transaction.description && (
      transaction.description.includes('Transfert') ||
      transaction.description.includes('Épargne:') ||
      transaction.description.includes('Remboursement:') ||
      transaction.description.includes('Savings:') ||
      transaction.description.includes('Refund:')
    ));
  
  // ❌ NE PAS mettre à jour le solde pour les transactions de transfert
  if (isTransferTransaction) {
    console.log('💰 [transactionService] Transaction de transfert détectée - pas de mise à jour de solde:', {
      category: transaction.category,
      description: transaction.description
    });
    return;
  }
  
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
  
  // ✅ CORRECTION : Identifier les transactions de transfert
  const isTransferTransaction = 
    transaction.category === 'transfert' || 
    transaction.category === 'épargne' ||
    transaction.category === 'remboursement épargne' ||
    (transaction.description && (
      transaction.description.includes('Transfert') ||
      transaction.description.includes('Épargne:') ||
      transaction.description.includes('Remboursement:')
    ));
  
  if (isTransferTransaction) {
    console.log('💰 [transactionService] Transaction de transfert - pas d\'annulation de solde');
    return;
  }
  
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
  
  // ✅ CORRECTION : Identifier les transactions de transfert
  const isTransferTransaction = 
    transaction.category === 'transfert' || 
    transaction.category === 'épargne' ||
    transaction.category === 'remboursement épargne' ||
    (transaction.description && (
      transaction.description.includes('Transfert') ||
      transaction.description.includes('Épargne:') ||
      transaction.description.includes('Remboursement:')
    ));
  
  if (isTransferTransaction) {
    console.log('💰 [transactionService] Transaction de transfert - pas d\'application de solde');
    return;
  }
  
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

const updateBudgetsAfterExpense = async (userId: string = 'default-user'): Promise<void> => {
  try {
    await budgetService.updateBudgetSpentFromTransactions(userId);
    console.log('💰 [transactionService] Budgets mis à jour après transaction de dépense');
  } catch (budgetError) {
    console.warn('⚠️ [transactionService] Erreur mise à jour budgets:', budgetError);
  }
};

const isSavingsTransaction = (transaction: Transaction): boolean => {
  const savingsKeywords = [
    'épargne', 'savings', 'remboursement', 'refund', 'annulation',
    'contribution', 'goal', 'objectif'
  ];
  
  const description = transaction.description?.toLowerCase() || '';
  return savingsKeywords.some(keyword => description.includes(keyword));
};

export const transactionService = {
  // ✅ CRÉATION AVEC LOGIQUE COHÉRENTE - CORRIGÉE
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
      
      validateTransactionData(transactionData);
      
      const db = await getDatabase();
      const transactionId = generateId();
      const createdAt = new Date().toISOString();
      
      // ✅ Gérer les champs de récurrence et sub_category
      const isRecurring = (transactionData as any).isRecurring ? 1 : 0;
      const recurrenceType = (transactionData as any).recurrenceType || null;
      const recurrenceEndDate = (transactionData as any).recurrenceEndDate || null;
      const subCategory = (transactionData as any).subCategory || null;
      
      await db.runAsync(
        `INSERT INTO transactions (
          id, user_id, amount, type, category, sub_category, account_id, description, date, created_at,
          is_recurring, recurrence_type, recurrence_end_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId,
          userId,
          transactionData.amount,
          transactionData.type,
          transactionData.category,
          subCategory,
          transactionData.accountId,
          transactionData.description || '',
          transactionData.date,
          createdAt,
          isRecurring,
          recurrenceType,
          recurrenceEndDate
        ]
      );

      // ✅ METTRE À JOUR LE SOLDE (sauf pour les transactions de transfert)
      await updateAccountBalanceFromTransaction(transactionData);

      // METTRE À JOUR LES BUDGETS SI C'EST UNE DÉPENSE
      if (transactionData.type === 'expense') {
        await updateBudgetsAfterExpense(userId);
      }

      console.log('✅ [transactionService] Transaction créée:', transactionId);
      return transactionId;
    } catch (error) {
      console.error('❌ [transactionService] Erreur création transaction:', error);
      throw error;
    }
  },

  // ✅ MISE À JOUR CORRIGÉE
  async updateTransaction(
    id: string, 
    updates: Partial<Transaction>, 
    userId: string = 'default-user'
  ): Promise<void> {
    try {
      console.log('🔄 [transactionService] Mise à jour transaction:', id);
      
      const db = await getDatabase();
      
      const oldTransaction = await this.getTransactionById(id, userId);
      if (!oldTransaction) {
        throw new Error('Transaction non trouvée');
      }

      // Annuler l'effet de l'ancienne transaction
      await revertTransactionEffect(oldTransaction);

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
      await applyTransactionEffect(updatedTransaction);

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

  // ✅ SUPPRESSION CORRIGÉE
  async deleteTransaction(id: string, userId: string = 'default-user'): Promise<void> {
    try {
      console.log('🗑️ [transactionService] Suppression transaction:', id);
      
      const db = await getDatabase();
      
      const transaction = await this.getTransactionById(id, userId);
      if (!transaction) {
        throw new Error('Transaction non trouvée');
      }

      // Annuler l'effet de la transaction
      await revertTransactionEffect(transaction);

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

  // ✅ MÉTHODES DE RÉCUPÉRATION (inchangées)
  async getAllTransactions(userId: string = 'default-user'): Promise<Transaction[]> {
    try {
      const db = await getDatabase();
      const transactions = await db.getAllAsync<any>(
        `SELECT 
          id, 
          amount, 
          type, 
          category,
          sub_category as subCategory,
          account_id as accountId,
          description, 
          date, 
          created_at as createdAt,
          user_id as userId,
          is_recurring as isRecurring,
          recurrence_type as recurrenceType,
          recurrence_end_date as recurrenceEndDate,
          parent_transaction_id as parentTransactionId
         FROM transactions 
         WHERE user_id = ? 
         ORDER BY date DESC, created_at DESC`,
        [userId]
      );
      
      // 🔍 DIAGNOSTIC : Vérifier les doublons au niveau SQL
      const rawCount = transactions?.length || 0;
      const uniqueIds = new Set((transactions || []).map(t => t.id));
      
      if (uniqueIds.size !== rawCount && rawCount > 0) {
        console.warn('🚨 DOUBLONS DÉTECTÉS dans la requête SQL:', {
          rawCount,
          uniqueIds: uniqueIds.size,
          userId
        });
      }
      
      // ✅ Convertir is_recurring de 0/1 en boolean
      const processedTransactions = (transactions || []).map(tx => ({
        ...tx,
        isRecurring: Boolean(tx.isRecurring)
      }));
      
      console.log(`📊 [transactionService] getAllTransactions: ${processedTransactions.length} transactions pour userId: ${userId}`);
      
      return processedTransactions;
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
          sub_category as subCategory,
          account_id as accountId,
          description, 
          date, 
          created_at as createdAt,
          user_id as userId,
          is_recurring as isRecurring,
          recurrence_type as recurrenceType,
          recurrence_end_date as recurrenceEndDate,
          parent_transaction_id as parentTransactionId
         FROM transactions 
         WHERE user_id = ?`;
      
      const params: any[] = [userId];
      
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
      
      // ✅ Convertir is_recurring de 0/1 en boolean
      return (transactions || []).map(tx => ({
        ...tx,
        isRecurring: Boolean(tx.isRecurring)
      }));
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
          sub_category as subCategory,
          account_id as accountId,
          description, 
          date, 
          created_at as createdAt,
          is_recurring as isRecurring,
          recurrence_type as recurrenceType,
          recurrence_end_date as recurrenceEndDate,
          parent_transaction_id as parentTransactionId
         FROM transactions 
         WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      
      // ✅ Convertir is_recurring de 0/1 en boolean
      if (transaction) {
        transaction.isRecurring = Boolean(transaction.isRecurring);
      }
      
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
          sub_category as subCategory,
          account_id as accountId,
          description, 
          date, 
          created_at as createdAt,
          is_recurring as isRecurring,
          recurrence_type as recurrenceType,
          recurrence_end_date as recurrenceEndDate,
          parent_transaction_id as parentTransactionId
         FROM transactions 
         WHERE user_id = ? AND date BETWEEN ? AND ? 
         ORDER BY date DESC`,
        [userId, startDate, endDate]
      );
      
      // ✅ Convertir is_recurring de 0/1 en boolean
      return (transactions || []).map(tx => ({
        ...tx,
        isRecurring: Boolean(tx.isRecurring)
      }));
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

  // ✅ STATISTIQUES MENSUELLES CORRIGÉES
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
      const allTransactions = await db.getAllAsync<any>(query, params) || [];
      
      const transactions = allTransactions.filter(transaction => 
        !isSavingsTransaction(transaction)
      );
      
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

  // ✅ CALCULS FINANCIERS CORRIGÉS
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
      const allTransactions = await db.getAllAsync<any>(
        `SELECT * FROM transactions WHERE user_id = ? AND type = 'expense' AND date BETWEEN ? AND ?`,
        [userId, startDate, endDate]
      ) || [];
      
      const expenses = allTransactions
        .filter(transaction => !isSavingsTransaction(transaction))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
      return Math.round(expenses * 100) / 100;
    } catch (error) {
      console.error('❌ [transactionService] Erreur calcul dépenses totales:', error);
      return 0;
    }
  },

  async getTotalIncome(startDate: string, endDate: string, userId: string = 'default-user'): Promise<number> {
    try {
      const db = await getDatabase();
      const allTransactions = await db.getAllAsync<any>(
        `SELECT * FROM transactions WHERE user_id = ? AND type = 'income' AND date BETWEEN ? AND ?`,
        [userId, startDate, endDate]
      ) || [];
      
      const income = allTransactions
        .filter(transaction => !isSavingsTransaction(transaction))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
      return Math.round(income * 100) / 100;
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

  // ✅ STATISTIQUES AVANCÉES CORRIGÉES
  async getCategoryStats(userId: string = 'default-user'): Promise<CategoryStats[]> {
    try {
      const db = await getDatabase();
      
      const allTransactions = await db.getAllAsync<any>(
        `SELECT * FROM transactions WHERE user_id = ? AND type = 'expense'`,
        [userId]
      ) || [];
      
      const transactions = allTransactions.filter(transaction => 
        !isSavingsTransaction(transaction)
      );
      
      const categoryMap = new Map();
      
      transactions.forEach(transaction => {
        const category = transaction.category;
        const amount = Math.abs(transaction.amount);
        
        if (categoryMap.has(category)) {
          const existing = categoryMap.get(category);
          categoryMap.set(category, {
            total: existing.total + amount,
            count: existing.count + 1
          });
        } else {
          categoryMap.set(category, {
            total: amount,
            count: 1
          });
        }
      });
      
      const result: CategoryStats[] = [];
      categoryMap.forEach((value, category) => {
        result.push({
          category,
          total: Math.round(value.total * 100) / 100,
          count: value.count
        });
      });
      
      return result.sort((a, b) => b.total - a.total);
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

  async getRecurringTransactions(userId: string = 'default-user'): Promise<Transaction[]> {
    try {
      const db = await getDatabase();
      
      const tableExists = await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='recurring_transactions'"
      );
      
      if (!tableExists) {
        console.log('ℹ️ [transactionService] Table recurring_transactions non trouvée');
        return [];
      }
      
      const recurringTransactions = await db.getAllAsync<any>(
        `SELECT 
          id, 
          description,
          amount,
          type,
          category,
          account_id as accountId,
          frequency,
          start_date as startDate,
          end_date as endDate,
          next_date as nextDate,
          is_active as isActive,
          created_at as createdAt
         FROM recurring_transactions 
         WHERE user_id = ? AND is_active = 1
         ORDER BY next_date ASC`,
        [userId]
      );
      
      const transactions: Transaction[] = recurringTransactions.map(item => ({
        id: item.id,
        description: item.description,
        amount: item.amount,
        type: item.type as 'income' | 'expense',
        category: item.category,
        accountId: item.accountId,
        date: item.nextDate || item.startDate,
        createdAt: item.createdAt,
        userId: userId,
        isRecurring: true,
        frequency: item.frequency,
        nextDate: item.nextDate,
        endDate: item.endDate
      }));
      
      console.log(`✅ [transactionService] ${transactions.length} transactions récurrentes récupérées`);
      return transactions;
      
    } catch (error) {
      console.error('❌ [transactionService] Erreur récupération transactions récurrentes:', error);
      return [];
    }
  },

  async forceBudgetSync(userId: string = 'default-user'): Promise<void> {
    try {
      console.log('🔄 [transactionService] Synchronisation forcée des budgets...');
      await budgetService.updateBudgetSpentFromTransactions(userId);
      console.log('✅ [transactionService] Synchronisation budgets terminée');
    } catch (error) {
      console.error('❌ [transactionService] Erreur synchronisation budgets:', error);
      throw error;
    }
  },

  async getSavingsTransactions(userId: string = 'default-user'): Promise<Transaction[]> {
    try {
      const db = await getDatabase();
      const allTransactions = await db.getAllAsync<any>(
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
         ORDER BY date DESC`,
        [userId]
      );
      
      return allTransactions.filter(transaction => isSavingsTransaction(transaction));
    } catch (error) {
      console.error('❌ [transactionService] Erreur récupération transactions épargne:', error);
      return [];
    }
  },

  async deleteSavingsTransactions(goalName: string, userId: string = 'default-user'): Promise<number> {
    try {
      console.log('🗑️ [transactionService] Suppression transactions épargne pour:', goalName);
      
      const db = await getDatabase();
      
      const searchPatterns = [
        `%Épargne: ${goalName}%`,
        `%épargne: ${goalName}%`,
        `%Savings: ${goalName}%`,
        `%savings: ${goalName}%`,
        `%${goalName}%`,
        `%Remboursement: ${goalName}%`,
        `%remboursement: ${goalName}%`,
        `%Refund: ${goalName}%`,
        `%refund: ${goalName}%`
      ];
      
      let deletedCount = 0;
      
      for (const pattern of searchPatterns) {
        const result = await db.runAsync(
          `DELETE FROM transactions WHERE user_id = ? AND description LIKE ?`,
          [userId, pattern]
        );
        
        deletedCount += result.changes || 0;
      }
      
      console.log(`✅ [transactionService] ${deletedCount} transactions épargne supprimées`);
      return deletedCount;
    } catch (error) {
      console.error('❌ [transactionService] Erreur suppression transactions épargne:', error);
      return 0;
    }
  }
};

export default transactionService;