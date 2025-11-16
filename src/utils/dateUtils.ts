// src/utils/dateUtils.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { IslamicHoliday } from '../types/IslamicCharge';

// Conversion simplifiée Hijri → Grégorien
export const hijriToGregorian = (hijriYear: number, hijriMonth: number, hijriDay: number): Date => {
  // Conversion approximative (à améliorer avec une librairie spécialisée)
  const gregorianYear = hijriYear + 579; // Approximation
  const gregorianDate = new Date(gregorianYear, hijriMonth - 1, hijriDay);
  return gregorianDate;
};

// Obtenir l'année hijri actuelle
export const getCurrentHijriYear = (): number => {
  const gregorianYear = new Date().getFullYear();
  return gregorianYear - 579; // Approximation
};

// Calculer la date grégorienne pour un jour férié islamique
export const calculateIslamicHolidayDate = (holiday: IslamicHoliday, year?: number): Date => {
  const hijriYear = year || getCurrentHijriYear();
  return hijriToGregorian(hijriYear, holiday.hijriMonth, holiday.hijriDay);
};

// Formater une date pour l'affichage
export const formatDate = (date: Date, locale: string = 'fr-FR'): string => {
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Formater une date avec l'heure
export const formatDateTime = (date: Date, locale: string = 'fr-FR'): string => {
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Obtenir le nombre de jours entre deux dates
export const getDaysBetween = (startDate: Date, endDate: Date): number => {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

// Vérifier si une date est aujourd'hui
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

// Vérifier si une date est dans le futur
export const isFutureDate = (date: Date): boolean => {
  return date.getTime() > new Date().getTime();
};

// Vérifier si une date est dans le passé
export const isPastDate = (date: Date): boolean => {
  return date.getTime() < new Date().getTime();
};

// Vérifier si une date est dans le mois courant
export const isCurrentMonth = (date: Date): boolean => {
  const today = new Date();
  return date.getMonth() === today.getMonth() && 
         date.getFullYear() === today.getFullYear();
};

// Vérifier si une date est échue (passée et non payée)
export const isOverdue = (dueDate: Date, isPaid: boolean = false): boolean => {
  return isPastDate(dueDate) && !isPaid;
};

// Vérifier si une charge peut être payée (date d'échéance arrivée)
export const canPayCharge = (dueDate: Date, isPaid: boolean = false): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  return due <= today && !isPaid;
};

// Ajouter des jours à une date
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Ajouter des mois à une date
export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

// Ajouter des années à une date
export const addYears = (date: Date, years: number): Date => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

// Obtenir le premier jour du mois
export const getFirstDayOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Obtenir le dernier jour du mois
export const getLastDayOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

// Obtenir le premier jour du mois courant
export const getFirstDayOfCurrentMonth = (): Date => {
  return getFirstDayOfMonth(new Date());
};

// Obtenir le dernier jour du mois courant
export const getLastDayOfCurrentMonth = (): Date => {
  return getLastDayOfMonth(new Date());
};

// Vérifier si une date est dans le mois courant
export const isDateInCurrentMonth = (date: Date): boolean => {
  const currentDate = new Date();
  return date.getMonth() === currentDate.getMonth() && 
         date.getFullYear() === currentDate.getFullYear();
};

// Formater pour SQLite (ISO string)
export const toISODateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Parser depuis SQLite
export const fromISODateString = (isoString: string): Date => {
  return new Date(isoString);
};

// Obtenir le nom du mois
export const getMonthName = (month: number, locale: string = 'fr-FR'): string => {
  const date = new Date();
  date.setMonth(month - 1);
  return date.toLocaleDateString(locale, { month: 'long' });
};

// Obtenir le nom du jour
export const getDayName = (date: Date, locale: string = 'fr-FR'): string => {
  return date.toLocaleDateString(locale, { weekday: 'long' });
};

// Calculer l'âge en années
export const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Formater une durée
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} jour${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} heure${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
};

// Vérifier si une année est bissextile
export const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

// Obtenir le nombre de jours dans un mois
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

// Comparer deux dates (sans l'heure)
export const compareDates = (date1: Date, date2: Date): number => {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  
  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
};

export default {
  hijriToGregorian,
  getCurrentHijriYear,
  calculateIslamicHolidayDate,
  formatDate,
  formatDateTime,
  getDaysBetween,
  isToday,
  isFutureDate,
  isPastDate,
  isCurrentMonth,
  isOverdue,
  canPayCharge,
  addDays,
  addMonths,
  addYears,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  getFirstDayOfCurrentMonth,
  getLastDayOfCurrentMonth,
  isDateInCurrentMonth,
  toISODateString,
  fromISODateString,
  getMonthName,
  getDayName,
  calculateAge,
  formatDuration,
  isLeapYear,
  getDaysInMonth,
  compareDates
};