// src/screens/EditBudgetScreen.tsx
import { Ionicons } from '@expo/vector-icons';
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
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useBudgets } from '../hooks/useBudgets';
import { Budget } from '../types';

const EditBudgetScreen = ({ navigation, route }: any) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { updateBudget, getBudgetById } = useBudgets();
  
  const { budgetId } = route.params;
  const isDark = theme === 'dark';

  const [form, setForm] = useState({
    name: '',
    category: '',
    amount: '',
    period: 'monthly' as Budget['period'],
    startDate: '',
    endDate: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBudget();
  }, [budgetId]);

  const loadBudget = async () => {
    try {
      const budget = await getBudgetById(budgetId);
      if (budget) {
        setForm({
          name: budget.name,
          category: budget.category,
          amount: budget.amount.toString(),
          period: budget.period,
          startDate: budget.startDate,
          endDate: budget.endDate || '',
          isActive: budget.isActive,
        });
      }
    } catch (error) {
      Alert.alert(t.error, 'Impossible de charger le budget');
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.category || !form.amount || parseFloat(form.amount) <= 0) {
      Alert.alert(t.error, 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      await updateBudget(budgetId, {
        name: form.name,
        category: form.category,
        amount: parseFloat(form.amount),
        period: form.period,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        isActive: form.isActive,
      });

      Alert.alert(
        'Succès',
        'Budget modifié avec succès',
        [{ 
          text: 'OK', 
          onPress: () => navigation.goBack()
        }]
      );
    } catch (error) {
      Alert.alert(t.error, 'Impossible de modifier le budget');
    } finally {
      setLoading(false);
    }
  };

  const periods = [
    { value: 'daily' as const, label: 'Quotidien' },
    { value: 'weekly' as const, label: 'Hebdomadaire' },
    { value: 'monthly' as const, label: 'Mensuel' },
    { value: 'yearly' as const, label: 'Annuel' },
  ];

  return (
    <SafeAreaView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={[styles.container, isDark && styles.darkContainer]}
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
              Modifier le Budget
            </Text>
          </View>

        {/* Nom */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Nom du budget *
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={form.name}
            onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
            placeholder="Ex: Budget Alimentation"
            placeholderTextColor={isDark ? "#888" : "#999"}
          />
        </View>

        {/* Catégorie */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Catégorie *
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={form.category}
            onChangeText={(text) => setForm(prev => ({ ...prev, category: text }))}
            placeholder="Ex: Alimentation"
            placeholderTextColor={isDark ? "#888" : "#999"}
          />
        </View>

        {/* Montant */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Montant *
          </Text>
          <View style={styles.amountContainer}>
            <Text style={[styles.currencySymbol, isDark && styles.darkText]}>€</Text>
            <TextInput
              style={[styles.input, styles.amountInput, isDark && styles.darkInput]}
              value={form.amount}
              onChangeText={(text) => setForm(prev => ({ ...prev, amount: text.replace(',', '.') }))}
              placeholder="0.00"
              placeholderTextColor={isDark ? "#888" : "#999"}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Période */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Période *
          </Text>
          <View style={styles.periodsContainer}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.periodButton,
                  form.period === period.value && styles.periodButtonSelected,
                  isDark && styles.darkPeriodButton,
                ]}
                onPress={() => setForm(prev => ({ ...prev, period: period.value }))}
              >
                <Text style={[
                  styles.periodButtonText,
                  form.period === period.value && styles.periodButtonTextSelected,
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date de début */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Date de début *
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={form.startDate}
            onChangeText={(text) => setForm(prev => ({ ...prev, startDate: text }))}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={isDark ? "#888" : "#999"}
          />
        </View>

        {/* Date de fin (optionnelle) */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Date de fin (optionnelle)
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={form.endDate}
            onChangeText={(text) => setForm(prev => ({ ...prev, endDate: text }))}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={isDark ? "#888" : "#999"}
          />
        </View>

        {/* Statut actif */}
        <View style={styles.inputGroup}>
          <TouchableOpacity
            style={styles.switchContainer}
            onPress={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
          >
            <View style={[
              styles.switch,
              form.isActive && styles.switchActive,
              isDark && styles.darkSwitch,
            ]}>
              <View style={[
                styles.switchThumb,
                form.isActive && styles.switchThumbActive,
              ]} />
            </View>
            <Text style={[styles.switchLabel, isDark && styles.darkText]}>
              Budget actif
            </Text>
          </TouchableOpacity>
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
              (!form.name || !form.category || !form.amount || !form.startDate) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={loading || !form.name || !form.category || !form.amount || !form.startDate}
          >
            <Text style={styles.saveButtonText}>
              {loading ? t.saving : t.save}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  darkHeader: {
    borderBottomColor: '#38383a',
  },
  backButton: {
    padding: 4,
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  inputGroup: {
    padding: 16,
    paddingBottom: 0,
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
    borderRadius: 8,
    padding: 12,
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
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
  },
  periodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    minWidth: '48%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  darkPeriodButton: {
    backgroundColor: '#2c2c2e',
  },
  periodButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  periodButtonTextSelected: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switch: {
    width: 50,
    height: 28,
    backgroundColor: '#ccc',
    borderRadius: 14,
    padding: 2,
    marginRight: 12,
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
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  darkCancelButton: {
    backgroundColor: '#2c2c2e',
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
    borderRadius: 8,
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
});

export default EditBudgetScreen;