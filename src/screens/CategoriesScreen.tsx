// src/screens/CategoriesScreen.tsx - VERSION AVEC SOUS-CATÉGORIES
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { useCategories } from '../hooks/useCategories';
import { Category } from '../types';

interface CategoryFormData {
  name: string;
  type: 'expense' | 'income';
  color: string;
  icon: string;
  parentId?: string;
  level?: number;
}

const CategoriesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { 
    categories, 
    loading, 
    error, 
    createCategory, 
    updateCategory, 
    deleteCategory, 
    refreshCategories,
    getCategoryTree,
    getMainCategories,
    getSubcategories
  } = useCategories();
  
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);
  const [categoryTree, setCategoryTree] = useState<Array<{ category: Category; subcategories: Category[] }>>([]);
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    type: 'expense',
    color: '#007AFF',
    icon: 'ellipsis-horizontal',
  });

  // Charger l'arbre des catégories
  React.useEffect(() => {
    loadCategoryTree();
  }, [categories]);

  const loadCategoryTree = async () => {
    try {
      const tree = await getCategoryTree();
      setCategoryTree(tree);
    } catch (error) {
      console.error('Error loading category tree:', error);
    }
  };

  const categoryColors: string[] = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#778899',
    '#50C878', '#FFD700', '#9370DB', '#20B2AA', '#007AFF', '#FF9500', '#5856D6'
  ];

  const categoryIcons: string[] = [
    'restaurant', 'car', 'home', 'game-controller', 'medical', 'cart', 'ellipsis-horizontal',
    'cash', 'gift', 'trending-up', 'add-circle', 'airplane', 'book', 'cafe'
  ];

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await refreshCategories();
    setRefreshing(false);
  };

  const openAddModal = (parentCategory?: Category): void => {
    setEditingCategory(null);
    setSelectedParent(parentCategory || null);
    setFormData({
      name: '',
      type: parentCategory ? parentCategory.type : 'expense',
      color: parentCategory ? parentCategory.color : '#007AFF',
      icon: 'ellipsis-horizontal',
      parentId: parentCategory ? parentCategory.id : undefined,
      level: parentCategory ? 1 : 0,
    });
    setModalVisible(true);
  };

  const openEditModal = (category: Category): void => {
    setEditingCategory(category);
    setSelectedParent(null);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
      parentId: category.parentId,
      level: category.level,
    });
    setModalVisible(true);
  };

  const closeModal = (): void => {
    setModalVisible(false);
    setEditingCategory(null);
    setSelectedParent(null);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom pour la catégorie');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        Alert.alert('Succès', 'Catégorie modifiée avec succès');
      } else {
        await createCategory(formData);
        Alert.alert('Succès', 'Catégorie créée avec succès');
      }
      closeModal();
      await loadCategoryTree();
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  };

  const handleDelete = (category: Category): void => {
    Alert.alert(
      'Supprimer la catégorie',
      `Êtes-vous sûr de vouloir supprimer "${category.name}" ?${category.level === 0 ? '\n\nLes sous-catégories associées seront également supprimées.' : ''}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
              Alert.alert('Succès', 'Catégorie supprimée avec succès');
              await loadCategoryTree();
            } catch (error) {
              Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de supprimer la catégorie');
            }
          }
        },
      ]
    );
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity 
      style={[
        styles.categoryItem, 
        isDark && styles.darkCard,
        item.level === 1 && styles.subCategoryItem
      ]}
      onPress={() => openEditModal(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.categoryInfo}>
        <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
        <Ionicons name={item.icon as any} size={20} color={isDark ? '#fff' : '#000'} />
        <View style={styles.categoryTextContainer}>
          <Text style={[styles.categoryName, isDark && styles.darkText]}>
            {item.name}
          </Text>
          {item.level === 1 && (
            <Text style={[styles.subCategoryLabel, isDark && styles.darkSubtext]}>
              Sous-catégorie
            </Text>
          )}
        </View>
      </View>
      <View style={[
        styles.typeBadge,
        { backgroundColor: item.type === 'income' ? '#34C759' : '#FF3B30' }
      ]}>
        <Text style={styles.typeBadgeText}>
          {item.type === 'income' ? 'Revenu' : 'Dépense'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryWithSubcategories = ({ category, subcategories }: { category: Category; subcategories: Category[] }) => (
    <View key={category.id} style={styles.categoryGroup}>
      {/* Catégorie principale */}
      <View style={styles.mainCategoryHeader}>
        <TouchableOpacity 
          style={styles.mainCategoryItem}
          onPress={() => openEditModal(category)}
          onLongPress={() => handleDelete(category)}
        >
          <View style={styles.categoryInfo}>
            <View style={[styles.colorIndicator, { backgroundColor: category.color }]} />
            <Ionicons name={category.icon as any} size={20} color={isDark ? '#fff' : '#000'} />
            <View style={styles.categoryTextContainer}>
              <Text style={[styles.categoryName, isDark && styles.darkText]}>
                {category.name}
              </Text>
              <Text style={[styles.mainCategoryLabel, isDark && styles.darkSubtext]}>
                Catégorie principale
              </Text>
            </View>
          </View>
          <View style={[
            styles.typeBadge,
            { backgroundColor: category.type === 'income' ? '#34C759' : '#FF3B30' }
          ]}>
            <Text style={styles.typeBadgeText}>
              {category.type === 'income' ? 'Revenu' : 'Dépense'}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Bouton pour ajouter une sous-catégorie */}
        <TouchableOpacity 
          style={styles.addSubCategoryButton}
          onPress={() => openAddModal(category)}
        >
          <Ionicons name="add-circle" size={20} color="#007AFF" />
          <Text style={styles.addSubCategoryText}>Sous-catégorie</Text>
        </TouchableOpacity>
      </View>

      {/* Sous-catégories */}
      {subcategories.length > 0 && (
        <View style={styles.subCategoriesContainer}>
          {subcategories.map((subcategory) => (
            <View key={subcategory.id}>
              {renderCategoryItem({ item: subcategory })}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // Filtrage pour les catégories sans parent (niveau 0)
  const mainCategories = categories.filter((cat: Category) => cat.level === 0);
  const expenseCategoriesTree = categoryTree.filter(item => item.category.type === 'expense');
  const incomeCategoriesTree = categoryTree.filter(item => item.category.type === 'income');

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, isDark && styles.darkContainer, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.loadingText, isDark && styles.darkText]}>
          Chargement des catégories...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, isDark && styles.darkContainer, styles.center]}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={[styles.errorText, isDark && styles.darkText]}>
          {error}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshCategories}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView>
      <View style={[styles.container, isDark && styles.darkContainer]}>
        <View style={[styles.header, isDark && styles.darkHeader]}>
          <Text style={[styles.title, isDark && styles.darkText]}>
            Catégories
          </Text>
          <Text style={[styles.subtitle, isDark && styles.darkSubtext]}>
            Gérez vos catégories et sous-catégories
          </Text>
        </View>

        <FlatList
          data={[]}
          renderItem={null as any}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Catégories de Dépenses */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                    Dépenses ({expenseCategoriesTree.reduce((acc, item) => acc + 1 + item.subcategories.length, 0)})
                  </Text>
                </View>
                {expenseCategoriesTree.map((item) => renderCategoryWithSubcategories(item))}
                {expenseCategoriesTree.length === 0 && (
                  <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
                    Aucune catégorie de dépense
                  </Text>
                )}
              </View>

              {/* Catégories de Revenus */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                    Revenus ({incomeCategoriesTree.reduce((acc, item) => acc + 1 + item.subcategories.length, 0)})
                  </Text>
                </View>
                {incomeCategoriesTree.map((item) => renderCategoryWithSubcategories(item))}
                {incomeCategoriesTree.length === 0 && (
                  <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
                    Aucune catégorie de revenu
                  </Text>
                )}
              </View>

              {/* Bouton pour l'ajout multiple */}
              <TouchableOpacity 
                style={[styles.multipleButton, isDark && styles.darkMultipleButton]}
                onPress={() => navigation.navigate('AddMultipleCategories')}
              >
                <Ionicons name="layers" size={20} color="#007AFF" />
                <Text style={styles.multipleButtonText}>
                  Ajouter plusieurs catégories
                </Text>
              </TouchableOpacity>
            </>
          }
          ListFooterComponent={<View style={styles.spacer} />}
        />

        <TouchableOpacity 
          style={styles.fab}
          onPress={() => openAddModal()}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Modal pour ajouter/modifier une catégorie */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={closeModal}
        >
          <View style={[styles.modalContainer, isDark && styles.darkContainer]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.darkText]}>
                {editingCategory 
                  ? 'Modifier la catégorie' 
                  : selectedParent 
                    ? `Nouvelle sous-catégorie de ${selectedParent.name}`
                    : 'Nouvelle catégorie principale'
                }
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Indication de la catégorie parente */}
              {selectedParent && (
                <View style={[styles.parentInfo, isDark && styles.darkCard]}>
                  <Ionicons name="information-circle" size={20} color="#007AFF" />
                  <Text style={[styles.parentInfoText, isDark && styles.darkText]}>
                    Sous-catégorie de: {selectedParent.name}
                  </Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark && styles.darkText]}>Nom</Text>
                <TextInput
                  style={[styles.input, isDark && styles.darkInput]}
                  value={formData.name}
                  onChangeText={(text: string) => setFormData({ ...formData, name: text })}
                  placeholder={selectedParent ? "Nom de la sous-catégorie" : "Nom de la catégorie"}
                  placeholderTextColor={isDark ? '#666' : '#999'}
                />
              </View>

              {/* Type (uniquement pour les catégories principales) */}
              {!selectedParent && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, isDark && styles.darkText]}>Type</Text>
                  <View style={styles.typeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        formData.type === 'expense' && styles.typeButtonSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, type: 'expense' })}
                    >
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
                      ]}
                      onPress={() => setFormData({ ...formData, type: 'income' })}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        formData.type === 'income' && styles.typeButtonTextSelected,
                      ]}>
                        Revenu
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark && styles.darkText]}>Couleur</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.colorsContainer}>
                    {categoryColors.map((color: string) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorButton,
                          { backgroundColor: color },
                          formData.color === color && styles.colorButtonSelected,
                        ]}
                        onPress={() => setFormData({ ...formData, color })}
                      >
                        {formData.color === color && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark && styles.darkText]}>Icône</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.iconsContainer}>
                    {categoryIcons.map((icon: string) => (
                      <TouchableOpacity
                        key={icon}
                        style={[
                          styles.iconButton,
                          isDark && styles.darkIconButton,
                          formData.icon === icon && styles.iconButtonSelected,
                        ]}
                        onPress={() => setFormData({ ...formData, icon })}
                      >
                        <Ionicons 
                          name={icon as any} 
                          size={20} 
                          color={formData.icon === icon ? '#007AFF' : (isDark ? '#fff' : '#000')} 
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, isDark && styles.darkText]}>Aperçu</Text>
                <View style={[styles.preview, isDark && styles.darkCard]}>
                  <View style={[styles.colorIndicator, { backgroundColor: formData.color }]} />
                  <Ionicons name={formData.icon as any} size={20} color={isDark ? '#fff' : '#000'} />
                  <View style={styles.previewTextContainer}>
                    <Text style={[styles.previewText, isDark && styles.darkText]}>
                      {formData.name || (selectedParent ? 'Sous-catégorie' : 'Catégorie principale')}
                    </Text>
                    <Text style={[styles.previewType, isDark && styles.darkSubtext]}>
                      {selectedParent ? 'Sous-catégorie' : 'Catégorie principale'} • {formData.type === 'income' ? 'Revenu' : 'Dépense'}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, isDark && styles.darkCancelButton]}
                onPress={closeModal}
              >
                <Text style={[styles.cancelButtonText, isDark && styles.darkText]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, !formData.name && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!formData.name}
              >
                <Text style={styles.submitButtonText}>
                  {editingCategory ? 'Modifier' : 'Créer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  darkHeader: {
    backgroundColor: '#2c2c2e',
    borderBottomColor: '#38383a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 16,
    paddingBottom: 0,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  categoryGroup: {
    marginBottom: 16,
  },
  mainCategoryHeader: {
    marginBottom: 8,
  },
  mainCategoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  subCategoryItem: {
    marginLeft: 20,
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  darkCard: {
    backgroundColor: '#2c2c2e',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  mainCategoryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  subCategoryLabel: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  subCategoriesContainer: {
    marginTop: 8,
  },
  addSubCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF15',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    justifyContent: 'center',
    gap: 8,
  },
  addSubCategoryText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 100,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  parentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  parentInfoText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  colorsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  iconsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkIconButton: {
    backgroundColor: '#2c2c2e',
  },
  iconButtonSelected: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  previewType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  darkCancelButton: {
    backgroundColor: '#2c2c2e',
    borderColor: '#38383a',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  multipleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF15',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    marginTop: 8,
    gap: 12,
    justifyContent: 'center',
  },
  darkMultipleButton: {
    backgroundColor: '#007AFF20',
  },
  multipleButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default CategoriesScreen;