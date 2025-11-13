// src/types/AnnualCharge.ts - VERSION COMPLÈTEMENT CORRIGÉE
export interface AnnualCharge {
  id: string;
  userId: string;
  name: string;
  amount: number;
  dueDate: Date;
  category: string;
  description: string;
  isRecurring: boolean;
  isActive: boolean;
  createdAt: string;
  
  // NOUVEAUX CHAMPS POUR CHARGES ISLAMIQUES
  isIslamic?: boolean;
  islamicHolidayId?: string;
  arabicName?: string;
  type?: 'normal' | 'obligatory' | 'recommended';
  
  // ✅ CORRECTION DÉFINITIVE : Propriétés pour le statut de paiement
  isPaid: boolean;
  paidDate?: Date;
}

export interface CreateAnnualChargeData {
  name: string;
  amount: number;
  dueDate: Date;
  category: string;
  description?: string;
  isRecurring?: boolean;
  isActive?: boolean;
  
  // NOUVEAUX CHAMPS POUR CHARGES ISLAMIQUES
  isIslamic?: boolean;
  islamicHolidayId?: string;
  arabicName?: string;
  type?: 'normal' | 'obligatory' | 'recommended';
  
  // ✅ CORRECTION DÉFINITIVE : Propriétés pour le statut de paiement
  isPaid?: boolean;
  paidDate?: Date;
  reminderDays?: number;
}

export interface UpdateAnnualChargeData {
  name?: string;
  amount?: number;
  dueDate?: Date;
  category?: string;
  description?: string;
  isRecurring?: boolean;
  isActive?: boolean;
  
  // NOUVEAUX CHAMPS POUR CHARGES ISLAMIQUES
  isIslamic?: boolean;
  islamicHolidayId?: string;
  arabicName?: string;
  type?: 'normal' | 'obligatory' | 'recommended';
  
  // ✅ CORRECTION DÉFINITIVE : Propriétés pour le statut de paiement
  isPaid?: boolean;
  paidDate?: Date;
  
  // ✅ AJOUT: Pour supporter reminderDays
  reminderDays?: number;
}

// Catégories de charges pré-définies
export const ANNUAL_CHARGE_CATEGORIES = [
  { value: 'taxes', label: 'Impôts', icon: '🏛️' },
  { value: 'insurance', label: 'Assurances', icon: '🛡️' },
  { value: 'subscriptions', label: 'Abonnements', icon: '📱' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'education', label: 'Éducation', icon: '🎓' },
  { value: 'health', label: 'Santé', icon: '🏥' },
  { value: 'gifts', label: 'Cadeaux', icon: '🎁' },
  { value: 'vacation', label: 'Vacances', icon: '🏖️' },
  { value: 'islamic', label: 'Charges Islamiques', icon: '🕌' },
  { value: 'other', label: 'Autre', icon: '📦' }
];

// Types de charges islamiques
export const ISLAMIC_CHARGE_TYPES = {
  NORMAL: 'normal' as const,
  OBLIGATORY: 'obligatory' as const,
  RECOMMENDED: 'recommended' as const
};

export default AnnualCharge; 