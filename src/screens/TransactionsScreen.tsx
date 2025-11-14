// src/screens/TransactionsScreen.tsx - VERSION COMPLÈTEMENT CORRIGÉE AVEC LOGIQUE MÉTIER
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../hooks/useTransactions';
import { Transaction } from '../types';

type TabType = 'all' | 'normal' | 'recurring';

const TransactionsScreen = ({ navigation }: any) => {
  const { formatAmount } = useCurrency();
  const { theme } = useTheme();
  const { 
    transactions, 
    loading, 
    error,
    refreshTransactions,
    getStats,
    getTransactionById
  } = useTransactions();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const isDark = theme === 'dark';

  // ✅ CORRECTION : Navigation vers l'édition avec vérification
  const handleTransactionPress = async (transactionId: string) => {
    try {
      console.log('🔄 Navigation vers modification transaction:', transactionId);
      
      // Vérifier que la transaction existe
      const transaction = await getTransactionById(transactionId);
      if (!transaction) {
        console.error('❌ Transaction non trouvée:', transactionId);
        return;
      }
      
      setSelectedTransaction(transaction);
      navigation.navigate('EditTransaction', { 
        transactionId,
        transactionData: transaction 
      });
      
    } catch (error) {
      console.error('❌ Erreur navigation:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTransactions();
    setRefreshing(false);
  };

  // ✅ CORRECTION : Recharger les transactions à chaque focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshTransactions();
    });

    return unsubscribe;
  }, [navigation, refreshTransactions]);

  // ✅ CORRECTION : Filtrer les transactions par onglet
  const getFilteredTransactions = (): Transaction[] => {
    switch (activeTab) {
      case 'normal':
        return transactions.filter(t => !t.isRecurring);
      case 'recurring':
        return transactions.filter(t => t.isRecurring);
      case 'all':
      default:
        return transactions;
    }
  };

  // ✅ CORRECTION : Récupérer les statistiques avec l'onglet actif
  const tabStats = getStats(activeTab);

  // ✅ COMPOSANT : En-tête moderne avec onglets
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
      
      {/* ✅ CORRECTION : Onglets modernes */}
      <View style={styles.tabContainer}>
        {[
          { key: 'all', label: 'Toutes', icon: 'list' },
          { key: 'normal', label: 'Normales', icon: 'document' },
          { key: 'recurring', label: 'Récurrentes', icon: 'repeat' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
              isDark && styles.darkTab
            ]}
            onPress={() => setActiveTab(tab.key as TabType)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={16} 
              color={activeTab === tab.key ? '#007AFF' : (isDark ? '#888' : '#666')} 
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText,
              isDark && styles.darkText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ✅ COMPOSANT : Résumé financier moderne AVEC LOGIQUE MÉTIER CORRIGÉE
  const FinancialSummary = () => {
    // ✅ TEXTE EXPLICATIF PAR ONGLET
    const getSummaryDescription = () => {
      switch (activeTab) {
        case 'normal':
          return "Revenu disponible pour couvrir vos dépenses courantes";
        case 'recurring':
          return "Revenu disponible pour couvrir vos engagements récurrents";
        case 'all':
        default:
          return "Revenu disponible total de votre compte";
      }
    };

    // ✅ INDICATEUR DE SANTÉ FINANCIÈRE
    const getFinancialHealth = () => {
      const utilizationRate = (tabStats.expenses / tabStats.availableIncome) * 100;
      
      if (utilizationRate <= 50) return { status: '✅ Sain', color: '#10B981' };
      if (utilizationRate <= 80) return { status: '⚠️ Attention', color: '#F59E0B' };
      return { status: '🚨 Critique', color: '#EF4444' };
    };

    const health = getFinancialHealth();

    return (
      <View style={[styles.summaryCard, isDark && styles.darkCard]}>
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, isDark && styles.darkText]}>
            {activeTab === 'all' ? 'Résumé Global' : 
             activeTab === 'normal' ? 'Transactions Courantes' : 
             'Engagements Récurrents'}
          </Text>
          <Text style={[styles.transactionCount, isDark && styles.darkSubtext]}>
            {tabStats.total} transaction{tabStats.total !== 1 ? 's' : ''}
          </Text>
        </View>
        
        {/* ✅ REVENU DISPONIBLE - TOUJOURS LE MÊME */}
        <View style={styles.availableIncomeSection}>
          <View style={styles.availableIncomeHeader}>
            <Ionicons name="wallet" size={20} color="#10B981" />
            <Text style={[styles.availableIncomeLabel, isDark && styles.darkSubtext]}>
              Revenu Disponible
            </Text>
          </View>
          <Text style={[styles.availableIncomeValue, { color: '#10B981' }]}>
            {formatAmount(tabStats.availableIncome)}
          </Text>
          <Text style={[styles.availableIncomeDescription, isDark && styles.darkSubtext]}>
            {getSummaryDescription()}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#EF444420' }]}>
              <Ionicons name="arrow-up" size={16} color="#EF4444" />
            </View>
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                Dépenses {activeTab === 'all' ? 'Totales' : activeTab === 'normal' ? 'Courantes' : 'Récurrentes'}
              </Text>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>
                {formatAmount(tabStats.expenses)}
              </Text>
              <Text style={[styles.statPercentage, isDark && styles.darkSubtext]}>
                {((tabStats.expenses / tabStats.availableIncome) * 100).toFixed(1)}% du revenu
              </Text>
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <View style={[
              styles.statIcon, 
              { backgroundColor: tabStats.balance >= 0 ? '#10B98120' : '#EF444420' }
            ]}>
              <Ionicons 
                name={tabStats.balance >= 0 ? "trending-up" : "trending-down"} 
                size={16} 
                color={tabStats.balance >= 0 ? '#10B981' : '#EF4444'} 
              />
            </View>
            <View style={styles.statInfo}>
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                Solde Restant
              </Text>
              <Text style={[
                styles.statValue, 
                { color: tabStats.balance >= 0 ? '#10B981' : '#EF4444' }
              ]}>
                {formatAmount(tabStats.balance)}
              </Text>
              <View style={styles.healthIndicator}>
                <View style={[styles.healthDot, { backgroundColor: health.color }]} />
                <Text style={[styles.healthText, { color: health.color }]}>
                  {health.status}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* ✅ CORRECTION : Indicateur pour transactions récurrentes */}
        {activeTab === 'recurring' && (
          <View style={styles.recurringNote}>
            <Ionicons name="information-circle" size={16} color="#F59E0B" />
            <Text style={[styles.recurringNoteText, isDark && styles.darkSubtext]}>
              Engagements mensuels récurrents - Impact sur votre revenu disponible
            </Text>
          </View>
        )}

        {activeTab === 'normal' && (
          <View style={styles.normalNote}>
            <Ionicons name="flash" size={16} color="#007AFF" />
            <Text style={[styles.normalNoteText, isDark && styles.darkSubtext]}>
              Dépenses courantes - Solde immédiatement disponible
            </Text>
          </View>
        )}
      </View>
    );
  };

  // ✅ COMPOSANT : Carte de transaction moderne
  const TransactionCard = ({ item }: { item: Transaction }) => (
    <TouchableOpacity 
      style={[styles.transactionCard, isDark && styles.darkCard]}
      onPress={() => handleTransactionPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.transactionMain}>
        {/* Icône et informations principales */}
        <View style={styles.transactionLeft}>
          <View style={[
            styles.iconContainer,
            { 
              backgroundColor: item.type === 'income' ? '#10B98120' : '#EF444420',
              borderColor: item.type === 'income' ? '#10B98140' : '#EF444440'
            }
          ]}>
            <Ionicons 
              name={item.type === 'income' ? 'arrow-down' : 'arrow-up'} 
              size={20} 
              color={item.type === 'income' ? '#10B981' : '#EF4444'} 
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
                <Text style={[styles.transactionCategory, isDark && styles.darkSubtext]}>
                  {item.category}
                </Text>
              </View>
              
              <View style={styles.dateContainer}>
                <Ionicons 
                  name="calendar" 
                  size={12} 
                  color={isDark ? '#888' : '#666'} 
                />
                <Text style={[styles.transactionDate, isDark && styles.darkSubtext]}>
                  {new Date(item.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </Text>
              </View>

              {item.isRecurring && (
                <View style={styles.recurringBadge}>
                  <Ionicons name="repeat" size={10} color="#F59E0B" />
                  <Text style={styles.recurringBadgeText}>Récurrente</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Montant et indicateurs */}
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            { color: item.type === 'income' ? '#10B981' : '#EF4444' }
          ]}>
            {item.type === 'income' ? '+' : ''}{formatAmount(item.amount)}
          </Text>
          
          {/* Indicateur de type */}
          <Text style={[
            styles.transactionType,
            isDark && styles.darkSubtext
          ]}>
            {item.type === 'income' ? 'Revenu' : 'Dépense'}
            {item.isRecurring && ' • Récurrent'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ✅ COMPOSANT : État vide moderne
  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, isDark && styles.darkEmptyIcon]}>
        <Ionicons 
          name="receipt-outline" 
          size={64} 
          color={isDark ? '#555' : '#ccc'} 
        />
      </View>
      <Text style={[styles.emptyTitle, isDark && styles.darkText]}>
        {activeTab === 'all' ? 'Aucune transaction' : 
         activeTab === 'normal' ? 'Aucune transaction normale' : 
         'Aucune transaction récurrente'}
      </Text>
      <Text style={[styles.emptySubtitle, isDark && styles.darkSubtext]}>
        {activeTab === 'all' ? 'Commencez par ajouter votre première transaction' :
         activeTab === 'normal' ? 'Les transactions normales apparaîtront ici' :
         'Les transactions récurrentes apparaîtront ici'}
      </Text>
      <TouchableOpacity 
        style={styles.addEmptyButton}
        onPress={() => navigation.navigate('AddTransaction', { 
          isRecurring: activeTab === 'recurring' 
        })}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addEmptyButtonText}>
          {activeTab === 'recurring' ? 'Créer une transaction récurrente' : 'Nouvelle transaction'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ✅ COMPOSANT : Indicateur de chargement moderne
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

  const filteredTransactions = getFilteredTransactions();

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

      {/* Bouton d'ajout flottant moderne */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction', {
          isRecurring: activeTab === 'recurring'
        })}
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
  
  // Onglets
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  darkTab: {
    backgroundColor: '#38383a',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
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

  // Section Revenu Disponible
  availableIncomeSection: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  availableIncomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  availableIncomeLabel: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '600',
  },
  availableIncomeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  availableIncomeDescription: {
    fontSize: 12,
    color: '#047857',
  },

  // Grille de statistiques
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 16,
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
  statPercentage: {
    fontSize: 11,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 'auto',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },

  // Indicateur de santé
  healthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Notes informatives
  recurringNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  recurringNoteText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  normalNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  normalNoteText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
    flex: 1,
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
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