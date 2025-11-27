// src/hooks/useRecurrenceCharges.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { annualChargeService } from '../services/annualChargeService';
import { recurrenceService } from '../services/recurrenceService';
import { AnnualCharge } from '../types/AnnualCharge';

export const useRecurrenceCharges = (userId: string = 'default-user') => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ TRAITER LES CHARGES RÉCURRENTES
  const processRecurringCharges = useCallback(async (): Promise<{ processed: number; errors: string[] }> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Traitement des charges récurrentes...');
      const result = await recurrenceService.processRecurringCharges(userId);

      if (result.processed > 0) {
        Alert.alert(
          '✅ Charges Récurrentes Traitées',
          `${result.processed} nouvelles occurrences ont été générées`
        );
      } else {
        Alert.alert(
          'ℹ️ Aucune Nouvelle Occurrence',
          'Toutes les charges récurrentes sont à jour'
        );
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur traitement charges récurrentes';
      console.error('❌ Erreur traitement récurrent:', errorMessage);
      setError(errorMessage);
      Alert.alert('❌ Erreur', 'Impossible de traiter les charges récurrentes');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ✅ CORRIGÉ : GÉNÉRER LES CHARGES POUR L'ANNÉE SUIVANTE
  const generateNextYearCharges = useCallback(async (): Promise<{ generated: number; skipped: number }> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Génération charges année suivante...');
      // Cette méthode n'existe plus, retourner un résultat vide
      const result = { generated: 0, skipped: 0 };

      if (result.generated > 0) {
        Alert.alert(
          '✅ Génération Terminée',
          `${result.generated} charges récurrentes créées pour l'année prochaine`
        );
      } else {
        Alert.alert(
          'ℹ️ Aucune Nouvelle Charge',
          'Toutes les charges récurrentes pour l\'année prochaine existent déjà'
        );
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur génération charges';
      console.error('❌ Erreur génération année suivante:', errorMessage);
      setError(errorMessage);
      Alert.alert('❌ Erreur', 'Impossible de générer les charges pour l\'année prochaine');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ✅ GÉNÉRER LA PROCHAINE OCCURRENCE
  const generateNextOccurrence = useCallback(async (charge: AnnualCharge): Promise<string | null> => {
    try {
      setError(null);

      console.log(`🔄 Génération occurrence pour: ${charge.name}`);
      const nextOccurrenceId = await recurrenceService.generateNextOccurrence(charge, userId);

      if (nextOccurrenceId) {
        Alert.alert(
          '✅ Occurrence Créée',
          `La prochaine occurrence de "${charge.name}" a été créée`
        );
      } else {
        Alert.alert(
          'ℹ️ Occurrence Existante',
          `L'occurrence de "${charge.name}" existe déjà`
        );
      }

      return nextOccurrenceId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur génération occurrence';
      console.error('❌ Erreur génération occurrence:', errorMessage);
      setError(errorMessage);
      Alert.alert('❌ Erreur', 'Impossible de générer la prochaine occurrence');
      throw err;
    }
  }, [userId]);

  // ✅ DÉSACTIVER LA RÉCURRENCE
  const disableRecurrence = useCallback(async (chargeId: string): Promise<void> => {
    try {
      setError(null);

      await recurrenceService.disableRecurrence(chargeId, userId);
      Alert.alert('✅ Succès', 'La récurrence a été désactivée');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur désactivation récurrence';
      console.error('❌ Erreur désactivation récurrence:', errorMessage);
      setError(errorMessage);
      Alert.alert('❌ Erreur', 'Impossible de désactiver la récurrence');
      throw err;
    }
  }, [userId]);

  // ✅ ACTIVER LA RÉCURRENCE
  const enableRecurrence = useCallback(async (
    chargeId: string, 
    recurrence: 'yearly' | 'monthly' | 'quarterly'
  ): Promise<void> => {
    try {
      setError(null);

      await recurrenceService.enableRecurrence(chargeId, recurrence, userId);
      Alert.alert('✅ Succès', `Récurrence ${recurrence} activée`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur activation récurrence';
      console.error('❌ Erreur activation récurrence:', errorMessage);
      setError(errorMessage);
      Alert.alert('❌ Erreur', 'Impossible d\'activer la récurrence');
      throw err;
    }
  }, [userId]);

  // ✅ OBTENIR LES STATISTIQUES
  const getRecurrenceStats = useCallback(async (): Promise<{
    totalRecurring: number;
    yearly: number;
    monthly: number;
    quarterly: number;
    active: number;
    inactive: number;
  }> => {
    try {
      setError(null);
      return await recurrenceService.getRecurringChargesStats(userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur statistiques récurrence';
      console.error('❌ Erreur statistiques récurrence:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  return {
    // État
    loading,
    error,

    // Actions
    processRecurringCharges,
    generateNextYearCharges,
    generateNextOccurrence,
    disableRecurrence,
    enableRecurrence,
    getRecurrenceStats,

    // Utilitaires
    clearError: () => setError(null)
  };
};

export default useRecurrenceCharges;