// src/hooks/useIslamicCharges.ts
import { useState, useCallback, useEffect } from 'react';
import { IslamicCharge, IslamicSettings, IslamicHoliday } from '../types/IslamicCharge';
import IslamicCalendarService from '../services/islamicCalendarService';
import { secureStorage } from '../services/storage/secureStorage';
import { useAnnualCharges } from './useAnnualCharges';

export const useIslamicCharges = () => {
  const [islamicCharges, setIslamicCharges] = useState<IslamicCharge[]>([]);
  const [settings, setSettings] = useState<IslamicSettings>({
    isEnabled: false,
    calculationMethod: 'UmmAlQura',
    customCharges: [],
    autoCreateCharges: true
  });
  const [isLoading, setIsLoading] = useState(false);

  const { addAnnualCharge, updateAnnualCharge, deleteAnnualCharge } = useAnnualCharges();

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
      const charges = IslamicCalendarService.getChargesForYear(currentYear);
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
      const charges = IslamicCalendarService.getChargesForYear(currentYear);
      
      // Convertir en charges annuelles
      for (const charge of charges) {
        await addAnnualCharge({
          name: \\ (\)\,
          amount: charge.amount,
          dueDate: charge.calculatedDate,
          category: 'islamic',
          description: charge.description,
          isRecurring: true,
          isIslamic: true,
          islamicHolidayId: charge.id
        });
      }
      
      setIslamicCharges(charges);
    } catch (error) {
      console.error('Error generating islamic charges:', error);
    }
  }, [settings.isEnabled, addAnnualCharge]);

  const updateChargeAmount = useCallback(async (chargeId: string, newAmount: number) => {
    setIslamicCharges(prev => 
      prev.map(charge => 
        charge.id === chargeId ? { ...charge, amount: newAmount } : charge
      )
    );

    // Mettre à jour aussi la charge annuelle correspondante
    // Implémentation à compléter
  }, []);

  const markAsPaid = useCallback(async (chargeId: string, paidDate: Date = new Date()) => {
    setIslamicCharges(prev =>
      prev.map(charge =>
        charge.id === chargeId 
          ? { ...charge, isPaid: true, paidDate } 
          : charge
      )
    );
  }, []);

  const addCustomCharge = useCallback(async (holiday: IslamicHoliday) => {
    const newSettings = {
      ...settings,
      customCharges: [...settings.customCharges, holiday]
    };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

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
    generateChargesForCurrentYear,
    loadChargesForCurrentYear,
    
    // Données
    availableHolidays: IslamicCalendarService.getAllHolidays()
  };
};
