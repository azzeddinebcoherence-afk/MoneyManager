// src/services/database/transactionMigration.ts - VERSION UNIFIÉE
import { getDatabase } from './sqlite';

export const migrateToUnifiedTransactions = async (): Promise<{ success: boolean; migrated: number; errors: string[] }> => {
  const db = await getDatabase();
  const errors: string[] = [];
  let migrated = 0; 

  try {
    console.log('🔄 [MIGRATION] Début migration vers transactions unifiées...');

    await db.execAsync('BEGIN TRANSACTION');

    // 1. Ajouter les colonnes de récurrence à la table transactions
    const newColumns = [
      'is_recurring INTEGER DEFAULT 0',
      'recurrence_type TEXT',
      'recurrence_end_date TEXT',
      'parent_transaction_id TEXT',
      'next_occurrence TEXT'
    ];

    for (const column of newColumns) {
      const [columnName] = column.split(' ');
      try {
        await db.execAsync(`ALTER TABLE transactions ADD COLUMN ${column}`);
        console.log(`✅ Colonne ${columnName} ajoutée`);
      } catch (error: any) {
        if (!error.message?.includes('duplicate column name')) {
          errors.push(`Erreur colonne ${columnName}: ${error}`);
        }
      }
    }

    // 2. Migrer les transactions récurrentes existantes
    const recurringTransactions = await db.getAllAsync(`
      SELECT * FROM recurring_transactions WHERE is_active = 1
    `) as any[];

    console.log(`📦 Migration de ${recurringTransactions.length} transactions récurrentes...`);

    for (const recurringTx of recurringTransactions) {
      try {
        // Créer la transaction parent récurrente
        const parentTransactionId = `rec_${recurringTx.id}`;
        
        await db.runAsync(`
          INSERT INTO transactions (
            id, user_id, amount, type, category, account_id, description, 
            date, created_at, is_recurring, recurrence_type, recurrence_end_date,
            parent_transaction_id, next_occurrence
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          parentTransactionId,
          recurringTx.user_id,
          recurringTx.amount,
          recurringTx.type,
          recurringTx.category,
          recurringTx.account_id,
          `[Récurrente] ${recurringTx.description}`,
          recurringTx.start_date,
          recurringTx.created_at,
          1, // is_recurring
          recurringTx.frequency,
          recurringTx.end_date || null,
          null, // parent_transaction_id (c'est une parent)
          calculateNextOccurrence(recurringTx.frequency, recurringTx.start_date, recurringTx.last_processed)
        ]);

        migrated++;
      } catch (error) {
        errors.push(`Erreur migration transaction ${recurringTx.id}: ${error}`);
      }
    }

    // 3. Mettre à jour les transactions existantes générées par les récurrentes
    const generatedTransactions = await db.getAllAsync(`
      SELECT * FROM transactions 
      WHERE description LIKE '[Récurrente]%' 
      AND is_recurring IS NULL
    `) as any[];

    for (const tx of generatedTransactions) {
      try {
        await db.runAsync(`
          UPDATE transactions 
          SET is_recurring = 0, parent_transaction_id = ?
          WHERE id = ?
        `, [findParentTransactionId(tx.description), tx.id]);
      } catch (error) {
        errors.push(`Erreur mise à jour transaction ${tx.id}: ${error}`);
      }
    }

    await db.execAsync('COMMIT');
    
    console.log(`✅ Migration terminée: ${migrated} transactions migrées`);
    return { success: errors.length === 0, migrated, errors };

  } catch (error) {
    await db.execAsync('ROLLBACK');
    errors.push(`Erreur générale migration: ${error}`);
    return { success: false, migrated, errors };
  }
};

// Fonction utilitaire pour calculer la prochaine occurrence
const calculateNextOccurrence = (frequency: string, startDate: string, lastProcessed?: string): string => {
  const baseDate = lastProcessed ? new Date(lastProcessed) : new Date(startDate);
  const nextDate = new Date(baseDate);

  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  return nextDate.toISOString().split('T')[0];
};

// Fonction utilitaire pour trouver l'ID parent
const findParentTransactionId = (description: string): string | null => {
  const match = description.match(/\[Récurrente\] (.*)/);
  return match ? `rec_${match[1]}` : null;
};

export default migrateToUnifiedTransactions;