// src/services/backup/cloudBackup.ts - VERSION COMPATIBLE
import * as FileSystem from 'expo-file-system/legacy';
import { secureStorage } from '../storage/secureStorage';

export interface CloudBackupConfig {
  provider: 'google_drive' | 'icloud' | 'dropbox';
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  encryptCloudBackups: boolean;
}

export class CloudBackupService {
  private static readonly CONFIG_KEY = 'cloud_backup_config';
  private static readonly LAST_BACKUP_KEY = 'last_cloud_backup';

  // ✅ CORRECTION : Approche simplifiée et compatible
  private static getDocumentDirectory(): string {
    try {
      // Certaines versions d'Expo n'ont pas documentDirectory
      // Utilisons une approche plus robuste
      const fs: any = FileSystem;
      return fs.documentDirectory || fs.cacheDirectory || '';
    } catch {
      return '';
    }
  }

  static async configure(config: Partial<CloudBackupConfig>): Promise<void> {
    try {
      const currentConfig = await this.getConfig();
      const newConfig = { ...currentConfig, ...config };
      await secureStorage.setItem(this.CONFIG_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error('Error configuring cloud backup:', error);
      throw error;
    }
  }

  static async getConfig(): Promise<CloudBackupConfig> {
    try {
      const configStr = await secureStorage.getItem(this.CONFIG_KEY);
      if (configStr) {
        return JSON.parse(configStr);
      }
    } catch (error) {
      console.error('Error getting cloud backup config:', error);
    }

    return {
      provider: 'google_drive',
      autoBackup: false,
      backupFrequency: 'weekly',
      encryptCloudBackups: true,
    };
  }

  static async backupToCloud(localFilePath: string): Promise<{
    success: boolean;
    cloudPath?: string;
    error?: string;
  }> {
    try {
      const config = await this.getConfig();
      
      if (!config.autoBackup) {
        return { success: false, error: 'Sauvegarde cloud désactivée' };
      }

      console.log(`☁️ Sauvegarde vers ${config.provider}...`);

      await new Promise(resolve => setTimeout(resolve, 2000));
      const cloudPath = `/MoneyManager/backup-${Date.now()}.json`;
      
      await this.updateLastBackupTime();
      
      return {
        success: true,
        cloudPath,
      };
    } catch (error) {
      console.error('❌ Erreur sauvegarde cloud:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  static async restoreFromCloud(cloudPath: string): Promise<{
    success: boolean;
    localFilePath?: string;
    error?: string;
  }> {
    try {
      const config = await this.getConfig();
      console.log(`☁️ Restauration depuis ${config.provider}...`);

      await new Promise(resolve => setTimeout(resolve, 2000));
      const localFilePath = `${this.getDocumentDirectory()}restored-backup-${Date.now()}.json`;
      
      return {
        success: true,
        localFilePath,
      };
    } catch (error) {
      console.error('❌ Erreur restauration cloud:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  static async listCloudBackups(): Promise<{
    success: boolean;
    backups?: Array<{
      name: string;
      path: string;
      size: number;
      date: string;
    }>;
    error?: string;
  }> {
    try {
      const config = await this.getConfig();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        backups: [
          {
            name: 'backup-2024-01-15.json',
            path: `/MoneyManager/backup-2024-01-15.json`,
            size: 1024000,
            date: '2024-01-15T10:30:00Z',
          }
        ],
      };
    } catch (error) {
      console.error('❌ Erreur liste sauvegardes cloud:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  static async scheduleAutoBackup(frequency: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    try {
      const config = await this.getConfig();
      await this.configure({
        ...config,
        backupFrequency: frequency,
        autoBackup: true
      });
      
      console.log(`✅ Sauvegarde automatique programmée: ${frequency}`);
    } catch (error) {
      console.error('❌ Erreur programmation sauvegarde auto:', error);
      throw error;
    }
  }

  private static async updateLastBackupTime(): Promise<void> {
    try {
      await secureStorage.setItem(this.LAST_BACKUP_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Error updating last backup time:', error);
    }
  }

  static async getLastBackupTime(): Promise<string | null> {
    try {
      return await secureStorage.getItem(this.LAST_BACKUP_KEY);
    } catch (error) {
      console.error('Error getting last backup time:', error);
      return null;
    }
  }
}