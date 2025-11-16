// src/hooks/useSavings.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { useCallback, useEffect, useState } from 'react';
import { savingsService } from '../services/savingsService';
import { CreateSavingsGoalData, SavingsContribution, SavingsGoal, SavingsStats } from '../types/Savings';

export const useSavings = (userId: string = 'default-user') => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState<SavingsStats>({
    totalSaved: 0,
    totalGoals: 0,
    completedGoals: 0,
    monthlyContributions: 0,
    progressPercentage: 0,
    upcomingGoals: []
  });

  const loadGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 [useSavings] Loading savings goals...');
      
      const goalsData = await savingsService.getAllSavingsGoals(userId);
      console.log('✅ [useSavings] Loaded', goalsData.length, 'goals');
      
      setGoals(goalsData);
      calculateStats(goalsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des objectifs d\'épargne';
      console.error('❌ [useSavings] Error loading goals:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const calculateStats = useCallback((goalsData: SavingsGoal[]) => {
    let totalSaved = 0;
    let totalGoals = goalsData.length;
    let completedGoals = 0;
    let monthlyContributions = 0;
    let totalProgress = 0;

    goalsData.forEach(goal => {
      totalSaved += goal.currentAmount;
      
      if (goal.isCompleted) {
        completedGoals++;
      }
      
      if (goal.monthlyContribution) {
        monthlyContributions += goal.monthlyContribution;
      }
      
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      totalProgress += progress;
    });

    const progressPercentage = totalGoals > 0 ? totalProgress / totalGoals : 0;

    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    const upcomingGoals = goalsData
      .filter(goal => !goal.isCompleted && new Date(goal.targetDate) <= threeMonthsFromNow)
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
      .slice(0, 5);

    setStats({
      totalSaved,
      totalGoals,
      completedGoals,
      monthlyContributions,
      progressPercentage,
      upcomingGoals
    });

    console.log('💰 [useSavings] Stats calculées:', {
      totalSaved,
      totalGoals,
      completedGoals,
      monthlyContributions,
      progressPercentage,
      upcomingGoals: upcomingGoals.length
    });
  }, []);

  // ✅ MÉTHODE AMÉLIORÉE : Supprimer avec option pour les transactions
  const deleteGoalWithTransactions = useCallback(async (
    goalId: string, 
    deleteTransactions: boolean = true,
    withRefund: boolean = true
  ): Promise<void> => {
    try {
      setError(null);
      console.log('🗑️ [useSavings] Deleting savings goal with transactions:', { 
        goalId, 
        deleteTransactions,
        withRefund 
      });
      
      // ✅ Vérifier d'abord le nombre de transactions liées
      const relatedTransactionsCount = await savingsService.getRelatedTransactionsCount(goalId, userId);
      console.log(`🔍 [useSavings] Found ${relatedTransactionsCount} related transactions for goal ${goalId}`);
      
      if (withRefund) {
        await savingsService.deleteSavingsGoalWithRefund(goalId, deleteTransactions, userId);
      } else {
        await savingsService.deleteSavingsGoalWithTransactions(goalId, deleteTransactions, userId);
      }
      
      await loadGoals();
      
      console.log('✅ [useSavings] Savings goal deleted successfully with transactions option');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'objectif';
      console.error('❌ [useSavings] Error deleting goal with transactions:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadGoals]);

  // ✅ NOUVELLE MÉTHODE : Obtenir les détails des transactions liées
  const getRelatedTransactionsDetails = useCallback(async (goalId: string): Promise<any[]> => {
    try {
      setError(null);
      console.log('🔍 [useSavings] Getting related transactions details for goal:', goalId);
      
      const transactions = await savingsService.getRelatedTransactionsDetails(goalId, userId);
      return transactions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des transactions liées';
      console.error('❌ [useSavings] Error getting related transactions:', errorMessage);
      setError(errorMessage);
      return [];
    }
  }, [userId]);

  // ✅ NOUVELLE MÉTHODE : Vérifier le nombre de transactions liées
  const getRelatedTransactionsCount = useCallback(async (goalId: string): Promise<number> => {
    try {
      setError(null);
      console.log('🔍 [useSavings] Counting related transactions for goal:', goalId);
      
      const count = await savingsService.getRelatedTransactionsCount(goalId, userId);
      return count;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du comptage des transactions liées';
      console.error('❌ [useSavings] Error counting related transactions:', errorMessage);
      setError(errorMessage);
      return 0;
    }
  }, [userId]);

  // MÉTHODES EXISTANTES (conservées)
  const createGoal = useCallback(async (goalData: CreateSavingsGoalData): Promise<string> => {
    try {
      setError(null);
      console.log('🔄 [useSavings] Creating savings goal...');
      
      const goalId = await savingsService.createSavingsGoal(goalData, userId);
      await loadGoals();
      
      console.log('✅ [useSavings] Savings goal created successfully');
      return goalId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de l\'objectif';
      console.error('❌ [useSavings] Error creating goal:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadGoals]);

  const updateGoal = useCallback(async (goalId: string, updates: Partial<SavingsGoal>): Promise<void> => {
    try {
      setError(null);
      console.log('🔄 [useSavings] Updating savings goal:', goalId);
      
      await savingsService.updateSavingsGoal(goalId, updates, userId);
      await loadGoals();
      
      console.log('✅ [useSavings] Savings goal updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'objectif';
      console.error('❌ [useSavings] Error updating goal:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadGoals]);

  const deleteGoal = useCallback(async (goalId: string, withRefund: boolean = true): Promise<void> => {
    try {
      setError(null);
      console.log('🗑️ [useSavings] Deleting savings goal:', { goalId, withRefund });
      
      if (withRefund) {
        await savingsService.deleteSavingsGoalWithRefund(goalId, true, userId);
      } else {
        await savingsService.deleteSavingsGoal(goalId, userId);
      }
      
      await loadGoals();
      
      console.log('✅ [useSavings] Savings goal deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'objectif';
      console.error('❌ [useSavings] Error deleting goal:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadGoals]);

  const deleteGoalWithRefund = useCallback(async (goalId: string): Promise<void> => {
    try {
      setError(null);
      console.log('💰 [useSavings] Deleting savings goal WITH REFUND:', goalId);
      
      await savingsService.deleteSavingsGoalWithRefund(goalId, true, userId);
      await loadGoals();
      
      console.log('✅ [useSavings] Savings goal deleted with refund successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression avec remboursement';
      console.error('❌ [useSavings] Error deleting goal with refund:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadGoals]);

  const addContribution = useCallback(async (goalId: string, amount: number, fromAccountId?: string): Promise<void> => {
    try {
      setError(null);
      console.log('💰 [useSavings] Adding contribution...', { goalId, amount, fromAccountId });
      
      await savingsService.addContribution(goalId, amount, fromAccountId, userId);
      await loadGoals();
      
      console.log('✅ [useSavings] Contribution added successfully');
      
    } catch (err) {
      console.error('❌ [useSavings] Error adding contribution:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la contribution';
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadGoals]);

  const deleteContributionWithRefund = useCallback(async (contributionId: string, goalId: string): Promise<void> => {
    try {
      setError(null);
      console.log('💰 [useSavings] Deleting contribution WITH REFUND:', contributionId);
      
      await savingsService.deleteContributionWithRefund(contributionId, userId);
      await loadGoals();
      
      console.log('✅ [useSavings] Contribution deleted with refund successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la contribution';
      console.error('❌ [useSavings] Error deleting contribution with refund:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadGoals]);

  const processAutoContributions = useCallback(async (): Promise<{ processed: number; errors: string[] }> => {
    try {
      setError(null);
      console.log('🔄 [useSavings] Processing auto contributions...');
      
      const result = await savingsService.processAutoContributions(userId);
      await loadGoals();
      
      console.log('✅ [useSavings] Auto contributions processed successfully');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du traitement des contributions automatiques';
      console.error('❌ [useSavings] Error processing auto contributions:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadGoals]);

  const markGoalAsCompleted = useCallback(async (goalId: string): Promise<void> => {
    try {
      setError(null);
      console.log('✅ [useSavings] Marking goal as completed:', goalId);
      
      // Mettre à jour le statut de l'objectif
      await savingsService.updateSavingsGoal(goalId, { isCompleted: true }, userId);
      await loadGoals();
      
      console.log('✅ [useSavings] Goal marked as completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du marquage de l\'objectif comme complété';
      console.error('❌ [useSavings] Error marking goal as completed:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadGoals]);

  const getGoalById = useCallback(async (goalId: string): Promise<SavingsGoal | null> => {
    try {
      setError(null);
      console.log('🔍 [useSavings] Getting goal by ID:', goalId);
      return await savingsService.getSavingsGoalById(goalId, userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération de l\'objectif';
      console.error('❌ [useSavings] Error getting goal by ID:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  const getContributionHistory = useCallback(async (goalId: string): Promise<SavingsContribution[]> => {
    try {
      setError(null);
      console.log('📊 [useSavings] Getting contribution history for goal:', goalId);
      return await savingsService.getContributionHistory(goalId, userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération de l\'historique des contributions';
      console.error('❌ [useSavings] Error getting contribution history:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  const getServiceStats = useCallback(async (): Promise<SavingsStats> => {
    try {
      setError(null);
      console.log('📊 [useSavings] Getting service stats...');
      return await savingsService.getSavingsStats(userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des statistiques';
      console.error('❌ [useSavings] Error getting service stats:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  const runEmergencyFix = useCallback(async (): Promise<{ fixed: number; errors: string[] }> => {
    try {
      setError(null);
      console.log('🛠️ [useSavings] Running emergency fix for existing goals...');
      
      const result = await savingsService.emergencyFixExistingGoals(userId);
      if (result.fixed > 0) {
        await loadGoals();
      }
      
      console.log('✅ [useSavings] Emergency fix completed');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la correction d\'urgence';
      console.error('❌ [useSavings] Error running emergency fix:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadGoals]);

  const runEmergencySync = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      console.log('🛠️ [useSavings] Running emergency sync for account balances...');
      
      await savingsService.emergencySyncAccountBalances(userId);
      await loadGoals();
      
      console.log('✅ [useSavings] Emergency sync completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la synchronisation d\'urgence';
      console.error('❌ [useSavings] Error running emergency sync:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadGoals]);

  const refreshGoals = useCallback(async (): Promise<void> => {
    await loadGoals();
  }, [loadGoals]);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const calculateTimeToGoal = useCallback((goal: SavingsGoal): number => {
    if (goal.monthlyContribution && goal.monthlyContribution > 0) {
      const remaining = goal.targetAmount - goal.currentAmount;
      return Math.ceil(remaining / goal.monthlyContribution);
    }
    return Infinity;
  }, []);

  const calculateProgressPercentage = useCallback((goal: SavingsGoal): number => {
    return goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  }, []);

  const calculateRequiredMonthlySavings = useCallback((
    targetAmount: number, 
    currentAmount: number, 
    targetDate: string
  ): number => {
    return savingsService.calculateRequiredMonthlySavings(targetAmount, currentAmount, targetDate);
  }, []);

  const calculateGoalAchievementDate = useCallback((
    targetAmount: number, 
    currentAmount: number, 
    monthlyContribution: number
  ): string => {
    return savingsService.calculateGoalAchievementDate(targetAmount, currentAmount, monthlyContribution);
  }, []);

  const getPriorityGoals = useCallback((): SavingsGoal[] => {
    return goals
      .filter(goal => !goal.isCompleted)
      .sort((a, b) => {
        if (!a.targetDate && !b.targetDate) return 0;
        if (!a.targetDate) return 1;
        if (!b.targetDate) return -1;
        return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
      })
      .slice(0, 3);
  }, [goals]);

  const checkCompletedGoals = useCallback((): SavingsGoal[] => {
    return goals.filter(goal => 
      !goal.isCompleted && goal.currentAmount >= goal.targetAmount
    );
  }, [goals]);

  const getActiveGoals = useCallback((): SavingsGoal[] => {
    return goals.filter(goal => !goal.isCompleted);
  }, [goals]);

  const getCompletedGoals = useCallback((): SavingsGoal[] => {
    return goals.filter(goal => goal.isCompleted);
  }, [goals]);

  const getGoalsByCategory = useCallback((category: SavingsGoal['category']): SavingsGoal[] => {
    return goals.filter(goal => goal.category === category);
  }, [goals]);

  const getOverdueGoals = useCallback((): SavingsGoal[] => {
    const today = new Date();
    return goals.filter(goal => 
      !goal.isCompleted && 
      new Date(goal.targetDate) < today
    );
  }, [goals]);

  const getUpcomingGoals = useCallback((): SavingsGoal[] => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return goals.filter(goal => 
      !goal.isCompleted && 
      new Date(goal.targetDate) <= nextMonth
    );
  }, [goals]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  return {
    // État
    goals,
    loading,
    error,
    stats,

    // Méthodes principales
    createGoal,
    updateGoal,
    deleteGoal,
    deleteGoalWithRefund,
    
    // ✅ MÉTHODES POUR LA GESTION DES TRANSACTIONS
    deleteGoalWithTransactions,
    getRelatedTransactionsDetails,
    getRelatedTransactionsCount,
    
    // Gestion des contributions
    addContribution,
    deleteContributionWithRefund,
    processAutoContributions,
    
    // Gestion des objectifs
    markGoalAsCompleted,
    getGoalById,
    getContributionHistory,
    
    // Utilitaires et statistiques
    getServiceStats,
    runEmergencyFix,
    runEmergencySync,
    refreshGoals,
    clearError,
    
    // Calculs
    calculateTimeToGoal,
    calculateProgressPercentage,
    calculateRequiredMonthlySavings,
    calculateGoalAchievementDate,
    
    // Filtres et recherches
    getPriorityGoals,
    checkCompletedGoals,
    getActiveGoals,
    getCompletedGoals,
    getGoalsByCategory,
    getOverdueGoals,
    getUpcomingGoals,
  };
};

export default useSavings;