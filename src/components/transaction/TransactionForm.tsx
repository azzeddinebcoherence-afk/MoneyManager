// src/components/transaction/TransactionForm.tsx - VERSION CORRIGÉE
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCurrency } from '../../context/CurrencyContext';
import { useTheme } from '../../context/ThemeContext';
import { useAccounts } from '../../hooks/useAccounts';
import { useCategories } from '../../hooks/useCategories';
import { CreateTransactionData, Transaction } from '../../types';

interface TransactionFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (transaction: CreateTransactionData) => void;
  editingTransaction?: Transaction | null;
}

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Quotidienne' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuelle' },
  { value: 'yearly', label: 'Annuelle' },
];

type TransactionType = 'expense' | 'income' | 'transfer';
type CategoryType = 'expense' | 'income' | 'both';

const TransactionForm: React.FC<TransactionFormProps> = ({
  visible,
  onClose,
  onSubmit,
  editingTransaction,
}) => {
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { categories, loading: categoriesLoading } = useCategories();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as TransactionType,
    category: '',
    accountId: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurrenceType: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurrenceEndDate: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState(categories);

  // ✅ CORRECTION : Fonction utilitaire pour vérifier la compatibilité des catégories
  const isCategoryCompatible = (categoryType: string, transactionType: TransactionType): boolean => {
    if (categoryType === 'both') return true;
    if (transactionType === 'transfer') return categoryType === 'both';
    return categoryType === transactionType;
  };

  // Initialisation du formulaire
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        description: editingTransaction.description,
        amount: Math.abs(editingTransaction.amount).toString(),
        type: editingTransaction.type as TransactionType,
        category: editingTransaction.category,
        accountId: editingTransaction.accountId,
        date: editingTransaction.date,
        isRecurring: editingTransaction.isRecurring || false,
        recurrenceType: editingTransaction.recurrenceType || 'monthly',
        recurrenceEndDate: editingTransaction.recurrenceEndDate || '',
      });
    } else {
      setFormData({
        description: '',
        amount: '',
        type: 'expense',
        category: '',
        accountId: '',
        date: new Date().toISOString().split('T')[0],
        isRecurring: false,
        recurrenceType: 'monthly',
        recurrenceEndDate: '',
      });
    }
  }, [editingTransaction, visible]);

  // ✅ CORRECTION : Filtrage des catégories avec gestion sécurisée
  useEffect(() => {
    let filtered = categories;
    
    if (formData.type === 'expense') {
      filtered = categories.filter(cat => 
        cat.type === 'expense' || cat.type === 'both'
      );
    } else if (formData.type === 'income') {
      filtered = categories.filter(cat => 
        cat.type === 'income' || cat.type === 'both'
      );
    } else if (formData.type === 'transfer') {
      filtered = categories.filter(cat => 
        cat.type === 'both' || cat.name.toLowerCase().includes('transfert')
      );
    }
    
    setFilteredCategories(filtered);
    
    // ✅ CORRECTION : Vérification sécurisée de la catégorie actuelle
    if (formData.category) {
      const currentCategory = categories.find(cat => cat.id === formData.category);
      if (currentCategory && !isCategoryCompatible(currentCategory.type, formData.type)) {
        setFormData(prev => ({ ...prev, category: '' }));
      }
    }
  }, [formData.type, categories, formData.category]); // ✅ AJOUT: Dépendance à formData.category

  const handleSubmit = () => {
    if (!formData.description.trim()) {
      alert('Veuillez saisir une description');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Veuillez saisir un montant valide');
      return;
    }

    if (!formData.category && formData.type !== 'transfer') {
      alert('Veuillez sélectionner une catégorie');
      return;
    }

    if (!formData.accountId) {
      alert('Veuillez sélectionner un compte');
      return;
    }

    // Gestion spéciale pour les transferts
    const amount = formData.type === 'transfer' 
      ? Math.abs(parseFloat(formData.amount))
      : formData.type === 'expense' 
        ? -Math.abs(parseFloat(formData.amount)) 
        : Math.abs(parseFloat(formData.amount));

    // Pour les transferts, on peut utiliser une catégorie par défaut
    const category = formData.type === 'transfer' 
      ? (formData.category || 'Transfert')
      : formData.category;

    // ✅ CORRECTION : Vérification que recurrenceType est défini si isRecurring est true
    const recurrenceType = formData.isRecurring ? formData.recurrenceType : undefined;
    
    if (formData.isRecurring && !recurrenceType) {
      alert('Veuillez sélectionner une fréquence pour la transaction récurrente');
      return;
    }

    // Préparer les données pour la soumission
    const transactionData: CreateTransactionData = {
      description: formData.description.trim(),
      amount: amount,
      type: formData.type,
      category: category,
      accountId: formData.accountId,
      date: formData.date,
      isRecurring: formData.isRecurring,
      recurrenceType: recurrenceType,
      recurrenceEndDate: formData.isRecurring && formData.recurrenceEndDate ? formData.recurrenceEndDate : undefined,
    };

    onSubmit(transactionData);
    onClose();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate.toISOString().split('T')[0] }));
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, recurrenceEndDate: selectedDate.toISOString().split('T')[0] }));
    }
  };

  const formatDisplayAmount = (value: string): string => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return formatAmount(num, false);
  };

  // ✅ CORRECTION : Fonction pour calculer la prochaine occurrence (sécurisée)
  const calculateNextOccurrence = (recurrenceType: string, baseDate: string): string => {
    const date = new Date(baseDate);
    
    switch (recurrenceType) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        // Type non reconnu, on retourne la date actuelle
        console.warn('Type de récurrence non reconnu:', recurrenceType);
    }
    
    return date.toISOString().split('T')[0];
  };

  if (accountsLoading || categoriesLoading) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={[styles.container, isDark && styles.darkContainer, styles.center]}>
          <Text style={[styles.loadingText, isDark && styles.darkText]}>
            Chargement...
          </Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, isDark && styles.darkContainer]}>
        <View style={[styles.header, isDark && styles.darkHeader]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.darkText]}>
            {editingTransaction ? 'Modifier' : 'Nouvelle'} Transaction
            {formData.isRecurring && ' Récurrente'}
            {formData.type === 'transfer' && ' de Transfert'}
          </Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>Description</Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Description de la transaction"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>

          {/* Type */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>Type</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'expense' && styles.typeButtonSelected,
                  isDark && styles.darkTypeButton,
                ]}
                onPress={() => setFormData({ ...formData, type: 'expense', category: '' })}
              >
                <Ionicons 
                  name="arrow-up" 
                  size={20} 
                  color={formData.type === 'expense' ? '#fff' : '#FF3B30'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  formData.type === 'expense' && styles.typeButtonTextSelected,
                ]}>
                  Dépense
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'income' && styles.typeButtonSelected,
                  isDark && styles.darkTypeButton,
                ]}
                onPress={() => setFormData({ ...formData, type: 'income', category: '' })}
              >
                <Ionicons 
                  name="arrow-down" 
                  size={20} 
                  color={formData.type === 'income' ? '#fff' : '#34C759'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  formData.type === 'income' && styles.typeButtonTextSelected,
                ]}>
                  Revenu
                </Text>
              </TouchableOpacity>

              {/* Bouton pour les transferts */}
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'transfer' && styles.typeButtonSelected,
                  isDark && styles.darkTypeButton,
                ]}
                onPress={() => setFormData({ ...formData, type: 'transfer', category: '' })}
              >
                <Ionicons 
                  name="swap-horizontal" 
                  size={20} 
                  color={formData.type === 'transfer' ? '#fff' : '#007AFF'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  formData.type === 'transfer' && styles.typeButtonTextSelected,
                ]}>
                  Transfert
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Montant */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>Montant</Text>
            <View style={styles.amountContainer}>
              <TextInput
                style={[styles.input, styles.amountInput, isDark && styles.darkInput]}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text.replace(',', '.') })}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={isDark ? '#666' : '#999'}
              />
            </View>
            {formData.amount && (
              <Text style={[styles.hint, isDark && styles.darkSubtext]}>
                {formatDisplayAmount(formData.amount)}
                {formData.type === 'transfer' && ' (transfert)'}
              </Text>
            )}
          </View>

          {/* Catégorie - Masquer pour les transferts ou montrer des catégories spécifiques */}
          {(formData.type !== 'transfer' || filteredCategories.length > 0) && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.darkText]}>
                Catégorie {formData.type === 'transfer' && '(optionnel)'}
              </Text>
              {filteredCategories.length === 0 ? (
                <Text style={[styles.noCategoriesText, isDark && styles.darkSubtext]}>
                  Aucune catégorie disponible pour {formData.type === 'expense' ? 'les dépenses' : 'les revenus'}
                </Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
                  {filteredCategories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryButton,
                        formData.category === category.id && styles.categoryButtonSelected,
                        isDark && styles.darkCategoryButton,
                        { borderLeftColor: category.color }
                      ]}
                      onPress={() => setFormData({ ...formData, category: category.id })}
                    >
                      <Ionicons 
                        name={category.icon as any} 
                        size={16} 
                        color={formData.category === category.id ? '#fff' : category.color} 
                      />
                      <Text style={[
                        styles.categoryButtonText,
                        formData.category === category.id && styles.categoryButtonTextSelected,
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Compte */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>Compte</Text>
            {accounts.length === 0 ? (
              <Text style={[styles.noAccountsText, isDark && styles.darkSubtext]}>
                Aucun compte disponible
              </Text>
            ) : (
              accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountButton,
                    formData.accountId === account.id && styles.accountButtonSelected,
                    isDark && styles.darkAccountButton,
                  ]}
                  onPress={() => setFormData({ ...formData, accountId: account.id })}
                >
                  <View style={[styles.colorIndicator, { backgroundColor: account.color }]} />
                  <Text style={[
                    styles.accountButtonText,
                    formData.accountId === account.id && styles.accountButtonTextSelected,
                    isDark && styles.darkText,
                  ]}>
                    {account.name}
                  </Text>
                  <Text style={[
                    styles.accountBalance,
                    isDark && styles.darkSubtext,
                  ]}>
                    {formatAmount(account.balance, false)}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>Date</Text>
            <TouchableOpacity 
              style={[styles.dateButton, isDark && styles.darkInput]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateText, isDark && styles.darkText]}>
                {new Date(formData.date).toLocaleDateString('fr-FR')}
              </Text>
              <Ionicons name="calendar" size={20} color={isDark ? "#fff" : "#666"} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(formData.date)}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>

          {/* Section Récurrence - Désactivée pour les transferts */}
          {formData.type !== 'transfer' && (
            <View style={styles.inputGroup}>
              <View style={styles.switchContainer}>
                <Text style={[styles.label, isDark && styles.darkText]}>Transaction récurrente</Text>
                <TouchableOpacity
                  style={[
                    styles.switch,
                    formData.isRecurring && styles.switchActive,
                    isDark && styles.darkSwitch,
                  ]}
                  onPress={() => setFormData({ ...formData, isRecurring: !formData.isRecurring })}
                >
                  <View style={[
                    styles.switchThumb,
                    formData.isRecurring && styles.switchThumbActive,
                  ]} />
                </TouchableOpacity>
              </View>
              
              {formData.isRecurring && (
                <>
                  <Text style={[styles.helperText, isDark && styles.darkSubtext]}>
                    Cette transaction se répétera automatiquement
                  </Text>

                  {/* Fréquence */}
                  <View style={styles.recurrenceSection}>
                    <Text style={[styles.subLabel, isDark && styles.darkText]}>Fréquence</Text>
                    <View style={styles.frequencyGrid}>
                      {FREQUENCY_OPTIONS.map((frequency) => (
                        <TouchableOpacity
                          key={frequency.value}
                          style={[
                            styles.frequencyButton,
                            formData.recurrenceType === frequency.value && styles.frequencyButtonSelected,
                            isDark && styles.darkFrequencyButton,
                          ]}
                          onPress={() => setFormData({ ...formData, recurrenceType: frequency.value as any })}
                        >
                          <Text style={[
                            styles.frequencyButtonText,
                            formData.recurrenceType === frequency.value && styles.frequencyButtonTextSelected,
                            isDark && styles.darkText,
                          ]}>
                            {frequency.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Date de fin */}
                  <View style={styles.recurrenceSection}>
                    <Text style={[styles.subLabel, isDark && styles.darkText]}>
                      Date de fin (optionnelle)
                    </Text>
                    <TouchableOpacity 
                      style={[styles.dateButton, isDark && styles.darkInput]}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <Text style={[styles.dateText, isDark && styles.darkText]}>
                        {formData.recurrenceEndDate 
                          ? new Date(formData.recurrenceEndDate).toLocaleDateString('fr-FR')
                          : 'Sélectionner une date'
                        }
                      </Text>
                      <Ionicons name="calendar" size={20} color={isDark ? "#fff" : "#666"} />
                    </TouchableOpacity>
                    {showEndDatePicker && (
                      <DateTimePicker
                        value={formData.recurrenceEndDate ? new Date(formData.recurrenceEndDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={handleEndDateChange}
                      />
                    )}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Bouton de soumission */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!formData.description || !formData.amount || !formData.accountId || 
               (formData.type !== 'transfer' && !formData.category)) && 
              styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!formData.description || !formData.amount || !formData.accountId || 
                     (formData.type !== 'transfer' && !formData.category)}
          >
            <Text style={styles.submitButtonText}>
              {editingTransaction ? 'Modifier' : 'Créer'} la transaction
              {formData.isRecurring && ' récurrente'}
              {formData.type === 'transfer' && ' de transfert'}
            </Text>
          </TouchableOpacity>

          <View style={styles.spacer} />
        </ScrollView>
      </View>
    </Modal>
  );
};

// Les styles restent identiques à la version précédente
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#1c1c1e',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  darkHeader: {
    borderBottomColor: '#38383a',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  form: {
    flex: 1,
    padding: 16,
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
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  darkInput: {
    backgroundColor: '#2c2c2e',
    borderColor: '#38383a',
    color: '#fff',
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
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    gap: 6,
  },
  darkTypeButton: {
    backgroundColor: '#2c2c2e',
    borderColor: '#38383a',
  },
  typeButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderLeftWidth: 4,
    gap: 8,
  },
  darkCategoryButton: {
    backgroundColor: '#2c2c2e',
    borderColor: '#38383a',
  },
  categoryButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  noCategoriesText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
    color: '#666',
  },
  noAccountsText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
    color: '#666',
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  darkAccountButton: {
    backgroundColor: '#2c2c2e',
    borderColor: '#38383a',
  },
  accountButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  accountButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  accountButtonTextSelected: {
    color: '#fff',
  },
  accountBalance: {
    fontSize: 14,
    color: '#666',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#000',
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
    backgroundColor: '#ccc',
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  darkSwitch: {
    backgroundColor: '#38383a',
  },
  switchActive: {
    backgroundColor: '#34C759',
  },
  switchThumb: {
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    transform: [{ translateX: 0 }],
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  recurrenceSection: {
    marginTop: 16,
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    minWidth: '48%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  darkFrequencyButton: {
    backgroundColor: '#2c2c2e',
    borderColor: '#38383a',
  },
  frequencyButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  frequencyButtonTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default TransactionForm;