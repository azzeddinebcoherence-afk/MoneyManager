// src/types/Debt.ts - VERSION COMPLÈTEMENT CORRIGÉE
export interface Debt {
  id: string;
  userId: string;
  name: string;
  creditor: string;
  initialAmount: number;
  currentAmount: number;
  interestRate: number;
  monthlyPayment: number;
  startDate: string;
  status: 'active' | 'overdue' | 'paid' | 'future';
  category: DebtCategory;
  color: string;
  notes?: string;
  createdAt: string;
  nextDueDate?: string;
  type: DebtType;
  autoPay: boolean;
  paymentAccountId?: string;
  paymentDay?: number;
  startPaymentNextMonth?: boolean;
  paymentEligibility: PaymentEligibility;
}

export interface CreateDebtData {
  name: string;
  creditor: string;
  initialAmount: number;
  interestRate: number;
  monthlyPayment: number;
  startDate: string;
  type: DebtType;
  category: DebtCategory;
  color: string;
  notes?: string;
  autoPay?: boolean;
  paymentAccountId?: string;
  paymentDay?: number;
  startPaymentNextMonth?: boolean;
}

export interface UpdateDebtData {
  name?: string;
  creditor?: string;
  initialAmount?: number;
  currentAmount?: number;
  interestRate?: number;
  monthlyPayment?: number;
  startDate: string;
  status: Debt['status'];
  category: DebtCategory;
  color: string;
  notes?: string;
  type?: DebtType;
  autoPay?: boolean;
  paymentAccountId?: string;
  paymentDay?: number;
  startPaymentNextMonth?: boolean;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paymentDate: string;
  paymentStatus: 'completed' | 'pending' | 'failed';
  createdAt: string;
  fromAccountId?: string;
  principal: number;
  interest: number;
  remainingBalance: number;
  paymentMonth: string;
}

export interface PaymentEligibility {
  isEligible: boolean;
  reason: string;
  nextEligibleDate?: string;
  dueMonth: string;
  isCurrentMonth: boolean;
  isPastDue: boolean;
  isFutureDue: boolean;
}

// Types de dettes
export type DebtType = 
  | 'personal' 
  | 'consumer_credit' 
  | 'revolving_credit' 
  | 'car_loan' 
  | 'mortgage' 
  | 'student_loan' 
  | 'overdraft' 
  | 'tax_debt' 
  | 'social_debt' 
  | 'supplier_debt' 
  | 'family_debt' 
  | 'microcredit' 
  | 'professional_debt' 
  | 'peer_to_peer' 
  | 'judicial_debt' 
  | 'other';

export const DEBT_TYPES: { value: DebtType; label: string; icon: string }[] = [
  { value: 'personal', label: 'Dette personnelle', icon: 'person' },
  { value: 'consumer_credit', label: 'Crédit à la consommation', icon: 'card' },
  { value: 'revolving_credit', label: 'Crédit renouvelable', icon: 'refresh' },
  { value: 'car_loan', label: 'Prêt automobile', icon: 'car' },
  { value: 'mortgage', label: 'Prêt immobilier', icon: 'home' },
  { value: 'student_loan', label: 'Prêt étudiant', icon: 'school' },
  { value: 'overdraft', label: 'Découvert bancaire', icon: 'trending-down' },
  { value: 'tax_debt', label: 'Dette fiscale', icon: 'receipt' },
  { value: 'social_debt', label: 'Dette sociale (CNSS)', icon: 'shield' },
  { value: 'supplier_debt', label: 'Dette fournisseur', icon: 'business' },
  { value: 'family_debt', label: 'Dette familiale', icon: 'people' },
  { value: 'microcredit', label: 'Microcrédit', icon: 'cash' },
  { value: 'professional_debt', label: 'Dette professionnelle', icon: 'briefcase' },
  { value: 'peer_to_peer', label: 'Prêt entre particuliers', icon: 'swap-horizontal' },
  { value: 'judicial_debt', label: 'Dettes judiciaires', icon: 'hammer' },
  { value: 'other', label: 'Autre', icon: 'ellipsis-horizontal' }
];

// Catégories de dettes
export type DebtCategory = 
  | 'housing' 
  | 'transport' 
  | 'education' 
  | 'consumption' 
  | 'emergency' 
  | 'professional' 
  | 'family' 
  | 'administrative';

export const DEBT_CATEGORIES: { value: DebtCategory; label: string; icon: string; color: string }[] = [
  { value: 'housing', label: 'Dettes de logement', icon: 'home', color: '#FF6B6B' },
  { value: 'transport', label: 'Dettes de transport', icon: 'car', color: '#4ECDC4' },
  { value: 'education', label: 'Dettes d\'études / formation', icon: 'school', color: '#45B7D1' },
  { value: 'consumption', label: 'Dettes de consommation', icon: 'cart', color: '#FFA07A' },
  { value: 'emergency', label: 'Dettes d\'urgence / imprévus', icon: 'alert-circle', color: '#FF4757' },
  { value: 'professional', label: 'Dettes professionnelles', icon: 'briefcase', color: '#5F27CD' },
  { value: 'family', label: 'Dettes familiales', icon: 'people', color: '#00D2D3' },
  { value: 'administrative', label: 'Dettes administratives', icon: 'document-text', color: '#A29BFE' }
];

export interface DebtStats {
  totalDebt: number;
  monthlyPayment: number;
  paidDebts: number;
  activeDebts: number;
  overdueDebts: number;
  futureDebts: number;
  totalInterest: number;
  totalRemaining: number;
  totalPaid: number;
  interestPaid: number;
  debtFreeDate: string;
  progressPercentage: number;
  dueThisMonth: number;
  totalDueThisMonth: number;
  upcomingDebts: Debt[];
}