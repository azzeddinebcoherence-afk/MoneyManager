// src/services/islamicChargeService.ts - NOUVEAU SERVICE
import { CreateAnnualChargeData } from '../types/AnnualCharge';
import { IslamicSettings } from '../types/IslamicCharge';
import { annualChargeService } from './annualChargeService';
import { IslamicCalendarService } from './islamicCalendarService';

export const islamicChargeService = {
  // ✅ GÉNÉRER LES CHARGES ISLAMIQUES POUR UNE ANNÉE
  async generateChargesForYear(year: number, settings: IslamicSettings, userId: string = 'default-user'): Promise<{ created: number; skipped: number }> {
    try {
      if (!settings.isEnabled) {
        console.log('⏸️ Génération ignorée - fonctionnalité désactivée');
        return { created: 0, skipped: 0 };
      }

      console.log(`🔄 Génération charges islamiques pour ${year}...`);

      const islamicCharges = IslamicCalendarService.getChargesForYear(year);
      
      // Filtrer selon les paramètres
      const filteredCharges = islamicCharges.filter(charge => {
        if (charge.type === 'recommended' && !settings.includeRecommended) {
          return false;
        }
        return true;
      });

      let created = 0;
      let skipped = 0;

      for (const islamicCharge of filteredCharges) {
        try {
          // Vérifier si la charge existe déjà
          const exists = await annualChargeService.checkIfIslamicChargeExists(
            islamicCharge.id,
            year,
            userId
          );

          if (!exists) {
            const chargeData: CreateAnnualChargeData = {
              name: islamicCharge.name,
              amount: islamicCharge.amount,
              dueDate: islamicCharge.calculatedDate.toISOString().split('T')[0],
              category: 'islamic',
              isIslamic: true,
              islamicHolidayId: islamicCharge.id,
              arabicName: islamicCharge.arabicName,
              type: islamicCharge.type === 'obligatory' ? 'obligatory' : 
                    islamicCharge.type === 'recommended' ? 'recommended' : 'normal',
              notes: islamicCharge.description,
              isActive: true,
              isRecurring: islamicCharge.isRecurring,
              isPaid: false,
              reminderDays: 7
            };

            await annualChargeService.createAnnualCharge(chargeData, userId);
            created++;
            console.log(`✅ Charge créée: ${islamicCharge.name}`);
          } else {
            skipped++;
            console.log(`ℹ️ Charge déjà existante: ${islamicCharge.name}`);
          }
        } catch (error) {
          console.error(`❌ Erreur création charge ${islamicCharge.name}:`, error);
        }
      }

      console.log(`✅ ${created} charges islamiques créées, ${skipped} ignorées pour ${year}`);
      return { created, skipped };

    } catch (error) {
      console.error('❌ Erreur génération charges islamiques:', error);
      throw error;
    }
  },

  // ✅ SUPPRIMER LES CHARGES ISLAMIQUES D'UNE ANNÉE
  async deleteIslamicChargesForYear(year: number, userId: string = 'default-user'): Promise<number> {
    try {
      console.log(`🗑️ Suppression charges islamiques pour ${year}...`);

      const islamicCharges = await annualChargeService.getIslamicAnnualCharges(userId);
      const yearCharges = islamicCharges.filter(charge => {
        const chargeYear = new Date(charge.dueDate).getFullYear();
        return chargeYear === year;
      });

      let deleted = 0;
      for (const charge of yearCharges) {
        try {
          await annualChargeService.deleteAnnualCharge(charge.id, userId);
          deleted++;
        } catch (error) {
          console.error(`❌ Erreur suppression charge ${charge.name}:`, error);
        }
      }

      console.log(`✅ ${deleted} charges islamiques supprimées pour ${year}`);
      return deleted;

    } catch (error) {
      console.error('❌ Erreur suppression charges islamiques:', error);
      throw error;
    }
  },

  async deleteAllIslamicCharges(userId: string = 'default-user'): Promise<number> {
    try {
      console.log('🗑️ Suppression de toutes les charges islamiques...');

      const islamicCharges = await annualChargeService.getIslamicAnnualCharges(userId);
      
      let deleted = 0;
      for (const charge of islamicCharges) {
        try {
          await annualChargeService.deleteAnnualCharge(charge.id, userId);
          deleted++;
        } catch (error) {
          console.error(`❌ Erreur suppression charge ${charge.name}:`, error);
        }
      }

      console.log(`✅ ${deleted} charges islamiques supprimées définitivement`);
      return deleted;

    } catch (error) {
      console.error('❌ Erreur suppression charges islamiques:', error);
      throw error;
    }
  },

  // ✅ METTRE À JOUR LES MONTANTS PAR DÉFAUT
  async updateDefaultAmounts(settings: IslamicSettings, userId: string = 'default-user'): Promise<void> {
    try {
      console.log('💰 Mise à jour montants par défaut...');

      const islamicCharges = await annualChargeService.getIslamicAnnualCharges(userId);
      const unpaidCharges = islamicCharges.filter(charge => !charge.isPaid);

      for (const charge of unpaidCharges) {
        try {
          let newAmount = charge.amount;

          if (charge.type === 'obligatory') {
            newAmount = settings.defaultAmounts.obligatory;
          } else if (charge.type === 'recommended') {
            newAmount = settings.defaultAmounts.recommended;
          }

          if (newAmount !== charge.amount) {
            await annualChargeService.updateAnnualCharge(
              charge.id, 
              { amount: newAmount }, 
              userId
            );
            console.log(`💰 ${charge.name}: ${charge.amount} → ${newAmount}`);
          }
        } catch (error) {
          console.error(`❌ Erreur mise à jour ${charge.name}:`, error);
        }
      }

      console.log('✅ Montants par défaut mis à jour');
    } catch (error) {
      console.error('❌ Erreur mise à jour montants:', error);
      throw error;
    }
  },

  // ✅ OBTENIR LES STATISTIQUES DES CHARGES ISLAMIQUES
  async getIslamicChargesStats(userId: string = 'default-user'): Promise<{
    total: number;
    obligatory: number;
    recommended: number;
    paid: number;
    unpaid: number;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
  }> {
    try {
      const islamicCharges = await annualChargeService.getIslamicAnnualCharges(userId);
      
      const obligatoryCharges = islamicCharges.filter(c => c.type === 'obligatory');
      const recommendedCharges = islamicCharges.filter(c => c.type === 'recommended');
      const paidCharges = islamicCharges.filter(c => c.isPaid);
      const unpaidCharges = islamicCharges.filter(c => !c.isPaid);

      return {
        total: islamicCharges.length,
        obligatory: obligatoryCharges.length,
        recommended: recommendedCharges.length,
        paid: paidCharges.length,
        unpaid: unpaidCharges.length,
        totalAmount: islamicCharges.reduce((sum, charge) => sum + charge.amount, 0),
        paidAmount: paidCharges.reduce((sum, charge) => sum + charge.amount, 0),
        unpaidAmount: unpaidCharges.reduce((sum, charge) => sum + charge.amount, 0),
      };
    } catch (error) {
      console.error('❌ Erreur statistiques charges islamiques:', error);
      throw error;
    }
  },

  // ✅ VÉRIFIER SI LA GÉNÉRATION EST NÉCESSAIRE
  async needsGeneration(year: number, userId: string = 'default-user'): Promise<boolean> {
    try {
      const islamicCharges = await annualChargeService.getIslamicAnnualCharges(userId);
      const yearCharges = islamicCharges.filter(charge => {
        const chargeYear = new Date(charge.dueDate).getFullYear();
        return chargeYear === year;
      });

      const expectedCharges = IslamicCalendarService.getChargesForYear(year);
      return yearCharges.length < expectedCharges.length;
    } catch (error) {
      console.error('❌ Erreur vérification génération:', error);
      return true;
    }
  },

  // ✅ TRAITER AUTOMATIQUEMENT LES CHARGES ISLAMIQUES DUES
  async processDueIslamicCharges(userId: string = 'default-user'): Promise<{ processed: number; errors: string[] }> {
    try {
      console.log('🕌 [ISLAMIC] Traitement des charges islamiques dues...');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Récupérer toutes les charges islamiques non payées
      const islamicCharges = await annualChargeService.getIslamicAnnualCharges(userId);
      const unpaidCharges = islamicCharges.filter(charge => !charge.isPaid);

      // Filtrer les charges dont la date est arrivée (aujourd'hui ou passée)
      const dueCharges = unpaidCharges.filter(charge => {
        const dueDate = new Date(charge.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate <= today;
      });

      console.log(`📊 [ISLAMIC] ${dueCharges.length} charge(s) islamique(s) due(s) trouvée(s)`);

      const results = {
        processed: 0,
        errors: [] as string[]
      };

      for (const charge of dueCharges) {
        try {
          // Si la charge a un compte et le prélèvement automatique activé
          if (charge.autoDeduct && charge.accountId) {
            console.log(`💰 [ISLAMIC] Traitement auto: ${charge.name} (${charge.amount} MAD)`);
            
            // Utiliser la méthode payCharge qui gère le prélèvement
            await annualChargeService.payCharge(charge.id, charge.accountId, userId);
            results.processed++;
            
            console.log(`✅ [ISLAMIC] Charge traitée: ${charge.name}`);
          } else {
            console.log(`ℹ️ [ISLAMIC] Charge ignorée (pas de prélèvement auto): ${charge.name}`);
          }
        } catch (error: any) {
          const errorMessage = `${charge.name}: ${error?.message || 'Erreur inconnue'}`;
          console.error(`❌ [ISLAMIC] Erreur traitement ${charge.name}:`, error);
          results.errors.push(errorMessage);
        }
      }

      console.log(`✅ [ISLAMIC] Traitement terminé: ${results.processed} charge(s) traitée(s), ${results.errors.length} erreur(s)`);
      
      if (results.errors.length > 0) {
        console.warn('⚠️ [ISLAMIC] Erreurs rencontrées:', results.errors);
      }

      return results;
    } catch (error) {
      console.error('❌ [ISLAMIC] Erreur traitement charges islamiques:', error);
      throw error;
    }
  }
};

export default islamicChargeService;