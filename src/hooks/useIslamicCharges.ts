// src/hooks/useIslamicCharges.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { useCallback, useEffect, useState } from 'react';
import IslamicCalendarService from '../services/islamicCalendarService';
import { secureStorage } from '../services/storage/secureStorage';
import { IslamicCharge, IslamicHoliday, IslamicSettings } from '../types/IslamicCharge';
import { useAccounts } from './useAccounts';
import { useAnnualCharges } from './useAnnualCharges';

export const useIslamicCharges = () => {
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
  const [isLoading, setIsLoading] = useState(false);

  const { createCharge } = useAnnualCharges();
  const { accounts } = useAccounts();

  useEffect(() => { 
    loadSettings();
    loadChargesForCurrentYear();
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const savedSettings = await secureStorage.getItem('islamic_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading islamic settings:', error);
    }
  }, []);

  const saveSettings = useCallback(async (newSettings: IslamicSettings) => {
    try {
      setSettings(newSettings);
      await secureStorage.setItem('islamic_settings', JSON.stringify(newSettings));
      
      if (newSettings.autoCreateCharges && newSettings.isEnabled) {
        await generateChargesForCurrentYear();
      }
    } catch (error) {
      console.error('Error saving islamic settings:', error);
    }
  }, []);

  const loadChargesForCurrentYear = useCallback(async () => {
    if (!settings.isEnabled) return;

    try {
      setIsLoading(true);
      const currentYear = new Date().getFullYear();
      const charges = await IslamicCalendarService.getChargesForYear(currentYear);
      setIslamicCharges(charges);
    } catch (error) {
      console.error('Error loading islamic charges:', error);
    } finally {
      setIsLoading(false);
    }
  }, [settings.isEnabled]);

  const generateChargesForCurrentYear = useCallback(async () => {
    if (!settings.isEnabled) return;

    try {
      const currentYear = new Date().getFullYear();
      const charges = await IslamicCalendarService.getChargesForYear(currentYear);
      
      // Convertir en charges annuelles avec compte par défaut
      const defaultAccount = accounts.find(acc => acc.type === 'bank') || accounts[0];
      
      for (const charge of charges) {
        // Filtrer selon les paramètres
        if (charge.type === 'recommended' && !settings.includeRecommended) {
          continue;
        }

        // Utiliser les montants par défaut si disponibles
        const amount = charge.amount > 0 ? charge.amount : 
          charge.type === 'obligatory' ? settings.defaultAmounts.obligatory :
          charge.type === 'recommended' ? settings.defaultAmounts.recommended : 0;

        // ✅ CORRECTION : Conversion du type 'custom' en 'normal'
        const chargeType = charge.type === 'custom' ? 'normal' : charge.type;

        // ✅ CORRECTION : dueDate doit être une string
        await createCharge({
          name: charge.name,
          amount: amount,
          dueDate: charge.calculatedDate.toISOString().split('T')[0], // ✅ CORRIGÉ
          category: 'islamic',
          notes: charge.description,
          accountId: defaultAccount?.id,
          autoDeduct: false,
          recurrence: 'yearly',
          isIslamic: true,
          arabicName: charge.arabicName,
          type: chargeType
        });
      }
      
      setIslamicCharges(charges);
    } catch (error) {
      console.error('Error generating islamic charges:', error);
    }
  }, [settings.isEnabled, createCharge, accounts, settings.includeRecommended, settings.defaultAmounts]);

  const updateChargeAmount = useCallback(async (chargeId: string, newAmount: number) => {
    setIslamicCharges(prev => 
      prev.map(charge => 
        charge.id === chargeId ? { ...charge, amount: newAmount } : charge
      )
    );

    console.log('Update charge amount:', chargeId, newAmount);
  }, []);

  const markAsPaid = useCallback(async (chargeId: string, accountId?: string, paidDate: Date = new Date()) => {
    try {
      const charge = islamicCharges.find(c => c.id === chargeId);
      if (!charge) return;

      if (accountId && charge.accountId) {
        console.log('Déduction du compte:', accountId, 'Montant:', charge.amount);
      }

      setIslamicCharges(prev =>
        prev.map(charge =>
          charge.id === chargeId 
            ? { ...charge, isPaid: true, paidDate } 
            : charge
        )
      );
    } catch (error) {
      console.error('Error marking charge as paid:', error);
    }
  }, [islamicCharges]);

  const addCustomCharge = useCallback(async (holiday: IslamicHoliday) => {
    const newSettings = {
      ...settings,
      customCharges: [...settings.customCharges, holiday]
    };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const assignAccountToCharge = useCallback(async (chargeId: string, accountId: string, autoDeduct: boolean = false) => {
    setIslamicCharges(prev =>
      prev.map(charge =>
        charge.id === chargeId 
          ? { ...charge, accountId, autoDeduct } 
          : charge
      )
    );

    console.log('Assign account to charge:', chargeId, accountId, autoDeduct);
  }, []);

  return {
    // État
    islamicCharges,
    settings,
    isLoading,
    
    // Actions
    saveSettings,
    updateChargeAmount,
    markAsPaid,
    addCustomCharge,
    assignAccountToCharge,
    generateChargesForCurrentYear,
    loadChargesForCurrentYear,
    
    // Données
    availableHolidays: IslamicCalendarService.getAllHolidays()
  };
};