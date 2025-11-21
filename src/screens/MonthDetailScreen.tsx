// src/screens/MonthDetailScreen.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
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
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { getMonthlyData } = useMonthlyData();
  const { transactions, deleteTransaction, loading: transactionsLoading, refreshTransactions } = useTransactions();
  const { categories, getCategoryById } = useCategories();
  const [parentNames, setParentNames] = useState<Map<string, string>>(new Map());

  const { year, month } = route.params;
  const isDark = theme === 'dark';

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

  const handleTransactionPress = (transactionId: string) => {
    navigation.navigate('TransactionDetail', { transactionId });
  };

  const handleDeleteTransaction = (transactionId: string, description?: string) => {
    Alert.alert('Supprimer la transaction', `Voulez-vous supprimer \"${description || ''}\" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
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
    <View style={[styles.header, isDark && styles.darkHeader]}>
      <View style={styles.headerBackground}>
        <View style={[styles.headerGradient, isDark && styles.darkHeaderGradient]} />
      </View>
      
      <View style={styles.headerContent}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, isDark && styles.darkTitle]}>
              Détail du Mois
            </Text>
            <Text style={[styles.headerSubtitle, isDark && styles.darkSubtitle]}>
              {monthName}
            </Text>
          </View>

          <View style={styles.headerStats}>
            <View style={styles.miniStat}>
              <Ionicons name="receipt" size={14} color="#007AFF" />
              <Text style={[styles.miniStatText, isDark && styles.darkSubtext]}>
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
        <View style={[styles.statCard, isDark && styles.darkCard]}>
          <View style={[styles.statIcon, { backgroundColor: '#E8F5E8' }]}>
            <Ionicons name="arrow-down" size={20} color="#10B981" />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, isDark && styles.darkText]}>
              {formatAmount(monthData?.income || 0)}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
              Revenus
            </Text>
          </View>
        </View>

        {/* Dépenses */}
        <View style={[styles.statCard, isDark && styles.darkCard]}>
          <View style={[styles.statIcon, { backgroundColor: '#FFE5E5' }]}>
            <Ionicons name="arrow-up" size={20} color="#EF4444" />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, isDark && styles.darkText]}>
              {formatAmount(monthData?.expenses || 0)}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
              Dépenses
            </Text>
          </View>
        </View>
      </View>

      {/* Solde net */}
      <View style={[styles.netFlowCard, isDark && styles.darkCard]}>
        <View style={styles.netFlowHeader}>
          <Ionicons 
            name={monthData?.netFlow >= 0 ? "trending-up" : "trending-down"} 
            size={24} 
            color={monthData?.netFlow >= 0 ? '#10B981' : '#EF4444'} 
          />
          <Text style={[styles.netFlowLabel, isDark && styles.darkSubtext]}>
            Solde du Mois
          </Text>
        </View>
        <Text style={[
          styles.netFlowValue,
          { color: monthData?.netFlow >= 0 ? '#10B981' : '#EF4444' }
        ]}>
          {formatAmount(monthData?.netFlow || 0)}
        </Text>
        <Text style={[styles.savingsRate, isDark && styles.darkSubtext]}>
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
      <Text style={[styles.filtersLabel, isDark && styles.darkSubtext]}>
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
              selectedFilter === filter.key && styles.filterButtonActive,
              isDark && styles.darkFilterButton
            ]}
            onPress={() => handleFilterChange(filter.key as any)}
          >
            <Ionicons 
              name={filter.icon as any} 
              size={16} 
              color={selectedFilter === filter.key ? '#fff' : (isDark ? '#94A3B8' : '#64748B')} 
            />
            <Text style={[
              styles.filterText,
              selectedFilter === filter.key && styles.filterTextActive,
              isDark && styles.darkText
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
          isDark && styles.darkCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, isDark && styles.darkTitle]}>
            Analyse par Catégorie
          </Text>
          <Text style={[styles.sectionSubtitle, isDark && styles.darkSubtext]}>
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
                    <Text style={[styles.categoryName, isDark && styles.darkText]}>{parent.name}</Text>
                    <Text style={[styles.categoryPercentage, isDark && styles.darkSubtext]}>{((parent.amount / total) * 100).toFixed(1)}%</Text>
                    {parent.subItems && parent.subItems.length > 0 && (
                      <View style={styles.subcategoryList}>
                        {parent.subItems.slice(0, 3).map((sub: any) => (
                          <View key={sub.id} style={styles.subcategoryItem}>
                            <Text style={[styles.subcategoryName, isDark && styles.darkSubtext]}>• {sub.name}</Text>
                            <Text style={[styles.subcategoryAmount, isDark && styles.darkText]}>{formatAmount(sub.amount)}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
                <Text style={[styles.categoryAmount, isDark && styles.darkText]}>{formatAmount(parent.amount)}</Text>
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
            color={isDark ? '#4B5563' : '#9CA3AF'} 
          />
          <Text style={[styles.emptyTitle, isDark && styles.darkTitle]}>
            Aucune transaction
          </Text>
          <Text style={[styles.emptyDescription, isDark && styles.darkSubtext]}>
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
          <Text style={[styles.sectionTitle, isDark && styles.darkTitle]}>
            Transactions ({filteredTransactions.length})
          </Text>
          <Text style={[styles.sectionSubtitle, isDark && styles.darkSubtext]}>
            {selectedFilter === 'all' ? 'Toutes les transactions' : 
             selectedFilter === 'income' ? 'Revenus seulement' : 'Dépenses seulement'}
          </Text>
        </View>

        <FlatList
          data={filteredTransactions}
          renderItem={({ item }) => (
            <TransactionCard 
              transaction={item}
              onPress={handleTransactionPress}
              onDelete={handleDeleteTransaction}
              isDark={isDark}
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

  // Carte de transaction en grille (2 par ligne) - carte verticale épurée
  const TransactionCard = ({ transaction, onPress, onDelete, isDark }: any) => (
    <TouchableOpacity
      style={[styles.cardBorder, isDark && styles.darkCardBorder]}
      onPress={() => onPress(transaction.id)}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={transaction.type === 'income' ? ['#F0FBF6', '#FFFFFF'] : ['#FFF5F6', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardVertical}>
          <View style={[styles.cardIconLarge, { backgroundColor: transaction.type === 'income' ? '#ECFDF5' : '#FFF1F2' }]}>
            <Ionicons name={transaction.type === 'income' ? 'arrow-down' : 'arrow-up'} size={20} color={transaction.type === 'income' ? '#059669' : '#DC2626'} />
          </View>

          <Text style={[styles.cardTitle, isDark && styles.darkText]} numberOfLines={2}>{transaction.description || 'Sans description'}</Text>

          <Text style={[styles.cardAmountLarge, { color: transaction.type === 'income' ? '#059669' : '#DC2626' }]}>{transaction.type === 'income' ? '+' : '-'}{formatAmount(Math.abs(transaction.amount))}</Text>

          <Text style={[styles.cardDateSmall, isDark && styles.darkSubtext]}>{new Date(transaction.date).toLocaleDateString('fr-FR')}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

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
        <View style={[styles.container, isDark && styles.darkContainer, styles.center]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>
            Chargement des données...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <View style={[styles.container, isDark && styles.darkContainer]}>
        <ModernHeader />
        
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor={isDark ? '#007AFF' : '#007AFF'}
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
    backgroundColor: '#FFFFFF',
  },
  darkContainer: {
    backgroundColor: '#0B1220',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  darkHeader: {
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
    opacity: 1,
  },
  darkHeaderGradient: {
    backgroundColor: 'transparent',
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
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
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
    color: '#6B7280',
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
    marginBottom: 16,
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
  darkCard: {
    backgroundColor: '#1E293B',
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
    color: '#0F172A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
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
    color: '#64748B',
    fontWeight: '600',
  },
  netFlowValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  savingsRate: {
    fontSize: 12,
    color: '#64748B',
  },
  
  // Filtres
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filtersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filtersRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    gap: 6,
  },
  darkFilterButton: {
    backgroundColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
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
    color: '#1E293B',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
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
    color: '#1E293B',
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#64748B',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
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
    color: '#64748B',
  },
  subcategoryAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
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
  cardBorder: {
    borderWidth: 1,
    borderColor: '#E6EEF8',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 6,
    backgroundColor: 'transparent'
  },
  darkCardBorder: {
    borderColor: '#1F2937'
  },
  cardGradient: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center'
  },
  cardVertical: {
    alignItems: 'center',
  },
  cardIconLarge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardAmountLarge: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardDateSmall: {
    fontSize: 12,
    color: '#94A3B8',
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
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#666',
  },
  darkTitle: {
    color: '#F1F5F9',
  },
  darkSubtitle: {
    color: '#94A3B8',
  },
  darkText: {
    color: '#F1F5F9',
  },
  darkSubtext: {
    color: '#94A3B8',
  },
});

export default MonthDetailScreen;