// src/screens/CategoryAnalysisScreen.tsx - VERSION MODERNISÉE
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';

const { width: screenWidth } = Dimensions.get('window');

type PeriodType = '1month' | '6months' | 'year';
type ExpenseType = 'all' | 'transactions' | 'debts' | 'charges';

const CategoryAnalysisScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { transactions, refreshTransactions } = useTransactions();
  const { categories } = useCategories();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('1month');
  const [selectedType, setSelectedType] = useState<ExpenseType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const isDark = theme === 'dark';

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTransactions();
    setRefreshing(false);
  };

  // Filtrer les transactions par période et type
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    console.log('📊 [CategoryAnalysis] Type sélectionné:', selectedType);
    console.log('📊 [CategoryAnalysis] Total transactions:', transactions.length);

    const filtered = transactions.filter(t => {
      // Filtrer seulement les dépenses
      if (t.type !== 'expense') return false;
      
      // Filtrer par type de dépense
      if (selectedType !== 'all') {
        const description = t.description?.toLowerCase() || '';
        const category = t.category?.toLowerCase() || '';
        
        // Debug: afficher quelques exemples
        if (category === 'dette' || category === 'charges_annuelles') {
          console.log('🔍 Transaction trouvée:', {
            category: t.category,
            description: t.description?.substring(0, 50),
            type: category === 'dette' ? 'DETTE' : 'CHARGE'
          });
        }
        
        switch (selectedType) {
          case 'transactions':
            // Exclure les dettes et charges annuelles (par catégorie OU description)
            if (category === 'dette' || 
                category === 'charges_annuelles' ||
                description.includes('paiement dette:') || 
                description.includes('remboursement dette') ||
                description.startsWith('paiement:')) return false;
            // Doit avoir une catégorie non vide
            if (!t.category || t.category.trim() === '') return false;
            break;
          case 'debts':
            // Uniquement les remboursements de dettes (par catégorie OU description)
            if (category !== 'dette' && 
                !description.includes('paiement dette:') && 
                !description.includes('remboursement dette')) return false;
            break;
          case 'charges':
            // Uniquement les charges annuelles (par catégorie OU description)
            if (category !== 'charges_annuelles' && 
                !description.startsWith('paiement:')) return false;
            break;
        }
      } else {
        // Pour "Tout", exclure les transactions sans catégorie
        if (!t.category || t.category.trim() === '') return false;
      }
      
      const tDate = new Date(t.date);
      const tMonth = tDate.getMonth();
      const tYear = tDate.getFullYear();

      switch (selectedPeriod) {
        case '1month':
          return tMonth === currentMonth && tYear === currentYear;
        case '6months':
          const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);
          return tDate >= sixMonthsAgo;
        case 'year':
          return tYear === currentYear;
        default:
          return true;
      }
    });

    console.log('📊 [CategoryAnalysis] Transactions filtrées:', filtered.length);
    return filtered;
  }, [transactions, selectedPeriod, selectedType]);

  // Calculer le total dépensé
  const totalExpenses = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [filteredTransactions]);

  // Grouper par catégorie parente
  const categoryAnalysis = useMemo(() => {
    const grouped: Record<string, any> = {};

    filteredTransactions.forEach(t => {
      // Trouver la catégorie (peut être sous-catégorie ou catégorie principale)
      const category = categories.find(c => c.id === t.category);
      if (!category) return;

      // Si c'est une sous-catégorie, trouver la catégorie parente
      let parentCategory = category;
      if (category.parentId) {
        const parent = categories.find(c => c.id === category.parentId);
        if (parent) {
          parentCategory = parent;
        }
      }

      const parentId = parentCategory.id;
      if (!grouped[parentId]) {
        grouped[parentId] = {
          id: parentId,
          name: parentCategory.name || 'Non catégorisé',
          icon: parentCategory.icon || 'help-circle-outline',
          color: parentCategory.color || '#999',
          budget: parentCategory.budget || 0,
          transactions: [],
          total: 0,
        };
      }
      grouped[parentId].transactions.push(t);
      grouped[parentId].total += Math.abs(t.amount);
    });

    // Calculer les statistiques pour chaque catégorie
    return Object.values(grouped)
      .map((cat: any) => {
        const amounts = cat.transactions.map((t: any) => Math.abs(t.amount));
        const maxTransaction = Math.max(...amounts, 0);
        const avgMonthly = cat.total / (selectedPeriod === '1month' ? 1 : selectedPeriod === '6months' ? 6 : 12);
        const percentUsed = cat.budget > 0 ? (cat.total / cat.budget) * 100 : 0;
        const remaining = cat.budget - cat.total;

        // Top 3 dépenses
        const top3 = cat.transactions
          .sort((a: any, b: any) => Math.abs(b.amount) - Math.abs(a.amount))
          .slice(0, 3);

        // Fréquence par jour
        const daysWithTransactions = new Set(cat.transactions.map((t: any) => new Date(t.date).toDateString())).size;
        const totalDays = selectedPeriod === '1month' ? 30 : selectedPeriod === '6months' ? 180 : 365;
        const frequencyPerDay = daysWithTransactions / totalDays;

        return {
          ...cat,
          maxTransaction,
          avgMonthly,
          percentUsed,
          remaining,
          top3,
          frequencyPerDay,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions, categories, selectedPeriod]);

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.darkHeader]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>Analyse par Catégorie</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Filtres période */}
        <View style={styles.periodFilters}>
          {[
            { key: '1month' as PeriodType, label: '1 mois' },
            { key: '6months' as PeriodType, label: '6 mois' },
            { key: 'year' as PeriodType, label: 'Année' },
          ].map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive,
                isDark && styles.darkPeriodButton,
                selectedPeriod === period.key && isDark && styles.darkPeriodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.key && styles.periodButtonTextActive,
                  isDark && styles.darkText,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filtres type de dépense */}
        <View style={styles.typeFilters}>
          {[
            { key: 'all' as ExpenseType, label: 'Tout', icon: 'apps-outline' },
            { key: 'transactions' as ExpenseType, label: 'Dépenses', icon: 'cart-outline' },
            { key: 'debts' as ExpenseType, label: 'Dettes', icon: 'card-outline' },
            { key: 'charges' as ExpenseType, label: 'Charges', icon: 'calendar-outline' },
          ].map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.typeButton,
                selectedType === type.key && styles.typeButtonActive,
                isDark && styles.darkPeriodButton,
                selectedType === type.key && isDark && styles.darkPeriodButtonActive,
              ]}
              onPress={() => setSelectedType(type.key)}
            >
              <Ionicons 
                name={type.icon as any} 
                size={16} 
                color={selectedType === type.key ? '#fff' : (isDark ? '#aaa' : '#666')}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === type.key && styles.typeButtonTextActive,
                  isDark && styles.darkText,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total dépensé */}
        <View style={[styles.totalCard, isDark && styles.darkCard]}>
          <Text style={[styles.totalLabel, isDark && styles.darkSubtext]}>Total dépensé</Text>
          <Text style={[styles.totalAmount, isDark && styles.darkText]}>
            {formatAmount(totalExpenses)}
          </Text>
          <Text style={[styles.totalPeriod, isDark && styles.darkSubtext]}>
            {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* Analyse détaillée */}
        <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Analyse détaillée</Text>

        {categoryAnalysis.map((cat) => (
          <View key={cat.id} style={[styles.categoryCard, isDark && styles.darkCard]}>
            {/* Header catégorie */}
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                <Ionicons name={cat.icon as any} size={24} color={cat.color} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, isDark && styles.darkText]}>{cat.name}</Text>
                <Text style={[styles.categoryMeta, isDark && styles.darkSubtext]}>
                  {cat.transactions.length} transactions • Budget {formatAmount(cat.budget)}
                </Text>
              </View>
              <View style={styles.categoryAmount}>
                <Text style={[styles.categoryTotal, isDark && styles.darkText]}>
                  {formatAmount(cat.total)}
                </Text>
                <Text style={[styles.categoryPercent, { color: cat.percentUsed > 100 ? '#EF4444' : '#10B981' }]}>
                  {cat.percentUsed.toFixed(0)}% utilisé
                </Text>
              </View>
            </View>

            {/* Barre de progression */}
            <View style={[styles.progressBar, isDark && styles.darkProgressBar]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(cat.percentUsed, 100)}%`,
                    backgroundColor: cat.percentUsed > 100 ? '#EF4444' : cat.percentUsed > 80 ? '#F59E0B' : cat.color,
                  },
                ]}
              />
            </View>

            {/* Détails */}
            <View style={styles.categoryDetails}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, isDark && styles.darkSubtext]}>Moyenne mensuelle</Text>
                <Text style={[styles.detailValue, isDark && styles.darkText]}>
                  {formatAmount(cat.avgMonthly)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, isDark && styles.darkSubtext]}>Transaction max</Text>
                <Text style={[styles.detailValue, isDark && styles.darkText]}>
                  {formatAmount(cat.maxTransaction)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, isDark && styles.darkSubtext]}>Reste</Text>
                <Text style={[styles.detailValue, { color: cat.remaining >= 0 ? '#10B981' : '#EF4444' }]}>
                  {formatAmount(cat.remaining)}
                </Text>
              </View>
            </View>

            {/* Top 3 dépenses */}
            {cat.top3.length > 0 && (
              <>
                <Text style={[styles.subSectionTitle, isDark && styles.darkText]}>Top 3 des dépenses :</Text>
                {cat.top3.map((t: any, index: number) => (
                  <View key={index} style={styles.topItem}>
                    <Text style={[styles.topRank, isDark && styles.darkSubtext]}>{index + 1}.</Text>
                    <Text style={[styles.topDescription, isDark && styles.darkText]} numberOfLines={1}>
                      {t.description || 'Transaction'}
                    </Text>
                    <Text style={[styles.topAmount, isDark && styles.darkText]}>
                      {formatAmount(Math.abs(t.amount))}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {/* Alerte si dépassement */}
            {cat.percentUsed > 100 && (
              <View style={styles.alertBox}>
                <Ionicons name="warning" size={16} color="#F59E0B" />
                <Text style={styles.alertText}>
                  Cette catégorie a augmenté de {(cat.percentUsed - 100).toFixed(0)}% par rapport au budget.
                  Réduisez vos sorties au restaurant pour économiser ~{formatAmount(cat.total - cat.budget)}/mois.
                </Text>
              </View>
            )}

            {/* Fréquence */}
            <Text style={[styles.frequencyText, isDark && styles.darkSubtext]}>
              Fréquence par jour : {(cat.frequencyPerDay * 100).toFixed(1)}%
            </Text>
          </View>
        ))}

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  darkContainer: {
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  darkHeader: {
    backgroundColor: '#1c1c1e',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  periodFilters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  darkPeriodButton: {
    backgroundColor: '#2c2c2e',
  },
  darkPeriodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  typeFilters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  darkCard: {
    backgroundColor: '#1c1c1e',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 4,
  },
  totalPeriod: {
    fontSize: 12,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  categoryMeta: {
    fontSize: 12,
    color: '#666',
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  categoryPercent: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  darkProgressBar: {
    backgroundColor: '#2c2c2e',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  topRank: {
    fontSize: 14,
    color: '#666',
    width: 24,
  },
  topDescription: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    marginHorizontal: 8,
  },
  topAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  alertBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  frequencyText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  spacer: {
    height: 24,
  },
});

export default CategoryAnalysisScreen;
