// src/services/islamicCalendarService.ts
import { IslamicHoliday, IslamicCharge } from '../types/IslamicCharge';

export class IslamicCalendarService {
  private static readonly HOLIDAYS: IslamicHoliday[] = [
    {
      id: 'ramadan',
      name: 'Ramadan',
      arabicName: 'رمضان',
      description: 'Mois de jeûne et spiritualité',
      hijriMonth: 9,
      hijriDay: 1,
      type: 'obligatory',
      defaultAmount: 0, // Zakat al-Fitr séparé
      isRecurring: true
    }, 
    {
      id: 'eid_al_fitr',
      name: 'Aïd al-Fitr',
      arabicName: 'عيد الفطر',
      description: 'Fête de rupture du jeûne',
      hijriMonth: 10,
      hijriDay: 1,
      type: 'obligatory',
      defaultAmount: 100, // Zakat al-Fitr approximatif
      isRecurring: true
    },
    {
      id: 'eid_al_adha',
      name: 'Aïd al-Adha',
      arabicName: 'عيد الأضحى',
      description: 'Fête du sacrifice',
      hijriMonth: 12,
      hijriDay: 10,
      type: 'obligatory',
      defaultAmount: 500, // Coût sacrifice approximatif
      isRecurring: true
    },
    {
      id: 'ashura',
      name: 'Achoura',
      arabicName: 'عاشوراء',
      description: 'Jeûne du 10 Muharram',
      hijriMonth: 1,
      hijriDay: 10,
      type: 'recommended',
      defaultAmount: 50,
      isRecurring: true
    },
    {
      id: 'mawlid',
      name: 'Mawlid an-Nabawi',
      arabicName: 'المولد النبوي',
      description: 'Naissance du Prophète',
      hijriMonth: 3,
      hijriDay: 12,
      type: 'recommended',
      defaultAmount: 100,
      isRecurring: true
    }
  ];

  // Conversion Hijri → Grégorien (simplifié)
  static hijriToGregorian(hijriYear: number, hijriMonth: number, hijriDay: number): Date {
    // Algorithme de conversion Umm al-Qura simplifié
    const adjustment = 0; // À remplacer par vrai calcul
    const gregorianDate = new Date();
    gregorianDate.setFullYear(hijriYear + 579); // Approximation
    gregorianDate.setMonth(hijriMonth - 1);
    gregorianDate.setDate(hijriDay);
    
    return gregorianDate;
  }

  // Obtenir les charges pour une année donnée
  static getChargesForYear(year: number): IslamicCharge[] {
    const charges: IslamicCharge[] = [];
    const currentHijriYear = this.getCurrentHijriYear();

    this.HOLIDAYS.forEach(holiday => {
      const calculatedDate = this.hijriToGregorian(currentHijriYear, holiday.hijriMonth, holiday.hijriDay);
      
      charges.push({
        ...holiday,
        year: year,
        calculatedDate,
        amount: holiday.defaultAmount || 0,
        isPaid: false
      });
    });

    return charges;
  }

  // Obtenir l'année hijri actuelle
  static getCurrentHijriYear(): number {
    // Calcul simplifié - à améliorer avec vrai algorithme
    const gregorianYear = new Date().getFullYear();
    return gregorianYear - 579;
  }

  // Vérifier si une date est une fête islamique
  static isIslamicHoliday(date: Date): IslamicHoliday | null {
    // Implémentation de la détection
    return null;
  }

  static getAllHolidays(): IslamicHoliday[] {
    return this.HOLIDAYS;
  }
}

export default IslamicCalendarService;
