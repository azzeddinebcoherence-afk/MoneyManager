// src/screens/AddDebtScreen.tsx - VERSION CORRIGÉE POUR PHASE 2
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../hooks/useAccounts';
import { useDebts } from '../hooks/useDebts';
import { CreateDebtData, DEBT_TYPES, DebtType } from '../types/Debt';

interface DebtFormData {
  name: string;
  initialAmount: string;
  interestRate: string;
  monthlyPayment: string;
  startDate: Date;
  creditor: string;
  type: DebtType;
  category: string;
  color: string;
  autoPay: boolean;
  paymentAccountId: string;
  paymentDay: number;
}

const AddDebtScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { createDebt } = useDebts();
  const { accounts } = useAccounts();
  
  const [form, setForm] = useState<DebtFormData>({
    name: '',
    initialAmount: '',
    interestRate: '0',
    monthlyPayment: '',
    startDate: new Date(),
    creditor: '',
    type: 'personal',
    category: 'Prêt personnel',
    color: '#007AFF',
    autoPay: false,
    paymentAccountId: '',
    paymentDay: 1,
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDark = theme === 'dark';

  // ✅ CORRECTION : Utiliser DEBT_TYPES depuis les types
  const debtTypes = DEBT_TYPES;

  const categories = [
    { value: 'personal', label: 'Personnel', icon: 'person' },
    { value: 'mortgage', label: 'Hypothèque', icon: 'home' },
    { value: 'car', label: 'Voiture', icon: 'car' },
    { value: 'education', label: 'Études', icon: 'school' },
    { value: 'credit_card', label: 'Carte crédit', icon: 'card' },
    { value: 'other', label: 'Autre', icon: 'ellipsis-horizontal' },
  ];

  const colors = [
    '#007AFF', '#34C759', '#FF3B30', '#FF9500', '#5856D6', 
    '#AF52DE', '#FF2D55', '#32D74B', '#FFD60A'
  ];

  const handleSave = async () => {
    if (!form.name || !form.initialAmount || !form.monthlyPayment || !form.creditor) {
      Alert.alert(t.error, 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (form.autoPay && !form.paymentAccountId) {
      Alert.alert(t.error, 'Veuillez sélectionner un compte de paiement pour le paiement automatique');
      return;
    }

    const initialAmount = parseFloat(form.initialAmount);
    const monthlyPayment = parseFloat(form.monthlyPayment);
    const interestRate = parseFloat(form.interestRate);

    if (isNaN(initialAmount) || initialAmount <= 0) {
      Alert.alert(t.error, 'Le montant initial doit être un nombre positif');
      return;
    }

    if (isNaN(monthlyPayment) || monthlyPayment <= 0) {
      Alert.alert(t.error, 'Le paiement mensuel doit être un nombre positif');
      return;
    }

    if (monthlyPayment > initialAmount) {
      Alert.alert(t.error, 'Le paiement mensuel ne peut pas être supérieur au montant initial');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 [AddDebtScreen] Creating debt...');
      
      // ✅ CORRECTION : Inclure tous les champs requis
      const debtData: CreateDebtData = {
        name: form.name,
        initialAmount: initialAmount,
        interestRate: interestRate,
        monthlyPayment: monthlyPayment,
        startDate: form.startDate.toISOString().split('T')[0],
        creditor: form.creditor,
        type: form.type,
        category: form.category,
        color: form.color,
        autoPay: form.autoPay,
        paymentAccountId: form.autoPay ? form.paymentAccountId : undefined,
        paymentDay: form.autoPay ? form.paymentDay : undefined,
      };

      await createDebt(debtData);
      
      console.log('✅ [AddDebtScreen] Debt created successfully');
      Alert.alert(
        'Succès',
        'Dette ajoutée avec succès',
        [{ text: 'OK', onPress: () => navigation.navigate('DebtsList') }]
      );
    } catch (error) {
      console.error('❌ [AddDebtScreen] Error creating debt:', error);
      Alert.alert(t.error, 'Impossible d\'ajouter la dette');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setForm(prev => ({ ...prev, startDate: selectedDate }));
    }
  };

  const handleAmountChange = (field: 'initialAmount' | 'monthlyPayment', value: string) => {
    let cleanedValue = value.replace(/[^\d,.]/g, '');
    cleanedValue = cleanedValue.replace(',', '.');
    
    const parts = cleanedValue.split('.');
    if (parts.length > 2) {
      cleanedValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    setForm(prev => ({ 
      ...prev, 
      [field]: cleanedValue 
    }));
  };

  const handleInterestRateChange = (value: string) => {
    let cleanedValue = value.replace(/[^\d,.]/g, '');
    cleanedValue = cleanedValue.replace(',', '.');
    
    const parts = cleanedValue.split('.');
    if (parts.length > 2) {
      cleanedValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    setForm(prev => ({ 
      ...prev, 
      interestRate: cleanedValue 
    }));
  };

  const formatDisplayAmount = (value: string): string => {
    if (!value) return '';
    
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    
    return formatAmount(num);
  };

  const formatDisplayPercentage = (value: string): string => {
    if (!value) return '';
    
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num) + '%';
  };

  const calculateMonthlyPayment = (): void => {
    if (!form.initialAmount || !form.interestRate) return;

    const principal = parseFloat(form.initialAmount);
    const annualRate = parseFloat(form.interestRate) / 100;
    const monthlyRate = annualRate / 12;
    
    if (monthlyRate > 0) {
      const monthlyPayment = principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -12));
      if (!isNaN(monthlyPayment) && isFinite(monthlyPayment)) {
        setForm(prev => ({ 
          ...prev, 
          monthlyPayment: monthlyPayment.toFixed(2) 
        }));
      }
    }
  };

  const handleTypeChange = (value: DebtType) => {
    setForm(prev => ({ 
      ...prev, 
      type: value 
    }));
  };

  const handleCategoryChange = (value: string) => {
    setForm(prev => ({ 
      ...prev, 
      category: value 
    }));
  };

  const handleColorChange = (value: string) => {
    setForm(prev => ({ 
      ...prev, 
      color: value 
    }));
  };

  return (
    <SafeAreaView>
      <ScrollView 
        style={[styles.container, isDark && styles.darkContainer]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('DebtsList')}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.darkText]}>
            Nouvelle Dette
          </Text>
        </View>

        {/* Section: Informations de base */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
            📋 Informations de base
          </Text>

        {/* Nom de la dette */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Nom de la dette *
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={form.name}
            onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
            placeholder="Ex: Prêt voiture"
            placeholderTextColor={isDark ? "#888" : "#999"}
          />
        </View>

        {/* Créancier */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Créancier *
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={form.creditor}
            onChangeText={(text) => setForm(prev => ({ ...prev, creditor: text }))}
            placeholder="Ex: Ma banque"
            placeholderTextColor={isDark ? "#888" : "#999"}
          />
        </View>
        </View>

        {/* Section: Type et catégorie */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
            🏷️ Type et catégorie
          </Text>

        {/* Type de dette */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Type de dette
          </Text>
          <View style={[styles.dropdownContainer, isDark && styles.darkInput]}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                Alert.alert(
                  'Sélectionner le type',
                  '',
                  debtTypes.map(type => ({
                    text: type.label,
                    onPress: () => handleTypeChange(type.value)
                  }))
                );
              }}
            >
              <Text style={[styles.dropdownText, isDark && styles.darkText]}>
                {debtTypes.find(t => t.value === form.type)?.label || 'Sélectionner'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={isDark ? "#888" : "#666"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Catégorie */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Catégorie
          </Text>
          <View style={[styles.dropdownContainer, isDark && styles.darkInput]}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                Alert.alert(
                  'Sélectionner la catégorie',
                  '',
                  categories.map(cat => ({
                    text: cat.label,
                    onPress: () => handleCategoryChange(cat.value)
                  }))
                );
              }}
            >
              <View style={styles.dropdownContent}>
                <Ionicons 
                  name={categories.find(c => c.value === form.category)?.icon as any} 
                  size={20} 
                  color={isDark ? "#fff" : "#000"} 
                />
                <Text style={[styles.dropdownText, isDark && styles.darkText]}>
                  {categories.find(c => c.value === form.category)?.label || 'Sélectionner'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={isDark ? "#888" : "#666"} />
            </TouchableOpacity>
          </View>
        </View>
        </View>

        {/* Section: Détails financiers */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
            💰 Détails financiers
          </Text>

        {/* Montant initial */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Montant initial *
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={form.initialAmount}
            onChangeText={(value) => handleAmountChange('initialAmount', value)}
            placeholder="0.00"
            placeholderTextColor={isDark ? "#888" : "#999"}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
          {form.initialAmount && (
            <Text style={[styles.hint, isDark && styles.darkSubtext]}>
              {formatDisplayAmount(form.initialAmount)}
            </Text>
          )}
        </View>

        {/* Taux d'intérêt */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Taux d'intérêt (%)
          </Text>
          <View style={styles.interestContainer}>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={form.interestRate}
              onChangeText={handleInterestRateChange}
              placeholder="0.00"
              placeholderTextColor={isDark ? "#888" : "#999"}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
            <TouchableOpacity 
              style={styles.calculateButton}
              onPress={calculateMonthlyPayment}
            >
              <Text style={styles.calculateButtonText}>Calculer</Text>
            </TouchableOpacity>
          </View>
          {form.interestRate && (
            <Text style={[styles.hint, isDark && styles.darkSubtext]}>
              {formatDisplayPercentage(form.interestRate)}
            </Text>
          )}
        </View>

        {/* Paiement mensuel */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Paiement mensuel *
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={form.monthlyPayment}
            onChangeText={(value) => handleAmountChange('monthlyPayment', value)}
            placeholder="0.00"
            placeholderTextColor={isDark ? "#888" : "#999"}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
          {form.monthlyPayment && (
            <Text style={[styles.hint, isDark && styles.darkSubtext]}>
              {formatDisplayAmount(form.monthlyPayment)}
            </Text>
          )}
        </View>

        {/* Date de début */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Date de début
          </Text>
          <TouchableOpacity 
            style={[styles.dateButton, isDark && styles.darkInput]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={[styles.dateText, isDark && styles.darkText]}>
              {form.startDate.toLocaleDateString('fr-FR')}
            </Text>
            <Ionicons name="calendar" size={20} color={isDark ? "#fff" : "#666"} />
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={form.startDate}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
            />
          )}
          <Text style={[styles.hint, isDark && styles.darkSubtext]}>
            Date à laquelle la dette a commencé
          </Text>
        </View>
        </View>

        {/* Section: Options de paiement */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
            💳 Options de paiement
          </Text>

        {/* Paiement automatique */}
        <View style={[styles.autoPaySection, isDark && styles.darkAutoPaySection]}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabelCompact}>
              <Ionicons name="card-outline" size={20} color={isDark ? "#fff" : "#000"} />
              <Text style={[styles.labelBold, isDark && styles.darkText]}>
                Paiement automatique
              </Text>
            </View>
            <Switch
              value={form.autoPay}
              onValueChange={(value) => setForm(prev => ({ ...prev, autoPay: value }))}
              trackColor={{ false: '#767577', true: '#34C759' }}
              thumbColor={form.autoPay ? '#fff' : '#f4f3f4'}
            />
          </View>

          {form.autoPay && (
            <View style={styles.accountSelectorCompact}>
              <Text style={[styles.sublabel, isDark && styles.darkSubtext]}>
                Sélectionnez le compte qui paiera automatiquement
              </Text>
              
              {/* Jour du mois pour le paiement */}
              <View style={styles.paymentDayContainer}>
                <Text style={[styles.label, isDark && styles.darkText]}>
                  Jour du mois pour le paiement
                </Text>
                <TextInput
                  style={[styles.input, styles.dayInput, isDark && styles.darkInput]}
                  value={form.paymentDay.toString()}
                  onChangeText={(value) => {
                    const day = parseInt(value) || 1;
                    if (day >= 1 && day <= 31) {
                      setForm(prev => ({ ...prev, paymentDay: day }));
                    }
                  }}
                  placeholder="1-31"
                  placeholderTextColor={isDark ? "#888" : "#999"}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={[styles.hint, isDark && styles.darkSubtext]}>
                  Le paiement sera effectué automatiquement le {form.paymentDay} de chaque mois
                </Text>
              </View>

              {accounts.length === 0 ? (
                <Text style={[styles.hint, isDark && styles.darkSubtext]}>
                  Aucun compte disponible. Créez d'abord un compte.
                </Text>
              ) : (
                <View style={styles.accountsRow}>
                  {accounts.map((account) => (
                    <TouchableOpacity
                      key={account.id}
                      style={[
                        styles.accountChip,
                        form.paymentAccountId === account.id && styles.accountChipSelected,
                        isDark && styles.darkAccountChip
                      ]}
                      onPress={() => setForm(prev => ({ ...prev, paymentAccountId: account.id }))}
                    >
                      <Text style={[
                        styles.accountChipText,
                        form.paymentAccountId === account.id && styles.accountChipTextSelected,
                        isDark && styles.darkText
                      ]}>
                        {account.name}
                      </Text>
                      {form.paymentAccountId === account.id && (
                        <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Couleur */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Couleur
          </Text>
          <View style={styles.colorsContainer}>
            {colors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  form.color === color && styles.colorButtonSelected
                ]}
                onPress={() => handleColorChange(color)}
              >
                {form.color === color && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        </View>

        {/* Boutons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.cancelButton, isDark && styles.darkCancelButton]}
            onPress={() => navigation.navigate('DebtsScreen')}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading || !form.name || !form.initialAmount || !form.monthlyPayment || !form.creditor}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Ajout...' : 'Ajouter'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  darkContainer: {
    backgroundColor: '#1c1c1e',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
  },
  darkInput: {
    backgroundColor: '#2c2c2e',
    borderColor: '#444',
    color: '#fff',
  },
  interestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  calculateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  darkTypeButton: {
    backgroundColor: '#333',
    borderColor: '#555',
  },
  typeButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  typeTextSelected: {
    color: '#fff',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  darkCategoryButton: {
    backgroundColor: '#333',
    borderColor: '#555',
  },
  categoryButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '30%',
    minWidth: 100,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderColor: '#007AFF',
  },
  darkCategoryCard: {
    backgroundColor: '#2c2c2e',
  },
  categoryCardText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryCardTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  darkCancelButton: {
    backgroundColor: '#333',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Styles pour le message d'information
  infoMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#007AFF',
    flex: 1,
    fontStyle: 'italic',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
  autoPaySection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  darkAutoPaySection: {
    backgroundColor: '#2c2c2e',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  switchLabelCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  labelBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  sublabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  accountSelector: {
    marginTop: 16,
  },
  accountSelectorCompact: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  paymentDayContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  dayInput: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  accountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  accountChipSelected: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderColor: '#34C759',
  },
  darkAccountChip: {
    backgroundColor: '#1c1c1e',
    borderColor: '#38383a',
  },
  accountChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  accountChipTextSelected: {
    color: '#34C759',
    fontWeight: '600',
  },
  accountButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accountButtonSelected: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderColor: '#34C759',
  },
  darkAccountButton: {
    backgroundColor: '#2c2c2e',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  accountNameSelected: {
    color: '#34C759',
  },
  accountBalance: {
    fontSize: 14,
    color: '#666',
  },
});

export default AddDebtScreen;