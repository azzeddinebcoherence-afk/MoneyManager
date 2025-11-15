// src/screens/CategoryAnalysisScreen.tsx - VERSION CORRIGÉE
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';

const CategoryAnalysisScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { categories } = useCategories();
  
  const [filters, setFilters] = useState({
    type: 'expense' as 'expense' | 'income',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    category: '' as string | null
  });
  
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  // Options pour les filtres
  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
  const months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  // Fonction pour obtenir le nom de la catégorie à partir de son ID
  const getCategoryNameById = useCallback((categoryId: string) => {
    if (!categoryId) return 'Non catégorisé';
    
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Catégorie inconnue';
  }, [categories]);

  // Fonction pour obtenir la couleur de la catégorie à partir de son ID
  const getCategoryColorById = useCallback((categoryId: string) => {
    if (!categoryId) return '#666666';
    
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || '#666666';
  }, [categories]);

  // Calculer les données avec les filtres
  const calculateCategoryData = useCallback(() => {
    setLoading(true);
    
    try {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0);

      // Filtrer les transactions selon les critères
      const filteredTransactions = transactions.filter(transaction => {
        if (!transaction.date) return false;
        
        // Filtre date
        const transactionDate = new Date(transaction.date);
        if (transactionDate < startDate || transactionDate > endDate) return false;
        
        // Filtre type
        if (transaction.type !== filters.type) return false;
        
        return true;
      });

      // Calculer les totaux par catégorie
      const categoryTotals: { [key: string]: { 
        amount: number; 
        count: number; 
        color: string;
        name: string;
        id: string;
      } } = {};

      filteredTransactions.forEach(transaction => {
        const amount = Math.abs(transaction.amount || 0);
        const categoryId = transaction.category || 'uncategorized';
        
        if (!categoryTotals[categoryId]) {
          const categoryName = getCategoryNameById(categoryId);
          const categoryColor = getCategoryColorById(categoryId);
          
          categoryTotals[categoryId] = {
            amount: 0,
            count: 0,
            color: categoryColor,
            name: categoryName,
            id: categoryId
          };
        }
        
        categoryTotals[categoryId].amount += amount;
        categoryTotals[categoryId].count += 1;
      });

      // Convertir en tableau et trier par montant décroissant
      const chartData = Object.entries(categoryTotals)
        .map(([categoryId, data]) => ({
          id: categoryId,
          name: data.name,
          amount: data.amount,
          count: data.count,
          color: data.color
        }))
        .sort((a, b) => b.amount - a.amount);

      setCategoryData(chartData);

      console.log('📊 Category analysis:', {
        year: filters.year,
        month: filters.month,
        type: filters.type,
        totalTransactions: filteredTransactions.length,
        totalAmount: chartData.reduce((sum, cat) => sum + cat.amount, 0),
        categories: chartData.length,
        categoryMapping: chartData.map(cat => ({ id: cat.id, name: cat.name }))
      });
    } catch (error) {
      console.error('❌ Error calculating category data:', error);
    } finally {
      setLoading(false);
    }
  }, [transactions, categories, filters, getCategoryNameById, getCategoryColorById]);

  useEffect(() => {
    calculateCategoryData();
  }, [calculateCategoryData]);

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    try {
      // Navigation vers les transactions filtrées par catégorie
      (navigation as any).navigate('Transactions', {
        filters: {
          category: categoryId, // Utiliser l'ID pour le filtrage
          categoryName: categoryName, // Passer le nom pour l'affichage
          type: filters.type,
          year: filters.year,
          month: filters.month
        }
      });
    } catch (error) {
      console.warn('Navigation vers Transactions non disponible');
      (navigation as any).navigate('Transactions');
    }
  };

  const getMonthName = (monthNumber: number) => {
    return months.find(m => m.value === monthNumber)?.label || '';
  };

  if (loading || transactionsLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.loadingText, isDark && styles.darkText]}>
          Analyse des catégories...
        </Text>
      </SafeAreaView>
    );
  }

  const totalAmount = categoryData.reduce((sum, cat) => sum + cat.amount, 0);

  return (
    <SafeAreaView>
      <View style={[styles.container, isDark && styles.darkContainer]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.darkText]}>
            Analyse par Catégorie
          </Text>
          <View style={styles.headerRight} />
        </View>

        {/* Filtres Simplifiés */}
        <View style={styles.filtersContainer}>
          {/* Type (Dépenses/Revenus) */}
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, isDark && styles.darkSubtext]}>
              Type
            </Text>
            <View style={styles.typeButtons}>
              {(['expense', 'income'] as const).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    filters.type === type && styles.typeButtonActive,
                    isDark && styles.darkTypeButton,
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, type }))}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      filters.type === type && styles.typeButtonTextActive,
                      isDark && styles.darkText,
                    ]}
                  >
                    {type === 'expense' ? 'Dépenses' : 'Revenus'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Année et Mois */}
          <View style={styles.dateFilters}>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, isDark && styles.darkSubtext]}>
                Année
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.yearButtons}>
                  {years.map(year => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.yearButton,
                        filters.year === year && styles.yearButtonActive,
                        isDark && styles.darkYearButton,
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, year }))}
                    >
                      <Text
                        style={[
                          styles.yearButtonText,
                          filters.year === year && styles.yearButtonTextActive,
                          isDark && styles.darkText,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, isDark && styles.darkSubtext]}>
                Mois
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.monthButtons}>
                  {months.map(month => (
                    <TouchableOpacity
                      key={month.value}
                      style={[
                        styles.monthButton,
                        filters.month === month.value && styles.monthButtonActive,
                        isDark && styles.darkMonthButton,
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, month: month.value }))}
                    >
                      <Text
                        style={[
                          styles.monthButtonText,
                          filters.month === month.value && styles.monthButtonTextActive,
                          isDark && styles.darkText,
                        ]}
                      >
                        {month.label.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Résumé */}
        <View style={styles.summary}>
          <Text style={[styles.summaryTitle, isDark && styles.darkText]}>
            {filters.type === 'expense' ? 'Dépenses' : 'Revenus'} {getMonthName(filters.month)} {filters.year}
          </Text>
          <Text style={[styles.summaryAmount, isDark && styles.darkText]}>
            {formatAmount(totalAmount)}
          </Text>
          <Text style={[styles.summarySubtitle, isDark && styles.darkSubtext]}>
            {categoryData.length} catégories • {categoryData.reduce((sum, cat) => sum + cat.count, 0)} transactions
          </Text>
        </View>

        {/* Liste des Catégories */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.categoriesList}>
            {categoryData.map((category, index) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryItem, isDark && styles.darkCard]}
                onPress={() => handleCategoryPress(category.id, category.name)}
              >
                <View style={styles.categoryLeft}>
                  <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryName, isDark && styles.darkText]}>
                      {category.name}
                    </Text>
                    <Text style={[styles.categoryCount, isDark && styles.darkSubtext]}>
                      {category.count} transaction{category.count > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.categoryRight}>
                  <Text style={[styles.categoryAmount, isDark && styles.darkText]}>
                    {formatAmount(category.amount)}
                  </Text>
                  <Text style={[styles.categoryPercentage, isDark && styles.darkSubtext]}>
                    {totalAmount > 0 ? ((category.amount / totalAmount) * 100).toFixed(1) : 0}%
                  </Text>
                </View>

                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={isDark ? "#888" : "#666"} 
                  style={styles.chevron}
                />
              </TouchableOpacity>
            ))}
          </View>

          {categoryData.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="folder-outline" size={64} color={isDark ? '#555' : '#ccc'} />
              <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
                Aucune {filters.type === 'expense' ? 'dépense' : 'recette'} pour {getMonthName(filters.month)} {filters.year}
              </Text>
              <Text style={[styles.emptySubtext, isDark && styles.darkSubtext]}>
                Modifiez les filtres ou ajoutez des transactions
              </Text>
            </View>
          )}

          <View style={styles.spacer} />
        </ScrollView>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  filtersContainer: {
    padding: 20,
    paddingTop: 0,
    gap: 20,
  },
  filterGroup: {
    gap: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeButtons: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  darkTypeButton: {
    backgroundColor: '#2c2c2e',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  dateFilters: {
    gap: 16,
  },
  yearButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 70,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkYearButton: {
    backgroundColor: '#2c2c2e',
    borderColor: '#38383a',
  },
  yearButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  yearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  yearButtonTextActive: {
    color: '#fff',
  },
  monthButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 60,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkMonthButton: {
    backgroundColor: '#2c2c2e',
    borderColor: '#38383a',
  },
  monthButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  monthButtonTextActive: {
    color: '#fff',
  },
  summary: {
    padding: 20,
    paddingTop: 0,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  categoriesList: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 13,
    color: '#666',
  },
  categoryRight: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  chevron: {
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  spacer: {
    height: 20,
  },
  darkCard: {
    backgroundColor: '#2c2c2e',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default CategoryAnalysisScreen;