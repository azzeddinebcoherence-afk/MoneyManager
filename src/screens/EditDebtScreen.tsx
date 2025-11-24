// src/screens/EditDebtScreen.tsx - VERSION CORRIGÉE POUR PHASE 2
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useDebts } from '../hooks/useDebts';
import { Debt, DEBT_TYPES, DebtType } from '../types/Debt';

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
  dueDate: Date;
  startDate: Date;
  creditor: string;
  type: DebtType;
  status: Debt['status'];
  category: string;
  color: string;
}

const EditDebtScreen: React.FC<EditDebtScreenProps> = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { debts, updateDebt, loading } = useDebts();
  const { debtId } = route.params;
  const isDark = theme === 'dark';

  const [form, setForm] = useState<DebtFormData>({
    name: '',
    initialAmount: '',
    currentAmount: '',
    interestRate: '',
    monthlyPayment: '',
    dueDate: new Date(),
    startDate: new Date(),
    creditor: '',
    type: 'personal',
    status: 'active',
    category: 'Prêt personnel',
    color: '#007AFF',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ CORRECTION : Utiliser DEBT_TYPES depuis les types
  const debtTypes = DEBT_TYPES;

  const statusTypes: { value: Debt['status']; label: string }[] = [
    { value: 'active', label: 'Actif' },
    { value: 'paid', label: 'Payé' },
    { value: 'overdue', label: 'En retard' },
    { value: 'future', label: 'Future' },
  ];

  const categories = [
    'Prêt personnel',
    'Hypothèque', 
    'Voiture',
    'Éducation',
    'Carte de crédit',
    'Médical',
    'Familial',
    'Autre'
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
        dueDate: new Date(debt.dueDate),
        startDate: new Date(debt.startDate),
        creditor: debt.creditor,
        type: debt.type,
        status: debt.status,
        category: debt.category,
        color: debt.color,
      });
    }
  }, [debts, debtId]);

  const handleSave = async () => {
    if (!form.name || !form.initialAmount || !form.currentAmount || !form.monthlyPayment || !form.creditor) {
      Alert.alert(t.error, 'Veuillez remplir tous les champs obligatoires');
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
        dueDate: form.dueDate.toISOString().split('T')[0],
        startDate: form.startDate.toISOString().split('T')[0],
        creditor: form.creditor,
        type: form.type,
        status: form.status,
        category: form.category,
        color: form.color,
      };

      await updateDebt(debtId, updates);
      
      console.log('✅ [EditDebtScreen] Debt updated successfully');
      Alert.alert(
        'Succès',
        'Dette modifiée avec succès',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('❌ [EditDebtScreen] Error updating debt:', error);
      Alert.alert(t.error, 'Impossible de modifier la dette');
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setForm(prev => ({ ...prev, dueDate: selectedDate }));
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

  // ✅ COMPOSANT D'INFORMATION SUR LE SYSTÈME D'ÉCHÉANCES
  const EligibilityInfoMessage = () => (
    <View style={styles.infoMessage}>
      <Text style={styles.infoIcon}>💡</Text>
      <Text style={styles.infoText}>
        Le paiement sera uniquement autorisé pendant le mois d'échéance
      </Text>
    </View>
  );

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
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
            </TouchableOpacity>
            <Text style={[styles.title, isDark && styles.darkText]}>
              Modifier la Dette
            </Text>
          </View>

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

        {/* Type de dette */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Type de dette
          </Text>
          <View style={styles.typesContainer}>
            {debtTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeButton,
                  form.type === type.value && styles.typeButtonSelected,
                  isDark && styles.darkTypeButton
                ]}
                onPress={() => handleTypeChange(type.value)}
              >
                <Text style={[
                  styles.typeText,
                  form.type === type.value && styles.typeTextSelected,
                  isDark && styles.darkText
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Statut */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Statut
          </Text>
          <View style={styles.typesContainer}>
            {statusTypes.map((status) => (
              <TouchableOpacity
                key={status.value}
                style={[
                  styles.typeButton,
                  form.status === status.value && styles.typeButtonSelected,
                  isDark && styles.darkTypeButton
                ]}
                onPress={() => handleStatusChange(status.value)}
              >
                <Text style={[
                  styles.typeText,
                  form.status === status.value && styles.typeTextSelected,
                  isDark && styles.darkText
                ]}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Catégorie */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Catégorie
          </Text>
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  form.category === category && styles.categoryButtonSelected,
                  isDark && styles.darkCategoryButton
                ]}
                onPress={() => handleCategoryChange(category)}
              >
                <Text style={[
                  styles.categoryText,
                  form.category === category && styles.categoryTextSelected,
                  isDark && styles.darkText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
              maximumDate={form.dueDate}
            />
          )}
        </View>

        {/* Date d'échéance */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Date d'échéance
          </Text>
          <TouchableOpacity 
            style={[styles.dateButton, isDark && styles.darkInput]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateText, isDark && styles.darkText]}>
              {form.dueDate.toLocaleDateString('fr-FR')}
            </Text>
            <Ionicons name="calendar" size={20} color={isDark ? "#fff" : "#666"} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={form.dueDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={form.startDate}
            />
          )}
          
          {/* ✅ MESSAGE D'INFORMATION SUR LES ÉCHÉANCES */}
          <EligibilityInfoMessage />
          
          <Text style={[styles.hint, isDark && styles.darkSubtext]}>
            Mois d'échéance: {form.dueDate.toISOString().slice(0, 7)}
          </Text>
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

        {/* Boutons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.cancelButton, isDark && styles.darkCancelButton]}
            onPress={() => navigation.goBack()}
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
    padding: 20,
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
});

export default EditDebtScreen;