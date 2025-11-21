// src/utils/constants.ts - VERSION CORRIGÉE
import { Category } from '../types';

export const DEFAULT_CATEGORIES: Omit<Category, 'createdAt'>[] = [
  // Dépenses
  { id: 'cat_1', name: 'Alimentation', type: 'expense', color: '#FF6B6B', icon: 'restaurant', level: 0, isActive: true, sortOrder: 1 },
  { id: 'cat_2', name: 'Transport', type: 'expense', color: '#4ECDC4', icon: 'car', level: 0, isActive: true, sortOrder: 2 },
  { id: 'cat_3', name: 'Logement', type: 'expense', color: '#45B7D1', icon: 'home', level: 0, isActive: true, sortOrder: 3 },
  { id: 'cat_4', name: 'Loisirs', type: 'expense', color: '#96CEB4', icon: 'game-controller', level: 0, isActive: true, sortOrder: 4 },
  { id: 'cat_5', name: 'Santé', type: 'expense', color: '#FFEAA7', icon: 'medical', level: 0, isActive: true, sortOrder: 5 },
  { id: 'cat_6', name: 'Shopping', type: 'expense', color: '#DDA0DD', icon: 'cart', level: 0, isActive: true, sortOrder: 6 },
  { id: 'cat_7', name: 'Éducation', type: 'expense', color: '#98D8C8', icon: 'school', level: 0, isActive: true, sortOrder: 7 },
  { id: 'cat_8', name: 'Voyages', type: 'expense', color: '#F7DC6F', icon: 'airplane', level: 0, isActive: true, sortOrder: 8 },
  { id: 'cat_9', name: 'Autres dépenses', type: 'expense', color: '#778899', icon: 'ellipsis-horizontal', level: 0, isActive: true, sortOrder: 9 },
  
  // Revenus
  { id: 'cat_10', name: 'Salaire', type: 'income', color: '#52C41A', icon: 'cash', level: 0, isActive: true, sortOrder: 10 },
  { id: 'cat_11', name: 'Investissements', type: 'income', color: '#FAAD14', icon: 'trending-up', level: 0, isActive: true, sortOrder: 11 },
  { id: 'cat_12', name: 'Cadeaux', type: 'income', color: '#722ED1', icon: 'gift', level: 0, isActive: true, sortOrder: 12 },
  { id: 'cat_13', name: 'Prime', type: 'income', color: '#13C2C2', icon: 'trophy', level: 0, isActive: true, sortOrder: 13 },
  { id: 'cat_14', name: 'Autres revenus', type: 'income', color: '#20B2AA', icon: 'add-circle', level: 0, isActive: true, sortOrder: 14 },
];

export const CURRENCY_CONSTANTS = {
  DEFAULT_CURRENCY: 'MAD',
  CURRENCY_STORAGE_KEY: 'selectedCurrency',
  BASE_CURRENCY_STORAGE_KEY: 'base_currency',
  EXCHANGE_RATES_KEY: 'exchange_rates',
  
  // Codes de devises supportées
  SUPPORTED_CURRENCIES: [
    { code: 'MAD', name: 'Dirham Marocain', symbol: 'MAD ', locale: 'fr-FR' },
    { code: 'EUR', name: 'Euro', symbol: '€', locale: 'fr-FR' },
    { code: 'USD', name: 'Dollar US', symbol: '$', locale: 'en-US' },
    { code: 'GBP', name: 'Livre Sterling', symbol: '£', locale: 'en-GB' },
    { code: 'JPY', name: 'Yen Japonais', symbol: '¥', locale: 'ja-JP' },
    { code: 'CAD', name: 'Dollar Canadien', symbol: 'CA$', locale: 'en-CA' },
    { code: 'AUD', name: 'Dollar Australien', symbol: 'A$', locale: 'en-AU' },
    { code: 'CHF', name: 'Franc Suisse', symbol: 'CHF', locale: 'de-CH' }
  ]
};

export const STORAGE_KEYS = {
  // ... autres clés existantes ...
  SELECTED_CURRENCY: 'selectedCurrency',
  BASE_CURRENCY: 'base_currency',
  EXCHANGE_RATES: 'exchange_rates'
};

// Types pour les comptes
export const ACCOUNT_TYPES = [
  { value: 'cash', label: '💵 Espèces', icon: 'cash' },
  { value: 'bank', label: '🏦 Banque', icon: 'business' },
  { value: 'card', label: '💳 Carte', icon: 'card' },
  { value: 'savings', label: '💰 Épargne', icon: 'trending-up' },
];

export const ACCOUNT_COLORS = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30', 
  '#AF52DE', '#FF2D55', '#5856D6', '#A2845E'
];