// src/hooks/useBackup.ts
import { useCallback, useState } from 'react';
import { CloudBackupService } from '../services/backup/cloudBackup';
import { ImportService } from '../services/backup/importService';
import { LocalBackupService } from '../services/backup/localBackup';

export const useBackup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBackup = useCallback(async (options?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const backupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {
          accounts: [],
          transactions: [],
          categories: [],
          budgets: [],
          recurringTransactions: [],
        }
      };
      
      const result = await LocalBackupService.createLocalBackup(backupData);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cleanupOldBackups = useCallback(async (maxAgeDays: number = 30) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const backupsResult = await LocalBackupService.listLocalBackups();
      if (!backupsResult.success || !backupsResult.backups) {
        return { success: true, deleted: 0 };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
      
      let deletedCount = 0;
      const errors: string[] = [];

      for (const backup of backupsResult.backups) {
        try {
          const backupDate = new Date(backup.timestamp);
          if (backupDate < cutoffDate) {
            const deleteResult = await LocalBackupService.deleteBackup(backup.filePath);
            if (deleteResult.success) {
              deletedCount++;
            } else {
              errors.push(`Erreur suppression ${backup.fileName}: ${deleteResult.error}`);
            }
          }
        } catch (err) {
          errors.push(`Erreur traitement ${backup.fileName}: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        }
      }

      return {
        success: errors.length === 0,
        deleted: deletedCount,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getBackupStats = useCallback(async () => {
    try {
      const [backupsResult, storageResult] = await Promise.all([
        LocalBackupService.listLocalBackups(),
        LocalBackupService.getStorageInfo()
      ]);

      const stats = {
        totalBackups: backupsResult.backups?.length || 0,
        totalSize: backupsResult.backups?.reduce((sum: number, backup: any) => sum + backup.size, 0) || 0,
        freeSpace: storageResult.freeSpace || 0,
        usedSpace: storageResult.usedSpace || 0,
      };

      let warning: string | undefined;
      if (stats.freeSpace < 10 * 1024 * 1024) {
        warning = 'Espace de stockage faible';
      } else if (stats.totalSize > 100 * 1024 * 1024) {
        warning = 'Taille des sauvegardes élevée';
      }

      return {
        ...stats,
        warning
      };
    } catch (err) {
      console.error('Error getting backup stats:', err);
      return {
        totalBackups: 0,
        totalSize: 0,
        freeSpace: 0,
        usedSpace: 0,
      };
    }
  }, []);

  const restoreBackup = useCallback(async (filePath: string, options?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await LocalBackupService.restoreLocalBackup(filePath);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const listBackups = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      return await LocalBackupService.listLocalBackups();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const configureCloudBackup = useCallback(async (config: any) => {
    try {
      setIsLoading(true);
      setError(null);
      await CloudBackupService.configure(config);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const backupToCloud = useCallback(async (localFilePath: string) => {
    try {
      setIsLoading(true);
      setError(null);
      return await CloudBackupService.backupToCloud(localFilePath);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const importData = useCallback(async (fileUri: string, format: 'json' | 'csv' = 'json') => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (format === 'json') {
        return await ImportService.importFromJSON(fileUri);
      } else {
        return await ImportService.importFromCSV(fileUri);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    createBackup,
    restoreBackup,
    listBackups,
    configureCloudBackup,
    backupToCloud,
    cleanupOldBackups,
    getBackupStats,
    importData,
    clearError: () => setError(null),
  };
};