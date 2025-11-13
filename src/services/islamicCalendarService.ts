// src/services/islamicCalendarService.ts - VERSION CORRIGÉE ET COMPLÉTÉE
import { IslamicCharge, IslamicHoliday } from '../types/IslamicCharge';

class IslamicCalendarService {
  private static holidays: IslamicHoliday[] = [
    {
      id: 'ramadan_start',
      name: 'Début du Ramadan',
      arabicName: 'بداية رمضان',
      description: 'Premier jour du mois de Ramadan',
      hijriMonth: 9,
      hijriDay: 1,
      type: 'obligatory',
      defaultAmount: 0,
      isRecurring: true,
    },
    {
      id: 'eid_al_fitr',
      name: 'Aïd al-Fitr',
      arabicName: 'عيد الفطر',
      description: 'Fête de la rupture du jeûne',
      hijriMonth: 10,
      hijriDay: 1,
      type: 'obligatory',
      defaultAmount: 100,
      isRecurring: true,
    },
    {
      id: 'eid_al_adha',
      name: 'Aïd al-Adha',
      arabicName: 'عيد الأضحى',
      description: 'Fête du sacrifice',
      hijriMonth: 12,
      hijriDay: 10,
      type: 'obligatory',
      defaultAmount: 300,
      isRecurring: true,
    },
    {
      id: 'ashura',
      name: 'Achoura',
      arabicName: 'عاشوراء',
      description: 'Jour de jeûne recommandé',
      hijriMonth: 1,
      hijriDay: 10,
      type: 'recommended',
      defaultAmount: 50,
      isRecurring: true,
    },
    {
      id: 'mawlid',
      name: 'Mawlid an-Nabaoui',
      arabicName: 'المولد النبوي',
      description: 'Anniversaire du Prophète',
      hijriMonth: 3,
      hijriDay: 12,
      type: 'recommended',
      defaultAmount: 50,
      isRecurring: true,
    },
  ];

  /**
   * Convertit une date hégirienne en date grégorienne (approximation)
   */
  static hijriToGregorian(hijriYear: number, hijriMonth: number, hijriDay: number): Date {
    // Approximation basée sur l'algorithme Umm al-Qura
    const hijriEpoch = 227015; // Jours depuis l'époque julienne
    const cycleYears = 30;
    const cycleMonths = cycleYears * 12;
    const cycleDays = 10631; // Jours dans 30 ans hégiriens
    
    const totalMonths = (hijriYear - 1) * 12 + (hijriMonth - 1);
    const fullCycles = Math.floor(totalMonths / cycleMonths);
    const remainingMonths = totalMonths % cycleMonths;
    
    let totalDays = fullCycles * cycleDays + hijriEpoch + hijriDay - 1;
    
    // Ajouter les jours pour les mois restants
    for (let i = 0; i < remainingMonths; i++) {
      const monthInCycle = i % 12;
      totalDays += this.getHijriMonthDays(monthInCycle + 1);
    }
    
    // Convertir en date grégorienne (approximation)
    const julianDay = totalDays + 2440587.5; // Convertir en jour julien
    const gregorianDate = new Date((julianDay - 2440587.5) * 86400000);
    
    return gregorianDate;
  }

  /**
   * Retourne le nombre de jours dans un mois hégirien
   */
  private static getHijriMonthDays(month: number): number {
    // Les mois hégiriens alternent entre 29 et 30 jours
    return month % 2 === 0 ? 29 : 30;
  }

  /**
   * Obtient l'année hégirienne actuelle
   */
  static getCurrentHijriYear(): number {
    const currentYear = new Date().getFullYear();
    // Approximation : 2024 ≈ 1445 AH
    return 1445 + (currentYear - 2024);
  }

  /**
   * Génère les charges islamiques pour une année donnée
   */
  static getChargesForYear(year: number): IslamicCharge[] {
    const hijriYear = this.getCurrentHijriYear();
    
    return this.holidays.map(holiday => {
      const calculatedDate = this.hijriToGregorian(hijriYear, holiday.hijriMonth, holiday.hijriDay);
      
      return {
        ...holiday,
        year: year,
        calculatedDate,
        amount: holiday.defaultAmount || 0,
        isPaid: false,
      };
    });
  }

  /**
   * Retourne toutes les fêtes disponibles
   */
  static getAllHolidays(): IslamicHoliday[] {
    return this.holidays;
  }

  /**
   * Ajoute une fête personnalisée
   */
  static addCustomHoliday(holiday: Omit<IslamicHoliday, 'id'>): IslamicHoliday {
    const newHoliday: IslamicHoliday = {
      ...holiday,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    this.holidays.push(newHoliday);
    return newHoliday;
  }

  /**
   * Supprime une fête personnalisée
   */
  static removeCustomHoliday(id: string): boolean {
    const index = this.holidays.findIndex(h => h.id === id && h.type === 'custom');
    if (index !== -1) {
      this.holidays.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Vérifie si une date correspond à une fête islamique
   */
  static isIslamicHoliday(date: Date): { isHoliday: boolean; holiday?: IslamicHoliday } {
    const hijriYear = this.getCurrentHijriYear();
    
    for (const holiday of this.holidays) {
      const holidayDate = this.hijriToGregorian(hijriYear, holiday.hijriMonth, holiday.hijriDay);
      
      if (
        date.getDate() === holidayDate.getDate() &&
        date.getMonth() === holidayDate.getMonth() &&
        date.getFullYear() === holidayDate.getFullYear()
      ) {
        return { isHoliday: true, holiday };
      }
    }
    
    return { isHoliday: false };
  }

  /**
   * Obtient les charges à venir (dans les 30 prochains jours)
   */
  static getUpcomingCharges(days: number = 30): IslamicCharge[] {
    const currentYear = new Date().getFullYear();
    const allCharges = this.getChargesForYear(currentYear);
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return allCharges.filter(charge => {
      return charge.calculatedDate >= today && charge.calculatedDate <= futureDate;
    });
  }

  /**
   * Obtient les charges passées non payées
   */
  static getOverdueCharges(): IslamicCharge[] {
    const currentYear = new Date().getFullYear();
    const allCharges = this.getChargesForYear(currentYear);
    const today = new Date();

    return allCharges.filter(charge => {
      return charge.calculatedDate < today && !charge.isPaid;
    });
  }

  /**
   * Met à jour le montant par défaut d'une fête
   */
  static updateHolidayAmount(holidayId: string, newAmount: number): boolean {
    const holiday = this.holidays.find(h => h.id === holidayId);
    if (holiday) {
      holiday.defaultAmount = newAmount;
      return true;
    }
    return false;
  }

  /**
   * Exporte les données des fêtes
   */
  static exportHolidays(): string {
    return JSON.stringify(this.holidays, null, 2);
  }

  /**
   * Importe les données des fêtes
   */
  static importHolidays(data: string): boolean {
    try {
      const importedHolidays = JSON.parse(data);
      if (Array.isArray(importedHolidays)) {
        this.holidays = importedHolidays;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing holidays:', error);
      return false;
    }
  }
}

export default IslamicCalendarService;