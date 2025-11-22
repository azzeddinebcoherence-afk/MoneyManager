// src/context/SecurityContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import { SecurityPreferences, securityPreferencesService } from '../services/storage/securityPreferences';

interface SecurityContextValue {
  // État
  isLocked: boolean;
  preferences: SecurityPreferences;
  biometricAvailable: boolean;
  isLoading: boolean;

  // Actions
  unlock: () => void;
  lock: () => void;
  toggleBiometric: (enabled: boolean) => Promise<void>;
  toggleAutoLock: (enabled: boolean) => Promise<void>;
  setAutoLockTimeout: (timeout: number) => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

const SecurityContext = createContext<SecurityContextValue | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [preferences, setPreferences] = useState<SecurityPreferences>({
    biometricEnabled: false,
    autoLockEnabled: false,
    autoLockTimeout: 5,
    lastActiveTime: Date.now(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const { biometricAvailable, checkBiometricAvailability } = useBiometricAuth();

  // Charger les préférences au montage
  useEffect(() => {
    loadPreferences();
    checkBiometricAvailability();
  }, []);

  // Gérer les changements d'état de l'app (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [preferences]);

  /**
   * Charger les préférences depuis le stockage
   */
  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const prefs = await securityPreferencesService.getPreferences();
      setPreferences(prefs);

      // Si la biométrie est activée et disponible, verrouiller l'app au démarrage
      if (prefs.biometricEnabled && biometricAvailable) {
        setIsLocked(true);
      }
    } catch (error) {
      console.error('❌ Erreur chargement préférences sécurité:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gérer les changements d'état de l'app
   */
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App passe en arrière-plan : mettre à jour le timestamp
      await securityPreferencesService.updateLastActiveTime();
    } else if (nextAppState === 'active') {
      // App revient au premier plan : vérifier si verrouillage nécessaire
      const shouldLock = await securityPreferencesService.shouldLock();
      
      if (shouldLock && preferences.biometricEnabled) {
        console.log('🔒 Verrouillage auto après inactivité');
        setIsLocked(true);
      }

      // Mettre à jour le timestamp
      await securityPreferencesService.updateLastActiveTime();
    }
  };

  /**
   * Déverrouiller l'application
   */
  const unlock = useCallback(() => {
    console.log('✅ Application déverrouillée');
    setIsLocked(false);
    securityPreferencesService.updateLastActiveTime();
  }, []);

  /**
   * Verrouiller l'application
   */
  const lock = useCallback(() => {
    console.log('🔒 Application verrouillée');
    setIsLocked(true);
  }, []);

  /**
   * Activer/désactiver l'authentification biométrique
   */
  const toggleBiometric = useCallback(async (enabled: boolean) => {
    try {
      if (enabled && !biometricAvailable) {
        throw new Error('Authentification biométrique non disponible sur cet appareil');
      }

      await securityPreferencesService.setBiometricEnabled(enabled);
      setPreferences(prev => ({ ...prev, biometricEnabled: enabled }));

      // Si on active la biométrie, verrouiller immédiatement
      if (enabled) {
        setIsLocked(true);
      }
    } catch (error) {
      console.error('❌ Erreur toggle biométrie:', error);
      throw error;
    }
  }, [biometricAvailable]);

  /**
   * Activer/désactiver le verrouillage automatique
   */
  const toggleAutoLock = useCallback(async (enabled: boolean) => {
    try {
      await securityPreferencesService.setAutoLockEnabled(enabled);
      setPreferences(prev => ({ ...prev, autoLockEnabled: enabled }));
    } catch (error) {
      console.error('❌ Erreur toggle auto-lock:', error);
      throw error;
    }
  }, []);

  /**
   * Définir le délai de verrouillage automatique
   */
  const setAutoLockTimeout = useCallback(async (timeout: number) => {
    try {
      await securityPreferencesService.setAutoLockTimeout(timeout);
      setPreferences(prev => ({ ...prev, autoLockTimeout: timeout }));
    } catch (error) {
      console.error('❌ Erreur définition timeout:', error);
      throw error;
    }
  }, []);

  /**
   * Rafraîchir les préférences
   */
  const refreshPreferences = useCallback(async () => {
    await loadPreferences();
  }, []);

  return (
    <SecurityContext.Provider
      value={{
        isLocked,
        preferences,
        biometricAvailable,
        isLoading,
        unlock,
        lock,
        toggleBiometric,
        toggleAutoLock,
        setAutoLockTimeout,
        refreshPreferences,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider');
  }
  return context;
};
