// src/hooks/useSync.ts - NOUVEAU HOOK POUR SYNCHRONISATION
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useAccounts } from './useAccounts';
import { useAnnualCharges } from './useAnnualCharges';
import { useBudgets } from './useBudgets';
import { useDebts } from './useDebts';
import { useSavings } from './useSavings';
import { useTransactions } from './useTransactions';

export const useSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Hooks pour rafraîchir les données
  const { refreshAccounts } = useAccounts();
  const { refreshTransactions } = useTransactions();
  const { refreshBudgets } = useBudgets();
  const { refreshGoals } = useSavings();
  const { refreshDebts } = useDebts();
  const { refreshAnnualCharges } = useAnnualCharges();

  // ✅ SYNCHRONISER TOUTES LES DONNÉES
  const syncAllData = useCallback(async (): Promise<void> => {
    try {
      setIsSyncing(true);
      console.log('🔄 Début de la synchronisation...');

      // Synchroniser toutes les données en parallèle
      await Promise.all([
        refreshAccounts(),
        refreshTransactions(),
        refreshBudgets(),
        refreshGoals(),
        refreshDebts(),
        refreshAnnualCharges()
      ]);

      setLastSync(new Date());
      
      console.log('✅ Synchronisation terminée avec succès');
      Alert.alert('✅ Synchronisation', 'Toutes les données ont été synchronisées avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      Alert.alert('❌ Erreur', 'Une erreur est survenue lors de la synchronisation');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [
    refreshAccounts,
    refreshTransactions,
    refreshBudgets,
    refreshGoals,
    refreshDebts,
    refreshAnnualCharges
  ]);

  // ✅ SYNCHRONISER UN TYPE SPÉCIFIQUE DE DONNÉES
  const syncSpecificData = useCallback(async (dataType: 'accounts' | 'transactions' | 'budgets' | 'savings' | 'debts' | 'annualCharges'): Promise<void> => {
    try {
      setIsSyncing(true);
      console.log(`🔄 Synchronisation des ${dataType}...`);

      switch (dataType) {
        case 'accounts':
          await refreshAccounts();
          break;
        case 'transactions':
          await refreshTransactions();
          break;
        case 'budgets':
          await refreshBudgets();
          break;
        case 'savings':
          await refreshGoals();
          break;
        case 'debts':
          await refreshDebts();
          break;
        case 'annualCharges':
          await refreshAnnualCharges();
          break;
      }

      setLastSync(new Date());
      console.log(`✅ ${dataType} synchronisés avec succès`);
      
    } catch (error) {
      console.error(`❌ Erreur synchronisation ${dataType}:`, error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [
    refreshAccounts,
    refreshTransactions,
    refreshBudgets,
    refreshGoals,
    refreshDebts,
    refreshAnnualCharges
  ]);

  // ✅ FORCER LA SYNCHRONISATION (même si erreur précédente)
  const forceSync = useCallback(async (): Promise<void> => {
    try {
      setIsSyncing(true);
      console.log('🔄 Forçage de la synchronisation...');

      // Réinitialiser les erreurs avant de synchroniser
      await Promise.all([
        refreshAccounts(),
        refreshTransactions(),
        refreshBudgets(),
        refreshGoals(),
        refreshDebts(),
        refreshAnnualCharges()
      ]);

      setLastSync(new Date());
      console.log('✅ Synchronisation forcée terminée');
      Alert.alert('✅ Synchronisation', 'Synchronisation forcée terminée avec succès');
      
    } catch (error) {
      console.error('❌ Erreur synchronisation forcée:', error);
      Alert.alert('❌ Erreur', 'Échec de la synchronisation forcée');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [
    refreshAccounts,
    refreshTransactions,
    refreshBudgets,
    refreshGoals,
    refreshDebts,
    refreshAnnualCharges
  ]);

  return {
    // État
    isSyncing,
    lastSync,
    
    // Actions
    syncAllData,
    syncSpecificData,
    forceSync,
    
    // Utilitaires
    hasSynced: lastSync !== null,
    getLastSyncFormatted: () => lastSync ? lastSync.toLocaleString('fr-FR') : 'Jamais'
  };
};

export default useSync;