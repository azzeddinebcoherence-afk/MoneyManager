// src/screens/AddTransactionScreen.tsx - VERSION AVEC DROPDOWN HIÉRARCHIQUE
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { CategoryPickerDropdown } from '../components/ui/CategoryPickerDropdown';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { useDesignSystem, useTheme } from '../context/ThemeContext';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';
import { Account, CreateTransactionData } from '../types';

const AddTransactionScreen = ({ navigation, route }: any) => {
  const isRecurring = route.params?.isRecurring || false;
  const { colors } = useDesignSystem();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { accounts, loading: accountsLoading, error: accountsError, refreshAccounts } = useAccounts();
  const { categories, loading: categoriesLoading, getCategoryTree } = useCategories();
  const { createTransaction } = useTransactions();
  
  const initialType = route.params?.initialType || 'expense';
  const isRecurringInitial = route.params?.isRecurring || false;
  
  const [form, setForm] = useState({
    amount: '',
    type: initialType as 'expense' | 'income',
    category: '',
    accountId: '',
    description: '',
    date: new Date(),
    
    // Champs de récurrence
    isRecurring: isRecurringInitial,
    recurrenceType: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurrenceEndDate: undefined as Date | undefined,
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);

  const isDark = theme === 'dark';

  const frequencyOptions = [
    { value: 'daily', label: 'Quotidienne' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuelle' },
    { value: 'yearly', label: 'Annuelle' },
  ];

  // ✅ CORRECTION : Charger au focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshAccounts();
    });
    return unsubscribe;
  }, [navigation, refreshAccounts]);

  // ✅ CORRECTION : Réinitialiser la catégorie quand le type change
  useEffect(() => {
    setForm(prev => ({ ...prev, category: '' }));
  }, [form.type]);

  // ✅ FILTRER les catégories par type
  const filteredCategories = categories.filter(cat => cat.type === form.type);

  const handleSave = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      Alert.alert(t.error, 'Veuillez saisir un montant valide');
      return;
    }

    if (!form.category) {
      Alert.alert(t.error, 'Veuillez sélectionner une catégorie');
      return;
    }

    if (!form.accountId) {
      Alert.alert(t.error, 'Veuillez sélectionner un compte');
      return;
    }

    setLoading(true);
    try {
      const amount = form.type === 'expense' ? -Math.abs(parseFloat(form.amount)) : Math.abs(parseFloat(form.amount));
      
      const transactionData: CreateTransactionData = {
        amount: amount,
        type: form.type,
        category: form.category,
        accountId: form.accountId,
        description: form.description,
        date: form.date.toISOString().split('T')[0],
        isRecurring: form.isRecurring,
        recurrenceType: form.isRecurring ? form.recurrenceType : undefined,
        recurrenceEndDate: form.isRecurring && hasEndDate && form.recurrenceEndDate 
          ? form.recurrenceEndDate.toISOString().split('T')[0] 
          : undefined,
      };

      await createTransaction(transactionData);

      Alert.alert(
        'Succès',
        `Transaction ${form.isRecurring ? 'récurrente ' : ''}ajoutée avec succès`,
        [{ 
          text: 'OK', 
          onPress: () => navigation.navigate('Transactions')
        }]
      );
    } catch (error) {
      console.error('Error creating transaction:', error);
      Alert.alert(t.error, 'Impossible d\'ajouter la transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setForm(prev => ({ ...prev, date: selectedDate }));
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setForm(prev => ({ ...prev, recurrenceEndDate: selectedDate }));
    }
  };

  return (
    <SafeAreaView>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background.primary }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {form.isRecurring ? t.newRecurringTransaction : t.newTransaction}
          </Text>
        </View>

        {/* Type de transaction */}
        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[
              styles.typeButton, 
              { backgroundColor: form.type === 'expense' ? colors.semantic.error : 'transparent' },
            ]}
            onPress={() => setForm(prev => ({ ...prev, type: 'expense' }))}
          >
            <Ionicons 
              name="arrow-up" 
              size={20} 
              color={form.type === 'expense' ? colors.text.inverse : colors.semantic.error} 
            />
            <Text style={[
              styles.typeButtonText,
              { color: form.type === 'expense' ? colors.text.inverse : colors.semantic.error },
            ]}>
              Dépense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.typeButton, 
              { backgroundColor: form.type === 'income' ? colors.semantic.success : 'transparent' },
            ]}
            onPress={() => setForm(prev => ({ ...prev, type: 'income' }))}
          >
            <Ionicons 
              name="arrow-down" 
              size={20} 
              color={form.type === 'income' ? colors.text.inverse : colors.semantic.success} 
            />
            <Text style={[
              styles.typeButtonText,
              { color: form.type === 'income' ? colors.text.inverse : colors.semantic.success },
            ]}>
              Revenu
            </Text>
          </TouchableOpacity>
        </View>

        {/* Montant */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            Montant *
          </Text>
          <View style={styles.amountContainer}>
            <TextInput
              style={[
                styles.input, 
                styles.amountInput, 
                { backgroundColor: colors.background.secondary, color: colors.text.primary },
              ]}
              value={form.amount}
              onChangeText={(text) => setForm(prev => ({ ...prev, amount: text.replace(',', '.') }))}
              placeholder="0.00"
              placeholderTextColor={colors.text.disabled}
              keyboardType="decimal-pad"
            />
          </View>
          {form.amount && (
            <Text style={[styles.hint, { color: colors.text.secondary }]}>
              {formatAmount(Math.abs(parseFloat(form.amount) || 0))}
            </Text>
          )}
        </View>

        {/* Catégorie AVEC DROPDOWN */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            Catégorie *
          </Text>
          
          <CategoryPickerDropdown
            categories={filteredCategories}
            selectedCategoryId={form.category || null}
            onSelect={(category) => {
              // CategoryPickerDropdown returns a Category object — store its id
              setForm(prev => ({ ...prev, category: category.id }));
            }}
            type={form.type}
          />
        </View>

        {/* Compte */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            Compte *
          </Text>
          
          {accountsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
              <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                Chargement des comptes...
              </Text>
            </View>
          ) : accountsError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color={colors.semantic.error} />
              <Text style={[styles.errorText, { color: colors.semantic.error }]}>
                Erreur de chargement: {accountsError}
              </Text>
              <TouchableOpacity 
                style={[styles.retryButton, { backgroundColor: colors.primary[500] }]}
                onPress={refreshAccounts}
              >
                <Text style={[styles.retryButtonText, { color: colors.text.inverse }]}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : accounts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={32} color={colors.text.disabled} />
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                Aucun compte disponible
              </Text>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: colors.primary[500] }]}
                onPress={() => navigation.navigate('Accounts')}
              >
                <Text style={[styles.addButtonText, { color: colors.text.inverse }]}>Ĺréer un compte</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.accountsContainer}
            >
              {accounts.map((account: Account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountButton,
                    { backgroundColor: form.accountId === account.id ? colors.primary[100] : colors.background.secondary },
                  ]}
                  onPress={() => setForm(prev => ({ ...prev, accountId: account.id }))}
                >
                  <View style={[styles.colorIndicator, { backgroundColor: account.color }]} />
                  <View style={styles.accountInfo}>
                    <Text style={[
                      styles.accountText,
                      { color: form.accountId === account.id ? colors.primary[500] : colors.text.primary },
                    ]}>
                      {account.name}
                    </Text>
                    <Text style={[
                      styles.accountBalance,
                      { color: form.accountId === account.id ? colors.primary[500] : colors.text.secondary },
                    ]}>
                      {formatAmount(account.balance)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            Description
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background.secondary, color: colors.text.primary }]}
            value={form.description}
            onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
            placeholder={t.enterDescription}
            placeholderTextColor={colors.text.disabled}
            multiline
          />
        </View>

        {/* Date */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            Date
          </Text>
          <TouchableOpacity 
            style={[styles.dateButton, { backgroundColor: colors.background.secondary }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateText, { color: colors.text.primary }]}>
              {form.date.toLocaleDateString('fr-FR')}
            </Text>
            <Ionicons name="calendar" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={form.date}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        {/* Section Récurrence */}
        <View style={styles.inputGroup}>
          <View style={styles.switchContainer}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Transaction récurrente
            </Text>
            <TouchableOpacity
              style={[
                styles.switch,
                { backgroundColor: form.isRecurring ? colors.primary[500] : colors.background.secondary },
              ]}
              onPress={() => setForm(prev => ({ ...prev, isRecurring: !prev.isRecurring }))}
            >
              <View style={[
                styles.switchThumb,
                form.isRecurring && styles.switchThumbActive,
              ]} />
            </TouchableOpacity>
          </View>
          
          {form.isRecurring && (
            <>
              <Text style={[styles.helperText, { color: colors.text.secondary }]}>
                Cette transaction se répétera automatiquement
              </Text>

              {/* Fréquence */}
              <View style={styles.recurrenceSection}>
                <Text style={[styles.subLabel, { color: colors.text.primary }]}>Fréquence *</Text>
                <View style={styles.frequencyContainer}>
                  {frequencyOptions.map((freq) => (
                    <TouchableOpacity
                      key={freq.value}
                      style={[
                        styles.frequencyButton,
                        { backgroundColor: form.recurrenceType === freq.value ? colors.primary[500] : colors.background.secondary },
                      ]}
                      onPress={() => setForm(prev => ({ ...prev, recurrenceType: freq.value as any }))}
                    >
                      <Text style={[
                        styles.frequencyText,
                        { color: form.recurrenceType === freq.value ? colors.text.inverse : colors.text.primary },
                      ]}>
                        {freq.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date de fin */}
              <View style={styles.recurrenceSection}>
                <View style={styles.endDateHeader}>
                  <Text style={[styles.subLabel, { color: colors.text.primary }]}>
                    Date de fin
                  </Text>
                  <TouchableOpacity 
                    style={[styles.toggleButton, { backgroundColor: colors.primary[100] }]}
                    onPress={() => {
                      setHasEndDate(!hasEndDate);
                      if (!hasEndDate) {
                        setForm(prev => ({ 
                          ...prev, 
                          recurrenceEndDate: new Date() 
                        }));
                      } else {
                        setForm(prev => ({ 
                          ...prev, 
                          recurrenceEndDate: undefined 
                        }));
                      }
                    }}
                  >
                    <Text style={[styles.toggleButtonText, { color: colors.primary[500] }]}>
                      {hasEndDate ? 'Désactiver' : 'Activer'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {hasEndDate && (
                  <TouchableOpacity 
                    style={[styles.dateButton, { backgroundColor: colors.background.secondary }]}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={[styles.dateText, { color: colors.text.primary }]}>
                      {form.recurrenceEndDate 
                        ? form.recurrenceEndDate.toLocaleDateString('fr-FR')
                        : 'Sélectionner une date'
                      }
                    </Text>
                    <Ionicons name="calendar" size={20} color={colors.text.secondary} />
                  </TouchableOpacity>
                )}
                {showEndDatePicker && (
                  <DateTimePicker
                    value={form.recurrenceEndDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleEndDateChange}
                  />
                )}
              </View>
            </>
          )}
        </View>

        {/* Boutons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: colors.background.secondary }]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text.primary }]}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              { backgroundColor: colors.primary[500] },
              (loading || !form.amount || !form.category || !form.accountId) && { opacity: 0.5 },
            ]}
            onPress={handleSave}
            disabled={loading || !form.amount || !form.category || !form.accountId}
          >
            <Text style={[styles.saveButtonText, { color: colors.text.inverse }]}>
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
  },
  content: {
    padding: 20,
    paddingBottom: 40,
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
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    paddingLeft: 10,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  accountsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 200,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 14,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
    padding: 16,
  },
  dateText: {
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    transform: [{ translateX: 0 }],
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  helperText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  recurrenceSection: {
    marginTop: 16,
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 100,
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  endDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleButton: {
    padding: 8,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AddTransactionScreen;