// src/services/annualChargeService.ts - VERSION SIMPLIFIÉE SANS CHARGES ISLAMIQUES
import { AnnualCharge, AnnualChargeStats, CreateAnnualChargeData, UpdateAnnualChargeData } from '../types/AnnualCharge';
import { generateId } from '../utils/numberUtils';
import { accountService } from './accountService';
import { getDatabase } from './database/sqlite';
import { transactionService } from './transactionService';

interface DatabaseAnnualCharge {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  category: string;
  description?: string;
  is_recurring: number;
  is_active: number;
  created_at: string;
  type?: string;
  is_paid?: number;
  paid_date?: string;
  reminder_days?: number;
  account_id?: string;
  auto_deduct?: number;
  payment_method?: string;
  recurrence?: string;
}

export const annualChargeService = {
  // ✅ ASSURER QUE LA TABLE EXISTE AVEC LES COLONNES NÉCESSAIRES
  async ensureAnnualChargesTableExists(): Promise<void> {
    try {
      const db = await getDatabase();
      
      const tableExists = await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='annual_charges'"
      );
      
      if (!tableExists) {
        console.log('🛠️ [annualChargeService] Creating annual_charges table...');
        
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS annual_charges (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL DEFAULT 0,
            due_date TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            is_recurring INTEGER NOT NULL DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            type TEXT DEFAULT 'normal',
            is_paid INTEGER NOT NULL DEFAULT 0,
            paid_date TEXT,
            reminder_days INTEGER DEFAULT 7,
            account_id TEXT,
            auto_deduct INTEGER NOT NULL DEFAULT 0,
            payment_method TEXT,
            recurrence TEXT
          );
        `);
        
        console.log('✅ [annualChargeService] annual_charges table created successfully');
      } else {
        // Vérifier et ajouter les colonnes manquantes
        await this.addMissingColumns();
      }
    } catch (error) {
      console.error('❌ [annualChargeService] Error ensuring annual_charges table exists:', error);
      throw error;
    }
  },

  // ✅ AJOUTER LES COLONNES MANQUANTES
  async addMissingColumns(): Promise<void> {
    try {
      const db = await getDatabase();
      const tableInfo = await db.getAllAsync(`PRAGMA table_info(annual_charges)`) as any[];
      const existingColumns = tableInfo.map(col => col.name);

      const missingColumns = [
        { name: 'is_active', type: 'INTEGER NOT NULL DEFAULT 1' },
        { name: 'is_recurring', type: 'INTEGER NOT NULL DEFAULT 0' },
        { name: 'type', type: 'TEXT DEFAULT "normal"' },
        { name: 'paid_date', type: 'TEXT' },
        { name: 'reminder_days', type: 'INTEGER DEFAULT 7' },
        { name: 'account_id', type: 'TEXT' },
        { name: 'auto_deduct', type: 'INTEGER NOT NULL DEFAULT 0' },
        { name: 'payment_method', type: 'TEXT' },
        { name: 'recurrence', type: 'TEXT' }
      ];

      for (const column of missingColumns) {
        if (!existingColumns.includes(column.name)) {
          console.log(`🔧 [annualChargeService] Adding missing column: ${column.name}`);
          await db.execAsync(`ALTER TABLE annual_charges ADD COLUMN ${column.name} ${column.type}`);
        }
      }

      console.log('✅ [annualChargeService] All columns are present');
    } catch (error) {
      console.error('❌ [annualChargeService] Error adding missing columns:', error);
      throw error;
    }
  },

  // ✅ CRÉER UNE CHARGE ANNUELLE
  async createAnnualCharge(chargeData: CreateAnnualChargeData, userId: string): Promise<string> {
    try {
      await this.ensureAnnualChargesTableExists();
      const db = await getDatabase();
      
      const chargeId = generateId();
      const now = new Date().toISOString();

      // ✅ Validation des données d'entrée
      if (!chargeData.name?.trim()) {
        throw new Error('Le nom de la charge est requis');
      }
      if (!chargeData.amount || chargeData.amount <= 0) {
        throw new Error('Le montant doit être supérieur à 0');
      }
      if (!chargeData.dueDate) {
        throw new Error('La date d\'échéance est requise');
      }
      if (!chargeData.category?.trim()) {
        throw new Error('La catégorie est requise');
      }

      console.log('🔄 [annualChargeService] Creating annual charge:', {
        name: chargeData.name,
        amount: chargeData.amount,
        category: chargeData.category,
        dueDate: chargeData.dueDate
      });

      await db.runAsync(`
        INSERT INTO annual_charges (
          id, user_id, name, amount, due_date, category, description,
          is_recurring, is_active, created_at, type, is_paid,
          paid_date, reminder_days, account_id, auto_deduct, payment_method, recurrence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        chargeId,
        userId,
        chargeData.name.trim(),
        chargeData.amount,
        chargeData.dueDate,
        chargeData.category.trim(),
        chargeData.notes?.trim() || null,
        chargeData.isRecurring ? 1 : 0,
        1, // is_active = true par défaut
        now,
        chargeData.type || 'normal',
        0, // is_paid = false par défaut
        null, // paid_date = null
        chargeData.reminderDays || 7,
        chargeData.accountId || null,
        chargeData.autoDeduct ? 1 : 0,
        chargeData.paymentMethod || null,
        chargeData.recurrence || null
      ]);

      console.log('✅ [annualChargeService] Annual charge created successfully:', chargeId);
      return chargeId;

    } catch (error) {
      console.error('❌ [annualChargeService] Error creating annual charge:', error);
      throw error;
    }
  },

  // ✅ METTRE À JOUR UNE CHARGE ANNUELLE
  async updateAnnualCharge(chargeId: string, updates: UpdateAnnualChargeData, userId: string): Promise<void> {
    try {
      const db = await getDatabase();

      // Vérifier que la charge existe et appartient à l'utilisateur
      const existingCharge = await db.getFirstAsync(`
        SELECT id FROM annual_charges 
        WHERE id = ? AND user_id = ? AND is_active = 1
      `, [chargeId, userId]) as any;

      if (!existingCharge) {
        throw new Error('Charge annuelle introuvable');
      }

      // Construire la requête de mise à jour dynamiquement
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.name !== undefined) {
        if (!updates.name.trim()) {
          throw new Error('Le nom de la charge ne peut pas être vide');
        }
        updateFields.push('name = ?');
        updateValues.push(updates.name.trim());
      }

      if (updates.amount !== undefined) {
        if (updates.amount <= 0) {
          throw new Error('Le montant doit être supérieur à 0');
        }
        updateFields.push('amount = ?');
        updateValues.push(updates.amount);
      }

      if (updates.dueDate !== undefined) {
        updateFields.push('due_date = ?');
        updateValues.push(updates.dueDate);
      }

      if (updates.category !== undefined) {
        if (!updates.category.trim()) {
          throw new Error('La catégorie est requise');
        }
        updateFields.push('category = ?');
        updateValues.push(updates.category.trim());
      }

      if (updates.notes !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(updates.notes.trim() || null);
      }

      if (updates.isRecurring !== undefined) {
        updateFields.push('is_recurring = ?');
        updateValues.push(updates.isRecurring ? 1 : 0);
      }

      if (updates.reminderDays !== undefined) {
        updateFields.push('reminder_days = ?');
        updateValues.push(updates.reminderDays);
      }

      if (updates.accountId !== undefined) {
        updateFields.push('account_id = ?');
        updateValues.push(updates.accountId || null);
      }

      if (updates.autoDeduct !== undefined) {
        updateFields.push('auto_deduct = ?');
        updateValues.push(updates.autoDeduct ? 1 : 0);
      }

      if (updates.paymentMethod !== undefined) {
        updateFields.push('payment_method = ?');
        updateValues.push(updates.paymentMethod || null);
      }

      if (updates.recurrence !== undefined) {
        updateFields.push('recurrence = ?');
        updateValues.push(updates.recurrence || null);
      }

      if (updateFields.length === 0) {
        console.log('⚠️ [annualChargeService] No fields to update');
        return;
      }

      // Ajouter l'ID à la fin pour la clause WHERE
      updateValues.push(chargeId, userId);

      const updateQuery = `
        UPDATE annual_charges 
        SET ${updateFields.join(', ')} 
        WHERE id = ? AND user_id = ? AND is_active = 1
      `;

      console.log('🔄 [annualChargeService] Updating annual charge:', { chargeId, updates });

      await db.runAsync(updateQuery, updateValues);

      console.log('✅ [annualChargeService] Annual charge updated successfully');

    } catch (error) {
      console.error('❌ [annualChargeService] Error updating annual charge:', error);
      throw error;
    }
  },

  // ✅ SUPPRIMER UNE CHARGE ANNUELLE (suppression définitive)
  async deleteAnnualCharge(chargeId: string, userId: string): Promise<void> {
    try {
      const db = await getDatabase();

      // Vérifier que la charge existe
      const existingCharge = await db.getFirstAsync(`
        SELECT id FROM annual_charges 
        WHERE id = ? AND user_id = ?
      `, [chargeId, userId]) as any;

      if (!existingCharge) {
        throw new Error('Charge annuelle introuvable');
      }

      console.log('🗑️ [annualChargeService] Permanently deleting annual charge and related data:', chargeId);

      try {
        // Supprimer les paiements associés
        await db.runAsync(
          'DELETE FROM annual_charge_payments WHERE charge_id = ?',
          [chargeId]
        );

        // Supprimer les notifications associées
        await db.runAsync(
          'DELETE FROM scheduled_notifications WHERE reference_id = ? AND reference_type = ?',
          [chargeId, 'annual_charge']
        );

        // Supprimer la charge elle-même
        await db.runAsync(
          'DELETE FROM annual_charges WHERE id = ? AND user_id = ?',
          [chargeId, userId]
        );

        console.log('✅ [annualChargeService] Annual charge and related data deleted successfully');

      } catch (error) {
        console.error('❌ [annualChargeService] Error during deletion:', error);
        throw error;
      }

    } catch (error) {
      console.error('❌ [annualChargeService] Error deleting annual charge:', error);
      throw error;
    }
  },

  // ✅ RÉCUPÉRER TOUTES LES CHARGES ANNUELLES ACTIVES
  async getAllAnnualCharges(userId: string): Promise<AnnualCharge[]> {
    try {
      await this.ensureAnnualChargesTableExists();
      const db = await getDatabase();

      console.log('🔍 [annualChargeService] Loading all annual charges...');

      const rows = await db.getAllAsync(`
        SELECT * FROM annual_charges 
        WHERE user_id = ? AND is_active = 1 
        ORDER BY due_date ASC, name ASC
      `, [userId]) as DatabaseAnnualCharge[];

      const charges: AnnualCharge[] = rows.map(this.mapDatabaseToAnnualCharge);

      console.log(`✅ [annualChargeService] Loaded ${charges.length} annual charges`);
      return charges;

    } catch (error) {
      console.error('❌ [annualChargeService] Error loading annual charges:', error);
      throw error;
    }
  },

  // ✅ RÉCUPÉRER UNE CHARGE PAR ID
  async getAnnualChargeById(chargeId: string, userId: string): Promise<AnnualCharge | null> {
    try {
      const db = await getDatabase();

      const row = await db.getFirstAsync(`
        SELECT * FROM annual_charges 
        WHERE id = ? AND user_id = ? AND is_active = 1
      `, [chargeId, userId]) as DatabaseAnnualCharge | null;

      if (!row) {
        return null;
      }

      return this.mapDatabaseToAnnualCharge(row);

    } catch (error) {
      console.error('❌ [annualChargeService] Error loading annual charge by ID:', error);
      throw error;
    }
  },

  // ✅ MAPPER LES DONNÉES DE LA BASE VERS LE TYPE AnnualCharge
  mapDatabaseToAnnualCharge(item: DatabaseAnnualCharge): AnnualCharge {
    return {
      id: item.id,
      userId: item.user_id,
      name: item.name,
      amount: item.amount,
      dueDate: item.due_date,
      category: item.category,
      notes: item.description,
      isRecurring: Boolean(item.is_recurring),
      isActive: Boolean(item.is_active),
      createdAt: item.created_at,
      type: (item.type as 'normal' | 'obligatory' | 'recommended') || 'normal',
      isPaid: Boolean(item.is_paid),
      paidDate: item.paid_date,
      reminderDays: item.reminder_days || 7,
      accountId: item.account_id,
      autoDeduct: Boolean(item.auto_deduct),
      paymentMethod: item.payment_method,
      recurrence: item.recurrence as 'yearly' | 'monthly' | 'quarterly' | undefined
    };
  },

  // ✅ PAYER UNE CHARGE
  async payCharge(chargeId: string, accountId: string | undefined, userId: string): Promise<void> {
    try {
      const db = await getDatabase();

      // Récupérer la charge
      const charge = await this.getAnnualChargeById(chargeId, userId);
      if (!charge) {
        throw new Error('Charge annuelle introuvable');
      }

      if (charge.isPaid) {
        throw new Error('Cette charge est déjà payée');
      }

      console.log('💰 [annualChargeService] Paying annual charge:', { chargeId, accountId, amount: charge.amount });

      // Vérifier le solde du compte si spécifié
      if (accountId) {
        const account = await accountService.getAccountById(accountId, userId);
        if (!account) {
          throw new Error('Compte introuvable');
        }

        if (account.balance < charge.amount) {
          throw new Error(`Solde insuffisant. Solde actuel: ${account.balance.toFixed(2)} MAD`);
        }
      }

      // Commencer une transaction
      await db.execAsync('BEGIN TRANSACTION');

      try {
        // Marquer la charge comme payée
        const now = new Date().toISOString();
        await db.runAsync(`
          UPDATE annual_charges 
          SET is_paid = 1, paid_date = ?
          WHERE id = ? AND user_id = ?
        `, [now, chargeId, userId]);

        // Créer la transaction associée
        const transactionId = await transactionService.createTransaction({
          amount: -charge.amount, // Montant négatif pour une dépense
          description: `Paiement: ${charge.name} - Paiement automatique de la charge annuelle`,
          category: 'charges_annuelles',
          date: now,
          accountId: accountId,
          type: 'expense',
          userId: userId
        }, userId);

        console.log('✅ [annualChargeService] Transaction created:', transactionId);

        // Valider la transaction
        await db.execAsync('COMMIT');

        console.log('✅ [annualChargeService] Annual charge paid successfully');

      } catch (error) {
        await db.execAsync('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('❌ [annualChargeService] Error paying annual charge:', error);
      throw error;
    }
  },

  // ✅ BASCULER LE STATUT PAYÉ
  async togglePaidStatus(chargeId: string, isPaid: boolean, userId: string): Promise<void> {
    try {
      const db = await getDatabase();

      const charge = await this.getAnnualChargeById(chargeId, userId);
      if (!charge) {
        throw new Error('Charge annuelle introuvable');
      }

      console.log('🔄 [annualChargeService] Toggling paid status:', { chargeId, isPaid });

      const now = new Date().toISOString();
      
      await db.runAsync(`
        UPDATE annual_charges 
        SET is_paid = ?, paid_date = ?
        WHERE id = ? AND user_id = ?
      `, [isPaid ? 1 : 0, isPaid ? now : null, chargeId, userId]);

      console.log('✅ [annualChargeService] Paid status toggled successfully');

    } catch (error) {
      console.error('❌ [annualChargeService] Error toggling paid status:', error);
      throw error;
    }
  },

  // ✅ VÉRIFIER SI UNE CHARGE PEUT ÊTRE PAYÉE
  async canPayCharge(chargeId: string, userId: string): Promise<{ canPay: boolean; reason?: string }> {
    try {
      const charge = await this.getAnnualChargeById(chargeId, userId);
      
      if (!charge) {
        return { canPay: false, reason: 'Charge introuvable' };
      }

      if (charge.isPaid) {
        return { canPay: false, reason: 'Charge déjà payée' };
      }

      if (!charge.isActive) {
        return { canPay: false, reason: 'Charge inactive' };
      }

      return { canPay: true };

    } catch (error) {
      console.error('❌ [annualChargeService] Error checking if charge can be paid:', error);
      return { canPay: false, reason: 'Erreur lors de la vérification' };
    }
  },

  // ✅ TRAITER LES CHARGES ÉCHUES AVEC PRÉLÈVEMENT AUTOMATIQUE
  async processDueCharges(userId: string): Promise<{ processed: number; errors: string[] }> {
    try {
      const db = await getDatabase();
      const today = new Date().toISOString().split('T')[0];
      
      console.log('🔄 [annualChargeService] Processing due charges...');

      // Récupérer les charges échues avec prélèvement automatique
      const dueCharges = await db.getAllAsync(`
        SELECT * FROM annual_charges 
        WHERE user_id = ? 
          AND is_active = 1 
          AND is_paid = 0 
          AND auto_deduct = 1 
          AND account_id IS NOT NULL 
          AND due_date <= ?
        ORDER BY due_date ASC
      `, [userId, today]) as DatabaseAnnualCharge[];

      let processed = 0;
      const errors: string[] = [];

      for (const chargeData of dueCharges) {
        try {
          const charge = this.mapDatabaseToAnnualCharge(chargeData);
          
          // Vérifier si le paiement est possible
          const canPay = await this.canPayCharge(charge.id, userId);
          if (!canPay.canPay) {
            errors.push(`${charge.name}: ${canPay.reason}`);
            continue;
          }

          // Effectuer le paiement
          await this.payCharge(charge.id, charge.accountId!, userId);
          processed++;

          console.log(`✅ [annualChargeService] Auto-processed charge: ${charge.name}`);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          errors.push(`${chargeData.name}: ${errorMessage}`);
          console.error('❌ [annualChargeService] Error processing charge:', chargeData.name, error);
        }
      }

      console.log(`✅ [annualChargeService] Processed ${processed} charges, ${errors.length} errors`);
      
      return { processed, errors };

    } catch (error) {
      console.error('❌ [annualChargeService] Error processing due charges:', error);
      throw error;
    }
  },

  // ✅ OBTENIR LES STATISTIQUES
  async getStats(userId: string): Promise<AnnualChargeStats> {
    try {
      const charges = await this.getAllAnnualCharges(userId);
      const currentYear = new Date().getFullYear();
      const today = new Date().toISOString().split('T')[0];

      // Filtrer pour l'année courante
      const currentYearCharges = charges.filter(charge => {
        const chargeYear = new Date(charge.dueDate).getFullYear();
        return chargeYear === currentYear;
      });

      const totalCharges = currentYearCharges.length;
      const totalAmount = currentYearCharges.reduce((sum, charge) => sum + charge.amount, 0);
      const paidCharges = currentYearCharges.filter(charge => charge.isPaid);
      const paidAmount = paidCharges.reduce((sum, charge) => sum + charge.amount, 0);
      const pendingAmount = totalAmount - paidAmount;

      const upcomingCharges = currentYearCharges
        .filter(charge => !charge.isPaid && charge.dueDate >= today)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);

      const overdueCharges = currentYearCharges
        .filter(charge => !charge.isPaid && charge.dueDate < today)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      return {
        totalCharges,
        totalAmount,
        paidAmount,
        pendingAmount,
        upcomingCharges,
        overdueCharges
      };

    } catch (error) {
      console.error('❌ [annualChargeService] Error getting stats:', error);
      throw error;
    }
  }
};