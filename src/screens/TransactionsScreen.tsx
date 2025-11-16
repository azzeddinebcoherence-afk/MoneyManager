// src/screens/TransactionsScreen.tsx - VERSION SIMPLIFIÉE AVEC FILTRES ANNÉE/MOIS
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { Transaction } from '../types';

const TransactionsScreen = ({ navigation }: any) => {
  const { formatAmount } = useCurrency();
  const { theme } = useTheme();
  const { 
    transactions, 
    loading, 
    error,
    refreshTransactions,
    getTransactionById
  } = useTransactions();
  
  const { accounts, totalBalance } = useAccounts();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // Novembre = 11

  const isDark = theme === 'dark';

  // ✅ CATÉGORIES SPÉCIALES EN LECTURE SEULE
  const SPECIAL_CATEGORIES = ['dette', 'épargne', 'charges_annuelles', 'transfert', 'remboursement épargne'];

  // ✅ GÉNÉRER LES ANNÉES (2024-2028)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1, currentYear + 2, currentYear + 3];
  };

  // ✅ GÉNÉRER LES MOIS AVEC NOMS FRANÇAIS
  const generateMonths = () => {
    return [
      { number: 1, name: 'Janvier', short: 'Jan' },
      { number: 2, name: 'Février', short: 'Fév' },
      { number: 3, name: 'Mars', short: 'Mar' },
      { number: 4, name: 'Avril', short: 'Avr' },
      { number: 5, name: 'Mai', short: 'Mai' },
      { number: 6, name: 'Juin', short: 'Juin' },
      { number: 7, name: 'Juillet', short: 'Juil' },
      { number: 8, name: 'Août', short: 'Août' },
      { number: 9, name: 'Septembre', short: 'Sep' },
      { number: 10, name: 'Octobre', short: 'Oct' },
      { number: 11, name: 'Novembre', short: 'Nov' },
      { number: 12, name: 'Décembre', short: 'Déc' }
    ];
  };

  // ✅ FILTRER LES TRANSACTIONS PAR ANNÉE ET MOIS
  const getFilteredTransactions = (): Transaction[] => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const transactionYear = transactionDate.getFullYear();
      const transactionMonth = transactionDate.getMonth() + 1;
      
      return transactionYear === selectedYear && transactionMonth === selectedMonth;
    });
  };

  // ✅ VÉRIFIER SI UNE TRANSACTION EST SPÉCIALE
  const isSpecialTransaction = (transaction: Transaction): boolean => {
    return SPECIAL_CATEGORIES.includes(transaction.category.toLowerCase());
  };

  // ✅ NAVIGATION CONDITIONNELLE
  const handleTransactionPress = async (transactionId: string) => {
    try {
      const transaction = await getTransactionById(transactionId);
      if (!transaction) return;

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
      
      navigation.navigate('EditTransaction', { 
        transactionId,
        transactionData: transaction 
      });
      
    } catch (error) {
      console.error('❌ Erreur navigation:', error);
    }
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

  // ✅ OBTENIR L'ICÔNE DES CATÉGORIES SPÉCIALES
  const getSpecialCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'dette': 'card',
      'épargne': 'trending-up',
      'charges_annuelles': 'calendar',
      'transfert': 'swap-horizontal',
      'remboursement épargne': 'cash'
    };
    return icons[category.toLowerCase()] || 'document';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTransactions();
    setRefreshing(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshTransactions();
    });
    return unsubscribe;
  }, [navigation, refreshTransactions]);

  // ✅ CALCULS STATISTIQUES
  const getStats = () => {
    const filteredTransactions = getFilteredTransactions();
    
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const total = filteredTransactions.length;
    
    return {
      total,
      income,
      expenses,
      balance: income - expenses,
      totalBalance
    };
  };

  const stats = getStats();
  const filteredTransactions = getFilteredTransactions();
  const years = generateYears();
  const months = generateMonths();
  const currentMonth = new Date().getMonth() + 1;

  // ✅ COMPOSANT : En-tête moderne avec filtres
  const ModernHeader = () => (
    <View style={[styles.header, isDark && styles.darkHeader]}>
      <View style={styles.headerTop}>
        <Text style={[styles.title, isDark && styles.darkText]}>
          Transactions
        </Text>
        <TouchableOpacity 
          style={[styles.addButton, isDark && styles.darkAddButton]}
          onPress={() => navigation.navigate('AddTransaction')}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      {/* ✅ FILTRE ANNÉE - Scroll horizontal */}
      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, isDark && styles.darkSubtext]}>Année</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yearScrollContent}
        >
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearButton,
                selectedYear === year && styles.yearButtonActive,
                isDark && styles.darkYearButton
              ]}
              onPress={() => setSelectedYear(year)}
            >
              <Text style={[
                styles.yearButtonText,
                selectedYear === year && styles.yearButtonTextActive,
                isDark && styles.darkText
              ]}>
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ✅ FILTRE MOIS - Scroll horizontal avec mois courant en premier */}
      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, isDark && styles.darkSubtext]}>Mois</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthScrollContent}
        >
          {/* Afficher les mois à partir du mois courant */}
          {months.slice(currentMonth - 1).concat(months.slice(0, currentMonth - 1)).map((month) => (
            <TouchableOpacity
              key={month.number}
              style={[
                styles.monthButton,
                selectedMonth === month.number && styles.monthButtonActive,
                isDark && styles.darkMonthButton
              ]}
              onPress={() => setSelectedMonth(month.number)}
            >
              <Text style={[
                styles.monthButtonText,
                selectedMonth === month.number && styles.monthButtonTextActive,
                isDark && styles.darkText
              ]}>
                {month.short}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  // ✅ COMPOSANT : Résumé financier
  const FinancialSummary = () => {
    const currentMonthName = months.find(m => m.number === selectedMonth)?.name || '';

    return (
      <View style={[styles.summaryCard, isDark && styles.darkCard]}>
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, isDark && styles.darkText]}>
            {currentMonthName} {selectedYear}
          </Text>
          <Text style={[styles.transactionCount, isDark && styles.darkSubtext]}>
            {stats.total} transaction{stats.total !== 1 ? 's' : ''}
          </Text>
        </View>
        
        <View style={styles.mainBalanceContainer}>
          <Text style={[styles.balanceLabel, isDark && styles.darkSubtext]}>
            Solde du mois
          </Text>
          <Text style={[
            styles.mainBalance,
            { color: stats.balance >= 0 ? '#10B981' : '#EF4444' }
          ]}>
            {formatAmount(stats.balance)}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="arrow-down" size={16} color="#10B981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                Revenus
              </Text>
              <Text style={[styles.statValue, { color: '#10B981' }]}>
                {formatAmount(stats.income)}
              </Text>
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#EF444420' }]}>
              <Ionicons name="arrow-up" size={16} color="#EF4444" />
            </View>
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                Dépenses
              </Text>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>
                {formatAmount(stats.expenses)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ✅ COMPOSANT : Carte de transaction
  const TransactionCard = ({ item }: { item: Transaction }) => {
    const isSpecial = isSpecialTransaction(item);
    const isRecurring = item.isRecurring && !isSpecial;

    return (
      <TouchableOpacity 
        style={[
          styles.transactionCard, 
          isDark && styles.darkCard,
          isSpecial && styles.specialTransactionCard,
          isRecurring && styles.recurringTransactionCard
        ]}
        onPress={() => handleTransactionPress(item.id)}
        activeOpacity={isSpecial ? 1 : 0.7}
      >
        <View style={styles.transactionMain}>
          <View style={styles.transactionLeft}>
            <View style={[
              styles.iconContainer,
              { 
                backgroundColor: isSpecial ? '#007AFF20' : 
                                 (item.type === 'income' ? '#10B98120' : '#EF444420'),
                borderColor: isSpecial ? '#007AFF40' : 
                                (item.type === 'income' ? '#10B98140' : '#EF444440')
              },
              isRecurring && styles.recurringIconContainer
            ]}>
              <Ionicons 
                name={isSpecial ? (getSpecialCategoryIcon(item.category) as any) : 
                      isRecurring ? 'repeat' :
                      (item.type === 'income' ? 'arrow-down' : 'arrow-up')} 
                size={20} 
                color={isSpecial ? '#007AFF' : 
                       isRecurring ? '#F59E0B' :
                       (item.type === 'income' ? '#10B981' : '#EF4444')} 
              />
            </View>
            
            <View style={styles.transactionInfo}>
              <Text style={[styles.transactionDescription, isDark && styles.darkText]}>
                {item.description || 'Sans description'}
              </Text>
              
              <View style={styles.transactionMeta}>
                <View style={styles.categoryContainer}>
                  <Ionicons 
                    name="pricetag" 
                    size={12} 
                    color={isDark ? '#888' : '#666'} 
                  />
                  <Text style={[
                    styles.transactionCategory, 
                    isDark && styles.darkSubtext,
                    isSpecial && styles.specialCategoryText,
                    isRecurring && styles.recurringCategoryText
                  ]}>
                    {isSpecial ? getSpecialCategoryLabel(item.category) : item.category}
                  </Text>
                </View>
                
                <Text style={[styles.transactionDate, isDark && styles.darkSubtext]}>
                  {new Date(item.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>

                {isSpecial && (
                  <View style={styles.systemBadge}>
                    <Ionicons name="lock-closed" size={10} color="#007AFF" />
                    <Text style={styles.systemBadgeText}>Système</Text>
                  </View>
                )}

                {isRecurring && (
                  <View style={styles.recurringBadge}>
                    <Ionicons name="repeat" size={10} color="#F59E0B" />
                    <Text style={styles.recurringBadgeText}>Récurrente</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.transactionRight}>
            <Text style={[
              styles.transactionAmount,
              { 
                color: isSpecial ? '#007AFF' : 
                       isRecurring ? '#F59E0B' :
                       (item.type === 'income' ? '#10B981' : '#EF4444') 
              }
            ]}>
              {item.type === 'income' ? '+' : ''}{formatAmount(item.amount)}
            </Text>
            
            <Text style={[
              styles.transactionType,
              isDark && styles.darkSubtext
            ]}>
              {isSpecial ? 'Système' : 
               isRecurring ? 'Récurrent' :
               (item.type === 'income' ? 'Revenu' : 'Dépense')}
            </Text>
          </View>
        </View>

        {isSpecial && (
          <View style={styles.readOnlyIndicator}>
            <Ionicons name="eye" size={12} color="#007AFF" />
            <Text style={styles.readOnlyText}>Lecture seule</Text>
          </View>
        )}

        {isRecurring && (
          <View style={styles.recurringIndicator}>
            <Ionicons name="refresh" size={12} color="#F59E0B" />
            <Text style={styles.recurringIndicatorText}>Se répète automatiquement</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ✅ COMPOSANT : État vide
  const EmptyState = () => {
    const currentMonthName = months.find(m => m.number === selectedMonth)?.name || '';
    
    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, isDark && styles.darkEmptyIcon]}>
          <Ionicons 
            name="receipt-outline" 
            size={64} 
            color={isDark ? '#555' : '#ccc'} 
          />
        </View>
        <Text style={[styles.emptyTitle, isDark && styles.darkText]}>
          Aucune transaction
        </Text>
        <Text style={[styles.emptySubtitle, isDark && styles.darkSubtext]}>
          {`Aucune transaction trouvée pour ${currentMonthName} ${selectedYear}`}
        </Text>
        <TouchableOpacity 
          style={styles.addEmptyButton}
          onPress={() => navigation.navigate('AddTransaction')}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addEmptyButtonText}>
            Nouvelle transaction
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ✅ COMPOSANT : Chargement
  const LoadingIndicator = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={[styles.loadingText, isDark && styles.darkText]}>
        Chargement des transactions...
      </Text>
    </View>
  );

  if (loading && !refreshing && transactions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <ModernHeader />
        <LoadingIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <ModernHeader />
      
      <FlatList
        data={filteredTransactions}
        renderItem={({ item }) => <TransactionCard item={item} />}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={isDark ? "#fff" : "#000"}
            colors={['#007AFF']}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          filteredTransactions.length > 0 ? <FinancialSummary /> : null
        }
        ListEmptyComponent={<EmptyState />}
        ListFooterComponent={<View style={styles.spacer} />}
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction')}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
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
  
  // Header
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  darkHeader: {
    backgroundColor: '#2c2c2e',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkAddButton: {
    backgroundColor: '#38383a',
  },
  
  // Filtres
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  yearScrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  monthScrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  darkYearButton: {
    backgroundColor: '#38383a',
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
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 60,
    alignItems: 'center',
  },
  darkMonthButton: {
    backgroundColor: '#38383a',
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
  
  // Résumé financier
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  darkCard: {
    backgroundColor: '#2c2c2e',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  transactionCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  mainBalanceContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  mainBalance: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statDivider: {
    width: 1,
    height: 'auto',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  
  // Liste
  listContent: {
    paddingBottom: 100,
  },
  
  // Carte de transaction
  transactionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  specialTransactionCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    backgroundColor: '#F8FAFF',
  },
  recurringTransactionCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  transactionMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  recurringIconContainer: {
    backgroundColor: '#F59E0B20',
    borderColor: '#F59E0B40',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  specialCategoryText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  recurringCategoryText: {
    color: '#92400E',
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  systemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  systemBadgeText: {
    fontSize: 10,
    color: '#1E40AF',
    fontWeight: '500',
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recurringBadgeText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '500',
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionType: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  readOnlyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignSelf: 'flex-start',
  },
  readOnlyText: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '500',
  },
  recurringIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignSelf: 'flex-start',
  },
  recurringIndicatorText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '500',
  },
  
  // État vide
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  darkEmptyIcon: {
    backgroundColor: '#2c2c2e',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  addEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addEmptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Chargement
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  
  // Divers
  spacer: {
    height: 20,
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
  
  // Textes sombres
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default TransactionsScreen;