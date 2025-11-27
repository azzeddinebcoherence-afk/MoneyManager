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

// Catégories de charges annuelles avec sous-catégories
export interface AnnualChargeCategory {
  value: string;
  label: string;
  icon: string;
  color: string;
  subcategories: {
    value: string;
    label: string;
  }[];
}

export const ANNUAL_CHARGE_CATEGORIES: AnnualChargeCategory[] = [
  {
    value: 'taxes',
    label: 'Impôts',
    icon: '🏛️',
    color: '#FF6B6B',
    subcategories: [
      { value: 'income_tax', label: 'Impôt sur le revenu' },
      { value: 'property_tax', label: 'Taxe foncière' },
      { value: 'business_tax', label: 'Taxe professionnelle' }
    ]
  },
  {
    value: 'insurance',
    label: 'Assurances',
    icon: '🛡️',
    color: '#4ECDC4',
    subcategories: [
      { value: 'health_insurance', label: 'Assurance santé' },
      { value: 'auto_insurance', label: 'Assurance auto' },
      { value: 'home_insurance', label: 'Assurance habitation' }
    ]
  },
  {
    value: 'subscriptions',
    label: 'Abonnements',
    icon: '📱',
    color: '#95E1D3',
    subcategories: [
      { value: 'digital_services', label: 'Services numériques' },
      { value: 'media_streaming', label: 'Streaming multimédia' },
      { value: 'professional_tools', label: 'Outils professionnels' }
    ]
  },
  {
    value: 'maintenance',
    label: 'Maintenance',
    icon: '🔧',
    color: '#FFE66D',
    subcategories: [
      { value: 'home_maintenance', label: 'Entretien maison' },
      { value: 'vehicle_maintenance', label: 'Entretien véhicule' },
      { value: 'equipment_maintenance', label: 'Entretien équipements' }
    ]
  },
  {
    value: 'education',
    label: 'Éducation',
    icon: '🎓',
    color: '#C7CEEA',
    subcategories: [
      { value: 'school_fees', label: 'Frais scolaires' },
      { value: 'training_courses', label: 'Formation continue' },
      { value: 'educational_materials', label: 'Matériel éducatif' }
    ]
  },
  {
    value: 'health',
    label: 'Santé',
    icon: '🏥',
    color: '#FF8B94',
    subcategories: [
      { value: 'medical_checkup', label: 'Bilans médicaux' },
      { value: 'dental_care', label: 'Soins dentaires' },
      { value: 'medical_treatments', label: 'Traitements médicaux' }
    ]
  },
  {
    value: 'gifts',
    label: 'Cadeaux',
    icon: '🎁',
    color: '#A8E6CF',
    subcategories: [
      { value: 'birthday_gifts', label: 'Cadeaux anniversaires' },
      { value: 'holiday_gifts', label: 'Cadeaux fêtes' },
      { value: 'special_occasions', label: 'Occasions spéciales' }
    ]
  },
  {
    value: 'vacation',
    label: 'Vacances',
    icon: '🏖️',
    color: '#87CEEB',
    subcategories: [
      { value: 'travel_expenses', label: 'Frais de voyage' },
      { value: 'accommodation', label: 'Hébergement' },
      { value: 'leisure_activities', label: 'Activités loisirs' }
    ]
  }
];

// Helper pour obtenir toutes les sous-catégories
export const getAllSubcategories = () => {
  return ANNUAL_CHARGE_CATEGORIES.flatMap(category => 
    category.subcategories.map(sub => ({
      ...sub,
      parentCategory: category.value,
      parentLabel: category.label,
      parentIcon: category.icon,
      parentColor: category.color
    }))
  );
};

// Helper pour obtenir une catégorie par valeur
export const getCategoryByValue = (value: string) => {
  return ANNUAL_CHARGE_CATEGORIES.find(cat => cat.value === value);
};

// Helper pour obtenir une sous-catégorie par valeur
export const getSubcategoryByValue = (value: string) => {
  for (const category of ANNUAL_CHARGE_CATEGORIES) {
    const subcategory = category.subcategories.find(sub => sub.value === value);
    if (subcategory) {
      return {
        ...subcategory,
        parentCategory: category.value,
        parentLabel: category.label,
        parentIcon: category.icon,
        parentColor: category.color
      };
    }
  }
  return null;
};

// Types de charges islamiques
export const ISLAMIC_CHARGE_TYPES = {
  NORMAL: 'normal' as const,
  OBLIGATORY: 'obligatory' as const,
  RECOMMENDED: 'recommended' as const
};

export default AnnualCharge;