// src/utils/dateUtils.ts - VERSION SIMPLIFIÉE SANS RÉFÉRENCES ISLAMIQUES
import { format, addMonths, addYears, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatDate = (date: Date | string, pattern: string = 'dd/MM/yyyy'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, pattern, { locale: fr });
};

export const formatCurrency = (amount: number, currency: string = 'MAD'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency === 'MAD' ? 'EUR' : currency, // Fallback car MAD n'est pas supporté
    minimumFractionDigits: 2,
  }).format(amount).replace('€', 'MAD');
};

export const getMonthName = (date: Date): string => {
  return format(date, 'MMMM yyyy', { locale: fr });
};

export const getStartOfMonth = (date: Date): Date => {
  return startOfMonth(date);
};

export const getEndOfMonth = (date: Date): Date => {
  return endOfMonth(date);
};

export const addMonthsToDate = (date: Date, months: number): Date => {
  return addMonths(date, months);
};

export const addYearsToDate = (date: Date, years: number): Date => {
  return addYears(date, years);
};

export const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  return isWithinInterval(date, { start, end });
};

export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

export const getCurrentMonth = (): number => {
  return new Date().getMonth() + 1; // getMonth() returns 0-11
};

export const formatMonthYear = (date: Date): string => {
  return format(date, 'MMMM yyyy', { locale: fr });
};

export const getDateRangeString = (startDate: Date, endDate: Date): string => {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

export const isToday = (date: Date | string): boolean => {
  const today = new Date();
  const compareDate = typeof date === 'string' ? new Date(date) : date;
  
  return today.toDateString() === compareDate.toDateString();
};

export const isThisMonth = (date: Date | string): boolean => {
  const today = new Date();
  const compareDate = typeof date === 'string' ? new Date(date) : date;
  
  return today.getMonth() === compareDate.getMonth() && 
         today.getFullYear() === compareDate.getFullYear();
};

export const daysBetween = (date1: Date, date2: Date): number => {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

export const formatRelativeTime = (date: Date | string): string => {
  const compareDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - compareDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return "Aujourd'hui";
  if (diffInDays === 1) return "Hier";  
  if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
  if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaines`;
  if (diffInDays < 365) return `Il y a ${Math.floor(diffInDays / 30)} mois`;
  
  return `Il y a ${Math.floor(diffInDays / 365)} ans`;
};