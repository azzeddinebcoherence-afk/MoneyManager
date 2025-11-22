// src/services/exchangeRateService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// API gratuite pour les taux de change (ExchangeRate-API)
const API_BASE_URL = 'https://api.exchangerate-api.com/v4/latest';
const CACHE_KEY = 'exchange_rates_cache';
const CACHE_DURATION = 3600000; // 1 heure en millisecondes

export interface ExchangeRates {
  base: string;
  rates: { [key: string]: number };
  timestamp: number;
}

/**
 * Récupère les taux de change depuis l'API ou le cache
 */
export const fetchExchangeRates = async (baseCurrency: string = 'EUR'): Promise<ExchangeRates | null> => {
  try {
    // 1. Vérifier le cache
    const cachedData = await AsyncStorage.getItem(`${CACHE_KEY}_${baseCurrency}`);
    if (cachedData) {
      const parsed: ExchangeRates = JSON.parse(cachedData);
      const now = Date.now();
      
      // Si le cache a moins d'1 heure, l'utiliser
      if (now - parsed.timestamp < CACHE_DURATION) {
        console.log('💰 Taux de change chargés depuis le cache');
        return parsed;
      }
    }

    // 2. Sinon, récupérer depuis l'API
    console.log(`🌐 Récupération des taux de change depuis l'API (base: ${baseCurrency})...`);
    const response = await fetch(`${API_BASE_URL}/${baseCurrency}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    const exchangeRates: ExchangeRates = {
      base: baseCurrency,
      rates: data.rates,
      timestamp: Date.now(),
    };

    // 3. Sauvegarder dans le cache
    await AsyncStorage.setItem(
      `${CACHE_KEY}_${baseCurrency}`,
      JSON.stringify(exchangeRates)
    );

    console.log(`✅ Taux de change récupérés: ${Object.keys(data.rates).length} devises`);
    return exchangeRates;

  } catch (error) {
    console.error('❌ Erreur récupération taux de change:', error);
    
    // En cas d'erreur, essayer de retourner le cache même expiré
    try {
      const cachedData = await AsyncStorage.getItem(`${CACHE_KEY}_${baseCurrency}`);
      if (cachedData) {
        console.log('⚠️ Utilisation du cache expiré en fallback');
        return JSON.parse(cachedData);
      }
    } catch (cacheError) {
      console.error('❌ Impossible de charger le cache:', cacheError);
    }
    
    return null;
  }
};

/**
 * Convertit un montant d'une devise à une autre
 */
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  try {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Récupérer les taux avec la devise source comme base
    const rates = await fetchExchangeRates(fromCurrency);
    
    if (!rates || !rates.rates[toCurrency]) {
      console.warn(`⚠️ Taux de change ${fromCurrency} → ${toCurrency} non disponible`);
      return amount; // Retourner le montant original si pas de taux
    }

    const convertedAmount = amount * rates.rates[toCurrency];
    console.log(`💱 Conversion: ${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}`);
    
    return convertedAmount;

  } catch (error) {
    console.error('❌ Erreur conversion:', error);
    return amount;
  }
};

/**
 * Récupère le taux de change entre deux devises
 */
export const getExchangeRate = async (
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  try {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const rates = await fetchExchangeRates(fromCurrency);
    
    if (!rates || !rates.rates[toCurrency]) {
      return 1;
    }

    return rates.rates[toCurrency];

  } catch (error) {
    console.error('❌ Erreur récupération taux:', error);
    return 1;
  }
};

/**
 * Vide le cache des taux de change
 */
export const clearExchangeRateCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY));
    await AsyncStorage.multiRemove(cacheKeys);
    console.log('🗑️ Cache des taux de change vidé');
  } catch (error) {
    console.error('❌ Erreur vidage cache:', error);
  }
};

/**
 * Récupère les taux pour toutes les devises principales
 */
export const getAllRates = async (): Promise<{ [key: string]: number } | null> => {
  try {
    // Utiliser EUR comme base pour avoir tous les taux
    const rates = await fetchExchangeRates('EUR');
    return rates?.rates || null;
  } catch (error) {
    console.error('❌ Erreur récupération de tous les taux:', error);
    return null;
  }
};
