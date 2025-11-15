// src/screens/AddTransactionScreen.tsx - VERSION AVEC DROPDOWN HIÉRARCHIQUE
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';
import { Account, Category, CreateTransactionData } from '../types';

const AddTransactionScreen = ({ navigation, route }: any) => {
  const isRecurring = route.params?.isRecurring || false;
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
  const [categoryTree, setCategoryTree] = useState<Array<{ category: Category; subcategories: Category[] }>>([]);
  
  // ✅ NOUVEAU : États pour la dropdown
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

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
      loadCategoryTree();
    });
    return unsubscribe;
  }, [navigation, refreshAccounts]);

  // ✅ CHARGER l'arbre des catégories
  const loadCategoryTree = async () => {
    try {
      const tree = await getCategoryTree();
      setCategoryTree(tree);
    } catch (error) {
      console.error('❌ [AddTransactionScreen] Error loading category tree:', error);
    }
  };

  // ✅ CORRECTION : Réinitialiser la catégorie quand le type change
  useEffect(() => {
    setForm(prev => ({ ...prev, category: '' }));
    setSelectedCategoryName('');
  }, [form.type]);

  // ✅ FILTRER les catégories par type
  const filteredCategories = categoryTree.filter(item => item.category.type === form.type);

  // ✅ METTRE À JOUR le nom de la catégorie sélectionnée
  useEffect(() => {
    if (form.category) {
      const selectedCat = categories.find(cat => cat.id === form.category);
      setSelectedCategoryName(selectedCat?.name || '');
    } else {
      setSelectedCategoryName('');
    }
  }, [form.category, categories]);

  // ✅ GÉRER la sélection d'une catégorie
  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setForm(prev => ({ ...prev, category: categoryId }));
    setSelectedCategoryName(categoryName);
    setShowCategoryDropdown(false);
  };

  const handleSave = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide');
      return;
    }

    if (!form.category) {
      Alert.alert('Erreur', 'Veuillez sélectionner une catégorie');
      return;
    }

    if (!form.accountId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un compte');
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
      Alert.alert('Erreur', 'Impossible d\'ajouter la transaction');
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

  // ✅ NOUVEAU : Composant Item de catégorie pour la FlatList
  const CategoryItem = ({ item, level = 0 }: { item: Category; level?: number }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        { paddingLeft: 16 + (level * 20) },
        form.category === item.id && styles.categoryItemSelected,
      ]}
      onPress={() => handleCategorySelect(item.id, item.name)}
    >
      <View style={styles.categoryItemContent}>
        <View style={styles.categoryItemLeft}>
          <View style={[styles.categoryIconContainer, { backgroundColor: `${item.color}20` }]}>
            <Ionicons 
              name={item.icon as any} 
              size={16} 
              color={item.color} 
            />
          </View>
          <Text style={[
            styles.categoryItemText,
            form.category === item.id && styles.categoryItemTextSelected,
            level > 0 && styles.subcategoryItemText,
          ]}>
            {item.name}
          </Text>
        </View>
        {form.category === item.id && (
          <Ionicons name="checkmark" size={20} color="#007AFF" />
        )}
      </View>
    </TouchableOpacity>
  );

  // ✅ NOUVEAU : Dropdown des catégories
  const CategoryDropdown = () => (
    <Modal
      visible={showCategoryDropdown}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCategoryDropdown(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>
              Sélectionner une catégorie
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCategoryDropdown(false)}
            >
              <Ionicons name="close" size={24} color={isDark ? "#fff" : "#000"} />
            </TouchableOpacity>
          </View>

          {categoriesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={[styles.loadingText, isDark && styles.darkSubtext]}>
                Chargement des catégories...
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredCategories.flatMap(mainCategory => [
                mainCategory.category,
                ...mainCategory.subcategories
              ])}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSubcategory = filteredCategories.some(
                  mainCat => mainCat.subcategories.some(sub => sub.id === item.id)
                );
                const level = isSubcategory ? 1 : 0;
                return <CategoryItem item={item} level={level} />;
              }}
              showsVerticalScrollIndicator={false}
              style={styles.categoryList}
            />
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView>
      <ScrollView 
        style={[styles.container, isDark && styles.darkContainer]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.darkText]}>
            {form.isRecurring ? 'Nouvelle Transaction Récurrente' : 'Nouvelle Transaction'}
          </Text>
        </View>

        {/* Type de transaction */}
        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[
              styles.typeButton, 
              form.type === 'expense' && styles.typeButtonActive
            ]}
            onPress={() => setForm(prev => ({ ...prev, type: 'expense' }))}
          >
            <Ionicons 
              name="arrow-up" 
              size={20} 
              color={form.type === 'expense' ? '#fff' : '#FF3B30'} 
            />
            <Text style={[
              styles.typeButtonText,
              form.type === 'expense' && styles.typeButtonTextActive
            ]}>
              Dépense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.typeButton, 
              form.type === 'income' && styles.typeButtonActive
            ]}
            onPress={() => setForm(prev => ({ ...prev, type: 'income' }))}
          >
            <Ionicons 
              name="arrow-down" 
              size={20} 
              color={form.type === 'income' ? '#fff' : '#34C759'} 
            />
            <Text style={[
              styles.typeButtonText,
              form.type === 'income' && styles.typeButtonTextActive
            ]}>
              Revenu
            </Text>
          </TouchableOpacity>
        </View>

        {/* Montant */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Montant *
          </Text>
          <View style={styles.amountContainer}>
            <TextInput
              style={[
                styles.input, 
                styles.amountInput, 
                isDark && styles.darkInput,
              ]}
              value={form.amount}
              onChangeText={(text) => setForm(prev => ({ ...prev, amount: text.replace(',', '.') }))}
              placeholder="0.00"
              placeholderTextColor={isDark ? "#888" : "#999"}
              keyboardType="decimal-pad"
            />
          </View>
          {form.amount && (
            <Text style={[styles.hint, isDark && styles.darkSubtext]}>
              {formatAmount(Math.abs(parseFloat(form.amount) || 0))}
            </Text>
          )}
        </View>

        {/* Catégorie AVEC DROPDOWN */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Catégorie *
          </Text>
          
          <TouchableOpacity
            style={[styles.dropdownButton, isDark && styles.darkInput]}
            onPress={() => setShowCategoryDropdown(true)}
          >
            <View style={styles.dropdownButtonContent}>
              {form.category ? (
                <View style={styles.selectedCategory}>
                  <View style={[styles.categoryIconContainer, { backgroundColor: `${categories.find(cat => cat.id === form.category)?.color}20` }]}>
                    <Ionicons 
                      name={categories.find(cat => cat.id === form.category)?.icon as any} 
                      size={16} 
                      color={categories.find(cat => cat.id === form.category)?.color} 
                    />
                  </View>
                  <Text style={[styles.dropdownButtonText, isDark && styles.darkText]}>
                    {selectedCategoryName}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.dropdownPlaceholder, isDark && styles.darkSubtext]}>
                  Sélectionner une catégorie...
                </Text>
              )}
              <Ionicons 
                name="chevron-down" 
                size={20} 
                color={isDark ? "#888" : "#666"} 
              />
            </View>
          </TouchableOpacity>

          <CategoryDropdown />
        </View>

        {/* Compte */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Compte *
          </Text>
          
          {accountsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={[styles.loadingText, isDark && styles.darkSubtext]}>
                Chargement des comptes...
              </Text>
            </View>
          ) : accountsError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color="#FF3B30" />
              <Text style={styles.errorText}>
                Erreur de chargement: {accountsError}
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={refreshAccounts}
              >
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : accounts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={32} color={isDark ? "#555" : "#ccc"} />
              <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
                Aucun compte disponible
              </Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate('Accounts')}
              >
                <Text style={styles.addButtonText}>Créer un compte</Text>
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
                    form.accountId === account.id && styles.accountButtonSelected,
                    isDark && styles.darkAccountButton
                  ]}
                  onPress={() => setForm(prev => ({ ...prev, accountId: account.id }))}
                >
                  <View style={[styles.colorIndicator, { backgroundColor: account.color }]} />
                  <View style={styles.accountInfo}>
                    <Text style={[
                      styles.accountText,
                      form.accountId === account.id && styles.accountTextSelected,
                      isDark && styles.darkText
                    ]}>
                      {account.name}
                    </Text>
                    <Text style={[
                      styles.accountBalance,
                      form.accountId === account.id && styles.accountBalanceSelected,
                      isDark && styles.darkSubtext
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
          <Text style={[styles.label, isDark && styles.darkText]}>
            Description
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={form.description}
            onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
            placeholder="Ajouter une description..."
            placeholderTextColor={isDark ? "#888" : "#999"}
            multiline
          />
        </View>

        {/* Date */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Date
          </Text>
          <TouchableOpacity 
            style={[styles.dateButton, isDark && styles.darkInput]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateText, isDark && styles.darkText]}>
              {form.date.toLocaleDateString('fr-FR')}
            </Text>
            <Ionicons name="calendar" size={20} color={isDark ? "#fff" : "#666"} />
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
            <Text style={[styles.label, isDark && styles.darkText]}>
              Transaction récurrente
            </Text>
            <TouchableOpacity
              style={[
                styles.switch,
                form.isRecurring && styles.switchActive,
                isDark && styles.darkSwitch,
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
              <Text style={[styles.helperText, isDark && styles.darkSubtext]}>
                Cette transaction se répétera automatiquement
              </Text>

              {/* Fréquence */}
              <View style={styles.recurrenceSection}>
                <Text style={[styles.subLabel, isDark && styles.darkText]}>Fréquence *</Text>
                <View style={styles.frequencyContainer}>
                  {frequencyOptions.map((freq) => (
                    <TouchableOpacity
                      key={freq.value}
                      style={[
                        styles.frequencyButton,
                        form.recurrenceType === freq.value && styles.frequencyButtonSelected,
                        isDark && styles.darkFrequencyButton
                      ]}
                      onPress={() => setForm(prev => ({ ...prev, recurrenceType: freq.value as any }))}
                    >
                      <Text style={[
                        styles.frequencyText,
                        form.recurrenceType === freq.value && styles.frequencyTextSelected,
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
                  <Text style={[styles.subLabel, isDark && styles.darkText]}>
                    Date de fin
                  </Text>
                  <TouchableOpacity 
                    style={styles.toggleButton}
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
                    <Text style={styles.toggleButtonText}>
                      {hasEndDate ? 'Désactiver' : 'Activer'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {hasEndDate && (
                  <TouchableOpacity 
                    style={[styles.dateButton, isDark && styles.darkInput]}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={[styles.dateText, isDark && styles.darkText]}>
                      {form.recurrenceEndDate 
                        ? form.recurrenceEndDate.toLocaleDateString('fr-FR')
                        : 'Sélectionner une date'
                      }
                    </Text>
                    <Ionicons name="calendar" size={20} color={isDark ? "#fff" : "#666"} />
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
              (!form.amount || !form.category || !form.accountId) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={loading || !form.amount || !form.category || !form.accountId}
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
    color: '#000',
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
    borderColor: '#ddd',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 14,
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
  
  // ✅ NOUVEAUX STYLES POUR LA DROPDOWN
  dropdownButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#000',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Modal styles
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
    paddingBottom: 20,
  },
  darkModalContent: {
    backgroundColor: '#1c1c1e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    paddingVertical: 16,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  categoryItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryItemText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  categoryItemTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  subcategoryItemText: {
    fontSize: 14,
    color: '#666',
  },
  
  accountsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minWidth: 200,
  },
  darkAccountButton: {
    backgroundColor: '#2c2c2e',
    borderColor: '#444',
  },
  accountButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
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
    color: '#000',
    marginBottom: 4,
  },
  accountTextSelected: {
    color: '#fff',
  },
  accountBalance: {
    fontSize: 14,
    color: '#666',
  },
  accountBalanceSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
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
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 100,
  },
  darkFrequencyButton: {
    backgroundColor: '#333',
    borderColor: '#555',
  },
  frequencyButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  frequencyText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  frequencyTextSelected: {
    color: '#fff',
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
    color: '#007AFF',
    fontWeight: '500',
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default AddTransactionScreen;