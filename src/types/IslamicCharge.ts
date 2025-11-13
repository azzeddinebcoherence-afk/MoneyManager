// src/types/IslamicCharge.ts - VERSION COMPLÈTEMENT CORRIGÉE
export interface IslamicHoliday {
  id: string;
  name: string;
  arabicName: string;
  description: string;
  hijriMonth: number;
  hijriDay: number;
  type: 'obligatory' | 'recommended' | 'custom';
  defaultAmount?: number;
  isRecurring: boolean;
}

export interface IslamicCharge extends IslamicHoliday {
  year: number;
  calculatedDate: Date; // Date grégorienne calculée
  amount: number;
  isPaid: boolean;
  paidDate?: Date;
  accountId?: string;
  autoDeduct?: boolean; // ✅ AJOUTÉ
}

export interface IslamicCharge {
  id: string;
  name: string;
  arabicName: string;
  description: string;
  hijriMonth: number;
  hijriDay: number;
  type: 'obligatory' | 'recommended' | 'custom';
  defaultAmount?: number;
  isRecurring: boolean;
  // Propriétés spécifiques à IslamicCharge
  year: number;
  calculatedDate: Date;
  amount: number;
  isPaid: boolean;
  paidDate?: Date;
  accountId?: string;
}

export interface IslamicSettings {
  isEnabled: boolean;
  calculationMethod: 'UmmAlQura' | 'Fixed';
  customCharges: IslamicHoliday[];
  autoCreateCharges: boolean;
  includeRecommended: boolean; // ✅ AJOUTÉ
  defaultAmounts: { // ✅ AJOUTÉ
    obligatory: number;
    recommended: number;
  };
}

// Types pour les montants par défaut
export interface DefaultIslamicAmounts {
  obligatory: number;
  recommended: number;
  custom: number;
}

export const DEFAULT_ISLAMIC_AMOUNTS: DefaultIslamicAmounts = {
  obligatory: 100,
  recommended: 50,
  custom: 0
};

export const DEFAULT_ISLAMIC_SETTINGS: IslamicSettings = {
  isEnabled: false,
  calculationMethod: 'UmmAlQura',
  customCharges: [],
  autoCreateCharges: true,
  includeRecommended: true,
  defaultAmounts: DEFAULT_ISLAMIC_AMOUNTS
};