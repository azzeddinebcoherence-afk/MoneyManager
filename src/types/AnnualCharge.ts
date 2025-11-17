// src/types/AnnualCharge.ts - VERSION CORRIGÉE
export interface AnnualCharge {
  id: string;
  userId: string;
  name: string;
  amount: number;
  dueDate: string;
  category: string;
  isPaid: boolean;
  createdAt: string;
  notes?: string;
  paymentMethod?: string;
  recurrence?: 'yearly' | 'monthly' | 'quarterly';
  reminderDays?: number;
  
  // ✅ AJOUTÉ : Compte pour le paiement
  accountId?: string;
  
  // ✅ AJOUTÉ : Prélèvement automatique
  autoDeduct?: boolean;
  
  // ✅ AJOUTÉ : Champs pour charges islamiques
  isIslamic?: boolean;
  islamicHolidayId?: string;
  arabicName?: string;
  type?: 'normal' | 'obligatory' | 'recommended';
  
  // ✅ CORRECTION : Ajout de paidDate manquant
  paidDate?: string;
  
  // ✅ AJOUTÉ : Champs pour état actif
  isActive?: boolean;
  
  // ✅ CORRECTION : Ajout du champ isRecurring manquant
  isRecurring?: boolean;
}

export interface AnnualChargeStats {
  totalCharges: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  upcomingCharges: AnnualCharge[];
  overdueCharges: AnnualCharge[];
}

export interface CreateAnnualChargeData {
  name: string;
  amount: number;
  dueDate: string;
  category: string;
  reminderDays?: number;
  accountId?: string;
  autoDeduct?: boolean;
  notes?: string;
  paymentMethod?: string;
  recurrence?: 'yearly' | 'monthly' | 'quarterly';
  isIslamic?: boolean;
  islamicHolidayId?: string;
  arabicName?: string;
  type?: 'normal' | 'obligatory' | 'recommended';
  isActive?: boolean;
  isRecurring?: boolean;
  isPaid?: boolean;
  paidDate?: string;
}

export interface UpdateAnnualChargeData {
  name?: string;
  amount?: number;
  dueDate?: string;
  category?: string;
  isPaid?: boolean;
  reminderDays?: number;
  accountId?: string;
  autoDeduct?: boolean;
  notes?: string;
  paymentMethod?: string;
  recurrence?: 'yearly' | 'monthly' | 'quarterly';
  isIslamic?: boolean;
  islamicHolidayId?: string;
  arabicName?: string;
  type?: 'normal' | 'obligatory' | 'recommended';
  paidDate?: string;
  isActive?: boolean;
  isRecurring?: boolean;
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