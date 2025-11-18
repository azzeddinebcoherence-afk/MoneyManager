// src/utils/islamicDateUtils.ts - NOUVEL UTILITAIRE
export class IslamicDateUtils {
  // ✅ CONVERTIR DATE GRÉGORIENNE EN DATE HIJRI APPROXIMATIVE
  static gregorianToHijri(gregorianDate: Date): { year: number; month: number; day: number } {
    // Algorithme approximatif de conversion
    const hijriEpoch = 227015; // Jour julien du 16 juillet 622
    const julianDay = this.gregorianToJulian(gregorianDate);
    const daysSinceEpoch = julianDay - hijriEpoch;
    
    const hijriYears = Math.floor(daysSinceEpoch / 354.367);
    const remainingDays = daysSinceEpoch - (hijriYears * 354.367);
    
    const hijriMonths = Math.floor(remainingDays / 29.53);
    const hijriDays = Math.floor(remainingDays - (hijriMonths * 29.53));
    
    return {
      year: hijriYears + 1,
      month: hijriMonths + 1,
      day: hijriDays + 1
    };
  }

  // ✅ CONVERTIR DATE GRÉGORIENNE EN JOUR JULIEN
  private static gregorianToJulian(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    
    return day + Math.floor((153 * m + 2) / 5) + 365 * y + 
           Math.floor(y / 4) - Math.floor(y / 100) + 
           Math.floor(y / 400) - 32045;
  }

  // ✅ OBTENIR LE NOM DU MOIS HIJRI
  static getHijriMonthName(month: number, language: 'fr' | 'ar' = 'fr'): string {
    const monthsFr = [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaaban',
      'Ramadan', 'Shawwal', 'Dhu al-Qidah', 'Dhu al-Hijjah'
    ];
    
    const monthsAr = [
      'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
      'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
      'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];
    
    const months = language === 'ar' ? monthsAr : monthsFr;
    return months[month - 1] || 'Mois inconnu';
  }

  // ✅ FORMATER LA DATE HIJRI
  static formatHijriDate(hijriDate: { year: number; month: number; day: number }, language: 'fr' | 'ar' = 'fr'): string {
    const monthName = this.getHijriMonthName(hijriDate.month, language);
    
    if (language === 'ar') {
      return `${hijriDate.day} ${monthName} ${hijriDate.year} هـ`;
    }
    
    return `${hijriDate.day} ${monthName} ${hijriDate.year} AH`;
  }

  // ✅ CALCULER LA DATE GRÉGORIENNE APPROXIMATIVE POUR UNE DATE HIJRI
  static hijriToGregorian(hijriYear: number, hijriMonth: number, hijriDay: number): Date {
    // Conversion approximative
    const hijriEpoch = 227015;
    const daysPerHijriYear = 354.367;
    const daysPerHijriMonth = 29.53;
    
    const totalHijriDays = (hijriYear - 1) * daysPerHijriYear + 
                          (hijriMonth - 1) * daysPerHijriMonth + 
                          hijriDay - 1;
    
    const totalDaysSinceEpoch = hijriEpoch + totalHijriDays;
    const julianDay = totalDaysSinceEpoch + 2440587.5;
    
    return new Date((julianDay - 2440587.5) * 86400000);
  }

  // ✅ VÉRIFIER SI UNE DATE EST UN JOUR SPÉCIAL ISLAMIQUE
  static isSpecialIslamicDay(date: Date): { isSpecial: boolean; occasion?: string } {
    const hijriDate = this.gregorianToHijri(date);
    
    // Jours spéciaux islamiques
    const specialDays = [
      { month: 1, day: 10, occasion: 'Achoura' },
      { month: 3, day: 12, occasion: 'Mawlid an-Nabawi' },
      { month: 7, day: 27, occasion: 'Laylat al-Miraj' },
      { month: 8, day: 15, occasion: 'Laylat al-Bara\'ah' },
      { month: 9, day: 1, occasion: 'Début du Ramadan' },
      { month: 9, day: 27, occasion: 'Laylat al-Qadr' },
      { month: 10, day: 1, occasion: 'Aïd al-Fitr' },
      { month: 12, day: 10, occasion: 'Aïd al-Adha' }
    ];
    
    const specialDay = specialDays.find(day => 
      day.month === hijriDate.month && day.day === hijriDate.day
    );
    
    return {
      isSpecial: !!specialDay,
      occasion: specialDay?.occasion
    };
  }

  // ✅ OBTENIR LES PROCHAINS JOURS SPÉCIAUX
  static getUpcomingIslamicOccasions(days: number = 365): Array<{ date: Date; occasion: string; hijriDate: string }> {
    const today = new Date();
    const occasions: Array<{ date: Date; occasion: string; hijriDate: string }> = [];
    
    for (let i = 0; i < days; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      
      const specialDay = this.isSpecialIslamicDay(futureDate);
      if (specialDay.isSpecial && specialDay.occasion) {
        const hijriDate = this.gregorianToHijri(futureDate);
        occasions.push({
          date: futureDate,
          occasion: specialDay.occasion,
          hijriDate: this.formatHijriDate(hijriDate, 'fr')
        });
      }
    }
    
    return occasions;
  }

  // ✅ CALCULER L'ÂGE HIJRI
  static calculateHijriAge(birthDate: Date): { years: number; months: number; days: number } {
    const todayHijri = this.gregorianToHijri(new Date());
    const birthHijri = this.gregorianToHijri(birthDate);
    
    let years = todayHijri.year - birthHijri.year;
    let months = todayHijri.month - birthHijri.month;
    let days = todayHijri.day - birthHijri.day;
    
    if (days < 0) {
      months--;
      days += 30; // Mois hijri approximatif
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return { years, months, days };
  }

  // ✅ VALIDER UNE DATE HIJRI
  static isValidHijriDate(year: number, month: number, day: number): boolean {
    if (year < 1 || year > 1500) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 30) return false; // Mois hijri max 30 jours
    
    return true;
  }

  // ✅ OBTENIR LE NOMBRE DE JOURS DANS UN MOIS HIJRI
  static getDaysInHijriMonth(year: number, month: number): number {
    // Les mois hijri alternent entre 29 et 30 jours
    const oddMonths = [1, 3, 5, 7, 9, 11]; // Mois impairs ont 30 jours
    const evenMonths = [2, 4, 6, 8, 10]; // Mois pairs ont 29 jours
    
    if (oddMonths.includes(month)) return 30;
    if (evenMonths.includes(month)) return 29;
    
    // Dhu al-Hijjah (mois 12) a 29 ou 30 jours selon l'année
    return this.isHijriLeapYear(year) ? 30 : 29;
  }

  // ✅ VÉRIFIER SI UNE ANNÉE HIJRI EST BISSEXTILE
  private static isHijriLeapYear(year: number): boolean {
    // Dans le calendrier hijri, les années bissextiles ont 355 jours au lieu de 354
    // Cela se produit 11 fois sur 30 ans
    const cycle = year % 30;
    const leapYears = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
    return leapYears.includes(cycle);
  }
}

export default IslamicDateUtils;