// src/services/annualChargeService.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { AnnualCharge, AnnualChargeStats, CreateAnnualChargeData, UpdateAnnualChargeData } from '../types/AnnualCharge';
import { generateId } from '../utils/numberUtils';
import { accountService } from './accountService';
import { getDatabase } from './database/sqlite';
import { recurrenceService } from './recurrenceService';
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
  is_islamic?: number;
  islamic_holiday_id?: string;
  arabic_name?: string;
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
  // ✅ ASSURER QUE LA TABLE EXISTE AVEC TOUTES LES COLONNES
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
            is_islamic INTEGER NOT NULL DEFAULT 0,
            islamic_holiday_id TEXT,
            arabic_name TEXT,
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
        { name: 'is_islamic', type: 'INTEGER NOT NULL DEFAULT 0' },
        { name: 'islamic_holiday_id', type: 'TEXT' },
        { name: 'arabic_name', type: 'TEXT' },
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
          console.log(`🛠️ [annualChargeService] Adding missing column: ${column.name}`);
          try {
            await db.execAsync(`ALTER TABLE annual_charges ADD COLUMN ${column.name} ${column.type}`);
            console.log(`✅ [annualChargeService] Column ${column.name} added successfully`);
          } catch (alterError: any) {
            if (alterError.message?.includes('duplicate column name')) {
              console.log(`ℹ️ [annualChargeService] Column ${column.name} already exists`);
            } else {
              console.warn(`⚠️ [annualChargeService] Could not add column ${column.name}:`, alterError.message);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ [annualChargeService] Error adding missing columns:', error);
    }
  },

  // ✅ CRÉER UNE CHARGE ANNUELLE
  async createAnnualCharge(chargeData: CreateAnnualChargeData, userId: string = 'default-user'): Promise<string> {
    try {
      await this.ensureAnnualChargesTableExists();

      const db = await getDatabase();
      const id = generateId();
      const createdAt = new Date().toISOString();

      console.log('🔄 [annualChargeService] Creating annual charge:', { 
        id, 
        name: chargeData.name,
        amount: chargeData.amount,
        dueDate: chargeData.dueDate,
        recurrence: chargeData.recurrence,
        isRecurring: chargeData.isRecurring,
        isPaid: chargeData.isPaid
      });

      // ✅ Calculer is_recurring basé sur recurrence
      const isRecurring = chargeData.recurrence ? 1 : (chargeData.isRecurring ? 1 : 0);

      // ✅ Si la charge est créée comme payée, déduire immédiatement du compte
      if (chargeData.isPaid && chargeData.accountId) {
        console.log('💰 Charge créée comme payée - déduction du compte...');
        const chargeForDeduction: AnnualCharge = {
          id,
          userId,
          name: chargeData.name,
          amount: chargeData.amount,
          dueDate: chargeData.dueDate,
          category: chargeData.category || 'other',
          isPaid: true,
          createdAt,
          notes: chargeData.notes,
          paymentMethod: chargeData.paymentMethod,
          recurrence: chargeData.recurrence,
          reminderDays: chargeData.reminderDays,
          accountId: chargeData.accountId,
          autoDeduct: chargeData.autoDeduct,
          isIslamic: chargeData.isIslamic,
          islamicHolidayId: chargeData.islamicHolidayId,
          arabicName: chargeData.arabicName,
          type: chargeData.type,
          paidDate: chargeData.paidDate,
          isActive: chargeData.isActive ?? true,
          isRecurring: chargeData.isRecurring ?? false
        };
        
        await this.deductFromAccount(chargeForDeduction, chargeData.accountId, userId);
      }

      await db.runAsync(
        `INSERT INTO annual_charges (
          id, user_id, name, amount, due_date, category, description, 
          is_recurring, is_active, created_at, is_islamic, islamic_holiday_id, 
          arabic_name, type, is_paid, paid_date, reminder_days,
          account_id, auto_deduct, payment_method, recurrence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          chargeData.name,
          chargeData.amount,
          chargeData.dueDate,
          chargeData.category || 'other',
          chargeData.notes || '',
          isRecurring,
          chargeData.isActive !== false ? 1 : 0,
          createdAt,
          chargeData.isIslamic ? 1 : 0,
          chargeData.islamicHolidayId || null,
          chargeData.arabicName || null,
          chargeData.type || 'normal',
          chargeData.isPaid ? 1 : 0,
          chargeData.paidDate || null,
          chargeData.reminderDays || 7,
          chargeData.accountId || null,
          chargeData.autoDeduct ? 1 : 0,
          chargeData.paymentMethod || null,
          chargeData.recurrence || null
        ]
      );

      console.log('✅ [annualChargeService] Annual charge created successfully');
      return id;
    } catch (error) {
      console.error('❌ [annualChargeService] Error in createAnnualCharge:', error);
      throw error;
    }
  },

  // ✅ VALIDER SI UNE CHARGE PEUT ÊTRE PAYÉE
  async canPayCharge(chargeId: string, userId: string = 'default-user'): Promise<{ canPay: boolean; reason?: string }> {
    try {
      const charge = await this.getAnnualChargeById(chargeId, userId);
      
      if (!charge) {
        return { canPay: false, reason: 'Charge non trouvée' };
      }

      if (charge.isPaid) {
        return { canPay: false, reason: 'Charge déjà payée' };
      }

      // ✅ VALIDATION CRITIQUE : Validation stricte des dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dueDate = new Date(charge.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const dueMonth = dueDate.getMonth();
      const dueYear = dueDate.getFullYear();
      
      // ✅ LOGIQUE : La charge peut être payée seulement si :
      // 1. Elle est dans le mois courant ET année courante
      // 2. OU elle est dans un mois antérieur (échéance dépassée)
      const isDueThisMonth = (dueYear === currentYear && dueMonth === currentMonth);
      const isPastDue = dueDate < today;
      
      // ❌ CORRECTION : Empêcher le paiement si la date est dans le futur d'un autre mois
      const isFutureMonth = dueDate > today && !isDueThisMonth;
      
      if (isFutureMonth) {
        return { 
          canPay: false, 
          reason: `La charge ne peut être payée qu'à partir du ${dueDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}` 
        };
      }

      // Vérifier le compte si prélèvement automatique
      if (charge.autoDeduct && charge.accountId) {
        const accountValidation = await accountService.validateAccountForOperation(
          charge.accountId, 
          charge.amount, 
          'debit'
        );
        
        if (!accountValidation.isValid) {
          return { canPay: false, reason: accountValidation.message };
        }
      }

      return { canPay: true };
    } catch (error) {
      console.error('❌ Erreur validation paiement charge:', error);
      return { canPay: false, reason: 'Erreur lors de la validation' };
    }
  },

  // ✅ PAYER UNE CHARGE AVEC DÉDUCTION AUTOMATIQUE
  async payCharge(chargeId: string, accountId?: string, userId: string = 'default-user'): Promise<void> {
    try {
      await this.ensureAnnualChargesTableExists();

      const db = await getDatabase();
      const charge = await this.getAnnualChargeById(chargeId, userId);
      
      if (!charge) {
        throw new Error('Charge non trouvée');
      }

      if (charge.isPaid) {
        console.log('ℹ️ Charge déjà payée');
        return;
      }

      // ✅ VALIDATION CRITIQUE : Vérifier si la charge peut être payée
      const validation = await this.canPayCharge(chargeId, userId);
      if (!validation.canPay) {
        throw new Error(validation.reason || 'Impossible de payer cette charge');
      }

      const paymentAccountId = accountId || charge.accountId;
      
      // Si prélèvement automatique activé et compte spécifié
      if (charge.autoDeduct && paymentAccountId) {
        await this.deductFromAccount(charge, paymentAccountId, userId);
      }

      // Marquer comme payée
      const paidDate = new Date().toISOString();
      await db.runAsync(
        'UPDATE annual_charges SET is_paid = 1, paid_date = ? WHERE id = ? AND user_id = ?',
        [paidDate, chargeId, userId]
      );

      console.log('✅ Charge payée avec succès:', chargeId);

      // ✅ CRITIQUE : Si c'est récurrent, générer la prochaine occurrence
      if (charge.isRecurring && charge.recurrence) {
        console.log('🔄 Charge récurrente payée - génération prochaine occurrence...');
        await recurrenceService.generateNextOccurrence(charge, userId);
      }

    } catch (error) {
      console.error('❌ Erreur lors du paiement de la charge:', error);
      throw error;
    }
  },

  // ✅ DÉDUIRE LE MONTANT DU COMPTE - VERSION CORRIGÉE
  async deductFromAccount(charge: AnnualCharge, accountId: string, userId: string): Promise<void> {
    try {
      console.log('💰 Déduction automatique du compte:', {
        charge: charge.name,
        amount: charge.amount,
        accountId: accountId
      });

      // Vérifier que le compte existe et a suffisamment de fonds
      const accountValidation = await accountService.validateAccountForOperation(
        accountId, 
        charge.amount, 
        'debit'
      );
      
      if (!accountValidation.isValid || !accountValidation.account) {
        throw new Error(accountValidation.message || 'Compte invalide');
      }

      // ✅ CORRECTION : Créer une transaction de dépense avec les bonnes propriétés
      const transactionData = {
        amount: charge.amount,
        type: 'expense' as const,
        category: charge.category,
        accountId: accountId,
        description: `Charge annuelle: ${charge.name}`,
        date: new Date().toISOString().split('T')[0],
        userId: userId,
        isAnnualCharge: true,
        annualChargeId: charge.id
      };

      await transactionService.createTransaction(transactionData, userId);

      console.log('✅ Déduction automatique effectuée avec succès - solde mis à jour');
    } catch (error) {
      console.error('❌ Erreur lors de la déduction automatique:', error);
      throw new Error(`Impossible de déduire le montant du compte: ${error}`);
    }
  },

  // ✅ PRÉLÈVEMENT AUTOMATIQUE DES CHARGES DUES
  async processDueCharges(userId: string = 'default-user'): Promise<{ processed: number; errors: string[] }> {
    try {
      await this.ensureAnnualChargesTableExists();

      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // ✅ CORRECTION CRITIQUE : Ne traiter que les charges DU MOIS COURANT
      const db = await getDatabase();
      
      const dueCharges = await db.getAllAsync(
        `SELECT * FROM annual_charges 
         WHERE user_id = ? 
         AND is_paid = 0 
         AND auto_deduct = 1 
         AND account_id IS NOT NULL 
         AND is_active = 1
         AND strftime('%Y', due_date) = ?
         AND strftime('%m', due_date) = ?`,
        [userId, currentYear.toString(), (currentMonth + 1).toString().padStart(2, '0')]
      ) as DatabaseAnnualCharge[];

      console.log(`🔄 Traitement de ${dueCharges.length} charges dues ce mois (${currentMonth + 1}/${currentYear})`);

      const results = {
        processed: 0,
        errors: [] as string[]
      };

      for (const charge of dueCharges) {
        try {
          // Vérifier que la charge peut être payée (date valide)
          const validation = await this.canPayCharge(charge.id, userId);
          if (!validation.canPay) {
            results.errors.push(`Charge "${charge.name}" ne peut être payée: ${validation.reason}`);
            continue;
          }

          await this.payCharge(charge.id, charge.account_id, userId);
          results.processed++;
          console.log(`✅ Charge traitée automatiquement: ${charge.name}`);
        } catch (error) {
          const errorMessage = `Erreur avec la charge ${charge.name}: ${error}`;
          console.error('❌', errorMessage);
          results.errors.push(errorMessage);
        }
      }

      console.log(`✅ Traitement automatique terminé: ${results.processed} charges traitées, ${results.errors.length} erreurs`);
      return results;
    } catch (error) {
      console.error('❌ Erreur lors du traitement automatique des charges:', error);
      throw error;
    }
  },

  // ✅ TOGGLE PAID STATUS CORRIGÉ
  async togglePaidStatus(id: string, isPaid: boolean, userId: string = 'default-user'): Promise<void> {
    try {
      await this.ensureAnnualChargesTableExists();
      
      const charge = await this.getAnnualChargeById(id, userId);
      if (!charge) {
        throw new Error('Charge non trouvée');
      }

      // ✅ CORRECTION : Vérifier si le statut est déjà le même
      if (charge.isPaid === isPaid) {
        console.log(`ℹ️ Charge déjà ${isPaid ? 'payée' : 'non payée'} - aucune action nécessaire`);
        return;
      }

      // ✅ VALIDATION : Vérifier si on peut marquer comme payé
      if (isPaid) {
        const validation = await this.canPayCharge(id, userId);
        if (!validation.canPay) {
          throw new Error(validation.reason || 'Impossible de payer cette charge');
        }
      }

      const db = await getDatabase();
      
      if (isPaid && charge.autoDeduct && charge.accountId) {
        await this.deductFromAccount(charge, charge.accountId, userId);
      }

      const paidDate = isPaid ? new Date().toISOString() : null;
      
      await db.runAsync(
        'UPDATE annual_charges SET is_paid = ?, paid_date = ? WHERE id = ? AND user_id = ?',
        [isPaid ? 1 : 0, paidDate, id, userId]
      );
      
      console.log(`✅ Charge ${isPaid ? 'marquée comme payée' : 'marquée comme non payée'}: ${id}`);
    } catch (error) {
      console.error('❌ Error toggling paid status:', error);
      throw error;
    }
  },

  // ✅ OBTENIR TOUTES LES CHARGES
  async getAllAnnualCharges(userId: string = 'default-user'): Promise<AnnualCharge[]> {
    try {
      await this.ensureAnnualChargesTableExists();

      const db = await getDatabase();
      
      const result = await db.getAllAsync(
        `SELECT * FROM annual_charges WHERE user_id = ? ORDER BY due_date ASC`,
        [userId]
      ) as DatabaseAnnualCharge[];
      
      const charges: AnnualCharge[] = result.map((item) => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        amount: item.amount,
        dueDate: item.due_date,
        category: item.category,
        description: item.description || '',
        notes: item.description || '',
        isRecurring: Boolean(item.is_recurring),
        isActive: Boolean(item.is_active),
        createdAt: item.created_at,
        isIslamic: Boolean(item.is_islamic),
        islamicHolidayId: item.islamic_holiday_id,
        arabicName: item.arabic_name,
        type: (item.type as 'normal' | 'obligatory' | 'recommended') || 'normal',
        isPaid: Boolean(item.is_paid),
        paidDate: item.paid_date || undefined,
        reminderDays: item.reminder_days || 7,
        accountId: item.account_id,
        autoDeduct: Boolean(item.auto_deduct),
        paymentMethod: item.payment_method,
        recurrence: item.recurrence as 'yearly' | 'monthly' | 'quarterly' | undefined
      }));
      
      return charges;
    } catch (error) {
      console.error('❌ [annualChargeService] Error in getAllAnnualCharges:', error);
      throw error;
    }
  },

  // ✅ METTRE À JOUR UNE CHARGE
  async updateAnnualCharge(id: string, updates: UpdateAnnualChargeData, userId: string = 'default-user'): Promise<void> {
    try {
      await this.ensureAnnualChargesTableExists();

      const db = await getDatabase();
      
      const fields = Object.keys(updates);
      if (fields.length === 0) return;

      const setClause = fields.map(field => {
        const dbFieldMap: { [key: string]: string } = {
          dueDate: 'due_date',
          isRecurring: 'is_recurring',
          isActive: 'is_active',
          isIslamic: 'is_islamic',
          islamicHolidayId: 'islamic_holiday_id',
          arabicName: 'arabic_name',
          isPaid: 'is_paid',
          paidDate: 'paid_date',
          reminderDays: 'reminder_days',
          accountId: 'account_id',
          autoDeduct: 'auto_deduct',
          paymentMethod: 'payment_method',
          recurrence: 'recurrence',
          notes: 'description'
        };
        
        const dbField = dbFieldMap[field] || field;
        return `${dbField} = ?`;
      }).join(', ');

      const values = fields.map(field => {
        const value = (updates as any)[field];
        
        // Conversion des booléens en integers pour SQLite
        if (field === 'isRecurring' || field === 'isActive' || field === 'isIslamic' || 
            field === 'isPaid' || field === 'autoDeduct') {
          return value ? 1 : 0;
        }
        
        return value;
      });
      
      values.push(id, userId);

      await db.runAsync(
        `UPDATE annual_charges SET ${setClause} WHERE id = ? AND user_id = ?`,
        values
      );
      
      console.log('✅ [annualChargeService] Annual charge updated successfully');
    } catch (error) {
      console.error('❌ [annualChargeService] Error in updateAnnualCharge:', error);
      throw error;
    }
  },

  // ✅ OBTENIR UNE CHARGE PAR ID
  async getAnnualChargeById(id: string, userId: string = 'default-user'): Promise<AnnualCharge | null> {
    try {
      await this.ensureAnnualChargesTableExists();

      const db = await getDatabase();
      
      const result = await db.getFirstAsync(
        `SELECT * FROM annual_charges WHERE id = ? AND user_id = ?`,
        [id, userId]
      ) as DatabaseAnnualCharge | null;
      
      if (result) {
        const charge: AnnualCharge = {
          id: result.id,
          userId: result.user_id,
          name: result.name,
          amount: result.amount,
          dueDate: result.due_date,
          category: result.category,
          notes: result.description || '',
          isActive: Boolean(result.is_active),
          createdAt: result.created_at,
          isIslamic: Boolean(result.is_islamic),
          islamicHolidayId: result.islamic_holiday_id,
          arabicName: result.arabic_name,
          type: (result.type as 'normal' | 'obligatory' | 'recommended') || 'normal',
          isPaid: Boolean(result.is_paid),
          paidDate: result.paid_date || undefined,
          reminderDays: result.reminder_days || 7,
          accountId: result.account_id,
          autoDeduct: Boolean(result.auto_deduct),
          paymentMethod: result.payment_method,
          recurrence: result.recurrence as 'yearly' | 'monthly' | 'quarterly' | undefined,
          isRecurring: Boolean(result.is_recurring)
        };
        return charge;
      }
      return null;
    } catch (error) {
      console.error('❌ [annualChargeService] Error in getAnnualChargeById:', error);
      throw error;
    }
  },

  // ✅ SUPPRIMER UNE CHARGE (avec logique intelligente)
  async deleteAnnualCharge(id: string, userId: string = 'default-user'): Promise<void> {
    try {
      await this.ensureAnnualChargesTableExists();

      const db = await getDatabase();
      
      console.log('🗑️ [SUPPRESSION] Étape 1/6: Récupération des infos de la charge...');
      
      // 1. Récupérer les infos de la charge avant suppression
      const charge = await this.getAnnualChargeById(id, userId);
      if (!charge) {
        throw new Error('Charge non trouvée');
      }

      console.log('📋 [SUPPRESSION] Charge trouvée:', {
        name: charge.name,
        amount: charge.amount,
        isPaid: charge.isPaid,
        accountId: charge.accountId,
        dueDate: charge.dueDate
      });

      console.log('📅 [SUPPRESSION] Étape 2/6: Vérification du mois...');
      
      // 2. Vérifier si c'est le mois courant
      const chargeDueDate = new Date(charge.dueDate);
      const today = new Date();
      const isCurrentMonth = 
        chargeDueDate.getMonth() === today.getMonth() && 
        chargeDueDate.getFullYear() === today.getFullYear();

      // 3. Si ce n'est PAS le mois courant, empêcher la suppression
      if (!isCurrentMonth) {
        const isPast = chargeDueDate < today;
        const monthYear = `${chargeDueDate.getMonth() + 1}/${chargeDueDate.getFullYear()}`;
        throw new Error(
          isPast 
            ? `❌ Cette charge appartient à un mois passé (${monthYear}) et ne peut plus être supprimée.`
            : `❌ Cette charge appartient à un mois futur (${monthYear}) et ne peut pas être supprimée maintenant.`
        );
      }

      console.log('✅ [SUPPRESSION] Mois courant validé');

      // 4. Si la charge était payée, rembourser le compte
      if (charge.isPaid && charge.accountId) {
        console.log('💰 [SUPPRESSION] Étape 3/6: Remboursement du compte...');
        console.log(`   → Charge payée détectée, remboursement de ${charge.amount} MAD`);
        
        // Récupérer le solde actuel du compte
        const accountResult = await db.getFirstAsync<{ balance: number }>(
          `SELECT balance FROM accounts WHERE id = ? AND user_id = ?`,
          [charge.accountId, userId]
        );

        if (accountResult) {
          const oldBalance = accountResult.balance;
          const newBalance = oldBalance + charge.amount;
          
          // Mettre à jour le solde du compte
          await db.runAsync(
            `UPDATE accounts SET balance = ? WHERE id = ? AND user_id = ?`,
            [newBalance, charge.accountId, userId]
          );
          
          console.log(`✅ [SUPPRESSION] Compte ${charge.accountId} remboursé:`);
          console.log(`   → Ancien solde: ${oldBalance} MAD`);
          console.log(`   → Nouveau solde: ${newBalance} MAD (+${charge.amount} MAD)`);
        } else {
          console.warn('⚠️ [SUPPRESSION] Compte non trouvé, remboursement ignoré');
        }

        console.log('🔍 [SUPPRESSION] Étape 4/6: Recherche de la transaction associée...');
        
        // 5. Supprimer la transaction associée si elle existe
        const transactionResult = await db.getFirstAsync<{ id: string }>(
          `SELECT id FROM transactions 
           WHERE description LIKE ? 
           AND amount = ? 
           AND account_id = ? 
           AND user_id = ?
           ORDER BY created_at DESC 
           LIMIT 1`,
          [`%${charge.name}%`, charge.amount, charge.accountId, userId]
        );

        if (transactionResult) {
          console.log(`   → Transaction trouvée: ${transactionResult.id}`);
          
          await db.runAsync(
            `DELETE FROM transactions WHERE id = ? AND user_id = ?`,
            [transactionResult.id, userId]
          );
          
          console.log(`✅ [SUPPRESSION] Transaction supprimée de la base de données`);
        } else {
          console.log('ℹ️ [SUPPRESSION] Aucune transaction associée trouvée');
        }
      } else {
        console.log('ℹ️ [SUPPRESSION] Étape 3-4/6: Charge non payée ou sans compte, aucun remboursement');
      }

      console.log('🗑️ [SUPPRESSION] Étape 5/6: Suppression de la charge annuelle...');
      
      // 6. Supprimer la charge annuelle
      await db.runAsync(
        `DELETE FROM annual_charges WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      
      console.log('✅ [SUPPRESSION] Étape 6/6: Charge annuelle supprimée avec succès!');
      console.log('📊 [SUPPRESSION] Résumé:');
      console.log(`   → Charge "${charge.name}" supprimée`);
      console.log(`   → Compte remboursé: ${charge.isPaid && charge.accountId ? 'Oui' : 'Non'}`);
      console.log(`   → Transaction supprimée: ${charge.isPaid && charge.accountId ? 'Oui' : 'Non'}`);
      console.log('🔄 [SUPPRESSION] Les modifications seront synchronisées sur toutes les pages');
      
    } catch (error) {
      console.error('❌ [annualChargeService] Erreur lors de la suppression:', error);
      throw error;
    }
  },

  // ✅ FILTRER LES CHARGES PAR STATUT
  async getChargesByStatus(status: 'all' | 'paid' | 'pending' | 'upcoming' | 'overdue', userId: string = 'default-user'): Promise<AnnualCharge[]> {
    try {
      const allCharges = await this.getAllAnnualCharges(userId);
      const today = new Date().toISOString().split('T')[0];

      switch (status) {
        case 'paid':
          return allCharges.filter(charge => charge.isPaid);
        case 'pending':
          return allCharges.filter(charge => !charge.isPaid);
        case 'upcoming':
          return allCharges.filter(charge => 
            !charge.isPaid && charge.dueDate >= today
          );
        case 'overdue':
          return allCharges.filter(charge => 
            !charge.isPaid && charge.dueDate < today
          );
        default:
          return allCharges;
      }
    } catch (error) {
      console.error('❌ [annualChargeService] Error getting charges by status:', error);
      throw error;
    }
  },

  // ✅ OBTENIR LES STATISTIQUES
  async getAnnualChargeStats(userId: string = 'default-user'): Promise<AnnualChargeStats> {
    try {
      const charges = await this.getAllAnnualCharges(userId);
      const today = new Date().toISOString().split('T')[0];

      const totalCharges = charges.length;
      const totalAmount = charges.reduce((sum, charge) => sum + charge.amount, 0);
      const paidAmount = charges
        .filter(charge => charge.isPaid)
        .reduce((sum, charge) => sum + charge.amount, 0);
      const pendingAmount = totalAmount - paidAmount;

      const upcomingCharges = charges
        .filter(charge => !charge.isPaid && charge.dueDate >= today)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);

      const overdueCharges = charges
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
      console.error('❌ [annualChargeService] Error getting charge stats:', error);
      throw error;
    }
  },

  // ✅ OBTENIR LES CHARGES RÉCURRENTES
  async getRecurringCharges(userId: string = 'default-user'): Promise<AnnualCharge[]> {
    try {
      const allCharges = await this.getAllAnnualCharges(userId);
      return allCharges.filter(charge => charge.isRecurring || charge.recurrence);
    } catch (error) {
      console.error('❌ [annualChargeService] Error getting recurring charges:', error);
      throw error;
    }
  },

  // ✅ OBTENIR LES CHARGES ISLAMIQUES
  async getIslamicAnnualCharges(userId: string = 'default-user'): Promise<AnnualCharge[]> {
    try {
      const allCharges = await this.getAllAnnualCharges(userId);
      return allCharges.filter(charge => charge.isIslamic);
    } catch (error) {
      console.error('❌ [annualChargeService] Error getting islamic charges:', error);
      throw error;
    }
  },

  // ✅ OBTENIR LES CHARGES ACTIVES
  async getActiveAnnualCharges(userId: string = 'default-user'): Promise<AnnualCharge[]> {
    try {
      const allCharges = await this.getAllAnnualCharges(userId);
      return allCharges.filter(charge => charge.isActive);
    } catch (error) {
      console.error('❌ [annualChargeService] Error getting active charges:', error);
      throw error;
    }
  },

  // ✅ OBTENIR LES CHARGES PAYÉES
  async getPaidAnnualCharges(userId: string = 'default-user'): Promise<AnnualCharge[]> {
    try {
      const allCharges = await this.getAllAnnualCharges(userId);
      return allCharges.filter(charge => charge.isPaid);
    } catch (error) {
      console.error('❌ [annualChargeService] Error getting paid charges:', error);
      throw error;
    }
  },

  // ✅ OBTENIR LES CHARGES NON PAYÉES
  async getUnpaidAnnualCharges(userId: string = 'default-user'): Promise<AnnualCharge[]> {
    try {
      const allCharges = await this.getAllAnnualCharges(userId);
      return allCharges.filter(charge => !charge.isPaid);
    } catch (error) {
      console.error('❌ [annualChargeService] Error getting unpaid charges:', error);
      throw error;
    }
  },

  // ✅ OBTENIR LES CHARGES À PRÉLÈVEMENT AUTOMATIQUE
  async getAutoDeductCharges(userId: string = 'default-user'): Promise<AnnualCharge[]> {
    try {
      const allCharges = await this.getAllAnnualCharges(userId);
      return allCharges.filter(charge => charge.autoDeduct && charge.accountId);
    } catch (error) {
      console.error('❌ [annualChargeService] Error getting auto-deduct charges:', error);
      throw error;
    }
  },

  // ✅ VÉRIFIER SI UNE CHARGE ISLAMIQUE EXISTE
  async checkIfIslamicChargeExists(holidayId: string, year: number, userId: string = 'default-user'): Promise<boolean> {
    try {
      await this.ensureAnnualChargesTableExists();

      const db = await getDatabase();
      
      const result = await db.getFirstAsync(
        `SELECT 1 FROM annual_charges 
         WHERE user_id = ? AND islamic_holiday_id = ? AND strftime('%Y', due_date) = ?`,
        [userId, holidayId, year.toString()]
      );
      
      return !!result;
    } catch (error) {
      console.error('❌ [annualChargeService] Error checking islamic charge:', error);
      return false;
    }
  },

  // ✅ GÉNÉRER LES CHARGES RÉCURRENTES POUR L'ANNÉE SUIVANTE
  async generateRecurringChargesForNextYear(userId: string = 'default-user'): Promise<{ generated: number; skipped: number }> {
    try {
      await this.ensureAnnualChargesTableExists();

      const db = await getDatabase();
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      
      // ✅ CORRECTION : Récupérer les charges récurrentes actives
      const recurringCharges = await db.getAllAsync(
        `SELECT * FROM annual_charges 
         WHERE user_id = ? 
         AND is_active = 1 
         AND (is_recurring = 1 OR recurrence IS NOT NULL)`,
        [userId]
      ) as DatabaseAnnualCharge[];

      console.log(`🔄 Génération des charges récurrentes pour ${nextYear}...`);
      console.log(`📋 ${recurringCharges.length} charges récurrentes trouvées`);

      let generated = 0;
      let skipped = 0;

      for (const charge of recurringCharges) {
        try {
          // ✅ CORRECTION : Calculer la nouvelle date d'échéance selon la récurrence
          let nextYearDueDate: Date;

          if (charge.recurrence === 'monthly') {
            // Récurrence mensuelle : ajouter 1 mois à la date originale
            const originalDate = new Date(charge.due_date);
            nextYearDueDate = new Date(originalDate);
            nextYearDueDate.setMonth(originalDate.getMonth() + 12); // 12 mois = 1 an en mensuel
          } else if (charge.recurrence === 'quarterly') {
            // Récurrence trimestrielle : ajouter 3 mois à la date originale
            const originalDate = new Date(charge.due_date);
            nextYearDueDate = new Date(originalDate);
            nextYearDueDate.setMonth(originalDate.getMonth() + 4); // 4 trimestres = 1 an
          } else {
            // Récurrence annuelle (défaut) : même jour/mois, année suivante
            const originalDate = new Date(charge.due_date);
            nextYearDueDate = new Date(nextYear, originalDate.getMonth(), originalDate.getDate());
          }

          // Vérifier si la charge existe déjà pour l'année prochaine
          const existingCharge = await db.getFirstAsync(
            `SELECT id FROM annual_charges 
             WHERE user_id = ? 
             AND name = ? 
             AND strftime('%Y', due_date) = ? 
             AND recurrence = ?`,
            [userId, charge.name, nextYear.toString(), charge.recurrence]
          );

          if (!existingCharge) {
            // Créer la nouvelle charge récurrente
            const newChargeId = generateId();
            const createdAt = new Date().toISOString();

            await db.runAsync(
              `INSERT INTO annual_charges (
                id, user_id, name, amount, due_date, category, description, 
                is_recurring, is_active, created_at, is_islamic, islamic_holiday_id, 
                arabic_name, type, is_paid, paid_date, reminder_days,
                account_id, auto_deduct, payment_method, recurrence
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                newChargeId,
                userId,
                charge.name,
                charge.amount,
                nextYearDueDate.toISOString().split('T')[0],
                charge.category,
                charge.description || '',
                1, // is_recurring
                1, // is_active
                createdAt,
                charge.is_islamic || 0,
                charge.islamic_holiday_id || null,
                charge.arabic_name || null,
                charge.type || 'normal',
                0, // is_paid (non payée)
                null, // paid_date
                charge.reminder_days || 7,
                charge.account_id || null,
                charge.auto_deduct || 0,
                charge.payment_method || null,
                charge.recurrence || null
              ]
            );

            generated++;
            console.log(`✅ Charge récurrente créée: ${charge.name} pour ${nextYear}`);
          } else {
            skipped++;
            console.log(`ℹ️ Charge récurrente déjà existante: ${charge.name} pour ${nextYear}`);
          }
        } catch (error) {
          console.error(`❌ Erreur génération charge ${charge.name}:`, error);
          skipped++;
        }
      }

      console.log(`✅ Génération récurrente terminée: ${generated} charges créées, ${skipped} ignorées`);
      return { generated, skipped };
    } catch (error) {
      console.error('❌ Error generating recurring charges:', error);
      throw error;
    }
  },

  // ✅ NETTOYER LES ANCIENNES CHARGES
  async cleanupOldCharges(userId: string = 'default-user'): Promise<number> {
    try {
      await this.ensureAnnualChargesTableExists();

      const db = await getDatabase();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const result = await db.runAsync(
        `DELETE FROM annual_charges 
         WHERE user_id = ? AND due_date < ? AND is_recurring = 0`,
        [userId, oneYearAgo.toISOString().split('T')[0]]
      );

      const deletedCount = result.changes || 0;
      console.log(`🗑️ Cleaned up ${deletedCount} old non-recurring charges`);
      
      return deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up old charges:', error);
      throw error;
    }
  },

  // ✅ RÉINITIALISER LES CHARGES POUR LA NOUVELLE ANNÉE
  async resetChargesForNewYear(userId: string = 'default-user'): Promise<void> {
    try {
      await this.ensureAnnualChargesTableExists();

      const db = await getDatabase();
      
      await db.runAsync(
        `UPDATE annual_charges SET is_paid = 0, paid_date = NULL WHERE user_id = ?`,
        [userId]
      );

      console.log('✅ Charges reset for new year - all marked as unpaid');
    } catch (error) {
      console.error('❌ Error resetting charges for new year:', error);
      throw error;
    }
  },

  // ✅ MARQUER COMME PAYÉ
  async markAsPaid(id: string, paidDate: string = new Date().toISOString(), userId: string = 'default-user'): Promise<void> {
    try {
      await this.togglePaidStatus(id, true, userId);
    } catch (error) {
      console.error('❌ Error marking charge as paid:', error);
      throw error;
    }
  },

  // ✅ MARQUER COMME NON PAYÉ
  async markAsUnpaid(id: string, userId: string = 'default-user'): Promise<void> {
    try {
      await this.togglePaidStatus(id, false, userId);
    } catch (error) {
      console.error('❌ Error marking charge as unpaid:', error);
      throw error;
    }
  }
};

export default annualChargeService;