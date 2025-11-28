// src/screens/AddMultipleCategoriesScreen.tsx - VERSION CORRIGÉE
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
import { useLanguage } from '../context/LanguageContext';
import { useDesignSystem } from '../context/ThemeContext';
import { useCategories } from '../hooks/useCategories';

interface CategoryTemplate {
  name: string;
  type: 'expense' | 'income'; // ✅ CORRIGÉ : seulement expense/income
  icon: string;
  color: string;
  parentId?: string;
  isSubCategory?: boolean;
}

interface CategoryHierarchy {
  id: string;
  name: string;
  type: 'expense' | 'income'; // ✅ CORRIGÉ : seulement expense/income
  icon: string;
  color: string;
  subCategories?: CategoryTemplate[];
}

const AddMultipleCategoriesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();
  const { colors } = useDesignSystem();
  const { createMultipleCategories, categories: existingCategories } = useCategories();

  const [customCategories, setCustomCategories] = useState<CategoryTemplate[]>([
    { name: '', type: 'expense', icon: 'receipt', color: '#007AFF', isSubCategory: false }
  ]);
  const [loading, setLoading] = useState(false);
  const [showSubCategoryInput, setShowSubCategoryInput] = useState<number | null>(null);

  // Options pour les icônes
  const iconOptions = [
    'cart', 'home', 'car', 'medical', 'restaurant', 'cafe', 'airplane', 
    'game-controller', 'book', 'school', 'shirt', 'gift', 'heart', 'star',
    'call', 'wifi', 'tv', 'musical-notes', 'basketball', 'fitness',
    'bed', 'cut', 'color-palette', 'construct', 'hammer', 'flash',
    'water', 'train', 'bus', 'bicycle', 'walk', 'pizza', 'beer', 
    'wine', 'ice-cream', 'fast-food', 'nutrition', 'card', 'cash',
    'wallet', 'bag', 'basket', 'bulb', 'camera' , 'key',
    'lock-closed', 'mail', 'map', 'megaphone', 'phone-portrait',
    'print', 'rocket', 'shield-checkmark', 'trophy', 'videocam'
  ];

  // Options pour les couleurs
  const colorOptions = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
    '#06B6D4', '#84CC16', '#EAB308', '#DC2626', '#EA580C', '#16A34A',
    '#2563EB', '#7C3AED', '#DB2777', '#0891B2', '#65A30D', '#CA8A04',
    '#991B1B', '#9A3412', '#3F6212', '#0F766E', '#1D4ED8', '#5B21B6',
    '#6B7280', '#374151', '#111827', '#7DD3FC', '#FDE68A', '#D8B4FE'
  ];

  // Catégories principales existantes pour les sous-catégories
  const mainCategories = existingCategories.filter(cat => !cat.parentId);

  // Ajouter un nouveau champ de catégorie
  const addCategoryField = (isSubCategory: boolean = false, parentIndex?: number) => {
    if (isSubCategory && parentIndex !== undefined) {
      // Ajouter une sous-catégorie à une catégorie parente
      const newCategories = [...customCategories];
      newCategories.splice(parentIndex + 1, 0, {
        name: '',
        type: newCategories[parentIndex].type,
        icon: 'ellipsis-horizontal',
        color: newCategories[parentIndex].color,
        isSubCategory: true,
        parentId: `parent_${parentIndex}`
      });
      setCustomCategories(newCategories);
    } else {
      // Ajouter une nouvelle catégorie principale
      setCustomCategories(prev => [
        ...prev,
        { name: '', type: 'expense', icon: 'receipt', color: '#007AFF', isSubCategory: false }
      ]);
    }
  };

  // Supprimer un champ de catégorie
  const removeCategoryField = (index: number) => {
    if (customCategories.length > 1) {
      // Si c'est une catégorie principale, supprimer aussi ses sous-catégories
      const categoryToRemove = customCategories[index];
      if (!categoryToRemove.isSubCategory) {
        const parentId = `parent_${index}`;
        const newCategories = customCategories.filter((cat, i) => 
          i !== index && cat.parentId !== parentId
        );
        setCustomCategories(newCategories);
      } else {
        setCustomCategories(prev => prev.filter((_, i) => i !== index));
      }
    }
  };

  // Mettre à jour un champ de catégorie
  const updateCategoryField = (index: number, field: keyof CategoryTemplate, value: string) => {
    setCustomCategories(prev => {
      const newCategories = [...prev];
      const updatedCategory = { ...newCategories[index], [field]: value };
      
      // Si on change le type d'une catégorie principale, mettre à jour ses sous-catégories
      if (field === 'type' && !updatedCategory.isSubCategory) {
        const parentId = `parent_${index}`;
        newCategories.forEach((cat, i) => {
          if (cat.parentId === parentId) {
            newCategories[i] = { ...cat, type: value as 'expense' | 'income' };
          }
        });
      }
      
      newCategories[index] = updatedCategory;
      return newCategories;
    });
  };

  // Basculer l'affichage des sous-catégories
  const toggleSubCategoryInput = (index: number) => {
    setShowSubCategoryInput(showSubCategoryInput === index ? null : index);
  };

  // Obtenir les sous-catégories d'une catégorie principale
  const getSubCategories = (parentIndex: number): CategoryTemplate[] => {
    const parentId = `parent_${parentIndex}`;
    return customCategories.filter((cat, index) => 
      cat.parentId === parentId && index > parentIndex
    );
  };

  // Valider et créer les catégories
  const handleCreateCategories = async () => {
    // Valider les catégories
    const validationErrors: string[] = [];
    
    customCategories.forEach((cat, index) => {
      if (!cat.name.trim()) {
        validationErrors.push(`La catégorie #${index + 1} n'a pas de nom`);
      }
      if (!cat.icon) {
        validationErrors.push(`La catégorie "${cat.name || `#${index + 1}`}" n'a pas d'icône`);
      }
      if (!cat.color) {
        validationErrors.push(`La catégorie "${cat.name || `#${index + 1}`}" n'a pas de couleur`);
      }
    });

    if (validationErrors.length > 0) {
      Alert.alert(
        'Erreurs de validation',
        validationErrors.join('\n'),
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      // ✅ CORRECTION : Préparer les données avec le bon type
      const categoriesToCreate = customCategories.map(cat => ({
        name: cat.name.trim(),
        type: cat.type as 'income' | 'expense', // ✅ Conversion explicite
        color: cat.color,
        icon: cat.icon,
        parentId: cat.isSubCategory ? cat.parentId : undefined
      }));

      const result = await createMultipleCategories(categoriesToCreate);
      
      if (result.success) {
        Alert.alert(
          'Succès',
          `${result.created} catégorie(s) créée(s) avec succès`,
          [{ text: 'OK', onPress: () => navigation.navigate('CategoriesList') }]
        );
      } else {
        Alert.alert(
          'Avertissement',
          `${result.created} catégorie(s) créée(s) avec ${result.errors.length} erreur(s)`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erreur création catégories:', error);
      Alert.alert(t.error, 'Impossible de créer les catégories');
    } finally {
      setLoading(false);
    }
  };

  // Effacer toutes les catégories
  const clearAll = () => {
    setCustomCategories([{ name: '', type: 'expense', icon: 'receipt', color: '#007AFF', isSubCategory: false }]);
    setShowSubCategoryInput(null);
  };

  // Compter les catégories remplies
  const filledCategoriesCount = customCategories.filter(cat => 
    cat.name.trim() && cat.icon && cat.color
  ).length;

  const totalCategoriesCount = customCategories.length;

  return (
    <SafeAreaView>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background.primary }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('CategoriesList')}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Ajout Multiple
          </Text>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearAll}
            disabled={loading}
          >
            <Text style={styles.clearButtonText}>Tout effacer</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={[styles.infoCard, { backgroundColor: colors.background.card }]}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text.primary }]}>
              Système de sous-catégories
            </Text>
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>
              • Créez des catégories principales et leurs sous-catégories{'\n'}
              • Les sous-catégories héritent du type de leur parent{'\n'}
              • Organisez vos dépenses et revenus de manière hiérarchique
            </Text>
          </View>
        </View>

        {/* Compteur et statistiques */}
        <View style={[styles.statsCard, { backgroundColor: colors.background.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>
              {filledCategoriesCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Prêtes à créer
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>
              {totalCategoriesCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Total champs
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>
              {customCategories.filter(cat => !cat.isSubCategory).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Principales
            </Text>
          </View>
        </View>

        {/* Liste des catégories */}
        <View style={styles.categoriesList}>
          {customCategories.map((category, index) => (
            <View key={index}>
              {/* Carte de catégorie */}
              <View 
                style={[
                  styles.categoryCard, 
                  { backgroundColor: colors.background.card, borderColor: colors.border.primary },
                  category.isSubCategory && styles.subCategoryCard
                ]}
              >
                {/* En-tête de la carte */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitle}>
                    <View style={styles.categoryTypeIndicator}>
                      <Ionicons 
                        name={category.type === 'income' ? 'arrow-down' : 'arrow-up'} 
                        size={14} 
                        color={category.type === 'income' ? '#10B981' : '#EF4444'} 
                      />
                      <Text style={[styles.categoryTypeText, { color: colors.text.secondary }]}>
                        {category.isSubCategory ? 'Sous-catégorie' : 'Catégorie principale'}
                      </Text>
                    </View>
                    {category.name && (
                      <Text style={[styles.cardPreview, { color: colors.text.primary }]}>
                        {category.name}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.cardActions}>
                    {!category.isSubCategory && (
                      <TouchableOpacity 
                        style={styles.subCategoryToggle}
                        onPress={() => toggleSubCategoryInput(index)}
                        disabled={loading}
                      >
                        <Ionicons 
                          name="layers" 
                          size={20} 
                          color={showSubCategoryInput === index ? '#007AFF' : colors.text.secondary} 
                        />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeCategoryField(index)}
                      disabled={loading}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Nom de la catégorie */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text.primary }]}>
                    Nom {category.isSubCategory ? 'de la sous-catégorie' : 'de la catégorie'} *
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
                    value={category.name}
                    onChangeText={(text) => updateCategoryField(index, 'name', text)}
                    placeholder={category.isSubCategory ? 
                      "Ex: Loyer, Électricité, Internet..." : 
                      "Ex: Logement, Transport, Alimentation..."}
                    placeholderTextColor={colors.text.disabled}
                  />
                </View>

                {/* Type (uniquement pour les catégories principales) */}
                {!category.isSubCategory && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text.primary }]}>
                      Type *
                    </Text>
                    <View style={styles.typeContainer}>
                      <TouchableOpacity
                        style={[
                          styles.typeButton,
                          category.type === 'expense' && styles.typeButtonSelected,
                          { backgroundColor: category.type === 'expense' ? '#EF4444' : colors.background.card, borderColor: colors.border.primary },
                        ]}
                        onPress={() => updateCategoryField(index, 'type', 'expense')}
                      >
                        <Ionicons 
                          name="arrow-up" 
                          size={16} 
                          color={category.type === 'expense' ? '#fff' : '#EF4444'} 
                        />
                        <Text style={[
                          styles.typeButtonText,
                          category.type === 'expense' && styles.typeButtonTextSelected,
                        ]}>
                          Dépense
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.typeButton,
                          category.type === 'income' && styles.typeButtonSelected,
                          { backgroundColor: category.type === 'income' ? '#10B981' : colors.background.card, borderColor: colors.border.primary },
                        ]}
                        onPress={() => updateCategoryField(index, 'type', 'income')}
                      >
                        <Ionicons 
                          name="arrow-down" 
                          size={16} 
                          color={category.type === 'income' ? '#fff' : '#10B981'} 
                        />
                        <Text style={[
                          styles.typeButtonText,
                          category.type === 'income' && styles.typeButtonTextSelected,
                        ]}>
                          Revenu
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Icône */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text.primary }]}>
                    Icône *
                  </Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.iconsContainer}
                  >
                    {iconOptions.map((icon) => (
                      <TouchableOpacity
                        key={icon}
                        style={[
                          styles.iconButton,
                          category.icon === icon && styles.iconButtonSelected,
                          { backgroundColor: category.icon === icon ? '#007AFF' : colors.background.secondary, borderColor: colors.border.primary },
                        ]}
                        onPress={() => updateCategoryField(index, 'icon', icon)}
                      >
                        <Ionicons 
                          name={icon as any} 
                          size={20} 
                          color={category.icon === icon ? '#fff' : colors.text.primary} 
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Couleur */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text.primary }]}>
                    Couleur *
                  </Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.colorsContainer}
                  >
                    {colorOptions.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorButton,
                          { backgroundColor: color },
                          category.color === color && styles.colorButtonSelected
                        ]}
                        onPress={() => updateCategoryField(index, 'color', color)}
                      >
                        {category.color === color && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Aperçu */}
                {category.name && (
                  <View style={[styles.previewContainer, { backgroundColor: colors.background.secondary }]}>
                    <Text style={[styles.previewLabel, { color: colors.text.secondary }]}>
                      Aperçu:
                    </Text>
                    <View style={styles.previewContent}>
                      <View style={[styles.previewIcon, { backgroundColor: category.color }]}>
                        <Ionicons name={category.icon as any} size={16} color="#fff" />
                      </View>
                      <Text style={[styles.previewText, { color: colors.text.primary }]}>
                        {category.name}
                      </Text>
                      <View style={[
                        styles.previewType,
                        { 
                          backgroundColor: category.type === 'income' ? '#10B98120' : '#EF444420'
                        }
                      ]}>
                        <Text style={[
                          styles.previewTypeText,
                          { 
                            color: category.type === 'income' ? '#10B981' : '#EF4444'
                          }
                        ]}>
                          {category.type === 'income' ? 'Revenu' : 'Dépense'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Bouton pour ajouter une sous-catégorie */}
              {!category.isSubCategory && showSubCategoryInput === index && (
                <View style={styles.subCategoryActions}>
                  <TouchableOpacity 
                    style={styles.addSubCategoryButton}
                    onPress={() => addCategoryField(true, index)}
                    disabled={loading}
                  >
                    <Ionicons name="add-circle" size={20} color="#007AFF" />
                    <Text style={styles.addSubCategoryText}>
                      Ajouter une sous-catégorie
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Affichage des sous-catégories existantes */}
                  {getSubCategories(index).length > 0 && (
                    <View style={styles.subCategoriesList}>
                      <Text style={[styles.subCategoriesTitle, { color: colors.text.secondary }]}>
                        Sous-catégories ({getSubCategories(index).length})
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.addMainCategoryButton, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
            onPress={() => addCategoryField(false)}
            disabled={loading}
          >
            <Ionicons name="add" size={20} color="#007AFF" />
            <Text style={styles.addMainCategoryText}>
              Nouvelle catégorie principale
            </Text>
          </TouchableOpacity>

          <View style={styles.mainActions}>
            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
              onPress={() => navigation.navigate('SettingsScreen')}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text.primary }]}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.createButton, 
                (loading || filledCategoriesCount === 0) && styles.createButtonDisabled
              ]}
              onPress={handleCreateCategories}
              disabled={loading || filledCategoriesCount === 0}
            >
              <Ionicons name="layers" size={20} color="#fff" />
              <Text style={styles.createButtonText}>
                {loading ? 'Création...' : `Créer ${filledCategoriesCount} catégorie(s)`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 16,
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
    textAlign: 'center',
    flex: 1,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  categoriesList: {
    marginBottom: 20,
  },
  categoryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  subCategoryCard: {
    marginLeft: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    backgroundColor: '#f8f9fa',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    flex: 1,
  },
  categoryTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  categoryTypeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  cardPreview: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subCategoryToggle: {
    padding: 4,
  },
  removeButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
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
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    gap: 6,
  },
  typeButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  iconsContainer: {
    gap: 8,
    paddingRight: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  iconButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  colorsContainer: {
    gap: 8,
    paddingRight: 16,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
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
  previewContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  previewType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subCategoryActions: {
    marginBottom: 12,
  },
  addSubCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF15',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  addSubCategoryText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  subCategoriesList: {
    paddingLeft: 20,
  },
  subCategoriesTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  actionsContainer: {
    gap: 12,
  },
  addMainCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addMainCategoryText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  mainActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  createButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  spacer: {
    height: 40,
  },
});

export default AddMultipleCategoriesScreen;