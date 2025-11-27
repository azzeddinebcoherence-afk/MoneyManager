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
import { useLanguage } from '../context/LanguageContext';
import { useDesignSystem, useTheme } from '../context/ThemeContext';
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
  const { colors } = useDesignSystem();
  const { t } = useLanguage();
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
    getSubcategories,
    forceReinitializeAllCategories
  } = useCategories();
  
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);
  const [categoryTree, setCategoryTree] = useState<Array<{ category: Category; subcategories: Category[] }>>([]);
  const [searchQuery, setSearchQuery] = useState(''); // ✅ État pour la recherche
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
      console.log('🔄 [CategoriesScreen] Loading category tree...');
      const tree = await getCategoryTree();
      console.log('✅ [CategoriesScreen] Category tree loaded:', tree.length, 'categories');
      setCategoryTree(tree);
    } catch (error) {
      console.error('❌ [CategoriesScreen] Error loading category tree:', error);
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

  const handleForceReinitialize = async (): Promise<void> => {
    Alert.alert(
      "Réinitialiser les catégories",
      "Êtes-vous sûr de vouloir réinitialiser toutes les catégories avec le système complet ? Cette action supprimera toutes vos catégories personnalisées.",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Réinitialiser", 
          style: "destructive",
          onPress: async () => {
            try {
              setRefreshing(true);
              await forceReinitializeAllCategories();
              await loadCategoryTree();
              Alert.alert("Succès", "Les catégories ont été réinitialisées avec succès !");
            } catch (error) {
              Alert.alert("Erreur", "Impossible de réinitialiser les catégories.");
              console.error("Error reinitializing categories:", error);
            } finally {
              setRefreshing(false);
            }
          }
        }
      ]
    );
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
      Alert.alert(t.error, 'Veuillez saisir un nom pour la catégorie');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        Alert.alert(t.success, 'Catégorie modifiée avec succès');
      } else {
        await createCategory(formData);
        Alert.alert(t.success, 'Catégorie créée avec succès');
      }
      closeModal();
      await loadCategoryTree();
    } catch (error) {
      Alert.alert(t.error, error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  };

  const handleDelete = (category: Category): void => {
    Alert.alert(
      t.deleteCategory,
      `Êtes-vous sûr de vouloir supprimer "${category.name}" ?${category.level === 0 ? '\n\nLes sous-catégories associées seront également supprimées.' : ''}`,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete, 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
              Alert.alert(t.success, 'Catégorie supprimée avec succès');
              await loadCategoryTree();
            } catch (error) {
              Alert.alert(t.error, error instanceof Error ? error.message : 'Impossible de supprimer la catégorie');
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
        { backgroundColor: colors.background.card },
        item.level === 1 && styles.subCategoryItem
      ]}
      onPress={() => openEditModal(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.categoryInfo}>
        <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
        <Ionicons name={item.icon as any} size={20} color={colors.text.primary} />
        <View style={styles.categoryTextContainer}>
          <Text style={[styles.categoryName, { color: colors.text.primary }]}>
            {item.name}
          </Text>
          {item.level === 1 && (
            <Text style={[styles.subCategoryLabel, { color: colors.text.secondary }]}>
              Sous-catégorie
            </Text>
          )}
        </View>
      </View>
      <View style={[
        styles.typeBadge,
        { backgroundColor: item.type === 'income' ? colors.semantic.success : colors.semantic.error }
      ]}>
        <Text style={styles.typeBadgeText}>
          {item.type === 'income' ? t.income : t.expense}
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
            <Ionicons name={category.icon as any} size={20} color={colors.text.primary} />
            <View style={styles.categoryTextContainer}>
              <Text style={[styles.categoryName, { color: colors.text.primary }]}>
                {category.name}
              </Text>
              <Text style={[styles.mainCategoryLabel, { color: colors.text.secondary }]}>
                Catégorie principale
              </Text>
            </View>
          </View>
          <View style={[
            styles.typeBadge,
            { backgroundColor: category.type === 'income' ? colors.semantic.success : colors.semantic.error }
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
          <Ionicons name="add-circle" size={20} color={colors.primary[500]} />
          <Text style={[styles.addSubCategoryText, { color: colors.primary[500] }]}>Sous-catégorie</Text>
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
  
  // ✅ Filtrer categoryTree selon la recherche
  const filteredCategoryTree = React.useMemo(() => {
    if (!searchQuery.trim()) return categoryTree;
    
    const query = searchQuery.toLowerCase();
    return categoryTree
      .map(item => ({
        category: item.category,
        subcategories: item.subcategories.filter(sub =>
          sub.name.toLowerCase().includes(query)
        ),
      }))
      .filter(item =>
        item.category.name.toLowerCase().includes(query) ||
        item.subcategories.length > 0
      );
  }, [categoryTree, searchQuery]);
  
  const expenseCategoriesTree = filteredCategoryTree.filter(item => item.category.type === 'expense');
  const incomeCategoriesTree = filteredCategoryTree.filter(item => item.category.type === 'income');
  
  console.log('📊 [CategoriesScreen] Filtered categories:', {
    total: filteredCategoryTree.length,
    expenses: expenseCategoriesTree.length,
    income: incomeCategoriesTree.length
  });

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={[styles.loadingText, { color: colors.text.primary }]}>
          Chargement des catégories...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }, styles.center]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.semantic.error} />
        <Text style={[styles.errorText, { color: colors.text.primary }]}>
          {error}
        </Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary[500] }]} onPress={refreshCategories}>
          <Text style={[styles.retryButtonText, { color: colors.text.inverse }]}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView>
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Catégories
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Gérez vos catégories et sous-catégories
          </Text>
          
          {/* ✅ Barre de recherche */}
          <View style={[styles.searchContainer, { backgroundColor: colors.background.secondary }]}>
            <Ionicons name="search" size={20} color={colors.text.secondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text.primary }]}
              placeholder="Rechercher une catégorie..."
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
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
                  <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                    Dépenses ({expenseCategoriesTree.reduce((acc, item) => acc + 1 + item.subcategories.length, 0)})
                  </Text>
                </View>
                {expenseCategoriesTree.map((item) => renderCategoryWithSubcategories(item))}
                {expenseCategoriesTree.length === 0 && (
                  <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                    Aucune catégorie de dépense
                  </Text>
                )}
              </View>

              {/* Catégories de Revenus */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                    Revenus ({incomeCategoriesTree.reduce((acc, item) => acc + 1 + item.subcategories.length, 0)})
                  </Text>
                </View>
                {incomeCategoriesTree.map((item) => renderCategoryWithSubcategories(item))}
                {incomeCategoriesTree.length === 0 && (
                  <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                    Aucune catégorie de revenu
                  </Text>
                )}
              </View>

              {/* Bouton pour l'ajout multiple */}
              <TouchableOpacity 
                style={[styles.multipleButton, { backgroundColor: colors.background.card, borderColor: colors.primary[500] }]}
                onPress={() => navigation.navigate('AddMultipleCategories')}
              >
                <Ionicons name="layers" size={20} color={colors.primary[500]} />
                <Text style={[styles.multipleButtonText, { color: colors.primary[500] }]}>
                  Ajouter plusieurs catégories
                </Text>
              </TouchableOpacity>

              {/* Bouton de réinitialisation des catégories */}
              <TouchableOpacity 
                style={[styles.multipleButton, { backgroundColor: colors.semantic.error + '10', borderColor: colors.semantic.error, marginTop: 10 }]}
                onPress={handleForceReinitialize}
              >
                <Ionicons name="refresh" size={20} color={colors.semantic.error} />
                <Text style={[styles.multipleButtonText, { color: colors.semantic.error }]}>
                  Réinitialiser avec toutes les catégories
                </Text>
              </TouchableOpacity>
            </>
          }
          ListFooterComponent={<View style={styles.spacer} />}
        />

        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: colors.primary[500] }]}
          onPress={() => openAddModal()}
        >
          <Ionicons name="add" size={24} color={colors.text.inverse} />
        </TouchableOpacity>

        {/* Modal pour ajouter/modifier une catégorie */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={closeModal}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                {editingCategory 
                  ? t.editCategory
                  : selectedParent 
                    ? `Nouvelle sous-catégorie de ${selectedParent.name}`
                    : t.newMainCategory
                }
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Indication de la catégorie parente */}
              {selectedParent && (
                <View style={[styles.parentInfo, { backgroundColor: colors.background.card }]}>
                  <Ionicons name="information-circle" size={20} color={colors.primary[500]} />
                  <Text style={[styles.parentInfoText, { color: colors.text.primary }]}>
                    Sous-catégorie de: {selectedParent.name}
                  </Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Nom</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary, borderColor: colors.border.primary }]}
                  value={formData.name}
                  onChangeText={(text: string) => setFormData({ ...formData, name: text })}
                  placeholder={selectedParent ? "Nom de la sous-catégorie" : "Nom de la catégorie"}
                  placeholderTextColor={colors.text.disabled}
                />
              </View>

              {/* Type (uniquement pour les catégories principales) */}
              {!selectedParent && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text.primary }]}>Type</Text>
                  <View style={styles.typeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        { backgroundColor: colors.background.card, borderColor: colors.border.primary },
                        formData.type === 'expense' && { backgroundColor: colors.semantic.error, borderColor: colors.semantic.error },
                      ]}
                      onPress={() => setFormData({ ...formData, type: 'expense' })}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        { color: colors.text.primary },
                        formData.type === 'expense' && { color: colors.text.inverse },
                      ]}>
                        Dépense
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        { backgroundColor: colors.background.card, borderColor: colors.border.primary },
                        formData.type === 'income' && { backgroundColor: colors.semantic.success, borderColor: colors.semantic.success },
                      ]}
                      onPress={() => setFormData({ ...formData, type: 'income' })}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        { color: colors.text.primary },
                        formData.type === 'income' && { color: colors.text.inverse },
                      ]}>
                        Revenu
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Couleur</Text>
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
                          <Ionicons name="checkmark" size={16} color={colors.text.inverse} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Icône</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.iconsContainer}>
                    {categoryIcons.map((icon: string) => (
                      <TouchableOpacity
                        key={icon}
                        style={[
                          styles.iconButton,
                          { backgroundColor: colors.background.card, borderColor: colors.border.primary },
                          formData.icon === icon && { borderColor: colors.primary[500], backgroundColor: colors.primary[100] },
                        ]}
                        onPress={() => setFormData({ ...formData, icon })}
                      >
                        <Ionicons 
                          name={icon as any} 
                          size={20} 
                          color={formData.icon === icon ? colors.primary[500] : colors.text.primary} 
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Aperçu</Text>
                <View style={[styles.preview, { backgroundColor: colors.background.card }]}>
                  <View style={[styles.colorIndicator, { backgroundColor: formData.color }]} />
                  <Ionicons name={formData.icon as any} size={20} color={colors.text.primary} />
                  <View style={styles.previewTextContainer}>
                    <Text style={[styles.previewText, { color: colors.text.primary }]}>
                      {formData.name || (selectedParent ? 'Sous-catégorie' : 'Catégorie principale')}
                    </Text>
                    <Text style={[styles.previewType, { color: colors.text.secondary }]}>
                      {selectedParent ? 'Sous-catégorie' : 'Catégorie principale'} • {formData.type === 'income' ? 'Revenu' : 'Dépense'}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}
                onPress={closeModal}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text.primary }]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary[500] },
                  !formData.name && { opacity: 0.5 },
                ]}
                onPress={handleSubmit}
                disabled={!formData.name}
              >
                <Text style={[styles.submitButtonText, { color: colors.text.inverse }]}>
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
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
    borderLeftWidth: 3,
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
  },
  mainCategoryLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  subCategoryLabel: {
    fontSize: 12,
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
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    justifyContent: 'center',
    gap: 8,
  },
  addSubCategoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
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
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 100,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  parentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  parentInfoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  previewTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '500',
  },
  previewType: {
    fontSize: 12,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  multipleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    marginTop: 8,
    gap: 12,
    justifyContent: 'center',
    borderWidth: 2,
  },
  multipleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CategoriesScreen;