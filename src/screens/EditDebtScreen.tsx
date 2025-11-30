// src/screens/EditDebtScreen.tsx - VERSION CORRIGÉE POUR PHASE 2
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
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
import { Debt, DEBT_TYPES, DEBT_CATEGORIES, DebtType, DebtCategory } from '../types/Debt';

interface EditDebtScreenProps {
  navigation: any;
  route: {
    params: {
      debtId: string;
    };
  };
}

// Définir le type du formulaire
interface DebtFormData {
  name: string;
  initialAmount: string;
  currentAmount: string;
  interestRate: string;
  monthlyPayment: string;
  startDate: Date;
  creditor: string;
  type: DebtType;
  status: Debt['status'];
  category: DebtCategory;
  color: string;
  autoPay: boolean;
  paymentAccountId: string;
  paymentDay: number;
}

const EditDebtScreen: React.FC<EditDebtScreenProps> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { debts, updateDebt, loading } = useDebts();
  const { accounts } = useAccounts();
  const { debtId } = route.params;
  const isDark = theme === 'dark';

  const [form, setForm] = useState<DebtFormData>({
    name: '',
    initialAmount: '',
    currentAmount: '',
    interestRate: '',
    monthlyPayment: '',
    startDate: new Date(),
    creditor: '',
    type: 'personal',
    status: 'active',
    category: 'consumption',
    color: '#FFA07A',
    autoPay: false,
    paymentAccountId: '',
    paymentDay: 1,
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ CORRECTION : Utiliser DEBT_TYPES et DEBT_CATEGORIES depuis les types
  const debtTypes = DEBT_TYPES;
  const categories = DEBT_CATEGORIES;

  const statusTypes: { value: Debt['status']; label: string }[] = [
    { value: 'active', label: 'Actif' },
    { value: 'paid', label: 'Payé' },
    { value: 'overdue', label: 'En retard' },
    { value: 'future', label: 'Future' },
  ];

  const colors = [
    '#007AFF', '#34C759', '#FF3B30', '#FF9500', '#5856D6', 
    '#AF52DE', '#FF2D55', '#32D74B', '#FFD60A'
  ];

  useEffect(() => {
    const debt = debts.find(d => d.id === debtId);
    if (debt) {
      setForm({
        name: debt.name,
        initialAmount: debt.initialAmount.toString(),
        currentAmount: debt.currentAmount.toString(),
        interestRate: debt.interestRate.toString(),
        monthlyPayment: debt.monthlyPayment.toString(),
        startDate: new Date(debt.startDate),
        creditor: debt.creditor,
        type: debt.type,
        status: debt.status,
        category: debt.category,
        color: debt.color,
        autoPay: debt.autoPay || false,
        paymentAccountId: debt.paymentAccountId || '',
        paymentDay: debt.paymentDay || 1,
      });
    }
  }, [debts, debtId]);

  const handleSave = async () => {
    if (!form.name || !form.initialAmount || !form.currentAmount || !form.monthlyPayment || !form.creditor) {
      Alert.alert(t.error, 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (form.autoPay && !form.paymentAccountId) {
      Alert.alert(t.error, 'Veuillez sélectionner un compte de paiement pour le paiement automatique');
      return;
    }

    const initialAmount = parseFloat(form.initialAmount);
    const currentAmount = parseFloat(form.currentAmount);
    const monthlyPayment = parseFloat(form.monthlyPayment);
    const interestRate = parseFloat(form.interestRate);

    if (isNaN(initialAmount) || initialAmount <= 0) {
      Alert.alert(t.error, 'Le montant initial doit être un nombre positif');
      return;
    }

    if (isNaN(currentAmount) || currentAmount < 0) {
      Alert.alert(t.error, 'Le montant actuel doit être un nombre positif');
      return;
    }

    if (isNaN(monthlyPayment) || monthlyPayment <= 0) {
      Alert.alert(t.error, 'Le paiement mensuel doit être un nombre positif');
      return;
    }

    if (currentAmount > initialAmount) {
      Alert.alert(t.error, 'Le montant actuel ne peut pas être supérieur au montant initial');
      return;
    }

    setSaving(true);
    try {
      console.log('🔄 [EditDebtScreen] Updating debt...');
      
      const updates = {
        name: form.name,
        initialAmount: initialAmount,
        currentAmount: currentAmount,
        interestRate: interestRate,
        monthlyPayment: monthlyPayment,
        startDate: form.startDate.toISOString().split('T')[0],
        creditor: form.creditor,
        type: form.type,
        status: form.status,
        category: form.category,
        color: form.color,
        autoPay: form.autoPay,
        paymentAccountId: form.autoPay ? form.paymentAccountId : undefined,
        paymentDay: form.autoPay ? form.paymentDay : undefined,
      };

      await updateDebt(debtId, updates);
      
      console.log('✅ [EditDebtScreen] Debt updated successfully');
      Alert.alert(
        'Succès',
        'Dette modifiée avec succès',
        [{ text: 'OK', onPress: () => navigation.navigate('DebtsList') }]
      );
    } catch (error) {
      console.error('❌ [EditDebtScreen] Error updating debt:', error);
      Alert.alert(t.error, 'Impossible de modifier la dette');
    } finally {
      setSaving(false);
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setForm(prev => ({ ...prev, startDate: selectedDate }));
    }
  };

  const handleAmountChange = (field: 'initialAmount' | 'currentAmount' | 'monthlyPayment', value: string) => {
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

  const handleTypeChange = (value: DebtType) => {
    setForm(prev => ({ 
      ...prev, 
      type: value 
    }));
  };

  const handleStatusChange = (value: Debt['status']) => {
    setForm(prev => ({ 
      ...prev, 
      status: value 
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer, styles.center]}>
        <Text style={[styles.loadingText, isDark && styles.darkText]}>
          Chargement...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={[styles.container, isDark && styles.darkContainer]}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.navigate('DebtsList')}
            >
              <Ionicons name="close" size={24} color={isDark ? "#fff" : "#000"} />
            </TouchableOpacity>
            <Text style={[styles.title, isDark && styles.darkText]}>
              Modifier la Dette
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
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.chipsContainer}
          >
            {debtTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.chip,
                  isDark && styles.chipDark,
                  form.type === type.value && styles.chipSelected,
                  form.type === type.value && { borderColor: form.color }
                ]}
                onPress={() => handleTypeChange(type.value)}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={18} 
                  color={form.type === type.value ? form.color : (isDark ? "#888" : "#666")} 
                />
                <Text style={[
                  styles.chipText,
                  isDark && styles.chipTextDark,
                  form.type === type.value && styles.chipTextSelected,
                  form.type === type.value && { color: form.color }
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Statut */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Statut
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.chipsContainer}
          >
            {statusTypes.map((status) => (
              <TouchableOpacity
                key={status.value}
                style={[
                  styles.chip,
                  isDark && styles.chipDark,
                  form.status === status.value && styles.chipSelected,
                  form.status === status.value && { borderColor: form.color }
                ]}
                onPress={() => handleStatusChange(status.value)}
              >
                <Text style={[
                  styles.chipText,
                  isDark && styles.chipTextDark,
                  form.status === status.value && styles.chipTextSelected,
                  form.status === status.value && { color: form.color }
                ]}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Catégorie */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Catégorie
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.chipsContainer}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.chip,
                  isDark && styles.chipDark,
                  form.category === cat.value && styles.chipSelected,
                  form.category === cat.value && { borderColor: cat.color }
                ]}
                onPress={() => handleCategoryChange(cat.value)}
              >
                <Ionicons 
                  name={cat.icon as any} 
                  size={18} 
                  color={form.category === cat.value ? cat.color : (isDark ? "#888" : "#666")} 
                />
                <Text style={[
                  styles.chipText,
                  isDark && styles.chipTextDark,
                  form.category === cat.value && styles.chipTextSelected,
                  form.category === cat.value && { color: cat.color }
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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

        {/* Montant actuel */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Montant actuel *
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={form.currentAmount}
            onChangeText={(value) => handleAmountChange('currentAmount', value)}
            placeholder="0.00"
            placeholderTextColor={isDark ? "#888" : "#999"}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
          {form.currentAmount && (
            <Text style={[styles.hint, isDark && styles.darkSubtext]}>
              {formatDisplayAmount(form.currentAmount)}
            </Text>
          )}
        </View>

        {/* Taux d'intérêt */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Taux d'intérêt (%)
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={form.interestRate}
            onChangeText={handleInterestRateChange}
            placeholder="0.00"
            placeholderTextColor={isDark ? "#888" : "#999"}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
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
            onPress={() => navigation.navigate('Debts', { screen: 'DebtsList' })}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving || !form.name || !form.initialAmount || !form.currentAmount || !form.monthlyPayment || !form.creditor}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
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
    padding: 16,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 16,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
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
    marginTop: 24,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 20,
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
  horizontalScroll: {
    marginTop: 8,
  },
  chipsContainer: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  chipDark: {
    backgroundColor: '#1c1c1e',
    borderColor: '#38383a',
  },
  chipSelected: {
    backgroundColor: 'rgba(52, 199, 89, 0.05)',
    borderWidth: 2,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  chipTextDark: {
    color: '#fff',
  },
  chipTextSelected: {
    fontWeight: '600',
  },
});

export default EditDebtScreen;