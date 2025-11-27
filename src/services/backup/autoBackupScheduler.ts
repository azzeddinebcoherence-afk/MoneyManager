// src/services/backup/autoBackupScheduler.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { getDatabase } from '../database/sqlite';
import { LocalBackupService } from './localBackup';

const BACKGROUND_BACKUP_TASK = 'background-backup-task';
const AUTO_BACKUP_KEY = '@auto_backup_enabled';
const LAST_BACKUP_KEY = '@last_backup_date';

// Définir la tâche en arrière-plan
TaskManager.defineTask(BACKGROUND_BACKUP_TASK, async () => {
  try {
    console.log('🔄 Sauvegarde automatique démarrée...');
    
    // Vérifier si la sauvegarde auto est activée
    const isEnabled = await AsyncStorage.getItem(AUTO_BACKUP_KEY);
    if (isEnabled !== 'true') {
      console.log('⏭️  Sauvegarde auto désactivée');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    // Créer la sauvegarde
    const db = await getDatabase();
    
    // Récupérer toutes les données
    const [accounts, transactions, categories, budgets, annualCharges] = await Promise.all([
      db.getAllAsync('SELECT * FROM accounts WHERE user_id = ?', ['default-user']),
      db.getAllAsync('SELECT * FROM transactions WHERE user_id = ?', ['default-user']),
      db.getAllAsync('SELECT * FROM categories WHERE user_id = ?', ['default-user']),
      db.getAllAsync('SELECT * FROM budgets WHERE user_id = ?', ['default-user']),
      db.getAllAsync('SELECT * FROM annual_charges WHERE user_id = ?', ['default-user'])
    ]);
    
    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data: {
        accounts,
        transactions,
        categories,
        budgets,
        annualCharges
      }
    };
    
    const result = await LocalBackupService.createLocalBackup(backupData);
    
    if (result.success) {
      await AsyncStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
      console.log('✅ Sauvegarde automatique créée:', result.filePath);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      console.error('❌ Échec sauvegarde automatique:', result.error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde automatique:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export class AutoBackupScheduler {
  // Enregistrer la tâche de sauvegarde automatique
  static async registerBackgroundTask(): Promise<void> {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      
      if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_BACKUP_TASK, {
          minimumInterval: 60 * 60 * 24, // 24 heures
          stopOnTerminate: false,
          startOnBoot: true,
        });
        
        console.log('✅ Tâche de sauvegarde automatique enregistrée');
      } else {
        console.warn('⚠️  Background fetch non disponible:', status);
      }
    } catch (error) {
      console.error('❌ Erreur enregistrement tâche:', error);
    }
  }
  
  // Annuler la tâche de sauvegarde automatique
  static async unregisterBackgroundTask(): Promise<void> {
    try {
      const isRegistered = await this.isTaskRegistered();
      if (!isRegistered) {
        console.log('⏭️  Tâche de sauvegarde non enregistrée, rien à annuler');
        return;
      }
      
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_BACKUP_TASK);
      console.log('✅ Tâche de sauvegarde automatique annulée');
    } catch (error) {
      // Ignorer l'erreur si la tâche n'existe pas
      if (error instanceof Error && error.message.includes('not found')) {
        console.log('⏭️  Tâche déjà absente');
      } else {
        console.error('❌ Erreur annulation tâche:', error);
      }
    }
  }
  
  // Vérifier si la tâche est enregistrée
  static async isTaskRegistered(): Promise<boolean> {
    try {
      const tasks = await TaskManager.getRegisteredTasksAsync();
      return tasks.some(task => task.taskName === BACKGROUND_BACKUP_TASK);
    } catch (error) {
      console.error('❌ Erreur vérification tâche:', error);
      return false;
    }
  }
  
  // Activer la sauvegarde automatique
  static async enable(): Promise<void> {
    await AsyncStorage.setItem(AUTO_BACKUP_KEY, 'true');
    await this.registerBackgroundTask();
  }
  
  // Désactiver la sauvegarde automatique
  static async disable(): Promise<void> {
    await AsyncStorage.setItem(AUTO_BACKUP_KEY, 'false');
    await this.unregisterBackgroundTask();
  }
}
