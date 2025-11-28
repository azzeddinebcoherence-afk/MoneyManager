// src/utils/emergencyDatabaseFix.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { getDatabase } from '../services/database/sqlite';

export const emergencyDatabaseFix = {
  async fixAllIssues(): Promise<{ success: boolean; message: string; fixes: string[] }> {
    const fixes: string[] = [];
    
    try {
      console.log('🚨 [EMERGENCY FIX] Début réparation complète base de données...');
      const db = await getDatabase();

      // 1. Vérifier et réparer la table accounts
      fixes.push(...await this.fixAccountsTable());
      
      // 2. Vérifier et réparer la table transactions
      fixes.push(...await this.fixTransactionsTable());
      
      // 3. Recalculer tous les soldes
      fixes.push(...await this.recalculateAllBalances());
      
      console.log('✅ [EMERGENCY FIX] Réparation terminée avec succès');
      return { 
        success: true, 
        message: 'Réparation complète terminée avec succès',
        fixes 
      };
      
    } catch (error) {
      console.error('❌ [EMERGENCY FIX] Erreur pendant la réparation:', error);
      return { 
        success: false, 
        message: `Erreur réparation: ${error}`,
        fixes 
      };
    }
  },

  async fixAccountsTable(): Promise<string[]> {
    const fixes: string[] = [];
    const db = await getDatabase();
    
    try {
      // Vérifier la structure de la table accounts
      const tableInfo = await db.getAllAsync(`PRAGMA table_info(accounts)`) as any[];
      const accountColumns = tableInfo.map(col => col.name);
      
      // Colonnes requises
      const requiredColumns = ['id', 'user_id', 'name', 'type', 'balance', 'currency', 'color', 'icon', 'is_active', 'created_at'];
      
      for (const column of requiredColumns) {
        if (!accountColumns.includes(column)) {
          console.log(`🛠️ [EMERGENCY FIX] Ajout colonne manquante: ${column}`);
          
          let columnDefinition = '';
          switch (column) {
            case 'id': columnDefinition = 'TEXT PRIMARY KEY NOT NULL'; break;
            case 'user_id': columnDefinition = 'TEXT NOT NULL DEFAULT \"default-user\"'; break;
            case 'name': columnDefinition = 'TEXT NOT NULL'; break;
            case 'type': columnDefinition = 'TEXT NOT NULL'; break;
            case 'balance': columnDefinition = 'REAL NOT NULL DEFAULT 0'; break;
            case 'currency': columnDefinition = 'TEXT NOT NULL DEFAULT \"MAD\"'; break;
            case 'color': columnDefinition = 'TEXT NOT NULL'; break;
            case 'icon': columnDefinition = 'TEXT DEFAULT \"wallet\"'; break;
            case 'is_active': columnDefinition = 'INTEGER NOT NULL DEFAULT 1'; break;
            case 'created_at': columnDefinition = 'TEXT NOT NULL'; break;
          }
          
          await db.execAsync(`ALTER TABLE accounts ADD COLUMN ${column} ${columnDefinition}`);
          fixes.push(`Colonne ${column} ajoutée`);
        }
      }

      // Vérifier les colonnes problématiques
      const problematicColumns = accountColumns.filter(col => col === 'userId');
      if (problematicColumns.length > 0) {
        console.log('🛠️ [EMERGENCY FIX] Suppression colonnes problématiques...');
        
        // Créer une table temporaire
        await db.execAsync(`
          CREATE TABLE accounts_temp (
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
        
        // Copier les données
        await db.execAsync(`
          INSERT INTO accounts_temp (id, user_id, name, type, balance, currency, color, icon, is_active, created_at)
          SELECT 
            id,
            COALESCE(user_id, 'default-user') as user_id,
            name,
            type,
            COALESCE(balance, 0) as balance,
            COALESCE(currency, 'MAD') as currency,
            color,
            COALESCE(icon, 'wallet') as icon,
            COALESCE(is_active, 1) as is_active,
            COALESCE(created_at, datetime('now')) as created_at
          FROM accounts
        `);
        
        // Remplacer l'ancienne table
        await db.execAsync('DROP TABLE accounts');
        await db.execAsync('ALTER TABLE accounts_temp RENAME TO accounts');
        
        fixes.push('Structure table accounts corrigée');
      }
      
      // Mettre à jour les user_id manquants
      const result = await db.runAsync(`UPDATE accounts SET user_id = 'default-user' WHERE user_id IS NULL`);
      if (result && 'changes' in result && result.changes > 0) {
        fixes.push(`${result.changes} user_id mis à jour`);
      }
      
    } catch (error) {
      console.error('❌ [EMERGENCY FIX] Erreur réparation accounts:', error);
    }
    
    return fixes;
  },

  async fixTransactionsTable(): Promise<string[]> {
    const fixes: string[] = [];
    const db = await getDatabase();
    
    try {
      // Vérifier la structure de la table transactions
      const tableInfo = await db.getAllAsync(`PRAGMA table_info(transactions)`) as any[];
      const transactionColumns = tableInfo.map(col => col.name);
      
      // Colonnes requises pour le système unifié
      const requiredColumns = [
        'id', 'user_id', 'amount', 'type', 'category', 'account_id', 
        'description', 'date', 'created_at', 'is_recurring', 'recurrence_type',
        'recurrence_end_date', 'parent_transaction_id', 'next_occurrence'
      ];
      
      for (const column of requiredColumns) {
        if (!transactionColumns.includes(column)) {
          console.log(`🛠️ [EMERGENCY FIX] Ajout colonne manquante: ${column}`);
          
          let columnDefinition = '';
          switch (column) {
            case 'id': columnDefinition = 'TEXT PRIMARY KEY NOT NULL'; break;
            case 'user_id': columnDefinition = 'TEXT NOT NULL DEFAULT \"default-user\"'; break;
            case 'amount': columnDefinition = 'REAL NOT NULL'; break;
            case 'type': columnDefinition = 'TEXT NOT NULL'; break;
            case 'category': columnDefinition = 'TEXT NOT NULL'; break;
            case 'account_id': columnDefinition = 'TEXT NOT NULL'; break;
            case 'description': columnDefinition = 'TEXT'; break;
            case 'date': columnDefinition = 'TEXT NOT NULL'; break;
            case 'created_at': columnDefinition = 'TEXT NOT NULL'; break;
            case 'is_recurring': columnDefinition = 'INTEGER DEFAULT 0'; break;
            case 'recurrence_type': columnDefinition = 'TEXT'; break;
            case 'recurrence_end_date': columnDefinition = 'TEXT'; break;
            case 'parent_transaction_id': columnDefinition = 'TEXT'; break;
            case 'next_occurrence': columnDefinition = 'TEXT'; break;
          }
          
          await db.execAsync(`ALTER TABLE transactions ADD COLUMN ${column} ${columnDefinition}`);
          fixes.push(`Colonne ${column} ajoutée à transactions`);
        }
      }
      
      // Mettre à jour les user_id manquants
      const result = await db.runAsync(`UPDATE transactions SET user_id = 'default-user' WHERE user_id IS NULL`);
      if (result && 'changes' in result && result.changes > 0) {
        fixes.push(`${result.changes} user_id transactions mis à jour`);
      }
      
    } catch (error) {
      console.error('❌ [EMERGENCY FIX] Erreur réparation transactions:', error);
    }
    
    return fixes;
  },

  async recalculateAllBalances(): Promise<string[]> {
    const fixes: string[] = [];
    const db = await getDatabase();
    
    try {
      console.log('🔄 [EMERGENCY FIX] Recalcul de tous les soldes...');
      
      // Récupérer tous les comptes
      const accounts = await db.getAllAsync(`SELECT id, user_id FROM accounts`) as any[];
      
      for (const account of accounts) {
        try {
          // Calculer le solde basé sur les transactions
          const today = new Date().toISOString().split('T')[0];
          const transactions = await db.getAllAsync(`
            SELECT type, amount FROM transactions 
            WHERE account_id = ? AND user_id = ? 
              AND (is_recurring = 0 OR is_recurring IS NULL)
              AND date <= ?
          `, [account.id, account.user_id, today]) as any[];
          
          let calculatedBalance = 0;
          transactions.forEach((transaction: any) => {
            const amount = Number(transaction.amount) || 0;
            // Les montants sont déjà signés : positifs = revenus, négatifs = dépenses
            calculatedBalance += amount;
          });
          
          // Mettre à jour le solde du compte
          await db.runAsync(
            'UPDATE accounts SET balance = ? WHERE id = ? AND user_id = ?',
            [calculatedBalance, account.id, account.user_id]
          );
          
          console.log(`💰 Compte ${account.id}: solde recalculé à ${calculatedBalance}`);
          
        } catch (error) {
          console.error(`❌ Erreur recalcul solde compte ${account.id}:`, error);
        }
      }
      
      fixes.push('Soldes recalculés pour tous les comptes');
      
    } catch (error) {
      console.error('❌ [EMERGENCY FIX] Erreur recalcul soldes:', error);
    }
    
    return fixes;
  },

  async verifyDatabase(): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      const db = await getDatabase();
      
      // Vérifier la table accounts
      const accountsStructure = await db.getAllAsync(`PRAGMA table_info(accounts)`) as any[];
      const accountColumns = accountsStructure.map(col => col.name);
      
      const requiredAccountColumns = ['id', 'user_id', 'name', 'type', 'balance', 'currency', 'color', 'icon', 'is_active', 'created_at'];
      const missingAccountColumns = requiredAccountColumns.filter(col => !accountColumns.includes(col));
      
      if (missingAccountColumns.length > 0) {
        issues.push(`Colonnes manquantes dans accounts: ${missingAccountColumns.join(', ')}`);
      }
      
      // Vérifier la table transactions
      const transactionsStructure = await db.getAllAsync(`PRAGMA table_info(transactions)`) as any[];
      const transactionColumns = transactionsStructure.map(col => col.name);
      
      const requiredTransactionColumns = ['id', 'user_id', 'amount', 'type', 'category', 'account_id', 'description', 'date', 'created_at'];
      const missingTransactionColumns = requiredTransactionColumns.filter(col => !transactionColumns.includes(col));
      
      if (missingTransactionColumns.length > 0) {
        issues.push(`Colonnes manquantes dans transactions: ${missingTransactionColumns.join(', ')}`);
      }
      
      // Vérifier les données
      const accountsWithoutUserId = await db.getAllAsync(`SELECT COUNT(*) as count FROM accounts WHERE user_id IS NULL`) as any[];
      if (accountsWithoutUserId[0].count > 0) {
        issues.push(`${accountsWithoutUserId[0].count} comptes sans user_id`);
      }
      
      const transactionsWithoutUserId = await db.getAllAsync(`SELECT COUNT(*) as count FROM transactions WHERE user_id IS NULL`) as any[];
      if (transactionsWithoutUserId[0].count > 0) {
        issues.push(`${transactionsWithoutUserId[0].count} transactions sans user_id`);
      }
      
      return {
        isValid: issues.length === 0,
        issues
      };
      
    } catch (error) {
      issues.push(`Erreur vérification: ${error}`);
      return { isValid: false, issues };
    }
  }
};