// src/screens/EditAnnualChargeScreen.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
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
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../hooks/useAccounts';
import { useAnnualCharges } from '../hooks/useAnnualCharges';
import { getAllSubcategories } from '../types/AnnualCharge';

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
}

const EditAnnualChargeScreen = ({ navigation, route }: any) => {
  const { chargeId } = route.params || {};
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { accounts } = useAccounts();
  const subcategories = getAllSubcategories();
  const { getChargeById, updateAnnualCharge, createCharge } = useAnnualCharges();
  
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
    recurrence: 'none',
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const isDark = theme === 'dark';

  const recurrenceOptions = [
    { value: 'yearly' as const, label: 'Annuelle' },
    { value: 'monthly' as const, label: 'Mensuelle' },
    { value: 'quarterly' as const, label: 'Trimestrielle' },
    { value: 'none' as const, label: 'Ponctuelle' },
  ];

  useEffect(() => {
    loadChargeData();
  }, [chargeId]);

  const loadChargeData = async () => {
    if (!chargeId) {
      // Mode création - initialiser avec des valeurs par défaut
      setInitialLoading(false);
      return;
    }
    
    try {
      setInitialLoading(true);
      const charge = await getChargeById(chargeId);
      
      if (charge) {
        setForm({
          name: charge.name,
          amount: charge.amount.toString(),
          dueDate: new Date(charge.dueDate),
          category: charge.category,
          reminderDays: charge.reminderDays?.toString() || '7',
          accountId: charge.accountId || '',
          autoDeduct: charge.autoDeduct || false,
          notes: charge.notes || '',
          paymentMethod: charge.paymentMethod || '',
          recurrence: charge.recurrence || 'none',
        });
      } else {
        Alert.alert(t.error, 'Charge annuelle non trouvée');
        navigation.navigate('AnnualChargesList');
      }
    } catch (error) {
      console.error('Error loading charge:', error);
      Alert.alert(t.error, 'Impossible de charger la charge annuelle');
      navigation.navigate('AnnualChargesList');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.amount || !form.category) {
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
      const chargeData = {
        name: form.name.trim(),
        amount: amount,
        dueDate: form.dueDate.toISOString().split('T')[0],
        category: form.category,
        reminderDays: parseInt(form.reminderDays) || 7,
        accountId: form.accountId || undefined,
        autoDeduct: form.autoDeduct,
        notes: form.notes || undefined,
        paymentMethod: form.paymentMethod || undefined,
        recurrence: form.recurrence !== 'none' ? form.recurrence : undefined,
      };

      if (chargeId) {
        // Mode édition
        await updateAnnualCharge(chargeId, chargeData);
        Alert.alert(
          'Succès',
          'Charge annuelle modifiée avec succès',
          [{ text: 'OK', onPress: () => navigation.navigate('AnnualChargesList') }]
        );
      } else {
        // Mode création
        await createCharge(chargeData);
        Alert.alert(
          'Succès',
          'Charge annuelle créée avec succès',
          [{ text: 'OK', onPress: () => navigation.navigate('AnnualChargesList') }]
        );
      }
    } catch (error) {
      console.error('❌ [EditAnnualChargeScreen] Error saving charge:', error);
      Alert.alert(t.error, chargeId ? 'Impossible de modifier la charge annuelle' : 'Impossible de créer la charge annuelle');
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

  const handleReminderDaysChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    setForm(prev => ({ ...prev, reminderDays: numericValue }));
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

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.center}>
          <Text style={[styles.loadingText, isDark && styles.darkText]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <ScrollView 
        style={[styles.container, isDark && styles.darkContainer]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('AnnualChargesList')}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.darkText]}>
            {chargeId ? 'Modifier la Charge' : 'Nouvelle Charge'}
          </Text>
        </View>

        {/* Nom de la charge */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Nom de la charge *
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={form.name}
            onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
            placeholder="Ex: Assurance habitation"
            placeholderTextColor={isDark ? "#888" : "#999"}
          />
        </View>

        {/* Montant */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Montant *
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={form.amount}
            onChangeText={handleAmountChange}
            placeholder="0,00"
            placeholderTextColor={isDark ? "#888" : "#999"}
            keyboardType="decimal-pad"
          />
        </View>

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

        {/* ✅ CORRIGÉ : Compte associé */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Compte associé
          </Text>
          <Text style={[styles.hint, isDark && styles.darkSubtext, { marginBottom: 8 }]}>
            ⚡ Sélectionnez un compte pour activer le prélèvement automatique à la date d'échéance
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

        {/* ✅ CORRIGÉ : Prélèvement automatique */}
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
                ? 'Le montant sera automatiquement débité du compte sélectionné à la date d\'\u00e9chéance'
                : 'Activez pour débiter automatiquement le compte à l\'\u00e9chéance'
              }
            </Text>
          </View>
        )}

        {/* Récurrence */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Récurrence
          </Text>
          <Text style={[styles.hint, isDark && styles.darkSubtext, { marginBottom: 8 }]}>
            💡 Quand vous payez une charge récurrente, une nouvelle occurrence sera automatiquement créée pour la prochaine échéance
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

        {/* Jours de rappel */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Rappel (jours avant)
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={form.reminderDays}
            onChangeText={handleReminderDaysChange}
            placeholder="7"
            placeholderTextColor={isDark ? "#888" : "#999"}
            keyboardType="number-pad"
          />
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
            onPress={() => navigation.navigate('AnnualChargesScreen')}
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
              {loading ? 'Modification...' : 'Modifier'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ✅ CORRIGÉ : Modal de sélection de compte */}
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
                    setForm(prev => ({ 
                      ...prev, 
                      accountId: account.id,
                      // Désactiver auto-deduct si aucun compte sélectionné
                      autoDeduct: account.id ? prev.autoDeduct : false
                    }));
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
                      {account.balance} MAD • {account.type}
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
              {subcategories.map(subcategory => (
                <TouchableOpacity
                  key={subcategory.value}
                  style={[
                    styles.modalItem,
                    form.category === subcategory.value && styles.modalItemSelected,
                    isDark && styles.darkModalItem
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
                      isDark && styles.darkText
                    ]}>
                      {subcategory.label}
                    </Text>
                    <Text style={[
                      styles.modalItemSubtext,
                      { color: isDark ? '#8E8E93' : '#666' }
                    ]}>
                      {subcategory.parentLabel}
                    </Text>
                  </View>
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
  center: {
    flex: 1,
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
  textArea: {
    minHeight: 80,
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
  switchInactive: {
    backgroundColor: '#e9ecef',
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
  categoryTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
});

export default EditAnnualChargeScreen;