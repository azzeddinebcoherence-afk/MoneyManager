// src/context/IslamicSettingsContext.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { secureStorage } from '../services/storage/secureStorage';
import { IslamicSettings } from '../types/IslamicCharge';

interface IslamicSettingsContextType {
  settings: IslamicSettings;
  updateSettings: (newSettings: IslamicSettings) => Promise<void>;
  isLoading: boolean;
}

const IslamicSettingsContext = createContext<IslamicSettingsContextType | undefined>(undefined);

interface IslamicSettingsProviderProps {
  children: ReactNode;
}

export const IslamicSettingsProvider: React.FC<IslamicSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<IslamicSettings>({
    isEnabled: false,
    calculationMethod: 'UmmAlQura',
    customCharges: [],
    autoCreateCharges: true,
    includeRecommended: true, // ✅ AJOUTÉ
    defaultAmounts: { // ✅ AJOUTÉ
      obligatory: 100,
      recommended: 50
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Charger les paramètres au démarrage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const savedSettings = await secureStorage.getItem('islamic_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
      console.log('✅ Islamic settings loaded successfully');
    } catch (error) {
      console.error('❌ Error loading islamic settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: IslamicSettings) => {
    try {
      setSettings(newSettings);
      await secureStorage.setItem('islamic_settings', JSON.stringify(newSettings));
      console.log('✅ Islamic settings updated successfully');
    } catch (error) {
      console.error('❌ Error saving islamic settings:', error);
      throw error;
    }
  };

  const value: IslamicSettingsContextType = {
    settings,
    updateSettings,
    isLoading
  };

  return (
    <IslamicSettingsContext.Provider value={value}>
      {children}
    </IslamicSettingsContext.Provider>
  );
};

export const useIslamicSettings = (): IslamicSettingsContextType => {
  const context = useContext(IslamicSettingsContext);
  if (context === undefined) {
    throw new Error('useIslamicSettings must be used within an IslamicSettingsProvider');
  }
  return context;
};

export default IslamicSettingsContext;