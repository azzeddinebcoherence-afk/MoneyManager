// src/services/database/backupMigration.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from './sqlite';

export const backupBeforeMigration = async (): Promise<boolean> => {
  try {
    const db = await getDatabase();
    
    // Sauvegarde des transactions récurrentes
    const recurringBackup = await db.getAllAsync('SELECT * FROM recurring_transactions');
    
    // Sauvegarde dans AsyncStorage ou fichier
    await AsyncStorage.setItem(
      'migration_backup_recurring', 
      JSON.stringify(recurringBackup)
    );
    
    console.log('📦 Backup créé:', recurringBackup.length, 'transactions récurrentes');
    return true;
  } catch (error) {
    console.error('❌ Erreur backup:', error);
    return false;
  }
};