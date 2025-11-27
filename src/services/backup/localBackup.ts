// src/services/backup/localBackup.ts - VERSION COMPATIBLE
import * as FileSystem from 'expo-file-system/legacy';

export interface BackupData {
  version: string;
  timestamp: string;
  data: {
    accounts?: any[];
    transactions?: any[];
    categories?: any[];
    budgets?: any[];
    debts?: any[];
    savingsGoals?: any[];
    annualCharges?: any[];
  };
}

export class LocalBackupService {
  // ✅ CORRECTION : Approche compatible
  private static getBackupDir(): string {
    try {
      const fs: any = FileSystem;
      const baseDir = fs.documentDirectory || fs.cacheDirectory || '';
      return `${baseDir}backups/`;
    } catch {
      return 'backups/';
    }
  }

  static async createLocalBackup(data: BackupData): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      await this.ensureBackupDir();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `backup-${timestamp}.json`;
      const filePath = `${this.getBackupDir()}${fileName}`;
      
      const backupContent = JSON.stringify({
        ...data,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      }, null, 2);

      // ✅ CORRECTION : Encodage simplifié
      await FileSystem.writeAsStringAsync(filePath, backupContent);

      return { success: true, filePath };
      
    } catch (error) {
      console.error('❌ Erreur création sauvegarde locale:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }

  static async listLocalBackups(): Promise<{ 
    success: boolean; 
    backups?: Array<{ filePath: string; fileName: string; size: number; timestamp: string }>; 
    error?: string 
  }> {
    try {
      await this.ensureBackupDir();
      
      const backupDir = this.getBackupDir();
      const files = await FileSystem.readDirectoryAsync(backupDir);
      const backupFiles = files.filter(file => file.endsWith('.json') && file.startsWith('backup-'));
      
      const backups = await Promise.all(
        backupFiles.map(async (file) => {
          const filePath = `${backupDir}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          
          let size = 0;
          if (fileInfo.exists) {
            // ✅ CORRECTION : Approche sécurisée pour la taille
            const fileContent = await FileSystem.readAsStringAsync(filePath);
            size = new Blob([fileContent]).size;
          }
          
          const dateMatch = file.match(/backup-(.+?)\.json/);
          const timestamp = dateMatch ? dateMatch[1].replace(/-/g, ':').slice(0, -5) + 'Z' : new Date().toISOString();
          
          return {
            filePath,
            fileName: file,
            size,
            timestamp: new Date(timestamp).toLocaleString('fr-FR')
          };
        })
      );

      backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return { success: true, backups };
      
    } catch (error) {
      console.error('❌ Erreur liste sauvegardes locales:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }

  static async restoreLocalBackup(filePath: string): Promise<{ 
    success: boolean; 
    data?: BackupData; 
    error?: string 
  }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        return { success: false, error: 'Fichier de sauvegarde introuvable' };
      }

      const backupContent = await FileSystem.readAsStringAsync(filePath);
      const backupData = JSON.parse(backupContent) as BackupData;

      return { success: true, data: backupData };
      
    } catch (error) {
      console.error('❌ Erreur restauration sauvegarde locale:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }

  static async deleteBackup(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      await FileSystem.deleteAsync(filePath);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur suppression sauvegarde:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }

  static async getStorageInfo(): Promise<{
    freeSpace: number;
    usedSpace: number;
    totalSpace?: number;
  }> {
    try {
      return {
        freeSpace: 1024 * 1024 * 1024,
        usedSpace: 512 * 1024 * 1024,
        totalSpace: 2 * 1024 * 1024 * 1024
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        freeSpace: 0,
        usedSpace: 0
      };
    }
  }

  private static async ensureBackupDir(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.getBackupDir());
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.getBackupDir(), { intermediates: true });
      }
    } catch (error) {
      console.error('Erreur création répertoire backup:', error);
      throw error;
    }
  }
}