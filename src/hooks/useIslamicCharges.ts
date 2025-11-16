// src/hooks/useIslamicCharges.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { annualChargeService } from '../services/annualChargeService';
import { IslamicCalendarService } from '../services/islamicCalendarService';
import { CreateAnnualChargeData } from '../types/AnnualCharge';
import { IslamicCharge, IslamicSettings } from '../types/IslamicCharge';

export const useIslamicCharges = (userId: string = 'default-user') => {
  const [islamicCharges, setIslamicCharges] = useState<IslamicCharge[]>([]);
  const [settings, setSettings] = useState<IslamicSettings>({
    isEnabled: false,
    calculationMethod: 'UmmAlQura',
    customCharges: [],
    autoCreateCharges: true,
    includeRecommended: true,
    defaultAmounts: {
      obligatory: 100,
      recommended: 50
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ CORRECTION : Charger les paramètres au démarrage
  const loadSettings = useCallback(async () => {
    try {
      // Pour l'instant, on utilise des paramètres par défaut
      // Plus tard, on pourra les charger depuis la base de données
      console.log('⚙️ [useIslamicCharges] Chargement des paramètres islamiques');
    } catch (error) {
      console.error('❌ Erreur chargement paramètres islamiques:', error);
    }
  }, []);

  // ✅ CORRECTION : Sauvegarder les paramètres
  const saveSettings = useCallback(async (newSettings: IslamicSettings): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('💾 [useIslamicCharges] Sauvegarde paramètres islamiques:', {
        enabled: newSettings.isEnabled,
        autoCreate: newSettings.autoCreateCharges
      });

      setSettings(newSettings);

      // ✅ CRITIQUE : Générer immédiatement les charges si activation
      if (newSettings.isEnabled && newSettings.autoCreateCharges) {
        console.log('🚀 Activation + génération automatique des charges');
        await generateChargesForCurrentYear();
      }
      
      // ✅ CRITIQUE : Nettoyer les charges si désactivation
      if (!newSettings.isEnabled) {
        console.log('🧹 Désactivation - nettoyage des charges islamiques');
        setIslamicCharges([]);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur sauvegarde paramètres';
      console.error('❌ [useIslamicCharges] Erreur sauvegarde:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ NOUVELLE MÉTHODE : Convertir IslamicCharge en AnnualCharge
  const convertToAnnualChargeData = (islamicCharge: IslamicCharge): CreateAnnualChargeData => {
    return {
      name: islamicCharge.name,
      amount: islamicCharge.amount,
      dueDate: islamicCharge.calculatedDate.toISOString().split('T')[0],
      category: 'islamic',
      isIslamic: true,
      islamicHolidayId: islamicCharge.id,
      arabicName: islamicCharge.arabicName,
      type: islamicCharge.type === 'obligatory' ? 'obligatory' : 
            islamicCharge.type === 'recommended' ? 'recommended' : 'normal',
      notes: islamicCharge.description,
      isActive: true,
      isRecurring: islamicCharge.isRecurring,
      isPaid: islamicCharge.isPaid,
      reminderDays: 7
    };
  };

  // ✅ CORRECTION CRITIQUE : Générer les charges pour l'année courante
  const generateChargesForCurrentYear = useCallback(async (): Promise<void> => {
    try {
      if (!settings.isEnabled) {
        console.log('⏸️ Génération ignorée - fonctionnalité désactivée');
        return;
      }

      setLoading(true);
      setError(null);

      console.log('🔄 [useIslamicCharges] Génération charges islamiques...');

      const currentYear = new Date().getFullYear();
      const charges = IslamicCalendarService.getChargesForYear(currentYear);

      // Filtrer selon les paramètres
      const filteredCharges = charges.filter(charge => {
        if (charge.type === 'recommended' && !settings.includeRecommended) {
          return false;
        }
        return true;
      });

      console.log(`📋 ${filteredCharges.length} charges à créer`);

      const createdCharges: IslamicCharge[] = [];

      for (const islamicCharge of filteredCharges) {
        try {
          // Vérifier si la charge existe déjà
          const exists = await annualChargeService.checkIfIslamicChargeExists(
            islamicCharge.id,
            currentYear,
            userId
          );

          if (!exists) {
            const chargeData = convertToAnnualChargeData(islamicCharge);
            await annualChargeService.createAnnualCharge(chargeData, userId);
            createdCharges.push(islamicCharge);
            console.log(`✅ Charge créée: ${islamicCharge.name}`);
          } else {
            console.log(`ℹ️ Charge déjà existante: ${islamicCharge.name}`);
          }
        } catch (chargeError) {
          console.error(`❌ Erreur création charge ${islamicCharge.name}:`, chargeError);
        }
      }

      // Mettre à jour l'état local
      setIslamicCharges(prev => [...prev, ...createdCharges]);

      console.log(`✅ ${createdCharges.length} charges islamiques générées`);

      if (createdCharges.length > 0) {
        Alert.alert(
          '✅ Charges Générées',
          `${createdCharges.length} charges islamiques ont été créées pour cette année`
        );
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur génération charges';
      console.error('❌ [useIslamicCharges] Erreur génération:', errorMessage);
      setError(errorMessage);
      Alert.alert('Erreur', 'Impossible de générer les charges islamiques');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [settings.isEnabled, settings.includeRecommended, userId]);

  // ✅ CORRECTION : Charger les charges existantes
  const loadIslamicCharges = useCallback(async (): Promise<void> => {
    try {
      if (!settings.isEnabled) {
        console.log('⏸️ Chargement ignoré - fonctionnalité désactivée');
        setIslamicCharges([]);
        return;
      }

      setLoading(true);
      setError(null);

      console.log('🔍 [useIslamicCharges] Chargement charges islamiques...');

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
      console.error('❌ [useIslamicCharges] Erreur chargement:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [settings.isEnabled, userId]);

  // ✅ NOUVELLE MÉTHODE : Mettre à jour le montant d'une charge
  const updateChargeAmount = useCallback(async (chargeId: string, newAmount: number): Promise<void> => {
    try {
      setError(null);
      
      await annualChargeService.updateAnnualCharge(chargeId, { amount: newAmount }, userId);
      
      // Mettre à jour l'état local
      setIslamicCharges(prev => 
        prev.map(charge => 
          charge.id === chargeId ? { ...charge, amount: newAmount } : charge
        )
      );
      
      console.log(`💰 Montant mis à jour: ${chargeId} -> ${newAmount} MAD`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur mise à jour montant';
      console.error('❌ [useIslamicCharges] Erreur mise à jour montant:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  // ✅ NOUVELLE MÉTHODE : Marquer comme payé
  const markAsPaid = useCallback(async (chargeId: string, accountId?: string): Promise<void> => {
    try {
      setError(null);
      
      console.log(`💰 Paiement charge islamique: ${chargeId}`, { accountId });

      // Utiliser le service annualCharge pour le paiement
      await annualChargeService.payCharge(chargeId, accountId, userId);
      
      // Mettre à jour l'état local
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
      console.error('❌ [useIslamicCharges] Erreur paiement:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  // ✅ NOUVELLE MÉTHODE : Assigner un compte
  const assignAccount = useCallback(async (chargeId: string, accountId: string, autoDeduct: boolean = false): Promise<void> => {
    try {
      setError(null);
      
      await annualChargeService.updateAnnualCharge(
        chargeId, 
        { accountId, autoDeduct }, 
        userId
      );
      
      // Mettre à jour l'état local
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
      console.error('❌ [useIslamicCharges] Erreur assignation compte:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  // ✅ NOUVELLE MÉTHODE : Supprimer une charge
  const deleteCharge = useCallback(async (chargeId: string): Promise<void> => {
    try {
      setError(null);
      
      await annualChargeService.deleteAnnualCharge(chargeId, userId);
      
      // Mettre à jour l'état local
      setIslamicCharges(prev => prev.filter(charge => charge.id !== chargeId));
      
      console.log(`🗑️ Charge supprimée: ${chargeId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur suppression charge';
      console.error('❌ [useIslamicCharges] Erreur suppression:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [userId]);

  // ✅ NOUVELLE MÉTHODE : Vérifier si une charge peut être payée
  const canPayCharge = useCallback(async (chargeId: string): Promise<{ canPay: boolean; reason?: string }> => {
    try {
      return await annualChargeService.canPayCharge(chargeId, userId);
    } catch (err) {
      console.error('❌ [useIslamicCharges] Erreur vérification paiement:', err);
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
    
    // Utilitaires
    refreshCharges: loadIslamicCharges,
    clearError: () => setError(null)
  };
};

export default useIslamicCharges;