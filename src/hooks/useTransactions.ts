// src/hooks/useTransactions.ts - VERSION COMPLÈTEMENT CORRIGÉE POUR L'ÉPARGNE
import { useCallback, useEffect, useState } from 'react';
import { notificationService } from '../services/NotificationService';
import { categoryService } from '../services/categoryService';
import { transactionService } from '../services/transactionService';
import { CreateTransactionData, Transaction } from '../types';

export const useTransactions = (userId: string = 'default-user') => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Initialize to epoch so the first load is not skipped by the "throttle" logic
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date(0));

  // ✅ FONCTION POUR IDENTIFIER LES TRANSACTIONS D'ÉPARGNE
  const isSavingsTransaction = (transaction: Transaction): boolean => {
    const savingsKeywords = [
      'épargne', 'savings', 'remboursement', 'refund', 'annulation',
      'contribution', 'goal', 'objectif', 'Épargne:', 'Savings:'
    ];
    
    const description = transaction.description?.toLowerCase() || '';
    return savingsKeywords.some(keyword => description.includes(keyword.toLowerCase()));
  };

  // ✅ CHARGEMENT UNIFIÉ CORRIGÉ - GARDE TOUTES LES TRANSACTIONS
  const loadTransactions = useCallback(async (forceRefresh: boolean = false) => {
    const now = new Date();
    const timeSinceLastRefresh = now.getTime() - lastRefresh.getTime();
    
    if (!forceRefresh && timeSinceLastRefresh < 2000) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [useTransactions] Chargement des transactions...');
      const allTransactions = await transactionService.getAllTransactions(userId);
      
      // 🔍 DIAGNOSTIC : Vérifier les doublons dans les données brutes
      const uniqueIds = new Set(allTransactions.map(t => t.id));
      if (uniqueIds.size !== allTransactions.length) {
        console.warn('🚨 DOUBLONS DÉTECTÉS dans getAllTransactions:', {
          totalTransactions: allTransactions.length,
          uniqueIds: uniqueIds.size,
          userId
        });
        
        // Log des transactions dupliquées
        const ids = allTransactions.map(t => t.id);
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        console.log('🔍 IDs dupliqués dans la DB:', duplicates);
      }
      
      // ✅ CORRECTION : Garder TOUTES les transactions pour l'affichage
      // Les transactions d'épargne seront exclues uniquement dans les calculs financiers
      const savingsCount = allTransactions.filter(t => isSavingsTransaction(t)).length;
      
      console.log(`✅ [useTransactions] ${allTransactions.length} transactions chargées (${savingsCount} transactions d'épargne incluses pour affichage)`);
      
      setTransactions(allTransactions);
      setLastRefresh(new Date());
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des transactions';
      console.error('❌ [useTransactions] Erreur:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, lastRefresh]);

  // ✅ CRÉATION UNIFIÉE CORRIGÉE - GESTION DU USERID
  const createTransaction = async (transactionData: CreateTransactionData): Promise<string> => {
    try {
      setError(null);
      console.log('🔄 [useTransactions] Création transaction...');
      
      // ✅ CORRECTION : Créer l'objet transaction complet avec userId
      const completeTransactionData = {
        ...transactionData,
        userId: userId
      };
      
      const transactionId = await transactionService.createTransaction(completeTransactionData, userId);
      await loadTransactions(true);
      
      // 📬 Notification : Transaction ajoutée avec nom de catégorie
      if (transactionData.type !== 'transfer') {
        // Récupérer le nom de la catégorie
        let categoryName = 'Non catégorisé';
        if (transactionData.category) {
          try {
            const categories = await categoryService.getAllCategories(userId);
            const category = categories.find(cat => cat.id === transactionData.category);
            categoryName = category ? category.name : transactionData.category;
          } catch (err) {
            console.warn('⚠️ Impossible de récupérer le nom de catégorie');
          }
        }
        
        notificationService.notifyTransactionAdded(
          transactionData.amount,
          categoryName,
          transactionData.type as 'income' | 'expense',
          'Dh'
        );
      }
      
      console.log('✅ [useTransactions] Transaction créée:', transactionId);
      return transactionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la transaction';
      console.error('❌ [useTransactions] Erreur création:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  // ✅ MISE À JOUR UNIFIÉE CORRIGÉE
  const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<void> => {
    try {
      setError(null);
      console.log('🔄 [useTransactions] Mise à jour transaction:', id);
      
      await transactionService.updateTransaction(id, updates, userId);
      await loadTransactions(true);
      
      // 📬 Notification : Transaction modifiée avec nom de catégorie
      if (updates.amount || updates.category) {
        // Récupérer le nom de la catégorie
        let categoryName = '';
        if (updates.category) {
          try {
            const categories = await categoryService.getAllCategories(userId);
            const category = categories.find(cat => cat.id === updates.category);
            categoryName = category ? category.name : updates.category;
          } catch (err) {
            console.warn('⚠️ Impossible de récupérer le nom de catégorie');
          }
        }
        
        notificationService.notifyTransactionUpdated(
          updates.amount || 0,
          categoryName,
          'Dh'
        );
      }
      
      console.log('✅ [useTransactions] Transaction mise à jour');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la transaction';
      console.error('❌ [useTransactions] Erreur mise à jour:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  // ✅ SUPPRESSION UNIFIÉE CORRIGÉE
  const deleteTransaction = async (id: string): Promise<void> => {
    try {
      setError(null);
      console.log('🗑️ [useTransactions] Suppression transaction:', id);
      
      // Récupérer la transaction avant de la supprimer pour la notification
      const transaction = transactions.find(t => t.id === id);
      
      await transactionService.deleteTransaction(id, userId);
      await loadTransactions(true);
      
      // 📬 Notification : Transaction supprimée avec nom de catégorie
      if (transaction) {
        // Récupérer le nom de la catégorie
        let categoryName = 'Non catégorisé';
        if (transaction.category) {
          try {
            const categories = await categoryService.getAllCategories(userId);
            const category = categories.find(cat => cat.id === transaction.category);
            categoryName = category ? category.name : transaction.category;
          } catch (err) {
            console.warn('⚠️ Impossible de récupérer le nom de catégorie');
          }
        }
        
        notificationService.notifyTransactionDeleted(categoryName);
      }
      
      console.log('✅ [useTransactions] Transaction supprimée');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la transaction';
      console.error('❌ [useTransactions] Erreur suppression:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  // ✅ RÉCUPÉRATION PAR ID CORRIGÉE
  const getTransactionById = async (id: string): Promise<Transaction | null> => {
    try {
      console.log('🔍 [useTransactions] Récupération transaction:', id);
      const transaction = await transactionService.getTransactionById(id, userId);
      
      if (!transaction) {
        console.log('❌ [useTransactions] Transaction non trouvée:', id);
        setError('Transaction non trouvée');
      }
      
      return transaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération de la transaction';
      console.error('❌ [useTransactions] Erreur récupération:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  // ✅ CORRECTION : SUPPRIMER processRecurringTransactions SI NON DISPONIBLE
  // Cette méthode n'existe pas dans transactionService, donc on la retire

  // ✅ MÉTHODES UTILITAIRES CORRIGÉES
  const getRecurringTransactions = (): Transaction[] => {
    return transactions.filter(transaction => transaction.isRecurring);
  };

  const getNormalTransactions = (): Transaction[] => {
    return transactions.filter(transaction => !transaction.isRecurring);
  };

  const getTransactionsByAccount = (accountId: string): Transaction[] => {
    return transactions.filter(transaction => transaction.accountId === accountId);
  };

  const getTransactionsByType = (type: 'income' | 'expense'): Transaction[] => {
    return transactions.filter(transaction => transaction.type === type);
  };

  // ✅ NOUVELLE MÉTHODE : Obtenir les transactions d'épargne
  const getSavingsTransactions = async (): Promise<Transaction[]> => {
    try {
      const allTransactions = await transactionService.getAllTransactions(userId);
      return allTransactions.filter(transaction => isSavingsTransaction(transaction));
    } catch (error) {
      console.error('❌ [useTransactions] Erreur récupération transactions épargne:', error);
      return [];
    }
  };

  const refreshTransactions = useCallback(async (): Promise<void> => {
    console.log('🔄 [useTransactions] Rafraîchissement manuel');
    await loadTransactions(true);
  }, [loadTransactions]);

  // ✅ CORRECTION CRITIQUE : STATISTIQUES AVEC EXCLUSION DE L'ÉPARGNE
  const getStats = (activeTab: 'all' | 'normal' | 'recurring' = 'all') => {
    const normalTransactions = getNormalTransactions();
    const recurringTransactions = getRecurringTransactions();
    
    // ✅ CORRECTION : CALCULS EXCLUANT L'ÉPARGNE
    // Seules les transactions non-épargne sont utilisées pour les calculs financiers
    
    const totalAvailableIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculs spécifiques par type de transaction (hors épargne)
    const normalIncome = normalTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const normalExpenses = normalTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const recurringIncome = recurringTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const recurringExpenses = recurringTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // ✅ LOGIQUE MÉTIER : Calculs par onglet avec exclusion de l'épargne
    switch (activeTab) {
      case 'normal':
        return {
          // Totaux (hors épargne)
          total: normalTransactions.length,
          recurring: 0,
          normal: normalTransactions.length,
          
          // ✅ REVENU DISPONIBLE : Revenu total hors épargne
          availableIncome: totalAvailableIncome,
          // Dépenses spécifiques à l'onglet (hors épargne)
          expenses: normalExpenses,
          // Solde = Revenu disponible - Dépenses de l'onglet
          balance: totalAvailableIncome - normalExpenses,
          
          // Détails pour information (hors épargne)
          normalIncome,
          normalExpenses,
          recurringIncome: 0,
          recurringExpenses: 0
        };

      case 'recurring':
        return {
          // Totaux (hors épargne)
          total: recurringTransactions.length,
          recurring: recurringTransactions.length,
          normal: 0,
          
          // ✅ REVENU DISPONIBLE : Revenu total hors épargne
          availableIncome: totalAvailableIncome,
          // Dépenses spécifiques à l'onglet (hors épargne)
          expenses: recurringExpenses,
          // Solde = Revenu disponible - Dépenses de l'onglet
          balance: totalAvailableIncome - recurringExpenses,
          
          // Détails pour information (hors épargne)
          normalIncome: 0,
          normalExpenses: 0,
          recurringIncome,
          recurringExpenses
        };

      case 'all':
      default:
        const totalExpenses = normalExpenses + recurringExpenses;
        return {
          // Totaux (hors épargne)
          total: transactions.length,
          recurring: recurringTransactions.length,
          normal: normalTransactions.length,
          
          // ✅ REVENU DISPONIBLE : Revenu total hors épargne
          availableIncome: totalAvailableIncome,
          // Dépenses totales (hors épargne)
          expenses: totalExpenses,
          // Solde global (hors épargne)
          balance: totalAvailableIncome - totalExpenses,
          
          // Détails (hors épargne)
          normalIncome,
          normalExpenses,
          recurringIncome,
          recurringExpenses
        };
    }
  };

  // ✅ NOUVELLE MÉTHODE : Statistiques complètes incluant l'épargne
  const getComprehensiveStats = async () => {
    try {
      const allTransactions = await transactionService.getAllTransactions(userId);
      const savingsTransactions = allTransactions.filter(transaction => isSavingsTransaction(transaction));
      const nonSavingsTransactions = allTransactions.filter(transaction => !isSavingsTransaction(transaction));
      
      // Calculs pour les transactions non-épargne
      const nonSavingsIncome = nonSavingsTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const nonSavingsExpenses = nonSavingsTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Calculs pour les transactions d'épargne
      const savingsIncome = savingsTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const savingsExpenses = savingsTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      return {
        // Totaux
        totalTransactions: allTransactions.length,
        savingsTransactions: savingsTransactions.length,
        nonSavingsTransactions: nonSavingsTransactions.length,
        
        // Revenus
        totalIncome: nonSavingsIncome + savingsIncome,
        nonSavingsIncome,
        savingsIncome,
        
        // Dépenses
        totalExpenses: nonSavingsExpenses + savingsExpenses,
        nonSavingsExpenses,
        savingsExpenses,
        
        // Soldes
        netFlow: (nonSavingsIncome + savingsIncome) - (nonSavingsExpenses + savingsExpenses),
        nonSavingsBalance: nonSavingsIncome - nonSavingsExpenses,
        savingsBalance: savingsIncome - savingsExpenses
      };
    } catch (error) {
      console.error('❌ [useTransactions] Erreur calcul stats complètes:', error);
      return {
        totalTransactions: 0,
        savingsTransactions: 0,
        nonSavingsTransactions: 0,
        totalIncome: 0,
        nonSavingsIncome: 0,
        savingsIncome: 0,
        totalExpenses: 0,
        nonSavingsExpenses: 0,
        savingsExpenses: 0,
        netFlow: 0,
        nonSavingsBalance: 0,
        savingsBalance: 0
      };
    }
  };

  // ✅ NOUVELLE MÉTHODE : Vérification de la cohérence des soldes
  const verifyAccountBalances = async () => {
    try {
      console.log('🔍 [useTransactions] Vérification cohérence soldes...');
      const balances = await transactionService.verifyAccountBalances(userId);
      
      const inconsistencies = balances.filter(balance => Math.abs(balance.difference) > 0.01);
      
      if (inconsistencies.length > 0) {
        console.warn('⚠️ [useTransactions] Incohérences détectées:', inconsistencies);
        return {
          hasInconsistencies: true,
          inconsistencies,
          message: `${inconsistencies.length} incohérence(s) détectée(s) dans les soldes`
        };
      }
      
      console.log('✅ [useTransactions] Tous les soldes sont cohérents');
      return {
        hasInconsistencies: false,
        inconsistencies: [],
        message: 'Tous les soldes sont cohérents'
      };
    } catch (error) {
      console.error('❌ [useTransactions] Erreur vérification soldes:', error);
      return {
        hasInconsistencies: true,
        inconsistencies: [],
        message: 'Erreur lors de la vérification des soldes'
      };
    }
  };

  // ✅ NOUVELLE MÉTHODE : Réparation des soldes
  const repairAccountBalances = async () => {
    try {
      console.log('🛠️ [useTransactions] Réparation des soldes...');
      await transactionService.repairAccountBalances(userId);
      await loadTransactions(true);
      
      console.log('✅ [useTransactions] Soldes réparés avec succès');
      return { success: true, message: 'Soldes réparés avec succès' };
    } catch (error) {
      console.error('❌ [useTransactions] Erreur réparation soldes:', error);
      return { success: false, message: 'Erreur lors de la réparation des soldes' };
    }
  };

  // EFFET : CHARGEMENT INITIAL
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    // État
    transactions,
    loading,
    error,
    lastRefresh,
    
    // Actions principales
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refreshTransactions,
    
    // Méthodes de recherche
    getTransactionById,
    getRecurringTransactions,
    getNormalTransactions,
    getTransactionsByAccount,
    getTransactionsByType,
    getSavingsTransactions,
    
    // Statistiques
    getStats,
    getComprehensiveStats,
    
    // ✅ NOUVEAU : Gestion de la cohérence des soldes
    verifyAccountBalances,
    repairAccountBalances,
    
    // ✅ NOUVEAU : Méthode utilitaire pour identifier l'épargne
    isSavingsTransaction,
    
    // Utilitaires
    clearError: () => setError(null)
  };
};

export default useTransactions;