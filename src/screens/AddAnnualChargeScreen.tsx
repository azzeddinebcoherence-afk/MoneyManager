// src/screens/AddAnnualChargeScreen.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
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
import { useDesignSystem } from '../context/ThemeContext';
import { useAccounts } from '../hooks/useAccounts';
import { useAnnualCharges } from '../hooks/useAnnualCharges';
import { CreateAnnualChargeData, getAllSubcategories } from '../types/AnnualCharge';

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
  const { t } = useLanguage();
  const { colors } = useDesignSystem();
  const { formatAmount } = useCurrency();
  const { accounts } = useAccounts();
  const subcategories = getAllSubcategories();
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

  const recurrenceOptions = [
    { value: 'yearly' as const, label: 'Annuelle' },
    { value: 'monthly' as const, label: 'Mensuelle' },
    { value: 'quarterly' as const, label: 'Trimestrielle' },
    { value: 'none' as const, label: 'Ponctuelle' },
  ];

  const islamicTypes = [
    { value: 'normal' as const, label: 'Normale' },
    { value: 'obligatory' as const, label: 'Obligatoire' },
    { value: 'recommended' as const, label: 'Recommandée' },
  ];

  const handleSave = async () => {
    if (!form.name || !form.amount || !form.category || !form.dueDate) {
      Alert.alert(t.error, 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    const amount = parseFloat(form.amount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t.error, 'Veuillez saisir un montant valide');
      return;
    }

    if (form.autoDeduct && !form.accountId) {
      Alert.alert(t.error, 'Veuillez sélectionner un compte pour le prélèvement automatique');
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
      Alert.alert(t.error, 'Impossible de créer la charge annuelle');
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

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Sélectionner un compte';
  };

  const getCategoryName = (categoryId: string) => {
    if (!categoryId) return 'Sélectionner une catégorie';
    const subcategory = subcategories.find(sub => sub.value === categoryId);
    return subcategory ? `${subcategory.parentLabel} - ${subcategory.label}` : 'Sélectionner une catégorie';
  };

  return (
    <SafeAreaView>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.background.primary }]}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {form.isIslamic ? 'Nouvelle Charge Islamique' : 'Nouvelle Charge Annuelle'}
            </Text>
          </View>

        {/* Type de charge */}
        {form.isIslamic && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Type de charge islamique *
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typesContainer}>
              {islamicTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    form.type === type.value && styles.typeButtonSelected,
                    { backgroundColor: form.type === type.value ? colors.primary[500] : colors.background.card }
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
          <Text style={[styles.label, { color: colors.text.primary }]}>
            Nom de la charge *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
            value={form.name}
            onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
            placeholder="Ex: Assurance habitation, Impôts, Aïd al-Fitr..."
            placeholderTextColor={colors.text.disabled}
          />
        </View>

        {/* Nom arabe (pour charges islamiques) */}
        {form.isIslamic && (
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Nom arabe (optionnel)
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
              value={form.arabicName}
              onChangeText={(text) => setForm(prev => ({ ...prev, arabicName: text }))}
              placeholder="Ex: عيد الفطر"
              placeholderTextColor={colors.text.disabled}
              textAlign="right"
            />
          </View>
        )}

        {/* Montant */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            Montant *
          </Text>
          <View style={styles.amountContainer}>
            <TextInput
              style={[styles.input, styles.amountInput, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
              value={form.amount}
              onChangeText={handleAmountChange}
              placeholder="0,00"
              placeholderTextColor={colors.text.disabled}
              keyboardType="decimal-pad"
            />
          </View>
          {form.amount && (
            <Text style={[styles.hint, { color: colors.text.secondary }]}>
              {formatDisplayAmount(form.amount)}
            </Text>
          )}
        </View>

        {/* Catégorie */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            Catégorie *
          </Text>
          <TouchableOpacity 
            style={[styles.selectButton, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={[styles.selectButtonText, { color: colors.text.primary }]}>
              {form.category ? getCategoryName(form.category) : 'Sélectionner une catégorie'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Compte associé */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            Compte associé
          </Text>
          <TouchableOpacity 
            style={[styles.selectButton, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
            onPress={() => setShowAccountModal(true)}
          >
            <Text style={[styles.selectButtonText, { color: colors.text.primary }]}>
              {getAccountName(form.accountId)}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <Text style={[styles.hint, { color: colors.text.secondary }]}>
            Sélectionnez le compte pour le prélèvement automatique
          </Text>
        </View>

        {/* Prélèvement automatique */}
        {form.accountId && (
          <View style={styles.inputGroup}>
            <View style={styles.switchContainer}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
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
            <Text style={[styles.hint, { color: colors.text.secondary }]}>
              {form.autoDeduct 
                ? 'Le montant sera automatiquement débité à la date d\'échéance'
                : 'Paiement manuel requis'
              }
            </Text>
          </View>
        )}

        {/* Date d'échéance */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            Date d'échéance *
          </Text>
          <TouchableOpacity 
            style={[styles.dateButton, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateText, { color: colors.text.primary }]}>
              {form.dueDate.toLocaleDateString('fr-FR')}
            </Text>
            <Ionicons name="calendar" size={20} color={colors.text.secondary} />
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
          <Text style={[styles.label, { color: colors.text.primary }]}>
            Récurrence
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recurrenceContainer}>
            {recurrenceOptions.map((recurrence) => (
              <TouchableOpacity
                key={recurrence.value}
                style={[
                  styles.recurrenceButton,
                  form.recurrence === recurrence.value && styles.recurrenceButtonSelected,
                  { backgroundColor: form.recurrence === recurrence.value ? colors.primary[500] : colors.background.card, borderColor: colors.border.primary }
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

        {/* Prélèvement automatique */}
        <View style={styles.inputGroup}>
          <View style={styles.switchContainer}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Prélèvement automatique
            </Text>
            <TouchableOpacity
              style={[
                styles.switch,
                { backgroundColor: form.paymentMethod === 'Prélèvement automatique' ? colors.primary[500] : '#ccc' }
              ]}
              onPress={() => setForm(prev => ({ 
                ...prev, 
                paymentMethod: prev.paymentMethod === 'Prélèvement automatique' ? 'Autre' : 'Prélèvement automatique' 
              }))}
            >
              <View
                style={[
                  styles.switchThumb,
                  form.paymentMethod === 'Prélèvement automatique' && styles.switchThumbActive,
                ]}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.hint, { color: colors.text.secondary }]}>
            Les charges avec prélèvement automatique seront automatiquement débitées à leur date d'échéance
          </Text>
        </View>

        {/* Jours de rappel */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            Rappel (jours avant)
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
            value={form.reminderDays}
            onChangeText={(text) => setForm(prev => ({ ...prev, reminderDays: text.replace(/[^0-9]/g, '') }))}
            placeholder="7"
            placeholderTextColor={colors.text.disabled}
            keyboardType="number-pad"
          />
          <Text style={[styles.hint, { color: colors.text.secondary }]}>
            Nombre de jours avant l'échéance pour le rappel
          </Text>
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            Notes
          </Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
            value={form.notes}
            onChangeText={(text) => setForm(prev => ({ ...prev, notes: text }))}
            placeholder="Informations supplémentaires..."
            placeholderTextColor={colors.text.disabled}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Boutons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
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
          <View style={[styles.modalContent, { backgroundColor: colors.background.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Sélectionner un compte
            </Text>
            <ScrollView style={styles.modalList}>
              {accounts.map(account => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.modalItem,
                    form.accountId === account.id && styles.modalItemSelected,
                    { backgroundColor: form.accountId === account.id ? colors.primary[500] + '20' : 'transparent', borderColor: colors.border.primary }
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
                      { color: colors.text.primary }
                    ]}>
                      {account.name}
                    </Text>
                    <Text style={[styles.modalItemSubtext, { color: colors.text.secondary }]}>
                      {formatAmount(account.balance)} • {account.type}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={[styles.modalCloseButton, { backgroundColor: colors.background.secondary }]}
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
          <View style={[styles.modalContent, { backgroundColor: colors.background.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Sélectionner une catégorie
            </Text>
            <ScrollView style={styles.modalList}>
              {subcategories.map(subcategory => (
                <TouchableOpacity
                  key={subcategory.value}
                  style={[
                    styles.modalItem,
                    form.category === subcategory.value && styles.modalItemSelected,
                    { backgroundColor: form.category === subcategory.value ? colors.primary[500] + '20' : 'transparent', borderColor: colors.border.primary }
                  ]}
                  onPress={() => {
                    setForm(prev => ({ ...prev, category: subcategory.value }));
                    setShowCategoryModal(false);
                  }}
                >
                  <Ionicons 
                    name={subcategory.parentIcon as any} 
                    size={20} 
                    color={form.category === subcategory.value ? '#fff' : subcategory.parentColor} 
                  />
                  <View style={styles.categoryTextContainer}>
                    <Text style={[
                      styles.modalItemText,
                      form.category === subcategory.value && styles.modalItemTextSelected,
                      { color: colors.text.primary }
                    ]}>
                      {subcategory.label}
                    </Text>
                    <Text style={[
                      styles.modalItemSubtext,
                      { color: colors.text.secondary }
                    ]}>
                      {subcategory.parentLabel}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={[styles.modalCloseButton, { backgroundColor: colors.background.secondary }]}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  categoryTextContainer: {
    flex: 1,
    marginLeft: 12,
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
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

export default AddAnnualChargeScreen;