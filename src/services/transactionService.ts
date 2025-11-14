// src/services/transactionService.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { Transaction } from '../types';
import { generateId } from '../utils/numberUtils';
import { getDatabase } from './database/sqlite';

export interface TransactionFilters {
  year?: number;
  month?: number;
  accountId?: string;
  type?: 'income' | 'expense';
  category?: string;
  isRecurring?: boolean;
}

export interface CreateTransactionData {
  amount: number; 
  type: 'income' | 'expense';
  category: string;
  accountId: string;
  description: string;
  date: string;
  isRecurring?: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceEndDate?: string;
}

export const transactionService = {
  // ✅ CRÉATION UNIFIÉE CORRIGÉE
  async createTransaction(
    transactionData: CreateTransactionData, 
    userId: string = 'default-user'
  ): Promise<string> {
    try {
      console.log('🔄 [transactionService] Création transaction unifiée...', {
        type: transactionData.type,
        isRecurring: transactionData.isRecurring,
        recurrenceType: transactionData.recurrenceType
      });

      const db = await getDatabase();
      const transactionId = generateId();
      const createdAt = new Date().toISOString();

      // ✅ CORRECTION : Calcul correct du montant
      const amount = transactionData.type === 'expense' 
        ? -Math.abs(transactionData.amount) 
        : Math.abs(transactionData.amount);

      // Préparer les données pour la récurrence
      const nextOccurrence = transactionData.isRecurring 
        ? this.calculateNextOccurrence(transactionData.recurrenceType!, transactionData.date)
        : null;

      await db.runAsync(
        `INSERT INTO transactions (
          id, user_id, amount, type, category, account_id, description, 
          date, created_at, is_recurring, recurrence_type, recurrence_end_date,
          parent_transaction_id, next_occurrence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId,
          userId,
          amount, // ✅ CORRECTION : Montant avec signe correct
          transactionData.type,
          transactionData.category,
          transactionData.accountId,
          transactionData.description,
          transactionData.date,
          createdAt,
          transactionData.isRecurring ? 1 : 0,
          transactionData.recurrenceType || null,
          transactionData.recurrenceEndDate || null,
          null,
          nextOccurrence
        ]
      );

      // ✅ CORRECTION : Mettre à jour le solde pour TOUTES les transactions non-récurrentes
      if (!transactionData.isRecurring) {
        await this.updateAccountBalance({
          amount: amount,
          type: transactionData.type,
          accountId: transactionData.accountId
        }, userId);
      }

      console.log('✅ [transactionService] Transaction créée:', transactionId);
      return transactionId;

    } catch (error) {
      console.error('❌ [transactionService] Erreur création transaction:', error);
      throw error;
    }
  },

   async createTransactionWithoutBalanceUpdate(
    transactionData: CreateTransactionData, 
    userId: string = 'default-user'
  ): Promise<string> {
    try {
      console.log('🔄 [transactionService] Création transaction sans mise à jour solde...', {
        type: transactionData.type,
        isRecurring: transactionData.isRecurring
      });

      const db = await getDatabase();
      const transactionId = generateId();
      const createdAt = new Date().toISOString();

      // Préparer les données pour la récurrence
      const nextOccurrence = transactionData.isRecurring 
        ? this.calculateNextOccurrence(transactionData.recurrenceType!, transactionData.date)
        : null;

      await db.runAsync(
        `INSERT INTO transactions (
          id, user_id, amount, type, category, account_id, description, 
          date, created_at, is_recurring, recurrence_type, recurrence_end_date,
          parent_transaction_id, next_occurrence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId,
          userId,
          transactionData.amount,
          transactionData.type,
          transactionData.category,
          transactionData.accountId,
          transactionData.description,
          transactionData.date,
          createdAt,
          transactionData.isRecurring ? 1 : 0,
          transactionData.recurrenceType || null,
          transactionData.recurrenceEndDate || null,
          null,
          nextOccurrence
        ]
      );

      console.log('✅ [transactionService] Transaction créée sans mise à jour solde:', transactionId);
      return transactionId;

    } catch (error) {
      console.error('❌ [transactionService] Erreur création transaction sans solde:', error);
      throw error;
    }
  },

  // ✅ RÉCUPÉRATION UNIFIÉE CORRIGÉE
  async getAllTransactions(
    userId: string = 'default-user', 
    filters: TransactionFilters = {}
  ): Promise<Transaction[]> {
    try {
      const db = await getDatabase();
      
      let query = `
        SELECT 
          id, 
          amount, 
          type, 
          category, 
          account_id as accountId,
          description, 
          date, 
          created_at as createdAt,
          user_id as userId,
          is_recurring as isRecurring,
          recurrence_type as recurrenceType,
          recurrence_end_date as recurrenceEndDate,
          parent_transaction_id as parentTransactionId,
          next_occurrence as nextOccurrence
        FROM transactions 
        WHERE user_id = ?
      `;
      
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
      
      if (filters.isRecurring !== undefined) {
        query += ` AND is_recurring = ?`;
        params.push(filters.isRecurring ? 1 : 0);
      }
      
      query += ` ORDER BY date DESC, created_at DESC`;
      
      const transactions = await db.getAllAsync<any>(query, params);
      
      // ✅ CORRECTION : Transformation correcte des données
      return transactions.map((tx: any) => ({
        id: tx.id,
        userId: tx.userId,
        amount: Number(tx.amount), // Garder le signe original
        type: tx.type,
        category: tx.category,
        accountId: tx.accountId,
        description: tx.description,
        date: tx.date,
        createdAt: tx.createdAt,
        isRecurring: Boolean(tx.isRecurring),
        recurrenceType: tx.recurrenceType,
        recurrenceEndDate: tx.recurrenceEndDate,
        parentTransactionId: tx.parentTransactionId,
        nextOccurrence: tx.nextOccurrence
      }));
      
    } catch (error) {
      console.error('❌ [transactionService] Erreur récupération transactions:', error);
      return [];
    }
  },

  // ✅ RÉCUPÉRATION PAR ID CORRIGÉE
  async getTransactionById(id: string, userId: string = 'default-user'): Promise<Transaction | null> {
    try {
      const db = await getDatabase();
      
      const transaction = await db.getFirstAsync<any>(`
        SELECT 
          id, 
          amount, 
          type, 
          category, 
          account_id as accountId,
          description, 
          date, 
          created_at as createdAt,
          user_id as userId,
          is_recurring as isRecurring,
          recurrence_type as recurrenceType,
          recurrence_end_date as recurrenceEndDate,
          parent_transaction_id as parentTransactionId,
          next_occurrence as nextOccurrence
        FROM transactions 
        WHERE id = ? AND user_id = ?
      `, [id, userId]);

      if (!transaction) {
        console.log('❌ [transactionService] Transaction non trouvée:', id);
        return null;
      }

      // ✅ CORRECTION : Transformation correcte
      return {
        id: transaction.id,
        userId: transaction.userId,
        amount: Number(transaction.amount),
        type: transaction.type,
        category: transaction.category,
        accountId: transaction.accountId,
        description: transaction.description,
        date: transaction.date,
        createdAt: transaction.createdAt,
        isRecurring: Boolean(transaction.isRecurring),
        recurrenceType: transaction.recurrenceType,
        recurrenceEndDate: transaction.recurrenceEndDate,
        parentTransactionId: transaction.parentTransactionId,
        nextOccurrence: transaction.nextOccurrence
      };

    } catch (error) {
      console.error('❌ [transactionService] Erreur récupération transaction:', error);
      return null;
    }
  },

  // ✅ MISE À JOUR UNIFIÉE CORRIGÉE
  async updateTransaction(
    id: string, 
    updates: Partial<Transaction>, 
    userId: string = 'default-user'
  ): Promise<void> {
    try {
      const db = await getDatabase();
      
      // Récupérer l'ancienne transaction
      const oldTransaction = await this.getTransactionById(id, userId);
      if (!oldTransaction) {
        throw new Error('Transaction non trouvée');
      }

      // Revertir l'ancien effet sur le solde si ce n'est pas une récurrente
      if (!oldTransaction.isRecurring) {
        await this.revertAccountBalance(oldTransaction);
      }

      // Mettre à jour la transaction
      const setParts: string[] = [];
      const values: any[] = [];

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id' && key !== 'userId') {
          const sqlKey = this.mapFieldToColumn(key);
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

      // Appliquer le nouvel effet sur le solde si ce n'est pas une récurrente
      const updatedTransaction = { ...oldTransaction, ...updates };
      if (!updatedTransaction.isRecurring) {
        await this.updateAccountBalance(updatedTransaction, userId);
      }

      console.log('✅ [transactionService] Transaction mise à jour:', id);

    } catch (error) {
      console.error('❌ [transactionService] Erreur mise à jour transaction:', error);
      throw error;
    }
  },

  // ✅ SUPPRESSION UNIFIÉE CORRIGÉE
  async deleteTransaction(id: string, userId: string = 'default-user'): Promise<void> {
    try {
      const db = await getDatabase();
      
      const transaction = await this.getTransactionById(id, userId);
      if (!transaction) {
        throw new Error('Transaction non trouvée');
      }

      // Revertir l'effet sur le solde si ce n'est pas une récurrente
      if (!transaction.isRecurring) {
        await this.revertAccountBalance(transaction);
      }

      await db.runAsync(
        'DELETE FROM transactions WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      console.log('✅ [transactionService] Transaction supprimée:', id);

    } catch (error) {
      console.error('❌ [transactionService] Erreur suppression transaction:', error);
      throw error;
    }
  },

  // ✅ MISE À JOUR SOLDE COMPTE CORRIGÉE
  async updateAccountBalance(transaction: { amount: number; type: string; accountId: string }, userId: string): Promise<void> {
    const db = await getDatabase();
    
    console.log('💰 [transactionService] Mise à jour solde compte:', {
      accountId: transaction.accountId,
      type: transaction.type,
      amount: transaction.amount
    });
    
    const account = await db.getFirstAsync<any>(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
      [transaction.accountId, userId]
    );
    
    if (!account) {
      throw new Error(`Compte non trouvé: ${transaction.accountId}`);
    }

    let newBalance = account.balance;
    
    // ✅ CORRECTION : Logique de calcul corrigée
    if (transaction.type === 'income') {
      newBalance = account.balance + Math.abs(transaction.amount);
    } else if (transaction.type === 'expense') {
      newBalance = account.balance - Math.abs(transaction.amount);
    }
    
    await db.runAsync(
      'UPDATE accounts SET balance = ? WHERE id = ? AND user_id = ?',
      [newBalance, transaction.accountId, userId]
    );
    
    console.log('💰 Solde mis à jour:', {
      compte: transaction.accountId,
      ancienSolde: account.balance,
      nouveauSolde: newBalance,
      montant: transaction.amount
    });
  },

  // ✅ REVERTIR SOLDE COMPTE CORRIGÉE
  async revertAccountBalance(transaction: Transaction): Promise<void> {
    const db = await getDatabase();
    
    const account = await db.getFirstAsync<any>(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
      [transaction.accountId, transaction.userId]
    );
    
    if (account) {
      let newBalance = account.balance;
      
      // ✅ CORRECTION : Logique inverse corrigée
      if (transaction.type === 'income') {
        newBalance = account.balance - Math.abs(transaction.amount);
      } else if (transaction.type === 'expense') {
        newBalance = account.balance + Math.abs(transaction.amount);
      }
      
      await db.runAsync(
        'UPDATE accounts SET balance = ? WHERE id = ? AND user_id = ?',
        [newBalance, transaction.accountId, transaction.userId]
      );
      
      console.log('💰 Solde reverti:', {
        compte: transaction.accountId,
        ancienSolde: account.balance,
        nouveauSolde: newBalance,
        montant: transaction.amount
      });
    }
  },

  // ✅ CALCUL PROCHAINE OCCURRENCE
  calculateNextOccurrence(recurrenceType: string, baseDate: string): string {
    const date = new Date(baseDate);
    
    switch (recurrenceType) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    
    return date.toISOString().split('T')[0];
  },

  // ✅ MAPPAGE DES CHAMPS
  mapFieldToColumn(field: string): string {
    const mapping: { [key: string]: string } = {
      'accountId': 'account_id',
      'createdAt': 'created_at',
      'isRecurring': 'is_recurring',
      'recurrenceType': 'recurrence_type',
      'recurrenceEndDate': 'recurrence_end_date',
      'parentTransactionId': 'parent_transaction_id',
      'nextOccurrence': 'next_occurrence'
    };
    
    return mapping[field] || field;
  },

  // ✅ RÉCUPÉRATION DES TRANSACTIONS RÉCURRENTES ACTIVES
  async getActiveRecurringTransactions(userId: string = 'default-user'): Promise<Transaction[]> {
    try {
      const db = await getDatabase();
      
      const transactions = await db.getAllAsync<any>(`
        SELECT 
          id, 
          amount, 
          type, 
          category, 
          account_id as accountId,
          description, 
          date, 
          created_at as createdAt,
          user_id as userId,
          is_recurring as isRecurring,
          recurrence_type as recurrenceType,
          recurrence_end_date as recurrenceEndDate,
          parent_transaction_id as parentTransactionId,
          next_occurrence as nextOccurrence
        FROM transactions 
        WHERE user_id = ? 
          AND is_recurring = 1
          AND (recurrence_end_date IS NULL OR recurrence_end_date >= date('now'))
        ORDER BY next_occurrence ASC
      `, [userId]);
      
      return transactions.map((tx: any) => ({
        ...tx,
        isRecurring: Boolean(tx.isRecurring),
        amount: Number(tx.amount)
      }));
      
    } catch (error) {
      console.error('❌ [transactionService] Erreur récupération transactions récurrentes:', error);
      return [];
    }
  },

  // ✅ TRAITEMENT DES TRANSACTIONS RÉCURRENTES
  async processRecurringTransactions(userId: string = 'default-user'): Promise<{ processed: number; errors: string[] }> {
    try {
      const db = await getDatabase();
      const today = new Date().toISOString().split('T')[0];
      const errors: string[] = [];
      let processed = 0;

      console.log('🔄 [transactionService] Traitement des transactions récurrentes...');

      const recurringTransactions = await db.getAllAsync<any>(`
        SELECT * FROM transactions 
        WHERE user_id = ? 
          AND is_recurring = 1
          AND next_occurrence <= ?
          AND (recurrence_end_date IS NULL OR recurrence_end_date >= ?)
      `, [userId, today, today]);

      console.log(`📦 ${recurringTransactions.length} transactions récurrentes à traiter`);

      for (const recurringTx of recurringTransactions) {
        try {
          const instanceId = generateId();
          
          await db.runAsync(`
            INSERT INTO transactions (
              id, user_id, amount, type, category, account_id, description, 
              date, created_at, is_recurring, recurrence_type, recurrence_end_date,
              parent_transaction_id, next_occurrence
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            instanceId,
            recurringTx.user_id,
            recurringTx.amount,
            recurringTx.type,
            recurringTx.category,
            recurringTx.account_id,
            recurringTx.description.replace('[Récurrente] ', ''),
            today,
            new Date().toISOString(),
            0,
            recurringTx.recurrence_type,
            recurringTx.recurrence_end_date,
            recurringTx.id,
            null
          ]);

          // Mettre à jour le solde du compte
          await this.updateAccountBalance({
            amount: recurringTx.amount,
            type: recurringTx.type,
            accountId: recurringTx.account_id
          }, userId);

          // Calculer la prochaine occurrence
          const nextOccurrence = this.calculateNextOccurrence(
            recurringTx.recurrence_type,
            recurringTx.next_occurrence || recurringTx.date
          );

          await db.runAsync(`
            UPDATE transactions 
            SET next_occurrence = ?, date = ?
            WHERE id = ?
          `, [nextOccurrence, today, recurringTx.id]);

          processed++;
          console.log(`✅ Instance créée pour: ${recurringTx.description}`);

        } catch (error) {
          const errorMsg = `Erreur avec ${recurringTx.description}: ${error}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(`✅ Traitement terminé: ${processed} transactions traitées`);
      return { processed, errors };

    } catch (error) {
      console.error('❌ [transactionService] Erreur traitement transactions récurrentes:', error);
      return { processed: 0, errors: [error instanceof Error ? error.message : 'Erreur inconnue'] };
    }
  }
};

export default transactionService;