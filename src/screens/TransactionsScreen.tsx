// src/screens/TransactionsScreen.tsx - VERSION CORRIGÉE AVEC SOLDES PAR ONGLET
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { Transaction } from '../types';

type TabType = 'all' | 'normal' | 'special' | 'recurring';

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
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const isDark = theme === 'dark';

  // ✅ CATÉGORIES SPÉCIALES EN LECTURE SEULE
  const SPECIAL_CATEGORIES = ['transfert', 'épargne', 'remboursement épargne', 'dette', 'charges_annuelles'];

  // ✅ VÉRIFIER SI UNE TRANSACTION EST SPÉCIALE
  const isSpecialTransaction = (transaction: Transaction): boolean => {
    return SPECIAL_CATEGORIES.includes(transaction.category.toLowerCase()) ||
           transaction.description?.includes('Transfert') ||
           transaction.description?.includes('Épargne:') ||
           transaction.description?.includes('Remboursement:');
  };

  // ✅ VÉRIFIER SI UNE TRANSACTION EST MODIFIABLE
  const isTransactionEditable = (transaction: Transaction): boolean => {
    return !isSpecialTransaction(transaction);
  };

  // ✅ CORRECTION : Navigation conditionnelle selon le type de transaction
  const handleTransactionPress = async (transactionId: string) => {
    try {
      console.log('🔄 Vérification transaction:', transactionId);
      
      const transaction = await getTransactionById(transactionId);
      if (!transaction) {
        console.error('❌ Transaction non trouvée:', transactionId);
        return;
      }
      
      // ✅ TRANSACTIONS SPÉCIALES : LECTURE SEULE
      if (isSpecialTransaction(transaction)) {
        console.log('📖 Transaction spéciale - Affichage info seulement');
        
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
      
      // ✅ TRANSACTIONS NORMALES : ÉDITION AUTORISÉE
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
      'transfert': 'Transfert',
      'épargne': 'Épargne',
      'remboursement épargne': 'Remboursement Épargne',
      'dette': 'Paiement de Dette',
      'charges_annuelles': 'Charge Annuelle'
    };
    return labels[category.toLowerCase()] || category;
  };

  // ✅ OBTENIR L'ICÔNE DES CATÉGORIES SPÉCIALES
  const getSpecialCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'transfert': 'swap-horizontal',
      'épargne': 'trending-up',
      'remboursement épargne': 'cash',
      'dette': 'card',
      'charges_annuelles': 'calendar'
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

  // ✅ CORRECTION : Filtrer les transactions par onglet
  const getFilteredTransactions = (): Transaction[] => {
    switch (activeTab) {
      case 'normal':
        // Transactions normales (non spéciales et non récurrentes)
        return transactions.filter(t => !isSpecialTransaction(t) && !t.isRecurring);
      case 'special':
        // Transactions spéciales (transferts, épargne, etc.)
        return transactions.filter(t => isSpecialTransaction(t));
      case 'recurring':
        // Transactions récurrentes normales (non spéciales)
        return transactions.filter(t => t.isRecurring && !isSpecialTransaction(t));
      case 'all':
      default:
        // Toutes les transactions
        return transactions;
    }
  };

  // ✅ CORRECTION : CALCULS SPÉCIFIQUES À CHAQUE ONGLET
  const getTabStats = () => {
    const filteredTransactions = getFilteredTransactions();
    
    // ✅ CALCUL DES REVENUS ET DÉPENSES POUR L'ONGLET ACTUEL
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const total = filteredTransactions.length;
    
    // ✅ SOLDE SPÉCIFIQUE À L'ONGLET
    let tabBalance = 0;
    let tabBalanceLabel = '';
    
    switch (activeTab) {
      case 'all':
        tabBalance = totalBalance; // Solde total des comptes
        tabBalanceLabel = 'Solde total disponible';
        break;
      case 'normal':
        tabBalance = income - expenses; // Solde des transactions normales
        tabBalanceLabel = 'Solde transactions normales';
        break;
      case 'recurring':
        tabBalance = income - expenses; // Solde des transactions récurrentes
        tabBalanceLabel = 'Solde transactions récurrentes';
        break;
      case 'special':
        tabBalance = income - expenses; // Solde des transactions système
        tabBalanceLabel = 'Solde transactions système';
        break;
      default:
        tabBalance = totalBalance;
        tabBalanceLabel = 'Solde total';
    }
    
    return {
      total,
      income,
      expenses,
      balance: tabBalance,
      balanceLabel: tabBalanceLabel,
      totalBalance // Garder pour référence
    };
  };

  const tabStats = getTabStats();

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
      
      {/* ✅ CORRECTION : Onglets avec descriptions claires */}
      <View style={styles.tabContainer}>
        {[
          { key: 'all', label: 'Toutes', icon: 'list', description: 'Toutes les transactions' },
          { key: 'normal', label: 'Normales', icon: 'document', description: 'Transactions manuelles' },
          { key: 'recurring', label: 'Récurrentes', icon: 'repeat', description: 'Transactions programmées' },
          { key: 'special', label: 'Système', icon: 'shield-checkmark', description: 'Transactions automatiques' }
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

  // ✅ COMPOSANT : Résumé financier moderne AVEC SOLDES SPÉCIFIQUES
  const FinancialSummary = () => {
    const getSummaryDescription = () => {
      switch (activeTab) {
        case 'normal':
          return "Vos transactions manuelles et modifiables";
        case 'special':
          return "Transactions automatiques du système (transferts, épargne...)";
        case 'recurring':
          return "Vos transactions récurrentes programmées";
        case 'all':
        default:
          return "Toutes vos transactions combinées";
      }
    };

    const getSummaryTitle = () => {
      switch (activeTab) {
        case 'all': return 'Résumé Global';
        case 'normal': return 'Transactions Normales';
        case 'recurring': return 'Transactions Récurrentes';
        case 'special': return 'Transactions Système';
        default: return 'Résumé';
      }
    };

    return (
      <View style={[styles.summaryCard, isDark && styles.darkCard]}>
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, isDark && styles.darkText]}>
            {getSummaryTitle()}
          </Text>
          <Text style={[styles.transactionCount, isDark && styles.darkSubtext]}>
            {tabStats.total} transaction{tabStats.total !== 1 ? 's' : ''}
          </Text>
        </View>
        
        {/* ✅ AFFICHAGE DU SOLDE SPÉCIFIQUE À L'ONGLET */}
        <View style={styles.mainBalanceContainer}>
          <Text style={[styles.balanceLabel, isDark && styles.darkSubtext]}>
            {tabStats.balanceLabel}
          </Text>
          <Text style={[
            styles.mainBalance,
            { color: tabStats.balance >= 0 ? '#10B981' : '#EF4444' }
          ]}>
            {formatAmount(tabStats.balance)}
          </Text>
        </View>

        {/* ✅ STATISTIQUES DÉTAILLÉES DE L'ONGLET */}
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
                {formatAmount(tabStats.income)}
              </Text>
              <Text style={[styles.statSubtext, isDark && styles.darkSubtext]}>
                {tabStats.total > 0 ? Math.round((tabStats.income / (tabStats.income + tabStats.expenses)) * 100) || 0 : 0}%
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
                {formatAmount(tabStats.expenses)}
              </Text>
              <Text style={[styles.statSubtext, isDark && styles.darkSubtext]}>
                {tabStats.total > 0 ? Math.round((tabStats.expenses / (tabStats.income + tabStats.expenses)) * 100) || 0 : 0}%
              </Text>
            </View>
          </View>
        </View>

        {/* ✅ DESCRIPTION CONTEXTUELLE */}
        <View style={styles.descriptionContainer}>
          <Text style={[styles.descriptionText, isDark && styles.darkSubtext]}>
            {getSummaryDescription()}
          </Text>
        </View>

        {/* ✅ NOTES INFORMATIVES SPÉCIFIQUES */}
        {activeTab === 'special' && (
          <View style={styles.systemNote}>
            <Ionicons name="information-circle" size={16} color="#007AFF" />
            <Text style={[styles.systemNoteText, isDark && styles.darkSubtext]}>
              Transferts, épargne et transactions automatiques - Lecture seule
            </Text>
          </View>
        )}

        {activeTab === 'recurring' && (
          <View style={styles.recurringNote}>
            <Ionicons name="information-circle" size={16} color="#F59E0B" />
            <Text style={[styles.recurringNoteText, isDark && styles.darkSubtext]}>
              Ces transactions se répètent automatiquement selon leur programmation
            </Text>
          </View>
        )}

        {activeTab === 'normal' && (
          <View style={styles.normalNote}>
            <Ionicons name="create-outline" size={16} color="#10B981" />
            <Text style={[styles.normalNoteText, isDark && styles.darkSubtext]}>
              Transactions modifiables et supprimables
            </Text>
          </View>
        )}
      </View>
    );
  };

  // ✅ COMPOSANT : Carte de transaction avec indicateurs
  const TransactionCard = ({ item }: { item: Transaction }) => {
    const isSpecial = isSpecialTransaction(item);
    const isEditable = isTransactionEditable(item);
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
          {/* Icône et informations principales */}
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

          {/* Montant et indicateurs */}
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

        {/* ✅ INDICATEUR VISUEL POUR TRANSACTIONS SPÉCIALES */}
        {isSpecial && (
          <View style={styles.readOnlyIndicator}>
            <Ionicons name="eye" size={12} color="#007AFF" />
            <Text style={styles.readOnlyText}>Lecture seule - Transaction automatique</Text>
          </View>
        )}

        {/* ✅ INDICATEUR VISUEL POUR TRANSACTIONS RÉCURRENTES */}
        {isRecurring && (
          <View style={styles.recurringIndicator}>
            <Ionicons name="refresh" size={12} color="#F59E0B" />
            <Text style={styles.recurringIndicatorText}>Se répète automatiquement</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
         activeTab === 'recurring' ? 'Aucune transaction récurrente' :
         'Aucune transaction système'}
      </Text>
      <Text style={[styles.emptySubtitle, isDark && styles.darkSubtext]}>
        {activeTab === 'all' ? 'Commencez par ajouter votre première transaction' :
         activeTab === 'normal' ? 'Les transactions manuelles et modifiables apparaîtront ici' :
         activeTab === 'recurring' ? 'Les transactions récurrentes programmées apparaîtront ici' :
         'Les transactions automatiques (transferts, épargne) apparaîtront ici'}
      </Text>
      {activeTab !== 'special' && (
        <TouchableOpacity 
          style={styles.addEmptyButton}
          onPress={() => navigation.navigate('AddTransaction', {
            isRecurring: activeTab === 'recurring'
          })}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addEmptyButtonText}>
            {activeTab === 'recurring' ? 'Nouvelle récurrente' : 'Nouvelle transaction'}
          </Text>
        </TouchableOpacity>
      )}
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

      {/* ✅ BOUTON D'AJOUT CACHÉ POUR LES TRANSACTIONS SYSTÈME */}
      {activeTab !== 'special' && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('AddTransaction', {
            isRecurring: activeTab === 'recurring'
          })}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}
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
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 2,
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
    fontSize: 11.5,
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

  // ✅ NOUVEAU : Conteneur du solde principal
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
    textAlign: 'center',
  },
  mainBalance: {
    fontSize: 28,
    fontWeight: 'bold',
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
  statSubtext: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 'auto',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },

  // ✅ NOUVEAU : Description contextuelle
  descriptionContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Notes informatives
  systemNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  systemNoteText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
    flex: 1,
  },
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
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  normalNoteText: {
    fontSize: 12,
    color: '#065F46',
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

  // Indicateurs
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