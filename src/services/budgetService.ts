// src/services/budgetService.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { Budget, BudgetStats } from '../types';
import { getDatabase } from './database/sqlite';

interface DatabaseBudget {
  id: string;
  user_id: string;
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

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  accountId: string;
  description: string;
  date: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  createdAt: string;
}

// ✅ FONCTIONS UTILITAIRES SÉPARÉES
const getAllTransactions = async (userId: string = 'default-user'): Promise<Transaction[]> => {
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
       ORDER BY date DESC`,
      [userId]
    );
    return transactions || [];
  } catch (error) {
    console.error('❌ [budgetService] Erreur récupération transactions:', error);
    return [];
  }
};

const getAllCategories = async (userId: string = 'default-user'): Promise<Category[]> => {
  try {
    const db = await getDatabase();
    const categories = await db.getAllAsync<any>(
      `SELECT 
        id, 
        name, 
        type, 
        color, 
        icon, 
        created_at as createdAt
       FROM categories 
       WHERE user_id = ?`,
      [userId]
    );
    return categories || [];
  } catch (error) {
    console.error('❌ [budgetService] Erreur récupération catégories:', error);
    return [];
  }
};

const findCategoryMatch = (categories: Category[], categoryNameOrId: string): Category | undefined => {
  return categories.find(cat => 
    cat.name === categoryNameOrId || 
    cat.id === categoryNameOrId
  );
};

const calculateDateRange = (budget: Budget): { startDate: Date; endDate: Date } => {
  const startDate = new Date(budget.startDate);
  let endDate = budget.endDate ? new Date(budget.endDate) : new Date();

  if (!budget.endDate) {
    const now = new Date();
    switch (budget.period) {
      case 'monthly':
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        break;
      case 'yearly':
        endDate = new Date(startDate.getFullYear(), 11, 31);
        break;
      case 'weekly':
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        endDate = new Date();
    }
  }

  return { startDate, endDate };
};

const filterBudgetTransactions = (
  transactions: Transaction[],
  categories: Category[],
  budgetCategory: Category,
  startDate: Date,
  endDate: Date
): Transaction[] => {
  return transactions.filter(transaction => {
    if (transaction.type !== 'expense') return false;
    
    const transactionDate = new Date(transaction.date);
    const isInDateRange = transactionDate >= startDate && transactionDate <= endDate;
    
    const transactionCategory = findCategoryMatch(categories, transaction.category);
    const isCorrectCategory = transactionCategory && 
      (transactionCategory.id === budgetCategory.id || 
       transactionCategory.name === budgetCategory.name);
    
    return isCorrectCategory && isInDateRange;
  });
};

export const budgetService = {
  // ✅ MISE À JOUR SANS CYCLE DE DÉPENDANCES
  async updateBudgetSpentFromTransactions(userId: string = 'default-user'): Promise<void> {
    try {
      const db = await getDatabase();
      const budgets = await this.getAllBudgets(userId);
      const transactions = await getAllTransactions(userId);
      const categories = await getAllCategories(userId);
      
      console.log(`🔍 [budgetService] Recalcul de ${budgets.length} budgets avec ${transactions.length} transactions et ${categories.length} catégories`);
      
      for (const budget of budgets) {
        if (!budget.isActive) continue;
        
        // ✅ CORRECTION CRITIQUE : TROUVER LA CATÉGORIE CORRESPONDANTE
        const budgetCategory = findCategoryMatch(categories, budget.category);
        
        if (!budgetCategory) {
          console.log(`⚠️ [budgetService] Catégorie non trouvée pour le budget "${budget.name}": ${budget.category}`);
          continue;
        }
        
        console.log(`🔍 [budgetService] Budget "${budget.name}" - Catégorie: ${budgetCategory.name} (ID: ${budgetCategory.id})`);
        
        // ✅ CALCULER LA PLAGE DE DATES
        const { startDate, endDate } = calculateDateRange(budget);
        
        // ✅ FILTRER LES TRANSACTIONS AVEC MAPPING CORRECT
        const budgetTransactions = filterBudgetTransactions(
          transactions, 
          categories, 
          budgetCategory, 
          startDate, 
          endDate
        );

        const spent = budgetTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        // Mettre à jour seulement si changement significatif
        if (Math.abs(budget.spent - spent) > 0.01) {
          await db.runAsync(
            'UPDATE budgets SET spent = ? WHERE id = ? AND user_id = ?',
            [spent, budget.id, userId]
          );
          
          console.log(`💰 [budgetService] Budget "${budget.name}": ${spent}€ (${budgetTransactions.length} transactions)`);
        }
      }
      
      console.log('✅ [budgetService] Budgets mis à jour avec succès');
    } catch (error) {
      console.error('❌ [budgetService] Erreur mise à jour budgets:', error);
      throw error;
    }
  },

  // ✅ CRÉATION AVEC RECALCUL
  async createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'spent'>, userId: string = 'default-user'): Promise<string> {
    try {
      const db = await getDatabase();
      const id = `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();

      console.log('🔄 [budgetService] Création budget:', { id, ...budget });

      await db.runAsync(
        `INSERT INTO budgets (id, user_id, name, category, amount, spent, period, start_date, end_date, is_active, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          budget.name,
          budget.category,
          budget.amount,
          0,
          budget.period,
          budget.startDate,
          budget.endDate || null,
          budget.isActive ? 1 : 0,
          createdAt
        ]
      );
      
      // Recalcul immédiat
      await this.recalculateBudget(id, userId);
      
      console.log('✅ [budgetService] Budget créé avec succès:', id);
      return id;
    } catch (error) {
      console.error('❌ [budgetService] Erreur création budget:', error);
      throw error;
    }
  },

  // ✅ RECALCUL AVEC MAPPING CATÉGORIES
  async recalculateBudget(budgetId: string, userId: string = 'default-user'): Promise<void> {
    try {
      const budget = await this.getBudgetById(budgetId, userId);
      if (!budget) {
        console.log('❌ [budgetService] Budget non trouvé:', budgetId);
        return;
      }

      const transactions = await getAllTransactions(userId);
      const categories = await getAllCategories(userId);
      
      // ✅ CORRECTION : TROUVER LA CATÉGORIE CORRESPONDANTE
      const budgetCategory = findCategoryMatch(categories, budget.category);
      
      if (!budgetCategory) {
        console.log(`⚠️ [budgetService] Catégorie non trouvée pour le recalcul: ${budget.category}`);
        return;
      }

      // ✅ CALCULER LA PLAGE DE DATES
      const { startDate, endDate } = calculateDateRange(budget);

      // ✅ FILTRER LES TRANSACTIONS
      const budgetTransactions = filterBudgetTransactions(
        transactions, 
        categories, 
        budgetCategory, 
        startDate, 
        endDate
      );

      const spent = budgetTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const db = await getDatabase();
      await db.runAsync(
        'UPDATE budgets SET spent = ? WHERE id = ? AND user_id = ?',
        [spent, budgetId, userId]
      );
      
      console.log(`🔄 [budgetService] Budget "${budget.name}" recalculé: ${spent}€ (${budgetTransactions.length} transactions)`);
    } catch (error) {
      console.error('❌ [budgetService] Erreur recalcul budget:', error);
      throw error;
    }
  },

  // ✅ MÉTHODES EXISTANTES AMÉLIORÉES
  async getAllBudgets(userId: string = 'default-user'): Promise<Budget[]> {
    try {
      const db = await getDatabase();
      
      const result = await db.getAllAsync(
        `SELECT * FROM budgets WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
      ) as DatabaseBudget[];
      
      const budgets: Budget[] = result.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        amount: item.amount,
        spent: item.spent,
        period: item.period as 'daily' | 'weekly' | 'monthly' | 'yearly',
        startDate: item.start_date,
        endDate: item.end_date || undefined,
        isActive: item.is_active === 1,
        createdAt: item.created_at,
      }));
      
      console.log(`✅ [budgetService] ${budgets.length} budgets chargés`);
      return budgets;
    } catch (error) {
      console.error('❌ [budgetService] Erreur chargement budgets:', error);
      throw error;
    }
  },

  async getBudgetById(id: string, userId: string = 'default-user'): Promise<Budget | null> {
    try {
      const db = await getDatabase();
      
      const result = await db.getFirstAsync(
        `SELECT * FROM budgets WHERE id = ? AND user_id = ?`,
        [id, userId]
      ) as DatabaseBudget | null;
      
      if (result) {
        const budget: Budget = {
          id: result.id,
          name: result.name,
          category: result.category,
          amount: result.amount,
          spent: result.spent,
          period: result.period as 'daily' | 'weekly' | 'monthly' | 'yearly',
          startDate: result.start_date,
          endDate: result.end_date || undefined,
          isActive: result.is_active === 1,
          createdAt: result.created_at,
        };
        return budget;
      }
      return null;
    } catch (error) {
      console.error('❌ [budgetService] Erreur budget par ID:', error);
      throw error;
    }
  },

  async updateBudget(id: string, updates: Partial<Budget>, userId: string = 'default-user'): Promise<void> {
    try {
      const db = await getDatabase();
      
      const validUpdates: Partial<any> = {};
      
      if (updates.name !== undefined) validUpdates.name = updates.name;
      if (updates.category !== undefined) validUpdates.category = updates.category;
      if (updates.amount !== undefined) validUpdates.amount = updates.amount;
      if (updates.spent !== undefined) validUpdates.spent = updates.spent;
      if (updates.period !== undefined) validUpdates.period = updates.period;
      if (updates.startDate !== undefined) validUpdates.start_date = updates.startDate;
      if (updates.endDate !== undefined) validUpdates.end_date = updates.endDate;
      if (updates.isActive !== undefined) validUpdates.is_active = updates.isActive ? 1 : 0;
      
      const fields = Object.keys(validUpdates);
      const values = Object.values(validUpdates);
      
      if (fields.length === 0) return;
      
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const query = `UPDATE budgets SET ${setClause} WHERE id = ? AND user_id = ?`;
      
      await db.runAsync(query, [...values, id, userId]);
      
      // Recalcul si nécessaire
      const needsRecalculation = updates.category || updates.startDate || updates.endDate || updates.period;
      if (needsRecalculation) {
        await this.recalculateBudget(id, userId);
      }
      
      console.log('✅ [budgetService] Budget mis à jour:', id);
    } catch (error) {
      console.error('❌ [budgetService] Erreur mise à jour budget:', error);
      throw error;
    }
  },

  async deleteBudget(id: string, userId: string = 'default-user'): Promise<void> {
    try {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id, userId]);
      console.log('✅ [budgetService] Budget supprimé:', id);
    } catch (error) {
      console.error('❌ [budgetService] Erreur suppression budget:', error);
      throw error;
    }
  },

  // ✅ STATISTIQUES BUDGETS
  async getBudgetStats(userId: string = 'default-user'): Promise<BudgetStats> {
    try {
      const budgets = await this.getAllBudgets(userId);
      
      const totalBudgets = budgets.length;
      const activeBudgets = budgets.filter(budget => budget.isActive).length;
      const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
      const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
      const averageUsage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      const stats: BudgetStats = {
        totalBudgets,
        activeBudgets,
        totalSpent,
        totalBudget,
        averageUsage,
      };
      
      console.log('📊 [budgetService] Statistiques budgets:', stats);
      return stats;
    } catch (error) {
      console.error('❌ [budgetService] Erreur statistiques budgets:', error);
      throw error;
    }
  },

  // ✅ NOUVELLE MÉTHODE : OBTENIR LES CATÉGORIES DISPONIBLES POUR BUDGETS
  async getAvailableCategoriesForBudgets(userId: string = 'default-user'): Promise<{id: string, name: string}[]> {
    try {
      const categories = await getAllCategories(userId);
      const expenseCategories = categories.filter(cat => cat.type === 'expense');
      
      return expenseCategories.map(cat => ({
        id: cat.id,
        name: cat.name
      }));
    } catch (error) {
      console.error('❌ [budgetService] Erreur récupération catégories:', error);
      return [];
    }
  },

  // ✅ NOUVELLE MÉTHODE : VÉRIFIER SI UN BUDGET EXISTE POUR UNE CATÉGORIE
  async hasBudgetForCategory(categoryNameOrId: string, userId: string = 'default-user'): Promise<boolean> {
    try {
      const budgets = await this.getAllBudgets(userId);
      const categories = await getAllCategories(userId);
      
      // Trouver la catégorie correspondante
      const category = findCategoryMatch(categories, categoryNameOrId);
      
      if (!category) return false;
      
      return budgets.some(budget => 
        budget.isActive && 
        (budget.category === category.name || budget.category === category.id)
      );
    } catch (error) {
      console.error('❌ [budgetService] Erreur vérification budget catégorie:', error);
      return false;
    }
  },

  // ✅ NOUVELLE MÉTHODE : RECALCULER TOUS LES BUDGETS
  async recalculateAllBudgets(userId: string = 'default-user'): Promise<void> {
    try {
      console.log('🔄 [budgetService] Recalcul de tous les budgets...');
      
      const budgets = await this.getAllBudgets(userId);
      let updatedCount = 0;
      
      for (const budget of budgets) {
        if (budget.isActive) {
          await this.recalculateBudget(budget.id, userId);
          updatedCount++;
        }
      }
      
      console.log(`✅ [budgetService] ${updatedCount} budgets recalculés`);
    } catch (error) {
      console.error('❌ [budgetService] Erreur recalcul budgets:', error);
      throw error;
    }
  },

  // ✅ NOUVELLE MÉTHODE : OBTENIR LES BUDGETS DÉPASSÉS
  async getOverBudgetBudgets(userId: string = 'default-user'): Promise<Budget[]> {
    try {
      const budgets = await this.getAllBudgets(userId);
      return budgets.filter(budget => 
        budget.isActive && budget.spent > budget.amount
      );
    } catch (error) {
      console.error('❌ [budgetService] Erreur budgets dépassés:', error);
      return [];
    }
  },

  // ✅ NOUVELLE MÉTHODE : OBTENIR LES BUDGETS PROCHES DE LA LIMITE (90%+)
  async getNearLimitBudgets(userId: string = 'default-user'): Promise<Budget[]> {
    try {
      const budgets = await this.getAllBudgets(userId);
      return budgets.filter(budget => {
        if (!budget.isActive || budget.amount === 0) return false;
        const usagePercentage = (budget.spent / budget.amount) * 100;
        return usagePercentage >= 90 && usagePercentage <= 100;
      });
    } catch (error) {
      console.error('❌ [budgetService] Erreur budgets proches limite:', error);
      return [];
    }
  }
};

export default budgetService;