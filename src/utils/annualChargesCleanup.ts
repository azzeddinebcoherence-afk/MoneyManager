// src/utils/annualChargesCleanup.ts
import { getDatabase } from '../services/database/sqlite';
import { emergencyDatabaseFix } from './emergencyDatabaseFix';

export async function runAnnualChargesCleanup(): Promise<{
  normalized: number;
  deleted: number;
  recalculated: boolean;
}> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  let normalized = 0;
  let deleted = 0;

  // 1) Normaliser les catégories (legacy -> standard)
  try {
    const res = await db.runAsync(
      `UPDATE transactions SET category = 'charges_annuelles' WHERE category = 'charge_annuelle'`
    ) as any;
    if (res && 'changes' in res) normalized = res.changes || 0;
  } catch (e) {
    console.warn('⚠️ Cleanup: normalization update failed', e);
  }

  // 2) Supprimer les doublons du jour (conserver 1 par clé (compte, montant absolu, date))
  try {
    const rows = await db.getAllAsync<any>(
      `SELECT id, description, amount, type, category, account_id, date
       FROM transactions
       WHERE date = ? AND category = 'charges_annuelles'`,
      [today]
    );

    const groups = new Map<string, any[]>();
    for (const row of rows) {
      const key = `${row.account_id || ''}|${Math.abs(Number(row.amount) || 0)}|${row.date}`;
      const arr = groups.get(key) || [];
      arr.push(row);
      groups.set(key, arr);
    }

    for (const [, arr] of groups) {
      if (arr.length <= 1) continue;
      // Conserver de préférence un intitulé "Paiement: ..."
      const preferred = arr.find(r => typeof r.description === 'string' && r.description.startsWith('Paiement:'));
      const keep = preferred || arr[0];
      for (const row of arr) {
        if (row.id === keep.id) continue;
        await db.runAsync(`DELETE FROM transactions WHERE id = ?`, [row.id]);
        deleted++;
      }
    }
  } catch (e) {
    console.warn('⚠️ Cleanup: duplicate purge failed', e);
  }

  // 3) Recalculer les soldes des comptes
  try {
    await emergencyDatabaseFix.recalculateAllBalances();
    return { normalized, deleted, recalculated: true };
  } catch (e) {
    console.warn('⚠️ Cleanup: balance recalculation failed', e);
    return { normalized, deleted, recalculated: false };
  }
}
