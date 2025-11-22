// src/services/storage/securityPreferences.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURITY_KEY = '@security_preferences';

export interface SecurityPreferences {
  biometricEnabled: boolean;
  autoLockEnabled: boolean;
  autoLockTimeout: number; // en minutes
  lastActiveTime: number;
}

const DEFAULT_PREFERENCES: SecurityPreferences = {
  biometricEnabled: false,
  autoLockEnabled: false,
  autoLockTimeout: 5,
  lastActiveTime: Date.now(),
};

export const securityPreferencesService = {
  /**
   * Récupérer les préférences de sécurité
   */
  async getPreferences(): Promise<SecurityPreferences> {
    try {
      const stored = await AsyncStorage.getItem(SECURITY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
      return DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des préférences de sécurité:', error);
      return DEFAULT_PREFERENCES;
    }
  },

  /**
   * Activer/désactiver l'authentification biométrique
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      const prefs = await this.getPreferences();
      prefs.biometricEnabled = enabled;
      await AsyncStorage.setItem(SECURITY_KEY, JSON.stringify(prefs));
      console.log(`✅ Biométrie ${enabled ? 'activée' : 'désactivée'}`);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la biométrie:', error);
      throw error;
    }
  },

  /**
   * Activer/désactiver le verrouillage automatique
   */
  async setAutoLockEnabled(enabled: boolean): Promise<void> {
    try {
      const prefs = await this.getPreferences();
      prefs.autoLockEnabled = enabled;
      await AsyncStorage.setItem(SECURITY_KEY, JSON.stringify(prefs));
      console.log(`✅ Verrouillage auto ${enabled ? 'activé' : 'désactivé'}`);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du verrouillage auto:', error);
      throw error;
    }
  },

  /**
   * Définir le délai de verrouillage automatique
   */
  async setAutoLockTimeout(timeout: number): Promise<void> {
    try {
      const prefs = await this.getPreferences();
      prefs.autoLockTimeout = timeout;
      await AsyncStorage.setItem(SECURITY_KEY, JSON.stringify(prefs));
      console.log(`✅ Délai de verrouillage défini à ${timeout} minutes`);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du délai:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour le timestamp de dernière activité
   */
  async updateLastActiveTime(): Promise<void> {
    try {
      const prefs = await this.getPreferences();
      prefs.lastActiveTime = Date.now();
      await AsyncStorage.setItem(SECURITY_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du timestamp:', error);
    }
  },

  /**
   * Vérifier si l'app doit être verrouillée
   */
  async shouldLock(): Promise<boolean> {
    try {
      const prefs = await this.getPreferences();
      
      // Si le verrouillage auto n'est pas activé, ne pas verrouiller
      if (!prefs.autoLockEnabled) {
        return false;
      }

      const now = Date.now();
      const elapsed = now - prefs.lastActiveTime;
      const timeoutMs = prefs.autoLockTimeout * 60 * 1000;

      return elapsed >= timeoutMs;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du verrouillage:', error);
      return false;
    }
  },

  /**
   * Réinitialiser les préférences
   */
  async reset(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SECURITY_KEY);
      console.log('✅ Préférences de sécurité réinitialisées');
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation:', error);
      throw error;
    }
  },
};
