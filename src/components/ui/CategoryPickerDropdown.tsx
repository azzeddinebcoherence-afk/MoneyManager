// src/components/ui/CategoryPickerDropdown.tsx
// Composant réutilisable de sélection de catégorie avec recherche

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDesignSystem } from '../../context/ThemeContext';
import { Category } from '../../types';

interface CategoryPickerDropdownProps {
  categories: Category[];
  selectedCategoryId?: string;
  onSelect: (category: Category) => void;
  placeholder?: string;
  label?: string;
  type?: 'expense' | 'income' | 'all';
  showSubcategories?: boolean;
}

export const CategoryPickerDropdown: React.FC<CategoryPickerDropdownProps> = ({
  categories,
  selectedCategoryId,
  onSelect,
  placeholder = 'Sélectionner une catégorie',
  label = 'Catégorie',
  type = 'all',
  showSubcategories = true,
}) => {
  const { colors } = useDesignSystem();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer les catégories par type
  const filteredCategories = useMemo(() => {
    let filtered = categories;
    
    if (type !== 'all') {
      filtered = filtered.filter(cat => cat.type === type);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cat =>
        cat.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [categories, type, searchQuery]);

  // Organiser les catégories en arbre (principales + sous-catégories)
  const categoryTree = useMemo(() => {
    const mainCategories = filteredCategories.filter(cat => !cat.parentId);
    
    return mainCategories.map(main => ({
      ...main,
      subcategories: showSubcategories
        ? filteredCategories.filter(cat => cat.parentId === main.id)
        : [],
    }));
  }, [filteredCategories, showSubcategories]);

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  const handleSelect = (category: Category) => {
    onSelect(category);
    setModalVisible(false);
    setSearchQuery('');
  };

  const renderCategoryItem = ({ item }: { item: Category & { subcategories?: Category[] } }) => (
    <View>
      <TouchableOpacity
        style={[
          styles.categoryItem,
          { backgroundColor: colors.background.secondary },
          selectedCategoryId === item.id && {
            backgroundColor: colors.primary[100],
            borderColor: colors.primary[500],
            borderWidth: 2,
          },
        ]}
        onPress={() => handleSelect(item)}
      >
        <View style={styles.categoryItemLeft}>
          <View
            style={[
              styles.colorIndicator,
              { backgroundColor: item.color || colors.primary[500] },
            ]}
          />
          <Text
            style={[
              styles.categoryItemText,
              { color: colors.text.primary },
              selectedCategoryId === item.id && { fontWeight: '600' },
            ]}
          >
            {item.name}
          </Text>
        </View>
        {selectedCategoryId === item.id && (
          <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />
        )}
      </TouchableOpacity>

      {/* Sous-catégories */}
      {item.subcategories && item.subcategories.length > 0 && (
        <View style={styles.subcategoriesContainer}>
          {item.subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={[
                styles.subcategoryItem,
                { backgroundColor: colors.background.card },
                selectedCategoryId === sub.id && {
                  backgroundColor: colors.primary[50],
                  borderColor: colors.primary[500],
                  borderWidth: 1,
                },
              ]}
              onPress={() => handleSelect(sub)}
            >
              <View style={styles.categoryItemLeft}>
                <View style={styles.subcategoryIndicator} />
                <Text
                  style={[
                    styles.subcategoryItemText,
                    { color: colors.text.secondary },
                    selectedCategoryId === sub.id && { 
                      color: colors.text.primary,
                      fontWeight: '600'
                    },
                  ]}
                >
                  {sub.name}
                </Text>
              </View>
              {selectedCategoryId === sub.id && (
                <Ionicons name="checkmark-circle" size={18} color={colors.primary[500]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.pickerButton,
          { 
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.primary,
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.pickerButtonContent}>
          {selectedCategory && (
            <View
              style={[
                styles.selectedColorIndicator,
                { backgroundColor: selectedCategory.color || colors.primary[500] },
              ]}
            />
          )}
          <Text
            style={[
              styles.pickerButtonText,
              { color: selectedCategory ? colors.text.primary : colors.text.secondary },
            ]}
          >
            {selectedCategory?.name || placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setModalVisible(false);
          setSearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border.primary }]}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                {label}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSearchQuery('');
                }}
              >
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Barre de recherche */}
            <View style={[styles.searchContainer, { backgroundColor: colors.background.secondary }]}>
              <Ionicons name="search" size={20} color={colors.text.secondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text.primary }]}
                placeholder="Rechercher une catégorie..."
                placeholderTextColor={colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Liste des catégories */}
            <FlatList
              data={categoryTree}
              keyExtractor={item => item.id}
              renderItem={renderCategoryItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="search" size={48} color={colors.text.disabled} />
                  <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                    Aucune catégorie trouvée
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  pickerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  pickerButtonText: {
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  categoryItemText: {
    fontSize: 16,
    flex: 1,
  },
  subcategoriesContainer: {
    paddingLeft: 32,
    marginBottom: 8,
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  subcategoryIndicator: {
    width: 2,
    height: 12,
    backgroundColor: '#ccc',
    marginRight: 12,
  },
  subcategoryItemText: {
    fontSize: 14,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});
