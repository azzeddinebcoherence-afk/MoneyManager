// src/screens/TransactionsScreen.tsx - VERSION SIMPLIFIÉE AVEC FILTRES ANNÉE/MOIS
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import ListTransactionItem from '../components/transaction/ListTransactionItem';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { useDesignSystem, useTheme } from '../context/ThemeContext';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { Transaction } from '../types';

const TransactionsScreen = ({ navigation }: any) => {
  const { formatAmount } = useCurrency();
  const { colors } = useDesignSystem();
  const { theme } = useTheme();
  const { t } = useLanguage();
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
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1); // null = whole year
  const [yearOnly, setYearOnly] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<string>(t.all);

  const isDark = theme === 'dark';

  // ✅ CATÉGORIES SPÉCIALES EN LECTURE SEULE
  const SPECIAL_CATEGORIES = ['dette', 'épargne', 'charges_annuelles', 'transfert', 'remboursement épargne'];

  // ✅ GÉNÉRER LES ANNÉES (2024-2028)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1, currentYear + 2, currentYear + 3];
  };

  // ✅ GÉNÉRER LES MOIS AVEC TRADUCTIONS
  const generateMonths = () => {
    return [
      { number: 1, name: t.january, short: t.january.substring(0, 3) },
      { number: 2, name: t.february, short: t.february.substring(0, 3) },
      { number: 3, name: t.march, short: t.march.substring(0, 3) },
      { number: 4, name: t.april, short: t.april.substring(0, 3) },
      { number: 5, name: t.may, short: t.may.substring(0, 3) },
      { number: 6, name: t.june, short: t.june.substring(0, 3) },
      { number: 7, name: t.july, short: t.july.substring(0, 3) },
      { number: 8, name: t.august, short: t.august.substring(0, 3) },
      { number: 9, name: t.september, short: t.september.substring(0, 3) },
      { number: 10, name: t.october, short: t.october.substring(0, 3) },
      { number: 11, name: t.november, short: t.november.substring(0, 3) },
      { number: 12, name: t.december, short: t.december.substring(0, 3) }
    ];
  };

  // ✅ FILTRER LES TRANSACTIONS PAR ANNÉE ET MOIS
  const getFilteredTransactions = (): Transaction[] => {
    // Filtrage initial
    let base = transactions.slice();

    // Si on filtre par année uniquement ("Cette année"), ne filtrer que sur l'année
    if (yearOnly) {
      base = base.filter(transaction => {
        const d = new Date(transaction.date);
        return d.getFullYear() === selectedYear;
      });
    } else {
      // Filtre par année et mois
      base = base.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        const transactionYear = transactionDate.getFullYear();
        const transactionMonth = transactionDate.getMonth() + 1;
        return transactionYear === selectedYear && transactionMonth === selectedMonth;
      });
    }

    // Appliquer filtre selon l'onglet sélectionné
    if (selectedTab === t.incomes) {
      base = base.filter(t => t.type === 'income');
    } else if (selectedTab === t.expenses) {
      base = base.filter(t => t.type === 'expense');
    } else if (selectedTab === t.thisMonth) {
      const now = new Date();
      base = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear() && (d.getMonth() + 1) === (now.getMonth() + 1);
      });
    }

    return base;
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

  // Stabiliser l'appel refreshTransactions en utilisant une ref
  const refreshTransactionsRef = useRef<typeof refreshTransactions | null>(null);
  useEffect(() => { refreshTransactionsRef.current = refreshTransactions; }, [refreshTransactions]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const fn = refreshTransactionsRef.current;
      if (fn) fn();
    });
    return unsubscribe;
  }, [navigation]);

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

  // Nouveau header : bouton retour + titre centré + onglets segmentés (Toutes / Revenus / Dépenses / Ce mois)
  const ImageHeader = () => (
    <View style={[styles.headerImage, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
      <View style={styles.headerRow}> 
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.background.secondary }]} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={[styles.titleCentered, { color: colors.text.primary }]}>{t.transactions}</Text>

        <View style={{width:44}} />
      </View>

      <View style={styles.segmentContainer}>
        {[t.all, t.incomes, t.expenses, t.thisMonth].map((tab) => {
          const active = (tab === selectedTab);
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.segmentButton, active && styles.segmentButtonActive]}
              onPress={() => {
                setSelectedTab(tab);
                if (tab === t.thisMonth) {
                  const now = new Date();
                  setSelectedMonth(now.getMonth() + 1);
                  setSelectedYear(now.getFullYear());
                }
              }}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // Compact filter: show selected month + 'Cette année' pill and a dropdown to pick month
  const [monthDropdownVisible, setMonthDropdownVisible] = useState(false);

  const CompactFilter = () => {
    const selectedMonthObj = months.find(m => m.number === selectedMonth) || months[new Date().getMonth()];
    return (
      <View style={styles.compactFilterContainer}>
        <View style={styles.compactLeft}>
          <Text style={[styles.currentMonthText, { color: colors.text.primary }]}>{selectedMonthObj.name} {selectedYear}</Text>
          <TouchableOpacity
            style={[styles.anneePill, yearOnly && styles.anneePillActive]}
            onPress={() => {
              const now = new Date();
              setSelectedYear(now.getFullYear());
              setYearOnly(!yearOnly);
              setSelectedMonth(yearOnly ? (now.getMonth() + 1) : null);
            }}
          >
            <Text style={[styles.anneePillText, yearOnly && styles.anneePillTextActive]}>Cette année</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.monthDropdownButton} onPress={() => setMonthDropdownVisible(true)}>
          <Text style={styles.monthDropdownText}>{selectedMonthObj.short}</Text>
          <Ionicons name="chevron-down" size={18} color={colors.text.primary} style={{marginLeft:8}} />
        </TouchableOpacity>

        <Modal transparent visible={monthDropdownVisible} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setMonthDropdownVisible(false)}>
            <View style={[styles.modalContent, { backgroundColor: colors.background.card }]}>
              {months.map((m) => (
                <TouchableOpacity key={m.number} style={styles.modalItem} onPress={() => {
                  setSelectedMonth(m.number);
                  setYearOnly(false);
                  setSelectedTab(t.all);
                  setMonthDropdownVisible(false);
                }}>
                  <Text style={[styles.modalItemText, { color: colors.text.primary }]}>{m.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  };

  // ✅ COMPOSANT : Résumé financier
  const FinancialSummary = () => {
    const currentMonthName = months.find(m => m.number === selectedMonth)?.name || '';

    return (
      <View style={[styles.summaryCard, { backgroundColor: colors.background.card }]}>
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, { color: colors.text.primary }]}>
            {currentMonthName} {selectedYear}
          </Text>
          <Text style={[styles.transactionCount, { color: colors.text.secondary }]}>
            {stats.total} transaction{stats.total !== 1 ? 's' : ''}
          </Text>
        </View>
        
        <View style={styles.mainBalanceContainer}>
          <Text style={[styles.balanceLabel, { color: colors.text.secondary }]}>
            Solde du mois
          </Text>
          <Text style={[
            styles.mainBalance,
            { color: stats.balance >= 0 ? colors.semantic.success : colors.semantic.error }
          ]}>
            {formatAmount(stats.balance)}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.semantic.success + '20' }]}>
              <Ionicons name="arrow-down" size={16} color={colors.semantic.success} />
            </View>
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                {t.incomes}
              </Text>
              <Text style={[styles.statValue, { color: colors.semantic.success }]}>
                {formatAmount(stats.income)}
              </Text>
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.semantic.error + '20' }]}>
              <Ionicons name="arrow-up" size={16} color={colors.semantic.error} />
            </View>
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                {t.expenses}
              </Text>
              <Text style={[styles.statValue, { color: colors.semantic.error }]}>
                {formatAmount(stats.expenses)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ✅ COMPOSANT : État vide
  const EmptyState = () => {
    const currentMonthName = months.find(m => m.number === selectedMonth)?.name || '';
    
    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.background.secondary }]}>
          <Ionicons 
            name="receipt-outline" 
            size={64} 
            color={colors.text.disabled} 
          />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
          Aucune transaction
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
          {`Aucune transaction trouvée pour ${currentMonthName} ${selectedYear}`}
        </Text>
        <TouchableOpacity 
          style={styles.addEmptyButton}
          onPress={() => navigation.navigate('AddTransaction')}
        >
          <Ionicons name="add" size={20} color={colors.text.inverse} />
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
      <ActivityIndicator size="large" color={colors.primary[500]} />
      <Text style={[styles.loadingText, { color: colors.text.primary }]}>
        Chargement des transactions...
      </Text>
    </View>
  );

  if (loading && !refreshing && transactions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <ImageHeader />
        <LoadingIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ImageHeader />
      <CompactFilter />
      
      <FlatList
        data={filteredTransactions}
        renderItem={({ item }) => <ListTransactionItem item={item} onPress={handleTransactionPress} />}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
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
  },
  
  // Header
  header: {
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
  headerImage: {
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  titleCentered: {
    fontSize: 20,
    fontWeight: '700',
  },
  segmentContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'transparent',
  },
  segmentButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  segmentButtonActive: {
    backgroundColor: '#8b5cf6',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  segmentTextActive: {
    color: '#fff',
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
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Filtres
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  yearScrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  filtersContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  compactFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentMonthText: {
    fontSize: 16,
    fontWeight: '700',
  },
  anneePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  anneePillActive: {
    backgroundColor: '#007AFF',
  },
  anneePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  anneePillTextActive: {
    color: '#fff',
  },
  monthDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  monthDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 260,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modalItemText: {
    fontSize: 16,
    color: '#0f172a',
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
  },
  monthButtonTextActive: {
    color: '#fff',
  },
  
  // Résumé financier
  summaryCard: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
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
  },
  transactionCount: {
    fontSize: 14,
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
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
    fontWeight: '700',
    marginBottom: 6,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
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

  // Cartes verticales gradientées
  cardBorder: {
    borderWidth: 1,
    borderColor: '#E6EEF8',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 8,
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
  
  // Textes sombres
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default TransactionsScreen;