// src/services/recurrenceService.ts - VERSION CORRIGÉE
import { AnnualCharge, CreateAnnualChargeData } from '../types/AnnualCharge';
import { annualChargeService } from './annualChargeService';

export const recurrenceService = {
  // ✅ GÉNÉRER LA PROCHAINE OCCURRENCE POUR UNE CHARGE RÉCURRENTE
  async generateNextOccurrence(charge: AnnualCharge, userId: string = 'default-user'): Promise<string | null> {
    try {
      if (!charge.recurrence || !charge.isRecurring) {
        console.log('ℹ️ Charge non récurrente, aucune occurrence à générer');
        return null;
      }

      const lastDueDate = new Date(charge.dueDate);
      let nextDueDate: Date;

      switch (charge.recurrence) {
        case 'yearly':
          nextDueDate = new Date(lastDueDate);
          nextDueDate.setFullYear(lastDueDate.getFullYear() + 1);
          break;
        
        case 'monthly':
          nextDueDate = new Date(lastDueDate);
          nextDueDate.setMonth(lastDueDate.getMonth() + 1);
          break;
        
        case 'quarterly':
          nextDueDate = new Date(lastDueDate);
          nextDueDate.setMonth(lastDueDate.getMonth() + 3);
          break;
        
        default:
          console.log('❌ Type de récurrence non supporté:', charge.recurrence);
          return null;
      }

      // Vérifier si la charge existe déjà pour la date calculée
      const existingCharge = await this.checkExistingRecurringCharge(
        charge.name,
        nextDueDate,
        userId
      );

      if (existingCharge) {
        console.log(`ℹ️ Charge récurrente déjà existante pour ${nextDueDate.toISOString().split('T')[0]}`);
        return existingCharge.id;
      }

      // Créer la nouvelle charge récurrente
      const newChargeData: CreateAnnualChargeData = {
        name: charge.name,
        amount: charge.amount,
        dueDate: nextDueDate.toISOString().split('T')[0],
        category: charge.category,
        reminderDays: charge.reminderDays || 7,
        accountId: charge.accountId,
        autoDeduct: charge.autoDeduct,
        notes: charge.notes || `Charge récurrente - ${charge.recurrence}`,
        paymentMethod: charge.paymentMethod,
        recurrence: charge.recurrence,
        isIslamic: charge.isIslamic,
        islamicHolidayId: charge.islamicHolidayId,
        arabicName: charge.arabicName,
        type: charge.type,
        isActive: true,
        isRecurring: true,
        isPaid: false
      };

      const newChargeId = await annualChargeService.createAnnualCharge(newChargeData, userId);
      console.log(`✅ Nouvelle occurrence créée: ${charge.name} - ${nextDueDate.toISOString().split('T')[0]}`);
      
      return newChargeId;

    } catch (error) {
      console.error('❌ Erreur génération occurrence récurrente:', error);
      return null;
    }
  },

  // ✅ VÉRIFIER SI UNE CHARGE RÉCURRENTE EXISTE DÉJÀ
  async checkExistingRecurringCharge(
    name: string, 
    dueDate: Date, 
    userId: string = 'default-user'
  ): Promise<AnnualCharge | null> {
    try {
      const allCharges = await annualChargeService.getAllAnnualCharges(userId);
      const dueDateStr = dueDate.toISOString().split('T')[0];
      
      return allCharges.find(charge => 
        charge.name === name && 
        charge.dueDate === dueDateStr &&
        charge.isRecurring
      ) || null;
    } catch (error) {
      console.error('❌ Erreur vérification charge récurrente:', error);
      return null;
    }
  },

  // ✅ TRAITER TOUTES LES CHARGES RÉCURRENTES PAYÉES
  async processRecurringCharges(userId: string = 'default-user'): Promise<{ processed: number; errors: string[] }> {
    try {
      console.log('🔄 Traitement des charges récurrentes...');
      
      const allCharges = await annualChargeService.getAllAnnualCharges(userId);
      
      // Filtrer les charges récurrentes payées et actives
      const paidRecurringCharges = allCharges.filter(charge => 
        charge.isRecurring && 
        charge.isPaid && 
        charge.isActive !== false
      );

      console.log(`📋 ${paidRecurringCharges.length} charges récurrentes payées à traiter`);

      const results = {
        processed: 0,
        errors: [] as string[]
      };

      for (const charge of paidRecurringCharges) {
        try {
          // Vérifier si la prochaine occurrence existe déjà
          const nextOccurrenceId = await this.generateNextOccurrence(charge, userId);
          
          if (nextOccurrenceId) {
            results.processed++;
            console.log(`✅ Occurrence générée pour: ${charge.name}`);
          }

        } catch (error) {
          const errorMessage = `Erreur avec la charge ${charge.name}: ${error}`;
          console.error('❌', errorMessage);
          results.errors.push(errorMessage);
        }
      }

      console.log(`✅ Traitement récurrent terminé: ${results.processed} occurrences générées, ${results.errors.length} erreurs`);
      return results;

    } catch (error) {
      console.error('❌ Erreur traitement charges récurrentes:', error);
      throw error;
    }
  },

  // ✅ CORRIGÉ : GÉNÉRER LES CHARGES RÉCURRENTES POUR L'ANNÉE SUIVANTE
  async generateRecurringChargesForNextYear(userId: string = 'default-user'): Promise<{ generated: number; skipped: number }> {
    try {
      console.log('🔄 Génération charges récurrentes pour l\'année prochaine...');
      
      const allCharges = await annualChargeService.getAllAnnualCharges(userId);
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;

      // Filtrer les charges récurrentes actives
      const recurringCharges = allCharges.filter(charge => 
        charge.isRecurring && 
        charge.isActive !== false &&
        charge.recurrence
      );

      console.log(`📋 ${recurringCharges.length} charges récurrentes à traiter`);

      let generated = 0;
      let skipped = 0;

      for (const charge of recurringCharges) {
        try {
          const currentDueDate = new Date(charge.dueDate);
          const nextYearDueDate = new Date(currentDueDate);
          nextYearDueDate.setFullYear(nextYear);

          // Vérifier si la charge existe déjà pour l'année prochaine
          const exists = await this.checkExistingRecurringCharge(
            charge.name,
            nextYearDueDate,
            userId
          );

          if (!exists) {
            const newChargeData: CreateAnnualChargeData = {
              name: charge.name,
              amount: charge.amount,
              dueDate: nextYearDueDate.toISOString().split('T')[0],
              category: charge.category,
              reminderDays: charge.reminderDays || 7,
              accountId: charge.accountId,
              autoDeduct: charge.autoDeduct,
              notes: charge.notes || `Charge récurrente - ${charge.recurrence}`,
              paymentMethod: charge.paymentMethod,
              recurrence: charge.recurrence,
              isIslamic: charge.isIslamic,
              islamicHolidayId: charge.islamicHolidayId,
              arabicName: charge.arabicName,
              type: charge.type,
              isActive: true,
              isRecurring: true,
              isPaid: false
            };

            await annualChargeService.createAnnualCharge(newChargeData, userId);
            generated++;
            console.log(`✅ Charge générée: ${charge.name} - ${nextYear}`);
          } else {
            skipped++;
            console.log(`ℹ️ Charge déjà existante: ${charge.name} - ${nextYear}`);
          }

        } catch (error) {
          console.error(`❌ Erreur génération charge ${charge.name}:`, error);
          skipped++;
        }
      }

      console.log(`✅ Génération terminée: ${generated} créées, ${skipped} ignorées`);
      return { generated, skipped };

    } catch (error) {
      console.error('❌ Erreur génération charges récurrentes:', error);
      throw error;
    }
  },

  // ✅ OBTENIR LES STATISTIQUES DES CHARGES RÉCURRENTES
  async getRecurringChargesStats(userId: string = 'default-user'): Promise<{
    totalRecurring: number;
    yearly: number;
    monthly: number;
    quarterly: number;
    active: number;
    inactive: number;
  }> {
    try {
      const allCharges = await annualChargeService.getAllAnnualCharges(userId);
      const recurringCharges = allCharges.filter(charge => charge.isRecurring);

      return {
        totalRecurring: recurringCharges.length,
        yearly: recurringCharges.filter(c => c.recurrence === 'yearly').length,
        monthly: recurringCharges.filter(c => c.recurrence === 'monthly').length,
        quarterly: recurringCharges.filter(c => c.recurrence === 'quarterly').length,
        active: recurringCharges.filter(c => c.isActive !== false).length,
        inactive: recurringCharges.filter(c => c.isActive === false).length,
      };
    } catch (error) {
      console.error('❌ Erreur statistiques charges récurrentes:', error);
      throw error;
    }
  },

  // ✅ DÉSACTIVER LA RÉCURRENCE D'UNE CHARGE
  async disableRecurrence(chargeId: string, userId: string = 'default-user'): Promise<void> {
    try {
      await annualChargeService.updateAnnualCharge(
        chargeId, 
        { isRecurring: false, recurrence: undefined }, 
        userId
      );
      console.log(`✅ Récurrence désactivée pour la charge: ${chargeId}`);
    } catch (error) {
      console.error('❌ Erreur désactivation récurrence:', error);
      throw error;
    }
  },

  // ✅ ACTIVER LA RÉCURRENCE D'UNE CHARGE
  async enableRecurrence(
    chargeId: string, 
    recurrence: 'yearly' | 'monthly' | 'quarterly', 
    userId: string = 'default-user'
  ): Promise<void> {
    try {
      await annualChargeService.updateAnnualCharge(
        chargeId, 
        { isRecurring: true, recurrence }, 
        userId
      );
      console.log(`✅ Récurrence activée (${recurrence}) pour la charge: ${chargeId}`);
    } catch (error) {
      console.error('❌ Erreur activation récurrence:', error);
      throw error;
    }
  }
};

export default recurrenceService;