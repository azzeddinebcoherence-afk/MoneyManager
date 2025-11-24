// src/components/budget/BudgetForm.tsx - VERSION CORRIGÉE AVEC MAD
import { Ionicons } from '@expo/vector-icons';
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
import { useCurrency } from '../../context/CurrencyContext'; // ✅ AJOUT
import { useTheme } from '../../context/ThemeContext';
import { useCategories } from '../../hooks/useCategories';
import { Budget, BUDGET_PERIODS } from '../../types';
import { CategoryPickerDropdown } from '../ui/CategoryPickerDropdown';

interface BudgetFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (budget: Omit<Budget, 'id' | 'createdAt' | 'spent'>) => void;
  editingBudget?: Budget | null;
}

const BudgetForm: React.FC<BudgetFormProps> = ({
  visible,
  onClose,
  onSubmit,
  editingBudget,
}) => {
  const { theme } = useTheme();
  const { formatAmount } = useCurrency(); // ✅ AJOUT
  const { categories } = useCategories();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    amount: '',
    period: 'monthly' as Budget['period'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true,
  });

  // Initialiser le formulaire
  useEffect(() => {
    if (editingBudget) {
      setFormData({
        name: editingBudget.name,
        category: editingBudget.category,
        amount: editingBudget.amount.toString(),
        period: editingBudget.period,
        startDate: editingBudget.startDate,
        endDate: editingBudget.endDate || '',
        isActive: editingBudget.isActive,
      });
    } else {
      setFormData({
        name: '',
        category: '',
        amount: '',
        period: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isActive: true,
      });
    }
  }, [editingBudget, visible]);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('Veuillez saisir un nom pour le budget');
      return;
    }

    if (!formData.category) {
      alert('Veuillez sélectionner une catégorie');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Veuillez saisir un montant valide');
      return;
    }

    const budgetData: Omit<Budget, 'id' | 'createdAt' | 'spent'> = {
      name: formData.name.trim(),
      category: formData.category,
      amount: parseFloat(formData.amount),
      period: formData.period,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      isActive: formData.isActive,
    };

    onSubmit(budgetData);
    onClose();
  };

  const expenseCategories = categories.filter((cat: any) => cat.type === 'expense');

  const isFormValid = formData.name.trim() && formData.category && formData.amount && parseFloat(formData.amount) > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, isDark && styles.darkContainer]}>
        {/* Header */}
        <View style={[styles.header, isDark && styles.darkHeader]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.darkText]}>
            {editingBudget ? 'Modifier le budget' : 'Nouveau budget'}
          </Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Nom du budget */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>
              Nom du budget
            </Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Ex: Budget courses, Budget loisirs..."
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>

          {/* Catégorie */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>
              Catégorie
            </Text>
            <CategoryPickerDropdown
              categories={expenseCategories}
              selectedCategoryId={expenseCategories.find((c: any) => c.name === formData.category)?.id || null}
              onSelect={(categoryId) => {
                const selectedCat = expenseCategories.find((c: any) => c.id === categoryId);
                if (selectedCat) {
                  setFormData({ ...formData, category: selectedCat.name });
                }
              }}
              type="expense"
            />
          </View>

          {/* Montant */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>
              Montant du budget
            </Text>
            <View style={[styles.amountContainer, isDark && styles.darkAmountContainer]}>
              <TextInput
                style={[styles.amountInput, isDark && styles.darkInput]}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text.replace(',', '.') })}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={isDark ? '#666' : '#999'}
              />
              {/* ✅ CORRECTION : Utiliser le symbole de devise dynamique */}
              <Text style={[styles.currency, isDark && styles.darkText]}>
                {formatAmount(0, false).split(' ')[0]}
              </Text>
            </View>
            {/* ✅ CORRECTION : Afficher le montant formaté */}
            {formData.amount && (
              <Text style={[styles.helperText, isDark && styles.darkSubtext]}>
                Montant: {formatAmount(parseFloat(formData.amount) || 0)}
              </Text>
            )}
          </View>

          {/* Période */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>
              Période
            </Text>
            <View style={styles.periodGrid}>
              {BUDGET_PERIODS.map((period: any) => (
                <TouchableOpacity
                  key={period.value}
                  style={[
                    styles.periodButton,
                    formData.period === period.value && styles.periodButtonSelected,
                    isDark && styles.darkPeriodButton,
                  ]}
                  onPress={() => setFormData({ ...formData, period: period.value })}
                >
                  <Text style={[
                    styles.periodButtonText,
                    formData.period === period.value && styles.periodButtonTextSelected,
                    isDark && styles.darkText,
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
              Date de début
            </Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={formData.startDate}
              onChangeText={(text) => setFormData({ ...formData, startDate: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>

          {/* Date de fin (optionnelle) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.darkText]}>
              Date de fin (optionnelle)
            </Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={formData.endDate}
              onChangeText={(text) => setFormData({ ...formData, endDate: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>

          {/* Statut actif */}
          <View style={styles.inputGroup}>
            <View style={styles.switchContainer}>
              <Text style={[styles.label, isDark && styles.darkText]}>
                Budget actif
              </Text>
              <TouchableOpacity
                style={[
                  styles.switch,
                  formData.isActive && styles.switchActive,
                  isDark && styles.darkSwitch,
                ]}
                onPress={() => setFormData({ ...formData, isActive: !formData.isActive })}
              >
                <View style={[
                  styles.switchThumb,
                  formData.isActive && styles.switchThumbActive,
                ]} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.helperText, isDark && styles.darkSubtext]}>
              {formData.isActive 
                ? 'Le budget sera pris en compte dans les alertes et statistiques' 
                : 'Le budget est suspendu'
              }
            </Text>
          </View>

          {/* Bouton de soumission */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              !isFormValid && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid}
          >
            <Text style={styles.submitButtonText}>
              {editingBudget ? 'Modifier le budget' : 'Créer le budget'}
            </Text>
          </TouchableOpacity>

          <View style={styles.spacer} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#1c1c1e',
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
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  darkAmountContainer: {
    backgroundColor: '#2c2c2e',
    borderColor: '#38383a',
  },
  amountInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  currency: {
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  periodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    minWidth: '48%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  darkPeriodButton: {
    backgroundColor: '#2c2c2e',
    borderColor: '#38383a',
  },
  periodButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  periodButtonTextSelected: {
    color: '#fff',
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
    marginTop: 4,
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
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default BudgetForm;