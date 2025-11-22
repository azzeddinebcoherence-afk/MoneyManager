// src/screens/CurrencySettingsScreen.tsx - CONNECTÉ AU CONTEXTE
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { CURRENCIES, useCurrency } from '../context/CurrencyContext'; // ✅ IMPORT DU CONTEXTE
import { useTheme } from '../context/ThemeContext';

const CurrencySettingsScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { currency, setCurrency, formatAmount } = useCurrency(); // ✅ UTILISATION DU CONTEXTE
  
  const [exchangeRates] = useState({
    EUR: 1,
    USD: 1.08,
    GBP: 0.85,
    MAD: 10.8,
    CAD: 1.46,
    CHF: 0.95,
    JPY: 157.5,
    CNY: 7.8,
    AUD: 1.65,
    RUB: 95.4,
    INR: 89.2,
    BRL: 5.4,
  });

  const isDark = theme === 'dark';

  // Liste complète des devises avec drapeaux et symboles - SYNCHRONISÉE AVEC LE CONTEXTE
  const currencies = [
    {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      flag: '🇪🇺',
      description: 'Zone Euro',
      isPopular: true,
    },
    {
      code: 'USD',
      name: 'Dollar US',
      symbol: '$',
      flag: '🇺🇸',
      description: 'États-Unis',
      isPopular: true,
    },
    {
      code: 'MAD',
      name: 'Dirham Marocain',
      symbol: 'MAD',
      flag: '🇲🇦',
      description: 'Maroc',
      isPopular: true,
    },
    {
      code: 'GBP',
      name: 'Livre Sterling',
      symbol: '£',
      flag: '🇬🇧',
      description: 'Royaume-Uni',
      isPopular: true,
    },
    {
      code: 'CAD',
      name: 'Dollar Canadien',
      symbol: 'C$',
      flag: '🇨🇦',
      description: 'Canada',
      isPopular: false,
    },
    {
      code: 'CHF',
      name: 'Franc Suisse',
      symbol: 'CHF',
      flag: '🇨🇭',
      description: 'Suisse',
      isPopular: false,
    },
    {
      code: 'JPY',
      name: 'Yen Japonais',
      symbol: '¥',
      flag: '🇯🇵',
      description: 'Japon',
      isPopular: false,
    },
    {
      code: 'CNY',
      name: 'Yuan Chinois',
      symbol: '¥',
      flag: '🇨🇳',
      description: 'Chine',
      isPopular: false,
    },
    {
      code: 'AUD',
      name: 'Dollar Australien',
      symbol: 'A$',
      flag: '🇦🇺',
      description: 'Australie',
      isPopular: false,
    },
    {
      code: 'RUB',
      name: 'Rouble Russe',
      symbol: '₽',
      flag: '🇷🇺',
      description: 'Russie',
      isPopular: false,
    },
    {
      code: 'INR',
      name: 'Roupie Indienne',
      symbol: '₹',
      flag: '🇮🇳',
      description: 'Inde',
      isPopular: false,
    },
    {
      code: 'BRL',
      name: 'Real Brésilien',
      symbol: 'R$',
      flag: '🇧🇷',
      description: 'Brésil',
      isPopular: false,
    },
  ];

  const handleCurrencySelect = (currencyCode: string) => {
    const newCurrency = CURRENCIES[currencyCode];
    if (newCurrency) {
      setCurrency(newCurrency); // ✅ UTILISE LE CONTEXTE POUR CHANGER LA DEVISE
      
      Alert.alert(
        '✅ Devise modifiée',
        `La devise principale a été changée pour ${newCurrency.name} (${newCurrency.symbol})`,
        [{ text: 'OK' }]
      );
      
      console.log(`💰 Devise changée: ${currencyCode}`);
    }
  };

  const getConversionRate = (targetCurrency: string) => {
    return exchangeRates[targetCurrency as keyof typeof exchangeRates] || 1;
  };

  const CurrencyCard = ({ currency }: { currency: typeof currencies[0] }) => {
    const isSelected = currency.code === currency.code; // ✅ UTILISE LA DEVISE DU CONTEXTE
    const conversionRate = getConversionRate(currency.code);
    const sampleAmount = 1000;

    return (
      <TouchableOpacity
        style={[
          styles.currencyCard,
          isSelected && styles.currencyCardSelected,
          isDark && styles.darkCurrencyCard,
          isSelected && isDark && styles.darkCurrencyCardSelected,
        ]}
        onPress={() => handleCurrencySelect(currency.code)}
      >
        <View style={styles.currencyHeader}>
          <View style={styles.currencyInfo}>
            <View style={styles.currencyFlagName}>
              <Text style={styles.flag}>{currency.flag}</Text>
              <View style={styles.currencyText}>
                <Text style={[styles.currencyName, isDark && styles.darkText]}>
                  {currency.name}
                </Text>
                <Text style={[styles.currencyCode, isDark && styles.darkSubtext]}>
                  {currency.code} • {currency.description}
                </Text>
              </View>
            </View>
            
            {currency.isPopular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>Populaire</Text>
              </View>
            )}
          </View>

          <View style={[
            styles.radioButton,
            isSelected && styles.radioButtonSelected
          ]}>
            {isSelected && (
              <View style={styles.radioButtonInner} />
            )}
          </View>
        </View>

        <View style={styles.conversionInfo}>
          <Text style={[styles.conversionText, isDark && styles.darkSubtext]}>
            Taux: 1 EUR = {conversionRate} {currency.code}
          </Text>
          <Text style={[styles.sampleAmount, isDark && styles.darkText]}>
            {formatAmount(1000, false)} ≈ {formatAmount(1000 * conversionRate, false)} {currency.code}
          </Text>
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            <Text style={styles.selectedText}>Devise active</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView>
      <View style={[styles.container, isDark && styles.darkContainer]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.darkText]}>
            Devises
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Bannière d'information */}
          <View style={[styles.infoBanner, isDark && styles.darkInfoBanner]}>
            <Ionicons name="information-circle" size={24} color="#007AFF" />
            <View style={styles.infoText}>
              <Text style={[styles.infoTitle, isDark && styles.darkText]}>
                Devise principale
              </Text>
              <Text style={[styles.infoDescription, isDark && styles.darkSubtext]}>
                Tous les montants seront affichés dans la devise sélectionnée. Les taux de change sont indicatifs.
              </Text>
            </View>
          </View>

          {/* Devise actuelle */}
          <View style={styles.currentCurrencySection}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
              Devise Actuelle
            </Text>
            <View style={[styles.currentCurrencyCard, isDark && styles.darkCard]}>
              <View style={styles.currentCurrencyHeader}>
                <Text style={styles.flag}>
                  {currencies.find(c => c.code === currency.code)?.flag || '💰'}
                </Text>
                <View style={styles.currentCurrencyInfo}>
                  <Text style={[styles.currentCurrencyName, isDark && styles.darkText]}>
                    {currency.name}
                  </Text>
                  <Text style={[styles.currentCurrencyCode, isDark && styles.darkSubtext]}>
                    {currency.code} • Actuellement sélectionnée
                  </Text>
                </View>
              </View>
              <View style={styles.currentCurrencyAmount}>
                <Text style={[styles.currentCurrencySymbol, isDark && styles.darkText]}>
                  {currency.symbol}
                </Text>
                <Text style={[styles.currentCurrencyExample, isDark && styles.darkText]}>
                  {formatAmount(1250.75)}
                </Text>
              </View>
            </View>
          </View>

          {/* Devises populaires */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
              Devises Populaires
            </Text>
            <View style={styles.currenciesList}>
              {currencies
                .filter(currencyItem => currencyItem.isPopular)
                .map(currencyItem => (
                  <CurrencyCard key={currencyItem.code} currency={currencyItem} />
                ))}
            </View>
          </View>

          {/* Toutes les devises */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
              Toutes les Devises
            </Text>
            <View style={styles.currenciesList}>
              {currencies
                .filter(currencyItem => !currencyItem.isPopular)
                .map(currencyItem => (
                  <CurrencyCard key={currencyItem.code} currency={currencyItem} />
                ))}
            </View>
          </View>

          {/* Notes importantes */}
          <View style={[styles.notesSection, isDark && styles.darkCard]}>
            <Text style={[styles.notesTitle, isDark && styles.darkText]}>
              💡 Important
            </Text>
            <Text style={[styles.notesText, isDark && styles.darkSubtext]}>
              • Le changement de devise affecte toute l'application{'\n'}
              • Les montants existants sont convertis automatiquement{'\n'}
              • Les taux de change sont mis à jour périodiquement{'\n'}
              • Le support MAD est maintenant disponible !
            </Text>
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// Les styles restent exactement les mêmes que votre version
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  darkContainer: {
    backgroundColor: '#1c1c1e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  darkInfoBanner: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  currentCurrencySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  currentCurrencyCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkCard: {
    backgroundColor: '#2c2c2e',
  },
  currentCurrencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  flag: {
    fontSize: 32,
    marginRight: 12,
  },
  currentCurrencyInfo: {
    flex: 1,
  },
  currentCurrencyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  currentCurrencyCode: {
    fontSize: 14,
    color: '#666',
  },
  currentCurrencyAmount: {
    alignItems: 'center',
  },
  currentCurrencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  currentCurrencyExample: {
    fontSize: 16,
    color: '#000',
  },
  section: {
    marginBottom: 24,
  },
  currenciesList: {
    gap: 12,
  },
  currencyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  darkCurrencyCard: {
    backgroundColor: '#2c2c2e',
  },
  currencyCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  darkCurrencyCardSelected: {
    borderColor: '#0A84FF',
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
  },
  currencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyFlagName: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyText: {
    flex: 1,
    marginLeft: 12,
  },
  currencyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  currencyCode: {
    fontSize: 12,
    color: '#666',
  },
  popularBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioButtonSelected: {
    borderColor: '#007AFF',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  conversionInfo: {
    marginBottom: 8,
  },
  conversionText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  sampleAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  selectedText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
    marginLeft: 4,
  },
  notesSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  spacer: {
    height: 40,
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default CurrencySettingsScreen;