// src/types/IslamicCharge.ts
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
}

export interface IslamicSettings {
  isEnabled: boolean;
  calculationMethod: 'UmmAlQura' | 'Fixed';
  customCharges: IslamicHoliday[];
  autoCreateCharges: boolean;
}
