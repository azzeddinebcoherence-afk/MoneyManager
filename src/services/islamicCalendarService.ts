// src/services/islamicCalendarService.ts - VERSION CORRIGÉE AVEC ANNÉES COURANTES
import { IslamicCharge, IslamicHoliday } from '../types/IslamicCharge';

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
      defaultAmount: 0,
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
      defaultAmount: 100,
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
      defaultAmount: 500,
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

  // ✅ CORRECTION : Dates fixes pour les années 2025-2030
  static getGregorianDate(hijriMonth: number, hijriDay: number, year: number): Date {
    // Table de correspondance Hijri → Grégorien pour les années 2025-2030
    const dateMapping: { [key: string]: { [key: number]: string } } = {
      // Muharram 10 (Achoura)
      '1-10': {
        2025: '2025-07-10',
        2026: '2026-06-30',
        2027: '2027-06-19',
        2028: '2028-06-07',
        2029: '2029-06-26',
        2030: '2030-06-16'
      },
      // Ramadan 1
      '9-1': {
        2025: '2025-03-01',
        2026: '2026-02-18',
        2027: '2027-02-08',
        2028: '2028-01-28',
        2029: '2029-01-16',
        2030: '2030-01-06'
      },
      // Aïd al-Fitr (Chawwal 1)
      '10-1': {
        2025: '2025-03-30',
        2026: '2026-03-20',
        2027: '2027-03-09',
        2028: '2028-02-26',
        2029: '2029-02-14',
        2030: '2030-02-04'
      },
      // Aïd al-Adha (Dhou al-hijja 10)
      '12-10': {
        2025: '2025-06-06',
        2026: '2026-05-27',
        2027: '2027-05-16',
        2028: '2028-05-04',
        2029: '2029-04-24',
        2030: '2030-04-13'
      },
      // Mawlid (Rabi' al-awwal 12)
      '3-12': {
        2025: '2025-09-06',
        2026: '2026-08-27',
        2027: '2027-08-16',
        2028: '2028-08-04',
        2029: '2029-07-25',
        2030: '2030-07-14'
      }
    };

    const key = `${hijriMonth}-${hijriDay}`;
    
    if (dateMapping[key] && dateMapping[key][year]) {
      const date = new Date(dateMapping[key][year]);
      console.log(`📅 ${year}: Hijri ${hijriMonth}-${hijriDay} → Grégorien: ${date.toLocaleDateString('fr-FR')}`);
      return date;
    }

    // Fallback: date approximative basée sur l'année
    const fallbackDate = new Date(year, hijriMonth - 1, hijriDay);
    console.log(`⚠️ Date approximative ${year}: ${hijriMonth}-${hijriDay} → ${fallbackDate.toLocaleDateString('fr-FR')}`);
    return fallbackDate;
  }

  // ✅ CORRECTION : Générer les charges pour l'année spécifique
  static getChargesForYear(year: number): IslamicCharge[] {
    const charges: IslamicCharge[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`🔄 Génération des charges islamiques pour ${year}...`);

    this.HOLIDAYS.forEach(holiday => {
      // ✅ CORRECTION: Utiliser l'année spécifiée
      const calculatedDate = this.getGregorianDate(holiday.hijriMonth, holiday.hijriDay, year);
      
      // Vérifier si la date est dans le futur ou aujourd'hui
      if (calculatedDate < today) {
        console.log(`⏭️ Date passée ignorée (${year}): ${holiday.name} - ${calculatedDate.toLocaleDateString('fr-FR')}`);
        return;
      }
      
      // Créer un IslamicCharge COMPLET
      const islamicCharge: IslamicCharge = {
        // Propriétés de IslamicHoliday
        id: `${holiday.id}_${year}`,
        name: holiday.name,
        arabicName: holiday.arabicName,
        description: holiday.description,
        hijriMonth: holiday.hijriMonth,
        hijriDay: holiday.hijriDay,
        type: holiday.type,
        defaultAmount: holiday.defaultAmount,
        isRecurring: holiday.isRecurring,
        // Propriétés spécifiques à IslamicCharge
        year: year,
        calculatedDate: calculatedDate,
        amount: holiday.defaultAmount || 0,
        isPaid: false,
        paidDate: undefined,
        accountId: undefined
      };
      
      charges.push(islamicCharge);
      console.log(`✅ Charge ${year}: ${holiday.name} - ${calculatedDate.toLocaleDateString('fr-FR')} - ${holiday.defaultAmount} MAD`);
    });

    // Trier par date
    charges.sort((a, b) => a.calculatedDate.getTime() - b.calculatedDate.getTime());
    
    console.log(`📅 ${charges.length} charges islamiques générées pour ${year}`);
    
    return charges;
  }

  // ✅ NOUVELLE MÉTHODE : Générer les charges pour les 3 prochaines années
  static getChargesForNextYears(yearsCount: number = 3): IslamicCharge[] {
    const currentYear = new Date().getFullYear();
    const allCharges: IslamicCharge[] = [];

    for (let i = 0; i < yearsCount; i++) {
      const year = currentYear + i;
      const yearCharges = this.getChargesForYear(year);
      allCharges.push(...yearCharges);
    }

    // Trier toutes les charges par date
    allCharges.sort((a, b) => a.calculatedDate.getTime() - b.calculatedDate.getTime());
    
    console.log(`📅 Total ${allCharges.length} charges générées pour les ${yearsCount} prochaines années`);
    
    return allCharges;
  }

  static getAllHolidays(): IslamicHoliday[] {
    return this.HOLIDAYS;
  }

  // Obtenir un jour férié par ID
  static getHolidayById(id: string): IslamicHoliday | undefined {
    return this.HOLIDAYS.find(holiday => holiday.id === id);
  }

  // ✅ CORRECTION : Créer une charge islamique pour une année spécifique
  static createIslamicChargeFromHoliday(holiday: IslamicHoliday, year: number): IslamicCharge {
    const calculatedDate = this.getGregorianDate(holiday.hijriMonth, holiday.hijriDay, year);
    
    return {
      ...holiday,
      id: `${holiday.id}_${year}`,
      year: year,
      calculatedDate: calculatedDate,
      amount: holiday.defaultAmount || 0,
      isPaid: false,
      paidDate: undefined,
      accountId: undefined
    };
  }

  // ✅ NOUVELLE MÉTHODE : Obtenir les prochaines charges (dans les X jours)
  static getUpcomingCharges(days: number = 365): IslamicCharge[] {
    const currentYear = new Date().getFullYear();
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    // Générer pour les 2 prochaines années pour couvrir la période
    const allCharges = [
      ...this.getChargesForYear(currentYear),
      ...this.getChargesForYear(currentYear + 1)
    ];

    return allCharges.filter(charge => 
      charge.calculatedDate >= today && charge.calculatedDate <= futureDate
    );
  }

  // ✅ NOUVELLE MÉTHODE : Obtenir le nom du mois hijri
  static getHijriMonthName(month: number): string {
    const months = [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaaban',
      'Ramadan', 'Shawwal', 'Dhu al-Qidah', 'Dhu al-Hijjah'
    ];
    return months[month - 1] || 'Mois inconnu';
  }
}

export default IslamicCalendarService;