// src/services/auth/securityService.ts - VERSION CORRIGÉE
import { secureStorage } from '../storage/secureStorage';

export type AuthMethod = 'pin' | 'biometric' | 'both' | 'none';

export interface SecurityConfig {
  authMethod: AuthMethod;
  autoLock: boolean;
  autoLockTimeout: number;
  maxPinAttempts: number;
}

export class SecurityService {
  private static readonly CONFIG_KEY = 'security_config';
  private static readonly SESSION_KEY = 'security_session'; 
  private static readonly PIN_ATTEMPTS_KEY = 'pin_attempts';
  private static readonly DEFAULT_CONFIG: SecurityConfig = {
    authMethod: 'pin',
    autoLock: true,
    autoLockTimeout: 5,
    maxPinAttempts: 5,
  };

  static async initialize(): Promise<void> {
    try {
      const existingConfig = await this.getConfig();
      if (!existingConfig) {
        await this.saveConfig(this.DEFAULT_CONFIG);
      }
    } catch (error) {
      console.error('Error initializing security service:', error);
    }
  }

  static async saveConfig(config: SecurityConfig): Promise<void> {
    try {
      await secureStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving security config:', error);
      throw error;
    }
  }

  static async getConfig(): Promise<SecurityConfig | null> {
    try {
      const configStr = await secureStorage.getItem(this.CONFIG_KEY);
      return configStr ? JSON.parse(configStr) : null;
    } catch (error) {
      console.error('Error getting security config:', error);
      return null;
    }
  }

  static async authenticate(): Promise<{
    success: boolean;
    method: 'pin' | 'biometric' | 'none';
    error?: string;
  }> {
    try {
      const config = await this.getConfig();
      if (!config || config.authMethod === 'none') {
        return { success: true, method: 'none' };
      }

      // ✅ CORRECTION : Logique corrigée pour gérer 'both'
      if (config.authMethod === 'biometric' || config.authMethod === 'both') {
        // Implémentation biométrie simplifiée
        const biometricResult = { success: false }; // À implémenter
        if (biometricResult.success) {
          await this.startSession();
          return { success: true, method: 'biometric' };
        }

        // Si méthode 'both' et biométrie échoue, on passe au PIN
        if (config.authMethod === 'both') {
          // On continue pour demander le PIN
        } else {
          // Si méthode est seulement biométrie et échoue, on retourne erreur
          return { 
            success: false, 
            method: 'biometric',
            error: 'biometric_failed'
          };
        }
      }

      if (config.authMethod === 'pin' || config.authMethod === 'both') {
        const attempts = await this.getPinAttempts();
        if (attempts >= config.maxPinAttempts) {
          return { 
            success: false, 
            method: 'pin',
            error: 'max_attempts_reached' 
          };
        }

        return { 
          success: false, 
          method: 'pin',
          error: 'pin_required'
        };
      }

      return { success: false, method: 'none', error: 'no_auth_method' };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, method: 'none', error: 'authentication_failed' };
    }
  }

  static async verifyPin(pin: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const config = await this.getConfig();
      if (!config || (config.authMethod !== 'pin' && config.authMethod !== 'both')) {
        return { success: false, error: 'pin_not_configured' };
      }

      // Implémentation PIN simplifiée
      const storedPin = await secureStorage.getItem('user_pin');
      const isValid = storedPin === pin;
      
      if (isValid) {
        await this.resetPinAttempts();
        await this.startSession();
        return { success: true };
      } else {
        await this.incrementPinAttempts();
        const attempts = await this.getPinAttempts();
        
        if (attempts >= config.maxPinAttempts) {
          return { 
            success: false, 
            error: 'max_attempts_reached' 
          };
        }
        
        return { 
          success: false, 
          error: 'invalid_pin' 
        };
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      return { success: false, error: 'verification_failed' };
    }
  }

  static async startSession(): Promise<void> {
    try {
      const session = {
        startTime: new Date().toISOString(),
        isActive: true,
      };
      await secureStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  static async endSession(): Promise<void> {
    try {
      await secureStorage.deleteItem(this.SESSION_KEY);
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  static async isSessionValid(): Promise<boolean> {
    try {
      const sessionStr = await secureStorage.getItem(this.SESSION_KEY);
      if (!sessionStr) return false;

      const session = JSON.parse(sessionStr);
      if (!session.isActive) return false;

      const config = await this.getConfig();
      if (config?.autoLock) {
        const startTime = new Date(session.startTime);
        const now = new Date();
        const diffMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
        
        if (diffMinutes > config.autoLockTimeout) {
          await this.endSession();
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  }

  // Méthodes privées
  private static async getPinAttempts(): Promise<number> {
    try {
      const attemptsStr = await secureStorage.getItem(this.PIN_ATTEMPTS_KEY);
      return attemptsStr ? parseInt(attemptsStr, 10) : 0;
    } catch (error) {
      console.error('Error getting PIN attempts:', error);
      return 0;
    }
  }

  private static async incrementPinAttempts(): Promise<void> {
    try {
      const currentAttempts = await this.getPinAttempts();
      await secureStorage.setItem(this.PIN_ATTEMPTS_KEY, (currentAttempts + 1).toString());
    } catch (error) {
      console.error('Error incrementing PIN attempts:', error);
    }
  }

  private static async resetPinAttempts(): Promise<void> {
    try {
      await secureStorage.deleteItem(this.PIN_ATTEMPTS_KEY);
    } catch (error) {
      console.error('Error resetting PIN attempts:', error);
    }
  }

  // Convenience API used by UI components
  static async getSecurityStatus(): Promise<any> {
    const config = await this.getConfig();
    const pin = await secureStorage.getItem('user_pin');
    const session = await secureStorage.getItem(this.SESSION_KEY);
    return {
      pinConfigured: !!pin,
      biometricAvailable: false,
      authMethod: config?.authMethod || 'none',
      sessionActive: !!session
    };
  }

  static async changeAuthMethod(method: AuthMethod): Promise<void> {
    const config = (await this.getConfig()) || this.DEFAULT_CONFIG;
    config.authMethod = method;
    await this.saveConfig(config);
  }

  static async resetSecurity(): Promise<void> {
    try {
      await this.saveConfig(this.DEFAULT_CONFIG);
      await secureStorage.deleteItem('user_pin');
      await this.resetPinAttempts();
      await this.endSession();
    } catch (error) {
      console.error('Error resetting security:', error);
      throw error;
    }
  }
}