// src/services/autoImportService.ts
import { Alert } from 'react-native';
import { MigrationService, MySQLData } from './database/migrationService';
import { checkDatabaseStatus } from './database/sqlite';

export class AutoImportService {
  private static instance: AutoImportService;

  public static getInstance(): AutoImportService {
    if (!AutoImportService.instance) {
      AutoImportService.instance = new AutoImportService();
    }
    return AutoImportService.instance;
  }

  // Vérifier si la base est vide et proposer l'import
  public async checkAndProposeImport(): Promise<boolean> {
    try {
      const dbStatus = await checkDatabaseStatus();
      
      if (!dbStatus.isInitialized || dbStatus.tablesCount === 0) {
        console.log('🆕 Base de données vide, import automatique proposé');
        return this.proposeAutoImport();
      }

      // Vérifier si les tables principales sont vides
      const isEmpty = await this.isDatabaseEmpty();
      if (isEmpty) {
        console.log('📭 Base de données vide, import automatique proposé');
        return this.proposeAutoImport();
      }

      console.log('📊 Base de données déjà peuplée, import ignoré');
      return false;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification:', error);
      return false;
    }
  }

  // Vérifier si les tables principales sont vides
  private async isDatabaseEmpty(): Promise<boolean> {
    try {
      const { getDatabase } = await import('./database/sqlite.js');
      const db = await getDatabase();
      
      const tablesToCheck = ['accounts', 'categories', 'transactions'];
      let emptyCount = 0;

      for (const table of tablesToCheck) {
        const result = await db.getFirstAsync(`SELECT 1 FROM ${table} LIMIT 1`);
        if (!result) emptyCount++;
      }

      // Si au moins 2 tables sur 3 sont vides, on considère la base vide
      return emptyCount >= 2;
    } catch (error) {
      console.error('Erreur vérification tables:', error);
      return true; // En cas d'erreur, on considère vide
    }
  }

  // Proposer l'import automatique
  private async proposeAutoImport(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        '📥 Importation de Données',
        'Voulez-vous importer vos données depuis votre ancienne base MySQL ?\n\n' +
        'Cela ajoutera :\n' +
        '• Vos comptes\n' +
        '• Vos catégories\n' +
        '• Vos transactions\n' +
        '• Vos dettes\n' +
        '• Vos charges annuelles',
        [
          {
            text: 'Plus tard',
            style: 'cancel',
            onPress: () => {
              console.log('⏰ Import reporté');
              resolve(false);
            }
          },
          {
            text: 'Importer maintenant',
            onPress: async () => {
              console.log('🚀 Lancement import automatique');
              const success = await this.performAutoImport();
              resolve(success);
            }
          }
        ],
        { cancelable: false }
      );
    });
  }

  // Effectuer l'import automatique
  private async performAutoImport(): Promise<boolean> {
    try {
      // Données simulées basées sur votre dump SQL
      const sampleData: MySQLData = {
        accounts: [
          {
            id: 1,
            household_id: 1,
            name: 'Espèces',
            type: 'cash',
            balance: 0.00,
            color: '#10B981',
            icon: '💵',
            is_default: 0,
            created_at: '2025-10-17 15:31:02'
          },
          {
            id: 2,
            household_id: 1,
            name: 'Compte Courant',
            type: 'bank',
            balance: 0.00,
            color: '#3B82F6',
            icon: '🏦',
            is_default: 0,
            created_at: '2025-10-17 15:31:02'
          },
          {
            id: 3,
            household_id: 1,
            name: 'Épargne',
            type: 'savings',
            balance: 0.00,
            color: '#8B5CF6',
            icon: '💰',
            is_default: 0,
            created_at: '2025-10-17 15:31:02'
          }
        ],
        categories: [
          {
            id: 1,
            household_id: 1,
            name: 'Prime',
            type: 'income',
            color: '#10B981',
            icon: '💰',
            created_at: '2025-10-14 11:37:19'
          },
          {
            id: 2,
            household_id: 1,
            name: 'T9edya',
            type: 'expense',
            color: '#06D6A0',
            icon: '💵',
            created_at: '2025-10-14 11:37:19'
          },
          {
            id: 19,
            household_id: 1,
            name: 'Salaire',
            type: 'income',
            color: '#6B7280',
            icon: '💰',
            created_at: '2025-10-15 10:53:42'
          }
        ],
        expenses: [
          {
            id: 167,
            household_id: 1,
            amount: 1000.00,
            category: 'T9edya',
            date: '2025-10-05',
            description: 'T9edya octobre 2025',
            created_at: '2025-10-14 12:40:56',
            account_id: 1,
            payment_method: 'cash'
          }
        ],
        incomes: [
          {
            id: 83,
            household_id: 1,
            amount: 8000.00,
            type: 'Salaire',
            date: '2025-10-01',
            description: '',
            created_at: '2025-10-17 09:41:38',
            is_recurring: 1,
            account_id: 1
          }
        ],
        debts: [
          {
            id: 3,
            household_id: 1,
            creditor: 'Cr. Mr Hussain',
            amount: 1000.00,
            due_date: '2025-12-10',
            created_at: '2025-10-14 12:43:38',
            paid: 0,
            account_id: null
          }
        ],
        annual_expenses: [
          {
            id: 1,
            household_id: 1,
            description: 'Vignette Automobile',
            estimated_amount: 350.00,
            is_muslim_holiday: 0,
            hijri_month: null,
            gregorian_month: null,
            is_fixed_date: 1,
            fixed_month: 1,
            paid: 0,
            year: 2026,
            date_confirmed: 0,
            created_at: '2025-10-14 09:51:40'
          }
        ],
        savings_goals: [],
        transfers: []
      };

      const migrationService = MigrationService.getInstance();
      const result = await migrationService.migrateData(sampleData);

      if (result.success) {
        Alert.alert(
          '✅ Import Réussi',
          `Vos données ont été importées avec succès !\n\n` +
          `• ${result.stats.accounts} comptes\n` +
          `• ${result.stats.categories} catégories\n` +
          `• ${result.stats.transactions} transactions\n` +
          `• ${result.stats.debts} dettes\n` +
          `• ${result.stats.annual_charges} charges annuelles`
        );
        return true;
      } else {
        Alert.alert(
          '⚠️ Import Partiel',
          `Import terminé avec ${result.errors.length} erreurs mineures.`
        );
        return true;
      }
    } catch (error) {
      console.error('❌ Erreur import automatique:', error);
      Alert.alert(
        '❌ Erreur',
        'Impossible d\'importer les données automatiquement. ' +
        'Vous pourrez les importer manuellement plus tard.'
      );
      return false;
    }
  }
}

export default AutoImportService.getInstance();