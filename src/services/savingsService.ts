// src/services/savingsService.ts - VERSION COMPLÈTEMENT CORRIGÉE
import {
  CreateSavingsGoalData,
  SavingsContribution,
  SavingsGoal,
  SavingsStats,
  UpdateSavingsGoalData
} from '../types/Savings';
import { accountService } from './accountService';
import { getDatabase } from './database/sqlite';
import { transactionService } from './transactionService';
import { transferService } from './transferService';

interface DatabaseSavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  monthly_contribution: number;
  category: string;
  color: string;
  icon: string;
  is_completed: number;
  created_at: string;
  savings_account_id?: string;
  contribution_account_id?: string;
}

interface DatabaseSavingsContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  date: string;
  created_at: string;
  from_account_id?: string;
}

export const savingsService = {
  // ✅ CORRECTION : S'assurer que la table contributions a la bonne structure
  async ensureContributionsTableExists(): Promise<void> {
    try {
      const db = await getDatabase();
      
      const tableExists = await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='savings_contributions'"
      );
      
      if (!tableExists) {
        console.log('🛠️ [savingsService] Creating savings_contributions table...');
        
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS savings_contributions (
            id TEXT PRIMARY KEY NOT NULL,
            goal_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            created_at TEXT NOT NULL,
            from_account_id TEXT,
            FOREIGN KEY (goal_id) REFERENCES savings_goals (id) ON DELETE CASCADE
          );
        `);
        
        console.log('✅ [savingsService] savings_contributions table created successfully');
      } else {
        // ✅ VÉRIFIER ET CORRIGER LA STRUCTURE EXISTANTE
        console.log('🔍 [savingsService] Checking savings_contributions table structure...');
        
        const tableInfo = await db.getAllAsync(`PRAGMA table_info(savings_contributions)`) as any[];
        
        const requiredColumns = [
          { name: 'id', type: 'TEXT' },
          { name: 'goal_id', type: 'TEXT' },
          { name: 'user_id', type: 'TEXT' },
          { name: 'amount', type: 'REAL' },
          { name: 'date', type: 'TEXT' },
          { name: 'created_at', type: 'TEXT' },
          { name: 'from_account_id', type: 'TEXT' }
        ];
        
        for (const requiredColumn of requiredColumns) {
          const columnExists = tableInfo.some(col => col.name === requiredColumn.name);
          if (!columnExists) {
            console.log(`🛠️ [savingsService] Adding ${requiredColumn.name} column to savings_contributions...`);
            
            try {
              await db.execAsync(`
                ALTER TABLE savings_contributions ADD COLUMN ${requiredColumn.name} ${requiredColumn.type};
              `);
              console.log(`✅ [savingsService] ${requiredColumn.name} column added successfully`);
            } catch (alterError) {
              console.warn(`⚠️ [savingsService] Could not add column ${requiredColumn.name}:`, alterError);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ [savingsService] Error ensuring contributions table exists:', error);
      throw error;
    }
  },

  // ✅ MÉTHODE ADD CONTRIBUTION COMPLÈTEMENT CORRIGÉE
  async addContribution(goalId: string, amount: number, fromAccountId?: string, userId: string = 'default-user'): Promise<string> {
    try {
      const db = await getDatabase();
      const id = `contrib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const date = new Date().toISOString().split('T')[0];
      const createdAt = new Date().toISOString();

      console.log('🔄 [savingsService] Adding contribution:', { 
        goalId, 
        amount, 
        fromAccountId,
        userId 
      });
      
      const goal = await this.getSavingsGoalById(goalId, userId);
      if (!goal) {
        throw new Error('Objectif d\'épargne non trouvé');
      }

      let effectiveFromAccountId = fromAccountId;
      let effectiveSavingsAccountId = goal.savingsAccountId;

      // Trouver un compte source automatiquement si non spécifié
      if (!effectiveFromAccountId) {
        const allAccounts = await accountService.getAllAccounts();
        const sourceAccounts = allAccounts.filter(acc => 
          acc.type !== 'savings' && acc.balance >= amount
        );
        
        if (sourceAccounts.length > 0) {
          effectiveFromAccountId = sourceAccounts[0].id;
          console.log('💰 [savingsService] Auto-assigned from account:', effectiveFromAccountId);
        } else {
          throw new Error('Aucun compte source disponible avec suffisamment de fonds');
        }
      }

      // Trouver un compte d'épargne automatiquement si non spécifié
      if (!effectiveSavingsAccountId) {
        const savingsAccounts = await accountService.getAccountsByType('savings');
        if (savingsAccounts.length > 0) {
          effectiveSavingsAccountId = savingsAccounts[0].id;
          await this.updateSavingsGoal(goalId, { savingsAccountId: effectiveSavingsAccountId }, userId);
          console.log('💰 [savingsService] Auto-assigned savings account:', effectiveSavingsAccountId);
        } else {
          throw new Error('Aucun compte d\'épargne disponible');
        }
      }

      const fromAccount = await accountService.getAccountById(effectiveFromAccountId);
      if (!fromAccount) {
        throw new Error('Compte source non trouvé');
      }

      if (fromAccount.balance < amount) {
        throw new Error(`Solde insuffisant sur ${fromAccount.name}. Solde disponible: ${fromAccount.balance}`);
      }

      console.log('💰 [savingsService] Creating transfer...', {
        fromAccountId: effectiveFromAccountId,
        toAccountId: effectiveSavingsAccountId,
        amount
      });

      // ✅ CORRECTION : S'assurer que la table existe avant d'ajouter
      await this.ensureContributionsTableExists();

      // Créer le transfert
      await transferService.executeSavingsTransfer({
        fromAccountId: effectiveFromAccountId,
        toAccountId: effectiveSavingsAccountId,
        amount: amount,
        description: `Épargne: ${goal.name}`,
        date: date,
      }, goal.name, userId);
      
      console.log('✅ [savingsService] Transfer created successfully');

      // Enregistrer la contribution
      await db.runAsync(
        `INSERT INTO savings_contributions (id, goal_id, user_id, amount, date, created_at, from_account_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, goalId, userId, amount, date, createdAt, effectiveFromAccountId]
      );

      // Mettre à jour le montant actuel de l'objectif
      const newAmount = goal.currentAmount + amount;
      const isCompleted = newAmount >= goal.targetAmount;

      await db.runAsync(
        `UPDATE savings_goals SET current_amount = ?, is_completed = ? WHERE id = ? AND user_id = ?`,
        [newAmount, isCompleted ? 1 : 0, goalId, userId]
      );

      console.log('✅ [savingsService] Contribution added successfully');
      return id;
    } catch (error) {
      console.error('❌ [savingsService] Error in addContribution:', error);
      throw error;
    }
  },

  // === MÉTHODES EXISTANTES AVEC CORRECTIONS MINIMALES ===

  async createSavingsGoal(goalData: CreateSavingsGoalData, userId: string = 'default-user'): Promise<string> {
    try {
      const db = await getDatabase();
      const id = `savings_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();

      console.log('🔄 [savingsService] Creating savings goal:', { id, ...goalData });
      
      let savingsAccountId = goalData.savingsAccountId;
      if (!savingsAccountId) {
        const savingsAccounts = await accountService.getAccountsByType('savings');
        if (savingsAccounts.length > 0) {
          savingsAccountId = savingsAccounts[0].id;
          console.log('💰 [savingsService] Auto-assigned savings account:', savingsAccountId);
        }
      }
      
      await db.runAsync(
        `INSERT INTO savings_goals (
          id, user_id, name, target_amount, current_amount, target_date, 
          monthly_contribution, category, color, icon, is_completed, created_at,
          savings_account_id, contribution_account_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          goalData.name,
          goalData.targetAmount,
          0,
          goalData.targetDate,
          goalData.monthlyContribution,
          goalData.category,
          goalData.color,
          goalData.icon,
          0,
          createdAt,
          savingsAccountId || null,
          goalData.contributionAccountId || null
        ]
      );
      
      console.log('✅ [savingsService] Savings goal created successfully');
      return id;
    } catch (error) {
      console.error('❌ [savingsService] Error in createSavingsGoal:', error);
      throw error;
    }
  },

  async getAllSavingsGoals(userId: string = 'default-user'): Promise<SavingsGoal[]> {
    try {
      const db = await getDatabase();
      
      const result = await db.getAllAsync(
        `SELECT * FROM savings_goals WHERE user_id = ? ORDER BY 
         CASE 
           WHEN is_completed = 1 THEN 2 
           ELSE 1 
         END, target_date ASC`,
        [userId]
      ) as DatabaseSavingsGoal[];
      
      const goals: SavingsGoal[] = result.map((item) => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        targetAmount: item.target_amount,
        currentAmount: item.current_amount,
        targetDate: item.target_date,
        monthlyContribution: item.monthly_contribution,
        category: item.category as SavingsGoal['category'],
        color: item.color,
        icon: item.icon,
        isCompleted: Boolean(item.is_completed),
        createdAt: item.created_at,
        savingsAccountId: item.savings_account_id || undefined,
        contributionAccountId: item.contribution_account_id || undefined,
      }));
      
      return goals;
    } catch (error) {
      console.error('❌ [savingsService] Error in getAllSavingsGoals:', error);
      throw error;
    }
  },

  async getSavingsGoalById(id: string, userId: string = 'default-user'): Promise<SavingsGoal | null> {
    try {
      const db = await getDatabase();
      
      const result = await db.getFirstAsync(
        `SELECT * FROM savings_goals WHERE id = ? AND user_id = ?`,
        [id, userId]
      ) as DatabaseSavingsGoal | null;
      
      if (result) {
        const goal: SavingsGoal = {
          id: result.id,
          userId: result.user_id,
          name: result.name,
          targetAmount: result.target_amount,
          currentAmount: result.current_amount,
          targetDate: result.target_date,
          monthlyContribution: result.monthly_contribution,
          category: result.category as SavingsGoal['category'],
          color: result.color,
          icon: result.icon,
          isCompleted: Boolean(result.is_completed),
          createdAt: result.created_at,
          savingsAccountId: result.savings_account_id || undefined,
          contributionAccountId: result.contribution_account_id || undefined,
        };
        return goal;
      }
      return null;
    } catch (error) {
      console.error('❌ [savingsService] Error in getSavingsGoalById:', error);
      throw error;
    }
  },

  async updateSavingsGoal(id: string, updates: UpdateSavingsGoalData, userId: string = 'default-user'): Promise<void> {
    try {
      const db = await getDatabase();
      
      const fields = Object.keys(updates);
      if (fields.length === 0) return;

      const setClause = fields.map(field => {
        const dbField = field === 'targetAmount' ? 'target_amount' :
                       field === 'currentAmount' ? 'current_amount' :
                       field === 'targetDate' ? 'target_date' :
                       field === 'monthlyContribution' ? 'monthly_contribution' :
                       field === 'isCompleted' ? 'is_completed' :
                       field === 'savingsAccountId' ? 'savings_account_id' :
                       field === 'contributionAccountId' ? 'contribution_account_id' : field;
        return `${dbField} = ?`;
      }).join(', ');

      const values = fields.map(field => {
        const value = (updates as any)[field];
        return field === 'isCompleted' ? (value ? 1 : 0) : value;
      });
      values.push(id, userId);

      await db.runAsync(
        `UPDATE savings_goals SET ${setClause} WHERE id = ? AND user_id = ?`,
        values
      );
      
      console.log('✅ [savingsService] Savings goal updated successfully');
    } catch (error) {
      console.error('❌ [savingsService] Error in updateSavingsGoal:', error);
      throw error;
    }
  },

  async deleteSavingsGoal(id: string, userId: string = 'default-user'): Promise<void> {
    try {
      const db = await getDatabase();
      
      await db.runAsync(
        `DELETE FROM savings_goals WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      
      console.log('✅ [savingsService] Savings goal deleted successfully');
    } catch (error) {
      console.error('❌ [savingsService] Error in deleteSavingsGoal:', error);
      throw error;
    }
  },

  async getContributionHistory(goalId: string, userId: string = 'default-user'): Promise<SavingsContribution[]> {
    try {
      const db = await getDatabase();
      
      await this.ensureContributionsTableExists();
      
      const result = await db.getAllAsync(
        `SELECT sc.* FROM savings_contributions sc
         WHERE sc.goal_id = ? AND sc.user_id = ?
         ORDER BY sc.date DESC`,
        [goalId, userId]
      ) as DatabaseSavingsContribution[];

      const contributions: SavingsContribution[] = result.map((item) => ({
        id: item.id,
        goalId: item.goal_id,
        amount: item.amount,
        date: item.date,
        createdAt: item.created_at,
        fromAccountId: item.from_account_id || undefined,
      }));

      return contributions;
    } catch (error) {
      console.error('❌ [savingsService] Error in getContributionHistory:', error);
      throw error;
    }
  },

  async deleteSavingsGoalWithTransactions(
    goalId: string, 
    deleteTransactions: boolean = true,
    userId: string = 'default-user'
  ): Promise<void> {
    try {
      console.log('🗑️ [savingsService] Deleting savings goal with transactions:', { 
        goalId, 
        deleteTransactions 
      });
      
      const goal = await this.getSavingsGoalById(goalId, userId);
      if (!goal) {
        throw new Error('Objectif d\'épargne non trouvé');
      }

      const db = await getDatabase();
      
      try {
        // 1. Supprimer toutes les contributions associées
        await db.runAsync(
          'DELETE FROM savings_contributions WHERE goal_id = ? AND user_id = ?',
          [goalId, userId]
        );

        // 2. Supprimer les transactions liées si demandé
        let transactionsDeleted = 0;
        if (deleteTransactions) {
          transactionsDeleted = await this.deleteRelatedTransactions(goalId, userId);
        }

        // 3. Supprimer l'objectif d'épargne
        await db.runAsync(
          'DELETE FROM savings_goals WHERE id = ? AND user_id = ?',
          [goalId, userId]
        );
        
        console.log(`✅ [savingsService] Savings goal deleted successfully: ${transactionsDeleted} transactions`);
        
      } catch (error) {
        console.error('❌ [savingsService] Error during deletion:', error);
        throw new Error(`Échec de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }

    } catch (error) {
      console.error('❌ [savingsService] Error deleting savings goal with transactions:', error);
      throw error;
    }
  },

  async deleteSavingsGoalWithRefund(
    goalId: string, 
    deleteTransactions: boolean = true,
    userId: string = 'default-user'
  ): Promise<void> {
    try {
      console.log('🔄 [savingsService] Deleting savings goal with refund:', { 
        goalId, 
        deleteTransactions 
      });
      
      const goal = await this.getSavingsGoalById(goalId, userId);
      if (!goal) {
        throw new Error('Objectif d\'épargne non trouvé');
      }

      const contributions = await this.getContributionHistory(goalId, userId);
      const db = await getDatabase();
      
      try {
        let totalRefunded = 0;
        let refundedContributions = 0;

        // Rembourser les contributions
        for (const contribution of contributions.reverse()) {
          if (contribution.fromAccountId && goal.savingsAccountId) {
            console.log('💰 [savingsService] Refunding contribution:', {
              amount: contribution.amount,
              fromAccount: contribution.fromAccountId,
              toAccount: goal.savingsAccountId
            });
            
            const date = new Date().toISOString().split('T')[0];
            const savingsAccount = await accountService.getAccountById(goal.savingsAccountId);
            
            if (!savingsAccount) {
              console.warn(`⚠️ Compte épargne ${goal.savingsAccountId} non trouvé, skip remboursement`);
              continue;
            }
            
            if (savingsAccount.balance < contribution.amount) {
              console.warn(`⚠️ Solde insuffisant pour rembourser ${contribution.amount} (solde: ${savingsAccount.balance})`);
              continue;
            }

            await transferService.executeSavingsRefund({
              fromAccountId: goal.savingsAccountId,
              toAccountId: contribution.fromAccountId,
              amount: contribution.amount,
              description: `Remboursement: ${goal.name}`,
              date: date
            }, goal.name, userId);

            totalRefunded += contribution.amount;
            refundedContributions++;
            console.log('✅ [savingsService] Contribution refunded successfully');
          }
        }

        // Supprimer les contributions
        await db.runAsync(
          'DELETE FROM savings_contributions WHERE goal_id = ? AND user_id = ?',
          [goalId, userId]
        );

        // Supprimer les transactions liées si demandé
        let transactionsDeleted = 0;
        if (deleteTransactions) {
          transactionsDeleted = await this.deleteRelatedTransactions(goalId, userId);
        }

        // Supprimer l'objectif
        await db.runAsync(
          'DELETE FROM savings_goals WHERE id = ? AND user_id = ?',
          [goalId, userId]
        );

        console.log(`✅ [savingsService] Savings goal deleted with refund successfully. ${refundedContributions}/${contributions.length} contributions refunded (${totalRefunded}), ${transactionsDeleted} transactions deleted`);

      } catch (error) {
        console.error('❌ [savingsService] Error during refund deletion:', error);
        throw error;
      }

    } catch (error) {
      console.error('❌ [savingsService] Error deleting savings goal with refund:', error);
      throw error;
    }
  },

  async deleteContributionWithRefund(contributionId: string, userId: string = 'default-user'): Promise<void> {
    try {
      console.log('🔄 [savingsService] Deleting contribution with refund:', contributionId);
      
      const db = await getDatabase();
      
      const contribution = await db.getFirstAsync(
        `SELECT * FROM savings_contributions WHERE id = ? AND user_id = ?`,
        [contributionId, userId]
      ) as DatabaseSavingsContribution | null;

      if (!contribution) {
        throw new Error('Contribution non trouvée');
      }

      const goal = await this.getSavingsGoalById(contribution.goal_id, userId);
      if (!goal) {
        throw new Error('Objectif d\'épargne non trouvé');
      }

      try {
        if (contribution.from_account_id && goal.savingsAccountId) {
          console.log('💰 [savingsService] Refunding contribution amount:', {
            amount: contribution.amount,
            fromAccount: contribution.from_account_id,
            toAccount: goal.savingsAccountId
          });
          
          const date = new Date().toISOString().split('T')[0];
          
          await transferService.executeSavingsRefund({
            fromAccountId: goal.savingsAccountId,
            toAccountId: contribution.from_account_id,
            amount: contribution.amount,
            description: `Annulation: ${goal.name}`,
            date: date
          }, goal.name, userId);

          console.log('✅ [savingsService] Contribution refunded successfully');
        }

        // Mettre à jour le montant de l'objectif
        const newAmount = Math.max(0, goal.currentAmount - contribution.amount);
        const isCompleted = newAmount >= goal.targetAmount;
        
        await db.runAsync(
          'UPDATE savings_goals SET current_amount = ?, is_completed = ? WHERE id = ? AND user_id = ?',
          [newAmount, isCompleted ? 1 : 0, goal.id, userId]
        );

        // Supprimer la contribution
        await db.runAsync(
          'DELETE FROM savings_contributions WHERE id = ? AND user_id = ?',
          [contributionId, userId]
        );

        console.log('✅ [savingsService] Contribution deleted with refund successfully');

      } catch (error) {
        console.error('❌ [savingsService] Error during contribution deletion:', error);
        throw error;
      }

    } catch (error) {
      console.error('❌ [savingsService] Error deleting contribution with refund:', error);
      throw error;
    }
  },

  // Méthodes utilitaires
  async deleteRelatedTransactions(goalId: string, userId: string = 'default-user'): Promise<number> {
    try {
      console.log('🔍 [savingsService] Searching for transactions related to savings goal:', goalId);
      
      const goal = await this.getSavingsGoalById(goalId, userId);
      if (!goal) {
        console.log('⚠️ [savingsService] Goal not found, skipping transaction deletion');
        return 0;
      }

      let deletedCount = 0;
      const searchPatterns = [
        `%Épargne: ${goal.name}%`,
        `%épargne: ${goal.name}%`,
        `%Savings: ${goal.name}%`,
        `%savings: ${goal.name}%`,
        `%${goal.name}%`,
        `%Remboursement: ${goal.name}%`,
        `%remboursement: ${goal.name}%`,
        `%Refund: ${goal.name}%`,
        `%refund: ${goal.name}%`
      ];

      for (const pattern of searchPatterns) {
        try {
          const transactions = await transactionService.getAllTransactions(userId);
          const matchingTransactions = transactions.filter(tx => 
            tx.description && tx.description.toLowerCase().includes(pattern.replace(/%/g, '').toLowerCase())
          );

          for (const transaction of matchingTransactions) {
            try {
              await transactionService.deleteTransaction(transaction.id, userId);
              deletedCount++;
              console.log(`✅ [savingsService] Deleted transaction: ${transaction.id} - ${transaction.description}`);
            } catch (txError) {
              console.warn(`⚠️ [savingsService] Could not delete transaction ${transaction.id}:`, txError);
            }
          }
        } catch (error) {
          console.warn(`⚠️ [savingsService] Error searching transactions with pattern ${pattern}:`, error);
        }
      }

      console.log(`✅ [savingsService] Deleted ${deletedCount} transactions related to goal: ${goal.name}`);
      return deletedCount;
      
    } catch (error) {
      console.error('❌ [savingsService] Error deleting related transactions:', error);
      return 0;
    }
  },

  async processAutoContributions(userId: string = 'default-user'): Promise<{ processed: number; errors: string[] }> {
    try {
      const goals = await this.getAllSavingsGoals(userId);
      const autoContributionGoals = goals.filter(goal => 
        !goal.isCompleted && 
        goal.monthlyContribution > 0 &&
        goal.contributionAccountId &&
        goal.savingsAccountId
      );

      const errors: string[] = [];
      let processed = 0;

      for (const goal of autoContributionGoals) {
        try {
          await this.addContribution(
            goal.id,
            goal.monthlyContribution,
            goal.contributionAccountId,
            userId
          );
          processed++;
        } catch (error) {
          errors.push(`Erreur avec l'objectif ${goal.name}: ${error}`);
        }
      }

      return { processed, errors };
    } catch (error) {
      console.error('❌ [savingsService] Error in processAutoContributions:', error);
      throw error;
    }
  },

  async getSavingsStats(userId: string = 'default-user'): Promise<SavingsStats> {
    try {
      const goals = await this.getAllSavingsGoals(userId);
      const activeGoals = goals.filter(goal => !goal.isCompleted);
      const completedGoals = goals.filter(goal => goal.isCompleted);
      
      const totalSaved = goals.reduce((sum: number, goal) => sum + goal.currentAmount, 0);
      const monthlyContributions = activeGoals.reduce((sum: number, goal) => sum + goal.monthlyContribution, 0);
      
      const totalTarget = goals.reduce((sum: number, goal) => sum + goal.targetAmount, 0);
      const progressPercentage = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      
      const upcomingGoals = activeGoals
        .filter(goal => new Date(goal.targetDate) <= threeMonthsFromNow)
        .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
        .slice(0, 5);

      const stats: SavingsStats = {
        totalSaved,
        totalGoals: goals.length,
        completedGoals: completedGoals.length,
        monthlyContributions,
        progressPercentage,
        upcomingGoals
      };
      
      console.log('📊 [savingsService] Savings stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ [savingsService] Error in getSavingsStats:', error);
      throw error;
    }
  },

  calculateRequiredMonthlySavings(targetAmount: number, currentAmount: number, targetDate: string): number {
    const today = new Date();
    const target = new Date(targetDate);
    const monthsRemaining = Math.max(1, (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth()));
    
    const remainingAmount = targetAmount - currentAmount;
    return remainingAmount / monthsRemaining;
  },

  calculateGoalAchievementDate(targetAmount: number, currentAmount: number, monthlyContribution: number): string {
    if (monthlyContribution <= 0) {
      return new Date().toISOString().split('T')[0];
    }
    
    const remainingAmount = targetAmount - currentAmount;
    const monthsNeeded = Math.ceil(remainingAmount / monthlyContribution);
    
    const achievementDate = new Date();
    achievementDate.setMonth(achievementDate.getMonth() + monthsNeeded);
    
    return achievementDate.toISOString().split('T')[0];
  },

  calculateCompoundInterest(principal: number, monthlyContribution: number, annualInterestRate: number, years: number): number {
    const monthlyRate = annualInterestRate / 100 / 12;
    const months = years * 12;
    
    let futureValue = principal * Math.pow(1 + monthlyRate, months);
    
    for (let i = 0; i < months; i++) {
      futureValue += monthlyContribution * Math.pow(1 + monthlyRate, months - i - 1);
    }
    
    return futureValue;
  },

  // Méthodes de diagnostic et réparation
  async diagnoseDatabase(): Promise<{
    goalsTableExists: boolean;
    contributionsTableExists: boolean;
    goalsCount: number;
    contributionsCount: number;
    contributionsStructure: any[];
  }> {
    try {
      const db = await getDatabase();
      
      const goalsTableExists = !!(await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='savings_goals'"
      ));
      
      const contributionsTableExists = !!(await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='savings_contributions'"
      ));
      
      let goalsCount = 0;
      let contributionsCount = 0;
      let contributionsStructure: any[] = [];
      
      if (goalsTableExists) {
        const goalsResult = await db.getFirstAsync(`SELECT COUNT(*) as count FROM savings_goals`) as { count: number };
        goalsCount = goalsResult?.count || 0;
      }
      
      if (contributionsTableExists) {
        const contributionsResult = await db.getFirstAsync(`SELECT COUNT(*) as count FROM savings_contributions`) as { count: number };
        contributionsCount = contributionsResult?.count || 0;
        contributionsStructure = await db.getAllAsync(`PRAGMA table_info(savings_contributions)`) as any[];
      }
      
      return {
        goalsTableExists,
        contributionsTableExists,
        goalsCount,
        contributionsCount,
        contributionsStructure
      };
    } catch (error) {
      console.error('❌ [savingsService] Error diagnosing database:', error);
      throw error;
    }
  },

  async emergencyFixExistingGoals(userId: string = 'default-user'): Promise<{ fixed: number; errors: string[] }> {
    try {
      console.log('🛠️ [savingsService] Emergency fix: Assigning savings accounts to existing goals...');
      
      const goals = await this.getAllSavingsGoals(userId);
      const savingsAccounts = await accountService.getAccountsByType('savings');
      
      if (savingsAccounts.length === 0) {
        throw new Error('Aucun compte épargne disponible');
      }
      
      const defaultSavingsAccount = savingsAccounts[0];
      let fixed = 0;
      const errors: string[] = [];

      for (const goal of goals) {
        if (!goal.savingsAccountId) {
          try {
            await this.updateSavingsGoal(goal.id, { 
              savingsAccountId: defaultSavingsAccount.id 
            }, userId);
            console.log(`✅ Fixed goal: ${goal.name} -> ${defaultSavingsAccount.name}`);
            fixed++;
          } catch (error) {
            errors.push(`Erreur avec ${goal.name}: ${error}`);
          }
        }
      }
      
      console.log(`✅ [savingsService] Emergency fix completed: ${fixed} goals fixed`);
      return { fixed, errors };
      
    } catch (error) {
      console.error('❌ [savingsService] Emergency fix failed:', error);
      throw error;
    }
  },

  async emergencySyncAccountBalances(userId: string = 'default-user'): Promise<void> {
    try {
      console.log('🛠️ [savingsService] Emergency sync: Synchronizing account balances...');
      
      await accountService.updateAllAccountBalances(userId);
      
      console.log('✅ [savingsService] Emergency sync completed');
    } catch (error) {
      console.error('❌ [savingsService] Emergency sync failed:', error);
      throw error;
    }
  },

  // Méthodes utilitaires supplémentaires
  async getRelatedTransactionsCount(goalId: string, userId: string = 'default-user'): Promise<number> {
    try {
      const goal = await this.getSavingsGoalById(goalId, userId);
      if (!goal) return 0;

      let totalCount = 0;
      const searchPatterns = [
        `%Épargne: ${goal.name}%`,
        `%épargne: ${goal.name}%`,
        `%Savings: ${goal.name}%`,
        `%savings: ${goal.name}%`,
        `%${goal.name}%`
      ];

      for (const pattern of searchPatterns) {
        try {
          const transactions = await transactionService.getAllTransactions(userId);
          const matchingTransactions = transactions.filter(tx => 
            tx.description && tx.description.toLowerCase().includes(pattern.replace(/%/g, '').toLowerCase())
          );
          totalCount += matchingTransactions.length;
        } catch (error) {
          console.warn(`⚠️ [savingsService] Error counting transactions with pattern ${pattern}:`, error);
        }
      }

      console.log(`🔍 [savingsService] Found ${totalCount} related transactions for goal: ${goal.name}`);
      return totalCount;

    } catch (error) {
      console.error('❌ [savingsService] Error counting related transactions:', error);
      return 0;
    }
  },

  async getRelatedTransactionsDetails(goalId: string, userId: string = 'default-user'): Promise<any[]> {
    try {
      const goal = await this.getSavingsGoalById(goalId, userId);
      if (!goal) return [];

      const allRelatedTransactions: any[] = [];
      const searchPatterns = [
        `%Épargne: ${goal.name}%`,
        `%épargne: ${goal.name}%`,
        `%Savings: ${goal.name}%`,
        `%savings: ${goal.name}%`,
        `%${goal.name}%`
      ];

      for (const pattern of searchPatterns) {
        try {
          const transactions = await transactionService.getAllTransactions(userId);
          const matchingTransactions = transactions.filter(tx => 
            tx.description && tx.description.toLowerCase().includes(pattern.replace(/%/g, '').toLowerCase())
          );
          
          allRelatedTransactions.push(...matchingTransactions.map(tx => ({
            ...tx,
            matchPattern: pattern
          })));
        } catch (error) {
          console.warn(`⚠️ [savingsService] Error getting transactions with pattern ${pattern}:`, error);
        }
      }

      // Éliminer les doublons
      const uniqueTransactions = allRelatedTransactions.filter((tx, index, self) =>
        index === self.findIndex(t => t.id === tx.id)
      );

      console.log(`🔍 [savingsService] Found ${uniqueTransactions.length} unique related transactions for goal: ${goal.name}`);
      return uniqueTransactions;

    } catch (error) {
      console.error('❌ [savingsService] Error getting related transactions details:', error);
      return [];
    }
  }
};

export default savingsService;