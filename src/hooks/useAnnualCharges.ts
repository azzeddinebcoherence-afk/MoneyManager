// src/hooks/useAnnualCharges.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { useCallback, useEffect, useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import annualChargeService from '../services/annualChargeService';
import { AnnualCharge, CreateAnnualChargeData, UpdateAnnualChargeData } from '../types/AnnualCharge';

export const useAnnualCharges = (userId: string = 'default-user') => {
  const [annualCharges, setAnnualCharges] = useState<AnnualCharge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { formatAmount } = useCurrency();

  useEffect(() => {
    loadAnnualCharges();
  }, []);

  const loadAnnualCharges = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 [useAnnualCharges] Loading annual charges...');
      const charges = await annualChargeService.getAllAnnualCharges(userId);
      setAnnualCharges(charges);
      
      console.log(`✅ [useAnnualCharges] Loaded ${charges.length} annual charges`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement des charges annuelles';
      setError(errorMessage);
      console.error('❌ [useAnnualCharges] Error loading annual charges:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const addAnnualCharge = useCallback(async (chargeData: CreateAnnualChargeData): Promise<string> => {
    try {
      setError(null);
      
      console.log('🔄 [useAnnualCharges] Creating annual charge...', {
        ...chargeData,
        isIslamic: chargeData.isIslamic || false
      });
      
      const id = await annualChargeService.createAnnualCharge(chargeData, userId);
      
      // Recharger la liste
      await loadAnnualCharges();
      
      console.log('✅ [useAnnualCharges] Annual charge created successfully:', id);
      return id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de création de charge annuelle';
      setError(errorMessage);
      console.error('❌ [useAnnualCharges] Error creating charge:', err);
      throw err;
    }
  }, [userId, loadAnnualCharges]);

  const updateAnnualCharge = useCallback(async (id: string, updates: UpdateAnnualChargeData): Promise<void> => {
    try {
      setError(null);
      
      console.log('🔄 [useAnnualCharges] Updating annual charge:', { id, updates });
      await annualChargeService.updateAnnualCharge(id, updates, userId);
      
      // Mettre à jour localement
      setAnnualCharges(prev => 
        prev.map(charge => 
          charge.id === id ? { ...charge, ...updates } : charge
        )
      );
      
      console.log('✅ [useAnnualCharges] Annual charge updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de mise à jour de charge annuelle';
      setError(errorMessage);
      console.error('❌ [useAnnualCharges] Error updating charge:', err);
      throw err;
    }
  }, [userId]);

  const deleteAnnualCharge = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      
      console.log('🔄 [useAnnualCharges] Deleting annual charge:', id);
      await annualChargeService.deleteAnnualCharge(id, userId);
      
      // Mettre à jour localement
      setAnnualCharges(prev => prev.filter(charge => charge.id !== id));
      
      console.log('✅ [useAnnualCharges] Annual charge deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de suppression de charge annuelle';
      setError(errorMessage);
      console.error('❌ [useAnnualCharges] Error deleting charge:', err);
      throw err;
    }
  }, [userId]);

  // ✅ CORRECTION : getAnnualChargeById renommé en getChargeById pour compatibilité
  const getChargeById = useCallback(async (id: string): Promise<AnnualCharge | null> => {
    try {
      return await annualChargeService.getAnnualChargeById(id, userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de récupération de charge annuelle';
      setError(errorMessage);
      console.error('❌ [useAnnualCharges] Error getting charge by id:', err);
      return null;
    }
  }, [userId]);

  // ✅ CONSERVER l'ancien nom pour compatibilité
  const getAnnualChargeById = useCallback(async (id: string): Promise<AnnualCharge | null> => {
    return getChargeById(id);
  }, [getChargeById]);

  const getChargesByCategory = useCallback(async (category: string): Promise<AnnualCharge[]> => {
    try {
      return await annualChargeService.getAnnualChargesByCategory(category, userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de récupération par catégorie';
      setError(errorMessage);
      console.error('❌ [useAnnualCharges] Error getting charges by category:', err);
      return [];
    }
  }, [userId]);

  const getIslamicCharges = useCallback(async (): Promise<AnnualCharge[]> => {
    try {
      return await annualChargeService.getIslamicAnnualCharges(userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de récupération des charges islamiques';
      setError(errorMessage);
      console.error('❌ [useAnnualCharges] Error getting islamic charges:', err);
      return [];
    }
  }, [userId]);

  const getActiveCharges = useCallback(async (): Promise<AnnualCharge[]> => {
    try {
      return await annualChargeService.getActiveAnnualCharges(userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de récupération des charges actives';
      setError(errorMessage);
      console.error('❌ [useAnnualCharges] Error getting active charges:', err);
      return [];
    }
  }, [userId]);

  const searchCharges = useCallback(async (query: string): Promise<AnnualCharge[]> => {
    try {
      return await annualChargeService.searchAnnualCharges(query, userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de recherche de charges';
      setError(errorMessage);
      console.error('❌ [useAnnualCharges] Error searching charges:', err);
      return [];
    }
  }, [userId]);

  const getChargesStats = useCallback(async () => {
    try {
      return await annualChargeService.getAnnualChargesStats(userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de récupération des statistiques';
      setError(errorMessage);
      console.error('❌ [useAnnualCharges] Error getting charges stats:', err);
      return {
        totalCharges: 0,
        totalAmount: 0,
        activeCharges: 0,
        islamicCharges: 0,
        paidCharges: 0,
        unpaidCharges: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        chargesByCategory: {}
      };
    }
  }, [userId]);

  const refreshAnnualCharges = useCallback(async () => {
    await loadAnnualCharges();
  }, [loadAnnualCharges]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Calculs locaux
  const totalAmount = annualCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const activeCharges = annualCharges.filter(charge => charge.isActive);
  const islamicCharges = annualCharges.filter(charge => charge.isIslamic);
  const paidCharges = annualCharges.filter(charge => charge.isPaid);
  const unpaidCharges = annualCharges.filter(charge => !charge.isPaid);
  const upcomingCharges = annualCharges
    .filter(charge => charge.isActive)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5);

  return {
    // État
    annualCharges,
    isLoading,
    error,
    
    // Données calculées
    totalAmount,
    activeCharges,
    islamicCharges,
    paidCharges,
    unpaidCharges,
    upcomingCharges,
    
    // Actions principales
    addAnnualCharge,
    updateAnnualCharge,
    deleteAnnualCharge,
    
    // Récupération de charges
    getChargeById, // ✅ NOUVEAU : nom court pour compatibilité
    getAnnualChargeById, // ✅ ANCIEN : gardé pour rétrocompatibilité
    getChargesByCategory,
    getIslamicCharges,
    getActiveCharges,
    searchCharges,
    getChargesStats,
    
    // Utilitaires
    refreshAnnualCharges,
    clearError,
    formatAmount
  };
};

export default useAnnualCharges;