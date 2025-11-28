// src/screens/MonthDetailScreen.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import ListTransactionItem from '../components/transaction/ListTransactionItem';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { useDesignSystem, useTheme } from '../context/ThemeContext';
import useCategories from '../hooks/useCategories';
import { useMonthlyData } from '../hooks/useMonthlyData';
import { useTransactions } from '../hooks/useTransactions';

const { width } = Dimensions.get('window');

// Types pour la navigation
type RootStackParamList = {
  MonthDetail: { year: number; month: number };
  MonthsOverview: undefined;
  TransactionDetail: { transactionId: string };
};

// Use `any` for navigation types to avoid mismatches with installed navigation type definitions
type MonthDetailScreenNavigationProp = any;
type MonthDetailScreenRouteProp = any;

const MonthDetailScreen: React.FC = () => {
  const navigation = useNavigation() as MonthDetailScreenNavigationProp;
  const route = useRoute() as MonthDetailScreenRouteProp;
  const { t } = useLanguage();
  const { colors } = useDesignSystem();
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { getMonthlyData } = useMonthlyData();
  const { transactions, deleteTransaction, loading: transactionsLoading, refreshTransactions } = useTransactions();
  const { categories, getCategoryById } = useCategories();
  const [parentNames, setParentNames] = useState<Map<string, string>>(new Map());

  const { year, month } = route.params;

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [monthData, setMonthData] = useState<any>(null);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);

  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  // ✅ CORRECTION : Charger les données du mois
  const loadMonthData = useCallback(async () => {
    try {
      console.log(`🔍 Chargement données ${month}/${year}...`);
      
      // Obtenir les données du mois
      const data = getMonthlyData(year, month);
      setMonthData(data);
      // DEBUG: afficher breakdown et catégories chargées
      try {
        console.log('*** DEBUG monthData.categoryBreakdown:', JSON.stringify(data?.categoryBreakdown || [], null, 2));
        console.log('*** DEBUG loaded categories:', JSON.stringify(categories || [], null, 2));
      } catch (e) {
        console.log('*** DEBUG cannot stringify category data', e);
      }
      // Récupérer les parents manquants (si certaines catégories sont présentes sans leurs parents)
      try {
        const breakdown = data?.categoryBreakdown || [];
        const missingParents = new Set<string>();
        breakdown.forEach((entry: any) => {
          const cat = resolveCategoryObject(entry.category);
            if (cat && cat.level === 1 && cat.parentId && !categoriesById.has(cat.parentId)) {
            missingParents.add(cat.parentId);
          }
        });

        if (missingParents.size > 0 && getCategoryById) {
          const tempMap = new Map<string, string>();
          await Promise.all(Array.from(missingParents).map(async (pid) => {
            try {
              const parent = await getCategoryById(pid);
              if (parent) tempMap.set(pid, parent.name);
            } catch (err) {
              // ignore
            }
          }));

          // Merge fetched parent names with existing ones in a single setState call
          setParentNames(prev => {
            const merged = new Map(prev);
            tempMap.forEach((v, k) => merged.set(k, v));
            return merged;
          });
        }
      } catch (e) {
        // ignore async parent fetch errors
      }
    } catch (err) {
      console.log('Error loading month data', err);
    }
  }, [getMonthlyData, month, year, getCategoryById]);

  const handleBack = () => {
    navigation.goBack();
  };

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadMonthData();
    } catch (err) {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  const handleFilterChange = (filter: 'all' | 'income' | 'expense') => {
    setSelectedFilter(filter);
  };

  // ✅ CATÉGORIES SPÉCIALES (lecture seule)
  const SPECIAL_CATEGORIES = ['dette', 'épargne', 'charges_annuelles', 'transfert', 'remboursement épargne'];

  // ✅ VÉRIFIER SI UNE TRANSACTION EST SPÉCIALE
  const isSpecialTransaction = (transaction: any): boolean => {
    return SPECIAL_CATEGORIES.includes(transaction.category.toLowerCase());
  };

  // ✅ OBTENIR LE LIBELLÉ DES CATÉGORIES SPÉCIALES
  const getSpecialCategoryLabel = (category: string): string => {
    const labels: { [key: string]: string } = {
      'dette': 'Paiement de Dette',
      'épargne': 'Épargne',
      'charges_annuelles': 'Charge Annuelle',
      'transfert': 'Transfert',
      'remboursement épargne': 'Remboursement Épargne'
    };
    return labels[category.toLowerCase()] || category;
  };

  const handleTransactionPress = async (transactionId: string) => {
    try {
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) return;

      // Si c'est une transaction spéciale, afficher uniquement les détails
      if (isSpecialTransaction(transaction)) {
        Alert.alert(
          `Transaction ${getSpecialCategoryLabel(transaction.category)}`,
          `Cette transaction est automatiquement générée par le système.\n\n` +
          `• Montant: ${formatAmount(transaction.amount)}\n` +
          `• Catégorie: ${getSpecialCategoryLabel(transaction.category)}\n` +
          `• Date: ${new Date(transaction.date).toLocaleDateString('fr-FR')}\n` +
          `• Description: ${transaction.description || 'Aucune description'}`,
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Pour les transactions normales, naviguer vers les détails
      navigation.navigate('TransactionDetail', { transactionId });
    } catch (error) {
      console.error('❌ Erreur navigation:', error);
    }
  };

  const handleDeleteTransaction = (transactionId: string, description?: string) => {
    Alert.alert('Supprimer la transaction', `Voulez-vous supprimer \"${description || ''}\" ?`, [
      { text: t.cancel, style: 'cancel' },
      { text: t.delete, style: 'destructive', onPress: async () => {
        try {
          await deleteTransaction(transactionId);
          await loadMonthData();
        } catch (err) {
          console.log('Error deleting transaction', err);
        }
      } }
    ]);
  };

  // Format du nom du mois
  const monthName = useMemo(() => {
    return new Date(year, month).toLocaleDateString('fr-FR', { 
      month: 'long',
      year: 'numeric'
    });
  }, [year, month]);

  // Header moderne
  const ModernHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.background.card, borderBottomColor: colors.border.primary }]}>
      <View style={styles.headerBackground}>
        <View style={[styles.headerGradient, { backgroundColor: colors.primary[500] + '20' }]} />
      </View>
      
      <View style={styles.headerContent}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Détail du Mois
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
              {monthName}
            </Text>
          </View>

          <View style={styles.headerStats}>
            <View style={styles.miniStat}>
              <Ionicons name="receipt" size={14} color="#007AFF" />
              <Text style={[styles.miniStatText, { color: colors.text.secondary }]}>
                {monthData?.transactionCount || 0} transactions
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  // Cartes de statistiques principales
  const StatsCards = () => (
    <Animated.View 
      style={[
        styles.statsContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.statsRow}>
        {/* Revenus */}
        <View style={[styles.statCard, { backgroundColor: colors.background.card }]}>
          <View style={[styles.statIcon, { backgroundColor: '#E8F5E8' }]}>
            <Ionicons name="arrow-down" size={20} color="#10B981" />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {formatAmount(monthData?.income || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Revenus
            </Text>
          </View>
        </View>

        {/* Dépenses */}
        <View style={[styles.statCard, { backgroundColor: colors.background.card }]}>
          <View style={[styles.statIcon, { backgroundColor: '#FFE5E5' }]}>
            <Ionicons name="arrow-up" size={20} color="#EF4444" />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {formatAmount(monthData?.expenses || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Dépenses
            </Text>
          </View>
        </View>
      </View>

      {/* Solde net */}
      <View style={[styles.netFlowCard, { backgroundColor: colors.background.card }]}>
        <View style={styles.netFlowHeader}>
          <Ionicons 
            name={monthData?.netFlow >= 0 ? "trending-up" : "trending-down"} 
            size={24} 
            color={monthData?.netFlow >= 0 ? '#10B981' : '#EF4444'} 
          />
          <Text style={[styles.netFlowLabel, { color: colors.text.secondary }]}>
            Solde du Mois
          </Text>
        </View>
        <Text style={[
          styles.netFlowValue,
          { color: monthData?.netFlow >= 0 ? '#10B981' : '#EF4444' }
        ]}>
          {formatAmount(monthData?.netFlow || 0)}
        </Text>
        <Text style={[styles.savingsRate, { color: colors.text.secondary }]}>
          Taux d'épargne: {monthData?.savingsRate?.toFixed(1) || 0}%
        </Text>
      </View>
    </Animated.View>
  );

  // Filtres de transactions
  const TransactionFilters = () => (
    <Animated.View 
      style={[
        styles.filtersContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={[styles.filtersLabel, { color: colors.text.secondary }]}>
        Filtrer les transactions
      </Text>
      <View style={styles.filtersRow}>
        {[
          { key: 'all', label: 'Toutes', icon: 'list' },
          { key: 'income', label: 'Revenus', icon: 'arrow-down' },
          { key: 'expense', label: 'Dépenses', icon: 'arrow-up' },
        ].map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              { backgroundColor: colors.background.card },
              selectedFilter === filter.key && styles.filterButtonActive
            ]}
            onPress={() => handleFilterChange(filter.key as any)}
          >
            <Ionicons 
              name={filter.icon as any} 
              size={16} 
              color={selectedFilter === filter.key ? '#fff' : colors.text.secondary} 
            />
            <Text style={[
              styles.filterText,
              { color: colors.text.primary },
              selectedFilter === filter.key && styles.filterTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  // Analyse par catégorie
  const CategoryAnalysis = () => {
    if (!monthData?.categoryBreakdown?.length) return null;

    return (
      <Animated.View 
        style={[
          styles.categorySection,
          { backgroundColor: colors.background.card },
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Analyse par Catégorie
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
            Dépenses détaillées
          </Text>
        </View>

        <View style={styles.categoriesList}>
          {/* Regrouper le breakdown par catégorie parente (quand possible) */}
          {(() => {
            const map = new Map<string, any>();
            const breakdown = monthData.categoryBreakdown || [];

            breakdown.forEach((entry: any) => {
              const raw = entry.category;
              const cat = resolveCategoryObject(raw);

              // si c'est une sous-catégorie, utiliser son parent comme clé
              if (cat && cat.level === 1 && cat.parentId) {
                const parentId = cat.parentId;
                const parentFromList = categoriesById.get(parentId);
                const parentName = parentFromList?.name || parentNames.get(parentId) || parentId;
                const key = parentId;
                const existing = map.get(key) || { id: key, name: parentName, amount: 0, subItems: [] };
                existing.amount += entry.amount;
                // ajouter ou accumuler le sous-élément
                const foundSub = existing.subItems.find((s: any) => s.id === cat.id);
                if (foundSub) {
                  foundSub.amount += entry.amount;
                } else {
                  existing.subItems.push({ id: cat.id, name: cat.name, amount: entry.amount });
                }
                map.set(key, existing);
              } else if (cat && cat.level === 0) {
                const key = cat.id;
                const existing = map.get(key) || { id: key, name: cat.name, amount: 0, subItems: [] };
                existing.amount += entry.amount;
                map.set(key, existing);
              } else {
                // inconnue : regrouper par libellé tel quel
                const key = raw;
                const existing = map.get(key) || { id: key, name: raw, amount: 0, subItems: [] };
                existing.amount += entry.amount;
                map.set(key, existing);
              }
            });

            const parents = Array.from(map.values()).sort((a: any, b: any) => b.amount - a.amount);
            const total = parents.reduce((s: number, p: any) => s + p.amount, 0) || 1;

            return parents.slice(0, 5).map((parent: any, index: number) => (
              <View key={parent.id} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryColor, { backgroundColor: getCategoryColor(index) }]} />
                  <View style={styles.categoryDetails}>
                    <Text style={[styles.categoryName, { color: colors.text.primary }]}>{parent.name}</Text>
                    <Text style={[styles.categoryPercentage, { color: colors.text.secondary }]}>{((parent.amount / total) * 100).toFixed(1)}%</Text>
                    {parent.subItems && parent.subItems.length > 0 && (
                      <View style={styles.subcategoryList}>
                        {parent.subItems.slice(0, 3).map((sub: any) => (
                          <View key={sub.id} style={styles.subcategoryItem}>
                            <Text style={[styles.subcategoryName, { color: colors.text.secondary }]}>• {sub.name}</Text>
                            <Text style={[styles.subcategoryAmount, { color: colors.text.primary }]}>{formatAmount(sub.amount)}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
                <Text style={[styles.categoryAmount, { color: colors.text.primary }]}>{formatAmount(parent.amount)}</Text>
              </View>
            ));
          })()}
        </View>
      </Animated.View>
    );
  };

  // Liste des transactions
  const TransactionsList = () => {
    if (filteredTransactions.length === 0) {
      return (
        <Animated.View 
          style={[
            styles.emptyState,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Ionicons 
            name="receipt-outline" 
            size={64} 
            color={colors.text.disabled} 
          />
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            Aucune transaction
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.text.secondary }]}>
            {selectedFilter === 'all' 
              ? `Aucune transaction pour ${monthName}`
              : `Aucune transaction ${selectedFilter === 'income' ? 'de revenu' : 'de dépense'} pour ${monthName}`
            }
          </Text>
        </Animated.View>
      );
    }

    return (
      <Animated.View 
        style={[
          styles.transactionsSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Transactions ({filteredTransactions.length})
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
            {selectedFilter === 'all' ? 'Toutes les transactions' : 
             selectedFilter === 'income' ? 'Revenus seulement' : 'Dépenses seulement'}
          </Text>
        </View>

        <FlatList
          data={filteredTransactions}
          renderItem={({ item }) => (
            <ListTransactionItem 
              item={item}
              onPress={handleTransactionPress}
            />
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.transactionsList}
        />
      </Animated.View>
    );
  };

  // Couleurs pour les catégories
  const getCategoryColor = (index: number) => {
    const colors = ['#007AFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    return colors[index % colors.length];
  };

  const categoriesById = React.useMemo(() => {
    const m = new Map<string, any>();
    (categories || []).forEach((c: any) => m.set(c.id, c));
    return m;
  }, [categories]);

  const categoriesByName = React.useMemo(() => {
    const m = new Map<string, any>();
    (categories || []).forEach((c: any) => m.set(c.name, c));
    return m;
  }, [categories]);

  const resolveCategoryObject = (categoryKey: string) => {
    if (!categoryKey) return null;
    if (categoriesById.has(categoryKey)) return categoriesById.get(categoryKey);
    if (categoriesByName.has(categoryKey)) return categoriesByName.get(categoryKey);
    return null;
  };

  // Charger les données au montage et quand les dépendances changent
  useEffect(() => {
    loadMonthData();
  }, [loadMonthData]);

  // Garder une référence stable vers refreshTransactions pour éviter de recréer
  // le callback de focus quand son identité change (prévenant une boucle)
  const refreshTransactionsRef = useRef<typeof refreshTransactions | null>(null);
  useEffect(() => { refreshTransactionsRef.current = refreshTransactions; }, [refreshTransactions]);

  // Rafraîchir les transactions et les données lorsque l'écran redevient actif
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const refFn = refreshTransactionsRef.current;
          if (refFn) await refFn();
          if (mounted) await loadMonthData();
        } catch (err) {
          console.log('Error refreshing on focus', err);
        }
      })();

      return () => { mounted = false; };
    }, [loadMonthData])
  );

  // Filtrer les transactions affichées selon le mois et le filtre sélectionné
  useEffect(() => {
    try {
      const tx = (transactions || []);
      console.log('DEBUG MonthDetailScreen: total transactions from hook =', tx.length);
      if (tx.length > 0) {
        console.log('DEBUG sample dates:', tx.slice(0,5).map((t: any) => t.date));
      }
      const list = tx.filter((t: any) => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month && (selectedFilter === 'all' || t.type === selectedFilter);
      });
      console.log('DEBUG MonthDetailScreen: filteredTransactions length =', list.length, 'for month=', month, 'year=', year, 'filter=', selectedFilter);
      setFilteredTransactions(list);
    } catch (err) {
      console.log('DEBUG MonthDetailScreen: error filtering transactions', err);
      setFilteredTransactions([]);
    }
  }, [transactions, selectedFilter, year, month]);

  // Lancer les animations d'apparition pour rendre le contenu visible
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  if (transactionsLoading && !monthData) {
    return (
      <SafeAreaView>
        <View style={[styles.container, { backgroundColor: colors.background.primary }, styles.center]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, { color: colors.text.primary }]}>
            Chargement des données...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <ModernHeader />
        
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor={'#007AFF'}
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          <StatsCards />
          <TransactionFilters />
          <TransactionsList />
          
          <View style={styles.spacer} />
        </ScrollView>
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
  
  // Header
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerGradient: {
    flex: 1,
    opacity: 1,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  headerStats: {
    alignItems: 'flex-end',
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 6,
  },
  miniStatText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Contenu principal
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Cartes de statistiques
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  netFlowCard: {
    backgroundColor: 'transparent',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  netFlowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  netFlowLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  netFlowValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  savingsRate: {
    fontSize: 12,
  },
  
  // Filtres
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filtersLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filtersRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 6,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 999,
    gap: 6,
    marginHorizontal: 2,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  
  // Analyse par catégorie
  categorySection: {
    backgroundColor: 'transparent',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  categoriesList: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 12,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  subcategoryList: {
    marginTop: 6,
  },
  subcategoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  subcategoryName: {
    fontSize: 12,
  },
  subcategoryAmount: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Transaction meta / category badge
  transactionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  transactionDate: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#64748B',
  },
  
  // Transactions
  transactionsSection: {
    paddingHorizontal: 24,
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  transactionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
    maxWidth: width * 0.5,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#94A3B8',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  metaSmallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  categoryBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  transactionDateSmall: {
    fontSize: 12,
    color: '#94A3B8',
  },
  amountWrap: {
    marginLeft: 12,
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  transactionAmountPrimary: {
    fontSize: 15,
    fontWeight: '700',
  },
  // Grid / compact card styles
  cardColumnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  cardGridItem: {
    flex: 1,
    paddingHorizontal: 6,
    width: (width - 60) / 2,
  },
  transactionCardCompact: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionActions: {
    display: 'none'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  editButton: {
    backgroundColor: '#EFF6FF',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // État vide
  emptyState: {
    alignItems: 'center',
    padding: 36,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Divers
  spacer: {
    height: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default MonthDetailScreen;