// src/screens/EditSavingsGoalScreen.tsx - VERSION COMPLÈTE AVEC GESTION DES TRANSACTIONS
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import DeleteGoalModal from '../components/savings/DeleteGoalModal';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../hooks/useAccounts';
import { useSavings } from '../hooks/useSavings';
import { SavingsGoal } from '../types/Savings';

interface EditSavingsGoalScreenProps {
  navigation: any;
  route: any;
}

const EditSavingsGoalScreen: React.FC<EditSavingsGoalScreenProps> = ({ navigation, route }) => {
  const { goalId } = route.params;
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { formatAmount, currencySymbol } = useCurrency();
  const { getGoalById, updateGoal, deleteGoalWithTransactions, getRelatedTransactionsCount } = useSavings();
  const { accounts } = useAccounts();
  
  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: new Date(),
    monthlyContribution: '',
    category: 'other' as SavingsGoal['category'],
    color: '#007AFF',
    icon: 'flag',
    savingsAccountId: '',
    contributionAccountId: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [relatedTransactionsCount, setRelatedTransactionsCount] = useState<number>(0);

  const isDark = theme === 'dark';

  const savingsAccounts = accounts.filter(acc => acc.type === 'savings');
  const contributionAccounts = accounts.filter(acc => acc.type !== 'savings');

  const categories = [
    { value: 'vacation' as const, label: 'Vacances', icon: 'airplane' },
    { value: 'car' as const, label: 'Voiture', icon: 'car' },
    { value: 'house' as const, label: 'Maison', icon: 'home' },
    { value: 'emergency' as const, label: 'Urgence', icon: 'medical' },
    { value: 'education' as const, label: 'Éducation', icon: 'school' },
    { value: 'retirement' as const, label: 'Retraite', icon: 'heart' },
    { value: 'other' as const, label: 'Autre', icon: 'flag' },
  ];

  const colors = [
    '#007AFF', '#34C759', '#FF3B30', '#FF9500', '#5856D6', 
    '#AF52DE', '#FF2D55', '#32D74B', '#FFD60A'
  ];

  useEffect(() => {
    if (goalId) {
      loadGoalData();
      loadRelatedTransactionsCount();
    }
  }, [goalId]);

  const loadGoalData = async () => {
    try {
      setInitialLoading(true);
      const goal = await getGoalById(goalId);
      
      if (goal) {
        setForm({
          name: goal.name,
          targetAmount: goal.targetAmount.toString(),
          currentAmount: goal.currentAmount.toString(),
          targetDate: new Date(goal.targetDate),
          monthlyContribution: goal.monthlyContribution.toString(),
          category: goal.category,
          color: goal.color,
          icon: goal.icon,
          savingsAccountId: goal.savingsAccountId || '',
          contributionAccountId: goal.contributionAccountId || '',
        });
      } else {
        Alert.alert(t.error, 'Objectif non trouvé');
        navigation.navigate('SavingsList');
      }
    } catch (error) {
      console.error('Error loading goal:', error);
      Alert.alert(t.error, 'Impossible de charger l\'objectif');
      navigation.navigate('SavingsList');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadRelatedTransactionsCount = async () => {
    try {
      const count = await getRelatedTransactionsCount(goalId);
      setRelatedTransactionsCount(count);
    } catch (error) {
      console.error('Error loading related transactions count:', error);
    }
  };

  const handleAmountChange = (field: 'targetAmount' | 'currentAmount' | 'monthlyContribution', value: string) => {
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

  const formatDisplayAmount = (value: string): string => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return formatAmount(num);
  };

  const handleSave = async () => {
    if (!form.name || !form.targetAmount || !form.monthlyContribution || !form.savingsAccountId) {
      Alert.alert(t.error, 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    const targetAmount = parseFloat(form.targetAmount);
    const monthlyContribution = parseFloat(form.monthlyContribution);
    const currentAmount = parseFloat(form.currentAmount || '0');

    if (isNaN(targetAmount) || targetAmount <= 0) {
      Alert.alert(t.error, 'Le montant cible doit être un nombre positif');
      return;
    }

    if (isNaN(monthlyContribution) || monthlyContribution <= 0) {
      Alert.alert(t.error, 'La contribution mensuelle doit être un nombre positif');
      return;
    }

    setLoading(true);
    try {
      await updateGoal(goalId, {
        name: form.name.trim(),
        targetAmount,
        currentAmount,
        targetDate: form.targetDate.toISOString().split('T')[0],
        monthlyContribution,
        category: form.category,
        color: form.color,
        icon: form.icon,
        savingsAccountId: form.savingsAccountId,
        contributionAccountId: form.contributionAccountId || undefined,
      });
      
      Alert.alert(
        'Succès',
        'Objectif modifié avec succès',
        [{ text: 'OK', onPress: () => navigation.navigate('SavingsList') }]
      );
    } catch (error) {
      console.error('Erreur modification objectif:', error);
      Alert.alert(t.error, 'Impossible de modifier l\'objectif');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FONCTION AMÉLIORÉE : Gestion de la suppression avec transactions
  const handleDeleteGoal = async (withRefund: boolean, deleteTransactions: boolean) => {
    setDeleteLoading(true);
    try {
      await deleteGoalWithTransactions(goalId, deleteTransactions, withRefund);
      
      Alert.alert(
        'Succès',
        'Objectif supprimé avec succès',
        [{ text: 'OK', onPress: () => navigation.navigate('SavingsList') }]
      );
    } catch (error) {
      console.error('Erreur suppression objectif:', error);
      Alert.alert(t.error, 'Impossible de supprimer l\'objectif');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setForm(prev => ({ ...prev, targetDate: selectedDate }));
    }
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
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView 
        style={[styles.container, isDark && styles.darkContainer]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('SavingsList')}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.darkText]}>
            Modifier l'Objectif
          </Text>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => setShowDeleteModal(true)}
            disabled={loading}
          >
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            {relatedTransactionsCount > 0 && (
              <View style={styles.transactionsBadge}>
                <Text style={styles.transactionsBadgeText}>
                  {relatedTransactionsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ✅ INDICATEUR DE TRANSACTIONS LIÉES */}
        {relatedTransactionsCount > 0 && (
          <View style={[styles.transactionsAlert, isDark && styles.darkTransactionsAlert]}>
            <Ionicons name="information-circle" size={20} color="#1976d2" />
            <Text style={[styles.transactionsAlertText, isDark && styles.darkText]}>
              {relatedTransactionsCount} transaction{relatedTransactionsCount > 1 ? 's' : ''} liée{relatedTransactionsCount > 1 ? 's' : ''} à cet objectif
            </Text>
          </View>
        )}

        {/* Formulaire */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Nom de l'objectif *
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={form.name}
            onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
            placeholder="Ex: Achat voiture, Vacances..."
            placeholderTextColor={isDark ? "#888" : "#999"}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Montant cible *
          </Text>
          <View style={styles.amountContainer}>
            <Text style={[styles.currencySymbol, isDark && styles.darkText]}>{currencySymbol}</Text>
            <TextInput
              style={[styles.input, styles.amountInput, isDark && styles.darkInput]}
              value={form.targetAmount}
              onChangeText={(value) => handleAmountChange('targetAmount', value)}
              placeholder="0,00"
              placeholderTextColor={isDark ? "#888" : "#999"}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
          {form.targetAmount && (
            <Text style={[styles.hint, isDark && styles.darkSubtext]}>
              {formatDisplayAmount(form.targetAmount)}
            </Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Épargne actuelle
          </Text>
          <View style={styles.amountContainer}>
            <Text style={[styles.currencySymbol, isDark && styles.darkText]}>{currencySymbol}</Text>
            <TextInput
              style={[styles.input, styles.amountInput, isDark && styles.darkInput]}
              value={form.currentAmount}
              onChangeText={(value) => handleAmountChange('currentAmount', value)}
              placeholder="0,00"
              placeholderTextColor={isDark ? "#888" : "#999"}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
          {form.currentAmount && (
            <Text style={[styles.hint, isDark && styles.darkSubtext]}>
              {formatDisplayAmount(form.currentAmount)}
            </Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Contribution mensuelle *
          </Text>
          <View style={styles.amountContainer}>
            <Text style={[styles.currencySymbol, isDark && styles.darkText]}>{currencySymbol}</Text>
            <TextInput
              style={[styles.input, styles.amountInput, isDark && styles.darkInput]}
              value={form.monthlyContribution}
              onChangeText={(value) => handleAmountChange('monthlyContribution', value)}
              placeholder="0,00"
              placeholderTextColor={isDark ? "#888" : "#999"}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
          {form.monthlyContribution && (
            <Text style={[styles.hint, isDark && styles.darkSubtext]}>
              {formatDisplayAmount(form.monthlyContribution)}
            </Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Date cible
          </Text>
          <TouchableOpacity 
            style={[styles.dateButton, isDark && styles.darkInput]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateText, isDark && styles.darkText]}>
              {form.targetDate.toLocaleDateString('fr-FR')}
            </Text>
            <Ionicons name="calendar" size={20} color={isDark ? "#fff" : "#666"} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={form.targetDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Compte d'épargne *
          </Text>
          <View style={styles.accountsContainer}>
            {savingsAccounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.accountButton,
                  form.savingsAccountId === account.id && styles.accountButtonSelected,
                  isDark && styles.darkAccountButton
                ]}
                onPress={() => setForm(prev => ({ ...prev, savingsAccountId: account.id }))}
              >
                <View style={[styles.accountColor, { backgroundColor: account.color }]} />
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountName, isDark && styles.darkText]}>
                    {account.name}
                  </Text>
                  <Text style={[styles.accountBalance, isDark && styles.darkSubtext]}>
                    {account.balance.toFixed(2)} MAD
                  </Text>
                </View>
                {form.savingsAccountId === account.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          {savingsAccounts.length === 0 && (
            <Text style={[styles.warningText, isDark && styles.darkSubtext]}>
              Aucun compte d'épargne trouvé.
            </Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Compte source des contributions
          </Text>
          <View style={styles.accountsContainer}>
            {contributionAccounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.accountButton,
                  form.contributionAccountId === account.id && styles.accountButtonSelected,
                  isDark && styles.darkAccountButton
                ]}
                onPress={() => setForm(prev => ({ ...prev, contributionAccountId: account.id }))}
              >
                <View style={[styles.accountColor, { backgroundColor: account.color }]} />
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountName, isDark && styles.darkText]}>
                    {account.name}
                  </Text>
                  <Text style={[styles.accountBalance, isDark && styles.darkSubtext]}>
                    {account.balance.toFixed(2)} MAD
                  </Text>
                </View>
                {form.contributionAccountId === account.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.hint, isDark && styles.darkSubtext]}>
            Sélectionnez le compte depuis lequel les fonds seront transférés
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Catégorie
          </Text>
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.value}
                style={[
                  styles.categoryButton,
                  form.category === category.value && styles.categoryButtonSelected,
                  isDark && styles.darkCategoryButton
                ]}
                onPress={() => setForm(prev => ({ 
                  ...prev, 
                  category: category.value,
                  icon: category.icon 
                }))}
              >
                <Ionicons 
                  name={category.icon as any} 
                  size={20} 
                  color={form.category === category.value ? '#fff' : '#666'} 
                />
                <Text style={[
                  styles.categoryText,
                  form.category === category.value && styles.categoryTextSelected,
                  isDark && styles.darkText
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
                onPress={() => setForm(prev => ({ ...prev, color }))}
              >
                {form.color === color && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.cancelButton, isDark && styles.darkCancelButton]}
              onPress={() => navigation.navigate('SavingsScreen')}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              (loading || !form.name || !form.targetAmount || !form.monthlyContribution || !form.savingsAccountId) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={loading || !form.name || !form.targetAmount || !form.monthlyContribution || !form.savingsAccountId}
          >
            <Text style={styles.saveButtonText}>
              {loading ? t.modifying : t.editSavingsGoal}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ✅ MODAL DE SUPPRESSION AMÉLIORÉ */}
      <DeleteGoalModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteGoal}
        goal={{
          id: goalId,
          name: form.name,
          currentAmount: parseFloat(form.currentAmount || '0'),
          targetAmount: parseFloat(form.targetAmount || '0'),
          targetDate: form.targetDate.toISOString().split('T')[0],
          monthlyContribution: parseFloat(form.monthlyContribution || '0'),
          category: form.category,
          color: form.color,
          icon: form.icon,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          userId: 'default-user',
          savingsAccountId: form.savingsAccountId,
        }}
        loading={deleteLoading}
      />
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
    justifyContent: 'space-between',
    marginBottom: 20,
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
    position: 'relative',
  },
  // ✅ NOUVEAUX STYLES POUR LES TRANSACTIONS
  transactionsAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  darkTransactionsAlert: {
    backgroundColor: '#1a237e',
  },
  transactionsAlertText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1976d2',
    flex: 1,
  },
  transactionsBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#1976d2',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionsBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 12,
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  amountInput: {
    paddingLeft: 70,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
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
  accountsContainer: {
    gap: 8,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  darkAccountButton: {
    backgroundColor: '#2c2c2e',
    borderColor: '#444',
  },
  accountButtonSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#F0F8FF',
  },
  accountColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  accountBalance: {
    fontSize: 12,
    color: '#666',
  },
  warningText: {
    fontSize: 12,
    color: '#FF3B30',
    fontStyle: 'italic',
    marginTop: 4,
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
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 8,
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
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default EditSavingsGoalScreen;