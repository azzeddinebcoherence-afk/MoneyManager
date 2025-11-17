// src/hooks/useAnnualCharges.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { useCallback, useEffect, useState } from 'react';
import { annualChargeService } from '../services/annualChargeService';
import { recurrenceService } from '../services/recurrenceService';
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

  // ✅ NOUVEAU : Traiter automatiquement les charges récurrentes payées
  const processRecurringCharges = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 [useAnnualCharges] Processing recurring charges...');
      await recurrenceService.processRecurringCharges(userId);
      await loadCharges();
    } catch (error) {
      console.error('❌ [useAnnualCharges] Error processing recurring charges:', error);
    }
  }, [userId, loadCharges]);

  // ✅ CRÉER UNE CHARGE ANNUELLE AVEC MISE À JOUR DU SOLDE SI PAYÉE
  const createCharge = useCallback(async (chargeData: CreateAnnualChargeData): Promise<string> => {
    try {
      setError(null);
      console.log('🔄 [useAnnualCharges] Creating annual charge...');
      
      // ✅ CRITIQUE : Si la charge est créée comme payée, le solde sera mis à jour via transactionService
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

  // ✅ CORRIGÉ : Basculer le statut payé avec validation ET traitement récurrent
  const togglePaidStatus = useCallback(async (chargeId: string, isPaid: boolean): Promise<void> => {
    try {
      setError(null);
      console.log('🔄 [useAnnualCharges] Toggling paid status:', chargeId, isPaid);
      
      // Validation supplémentaire avant de payer
      if (isPaid) {
        const canPay = await annualChargeService.canPayCharge(chargeId, userId);
        if (!canPay.canPay) {
          throw new Error(canPay.reason || 'Impossible de payer cette charge');
        }
      }
      
      await annualChargeService.togglePaidStatus(chargeId, isPaid, userId);
      await loadCharges();

      // ✅ CRITIQUE : Si on marque comme payé ET que c'est récurrent, générer la prochaine occurrence
      if (isPaid) {
        const charge = await annualChargeService.getAnnualChargeById(chargeId, userId);
        if (charge && charge.isRecurring && charge.recurrence) {
          console.log('🔄 Charge récurrente payée - génération prochaine occurrence...');
          await recurrenceService.generateNextOccurrence(charge, userId);
          await loadCharges();
        }
      }

      console.log('✅ [useAnnualCharges] Paid status toggled successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du changement de statut';
      console.error('❌ [useAnnualCharges] Error toggling paid status:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadCharges]);

  // ✅ CORRIGÉ : Payer une charge avec déduction du compte et validation
  const payCharge = useCallback(async (chargeId: string, accountId?: string): Promise<void> => {
    try {
      setError(null);
      console.log('💰 [useAnnualCharges] Paying charge:', chargeId, 'with account:', accountId);
      
      // Vérifier si la charge peut être payée
      const canPay = await annualChargeService.canPayCharge(chargeId, userId);
      if (!canPay.canPay) {
        throw new Error(canPay.reason || 'Impossible de payer cette charge');
      }
      
      await annualChargeService.payCharge(chargeId, accountId, userId);
      await loadCharges();

      // ✅ CRITIQUE : Si c'est récurrent, générer la prochaine occurrence
      const charge = await annualChargeService.getAnnualChargeById(chargeId, userId);
      if (charge && charge.isRecurring && charge.recurrence) {
        console.log('🔄 Charge récurrente payée - génération prochaine occurrence...');
        await recurrenceService.generateNextOccurrence(charge, userId);
        await loadCharges();
      }

      console.log('✅ [useAnnualCharges] Charge paid successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du paiement de la charge';
      console.error('❌ [useAnnualCharges] Error paying charge:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadCharges]);

  // ✅ CORRIGÉ : Générer les charges récurrentes pour l'année suivante
  const generateRecurringCharges = useCallback(async (): Promise<{ generated: number; errors: string[] }> => {
    try {
      setError(null);
      console.log('🔄 [useAnnualCharges] Generating recurring charges for next year...');
      const result = await annualChargeService.generateRecurringChargesForNextYear(userId);
      
      // ✅ CORRECTION : Adapter le type de retour
      const adaptedResult = {
        generated: result.generated,
        errors: [] as string[] // On initialise un tableau vide pour les erreurs
      };
      
      await loadCharges();
      console.log('✅ [useAnnualCharges] Recurring charges generated:', result.generated);
      return adaptedResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la génération des charges récurrentes';
      console.error('❌ [useAnnualCharges] Error generating recurring charges:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadCharges]);

  // ✅ NOUVELLE MÉTHODE : GÉNÉRER LES CHARGES RÉCURRENTES POUR LES ANNÉES FUTURES
  const generateFutureRecurringCharges = useCallback(async (): Promise<{ generated: number; skipped: number }> => {
    try {
      setError(null);
      console.log('🔄 [useAnnualCharges] Generating future recurring charges...');
      const result = await annualChargeService.generateFutureRecurringCharges(userId);
      await loadCharges();
      console.log('✅ [useAnnualCharges] Future recurring charges generated:', result.generated);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la génération des charges futures';
      console.error('❌ [useAnnualCharges] Error generating future charges:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadCharges]);

  // ✅ NOUVELLE MÉTHODE : Activer/désactiver la récurrence
  const toggleRecurrence = useCallback(async (
    chargeId: string, 
    recurrence?: 'yearly' | 'monthly' | 'quarterly'
  ): Promise<void> => {
    try {
      setError(null);
      
      if (recurrence) {
        // Activer la récurrence
        await recurrenceService.enableRecurrence(chargeId, recurrence, userId);
        console.log(`✅ Récurrence activée (${recurrence}) pour la charge: ${chargeId}`);
      } else {
        // Désactiver la récurrence
        await recurrenceService.disableRecurrence(chargeId, userId);
        console.log(`✅ Récurrence désactivée pour la charge: ${chargeId}`);
      }
      
      await loadCharges();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification de la récurrence';
      console.error('❌ [useAnnualCharges] Error toggling recurrence:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId, loadCharges]);

  // Reste des méthodes inchangées...
  const canPayCharge = useCallback(async (chargeId: string): Promise<{ canPay: boolean; reason?: string }> => {
    try {
      return await annualChargeService.canPayCharge(chargeId, userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la validation';
      console.error('❌ [useAnnualCharges] Error checking if charge can be paid:', errorMessage);
      return { canPay: false, reason: errorMessage };
    }
  }, [userId]);

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

  const getRecurringCharges = useCallback(async (): Promise<AnnualCharge[]> => {
    try {
      setError(null);
      console.log('🔍 [useAnnualCharges] Getting recurring charges...');
      const recurringCharges = await annualChargeService.getRecurringCharges(userId);
      return recurringCharges;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des charges récurrentes';
      console.error('❌ [useAnnualCharges] Error getting recurring charges:', errorMessage);
      setError(errorMessage);
      return [];
    }
  }, [userId]);

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

  const refreshAnnualCharges = useCallback(async (): Promise<void> => {
    await loadCharges();
  }, [loadCharges]);

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

    // ✅ MÉTHODES CORRIGÉES ET NOUVELLES
    canPayCharge,
    getAutoDeductCharges,
    getChargesForCurrentMonth,
    generateRecurringCharges,
    generateFutureRecurringCharges, // ✅ NOUVEAU
    getRecurringCharges,
    toggleRecurrence,
    processRecurringCharges,

    // Utilitaires
    getChargesByCategory,
    clearError,
  };
};