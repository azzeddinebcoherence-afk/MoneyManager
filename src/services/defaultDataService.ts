// src/services/defaultDataService.ts
import { getDatabase } from './database/sqlite';

export const defaultDataService = {
  // Insérer les données par défaut
  insertDefaultData: async (userId: string = 'default-user') => {
    const db = await getDatabase();
    
    try {
      console.log('📝 Insertion des données par défaut...');

      // ===== COMPTES PAR DÉFAUT =====
      const defaultAccounts = [
        {
          id: 'default_acc_1', user_id: userId, name: 'Espèces', type: 'cash', 
          balance: 1250.50, currency: 'EUR', color: '#10B981', created_at: new Date().toISOString()
        },
        {
          id: 'default_acc_2', user_id: userId, name: 'Compte Courant', type: 'bank', 
          balance: 4500.75, currency: 'EUR', color: '#3B82F6', created_at: new Date().toISOString()
        },
        {
          id: 'default_acc_3', user_id: userId, name: 'Épargne', type: 'savings', 
          balance: 12000.00, currency: 'EUR', color: '#8B5CF6', created_at: new Date().toISOString()
        }
      ];

      for (const account of defaultAccounts) {
        await db.runAsync(
          `INSERT OR REPLACE INTO accounts (id, user_id, name, type, balance, currency, color, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [account.id, account.user_id, account.name, account.type, account.balance, 
           account.currency, account.color, account.created_at]
        );
      }
      console.log('✅ Comptes par défaut insérés:', defaultAccounts.length);

      // ===== CATÉGORIES PAR DÉFAUT : DÉSACTIVÉES =====
      // 🚫 DÉSACTIVÉ : Les anciennes catégories par défaut sont remplacées
      // par les nouvelles 20 catégories + 58 sous-catégories dans categoryService.ts
      console.log('🚫 Catégories par défaut DÉSACTIVÉES - utilisation des 20 nouvelles catégories depuis categoryService');

      // ===== TRANSACTIONS PAR DÉFAUT =====
      const defaultTransactions = [
        // Revenus
        {
          id: 'default_trx_1', user_id: userId, amount: 8000.00, type: 'income', category: 'Salaire',
          account_id: 'default_acc_2', description: 'Salaire octobre 2025', date: '2025-10-01', created_at: new Date().toISOString()
        },
        {
          id: 'default_trx_2', user_id: userId, amount: 500.00, type: 'income', category: 'Prime',
          account_id: 'default_acc_2', description: 'Prime de performance', date: '2025-10-15', created_at: new Date().toISOString()
        },
        
        // Dépenses
        {
          id: 'default_trx_3', user_id: userId, amount: 350.00, type: 'expense', category: 'Alimentation',
          account_id: 'default_acc_1', description: 'Courses mensuelles', date: '2025-10-05', created_at: new Date().toISOString()
        },
        {
          id: 'default_trx_4', user_id: userId, amount: 120.00, type: 'expense', category: 'Transport',
          account_id: 'default_acc_1', description: 'Essence voiture', date: '2025-10-10', created_at: new Date().toISOString()
        }
      ];

      for (const transaction of defaultTransactions) {
        await db.runAsync(
          `INSERT OR REPLACE INTO transactions (id, user_id, amount, type, category, account_id, description, date, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [transaction.id, transaction.user_id, transaction.amount, transaction.type,
           transaction.category, transaction.account_id, transaction.description,
           transaction.date, transaction.created_at]
        );
      }
      console.log('✅ Transactions par défaut insérées:', defaultTransactions.length);

      console.log('🎉 DONNÉES PAR DÉFAUT INSÉRÉES AVEC SUCCÈS !');
      
    } catch (error) {
      console.error('❌ Erreur insertion données par défaut:', error);
      throw error;
    }
  },

  // Supprimer TOUTES les données par défaut
  deleteAllDefaultData: async (userId: string = 'default-user') => {
    const db = await getDatabase();
    
    try {
      console.log('🗑️ Suppression de toutes les données par défaut...');

      // Supprimer les transactions par défaut
      await db.runAsync(
        `DELETE FROM transactions WHERE user_id = ? AND id LIKE 'default_%'`,
        [userId]
      );
      console.log('✅ Transactions par défaut supprimées');

      // Supprimer les catégories par défaut
      await db.runAsync(
        `DELETE FROM categories WHERE user_id = ? AND id LIKE 'default_%'`,
        [userId]
      );
      console.log('✅ Catégories par défaut supprimées');

      // Supprimer les comptes par défaut
      await db.runAsync(
        `DELETE FROM accounts WHERE user_id = ? AND id LIKE 'default_%'`,
        [userId]
      );
      console.log('✅ Comptes par défaut supprimés');

      console.log('🧹 TOUTES LES DONNÉES PAR DÉFAUT ONT ÉTÉ SUPPRIMÉES !');
      
    } catch (error) {
      console.error('❌ Erreur suppression données par défaut:', error);
      throw error;
    }
  },

  // Vérifier si des données par défaut existent
  hasDefaultData: async (userId: string = 'default-user'): Promise<boolean> => {
    const db = await getDatabase();
    
    try {
      const result = await db.getFirstAsync(
        `SELECT 1 FROM accounts WHERE user_id = ? AND id LIKE 'default_%' LIMIT 1`,
        [userId]
      );
      
      return !!result;
    } catch (error) {
      console.error('❌ Erreur vérification données par défaut:', error);
      return false;
    }
  },

  // Réinitialiser les données par défaut (supprimer + recréer)
  resetDefaultData: async (userId: string = 'default-user') => {
    await defaultDataService.deleteAllDefaultData(userId);
    await defaultDataService.insertDefaultData(userId);
  }
};