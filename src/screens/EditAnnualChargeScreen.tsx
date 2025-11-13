// src/screens/EditAnnualChargeScreen.tsx - NOUVEAU FICHIER
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
import { useTheme } from '../context/ThemeContext';
import { useAnnualCharges } from '../hooks/useAnnualCharges';

interface AnnualChargeForm {
  name: string;
  amount: string;
  dueDate: Date;
  category: string;
  reminderDays: string;
}

const EditAnnualChargeScreen = ({ navigation, route }: any) => {
  const { chargeId } = route.params;
  const { theme } = useTheme();
  const { getChargeById, updateAnnualCharge } = useAnnualCharges();
  
  const [form, setForm] = useState<AnnualChargeForm>({
    name: '',
    amount: '',
    dueDate: new Date(),
    category: '',
    reminderDays: '7',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const isDark = theme === 'dark';

  const categories = [
    'Assurance',
    'Impôts',
    'Abonnements',
    'Entretien',
    'Autres'
  ];

  useEffect(() => {
    loadChargeData();
  }, [chargeId]);

  const loadChargeData = async () => {
    try {
      setInitialLoading(true);
      const charge = await getChargeById(chargeId);
      
      if (charge) {
        setForm({
          name: charge.name,
          amount: charge.amount.toString(),
          dueDate: new Date(charge.dueDate),
          category: charge.category,
          reminderDays: '7', // Valeur par défaut pour l'instant
        });
      } else {
        Alert.alert('Erreur', 'Charge annuelle non trouvée');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading charge:', error);
      Alert.alert('Erreur', 'Impossible de charger la charge annuelle');
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
  if (!form.name || !form.amount || !form.category) {
    Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
    return;
  }

  const amount = parseFloat(form.amount);
  if (isNaN(amount) || amount <= 0) {
    Alert.alert('Erreur', 'Le montant doit être un nombre positif');
    return;
  }

  const reminderDays = parseInt(form.reminderDays) || 7;

  setLoading(true);
  try {
    // ✅ CORRECTION COMPLÈTE DE LA LIGNE 101
    await updateAnnualCharge(chargeId, {
      name: form.name.trim(),
      amount: amount,
      dueDate: form.dueDate, // ✅ LIGNE 101 CORRIGÉE
      category: form.category,
      reminderDays: reminderDays,
    });
    
    Alert.alert(
      'Succès',
      'Charge annuelle modifiée avec succès',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  } catch (error) {
    console.error('❌ [EditAnnualChargeScreen] Error updating charge:', error);
    Alert.alert('Erreur', 'Impossible de modifier la charge annuelle');
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
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const handleReminderDaysChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    setForm(prev => ({ ...prev, reminderDays: numericValue }));
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
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.darkText]}>
            Modifier la Charge
          </Text>
        </View>

        {/* Nom */}
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
          <View style={styles.amountContainer}>
            <Text style={[styles.currencySymbol, isDark && styles.darkText]}>€</Text>
            <TextInput
              style={[styles.input, styles.amountInput, isDark && styles.darkInput]}
              value={form.amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor={isDark ? "#888" : "#999"}
              keyboardType="decimal-pad"
            />
          </View>
          {form.amount && (
            <Text style={[styles.hint, isDark && styles.darkSubtext]}>
              {formatDisplayAmount(form.amount)}
            </Text>
          )}
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
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Catégorie */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark && styles.darkText]}>
            Catégorie *
          </Text>
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  form.category === category && styles.categoryButtonSelected,
                  isDark && styles.darkCategoryButton
                ]}
                onPress={() => setForm(prev => ({ ...prev, category }))}
              >
                <Text style={[
                  styles.categoryText,
                  form.category === category && styles.categoryTextSelected,
                  isDark && styles.darkText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading || !form.name || !form.amount || !form.category}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Modification...' : 'Modifier'}
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginRight: 12,
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  amountInput: {
    paddingLeft: 40,
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
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
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
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f9fa',
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

export default EditAnnualChargeScreen;