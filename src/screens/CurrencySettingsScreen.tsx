// src/screens/CurrencySettingsScreen.tsx - VERSION AVEC API TEMPS RÉEL
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CURRENCIES, useCurrency } from '../context/CurrencyContext';
import { useRefresh } from '../context/RefreshContext';
import { useTheme } from '../context/ThemeContext';
import { convertCurrency, getAllRates } from '../services/exchangeRateService';

const { width } = Dimensions.get('window');

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

const CurrencySettingsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { triggerRefresh } = useRefresh();
  const isDark = theme === 'dark';

  // États pour le convertisseur
  const [amount, setAmount] = useState('1000');
  const [sourceCurrency, setSourceCurrency] = useState('MAD');
  const [targetCurrency, setTargetCurrency] = useState('USD');
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  
  // États pour les taux et le chargement
  const [allRates, setAllRates] = useState<{ [key: string]: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // États pour les modals de sélection
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showTargetPicker, setShowTargetPicker] = useState(false);

  const currencies: CurrencyOption[] = [
    { code: 'MAD', name: 'Dirham Marocain', symbol: 'Dh', flag: '🇲🇦' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'USD', name: 'Dollar américain', symbol: '$', flag: '🇺🇸' },
    { code: 'GBP', name: 'Livre sterling', symbol: '£', flag: '🇬🇧' },
    { code: 'CHF', name: 'Franc suisse', symbol: 'CHF', flag: '🇨🇭' },
    { code: 'JPY', name: 'Yen japonais', symbol: '¥', flag: '🇯🇵' },
    { code: 'CAD', name: 'Dollar canadien', symbol: 'C$', flag: '🇨🇦' },
    { code: 'AUD', name: 'Dollar australien', symbol: 'A$', flag: '🇦🇺' },
    { code: 'CNY', name: 'Yuan chinois', symbol: '¥', flag: '🇨🇳' },
    { code: 'SEK', name: 'Couronne suédoise', symbol: 'kr', flag: '🇸🇪' },
    { code: 'NOK', name: 'Couronne norvégienne', symbol: 'kr', flag: '🇳🇴' },
  ];

  // Charger les taux au montage
  useEffect(() => {
    loadExchangeRates();
  }, []);

  // Calculer la conversion quand les valeurs changent
  useEffect(() => {
    performConversion();
  }, [amount, sourceCurrency, targetCurrency, allRates]);

  const loadExchangeRates = async () => {
    setIsLoading(true);
    try {
      const rates = await getAllRates();
      if (rates) {
        setAllRates(rates);
        setLastUpdate(new Date());
        console.log('✅ Taux de change chargés avec succès');
      }
    } catch (error) {
      console.error('❌ Erreur chargement taux:', error);
      Alert.alert(
        'Erreur',
        'Impossible de charger les taux de change. Vérifiez votre connexion Internet.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const performConversion = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      setConvertedAmount(0);
      setExchangeRate(0);
      return;
    }

    try {
      const amountNum = parseFloat(amount);
      const result = await convertCurrency(amountNum, sourceCurrency, targetCurrency);
      setConvertedAmount(result);
      
      // Calculer le taux de change
      if (amountNum !== 0) {
        setExchangeRate(result / amountNum);
      }
    } catch (error) {
      console.error('❌ Erreur conversion:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadExchangeRates();
    setIsRefreshing(false);
  }, []);

  const handleCurrencyChange = async (currencyCode: string) => {
    const selectedCurrency = CURRENCIES[currencyCode];
    if (selectedCurrency) {
      try {
        await setCurrency(selectedCurrency);
        triggerRefresh();
        
        Alert.alert(
          'Devise changée',
          `La devise a été changée en ${selectedCurrency.name}. Tous vos montants sont maintenant affichés en ${selectedCurrency.symbol}.`,
          [{ text: 'OK' }]
        );
        
        console.log(`✅ Devise changée en ${selectedCurrency.code}`);
      } catch (error) {
        console.error('❌ Erreur changement devise:', error);
        Alert.alert('Erreur', 'Impossible de changer la devise.', [{ text: 'OK' }]);
      }
    }
  };

  const swapCurrencies = () => {
    const temp = sourceCurrency;
    setSourceCurrency(targetCurrency);
    setTargetCurrency(temp);
  };

  // Modal de sélection de devise
  const CurrencyPickerModal = ({ 
    visible, 
    onClose, 
    onSelect, 
    selectedCode 
  }: { 
    visible: boolean; 
    onClose: () => void; 
    onSelect: (code: string) => void; 
    selectedCode: string;
  }) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDark && styles.darkCard]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>Sélectionner une devise</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalList}>
            {currencies.map((curr) => (
              <TouchableOpacity
                key={curr.code}
                style={[
                  styles.modalItem,
                  isDark && styles.darkModalItem,
                  curr.code === selectedCode && styles.selectedModalItem
                ]}
                onPress={() => {
                  onSelect(curr.code);
                  onClose();
                }}
              >
                <Text style={styles.currencyFlag}>{curr.flag}</Text>
                <View style={styles.modalItemText}>
                  <Text style={[styles.modalItemName, isDark && styles.darkText]}>
                    {curr.name}
                  </Text>
                  <Text style={[styles.modalItemCode, isDark && styles.darkSubtext]}>
                    {curr.code} • {curr.symbol}
                  </Text>
                </View>
                {curr.code === selectedCode && (
                  <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.darkHeader]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>Devises</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons name="refresh" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Devise actuelle */}
        <View style={[styles.currentCurrencyCard, isDark && styles.darkCard]}>
          <View style={styles.currentCurrencyHeader}>
            <Ionicons name="wallet" size={24} color="#007AFF" />
            <Text style={[styles.currentCurrencyLabel, isDark && styles.darkSubtext]}>
              DEVISE PRINCIPALE
            </Text>
          </View>
          <View style={styles.currentCurrencyContent}>
            <View style={styles.currentCurrencyInfo}>
              <Text style={styles.currencyEmojiLarge}>
                {currencies.find(c => c.code === currency.code)?.flag || '💰'}
              </Text>
              <View>
                <Text style={[styles.currentCurrencyCode, isDark && styles.darkText]}>
                  {currency.code}
                </Text>
                <Text style={[styles.currentCurrencyName, isDark && styles.darkSubtext]}>
                  {currencies.find(c => c.code === currency.code)?.name || currency.name}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            </View>
          </View>
        </View>

        {/* Statut de connexion */}
        {lastUpdate && (
          <View style={[styles.statusCard, isDark && styles.darkStatusCard]}>
            <Ionicons 
              name={allRates ? "cloud-done" : "cloud-offline"} 
              size={16} 
              color={allRates ? "#34C759" : "#EF4444"} 
            />
            <Text style={[styles.statusText, isDark && styles.darkSubtext]}>
              {allRates 
                ? `Taux mis à jour ${lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                : 'Hors ligne - Utilisation du cache'
              }
            </Text>
          </View>
        )}

        {/* Convertisseur en temps réel */}
        <View style={[styles.converterCard, isDark && styles.darkCard]}>
          <View style={styles.converterHeader}>
            <Ionicons name="swap-horizontal" size={24} color="#007AFF" />
            <Text style={[styles.converterTitle, isDark && styles.darkText]}>
              Convertisseur en temps réel
            </Text>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={[styles.loadingText, isDark && styles.darkSubtext]}>
                Chargement des taux de change...
              </Text>
            </View>
          ) : (
            <>
              {/* Montant source */}
              <View style={styles.converterRow}>
                <View style={styles.converterInputGroup}>
                  <Text style={[styles.inputLabel, isDark && styles.darkSubtext]}>Montant</Text>
                  <TextInput
                    style={[styles.amountInput, isDark && styles.darkInput, isDark && styles.darkText]}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="1000"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                  />
                </View>
                
                <TouchableOpacity
                  style={[styles.currencySelector, isDark && styles.darkSelector]}
                  onPress={() => setShowSourcePicker(true)}
                >
                  <Text style={styles.currencySelectorFlag}>
                    {currencies.find(c => c.code === sourceCurrency)?.flag}
                  </Text>
                  <Text style={[styles.currencySelectorCode, isDark && styles.darkText]}>
                    {sourceCurrency}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
              </View>

              {/* Bouton swap */}
              <View style={styles.swapContainer}>
                <TouchableOpacity style={styles.swapButton} onPress={swapCurrencies}>
                  <Ionicons name="swap-vertical" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>

              {/* Montant cible */}
              <View style={styles.converterRow}>
                <View style={[styles.resultBox, isDark && styles.darkResultBox]}>
                  <Text style={[styles.resultLabel, isDark && styles.darkSubtext]}>Résultat</Text>
                  <Text style={[styles.resultAmount, isDark && styles.darkText]}>
                    {convertedAmount.toLocaleString('fr-FR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.currencySelector, isDark && styles.darkSelector]}
                  onPress={() => setShowTargetPicker(true)}
                >
                  <Text style={styles.currencySelectorFlag}>
                    {currencies.find(c => c.code === targetCurrency)?.flag}
                  </Text>
                  <Text style={[styles.currencySelectorCode, isDark && styles.darkText]}>
                    {targetCurrency}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
              </View>

              {/* Taux de change */}
              {exchangeRate > 0 && (
                <View style={[styles.rateInfo, isDark && styles.darkRateInfo]}>
                  <Ionicons name="information-circle" size={16} color="#007AFF" />
                  <Text style={[styles.rateText, isDark && styles.darkSubtext]}>
                    1 {sourceCurrency} = {exchangeRate.toFixed(4)} {targetCurrency}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Changer la devise principale */}
        <View style={styles.section}>
          <View style={[styles.warningBox, isDark && styles.darkWarningBox]}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={[styles.warningText, isDark && styles.darkText]}>
              Changer la devise principale affectera l'affichage de tous vos montants dans l'application.
            </Text>
          </View>

          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
            Changer la devise principale
          </Text>

          {currencies.map((curr) => (
            <TouchableOpacity
              key={curr.code}
              style={[
                styles.currencyItem,
                isDark && styles.darkCurrencyItem,
                curr.code === currency.code && styles.selectedCurrency
              ]}
              onPress={() => handleCurrencyChange(curr.code)}
            >
              <View style={styles.currencyItemLeft}>
                <Text style={styles.currencyItemFlag}>{curr.flag}</Text>
                <View>
                  <Text style={[styles.currencyItemName, isDark && styles.darkText]}>
                    {curr.name}
                  </Text>
                  <Text style={[styles.currencyItemCode, isDark && styles.darkSubtext]}>
                    {curr.code} • {curr.symbol}
                  </Text>
                </View>
              </View>
              {curr.code === currency.code && (
                <Ionicons name="checkmark-circle" size={24} color="#34C759" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Modals de sélection */}
      <CurrencyPickerModal
        visible={showSourcePicker}
        onClose={() => setShowSourcePicker(false)}
        onSelect={setSourceCurrency}
        selectedCode={sourceCurrency}
      />
      <CurrencyPickerModal
        visible={showTargetPicker}
        onClose={() => setShowTargetPicker(false)}
        onSelect={setTargetCurrency}
        selectedCode={targetCurrency}
      />
    </View>
  );
};

export default CurrencySettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  darkContainer: {
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  darkHeader: {
    backgroundColor: '#1C1C1E',
    borderBottomColor: '#2C2C2E',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  refreshButton: {
    padding: 8,
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  
  // Devise actuelle
  currentCurrencyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  darkCard: {
    backgroundColor: '#1C1C1E',
  },
  currentCurrencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  currentCurrencyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.5,
  },
  currentCurrencyContent: {
    gap: 12,
  },
  currentCurrencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencyEmojiLarge: {
    fontSize: 32,
  },
  currentCurrencyCode: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  currentCurrencyName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  
  // Statut
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  darkStatusCard: {
    backgroundColor: '#1C2D1F',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  
  // Convertisseur
  converterCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  converterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  converterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  converterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  converterInputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  amountInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    height: 52,
  },
  darkInput: {
    backgroundColor: '#2C2C2E',
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
    minWidth: 110,
  },
  darkSelector: {
    backgroundColor: '#2C2C2E',
  },
  currencySelectorFlag: {
    fontSize: 18,
  },
  currencySelectorCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  swapContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  swapButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 24,
    padding: 12,
  },
  resultBox: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    height: 52,
  },
  darkResultBox: {
    backgroundColor: '#2C2C2E',
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  resultAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  rateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  darkRateInfo: {
    backgroundColor: '#1C2D3A',
  },
  rateText: {
    fontSize: 12,
    color: '#666',
  },
  
  // Section
  section: {
    marginTop: 8,
    marginBottom: 32,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  darkWarningBox: {
    backgroundColor: '#3A2F1C',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#000',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  
  // Liste des devises
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  darkCurrencyItem: {
    backgroundColor: '#1C1C1E',
  },
  selectedCurrency: {
    borderWidth: 2,
    borderColor: '#34C759',
  },
  currencyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  currencyItemFlag: {
    fontSize: 28,
  },
  currencyItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  currencyItemCode: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  currencyFlag: {
    fontSize: 24,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalList: {
    padding: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    gap: 12,
  },
  darkModalItem: {
    backgroundColor: '#2C2C2E',
  },
  selectedModalItem: {
    backgroundColor: '#E3F2FD',
  },
  modalItemText: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  modalItemCode: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
