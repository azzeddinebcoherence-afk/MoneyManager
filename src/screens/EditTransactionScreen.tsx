// src/screens/EditTransactionScreen.tsx - VERSION CORRIGÉE
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
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';
import { Transaction } from '../types'; // Importez le type Transaction

const EditTransactionScreen = ({ navigation, route }: any) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { accounts, loading: accountsLoading, refreshAccounts } = useAccounts();
  const { categories, loading: categoriesLoading } = useCategories();
  const { getTransactionById, updateTransaction, deleteTransaction } = useTransactions();
  
  const transactionId = route.params?.transactionId;
  
  const [form, setForm] = useState({
    amount: '',
    type: 'expense' as 'expense' | 'income', // ✅ Définir explicitement le type
    category: '',
    accountId: '',
    description: '',
    date: new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalTransaction, setOriginalTransaction] = useState<Transaction | null>(null);

  const isDark = theme === 'dark';

  // ✅ Charger la transaction à modifier
  useEffect(() => {
    const loadTransaction = async () => {
      if (!transactionId) {
        Alert.alert(t.error, 'Aucune transaction sélectionnée');
        navigation.navigate('Transactions');
        return;
      }

      try {
        setLoading(true);
        console.log('🔄 Chargement de la transaction:', transactionId);
        
        const transaction = await getTransactionById(transactionId);
        
        if (!transaction) {
          Alert.alert(t.error, 'Transaction non trouvée');
          navigation.navigate('Transactions');
          return;
        }

        setOriginalTransaction(transaction);
        
        // ✅ S'assurer que le type est soit 'expense' soit 'income'
        const transactionType = transaction.type === 'expense' || transaction.type === 'income' 
          ? transaction.type 
          : 'expense';
        
        setForm({
          amount: Math.abs(transaction.amount).toString(),
          type: transactionType,
          category: transaction.category,
          accountId: transaction.accountId,
          description: transaction.description || '',
          date: new Date(transaction.date),
        });

        console.log('✅ Transaction chargée:', transaction);
      } catch (error) {
        console.error('❌ Erreur chargement transaction:', error);
        Alert.alert(t.error, 'Impossible de charger la transaction');
        navigation.navigate('Transactions');
      } finally {
        setLoading(false);
      }
    };

    loadTransaction();
    refreshAccounts();
  }, [transactionId]);

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

    setSaving(true);
    try {
      console.log('🔄 Modification de la transaction:', transactionId);
      
      // ✅ Préparer les données avec le bon typage
      const updateData = {
        amount: form.type === 'expense' ? -Math.abs(parseFloat(form.amount)) : Math.abs(parseFloat(form.amount)),
        type: form.type,
        category: form.category,
        accountId: form.accountId,
        description: form.description,
        date: form.date.toISOString().split('T')[0],
      };

      await updateTransaction(transactionId, updateData);

      Alert.alert(
        'Succès',
        'Transaction modifiée avec succès',
        [{ 
          text: 'OK', 
          onPress: () => navigation.navigate('Transactions')
        }]
      );
    } catch (error) {
      console.error('❌ Erreur modification transaction:', error);
      Alert.alert(t.error, 'Impossible de modifier la transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cette transaction ?',
      [
        { text: t.cancel, style: 'cancel' },
        { 
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transactionId);
              Alert.alert(
                'Succès',
                'Transaction supprimée avec succès',
                [{ 
                  text: 'OK', 
                  onPress: () => navigation.navigate('Transactions')
                }]
              );
            } catch (error) {
              console.error('❌ Erreur suppression transaction:', error);
              Alert.alert(t.error, 'Impossible de supprimer la transaction');
            }
          }
        }
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setForm(prev => ({ ...prev, date: selectedDate }));
    }
  };

  // ✅ Réinitialiser la catégorie quand le type change
  useEffect(() => {
    if (form.type !== originalTransaction?.type) {
      setForm(prev => ({ ...prev, category: '' }));
    }
  }, [form.type]);

  const filteredCategories = categories.filter(cat => cat.type === form.type);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>
            Chargement de la transaction...
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('Transactions', { screen: 'TransactionsList' })}
          >
            <Ionicons name="close" size={24} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.darkText]}>
            Modifier Transaction
          </Text>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={22} color="#FF3B30" />
          </TouchableOpacity>
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

        {/* Catégorie */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Catégorie *
          </Text>
          <CategoryPickerDropdown
            categories={filteredCategories}
            selectedCategoryId={form.category || null}
            onSelect={(category) => {
              // CategoryPickerDropdown returns the Category object — store its id
              setForm(prev => ({ ...prev, category: category.id }));
            }}
            type={form.type}
          />
        </View>

        {/* Compte */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Compte *
          </Text>
          
          {accountsLoading ? (
            <View style={styles.loadingSmallContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={[styles.loadingText, isDark && styles.darkSubtext]}>
                Chargement des comptes...
              </Text>
            </View>
          ) : accounts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={32} color={isDark ? "#555" : "#ccc"} />
              <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
                Aucun compte disponible
              </Text>
            </View>
          ) : (
            <View style={styles.accountsContainer}>
              {accounts.map((account) => (
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
                    ]}>
                      {account.name}
                    </Text>
                    <Text style={[
                      styles.accountBalance,
                      form.accountId === account.id && styles.accountBalanceSelected,
                      isDark && styles.darkSubtext
                    ]}>
                      {account.balance.toFixed(2)} DH
                    </Text>
                  </View>
                  {form.accountId === account.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
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
            placeholder={t.enterDescription}
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

        {/* Boutons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.cancelButton, isDark && styles.darkCancelButton]}
            onPress={() => navigation.navigate('Transactions', { screen: 'TransactionsList' })}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              saving && styles.saveButtonDisabled,
              (!form.amount || !form.category || !form.accountId) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={saving || !form.amount || !form.category || !form.accountId}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Modification...' : 'Modifier'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Les styles restent identiques...
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
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
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
    position: 'relative',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },

  hint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
    color: '#666',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 8,
  },
  accountsContainer: {
    gap: 8,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingSmallContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
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
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default EditTransactionScreen;