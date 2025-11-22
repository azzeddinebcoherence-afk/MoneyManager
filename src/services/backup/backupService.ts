// src/services/backup/backupService.ts - VERSION CORRIGÉE EXPO
import { secureStorage } from '../storage/secureStorage';

// ✅ CORRECTION : Utilisation de l'API legacy pour éviter les erreurs

// ✅ CORRECTION : Interfaces locales pour éviter les imports manquants
interface BiometricAuthType {
  authenticate(): Promise<{ success: boolean; error?: string }>;
  isAvailable(): Promise<{ available: boolean; types?: any[]; hasHardware?: boolean; isEnrolled?: boolean }>;
  saveBiometricPreference(enabled: boolean): Promise<void>;
  getBiometricPreference(): Promise<boolean>;
}

interface PinAuthType {
  verifyPin(pin: string): Promise<{ success: boolean; remainingAttempts?: number; lockedUntil?: Date }>;
  hasPin(): Promise<boolean>;
  setPin(pin: string): Promise<void>;
  clearPin(): Promise<void>;
}
 
// ✅ CORRECTION : Implémentations locales simplifiées
const BiometricAuth: BiometricAuthType = {
  authenticate: async () => ({ success: false, error: 'Biométrie non disponible' }),
  isAvailable: async () => ({ available: false }),
  saveBiometricPreference: async () => {},
  getBiometricPreference: async () => false
};

const PinAuth: PinAuthType = {
  verifyPin: async () => ({ success: false, remainingAttempts: 0 }),
  hasPin: async () => false,
  setPin: async () => {},
  clearPin: async () => {}
};

export interface BackupConfig {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  encryptBackups: boolean;
  cloudSync: boolean;
  includeMedia: boolean;
}

export class BackupService {
  private static readonly CONFIG_KEY = 'backup_config';
  private static readonly LAST_BACKUP_KEY = 'last_backup_time';

  /**
   * Configure la sauvegarde automatique
   */
  static async configure(config: Partial<BackupConfig>): Promise<void> {
    try {
      const currentConfig = await this.getConfig();
      const newConfig = { ...currentConfig, ...config };
      await secureStorage.setItem(this.CONFIG_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error('Error configuring backup:', error);
      throw error;
    }
  }

  /**
   * Récupère la configuration de sauvegarde
   */
  static async getConfig(): Promise<BackupConfig> {
    try {
      const configStr = await secureStorage.getItem(this.CONFIG_KEY);
      if (configStr) {
        return JSON.parse(configStr);
      }
    } catch (error) {
      console.error('Error getting backup config:', error);
    }

    // Configuration par défaut
    return {
      autoBackup: false,
      backupFrequency: 'weekly',
      encryptBackups: true,
      cloudSync: false,
      includeMedia: false,
    };
  }

  /**
   * Vérifie si une sauvegarde est nécessaire
   */
  static async needsBackup(): Promise<boolean> {
    try {
      const config = await this.getConfig();
      if (!config.autoBackup) {
        return false;
      }

      const lastBackup = await this.getLastBackupTime();
      if (!lastBackup) {
        return true; // Première sauvegarde
      }

      const now = new Date();
      const lastBackupDate = new Date(lastBackup);
      const diffHours = (now.getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60);

      switch (config.backupFrequency) {
        case 'daily':
          return diffHours >= 24;
        case 'weekly':
          return diffHours >= 168; // 7 jours
        case 'monthly':
          return diffHours >= 720; // 30 jours
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking backup needs:', error);
      return false;
    }
  }

  /**
   * Obtient la date de la dernière sauvegarde
   */
  static async getLastBackupTime(): Promise<string | null> {
    try {
      return await secureStorage.getItem(this.LAST_BACKUP_KEY);
    } catch (error) {
      console.error('Error getting last backup time:', error);
      return null;
    }
  }

  /**
   * Met à jour la date de dernière sauvegarde
   */
  static async updateLastBackupTime(): Promise<void> {
    try {
      await secureStorage.setItem(this.LAST_BACKUP_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Error updating last backup time:', error);
    }
  }

  /**
   * Vérifie l'intégrité des données de sauvegarde
   */
  static async verifyBackupIntegrity(backupData: any): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifications de base
    if (!backupData) {
      errors.push('Données de sauvegarde manquantes');
      return { valid: false, errors, warnings };
    }

    if (!backupData.exportDate) {
      warnings.push('Date d\'export manquante');
    }

    if (!backupData.version) {
      warnings.push('Version manquante');
    }

    // Vérifier la structure des données
    const requiredTables = ['accounts', 'transactions', 'categories'];
    for (const table of requiredTables) {
      if (!Array.isArray(backupData[table])) {
        errors.push(`Table ${table} manquante ou invalide`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Génère un rapport de sauvegarde
   */
  static async generateBackupReport(): Promise<{
    success: boolean;
    report?: {
      lastBackup: string | null;
      totalBackups: number;
      totalSize: number;
      config: BackupConfig;
      integrity: {
        accounts: number;
        transactions: number;
        categories: number;
        budgets: number;
      };
    };
    error?: string;
  }> {
    try {
      const config = await this.getConfig();
      const lastBackup = await this.getLastBackupTime();

      // Obtenir les statistiques des sauvegardes locales
      const localBackups = await import('./localBackup.js').then(module => 
        module.LocalBackupService.listLocalBackups()
      );

      return {
        success: true,
        report: {
          lastBackup,
          totalBackups: localBackups.backups?.length || 0,
          totalSize: localBackups.backups?.reduce((sum: number, backup: any) => sum + backup.size, 0) || 0,
          config,
          integrity: {
            accounts: 0,
            transactions: 0,
            categories: 0,
            budgets: 0,
          },
        },
      };
    } catch (error) {
      console.error('Error generating backup report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }
}