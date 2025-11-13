// src/screens/AddAnnualChargeScreen.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../hooks/useAccounts';
import { useAnnualCharges } from '../hooks/useAnnualCharges';
import { useCategories } from '../hooks/useCategories';
import { CreateAnnualChargeData } from '../types/AnnualCharge';

interface AnnualChargeFormData {
  name: string;
  amount: string;
  dueDate: Date;
  category: string;
  reminderDays: string;
  accountId: string;
  autoDeduct: boolean;
  notes: string;
  paymentMethod: string;
  recurrence: 'yearly' | 'monthly' | 'quarterly' | 'none';
  isIslamic: boolean;
  islamicHolidayId?: string;
  arabicName?: string;
  type: 'normal' | 'obligatory' | 'recommended';
}

const AddAnnualChargeScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { createCharge } = useAnnualCharges();
  
  const [form, setForm] = useState<AnnualChargeFormData>({
    name: '',
    amount: '',
    dueDate: new Date(),
    category: '',
    reminderDays: '7',
    accountId: '',
    autoDeduct: false,
    notes: '',
    paymentMethod: '',
    recurrence: 'yearly',
    isIslamic: route.params?.isIslamic || false,
    type: 'normal'
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDark = theme === 'dark';

  const recurrenceOptions = [
    { value: 'yearly' as const, label: 'Annuelle' },
    { value: 'monthly' as const, label: 'Mensuelle' },
    { value: 'quarterly' as const, label: 'Trimestrielle' },
    { value: 'none' as const, label: 'Ponctuelle' },
  ];

  const paymentMethods = [
    'Prélèvement automatique',
    'Virement',
    'Carte bancaire',
    'Espèces',
    'Chèque',
    'Autre'
  ];

  const islamicTypes = [
    { value: 'normal' as const, label: 'Normale' },
    { value: 'obligatory' as const, label: 'Obligatoire' },
    { value: 'recommended' as const, label: 'Recommandée' },
  ];

  const handleSave = async () => {
    if (!form.name || !form.amount || !form.category || !form.dueDate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    const amount = parseFloat(form.amount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide');
      return;
    }

    if (form.autoDeduct && !form.accountId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un compte pour le prélèvement automatique');
      return;
    }

    setLoading(true);
    try {
      // ✅ CORRECTION : dueDate doit être une string
      const chargeData: CreateAnnualChargeData = {
  name: form.name.trim(),
  amount: amount,
  dueDate: form.dueDate.toISOString().split('T')[0], // ✅ CORRIGÉ
  category: form.category,
  reminderDays: parseInt(form.reminderDays) || 7,
  accountId: form.accountId || undefined,
  autoDeduct: form.autoDeduct,
  notes: form.notes || undefined,
  paymentMethod: form.paymentMethod || undefined,
  recurrence: form.recurrence !== 'none' ? form.recurrence : undefined,
  isIslamic: form.isIslamic,
  arabicName: form.arabicName || undefined,
  type: form.type,
  isActive: true,
  isRecurring: form.recurrence !== 'none',
  isPaid: false
};

      await createCharge(chargeData);
      
      Alert.alert(
        'Succès',
        'Charge annuelle créée avec succès',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error creating annual charge:', error);
      Alert.alert('Erreur', 'Impossible de créer la charge annuelle');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setForm(prev => ({ ...prev, dueDate: selectedDate }));
    }
  };

  const handleAmountChange = (value: string) => {
    let cleanedValue = value.replace(/[^\d,.]/g, '');
    cleanedValue = cleanedValue.replace(',', '.');
    
    const parts = cleanedValue.split('.');
    if (parts.length > 2) {
      cleanedValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    setForm(prev => ({ ...prev, amount: cleanedValue }));
  };

  const formatDisplayAmount = (value: string): string => {
    if (!value) return '';
    const num = parseFloat(value.replace(',', '.'));
    if (isNaN(num)) return '';
    return formatAmount(num);
  };

  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Sélectionner un compte';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sélectionner une catégorie';
  };

  return (
    <SafeAreaView>
      <ScrollView 
        style={[styles.container, isDark && styles.darkContainer]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.darkText]}>
            {form.isIslamic ? 'Nouvelle Charge Islamique' : 'Nouvelle Charge Annuelle'}
          </Text>
        </View>

        {/* Type de charge */}
        {form.isIslamic && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>
              Type de charge islamique *
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typesContainer}>
              {islamicTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    form.type === type.value && styles.typeButtonSelected,
                    isDark && styles.darkTypeButton
                  ]}
                  onPress={() => setForm(prev => ({ ...prev, type: type.value }))}
                >
                  <Text style={[
                    styles.typeText,
                    form.type === type.value && styles.typeTextSelected,
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Nom de la charge */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Nom de la charge *
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={form.name}
            onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
            placeholder="Ex: Assurance habitation, Impôts, Aïd al-Fitr..."
            placeholderTextColor={isDark ? "#888" : "#999"}
          />
        </View>

        {/* Nom arabe (pour charges islamiques) */}
        {form.isIslamic && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>
              Nom arabe (optionnel)
            </Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={form.arabicName}
              onChangeText={(text) => setForm(prev => ({ ...prev, arabicName: text }))}
              placeholder="Ex: عيد الفطر"
              placeholderTextColor={isDark ? "#888" : "#999"}
              textAlign="right"
            />
          </View>
        )}

        {/* Montant */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Montant *
          </Text>
          <View style={styles.amountContainer}>
            <TextInput
              style={[styles.input, styles.amountInput, isDark && styles.darkInput]}
              value={form.amount}
              onChangeText={handleAmountChange}
              placeholder="0,00"
              placeholderTextColor={isDark ? "#888" : "#999"}
              keyboardType="decimal-pad"
            />
          </View>
          {form.amount && (
            <Text style={[styles.hint, isDark && styles.darkSubtext]}>
              {formatDisplayAmount(form.amount)}
            </Text>
          )}
        </View>

        {/* Catégorie */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Catégorie *
          </Text>
          <TouchableOpacity 
            style={[styles.selectButton, isDark && styles.darkInput]}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={[styles.selectButtonText, isDark && styles.darkText]}>
              {form.category ? getCategoryName(form.category) : 'Sélectionner une catégorie'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={isDark ? "#fff" : "#666"} />
          </TouchableOpacity>
        </View>

        {/* Compte associé */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Compte associé
          </Text>
          <TouchableOpacity 
            style={[styles.selectButton, isDark && styles.darkInput]}
            onPress={() => setShowAccountModal(true)}
          >
            <Text style={[styles.selectButtonText, isDark && styles.darkText]}>
              {getAccountName(form.accountId)}
            </Text>
            <Ionicons name="chevron-down" size={20} color={isDark ? "#fff" : "#666"} />
          </TouchableOpacity>
          <Text style={[styles.hint, isDark && styles.darkSubtext]}>
            Sélectionnez le compte pour le prélèvement automatique
          </Text>
        </View>

        {/* Prélèvement automatique */}
        {form.accountId && (
          <View style={styles.inputGroup}>
            <View style={styles.switchContainer}>
              <Text style={[styles.label, isDark && styles.darkText]}>
                Prélèvement automatique
              </Text>
              <TouchableOpacity
                style={[
                  styles.switch,
                  form.autoDeduct && styles.switchActive
                ]}
                onPress={() => setForm(prev => ({ ...prev, autoDeduct: !prev.autoDeduct }))}
              >
                <View style={[
                  styles.switchThumb,
                  form.autoDeduct && styles.switchThumbActive
                ]} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.hint, isDark && styles.darkSubtext]}>
              {form.autoDeduct 
                ? 'Le montant sera automatiquement débité à la date d\'échéance'
                : 'Paiement manuel requis'
              }
            </Text>
          </View>
        )}

        {/* Date d'échéance */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Date d'échéance *
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
            />
          )}
        </View>

        {/* Récurrence */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Récurrence
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recurrenceContainer}>
            {recurrenceOptions.map((recurrence) => (
              <TouchableOpacity
                key={recurrence.value}
                style={[
                  styles.recurrenceButton,
                  form.recurrence === recurrence.value && styles.recurrenceButtonSelected,
                  isDark && styles.darkRecurrenceButton
                ]}
                onPress={() => setForm(prev => ({ ...prev, recurrence: recurrence.value }))}
              >
                <Text style={[
                  styles.recurrenceText,
                  form.recurrence === recurrence.value && styles.recurrenceTextSelected,
                ]}>
                  {recurrence.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Méthode de paiement */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Méthode de paiement
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paymentMethodsContainer}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentMethodButton,
                  form.paymentMethod === method && styles.paymentMethodButtonSelected,
                  isDark && styles.darkPaymentMethodButton
                ]}
                onPress={() => setForm(prev => ({ ...prev, paymentMethod: method }))}
              >
                <Text style={[
                  styles.paymentMethodText,
                  form.paymentMethod === method && styles.paymentMethodTextSelected,
                ]}>
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Jours de rappel */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Rappel (jours avant)
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={form.reminderDays}
            onChangeText={(text) => setForm(prev => ({ ...prev, reminderDays: text.replace(/[^0-9]/g, '') }))}
            placeholder="7"
            placeholderTextColor={isDark ? "#888" : "#999"}
            keyboardType="number-pad"
          />
          <Text style={[styles.hint, isDark && styles.darkSubtext]}>
            Nombre de jours avant l'échéance pour le rappel
          </Text>
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Notes
          </Text>
          <TextInput
            style={[styles.input, styles.textArea, isDark && styles.darkInput]}
            value={form.notes}
            onChangeText={(text) => setForm(prev => ({ ...prev, notes: text }))}
            placeholder="Informations supplémentaires..."
            placeholderTextColor={isDark ? "#888" : "#999"}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Boutons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.cancelButton, isDark && styles.darkCancelButton]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              loading && styles.saveButtonDisabled,
              (!form.name || !form.amount || !form.category) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={loading || !form.name || !form.amount || !form.category}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Création...' : 'Créer'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de sélection de compte */}
      <Modal
        visible={showAccountModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>
              Sélectionner un compte
            </Text>
            <ScrollView style={styles.modalList}>
              {accounts.map(account => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.modalItem,
                    form.accountId === account.id && styles.modalItemSelected,
                    isDark && styles.darkModalItem
                  ]}
                  onPress={() => {
                    setForm(prev => ({ ...prev, accountId: account.id }));
                    setShowAccountModal(false);
                  }}
                >
                  <View style={[styles.colorIndicator, { backgroundColor: account.color }]} />
                  <View style={styles.modalItemInfo}>
                    <Text style={[
                      styles.modalItemText,
                      form.accountId === account.id && styles.modalItemTextSelected,
                      isDark && styles.darkText
                    ]}>
                      {account.name}
                    </Text>
                    <Text style={[styles.modalItemSubtext, isDark && styles.darkSubtext]}>
                      {formatAmount(account.balance)} • {account.type}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={[styles.modalCloseButton, isDark && styles.darkModalCloseButton]}
              onPress={() => setShowAccountModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de sélection de catégorie */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>
              Sélectionner une catégorie
            </Text>
            <ScrollView style={styles.modalList}>
              {expenseCategories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.modalItem,
                    form.category === category.id && styles.modalItemSelected,
                    isDark && styles.darkModalItem
                  ]}
                  onPress={() => {
                    setForm(prev => ({ ...prev, category: category.id }));
                    setShowCategoryModal(false);
                  }}
                >
                  <Ionicons 
                    name={category.icon as any} 
                    size={20} 
                    color={form.category === category.id ? '#fff' : category.color} 
                  />
                  <Text style={[
                    styles.modalItemText,
                    form.category === category.id && styles.modalItemTextSelected,
                    isDark && styles.darkText
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={[styles.modalCloseButton, isDark && styles.darkModalCloseButton]}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  textArea: {
    minHeight: 80,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    paddingLeft: 10,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#000',
  },
  typesContainer: {
    flexDirection: 'row',
  },
  typeButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
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
  recurrenceContainer: {
    flexDirection: 'row',
  },
  recurrenceButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  darkRecurrenceButton: {
    backgroundColor: '#333',
    borderColor: '#555',
  },
  recurrenceButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  recurrenceText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  recurrenceTextSelected: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e9ecef',
    padding: 2,
  },
  switchActive: {
    backgroundColor: '#007AFF',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    transform: [{ translateX: 0 }],
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
  },
  paymentMethodButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  darkPaymentMethodButton: {
    backgroundColor: '#333',
    borderColor: '#555',
  },
  paymentMethodButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  paymentMethodTextSelected: {
    color: '#fff',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  darkModalContent: {
    backgroundColor: '#2c2c2e',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  darkModalItem: {
    backgroundColor: '#38383a',
    borderColor: '#555',
  },
  modalItemSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  modalItemTextSelected: {
    color: '#fff',
  },
  modalItemSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalCloseButton: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  darkModalCloseButton: {
    backgroundColor: '#38383a',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default AddAnnualChargeScreen;