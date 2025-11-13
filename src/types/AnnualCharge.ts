// src/types/AnnualCharge.ts - VERSION COMPLÈTEMENT CORRIGÉE
export interface AnnualCharge {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: string;
  dueDate: string; // ✅ CORRIGÉ : string au lieu de Date
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
  // ✅ AJOUTÉ : Champs islamiques
  isIslamic?: boolean;
  islamicHolidayId?: string;
  arabicName?: string;
  type?: 'normal' | 'obligatory' | 'recommended';
  // ✅ AJOUTÉ : Compatibilité avec description existante
  description?: string;
  isRecurring?: boolean;
  isActive?: boolean;
  paidDate?: string; // ✅ CORRIGÉ : string au lieu de Date
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
  dueDate: string; // ✅ CORRIGÉ : string au lieu de Date
  category: string;
  reminderDays?: number;
  // ✅ AJOUTÉ
  accountId?: string;
  autoDeduct?: boolean;
  notes?: string;
  paymentMethod?: string;
  recurrence?: 'yearly' | 'monthly' | 'quarterly';
  // ✅ AJOUTÉ : Champs islamiques
  isIslamic?: boolean;
  islamicHolidayId?: string;
  arabicName?: string;
  type?: 'normal' | 'obligatory' | 'recommended';
  isActive?: boolean;
  isRecurring?: boolean;
  isPaid?: boolean;
  paidDate?: string; // ✅ CORRIGÉ : string au lieu de Date
}

export interface UpdateAnnualChargeData {
  name?: string;
  amount?: number;
  dueDate?: string; // ✅ CORRIGÉ : string au lieu de Date
  category?: string;
  isPaid?: boolean;
  reminderDays?: number;
  // ✅ AJOUTÉ
  accountId?: string;
  autoDeduct?: boolean;
  notes?: string;
  paymentMethod?: string;
  recurrence?: 'yearly' | 'monthly' | 'quarterly';
  // ✅ AJOUTÉ : Champs islamiques
  isIslamic?: boolean;
  islamicHolidayId?: string;
  arabicName?: string;
  type?: 'normal' | 'obligatory' | 'recommended';
  isActive?: boolean;
  isRecurring?: boolean;
  paidDate?: string; // ✅ CORRIGÉ : string au lieu de Date
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
  { value: 'islamic', label: 'Charges Islamiques', icon: '🕌' }, // ✅ Doit exister
  { value: 'other', label: 'Autre', icon: '📦' }
];

// Types de charges islamiques
export const ISLAMIC_CHARGE_TYPES = {
  NORMAL: 'normal' as const,
  OBLIGATORY: 'obligatory' as const,
  RECOMMENDED: 'recommended' as const
};

export default AnnualCharge; 