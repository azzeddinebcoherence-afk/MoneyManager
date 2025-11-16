// src/services/accountService.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { Account } from '../types';
import { getDatabase } from './database/sqlite';

// ✅ INTERFACES LOCALES POUR LES DONNÉES
export interface CreateAccountData {
  name: string;
  type: Account['type'];
  balance: number;
  currency: string;
  color: string;
  icon?: string;
  isActive?: boolean;
}

export interface UpdateAccountData {
  name?: string;
  type?: Account['type'];
  balance?: number;
  currency?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

export interface AccountType {
  value: string;
  label: string;
  icon: string;
}

// ✅ TYPES DE COMPTES PRÉDÉFINIS
export const ACCOUNT_TYPES: AccountType[] = [
  { value: 'cash', label: 'Espèces', icon: 'cash' },
  { value: 'bank', label: 'Compte Bancaire', icon: 'bank' },
  { value: 'card', label: 'Carte de Crédit', icon: 'card' },
  { value: 'savings', label: 'Épargne', icon: 'savings' },
  { value: 'investment', label: 'Investissement', icon: 'investment' },
  { value: 'loan', label: 'Prêt', icon: 'loan' },
  { value: 'other', label: 'Autre', icon: 'wallet' }
];

interface DatabaseAccount {
  id: string;
  user_id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  color: string;
  icon?: string;
  is_active: number;
  created_at: string;
}

export const accountService = {
  // ✅ NOUVELLE MÉTHODE : Valider un compte pour opération
  async validateAccountForOperation(
    accountId: string, 
    amount: number = 0, 
    operationType: 'debit' | 'credit' = 'debit'
  ): Promise<{ isValid: boolean; message?: string; account?: Account }> {
    try {
      const account = await this.getAccountById(accountId);
      
      if (!account) {
        return { isValid: false, message: 'Compte introuvable' };
      }

      if (!account.isActive) {
        return { isValid: false, message: 'Le compte est désactivé', account };
      }

      if (operationType === 'debit' && account.balance < amount) {
        return { 
          isValid: false, 
          message: `Solde insuffisant. Disponible: ${account.balance} MAD`, 
          account 
        };
      }

      return { isValid: true, account };
    } catch (error) {
      console.error('❌ [accountService] Erreur validation compte:', error);
      return { isValid: false, message: 'Erreur lors de la validation du compte' };
    }
  },

  // ✅ NOUVELLE MÉTHODE : Trouver un compte valide pour opération
  async findValidAccountForOperation(
    amount: number = 0,
    excludeAccountIds: string[] = [],
    userId: string = 'default-user'
  ): Promise<Account | null> {
    try {
      const accounts = await this.getAllAccounts(userId);
      
      const validAccounts = accounts.filter(account => 
        account.isActive &&
        account.balance >= amount &&
        !excludeAccountIds.includes(account.id) &&
        account.type !== 'savings'
      );

      return validAccounts.length > 0 ? validAccounts[0] : null;
    } catch (error) {
      console.error('❌ [accountService] Erreur recherche compte valide:', error);
      return null;
    }
  },

  // ✅ NOUVELLE MÉTHODE : Mise à jour simplifiée du solde
  async updateAccountBalanceDirect(accountId: string, newBalance: number): Promise<void> {
    try {
      const db = await getDatabase();
      
      await db.runAsync(
        'UPDATE accounts SET balance = ? WHERE id = ?',
        [newBalance, accountId]
      );
      
      console.log('💰 [accountService] Account balance updated directly:', {
        compte: accountId,
        nouveauSolde: newBalance
      });
    } catch (error) {
      console.error('❌ [accountService] Error updating account balance:', error);
      throw error;
    }
  },

  // ✅ MÉTHODE : Mapper les champs JavaScript vers les colonnes SQL
  mapFieldToColumn(field: string): string {
    const fieldMap: { [key: string]: string } = {
      'isActive': 'is_active',
      'userId': 'user_id'
    };
    
    return fieldMap[field] || field;
  },

  // ✅ GARANTIR QUE LA TABLE ACCOUNTS A LA BONNE STRUCTURE
  async ensureAccountsTableExists(): Promise<void> {
    try {
      const db = await getDatabase();
      
      const tableExists = await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='accounts'"
      );
      
      if (!tableExists) {
        console.log('🛠️ [accountService] Creating accounts table...');
        
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL DEFAULT 'default-user',
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            balance REAL NOT NULL DEFAULT 0,
            currency TEXT NOT NULL DEFAULT 'MAD',
            color TEXT NOT NULL,
            icon TEXT DEFAULT 'wallet',
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
          );
        `);
        
        console.log('✅ [accountService] accounts table created successfully');
      } else {
        console.log('🔍 [accountService] Checking accounts table structure...');
        
        const tableInfo = await db.getAllAsync(`PRAGMA table_info(accounts)`) as any[];
        
        const requiredColumns = [
          { name: 'id', type: 'TEXT' },
          { name: 'user_id', type: 'TEXT' },
          { name: 'name', type: 'TEXT' },
          { name: 'type', type: 'TEXT' },
          { name: 'balance', type: 'REAL' },
          { name: 'currency', type: 'TEXT' },
          { name: 'color', type: 'TEXT' },
          { name: 'icon', type: 'TEXT' },
          { name: 'is_active', type: 'INTEGER' },
          { name: 'created_at', type: 'TEXT' }
        ];
        
        for (const requiredColumn of requiredColumns) {
          const columnExists = tableInfo.some(col => col.name === requiredColumn.name);
          if (!columnExists) {
            console.log(`🛠️ [accountService] Adding ${requiredColumn.name} column to accounts...`);
            
            try {
              await db.execAsync(
                `ALTER TABLE accounts ADD COLUMN ${requiredColumn.name} ${requiredColumn.type};`
              );
              console.log(`✅ [accountService] ${requiredColumn.name} column added successfully`);
            } catch (alterError) {
              console.log(`ℹ️ [accountService] Column ${requiredColumn.name} may already exist`);
            }
          }
        }
        
        console.log('✅ [accountService] Table structure verification completed');
      }
    } catch (error) {
      console.error('❌ [accountService] Error ensuring accounts table exists:', error);
      throw error;
    }
  },

  // ✅ CRÉATION DE COMPTE AVEC VÉRIFICATION DE LA STRUCTURE
  async createAccount(accountData: CreateAccountData, userId: string = 'default-user'): Promise<string> {
    try {
      await this.ensureAccountsTableExists();

      const db = await getDatabase();
      const id = `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();

      console.log('🔄 [accountService] Creating account:', { id, ...accountData });

      const validation = this.validateAccountData(accountData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const currency = accountData.currency || 'MAD';

      await db.runAsync(
        `INSERT INTO accounts (id, user_id, name, type, balance, currency, color, icon, is_active, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          accountData.name,
          accountData.type,
          accountData.balance,
          currency,
          accountData.color,
          accountData.icon || this.getDefaultIconForType(accountData.type),
          accountData.isActive !== false ? 1 : 0,
          createdAt
        ]
      );

      console.log('✅ [accountService] Account created successfully');
      return id;
    } catch (error) {
      console.error('❌ [accountService] Error in createAccount:', error);
      throw error;
    }
  },

  // ✅ CRÉER UN COMPTE PAR DÉFAUT SI AUCUN N'EXISTE
  async createDefaultAccountIfNoneExists(userId: string = 'default-user'): Promise<void> {
    try {
      await this.ensureAccountsTableExists();

      const accounts = await this.getAllAccounts(userId);
      
      if (accounts.length === 0) {
        console.log('🔄 [accountService] Creating default account...');
        
        await this.createAccount({
          name: 'Compte Principal',
          type: 'bank',
          balance: 0,
          currency: 'MAD',
          color: this.generateRandomColor(),
          icon: 'bank',
          isActive: true
        }, userId);
        
        console.log('✅ [accountService] Default account created successfully');
      }
    } catch (error) {
      console.error('❌ [accountService] Error creating default account:', error);
    }
  },

  // ✅ RÉCUPÉRATION DE TOUS LES COMPTES
  async getAllAccounts(userId: string = 'default-user'): Promise<Account[]> {
    try {
      await this.ensureAccountsTableExists();

      const db = await getDatabase();
      
      const result = await db.getAllAsync(
        `SELECT * FROM accounts WHERE user_id = ? ORDER BY 
         CASE 
           WHEN type = 'cash' THEN 1
           WHEN type = 'bank' THEN 2
           WHEN type = 'card' THEN 3
           WHEN type = 'savings' THEN 4
           ELSE 5
         END, name ASC`,
        [userId]
      ) as DatabaseAccount[];
      
      const accounts: Account[] = result.map((item) => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        type: item.type as Account['type'],
        balance: item.balance,
        currency: item.currency,
        color: item.color,
        icon: item.icon || this.getDefaultIconForType(item.type as Account['type']),
        isActive: Boolean(item.is_active),
        createdAt: item.created_at,
      }));
      
      console.log(`📊 [accountService] Retrieved ${accounts.length} accounts`);
      return accounts;
    } catch (error) {
      console.error('❌ [accountService] Error in getAllAccounts:', error);
      throw error;
    }
  },

  // ✅ RÉCUPÉRATION DE COMPTE PAR ID
  async getAccountById(id: string, userId: string = 'default-user'): Promise<Account | null> {
    try {
      await this.ensureAccountsTableExists();

      const db = await getDatabase();
      
      const result = await db.getFirstAsync(
        `SELECT * FROM accounts WHERE id = ? AND user_id = ?`,
        [id, userId]
      ) as DatabaseAccount | null;
      
      if (result) {
        const account: Account = {
          id: result.id,
          userId: result.user_id,
          name: result.name,
          type: result.type as Account['type'],
          balance: result.balance,
          currency: result.currency,
          color: result.color,
          icon: result.icon || this.getDefaultIconForType(result.type as Account['type']),
          isActive: Boolean(result.is_active),
          createdAt: result.created_at,
        };
        return account;
      }
      return null;
    } catch (error) {
      console.error('❌ [accountService] Error in getAccountById:', error);
      throw error;
    }
  },

  // ✅ MISE À JOUR DE COMPTE - CORRIGÉE
  async updateAccount(id: string, updates: UpdateAccountData, userId: string = 'default-user'): Promise<void> {
    try {
      await this.ensureAccountsTableExists();

      const db = await getDatabase();
      
      const fields = Object.keys(updates);
      if (fields.length === 0) {
        console.log('ℹ️ [accountService] No fields to update');
        return;
      }

      const setParts: string[] = [];
      const values: any[] = [];

      fields.forEach(field => {
        const dbField = this.mapFieldToColumn(field);
        setParts.push(`${dbField} = ?`);
        
        const value = (updates as any)[field];
        values.push(field === 'isActive' ? (value ? 1 : 0) : value);
      });

      const setClause = setParts.join(', ');
      
      values.push(id, userId);

      console.log('🔄 [accountService] Executing update:', {
        setClause,
        values: values.slice(0, -2),
        id,
        userId
      });

      const result = await db.runAsync(
        `UPDATE accounts SET ${setClause} WHERE id = ? AND user_id = ?`,
        values
      );
      
      console.log('✅ [accountService] Account updated successfully, changes:', result.changes);
    } catch (error) {
      console.error('❌ [accountService] Error in updateAccount:', error);
      throw error;
    }
  },

  // ✅ SUPPRESSION DE COMPTE
  async deleteAccount(id: string, userId: string = 'default-user'): Promise<void> {
    try {
      await this.ensureAccountsTableExists();

      const db = await getDatabase();
      
      await db.runAsync(
        `DELETE FROM accounts WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      
      console.log('✅ [accountService] Account deleted successfully');
    } catch (error) {
      console.error('❌ [accountService] Error in deleteAccount:', error);
      throw error;
    }
  },

  // ✅ MISE À JOUR DU SOLDE
  async updateAccountBalance(accountId: string, newBalance: number, userId: string = 'default-user'): Promise<void> {
    try {
      await this.ensureAccountsTableExists();

      const db = await getDatabase();
      
      await db.runAsync(
        'UPDATE accounts SET balance = ? WHERE id = ? AND user_id = ?',
        [newBalance, accountId, userId]
      );
      
      console.log('💰 [accountService] Account balance updated:', {
        compte: accountId,
        nouveauSolde: newBalance
      });
    } catch (error) {
      console.error('❌ [accountService] Error updating account balance:', error);
      throw error;
    }
  },

  // ✅ RÉINITIALISER TOUS LES SOLDES
  async resetAllAccountBalances(userId: string = 'default-user'): Promise<void> {
    try {
      await this.ensureAccountsTableExists();

      const db = await getDatabase();
      
      await db.runAsync(
        'UPDATE accounts SET balance = 0 WHERE user_id = ?',
        [userId]
      );
      
      console.log('🔄 [accountService] All account balances reset to 0');
    } catch (error) {
      console.error('❌ [accountService] Error resetting account balances:', error);
      throw error;
    }
  },

  // ✅ METTRE À JOUR TOUS LES SOLDES BASÉS SUR LES TRANSACTIONS
  async updateAllAccountBalances(userId: string = 'default-user'): Promise<void> {
    try {
      console.log('🔄 [accountService] Updating all account balances from transactions...');
      
      await this.ensureAccountsTableExists();

      const db = await getDatabase();
      const accounts = await this.getAllAccounts(userId);

      for (const account of accounts) {
        await this.recalculateAccountBalance(account.id, userId);
      }

      console.log('✅ [accountService] All account balances updated successfully');
    } catch (error) {
      console.error('❌ [accountService] Error updating all account balances:', error);
      throw error;
    }
  },

  // ✅ RECALCULER LE SOLDE D'UN COMPTE
  async recalculateAccountBalance(accountId: string, userId: string = 'default-user'): Promise<number> {
    try {
      await this.ensureAccountsTableExists();

      console.log('🧮 [accountService] Recalculating account balance:', accountId);
      
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
      
      const oldAccount = await this.getAccountById(accountId, userId);
      
      await db.runAsync(
        'UPDATE accounts SET balance = ? WHERE id = ? AND user_id = ?',
        [newBalance, accountId, userId]
      );
      
      console.log('📈 [accountService] Account balance recalculated:', {
        compte: oldAccount?.name || accountId,
        ancienSolde: oldAccount?.balance || 0,
        nouveauSolde: newBalance,
        nombreTransactions: transactions.length
      });
      
      return newBalance;
    } catch (error) {
      console.error('❌ [accountService] Error recalculating account balance:', error);
      throw error;
    }
  },

  // ✅ FILTRER LES COMPTES PAR TYPE
  async getAccountsByType(type: Account['type'], userId: string = 'default-user'): Promise<Account[]> {
    try {
      await this.ensureAccountsTableExists();

      const allAccounts = await this.getAllAccounts(userId);
      return allAccounts.filter(account => account.type === type);
    } catch (error) {
      console.error('❌ [accountService] Error getting accounts by type:', error);
      throw error;
    }
  },

  // ✅ COMPTES ACTIFS SEULEMENT
  async getActiveAccounts(userId: string = 'default-user'): Promise<Account[]> {
    try {
      await this.ensureAccountsTableExists();

      const allAccounts = await this.getAllAccounts(userId);
      return allAccounts.filter(account => account.isActive !== false);
    } catch (error) {
      console.error('❌ [accountService] Error getting active accounts:', error);
      throw error;
    }
  },

  // ✅ SOLDE TOTAL DE TOUS LES COMPTES
  async getTotalBalance(userId: string = 'default-user'): Promise<number> {
    try {
      await this.ensureAccountsTableExists();

      const accounts = await this.getAllAccounts(userId);
      return accounts.reduce((total, account) => total + account.balance, 0);
    } catch (error) {
      console.error('❌ [accountService] Error calculating total balance:', error);
      return 0;
    }
  },

  // ✅ SOLDE TOTAL PAR TYPE DE COMPTE
  async getTotalBalanceByType(type: Account['type'], userId: string = 'default-user'): Promise<number> {
    try {
      await this.ensureAccountsTableExists();

      const accounts = await this.getAccountsByType(type, userId);
      return accounts.reduce((total, account) => total + account.balance, 0);
    } catch (error) {
      console.error('❌ [accountService] Error calculating balance by type:', error);
      return 0;
    }
  },

  // ✅ STATISTIQUES DES COMPTES
  async getAccountStats(userId: string = 'default-user'): Promise<{
    totalAccounts: number;
    totalBalance: number;
    accountsByType: Record<string, number>;
    activeAccounts: number;
  }> {
    try {
      await this.ensureAccountsTableExists();

      const accounts = await this.getAllAccounts(userId);
      const activeAccounts = accounts.filter(account => account.isActive !== false);
      
      const accountsByType: Record<string, number> = {};
      accounts.forEach(account => {
        accountsByType[account.type] = (accountsByType[account.type] || 0) + 1;
      });

      return {
        totalAccounts: accounts.length,
        totalBalance: accounts.reduce((sum, acc) => sum + acc.balance, 0),
        accountsByType,
        activeAccounts: activeAccounts.length
      };
    } catch (error) {
      console.error('❌ [accountService] Error getting account stats:', error);
      throw error;
    }
  },

  // ✅ VÉRIFICATION DE L'EXISTENCE D'UN COMPTE
  async accountExists(id: string, userId: string = 'default-user'): Promise<boolean> {
    try {
      await this.ensureAccountsTableExists();

      const account = await this.getAccountById(id, userId);
      return account !== null;
    } catch (error) {
      console.error('❌ [accountService] Error checking account existence:', error);
      return false;
    }
  },

  // ✅ TRANSFERT ENTRE COMPTES
  async transferBetweenAccounts(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    userId: string = 'default-user'
  ): Promise<void> {
    try {
      await this.ensureAccountsTableExists();

      console.log('🔄 [accountService] Transfer between accounts:', {
        fromAccountId,
        toAccountId,
        amount
      });

      const fromAccount = await this.getAccountById(fromAccountId, userId);
      const toAccount = await this.getAccountById(toAccountId, userId);

      if (!fromAccount) {
        throw new Error('Compte source non trouvé');
      }

      if (!toAccount) {
        throw new Error('Compte destination non trouvé');
      }

      if (!fromAccount.isActive) {
        throw new Error('Le compte source est désactivé');
      }

      if (!toAccount.isActive) {
        throw new Error('Le compte destination est désactivé');
      }

      if (fromAccount.balance < amount) {
        throw new Error('Fonds insuffisants sur le compte source');
      }

      if (amount <= 0) {
        throw new Error('Le montant du transfert doit être positif');
      }

      const db = await getDatabase();
      
      await db.execAsync('BEGIN TRANSACTION');

      try {
        const newFromBalance = fromAccount.balance - amount;
        const newToBalance = toAccount.balance + amount;
        
        await db.runAsync(
          'UPDATE accounts SET balance = ? WHERE id = ? AND user_id = ?',
          [newFromBalance, fromAccountId, userId]
        );

        await db.runAsync(
          'UPDATE accounts SET balance = ? WHERE id = ? AND user_id = ?',
          [newToBalance, toAccountId, userId]
        );

        await db.execAsync('COMMIT');

        console.log('✅ [accountService] Transfer completed successfully:', {
          fromAccount: fromAccount.name,
          toAccount: toAccount.name,
          amount,
          newFromBalance,
          newToBalance
        });

      } catch (error) {
        await db.execAsync('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('❌ [accountService] Error in transfer between accounts:', error);
      throw error;
    }
  },

  // ✅ RECHERCHE DE COMPTES
  async searchAccounts(query: string, userId: string = 'default-user'): Promise<Account[]> {
    try {
      await this.ensureAccountsTableExists();

      const db = await getDatabase();
      
      const result = await db.getAllAsync(
        `SELECT * FROM accounts 
         WHERE user_id = ? AND (name LIKE ? OR type LIKE ?)
         ORDER BY name ASC`,
        [userId, `%${query}%`, `%${query}%`]
      ) as DatabaseAccount[];
      
      const accounts: Account[] = result.map((item) => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        type: item.type as Account['type'],
        balance: item.balance,
        currency: item.currency,
        color: item.color,
        icon: item.icon || this.getDefaultIconForType(item.type as Account['type']),
        isActive: Boolean(item.is_active),
        createdAt: item.created_at,
      }));
      
      return accounts;
    } catch (error) {
      console.error('❌ [accountService] Error searching accounts:', error);
      throw error;
    }
  },

  // ✅ OBTENIR LES TYPES DE COMPTES DISPONIBLES
  getAccountTypes(): AccountType[] {
    return ACCOUNT_TYPES;
  },

  // ✅ OBTENIR UN TYPE DE COMPTE PAR VALEUR
  getAccountTypeByValue(value: string): AccountType | undefined {
    return ACCOUNT_TYPES.find(type => type.value === value);
  },

  // ✅ ICÔNE PAR DÉFAUT POUR LE TYPE DE COMPTE
  getDefaultIconForType(type: Account['type']): string {
    const accountType = ACCOUNT_TYPES.find(t => t.value === type);
    return accountType?.icon || 'wallet';
  },

  // ✅ VALIDATION DES DONNÉES DE COMPTE
  validateAccountData(accountData: CreateAccountData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!accountData.name || accountData.name.trim().length === 0) {
      errors.push('Le nom du compte est requis');
    }

    if (!accountData.type || !ACCOUNT_TYPES.some(t => t.value === accountData.type)) {
      errors.push('Le type de compte est invalide');
    }

    if (typeof accountData.balance !== 'number' || isNaN(accountData.balance)) {
      errors.push('Le solde doit être un nombre valide');
    }

    if (!accountData.currency || accountData.currency.trim().length === 0) {
      errors.push('La devise est requise');
    }

    if (!accountData.color || accountData.color.trim().length === 0) {
      errors.push('La couleur est requise');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // ✅ GÉNÉRER UNE COULEUR ALÉATOIRE POUR UN NOUVEAU COMPTE
  generateRandomColor(): string {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#EC4899'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  // ✅ DIAGNOSTIC DE LA BASE DE DONNÉES
  async diagnoseDatabase(): Promise<{
    accountsTableExists: boolean;
    accountsCount: number;
    tableStructure: any[];
  }> {
    try {
      const db = await getDatabase();
      
      const accountsTableExists = !!(await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='accounts'"
      ));
      
      let accountsCount = 0;
      let tableStructure: any[] = [];
      
      if (accountsTableExists) {
        const accountsResult = await db.getFirstAsync(`SELECT COUNT(*) as count FROM accounts`) as { count: number };
        accountsCount = accountsResult?.count || 0;
        tableStructure = await db.getAllAsync(`PRAGMA table_info(accounts)`) as any[];
      }
      
      return {
        accountsTableExists,
        accountsCount,
        tableStructure
      };
    } catch (error) {
      console.error('❌ [accountService] Error diagnosing database:', error);
      throw error;
    }
  },

  // ✅ MIGRER LES COMPTES VERS MAD
  async migrateAccountsToMAD(userId: string = 'default-user'): Promise<void> {
    try {
      await this.ensureAccountsTableExists();
      
      const db = await getDatabase();
      const accounts = await this.getAllAccounts(userId);
      
      let migratedCount = 0;
      
      for (const account of accounts) {
        if (account.currency !== 'MAD') {
          await db.runAsync(
            'UPDATE accounts SET currency = ? WHERE id = ? AND user_id = ?',
            ['MAD', account.id, userId]
          );
          migratedCount++;
          console.log(`🔄 Compte migré vers MAD: ${account.name}`);
        }
      }
      
      if (migratedCount > 0) {
        console.log(`✅ ${migratedCount} comptes migrés vers MAD`);
      }
    } catch (error) {
      console.error('❌ Erreur migration comptes vers MAD:', error);
      throw error;
    }
  },

  // ✅ VÉRIFIER LA COHÉRENCE DES DEVISES
  async checkCurrencyConsistency(userId: string = 'default-user'): Promise<{
    isConsistent: boolean;
    madAccounts: number;
    otherCurrencyAccounts: number;
    details: { name: string; currency: string }[];
  }> {
    try {
      const accounts = await this.getAllAccounts(userId);
      
      const madAccounts = accounts.filter(acc => acc.currency === 'MAD');
      const otherAccounts = accounts.filter(acc => acc.currency !== 'MAD');
      
      return {
        isConsistent: otherAccounts.length === 0,
        madAccounts: madAccounts.length,
        otherCurrencyAccounts: otherAccounts.length,
        details: otherAccounts.map(acc => ({
          name: acc.name,
          currency: acc.currency
        }))
      };
    } catch (error) {
      console.error('❌ Erreur vérification cohérence devises:', error);
      throw error;
    }
  },

  // ✅ NOUVELLE MÉTHODE : Réparation d'urgence des soldes
  async emergencyFixAllBalances(userId: string = 'default-user'): Promise<void> {
    try {
      console.log('🛠️ [accountService] Réparation d\'urgence de tous les soldes...');
      
      const db = await getDatabase();
      const accounts = await this.getAllAccounts(userId);
      
      for (const account of accounts) {
        console.log(`🔧 Réparation du compte: ${account.name} (solde actuel: ${account.balance})`);
        
        // Réinitialiser le solde à 0 d'abord
        await db.runAsync(
          'UPDATE accounts SET balance = 0 WHERE id = ?',
          [account.id]
        );
        
        // Recalculer basé sur les transactions
        const newBalance = await this.recalculateAccountBalance(account.id, userId);
        
        console.log(`✅ Compte ${account.name} réparé: ${account.balance} → ${newBalance}`);
      }
      
      console.log('✅ [accountService] Tous les soldes ont été réparés');
    } catch (error) {
      console.error('❌ [accountService] Erreur réparation soldes:', error);
      throw error;
    }
  }
};

export default accountService;