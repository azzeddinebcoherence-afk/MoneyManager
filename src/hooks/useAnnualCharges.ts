// src/hooks/useAnnualCharges.ts - VERSION CORRIGÉE
import { useCallback, useEffect, useRef, useState } from 'react';
import { annualChargeService } from '../services/annualChargeService';
import { AnnualCharge, AnnualChargeStats, CreateAnnualChargeData, UpdateAnnualChargeData } from '../types/AnnualCharge';

export const useAnnualCharges = (userId: string = 'default-user') => {
  const [charges, setCharges] = useState<AnnualCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isLoadingRef = useRef(false);
  const mountedRef = useRef(true);
  const userIdRef = useRef(userId);

  // Mettre à jour la référence userId
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const loadCharges = useCallback(async () => {
    if (isLoadingRef.current || !mountedRef.current) return;
    
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const annualCharges = await annualChargeService.getAllAnnualCharges(userIdRef.current);
      if (mountedRef.current) {
        setCharges(annualCharges);
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des charges';
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      isLoadingRef.current = false;
    }
  }, []);

  const forceRefresh = useCallback(() => {
    loadCharges();
  }, [loadCharges]);

  // Filtrage année courante (utilisé pour les stats uniquement)
  const currentYearCharges = charges.filter(charge => {
    const chargeYear = new Date(charge.dueDate).getFullYear();
    return chargeYear === new Date().getFullYear();
  });

  // Actions
  const createCharge = useCallback(async (chargeData: CreateAnnualChargeData): Promise<string> => {
    try {
      setError(null);
      const chargeId = await annualChargeService.createAnnualCharge(chargeData, userIdRef.current);
      await loadCharges();
      return chargeId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la charge';
      setError(errorMessage);
      throw err;
    }
  }, [loadCharges]);

  const payCharge = useCallback(async (chargeId: string, accountId?: string): Promise<void> => {
    try {
      setError(null);
      await annualChargeService.payCharge(chargeId, accountId, userIdRef.current);
      await loadCharges();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du paiement de la charge';
      setError(errorMessage);
      throw err;
    }
  }, [loadCharges]);

  const togglePaidStatus = useCallback(async (chargeId: string, isPaid: boolean): Promise<void> => {
    try {
      setError(null);
      await annualChargeService.togglePaidStatus(chargeId, isPaid, userIdRef.current);
      await loadCharges();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du changement de statut';
      setError(errorMessage);
      throw err;
    }
  }, [loadCharges]);

  const getStats = useCallback(async (): Promise<AnnualChargeStats> => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const totalAmount = currentYearCharges.reduce((sum, charge) => sum + charge.amount, 0);
      const paidAmount = currentYearCharges
        .filter(charge => charge.isPaid)
        .reduce((sum, charge) => sum + charge.amount, 0);
      const pendingAmount = totalAmount - paidAmount;

      const upcomingCharges = currentYearCharges
        .filter(charge => !charge.isPaid && charge.dueDate >= today)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);

      const overdueCharges = currentYearCharges
        .filter(charge => !charge.isPaid && charge.dueDate < today)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      return {
        totalCharges: currentYearCharges.length,
        totalAmount,
        paidAmount,
        pendingAmount,
        upcomingCharges,
        overdueCharges
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des statistiques';
      setError(errorMessage);
      throw err;
    }
  }, [currentYearCharges]);

  // Autres méthodes...
  const updateAnnualCharge = useCallback(async (chargeId: string, updates: UpdateAnnualChargeData): Promise<void> => {
    try {
      setError(null);
      await annualChargeService.updateAnnualCharge(chargeId, updates, userIdRef.current);
      await loadCharges();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la charge';
      setError(errorMessage);
      throw err;
    }
  }, [loadCharges]);

  const deleteAnnualCharge = useCallback(async (chargeId: string): Promise<void> => {
    try {
      setError(null);
      await annualChargeService.deleteAnnualCharge(chargeId, userIdRef.current);
      await loadCharges();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la charge';
      setError(errorMessage);
      throw err;
    }
  }, [loadCharges]);

  const getChargeById = useCallback(async (chargeId: string): Promise<AnnualCharge | null> => {
    try {
      return await annualChargeService.getAnnualChargeById(chargeId, userIdRef.current);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération de la charge';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const processAutoDeductCharges = useCallback(async () => {
    try {
      setError(null);
      const result = await annualChargeService.processDueCharges(userIdRef.current);
      if (result.processed > 0) {
        await loadCharges();
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du traitement automatique';
      setError(errorMessage);
      throw err;
    }
  }, [loadCharges]);

  // Effects
  useEffect(() => {
    loadCharges();
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    // Retourner toutes les charges actives; l'écran appliquera ses filtres
    charges,
    loading,
    error,
    createCharge,
    updateAnnualCharge,
    deleteAnnualCharge,
    togglePaidStatus,
    payCharge,
    refreshAnnualCharges: loadCharges,
    getChargeById,
    getStats,
    forceRefresh,
    processAutoDeductCharges,
    clearError: useCallback(() => setError(null), []),
  };
};

export default useAnnualCharges;