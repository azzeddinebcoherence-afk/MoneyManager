// src/services/annualChargeService.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { AnnualCharge, CreateAnnualChargeData, UpdateAnnualChargeData } from '../types/AnnualCharge';
import { getDatabase } from './database/sqlite';

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
  // COLONNES POUR CHARGES ISLAMIQUES
  is_islamic?: number;
  islamic_holiday_id?: string;
  arabic_name?: string;
  type?: string;
  // COLONNES DE PAIEMENT
  is_paid?: number;
  paid_date?: string;
  reminder_days?: number;
}

export const annualChargeService = {
  // ✅ GARANTIR QUE LA TABLE A TOUTES LES COLONNES
  async ensureAnnualChargesTableExists(): Promise<void> {
    try {
      const db = await getDatabase();
      
      // Vérifier si la table existe
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
            -- COLONNES POUR CHARGES ISLAMIQUES
            is_islamic INTEGER NOT NULL DEFAULT 0,
            islamic_holiday_id TEXT,
            arabic_name TEXT,
            type TEXT DEFAULT 'normal',
            -- COLONNES DE PAIEMENT
            is_paid INTEGER NOT NULL DEFAULT 0,
            paid_date TEXT,
            reminder_days INTEGER DEFAULT 7
          );
        `);
        
        console.log('✅ [annualChargeService] annual_charges table created successfully');
      } else {
        console.log('🔍 [annualChargeService] Checking annual_charges table structure...');
        
        // Vérifier la structure de la table
        const tableInfo = await db.getAllAsync(`PRAGMA table_info(annual_charges)`) as any[];
        const existingColumns = tableInfo.map(col => col.name);
        
        console.log('📋 [annualChargeService] Existing columns:', existingColumns);
        
        // ✅ CORRECTION : AJOUTER TOUTES LES COLONNES MANQUANTES
        const requiredColumns = [
          { name: 'description', type: 'TEXT' },
          { name: 'is_recurring', type: 'INTEGER', defaultValue: '0' },
          { name: 'is_active', type: 'INTEGER', defaultValue: '1' },
          { name: 'is_islamic', type: 'INTEGER', defaultValue: '0' },
          { name: 'islamic_holiday_id', type: 'TEXT' },
          { name: 'arabic_name', type: 'TEXT' },
          { name: 'type', type: 'TEXT', defaultValue: "'normal'" },
          { name: 'is_paid', type: 'INTEGER', defaultValue: '0' },
          { name: 'paid_date', type: 'TEXT' },
          { name: 'reminder_days', type: 'INTEGER', defaultValue: '7' }
        ];
        
        for (const requiredColumn of requiredColumns) {
          if (!existingColumns.includes(requiredColumn.name)) {
            console.log(`🛠️ [annualChargeService] Adding ${requiredColumn.name} column to annual_charges...`);
            
            try {
              if (requiredColumn.defaultValue) {
                await db.execAsync(
                  `ALTER TABLE annual_charges ADD COLUMN ${requiredColumn.name} ${requiredColumn.type} DEFAULT ${requiredColumn.defaultValue}`
                );
              } else {
                await db.execAsync(
                  `ALTER TABLE annual_charges ADD COLUMN ${requiredColumn.name} ${requiredColumn.type}`
                );
              }
              console.log(`✅ [annualChargeService] ${requiredColumn.name} column added successfully`);
            } catch (alterError: any) {
              if (alterError.message?.includes('duplicate column name')) {
                console.log(`ℹ️ [annualChargeService] Column ${requiredColumn.name} already exists`);
              } else {
                console.warn(`⚠️ [annualChargeService] Could not add column ${requiredColumn.name}:`, alterError);
              }
            }
          } else {
            console.log(`✅ [annualChargeService] Column ${requiredColumn.name} already exists`);
          }
        }
        
        console.log('✅ [annualChargeService] annual_charges table structure verified and updated');
      }
    } catch (error) {
      console.error('❌ [annualChargeService] Error ensuring annual_charges table exists:', error);
      throw error;
    }
  },

  // ✅ CRÉER UNE CHARGE ANNUELLE - VERSION CORRIGÉE
  async createAnnualCharge(chargeData: CreateAnnualChargeData, userId: string = 'default-user'): Promise<string> {
    try {
      await this.ensureAnnualChargesTableExists();

      const db = await getDatabase();
      const id = `charge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();

      console.log('🔄 [annualChargeService] Creating annual charge:', { 
        id, 
        name: chargeData.name,
        amount: chargeData.amount,
        isRecurring: chargeData.isRecurring
      });

      // ✅ CORRECTION: Utiliser des paramètres préparés
      await db.runAsync(
        `INSERT INTO annual_charges (
          id, user_id, name, amount, due_date, category, description, 
          is_recurring, is_active, created_at, is_islamic, islamic_holiday_id, 
          arabic_name, type, is_paid, paid_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          chargeData.name,
          chargeData.amount,
          chargeData.dueDate.toISOString(),
          chargeData.category || 'other',
          chargeData.description || '',
          chargeData.isRecurring ? 1 : 0,
          chargeData.isActive !== false ? 1 : 0,
          createdAt,
          chargeData.isIslamic ? 1 : 0,
          chargeData.islamicHolidayId || null,
          chargeData.arabicName || null,
          chargeData.type || 'normal',
          chargeData.isPaid ? 1 : 0,
          chargeData.paidDate ? chargeData.paidDate.toISOString() : null
        ]
      );

      console.log('✅ [annualChargeService] Annual charge created successfully');
      return id;
    } catch (error) {
      console.error('❌ [annualChargeService] Error in createAnnualCharge:', error);
      throw error;
    }
  },

  // ✅ METTRE À JOUR UNE CHARGE ANNUELLE
  async updateAnnualCharge(id: string, updates: UpdateAnnualChargeData, userId: string = 'default-user'): Promise<void> {
    try {
      await this.ensureAnnualChargesTableExists();

      const db = await getDatabase();
      
      const fields = Object.keys(updates);
      if (fields.length === 0) return;

      const setClause = fields.map(field => {
        // Mapping des champs JavaScript vers base de données
        const dbFieldMap: { [key: string]: string } = {
          dueDate: 'due_date',
          isRecurring: 'is_recurring',
          isActive: 'is_active',
          isIslamic: 'is_islamic',
          islamicHolidayId: 'islamic_holiday_id',
          arabicName: 'arabic_name',
          isPaid: 'is_paid',
          paidDate: 'paid_date',
          reminderDays: 'reminder_days'
        };
        
        const dbField = dbFieldMap[field] || field;
        return `${dbField} = ?`;
      }).join(', ');

      const values = fields.map(field => {
        const value = (updates as any)[field];
        
        // Conversion des booléens en integers pour SQLite
        if (field === 'isRecurring' || field === 'isActive' || field === 'isIslamic' || field === 'isPaid') {
          return value ? 1 : 0;
        }
        
        // Conversion des dates en ISO string
        if ((field === 'dueDate' || field === 'paidDate') && value instanceof Date) {
          return value.toISOString();
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

  // ✅ OBTENIR TOUTES LES CHARGES ANNUELLES
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
        dueDate: new Date(item.due_date),
        category: item.category,
        description: item.description || '',
        isRecurring: Boolean(item.is_recurring),
        isActive: Boolean(item.is_active),
        createdAt: item.created_at,
        // CHAMPS ISLAMIQUES
        isIslamic: Boolean(item.is_islamic),
        islamicHolidayId: item.islamic_holiday_id || undefined,
        arabicName: item.arabic_name || undefined,
        type: (item.type as 'normal' | 'obligatory' | 'recommended') || 'normal',
        // CHAMPS DE PAIEMENT
        isPaid: Boolean(item.is_paid),
        paidDate: item.paid_date ? new Date(item.paid_date) : undefined,
        reminderDays: item.reminder_days || 7
      }));
      
      return charges;
    } catch (error) {
      console.error('❌ [annualChargeService] Error in getAllAnnualCharges:', error);
      throw error;
    }
  },

  // ✅ OBTENIR LES CHARGES PAR CATÉGORIE
  async getAnnualChargesByCategory(category: string, userId: string = 'default-user'): Promise<AnnualCharge[]> {
    try {
      const allCharges = await this.getAllAnnualCharges(userId);
      return allCharges.filter(charge => charge.category === category);
    } catch (error) {
      console.error('❌ [annualChargeService] Error getting charges by category:', error);
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

  // ✅ SUPPRIMER UNE CHARGE ANNUELLE
  async deleteAnnualCharge(id: string, userId: string = 'default-user'): Promise<void> {
    try {
      await this.ensureAnnualChargesTableExists();

      const db = await getDatabase();
      
      await db.runAsync(
        `DELETE FROM annual_charges WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      
      console.log('✅ [annualChargeService] Annual charge deleted successfully');
    } catch (error) {
      console.error('❌ [annualChargeService] Error in deleteAnnualCharge:', error);
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
          dueDate: new Date(result.due_date),
          category: result.category,
          description: result.description || '',
          isRecurring: Boolean(result.is_recurring),
          isActive: Boolean(result.is_active),
          createdAt: result.created_at,
          // CHAMPS ISLAMIQUES
          isIslamic: Boolean(result.is_islamic),
          islamicHolidayId: result.islamic_holiday_id || undefined,
          arabicName: result.arabic_name || undefined,
          type: (result.type as 'normal' | 'obligatory' | 'recommended') || 'normal',
          // CHAMPS DE PAIEMENT
          isPaid: Boolean(result.is_paid),
          paidDate: result.paid_date ? new Date(result.paid_date) : undefined
        };
        return charge;
      }
      return null;
    } catch (error) {
      console.error('❌ [annualChargeService] Error in getAnnualChargeById:', error);
      throw error;
    }
  },

  // ✅ BASculer LE STATUT DE PAIEMENT
  async togglePaidStatus(id: string, isPaid: boolean, userId: string = 'default-user'): Promise<void> {
    try {
      await this.ensureAnnualChargesTableExists();
      
      const db = await getDatabase();
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

  // ✅ MARQUER COMME PAYÉ
  async markAsPaid(id: string, paidDate: Date = new Date(), userId: string = 'default-user'): Promise<void> {
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
  },

  // ✅ STATISTIQUES DES CHARGES
  async getAnnualChargesStats(userId: string = 'default-user'): Promise<{
    totalCharges: number;
    totalAmount: number;
    activeCharges: number;
    islamicCharges: number;
    paidCharges: number;
    unpaidCharges: number;
    paidAmount: number;
    unpaidAmount: number;
    chargesByCategory: Record<string, number>;
  }> {
    try {
      await this.ensureAnnualChargesTableExists();

      const charges = await this.getAllAnnualCharges(userId);
      const activeCharges = charges.filter(charge => charge.isActive);
      const islamicCharges = charges.filter(charge => charge.isIslamic);
      const paidCharges = charges.filter(charge => charge.isPaid);
      const unpaidCharges = charges.filter(charge => !charge.isPaid);
      
      const chargesByCategory: Record<string, number> = {};
      charges.forEach(charge => {
        chargesByCategory[charge.category] = (chargesByCategory[charge.category] || 0) + 1;
      });

      const paidAmount = paidCharges.reduce((sum, charge) => sum + charge.amount, 0);
      const unpaidAmount = unpaidCharges.reduce((sum, charge) => sum + charge.amount, 0);

      return {
        totalCharges: charges.length,
        totalAmount: charges.reduce((sum, charge) => sum + charge.amount, 0),
        activeCharges: activeCharges.length,
        islamicCharges: islamicCharges.length,
        paidCharges: paidCharges.length,
        unpaidCharges: unpaidCharges.length,
        paidAmount,
        unpaidAmount,
        chargesByCategory
      };
    } catch (error) {
      console.error('❌ [annualChargeService] Error getting charges stats:', error);
      throw error;
    }
  },

  // ✅ RECHERCHE DE CHARGES
  async searchAnnualCharges(query: string, userId: string = 'default-user'): Promise<AnnualCharge[]> {
    try {
      await this.ensureAnnualChargesTableExists();

      const db = await getDatabase();
      
      const result = await db.getAllAsync(
        `SELECT * FROM annual_charges 
         WHERE user_id = ? AND (name LIKE ? OR category LIKE ? OR description LIKE ?)
         ORDER BY due_date ASC`,
        [userId, `%${query}%`, `%${query}%`, `%${query}%`]
      ) as DatabaseAnnualCharge[];
      
      const charges: AnnualCharge[] = result.map((item) => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        amount: item.amount,
        dueDate: new Date(item.due_date),
        category: item.category,
        description: item.description || '',
        isRecurring: Boolean(item.is_recurring),
        isActive: Boolean(item.is_active),
        createdAt: item.created_at,
        // CHAMPS ISLAMIQUES
        isIslamic: Boolean(item.is_islamic),
        islamicHolidayId: item.islamic_holiday_id || undefined,
        arabicName: item.arabic_name || undefined,
        type: (item.type as 'normal' | 'obligatory' | 'recommended') || 'normal',
        // CHAMPS DE PAIEMENT
        isPaid: Boolean(item.is_paid),
        paidDate: item.paid_date ? new Date(item.paid_date) : undefined
      }));
      
      return charges;
    } catch (error) {
      console.error('❌ [annualChargeService] Error searching annual charges:', error);
      throw error;
    }
  },

  // ✅ GÉNÉRER LES CHARGES RÉCURRENTES POUR L'ANNÉE SUIVANTE
  async generateRecurringChargesForNextYear(userId: string = 'default-user'): Promise<void> {
    try {
      await this.ensureAnnualChargesTableExists();

      const db = await getDatabase();
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      
      const recurringCharges = await this.getAllAnnualCharges(userId);
      const chargesToCopy = recurringCharges.filter(charge => 
        charge.isRecurring && charge.isActive
      );

      console.log(`🔄 Generating ${chargesToCopy.length} recurring charges for ${nextYear}...`);

      for (const charge of chargesToCopy) {
        const nextYearDueDate = new Date(charge.dueDate);
        nextYearDueDate.setFullYear(nextYear);

        // Vérifier si la charge existe déjà pour l'année prochaine
        const existingCharge = await db.getFirstAsync(
          `SELECT id FROM annual_charges 
           WHERE user_id = ? AND name = ? AND strftime('%Y', due_date) = ?`,
          [userId, charge.name, nextYear.toString()]
        );

        if (!existingCharge) {
          await this.createAnnualCharge({
            name: charge.name,
            amount: charge.amount,
            dueDate: nextYearDueDate,
            category: charge.category,
            description: charge.description,
            isRecurring: true,
            isActive: true,
            isIslamic: charge.isIslamic,
            islamicHolidayId: charge.islamicHolidayId,
            arabicName: charge.arabicName,
            type: charge.type,
            isPaid: false
          }, userId);
        }
      }

      console.log(`✅ Recurring charges generated for ${nextYear}`);
    } catch (error) {
      console.error('❌ Error generating recurring charges:', error);
      throw error;
    }
  },

  // ✅ VÉRIFIER SI UNE CHARGE ISLAMIQUE EXISTE DÉJÀ
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

  // ✅ NETTOYER LES CHARGES ANCIENNES (plus d'1 an)
  async cleanupOldCharges(userId: string = 'default-user'): Promise<number> {
    try {
      await this.ensureAnnualChargesTableExists();

      const db = await getDatabase();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const result = await db.runAsync(
        `DELETE FROM annual_charges 
         WHERE user_id = ? AND due_date < ? AND is_recurring = 0`,
        [userId, oneYearAgo.toISOString()]
      );

      const deletedCount = result.changes || 0;
      console.log(`🗑️ Cleaned up ${deletedCount} old non-recurring charges`);
      
      return deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up old charges:', error);
      throw error;
    }
  },

  // ✅ RÉINITIALISER LES CHARGES POUR UNE NOUVELLE ANNÉE
  async resetChargesForNewYear(userId: string = 'default-user'): Promise<void> {
    try {
      await this.ensureAnnualChargesTableExists();

      const db = await getDatabase();
      
      // Marquer toutes les charges comme non payées pour la nouvelle année
      await db.runAsync(
        `UPDATE annual_charges SET is_paid = 0, paid_date = NULL WHERE user_id = ?`,
        [userId]
      );

      console.log('✅ Charges reset for new year - all marked as unpaid');
    } catch (error) {
      console.error('❌ Error resetting charges for new year:', error);
      throw error;
    }
  }
};

export default annualChargeService;