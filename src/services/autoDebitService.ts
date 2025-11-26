// src/services/autoDebitService.ts
// Service de prélèvement automatique pour charges annuelles

import { getDatabase } from './database/sqlite';

export interface PendingDebit {
  id: string;
  type: 'annual_charge' | 'recurring_transaction';
  name: string;
  amount: number;
  dueDate: string;
  accountId: string;
  category: string;
}

/**
 * Vérifie et exécute les prélèvements automatiques en attente
 * Appelé au démarrage de l'app et lors du refresh
 */
export async function processAutomaticDebits(): Promise<{
  processed: number;
  errors: string[];
}> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const processed: string[] = [];
  const errors: string[] = [];

  try {
    // detect actual column names for resilience
    const tableInfo = await db.getAllAsync<any>(`PRAGMA table_info(annual_charges);`);
    const cols = (tableInfo || []).map((c: any) => c.name);
    const dueCol = cols.includes('due_date') ? 'due_date' : (cols.includes('dueDate') ? 'dueDate' : 'due_date');
    const lastProcessedCol = cols.includes('last_processed_date') ? 'last_processed_date' : (cols.includes('lastProcessedDate') ? 'lastProcessedDate' : (cols.includes('lastProcessed') ? 'lastProcessed' : 'last_processed_date'));
    const activeCol = cols.includes('is_active') ? 'is_active' : (cols.includes('isActive') ? 'isActive' : 'is_active');
    const accountCol = cols.includes('account_id') ? 'account_id' : (cols.includes('accountId') ? 'accountId' : 'account_id');

    // 1. Récupérer les charges annuelles dues
    // Construire la requête en incluant seulement les colonnes qui existent
    const whereParts: string[] = [];
    const params: any[] = [];
    if (cols.includes(dueCol)) {
      whereParts.push(`${dueCol} <= ?`);
      params.push(today);
    }
    if (cols.includes(lastProcessedCol)) {
      whereParts.push(`(${lastProcessedCol} IS NULL OR ${lastProcessedCol} < ?)`);
      params.push(today);
    }
    if (cols.includes(activeCol)) {
      whereParts.push(`${activeCol} = 1`);
    }

    const annualWhereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const annualCharges = await db.getAllAsync<any>(`
      SELECT * FROM annual_charges
      ${annualWhereClause}
    `, params);

    console.log(`💳 ${annualCharges.length} charge(s) annuelle(s) à traiter`);

    // Safety guard: avoid processing an unbounded number of items in one run
    const MAX_PER_RUN = 100;
    let annualProcessedCount = 0;
    for (const charge of annualCharges) {
      if (annualProcessedCount >= MAX_PER_RUN) {
        console.warn(`⚠️ Reached annual processing limit of ${MAX_PER_RUN} items for this run`);
        break;
      }
      try {
        // Créer la transaction de prélèvement
        await db.runAsync(`
          INSERT INTO transactions (
            id, description, amount, type, category,
            account_id, date, is_recurring, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
        `, [
          `charge_${charge.id}_${Date.now()}`,
          `Prélèvement automatique: ${charge.name}`,
          charge.amount,
          'expense',
          'charge_annuelle',
          charge.account_id || charge.accountId || null,
          today,
          new Date().toISOString(),
        ]);

        // Mettre à jour la date de traitement seulement si la colonne existe
        if (cols.includes(lastProcessedCol)) {
          await db.runAsync(
            `UPDATE annual_charges SET ${lastProcessedCol} = ? WHERE id = ?`,
            [today, charge.id]
          );
        } else {
          console.debug(`ℹ️ Colonne ${lastProcessedCol} absente, saut mise à jour last-processed pour ${charge.id}`);
        }

        // Calculer la prochaine date d'échéance (au moins un an plus tard)
        const todayDate = new Date(today);
        let originalDue = new Date(charge[dueCol] || charge.due_date || charge.dueDate);
        if (isNaN(originalDue.getTime())) {
          // fallback to today if original due date is invalid
          originalDue = new Date(todayDate);
        }

        // Advance year-by-year until the next due date is strictly in the future
        let nextYear = new Date(originalDue);
        let attempts = 0;
        do {
          nextYear.setFullYear(nextYear.getFullYear() + 1);
          attempts += 1;
        } while (nextYear <= todayDate && attempts < 10);

        // If after attempts the date is still not in the future, force it to next year from today
        if (nextYear <= todayDate) {
          nextYear = new Date(todayDate);
          nextYear.setFullYear(todayDate.getFullYear() + 1);
        }

        if (cols.includes(dueCol)) {
          await db.runAsync(
            `UPDATE annual_charges SET ${dueCol} = ? WHERE id = ?`,
            [nextYear.toISOString().split('T')[0], charge.id]
          );
        } else {
          console.debug(`ℹ️ Colonne ${dueCol} absente, saut mise à jour due date pour ${charge.id}`);
        }

        processed.push(charge.id);
        annualProcessedCount += 1;
        console.log(`✅ Charge annuelle prélevée: ${charge.name}`);
      } catch (error) {
        console.error(`❌ Erreur prélèvement charge ${charge.name}:`, error);
        errors.push(`${charge.name}: ${error}`);
      }
    }

    // 2. Récupérer les transactions récurrentes dues
    // detect transaction table column names
    const txTableInfo = await db.getAllAsync<any>(`PRAGMA table_info(transactions);`);
    const txCols = (txTableInfo || []).map((c: any) => c.name);
    const isRecurringCol = txCols.includes('is_recurring') ? 'is_recurring' : (txCols.includes('isRecurring') ? 'isRecurring' : 'is_recurring');
    const lastRecurredCol = txCols.includes('last_recurred_date') ? 'last_recurred_date' : (txCols.includes('lastRecurredDate') ? 'lastRecurredDate' : (txCols.includes('lastRecurred') ? 'lastRecurred' : 'last_recurred_date'));
    const dateColTx = txCols.includes('date') ? 'date' : 'date';

    // 2. Récupérer les transactions récurrentes dues
    // Construire la requête seulement si les colonnes existent
    const txWhere: string[] = [];
    const txParams: any[] = [];
    if (txCols.includes(isRecurringCol)) {
      txWhere.push(`${isRecurringCol} = 1`);
    }
    if (txCols.includes(dateColTx)) {
      txWhere.push(`${dateColTx} <= ?`);
      txParams.push(today);
    }
    if (txCols.includes(lastRecurredCol)) {
      txWhere.push(`(${lastRecurredCol} IS NULL OR ${lastRecurredCol} < ?)`);
      txParams.push(today);
    }

    const txWhereClause = txWhere.length > 0 ? `WHERE ${txWhere.join(' AND ')}` : 'WHERE 0';

    const recurringTransactions = await db.getAllAsync<any>(`
      SELECT * FROM transactions
      ${txWhereClause}
    `, txParams);

    console.log(`🔄 ${recurringTransactions.length} transaction(s) récurrente(s) à traiter`);

    let recurProcessedCount = 0;
    for (const transaction of recurringTransactions) {
      if (recurProcessedCount >= MAX_PER_RUN) {
        console.warn(`⚠️ Reached recurring processing limit of ${MAX_PER_RUN} items for this run`);
        break;
      }
      try {
        // Calculer la prochaine date (un mois plus tard, même jour)
        const currentDate = new Date(transaction.date);
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        // Créer la nouvelle transaction récurrente
        await db.runAsync(`
          INSERT INTO transactions (
            id, description, amount, type, category, sub_category,
            account_id, date, is_recurring, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        `, [
          `recur_${transaction.id}_${Date.now()}`,
          transaction.description,
          transaction.amount,
          transaction.type,
          transaction.category,
          transaction.subCategory || transaction.sub_category || null,
          transaction.accountId || transaction.account_id || null,
          nextMonth.toISOString().split('T')[0],
          new Date().toISOString(),
        ]);

        // Mettre à jour la date de traitement de l'originale seulement si la colonne existe
        if (txCols.includes(lastRecurredCol)) {
          await db.runAsync(`UPDATE transactions SET ${lastRecurredCol} = ? WHERE id = ?`, [today, transaction.id]);
        } else {
          console.debug(`ℹ️ Colonne ${lastRecurredCol} absente dans transactions, saut mise à jour last-recurred pour ${transaction.id}`);
        }

        processed.push(transaction.id);
        recurProcessedCount += 1;
        console.log(`✅ Transaction récurrente créée: ${transaction.description}`);
      } catch (error) {
        console.error(`❌ Erreur récurrence transaction ${transaction.description}:`, error);
        errors.push(`${transaction.description}: ${error}`);
      }
    }

    return {
      processed: processed.length,
      errors,
    };
  } catch (error) {
    console.error('❌ Erreur processAutomaticDebits:', error);
    return {
      processed: 0,
      errors: [`Erreur globale: ${error}`],
    };
  }
}

/**
 * Récupère la liste des prélèvements en attente (à venir dans les 7 jours)
 */
export async function getPendingDebits(): Promise<PendingDebit[]> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  try {
    const charges = await db.getAllAsync<any>(`
      SELECT 
        id,
        'annual_charge' as type,
        name,
        amount,
        due_date as dueDate,
        account_id as accountId,
        'charge_annuelle' as category
      FROM annual_charges
      WHERE due_date BETWEEN ? AND ?
      AND is_active = 1
      ORDER BY due_date ASC
    `, [today, nextWeekStr]);

    return charges.map(charge => ({
      id: charge.id,
      type: 'annual_charge',
      name: charge.name,
      amount: charge.amount,
      dueDate: charge.dueDate,
      accountId: charge.accountId,
      category: charge.category,
    }));
  } catch (error) {
    console.error('❌ Erreur getPendingDebits:', error);
    return [];
  }
}
