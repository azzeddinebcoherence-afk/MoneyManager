// src/hooks/useIslamicCharges.ts - VERSION FINALE CORRIGÉE
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { annualChargeService } from '../services/annualChargeService';
import { IslamicCalendarService } from '../services/islamicCalendarService';
import { islamicChargeService } from '../services/islamicChargeService';
import { secureStorage } from '../services/storage/secureStorage';
import { DEFAULT_ISLAMIC_SETTINGS, IslamicCharge, IslamicSettings } from '../types/IslamicCharge';

export const useIslamicCharges = (userId: string = 'default-user') => {
  const [islamicCharges, setIslamicCharges] = useState<IslamicCharge[]>([]);
  const [settings, setSettings] = useState<IslamicSettings>(DEFAULT_ISLAMIC_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ CHARGER LES CHARGES EXISTANTES
  const loadIslamicCharges = useCallback(async (): Promise<void> => {
    try {
      // ✅ CRITIQUE : Si désactivé, NE PAS charger les charges islamiques
      if (!settings.isEnabled) {
        console.log('⏸️ Chargement ignoré - fonctionnalité désactivée');
        setIslamicCharges([]); // ✅ VIDER les charges affichées
        return;
      }

      setLoading(true);
      setError(null);

      console.log('🔍 Chargement charges islamiques...');

      const annualCharges = await annualChargeService.getIslamicAnnualCharges(userId);
      
      // Convertir AnnualCharge en IslamicCharge
      const convertedCharges: IslamicCharge[] = annualCharges.map(charge => {
        const holiday = IslamicCalendarService.getHolidayById(charge.islamicHolidayId || '');
        
        return {
          id: charge.id,
          name: charge.name,
          arabicName: charge.arabicName || '',
          description: charge.notes || '',
          hijriMonth: holiday?.hijriMonth || 1,
          hijriDay: holiday?.hijriDay || 1,
          type: charge.type as 'obligatory' | 'recommended' | 'custom',
          defaultAmount: charge.amount,
          isRecurring: charge.recurrence !== undefined,
          year: new Date(charge.dueDate).getFullYear(),
          calculatedDate: new Date(charge.dueDate),
          amount: charge.amount,
          isPaid: charge.isPaid,
          paidDate: charge.paidDate ? new Date(charge.paidDate) : undefined,
          accountId: charge.accountId,
          autoDeduct: charge.autoDeduct || false
        };
      });

      setIslamicCharges(convertedCharges);
      console.log(`✅ ${convertedCharges.length} charges islamiques chargées`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur chargement charges';
      console.error('❌ Erreur chargement:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [settings.isEnabled, userId]);

  // ✅ GÉNÉRER LES CHARGES POUR L'ANNÉE COURANTE
  const generateChargesForCurrentYear = useCallback(async (): Promise<void> => {
    try {
      if (!settings.isEnabled) {
        console.log('⏸️ Génération ignorée - fonctionnalité désactivée');
        Alert.alert('Information', 'Veuillez d\'abord activer les charges islamiques');
        return;
      }

      setLoading(true);
      setError(null);

      console.log('🔄 Génération charges islamiques...');

      const currentYear = new Date().getFullYear();
      const result = await islamicChargeService.generateChargesForYear(currentYear, settings, userId);

      // Recharger les charges
      await loadIslamicCharges();

      if (result.created > 0) {
        Alert.alert(
          '✅ Charges Générées',
          `${result.created} charges islamiques ont été créées pour cette année`
        );
      } else if (result.skipped > 0) {
        Alert.alert(
          'ℹ️ Aucune nouvelle charge',
          `Toutes les charges islamiques pour ${currentYear} existent déjà`
        );
      } else {
        Alert.alert(
          'ℹ️ Aucune charge générée',
          'Aucune nouvelle charge islamique n\'a été générée'
        );
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur génération charges';
      console.error('❌ Erreur génération:', errorMessage);
      setError(errorMessage);
      Alert.alert('Erreur', 'Impossible de générer les charges islamiques');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [settings, userId, loadIslamicCharges]);

  // ✅ CHARGER LES PARAMÈTRES DEPUIS LE STOCKAGE
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const savedSettings = await secureStorage.getItem('islamic_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        console.log('✅ Paramètres islamiques chargés:', parsedSettings.isEnabled);
        
        // ✅ CRITIQUE : Contrôler la génération selon l'état
        IslamicCalendarService.setGenerationAllowed(parsedSettings.isEnabled);
      } else {
        // Utiliser les paramètres par défaut
        setSettings(DEFAULT_ISLAMIC_SETTINGS);
        IslamicCalendarService.setGenerationAllowed(false);
        console.log('✅ Paramètres islamiques par défaut chargés');
      }
    } catch (error) {
      console.error('❌ Erreur chargement paramètres islamiques:', error);
      setSettings(DEFAULT_ISLAMIC_SETTINGS);
      IslamicCalendarService.setGenerationAllowed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ SAUVEGARDER LES PARAMÈTRES DANS LE STOCKAGE
  const saveSettings = useCallback(async (newSettings: IslamicSettings): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('💾 Sauvegarde paramètres islamiques:', {
        enabled: newSettings.isEnabled,
        autoCreate: newSettings.autoCreateCharges
      });

      // ✅ CRITIQUE : Contrôler la génération selon le nouvel état
      IslamicCalendarService.setGenerationAllowed(newSettings.isEnabled);

      // Sauvegarder dans le state local
      setSettings(newSettings);

      // Sauvegarder dans le stockage sécurisé
      await secureStorage.setItem('islamic_settings', JSON.stringify(newSettings));

      // ✅ CRITIQUE : Générer immédiatement les charges si activation
      if (newSettings.isEnabled && newSettings.autoCreateCharges) {
        console.log('🚀 Activation + génération automatique des charges');
        await generateChargesForCurrentYear();
      }
      
      // ✅ CRITIQUE : Quand on désactive, MASQUER les charges (ne pas supprimer de la base)
      if (!newSettings.isEnabled) {
        console.log('🧹 Désactivation - masquage des charges islamiques');
        setIslamicCharges([]); // ✅ VIDER l'affichage seulement
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur sauvegarde paramètres';
      console.error('❌ Erreur sauvegarde:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [generateChargesForCurrentYear]);

  // ✅ MÉTHODE : Supprimer définitivement les charges islamiques
  const deleteAllIslamicCharges = useCallback(async (): Promise<number> => {
    try {
      setError(null);
      
      const deletedCount = await islamicChargeService.deleteAllIslamicCharges(userId);
      
      // Mettre à jour l'état local
      setIslamicCharges([]);
      
      console.log(`🗑️ ${deletedCount} charges islamiques supprimées définitivement`);
      return deletedCount;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur suppression charges';
      console.error('❌ Erreur suppression:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  // ✅ MÉTHODE : Obtenir le nombre de charges islamiques dans la base (même si désactivé)
  const getIslamicChargesCount = useCallback(async (): Promise<number> => {
    try {
      const annualCharges = await annualChargeService.getIslamicAnnualCharges(userId);
      return annualCharges.length;
    } catch (err) {
      console.error('❌ Erreur comptage charges:', err);
      return 0;
    }
  }, [userId]);

  // Reste des méthodes inchangées...
  const updateChargeAmount = useCallback(async (chargeId: string, newAmount: number): Promise<void> => {
    try {
      setError(null);
      
      await annualChargeService.updateAnnualCharge(chargeId, { amount: newAmount }, userId);
      
      setIslamicCharges(prev => 
        prev.map(charge => 
          charge.id === chargeId ? { ...charge, amount: newAmount } : charge
        )
      );
      
      console.log(`💰 Montant mis à jour: ${chargeId} -> ${newAmount} MAD`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur mise à jour montant';
      console.error('❌ Erreur mise à jour montant:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  const markAsPaid = useCallback(async (chargeId: string, accountId?: string): Promise<void> => {
    try {
      setError(null);
      
      console.log(`💰 Paiement charge islamique: ${chargeId}`, { accountId });

      const canPay = await annualChargeService.canPayCharge(chargeId, userId);
      if (!canPay.canPay) {
        throw new Error(canPay.reason || 'Cette charge ne peut pas être payée pour le moment');
      }

      await annualChargeService.payCharge(chargeId, accountId, userId);
      
      setIslamicCharges(prev => 
        prev.map(charge => 
          charge.id === chargeId ? { 
            ...charge, 
            isPaid: true, 
            paidDate: new Date() 
          } : charge
        )
      );
      
      console.log(`✅ Charge marquée comme payée: ${chargeId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur paiement charge';
      console.error('❌ Erreur paiement:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  const assignAccount = useCallback(async (chargeId: string, accountId: string, autoDeduct: boolean = false): Promise<void> => {
    try {
      setError(null);
      
      await annualChargeService.updateAnnualCharge(
        chargeId, 
        { accountId, autoDeduct }, 
        userId
      );
      
      setIslamicCharges(prev => 
        prev.map(charge => 
          charge.id === chargeId ? { 
            ...charge, 
            accountId, 
            autoDeduct 
          } : charge
        )
      );
      
      console.log(`🏦 Compte assigné: ${chargeId} -> ${accountId} (auto: ${autoDeduct})`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur assignation compte';
      console.error('❌ Erreur assignation compte:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  const deleteCharge = useCallback(async (chargeId: string): Promise<void> => {
    try {
      setError(null);
      
      await annualChargeService.deleteAnnualCharge(chargeId, userId);
      
      setIslamicCharges(prev => prev.filter(charge => charge.id !== chargeId));
      
      console.log(`🗑️ Charge supprimée: ${chargeId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur suppression charge';
      console.error('❌ Erreur suppression:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  const canPayCharge = useCallback(async (chargeId: string): Promise<{ canPay: boolean; reason?: string }> => {
    try {
      return await annualChargeService.canPayCharge(chargeId, userId);
    } catch (err) {
      console.error('❌ Erreur vérification paiement:', err);
      return { canPay: false, reason: 'Erreur de vérification' };
    }
  }, [userId]);

  // ✅ EFFETS : Chargement initial
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadIslamicCharges();
  }, [loadIslamicCharges]);

  return {
    // État
    islamicCharges,
    settings,
    loading,
    error,
    
    // Actions paramètres
    saveSettings,
    
    // Actions charges
    generateChargesForCurrentYear,
    updateChargeAmount,
    markAsPaid,
    assignAccount,
    deleteCharge,
    canPayCharge,
    
    // ✅ NOUVELLES MÉTHODES : Gestion suppression/masquage
    deleteAllIslamicCharges,
    getIslamicChargesCount,
    
    // Utilitaires
    refreshCharges: loadIslamicCharges,
    clearError: () => setError(null)
  };
};

export default useIslamicCharges;