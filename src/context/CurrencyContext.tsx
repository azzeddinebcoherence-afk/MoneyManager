// src/context/CurrencyContext.tsx - VERSION COMPLÈTEMENT CORRIGÉE AVEC MAD PRINCIPAL
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: { [key: string]: Currency } = {
  MAD: { code: 'MAD', symbol: 'Dh', name: 'Dirham Marocain', locale: 'fr-FR' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'fr-FR' },
  USD: { code: 'USD', symbol: '$', name: 'Dollar US', locale: 'en-US' },
  GBP: { code: 'GBP', symbol: '£', name: 'Livre Sterling', locale: 'en-GB' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Yen Japonais', locale: 'ja-JP' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Franc Suisse', locale: 'de-CH' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Dollar Canadien', locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Dollar Australien', locale: 'en-AU' },
};

interface CurrencyContextType {
  currency: Currency;
  currentCurrency: string;
  setCurrency: (currency: Currency) => void;
  formatAmount: (amount: number, showSymbol?: boolean, currencyCode?: string) => string;
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number;
  availableCurrencies: Currency[];
  isInitialized: boolean;
  setMADAsPrimary: () => void;
  ensureMADCurrency: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(CURRENCIES.MAD); // MAD par défaut
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadSavedCurrency();
  }, []);

  const loadSavedCurrency = async () => {
    try {
      const savedCurrency = await AsyncStorage.getItem('selectedCurrency');
      if (savedCurrency) {
        const parsed = JSON.parse(savedCurrency);
        if (CURRENCIES[parsed.code]) {
          setCurrencyState(parsed);
        } else {
          // Si la devise sauvegardée n'existe pas, utiliser MAD
          await AsyncStorage.setItem('selectedCurrency', JSON.stringify(CURRENCIES.MAD));
          setCurrencyState(CURRENCIES.MAD);
        }
      } else {
        // Première initialisation - sauvegarder MAD comme devise par défaut
        await AsyncStorage.setItem('selectedCurrency', JSON.stringify(CURRENCIES.MAD));
        setCurrencyState(CURRENCIES.MAD);
      }
    } catch (error) {
      console.error('❌ Erreur chargement devise:', error);
      // En cas d'erreur, utiliser MAD par défaut
      setCurrencyState(CURRENCIES.MAD);
    } finally {
      setIsInitialized(true);
    }
  };

  const setCurrency = async (newCurrency: Currency) => {
    try {
      setCurrencyState(newCurrency);
      await AsyncStorage.setItem('selectedCurrency', JSON.stringify(newCurrency));
      console.log(`💰 Devise changée: ${newCurrency.code}`);
    } catch (error) {
      console.error('❌ Erreur sauvegarde devise:', error);
      throw error;
    }
  };

  const setMADAsPrimary = async () => {
    try {
      setCurrencyState(CURRENCIES.MAD);
      await AsyncStorage.setItem('selectedCurrency', JSON.stringify(CURRENCIES.MAD));
      console.log('💰 MAD défini comme devise principale');
    } catch (error) {
      console.error('❌ Erreur définition MAD comme principale:', error);
      throw error;
    }
  };

  const ensureMADCurrency = () => {
    // S'assure que MAD est toujours disponible dans les devises
    if (!CURRENCIES.MAD) {
      console.warn('⚠️ MAD non trouvé dans les devises, réinitialisation...');
      setMADAsPrimary();
    }
  };

  const formatAmount = (
    amount: number, 
    showSymbol: boolean = true, 
    currencyCode?: string
  ): string => {
    if (!isInitialized) {
      return '...';
    }

    try {
      const targetCurrency = currencyCode ? CURRENCIES[currencyCode] : currency;
      if (!targetCurrency) {
        throw new Error(`Devise non trouvée: ${currencyCode}`);
      }

      const absoluteAmount = Math.abs(amount);
      
      // Formatage spécifique pour MAD avec symbole à droite
      if (targetCurrency.code === 'MAD') {
        const formatted = new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(absoluteAmount);

        const symbol = showSymbol ? ` ${targetCurrency.symbol}` : '';
        const sign = amount < 0 ? '-' : '';
        
        return `${sign}${formatted}${symbol}`;
      }

      // Pour les autres devises
      const formatted = new Intl.NumberFormat(targetCurrency.locale, {
        style: showSymbol ? 'currency' : 'decimal',
        currency: targetCurrency.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(absoluteAmount);

      const sign = amount < 0 ? '-' : '';
      return amount < 0 ? `-${formatted}` : formatted;

    } catch (error) {
      console.error('❌ Erreur formatage montant:', error);
      // Fallback simple avec symbole à droite pour MAD
      const targetCurrency = currencyCode ? CURRENCIES[currencyCode] : currency;
      const absoluteAmount = Math.abs(amount);
      const formatted = absoluteAmount.toFixed(2);
      const sign = amount < 0 ? '-' : '';
      
      if (targetCurrency?.code === 'MAD') {
        const symbol = showSymbol ? ` ${targetCurrency.symbol}` : '';
        return `${sign}${formatted}${symbol}`;
      }
      
      const symbol = showSymbol ? `${targetCurrency?.symbol || ''} ` : '';
      return `${sign}${symbol}${formatted}`.trim();
    }
  };

  const convertAmount = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;

    const exchangeRates: { [key: string]: number } = {
      // Taux de base depuis MAD (devise principale)
      'MAD-EUR': 0.093,
      'MAD-USD': 0.10,
      'MAD-GBP': 0.078,
      'MAD-JPY': 14.67,
      'MAD-CHF': 0.089,
      'MAD-CAD': 0.136,
      'MAD-AUD': 0.152,
      
      // Conversions vers MAD
      'EUR-MAD': 10.8,
      'USD-MAD': 10.0,
      'GBP-MAD': 12.8,
      'JPY-MAD': 0.068,
      'CHF-MAD': 11.2,
      'CAD-MAD': 7.35,
      'AUD-MAD': 6.58,
      
      // Autres conversions courantes
      'EUR-USD': 1.08,
      'EUR-GBP': 0.86,
      'USD-EUR': 0.93,
      'GBP-EUR': 1.16,
      'USD-GBP': 0.79,
      'GBP-USD': 1.26,
    };

    const rateKey = `${fromCurrency}-${toCurrency}`;
    const reverseRateKey = `${toCurrency}-${fromCurrency}`;
    
    // Chercher le taux direct
    let rate = exchangeRates[rateKey];
    
    // Si pas de taux direct, chercher le taux inverse
    if (!rate && exchangeRates[reverseRateKey]) {
      rate = 1 / exchangeRates[reverseRateKey];
    }
    
    // Si toujours pas de taux, utiliser 1 (pas de conversion)
    return amount * (rate || 1);
  };

  const value: CurrencyContextType = {
    currency,
    currentCurrency: currency.code,
    setCurrency,
    formatAmount,
    convertAmount,
    availableCurrencies: Object.values(CURRENCIES),
    isInitialized,
    setMADAsPrimary,
    ensureMADCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};