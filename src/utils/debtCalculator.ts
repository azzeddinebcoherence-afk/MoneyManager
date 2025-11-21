// src/utils/debtCalculator.ts - VERSION COMPLÈTE POUR SYSTÈME D'ÉCHÉANCES
import { Debt, PaymentEligibility } from '../types/Debt';

export interface AmortizationSchedule {
  paymentNumber: number;
  paymentDate: string;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export class DebtCalculator {
  /**
   * ✅ CALCUL D'ÉLIGIBILITÉ AVEC RÈGLES STRICTES D'ÉCHÉANCE
   */
  static calculatePaymentEligibility(debt: Debt): PaymentEligibility {
    const now = new Date();
    const dueDate = new Date(debt.dueDate);
    const currentMonth = now.toISOString().slice(0, 7); // "YYYY-MM"
    
    // Vérifications de base
    if (debt.currentAmount <= 0 || debt.status === 'paid') {
      return { 
        isEligible: false, 
        reason: 'Cette dette est déjà réglée',
        dueMonth: debt.dueMonth,
        isCurrentMonth: false,
        isPastDue: false,
        isFutureDue: false
      };
    }

    // RÈGLE PRINCIPALE : Paiement uniquement pendant le mois d'échéance
    const isCurrentMonth = debt.dueMonth === currentMonth;
    const isPastDue = dueDate < now && !isCurrentMonth;
    const isFutureDue = dueDate > now && !isCurrentMonth;

    // DETTE DU MOIS EN COURS : Sera traitée normalement
    if (isCurrentMonth) {
      return { 
        isEligible: true,
        reason: 'Paiement autorisé pendant le mois d\'échéance',
        dueMonth: debt.dueMonth,
        isCurrentMonth: true,
        isPastDue: false,
        isFutureDue: false
      };
    }

    // DETTE ANCIENNE : Ne sera PAS traitée avant son mois d'échéance
    if (isPastDue) {
      return { 
        isEligible: false, 
        reason: 'Période de paiement expirée. Cette dette est en retard et nécessite une régularisation manuelle.',
        dueMonth: debt.dueMonth,
        isCurrentMonth: false,
        isPastDue: true,
        isFutureDue: false
      };
    }

    // DETTE FUTURE : Attend son mois d'échéance
    if (isFutureDue) {
      const nextEligibleDate = new Date(debt.dueMonth + '-01');
      return { 
        isEligible: false, 
        reason: 'Paiement disponible seulement pendant le mois d\'échéance',
        nextEligibleDate: nextEligibleDate.toISOString().split('T')[0],
        dueMonth: debt.dueMonth,
        isCurrentMonth: false,
        isPastDue: false,
        isFutureDue: true
      };
    }

    return { 
      isEligible: false, 
      reason: 'Paiement non autorisé pour cette période',
      dueMonth: debt.dueMonth,
      isCurrentMonth: false,
      isPastDue: false,
      isFutureDue: false
    };
  }

  /**
   * ✅ VÉRIFIE SI UNE DETTE EST À ÉCHÉANCE CE MOIS-CI
   */
  static isDueThisMonth(debt: Debt): boolean {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    return debt.dueMonth === currentMonth && debt.currentAmount > 0;
  }

  /**
   * ✅ VÉRIFIE SI UNE DETTE EST EN RETARD
   */
  static isDebtOverdue(debt: Debt): boolean {
    const now = new Date();
    const dueDate = new Date(debt.dueDate);
    const currentMonth = now.toISOString().slice(0, 7);
    
    return dueDate < now && 
           debt.dueMonth !== currentMonth && 
           debt.currentAmount > 0 &&
           debt.status !== 'paid';
  }

  /**
   * ✅ CALCULE LE TABLEAU D'AMORTISSEMENT
   */
  static calculateAmortizationSchedule(debt: Debt): AmortizationSchedule[] {
    const schedule: AmortizationSchedule[] = [];
    let remainingBalance = debt.currentAmount;
    const monthlyInterestRate = debt.interestRate / 100 / 12;
    let paymentNumber = 1;
    let currentDate = new Date();

    while (remainingBalance > 0 && paymentNumber <= 360) {
      const interest = remainingBalance * monthlyInterestRate;
      const principal = Math.min(debt.monthlyPayment - interest, remainingBalance);
      const payment = principal + interest;

      remainingBalance -= principal;

      // Calcul de la date de paiement
      const paymentDate = new Date(currentDate);
      paymentDate.setMonth(paymentDate.getMonth() + paymentNumber - 1);

      schedule.push({
        paymentNumber,
        paymentDate: paymentDate.toISOString().split('T')[0],
        payment,
        principal,
        interest,
        remainingBalance: Math.max(0, remainingBalance)
      });

      paymentNumber++;
    }

    return schedule;
  }

  /**
   * ✅ CALCULE LA DATE DE LIBÉRATION DE LA DETTE
   */
  static calculateDebtFreeDate(debt: Debt): string {
    const schedule = this.calculateAmortizationSchedule(debt);
    const lastPayment = schedule[schedule.length - 1];
    return lastPayment ? lastPayment.paymentDate : new Date().toISOString().split('T')[0];
  }

  /**
   * ✅ CALCULE LE TOTAL DES INTÉRÊTS PAYÉS
   */
  static calculateTotalInterest(debt: Debt): number {
    const schedule = this.calculateAmortizationSchedule(debt);
    return schedule.reduce((total, payment) => total + payment.interest, 0);
  }

  /**
   * ✅ MET À JOUR LE STATUT D'UNE DETTE BASÉ SUR LA DATE ACTUELLE
   */
  static updateDebtStatus(debt: Debt): Debt['status'] {
    const now = new Date();
    const dueDate = new Date(debt.dueDate);
    const currentMonth = now.toISOString().slice(0, 7);

    if (debt.currentAmount <= 0) {
      return 'paid';
    }

    if (debt.status === 'future' && debt.dueMonth === currentMonth) {
      return 'active';
    }

    if (debt.status === 'active' && dueDate < now && debt.dueMonth !== currentMonth) {
      return 'overdue';
    }

    if (debt.status === 'overdue' && debt.dueMonth === currentMonth) {
      return 'active';
    }

    return debt.status;
  }

  /**
   * ✅ CALCULE LE PAIEMENT MENSUEL MINIMUM
   */
  static calculateMinimumPayment(
    principal: number, 
    annualInterestRate: number, 
    months: number
  ): number {
    const monthlyRate = annualInterestRate / 100 / 12;
    if (monthlyRate === 0) {
      return principal / months;
    }
    
    return principal * monthlyRate * Math.pow(1 + monthlyRate, months) / 
           (Math.pow(1 + monthlyRate, months) - 1);
  }

  /**
   * ✅ CALCULE LE TEMPS NÉCESSAIRE POUR REMBOURSER
   */
  static calculateTimeToPayoff(
    principal: number, 
    annualInterestRate: number, 
    monthlyPayment: number
  ): number {
    const monthlyRate = annualInterestRate / 100 / 12;
    if (monthlyPayment <= principal * monthlyRate) {
      return Infinity; // Le paiement ne couvre même pas les intérêts
    }

    return Math.ceil(
      -Math.log(1 - (principal * monthlyRate) / monthlyPayment) / 
      Math.log(1 + monthlyRate)
    );
  }

  /**
   * ✅ GÉNÈRE LE MOIS D'ÉCHÉANCE AU FORMAT "YYYY-MM"
   */
  static generateDueMonth(dueDate: string): string {
    return new Date(dueDate).toISOString().slice(0, 7);
  }

  /**
   * ✅ VÉRIFIE SI UN PAIEMENT EST AUTORISÉ POUR UNE DATE DONNÉE
   */
  static isPaymentAllowed(debt: Debt, paymentDate: string = new Date().toISOString()): boolean {
    const paymentMonth = new Date(paymentDate).toISOString().slice(0, 7);
    return debt.dueMonth === paymentMonth && debt.currentAmount > 0;
  }
}

export default DebtCalculator;

// Named exports for compatibility with existing imports
export const calculateAmortizationSchedule = DebtCalculator.calculateAmortizationSchedule.bind(DebtCalculator);
export const calculateDebtFreeDate = DebtCalculator.calculateDebtFreeDate.bind(DebtCalculator);