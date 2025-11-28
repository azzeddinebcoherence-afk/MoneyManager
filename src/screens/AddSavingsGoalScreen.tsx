// src/screens/AddSavingsGoalScreen.tsx - VERSION AVEC DÉFILEMENT CORRIGÉ
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
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
import { useDesignSystem } from '../context/ThemeContext';
import { useAccounts } from '../hooks/useAccounts';
import { useSavings } from '../hooks/useSavings';
import { CreateSavingsGoalData, SavingsGoal } from '../types/Savings';

// ✅ AJOUT: Obtenir les dimensions de l'écran
const { height: screenHeight } = Dimensions.get('window');

interface SavingsGoalForm {
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: Date;
  monthlyContribution: string;
  category: SavingsGoal['category'];
  color: string;
  icon: string;
  savingsAccountId: string;
  contributionAccountId: string;
}

interface AddSavingsGoalScreenProps {
  navigation: any;
}

export const AddSavingsGoalScreen: React.FC<AddSavingsGoalScreenProps> = ({ navigation }) => {
  const { t } = useLanguage();
  const { colors } = useDesignSystem();
  const { formatAmount } = useCurrency();
  const { createGoal } = useSavings();
  const { accounts } = useAccounts();
  
  const [form, setForm] = useState<SavingsGoalForm>({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    monthlyContribution: '',
    category: 'other',
    color: '#007AFF',
    icon: 'flag',
    savingsAccountId: '',
    contributionAccountId: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const goalColors = [
    '#007AFF', '#34C759', '#FF3B30', '#FF9500', '#5856D6', 
    '#AF52DE', '#FF2D55', '#32D74B', '#FFD60A'
  ];

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
    
    return formatAmount(num, false);
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

    if (isNaN(currentAmount) || currentAmount < 0) {
      Alert.alert(t.error, 'L\'épargne actuelle doit être un nombre positif ou zéro');
      return;
    }

    setLoading(true);
    try {
      const goalData: CreateSavingsGoalData = {
        name: form.name.trim(),
        targetAmount: targetAmount,
        targetDate: form.targetDate.toISOString().split('T')[0],
        monthlyContribution: monthlyContribution,
        category: form.category,
        color: form.color,
        icon: form.icon,
        savingsAccountId: form.savingsAccountId,
        contributionAccountId: form.contributionAccountId || undefined,
      };

      await createGoal(goalData);
      
      Alert.alert(
        'Succès',
        'Objectif d\'\u00e9pargne créé avec succès',
        [{ text: 'OK', onPress: () => navigation.navigate('SavingsList') }]
      );
    } catch (error) {
      console.error('Erreur création objectif:', error);
      Alert.alert(t.error, 'Impossible de créer l\'objectif d\'épargne');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setForm(prev => ({ ...prev, targetDate: selectedDate }));
    }
  };

  const calculateMonthsRemaining = (): number => {
    if (!form.targetAmount || !form.monthlyContribution) return 0;
    
    const target = parseFloat(form.targetAmount);
    const monthly = parseFloat(form.monthlyContribution);
    const current = parseFloat(form.currentAmount || '0');
    
    if (isNaN(target) || isNaN(monthly) || monthly <= 0) return 0;
    
    const remaining = target - current;
    return Math.ceil(remaining / monthly);
  };

  const monthsRemaining = calculateMonthsRemaining();

  return (
    <SafeAreaView>
      {/* ✅ CORRECTION: KeyboardAvoidingView pour gérer le clavier */}
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ✅ CORRECTION: ScrollView avec défilement complet */}
        <ScrollView 
          style={[styles.scrollView, { backgroundColor: colors.background.primary }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.navigate('SavingsList')}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Nouvel Objectif
            </Text>
          </View>

          {/* Nom de l'objectif */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Nom de l'objectif *
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
              value={form.name}
              onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
              placeholder="Ex: Achat voiture, Vacances..."
              placeholderTextColor={colors.text.disabled}
            />
          </View>

          {/* Montant cible */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Montant cible *
            </Text>
            <View style={styles.amountContainer}>
              <TextInput
                style={[styles.input, styles.amountInput, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
                value={form.targetAmount}
                onChangeText={(value) => handleAmountChange('targetAmount', value)}
                placeholder="0,00"
                placeholderTextColor={colors.text.disabled}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
            {form.targetAmount && (
              <Text style={[styles.hint, { color: colors.text.secondary }]}>
                {formatDisplayAmount(form.targetAmount)}
              </Text>
            )}
          </View>

          {/* Épargne actuelle */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Épargne actuelle
            </Text>
            <View style={styles.amountContainer}>
              <TextInput
                style={[styles.input, styles.amountInput, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
                value={form.currentAmount}
                onChangeText={(value) => handleAmountChange('currentAmount', value)}
                placeholder="0,00"
                placeholderTextColor={colors.text.disabled}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
            {form.currentAmount && (
              <Text style={[styles.hint, { color: colors.text.secondary }]}>
                {formatDisplayAmount(form.currentAmount)}
              </Text>
            )}
          </View>

          {/* Contribution mensuelle */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Contribution mensuelle *
            </Text>
            <View style={styles.amountContainer}>
              <TextInput
                style={[styles.input, styles.amountInput, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
                value={form.monthlyContribution}
                onChangeText={(value) => handleAmountChange('monthlyContribution', value)}
                placeholder="0,00"
                placeholderTextColor={colors.text.disabled}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
            {form.monthlyContribution && (
              <Text style={[styles.hint, { color: colors.text.secondary }]}>
                {formatDisplayAmount(form.monthlyContribution)}
              </Text>
            )}
            {monthsRemaining > 0 && (
              <Text style={[styles.hint, { color: colors.text.secondary }]}>
                Temps estimé: {monthsRemaining} mois
              </Text>
            )}
          </View>

          {/* Date cible */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Date cible
            </Text>
            <TouchableOpacity 
              style={[styles.dateButton, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateText, { color: colors.text.primary }]}>
                {form.targetDate.toLocaleDateString('fr-FR')}
              </Text>
              <Ionicons name="calendar" size={20} color={colors.text.secondary} />
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

          {/* Compte d'épargne */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Compte d'épargne *
            </Text>
            <View style={styles.accountsContainer}>
              {savingsAccounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountButton,
                    form.savingsAccountId === account.id && styles.accountButtonSelected,
                    { backgroundColor: form.savingsAccountId === account.id ? colors.primary[500] + '20' : colors.background.card, borderColor: colors.border.primary }
                  ]}
                  onPress={() => setForm(prev => ({ ...prev, savingsAccountId: account.id }))}
                >
                  <View style={[styles.accountColor, { backgroundColor: account.color }]} />
                  <View style={styles.accountInfo}>
                    <Text style={[styles.accountName, { color: colors.text.primary }]}>
                      {account.name}
                    </Text>
                    <Text style={[styles.accountBalance, { color: colors.text.secondary }]}>
                      {formatAmount(account.balance, false)}
                    </Text>
                  </View>
                  {form.savingsAccountId === account.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {savingsAccounts.length === 0 && (
              <Text style={[styles.warningText, { color: colors.text.secondary }]}>
                Aucun compte d'épargne trouvé. Créez d'abord un compte d'épargne.
              </Text>
            )}
          </View>

          {/* Compte source des contributions */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Compte source des contributions
            </Text>
            <View style={styles.accountsContainer}>
              {contributionAccounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountButton,
                    form.contributionAccountId === account.id && styles.accountButtonSelected,
                    { backgroundColor: form.contributionAccountId === account.id ? colors.primary[500] + '20' : colors.background.card, borderColor: colors.border.primary }
                  ]}
                  onPress={() => setForm(prev => ({ ...prev, contributionAccountId: account.id }))}
                >
                  <View style={[styles.accountColor, { backgroundColor: account.color }]} />
                  <View style={styles.accountInfo}>
                    <Text style={[styles.accountName, { color: colors.text.primary }]}>
                      {account.name}
                    </Text>
                    <Text style={[styles.accountBalance, { color: colors.text.secondary }]}>
                      {formatAmount(account.balance, false)}
                    </Text>
                  </View>
                  {form.contributionAccountId === account.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.hint, { color: colors.text.secondary }]}>
              Sélectionnez le compte depuis lequel les fonds seront transférés
            </Text>
          </View>

          {/* Catégorie */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Catégorie
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              style={styles.categoriesScrollContainer}
              contentContainerStyle={styles.categoriesContent}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryButton,
                    form.category === category.value && styles.categoryButtonSelected,
                    { backgroundColor: form.category === category.value ? colors.primary[500] : colors.background.card, borderColor: colors.border.primary }
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
                    color={form.category === category.value ? '#fff' : colors.text.secondary} 
                  />
                  <Text style={[
                    styles.categoryText,
                    form.category === category.value && styles.categoryTextSelected,
                    { color: form.category === category.value ? '#fff' : colors.text.primary }
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Couleur */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Couleur
            </Text>
            <View style={styles.colorsContainer}>
              {goalColors.map((color) => (
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

          {/* ✅ CORRECTION: Boutons DANS le ScrollView mais avec un espacement approprié */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
              onPress={() => navigation.navigate('SavingsScreen')}
              disabled={loading}
            >
              <Ionicons name="close" size={20} color={colors.text.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.cancelButtonText, { color: colors.text.primary }]}>Fermer</Text>
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
                {loading ? 'Création...' : 'Créer l\'objectif'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ✅ CORRECTION: Espace supplémentaire pour permettre le défilement */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    paddingLeft: 10,
    paddingRight: 10,
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
  categoriesScrollContainer: {
    maxHeight: 60,
  },
  categoriesContent: {
    paddingRight: 20,
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
    marginRight: 8,
    minWidth: 120,
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
    marginBottom: 20,
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
  bottomSpacer: {
    height: 40,
  },
});

export default AddSavingsGoalScreen;