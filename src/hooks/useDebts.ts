// src/hooks/useDebts.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { useCallback, useEffect, useState } from 'react';
import { debtService } from '../services/debtService';
import { CreateDebtData, Debt, DebtPayment, DebtStats } from '../types/Debt';

export const useDebts = (userId: string = 'default-user') => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState<DebtStats>({
    totalDebt: 0,
    monthlyPayment: 0,
    paidDebts: 0,
    activeDebts: 0,
    overdueDebts: 0,
    futureDebts: 0,
    totalInterest: 0,
    totalRemaining: 0,
    totalPaid: 0,
    interestPaid: 0,
    debtFreeDate: '',
    progressPercentage: 0,
    dueThisMonth: 0,
    totalDueThisMonth: 0,
    upcomingDebts: []
  });

  /**
   * ✅ CHARGEMENT DES DETTES SIMPLIFIÉ
   */
  const loadDebts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 [useDebts] Loading debts...');
      
      // ✅ S'ASSURER QUE LA TABLE EXISTE AVANT TOUTE OPÉRATION
      await debtService.ensureDebtsTableExists();
      
      // ✅ MISE À JOUR AUTOMATIQUE DES STATUTS AVANT CHARGEMENT
      await debtService.updateDebtStatuses(userId);
      
      const [debtsData, statsData] = await Promise.all([
        debtService.getAllDebts(userId),
        debtService.getDebtStats(userId)
      ]);
      
      console.log('✅ [useDebts] Loaded', debtsData.length, 'debts');
      
      setDebts(debtsData);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des dettes';
      console.error('❌ [useDebts] Error loading debts:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * ✅ CRÉATION D'UNE DETTE
   */
  const createDebt = useCallback(async (debtData: CreateDebtData): Promise<string> => {
    try {
      setError(null);
      console.log('🔄 [useDebts] Creating debt...');
      
      const debtId = await debtService.createDebt(debtData, userId);
      await loadDebts();
      
      console.log('✅ [useDebts] Debt created successfully');
      return debtId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la dette';
      console.error('❌ [useDebts] Error creating debt:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadDebts]);

  /**
   * ✅ MISE À JOUR D'UNE DETTE
   */
  const updateDebt = useCallback(async (debtId: string, updates: Partial<Debt>): Promise<void> => {
    try {
      setError(null);
      console.log('🔄 [useDebts] Updating debt:', debtId);
      
      await debtService.updateDebt(debtId, updates, userId);
      await loadDebts();
      
      console.log('✅ [useDebts] Debt updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la dette';
      console.error('❌ [useDebts] Error updating debt:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadDebts]);

  /**
   * ✅ SUPPRESSION D'UNE DETTE
   */
  const deleteDebt = useCallback(async (debtId: string): Promise<void> => {
    try {
      setError(null);
      console.log('🗑️ [useDebts] Deleting debt:', debtId);
      
      await debtService.deleteDebt(debtId, userId);
      await loadDebts();
      
      console.log('✅ [useDebts] Debt deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la dette';
      console.error('❌ [useDebts] Error deleting debt:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadDebts]);

  /**
   * ✅ PAIEMENT D'UNE DETTE - SIMPLIFIÉ
   */
  const makePayment = useCallback(async (
    debtId: string, 
    amount: number, 
    accountId: string
  ): Promise<void> => {
    try {
      setError(null);
      console.log('💰 [useDebts] Making payment:', { debtId, amount, accountId });
      
      await debtService.addPayment(debtId, amount, accountId, userId);
      await loadDebts();
      
      console.log('✅ [useDebts] Payment made successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du paiement';
      console.error('❌ [useDebts] Error making payment:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadDebts]);

  /**
   * ✅ RÉCUPÉRATION D'UNE DETTE PAR ID
   */
  const getDebtById = useCallback(async (debtId: string): Promise<Debt | null> => {
    try {
      setError(null);
      console.log('🔍 [useDebts] Getting debt by ID:', debtId);
      return await debtService.getDebtById(debtId, userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération de la dette';
      console.error('❌ [useDebts] Error getting debt by ID:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  /**
   * ✅ HISTORIQUE DES PAIEMENTS
   */
  const getPaymentHistory = useCallback(async (debtId: string): Promise<DebtPayment[]> => {
    try {
      setError(null);
      console.log('📊 [useDebts] Getting payment history for debt:', debtId);
      return await debtService.getPaymentHistory(debtId, userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération de l\'historique des paiements';
      console.error('❌ [useDebts] Error getting payment history:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  /**
   * ✅ DETTES ÉLIGIBLES AU PAIEMENT CE MOIS
   */
  const getEligibleDebtsThisMonth = useCallback(async (): Promise<Debt[]> => {
    try {
      return await debtService.getEligibleDebtsThisMonth(userId);
    } catch (err) {
      console.error('❌ [useDebts] Error getting eligible debts:', err);
      return [];
    }
  }, [userId]);

  /**
   * ✅ DETTES EN RETARD
   */
  const getOverdueDebts = useCallback(async (): Promise<Debt[]> => {
    try {
      return await debtService.getOverdueDebts(userId);
    } catch (err) {
      console.error('❌ [useDebts] Error getting overdue debts:', err);
      return [];
    }
  }, [userId]);

  /**
   * ✅ VÉRIFICATION D'ÉLIGIBILITÉ POUR AFFICHAGE
   */
  const checkPaymentEligibility = useCallback((debt: Debt): { 
    isEligible: boolean; 
    reason: string;
    dueDate?: string;
  } => {
    return {
      isEligible: debt.paymentEligibility.isEligible,
      reason: debt.paymentEligibility.reason || 'Paiement non autorisé',
      dueDate: debt.dueDate
    };
  }, []);

  /**
   * ✅ MISE À JOUR MANUELLE DES STATUTS
   */
  const updateDebtStatuses = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 [useDebts] Manually updating debt statuses...');
      await debtService.updateDebtStatuses(userId);
      await loadDebts();
    } catch (err) {
      console.error('❌ [useDebts] Error updating debt statuses:', err);
    }
  }, [userId, loadDebts]);

  /**
   * ✅ DIAGNOSTIC DE LA BASE DE DONNÉES
   */
  const diagnoseDatabase = useCallback(async () => {
    try {
      return await debtService.diagnoseDatabase();
    } catch (err) {
      console.error('❌ [useDebts] Error diagnosing database:', err);
      throw err;
    }
  }, []);

  const refreshDebts = useCallback(async (): Promise<void> => {
    await loadDebts();
  }, [loadDebts]);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  /**
   * ✅ TRAITER LES PAIEMENTS AUTOMATIQUES DES DETTES
   */
  const processAutoPayDebts = useCallback(async () => {
    try {
      setError(null);
      const result = await debtService.processDueDebts(userId);
      if (result.processed > 0) {
        await loadDebts();
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du traitement automatique des dettes';
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadDebts]);

  // ✅ CHARGEMENT INITIAL
  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  // ✅ MISE À JOUR PÉRIODIQUE DES STATUTS (TOUTES LES HEURES)
  useEffect(() => {
    const interval = setInterval(updateDebtStatuses, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [updateDebtStatuses]);

  return {
    // État
    debts,
    payments,
    loading,
    error,
    stats,
    
    // Actions principales
    createDebt,
    updateDebt,
    deleteDebt,
    makePayment,
    
    // Récupération de données
    getDebtById,
    getPaymentHistory,
    getEligibleDebtsThisMonth,
    getOverdueDebts,
    
    // Utilitaires
    refreshDebts,
    clearError,
    checkPaymentEligibility,
    updateDebtStatuses,
    diagnoseDatabase,
    processAutoPayDebts,
  };
};

export default useDebts;