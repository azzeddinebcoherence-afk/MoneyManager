// src/hooks/useAnnualCharges.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { useCallback, useEffect, useState } from 'react';
import { annualChargeService } from '../services/annualChargeService';
import { AnnualCharge, AnnualChargeStats, CreateAnnualChargeData, UpdateAnnualChargeData } from '../types/AnnualCharge';

export const useAnnualCharges = (userId: string = 'default-user') => {
  const [charges, setCharges] = useState<AnnualCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCharges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 [useAnnualCharges] Loading annual charges...');
      const annualCharges = await annualChargeService.getAllAnnualCharges(userId);
      setCharges(annualCharges);
      console.log('✅ [useAnnualCharges] Loaded', annualCharges.length, 'charges');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des charges';
      console.error('❌ [useAnnualCharges] Error loading charges:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Créer une charge annuelle
  const createCharge = useCallback(async (chargeData: CreateAnnualChargeData): Promise<string> => {
    try {
      setError(null);
      console.log('🔄 [useAnnualCharges] Creating annual charge...');
      const chargeId = await annualChargeService.createAnnualCharge(chargeData, userId);
      await loadCharges();
      console.log('✅ [useAnnualCharges] Annual charge created successfully');
      return chargeId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la charge';
      console.error('❌ [useAnnualCharges] Error creating charge:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadCharges]);

  // Mettre à jour une charge annuelle
  const updateAnnualCharge = useCallback(async (chargeId: string, updates: UpdateAnnualChargeData): Promise<void> => {
    try {
      setError(null);
      console.log('🔄 [useAnnualCharges] Updating annual charge:', chargeId);
      await annualChargeService.updateAnnualCharge(chargeId, updates, userId);
      await loadCharges();
      console.log('✅ [useAnnualCharges] Annual charge updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la charge';
      console.error('❌ [useAnnualCharges] Error updating charge:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadCharges]);

  // Supprimer une charge annuelle
  const deleteAnnualCharge = useCallback(async (chargeId: string): Promise<void> => {
    try {
      setError(null);
      console.log('🗑️ [useAnnualCharges] Deleting annual charge:', chargeId);
      await annualChargeService.deleteAnnualCharge(chargeId, userId);
      await loadCharges();
      console.log('✅ [useAnnualCharges] Annual charge deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la charge';
      console.error('❌ [useAnnualCharges] Error deleting charge:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadCharges]);

  // Basculer le statut payé
  const togglePaidStatus = useCallback(async (chargeId: string, isPaid: boolean): Promise<void> => {
    try {
      setError(null);
      console.log('🔄 [useAnnualCharges] Toggling paid status:', chargeId, isPaid);
      await annualChargeService.togglePaidStatus(chargeId, isPaid, userId);
      await loadCharges();
      console.log('✅ [useAnnualCharges] Paid status toggled successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du changement de statut';
      console.error('❌ [useAnnualCharges] Error toggling paid status:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadCharges]);

  // Payer une charge avec déduction du compte
  const payCharge = useCallback(async (chargeId: string, accountId?: string): Promise<void> => {
    try {
      setError(null);
      console.log('💰 [useAnnualCharges] Paying charge:', chargeId, 'with account:', accountId);
      await annualChargeService.payCharge(chargeId, accountId, userId);
      await loadCharges();
      console.log('✅ [useAnnualCharges] Charge paid successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du paiement de la charge';
      console.error('❌ [useAnnualCharges] Error paying charge:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadCharges]);

  // Traiter les charges dues automatiquement
  const processDueCharges = useCallback(async (): Promise<{ processed: number; errors: string[] }> => {
    try {
      setError(null);
      console.log('🔄 [useAnnualCharges] Processing due charges...');
      const result = await annualChargeService.processDueCharges(userId);
      await loadCharges();
      console.log('✅ [useAnnualCharges] Due charges processed:', result.processed);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du traitement des charges dues';
      console.error('❌ [useAnnualCharges] Error processing due charges:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadCharges]);

  // Obtenir une charge par ID
  const getChargeById = useCallback(async (chargeId: string): Promise<AnnualCharge | null> => {
    try {
      setError(null);
      console.log('🔍 [useAnnualCharges] Getting charge by ID:', chargeId);
      const charge = await annualChargeService.getAnnualChargeById(chargeId, userId);
      return charge;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération de la charge';
      console.error('❌ [useAnnualCharges] Error getting charge by ID:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  // ✅ CORRECTION : getAnnualChargeStats (nom correct)
  const getStats = useCallback(async (): Promise<AnnualChargeStats> => {
    try {
      setError(null);
      console.log('📊 [useAnnualCharges] Getting stats...');
      const stats = await annualChargeService.getAnnualChargeStats(userId);
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des statistiques';
      console.error('❌ [useAnnualCharges] Error getting stats:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  const getChargesForCurrentMonth = useCallback(async (): Promise<AnnualCharge[]> => {
    try {
      const charges = await annualChargeService.getAllAnnualCharges(userId);
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      return charges.filter(charge => {
        const dueDate = new Date(charge.dueDate);
        return dueDate.getMonth() === currentMonth && 
               dueDate.getFullYear() === currentYear;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du filtrage des charges du mois';
      console.error('❌ [useAnnualCharges] Error getting current month charges:', errorMessage);
      setError(errorMessage);
      return [];
    }
  }, [userId]);

  // Filtrer par statut
  const getChargesByStatus = useCallback(async (status: 'all' | 'paid' | 'pending' | 'upcoming' | 'overdue'): Promise<AnnualCharge[]> => {
    try {
      setError(null);
      console.log('🔍 [useAnnualCharges] Getting charges by status:', status);
      const filteredCharges = await annualChargeService.getChargesByStatus(status, userId);
      return filteredCharges;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du filtrage des charges';
      console.error('❌ [useAnnualCharges] Error filtering charges:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  // Obtenir les charges avec prélèvement automatique
  const getAutoDeductCharges = useCallback(async (): Promise<AnnualCharge[]> => {
    try {
      const charges = await annualChargeService.getAllAnnualCharges(userId);
      return charges.filter(charge => charge.autoDeduct === true && charge.accountId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des charges auto';
      console.error('❌ [useAnnualCharges] Error getting auto-deduct charges:', errorMessage);
      return [];
    }
  }, [userId]);

  // Statistiques par catégorie
  const getChargesByCategory = useCallback(() => {
    const categories = charges.reduce((acc, charge) => {
      if (!acc[charge.category]) {
        acc[charge.category] = 0;
      }
      acc[charge.category] += charge.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories).map(([name, amount]) => ({
      name,
      amount,
    }));
  }, [charges]);

  // Rafraîchir les charges
  const refreshAnnualCharges = useCallback(async (): Promise<void> => {
    await loadCharges();
  }, [loadCharges]);

  // Réinitialiser les erreurs
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  useEffect(() => {
    loadCharges();
  }, [loadCharges]);

  return {
    // État
    charges,
    loading,
    error,

    // Actions principales
    createCharge,
    updateAnnualCharge,
    deleteAnnualCharge,
    togglePaidStatus,
    payCharge,
    refreshAnnualCharges,
    getChargeById,
    getStats,
    getChargesByStatus,
    processDueCharges,

    // Nouvelles méthodes
    getAutoDeductCharges,
    getChargesForCurrentMonth,

    // Utilitaires
    getChargesByCategory,
    clearError,
  };
};