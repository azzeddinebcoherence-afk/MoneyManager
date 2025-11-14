// src/hooks/useTransactions.ts - VERSION COMPLÈTEMENT CORRIGÉE AVEC LOGIQUE MÉTIER
import { useCallback, useEffect, useState } from 'react';
import { transactionService } from '../services/transactionService';
import { CreateTransactionData, Transaction } from '../types';

export const useTransactions = (userId: string = 'default-user') => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // ✅ CHARGEMENT UNIFIÉ CORRIGÉ
  const loadTransactions = useCallback(async (filters: any = {}, forceRefresh: boolean = false) => {
    const now = new Date();
    const timeSinceLastRefresh = now.getTime() - lastRefresh.getTime();
    
    if (!forceRefresh && timeSinceLastRefresh < 2000) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [useTransactions] Chargement des transactions...');
      const transactionsData = await transactionService.getAllTransactions(userId, filters);
      console.log(`✅ [useTransactions] ${transactionsData.length} transactions chargées`);
      
      setTransactions(transactionsData);
      setLastRefresh(new Date());
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des transactions';
      console.error('❌ [useTransactions] Erreur:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, lastRefresh]);

  // ✅ CRÉATION UNIFIÉE CORRIGÉE
  const createTransaction = async (transactionData: CreateTransactionData): Promise<string> => {
    try {
      setError(null);
      console.log('🔄 [useTransactions] Création transaction...');
      
      const transactionId = await transactionService.createTransaction(transactionData, userId);
      await loadTransactions({}, true);
      
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
      await loadTransactions({}, true);
      
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
      
      await transactionService.deleteTransaction(id, userId);
      await loadTransactions({}, true);
      
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

  // ✅ TRAITEMENT DES RÉCURRENTES
  const processRecurringTransactions = async (): Promise<{ processed: number; errors: string[] }> => {
    try {
      setError(null);
      console.log('🔄 [useTransactions] Traitement transactions récurrentes...');
      
      const result = await transactionService.processRecurringTransactions(userId);
      await loadTransactions({}, true);
      
      console.log('✅ [useTransactions] Traitement terminé');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du traitement des transactions récurrentes';
      console.error('❌ [useTransactions] Erreur traitement:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

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

  const refreshTransactions = useCallback(async (filters: any = {}): Promise<void> => {
    console.log('🔄 [useTransactions] Rafraîchissement manuel');
    await loadTransactions(filters, true);
  }, [loadTransactions]);

  // ✅ CORRECTION CRITIQUE : STATISTIQUES AVEC REVENU DISPONIBLE COMMUN
  const getStats = (activeTab: 'all' | 'normal' | 'recurring' = 'all') => {
    const normalTransactions = getNormalTransactions();
    const recurringTransactions = getRecurringTransactions();
    
    // ✅ CORRECTION : REVENU DISPONIBLE COMMUN POUR TOUS LES ONGLETS
    // Le revenu disponible est le même pour tous les onglets car c'est le revenu total du compte
    const totalAvailableIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculs spécifiques par type de transaction
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

    // ✅ LOGIQUE MÉTIER : Calculs par onglet avec revenu disponible commun
    switch (activeTab) {
      case 'normal':
        return {
          // Totaux
          total: normalTransactions.length,
          recurring: 0,
          normal: normalTransactions.length,
          
          // ✅ REVENU DISPONIBLE : Même que global (revenu total du compte)
          availableIncome: totalAvailableIncome,
          // Dépenses spécifiques à l'onglet
          expenses: normalExpenses,
          // Solde = Revenu disponible - Dépenses de l'onglet
          balance: totalAvailableIncome - normalExpenses,
          
          // Détails pour information
          normalIncome,
          normalExpenses,
          recurringIncome: 0,
          recurringExpenses: 0
        };

      case 'recurring':
        return {
          // Totaux
          total: recurringTransactions.length,
          recurring: recurringTransactions.length,
          normal: 0,
          
          // ✅ REVENU DISPONIBLE : Même que global (revenu total du compte)
          availableIncome: totalAvailableIncome,
          // Dépenses spécifiques à l'onglet
          expenses: recurringExpenses,
          // Solde = Revenu disponible - Dépenses de l'onglet
          balance: totalAvailableIncome - recurringExpenses,
          
          // Détails pour information
          normalIncome: 0,
          normalExpenses: 0,
          recurringIncome,
          recurringExpenses
        };

      case 'all':
      default:
        const totalExpenses = normalExpenses + recurringExpenses;
        return {
          // Totaux
          total: transactions.length,
          recurring: recurringTransactions.length,
          normal: normalTransactions.length,
          
          // ✅ REVENU DISPONIBLE : Revenu total du compte
          availableIncome: totalAvailableIncome,
          // Dépenses totales
          expenses: totalExpenses,
          // Solde global
          balance: totalAvailableIncome - totalExpenses,
          
          // Détails
          normalIncome,
          normalExpenses,
          recurringIncome,
          recurringExpenses
        };
    }
  };

  // EFFET : CHARGEMENT INITIAL
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // EFFET : TRAITEMENT AUTO AU DÉMARRAGE
  useEffect(() => {
    const processOnStartup = async () => {
      try {
        await processRecurringTransactions();
      } catch (error) {
        console.error('❌ [useTransactions] Erreur traitement automatique:', error);
      }
    };
    
    // Démarrer après un court délai
    const timer = setTimeout(() => {
      processOnStartup();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

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
    processRecurringTransactions,
    refreshTransactions,
    
    // Méthodes de recherche
    getTransactionById,
    getRecurringTransactions,
    getNormalTransactions,
    getTransactionsByAccount,
    getTransactionsByType,
    
    // ✅ CORRECTION : Statistiques avec paramètre d'onglet
    getStats,
    
    // Utilitaires
    clearError: () => setError(null)
  };
};