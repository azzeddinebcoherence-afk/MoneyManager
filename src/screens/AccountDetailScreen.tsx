// src/screens/AccountDetailScreen.tsx - VERSION AVEC TRANSACTIONS SPÉCIALES EN LECTURE SEULE
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import AccountForm from '../components/account/AccountForm';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';
import { Account, Transaction } from '../types';

type AccountDetailScreenNavigationProp = any;
type AccountDetailScreenRouteProp = RouteProp<{
  AccountDetail: {
    accountId: string;
  };
}, 'AccountDetail'>;

// ✅ CATÉGORIES SPÉCIALES EN LECTURE SEULE
const READONLY_CATEGORIES = [
  'dette',
  'épargne', 
  'remboursement épargne',
  'transfert',
  'charge_annuelle'
];

// Composant TransactionItem modifié pour lecture seule
const TransactionItem = React.memo(({ 
  transaction, 
  isDark, 
  navigation, 
  formatAmount, 
  isProcessing,
  getCategoryName,
  isReadOnly // ✅ NOUVEAU PROP POUR LECTURE SEULE
}: { 
  transaction: Transaction;
  isDark: boolean;
  navigation: AccountDetailScreenNavigationProp;
  formatAmount: (amount: number) => string;
  isProcessing: boolean;
  getCategoryName: (categoryId: string) => string;
  isReadOnly: boolean; // ✅ INDICATION SI LECTURE SEULE
}) => {
  const isSpecialTransaction = READONLY_CATEGORIES.includes(transaction.category);
  
  return (
    <TouchableOpacity
      style={[
        styles.transactionItem, 
        isDark && styles.darkCard,
        isReadOnly && styles.readOnlyTransaction // ✅ STYLE SPÉCIAL POUR LECTURE SEULE
      ]}
      activeOpacity={isReadOnly ? 1 : 0.7} // ✅ DÉSACTIVER LE CLIC SI LECTURE SEULE
      disabled={isProcessing || isReadOnly} // ✅ DÉSACTIVER SI LECTURE SEULE
      onPress={() => {
        if (isReadOnly) {
          // ✅ NE RIEN FAIRE SI LECTURE SEULE
          return;
        }
        console.log('🎯 Navigation vers détail transaction:', transaction.id);
        navigation.navigate('EditTransaction', { 
          transactionId: transaction.id 
        });
      }}
    >
      <View style={styles.transactionLeft}>
        <Ionicons 
          name={transaction.type === 'income' ? "arrow-down-circle" : "arrow-up-circle"} 
          size={24} 
          color={transaction.type === 'income' ? "#34C759" : "#FF3B30"} 
        />
        <View style={styles.transactionDetails}>
          <Text style={[styles.transactionDescription, isDark && styles.darkText]}>
            {transaction.description || 'Sans description'}
          </Text>
          <View style={styles.categoryContainer}>
            <Text style={[styles.transactionCategory, isDark && styles.darkSubtext]}>
              {getCategoryName(transaction.category)}
            </Text>
            {isReadOnly && ( // ✅ BADGE "AUTOMATIQUE" POUR LES TRANSACTIONS SPÉCIALES
              <View style={styles.readOnlyBadge}>
              </View>
            )}
          </View>
          <Text style={[styles.transactionDate, isDark && styles.darkSubtext]}>
            {new Date(transaction.date).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: transaction.type === 'income' ? '#34C759' : '#FF3B30' },
        isReadOnly && styles.readOnlyAmount // ✅ STYLE SPÉCIAL POUR MONTANT LECTURE SEULE
      ]}>
        {transaction.type === 'income' ? '+' : '-'}{formatAmount(Math.abs(transaction.amount))}
      </Text>
    </TouchableOpacity>
  );
});

// Composant TransactionsSection modifié
const TransactionsSection = React.memo(({
  accountTransactions,
  transactionStats,
  accountId,
  account,
  isDark,
  navigation,
  formatAmount,
  isProcessing,
  getCategoryName
}: {
  accountTransactions: Transaction[];
  transactionStats: { totalIncome: number; totalExpenses: number; transactionCount: number };
  accountId: string;
  account: Account | undefined;
  isDark: boolean;
  navigation: AccountDetailScreenNavigationProp;
  formatAmount: (amount: number) => string;
  isProcessing: boolean;
  getCategoryName: (categoryId: string) => string;
}) => {
  // ✅ FILTRER LES TRANSACTIONS : TOUTES SAUF CELLES DES CATÉGORIES SPÉCIALES
  const editableTransactions = accountTransactions.filter(
    transaction => !READONLY_CATEGORIES.includes(transaction.category)
  );

  // ✅ COMPTER LES TRANSACTIONS SPÉCIALES
  const specialTransactionsCount = accountTransactions.filter(
    transaction => READONLY_CATEGORIES.includes(transaction.category)
  ).length;

  if (accountTransactions.length === 0) {
    return (
      <View style={[styles.emptyContainer, isDark && styles.darkCard]}>
        <Ionicons name="receipt-outline" size={48} color="#666" />
        <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
          Aucune transaction
        </Text>
        <TouchableOpacity 
          style={[styles.addTransactionButton, isProcessing && styles.disabledButton]}
          onPress={() => {
            console.log('🎯 Navigation vers ajout transaction depuis compte:', accountId);
            navigation.navigate('AddTransaction', { 
              accountId: account?.id,
              initialType: 'expense'
            });
          }}
          disabled={isProcessing}
        >
          <Text style={styles.addTransactionButtonText}>
            Ajouter une transaction
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.transactionsCard, isDark && styles.darkCard]}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
            Transactions ({editableTransactions.length})
          </Text>
          {specialTransactionsCount > 0 && (
            <Text style={[styles.specialTransactionsInfo, isDark && styles.darkSubtext]}>
              + {specialTransactionsCount} transaction(s) automatique(s)
            </Text>
          )}
        </View>
        <TouchableOpacity 
          onPress={() => {
            console.log('🎯 Navigation vers liste transactions filtrée:', accountId);
            navigation.navigate('Transactions', { 
              accountFilter: accountId 
            });
          }}
          disabled={isProcessing}
        >
          <Text style={[styles.seeAllText, isDark && styles.darkSubtext]}>
            Voir tout
          </Text>
        </TouchableOpacity>
      </View>

      {/* Statistiques rapides */}
      <View style={[styles.statsContainer, isDark && styles.darkStatsContainer]}>
        <View style={styles.statItem}>
          <Ionicons name="arrow-down" size={16} color="#34C759" />
          <Text style={[styles.statText, isDark && styles.darkText]}>
            {formatAmount(transactionStats.totalIncome)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="arrow-up" size={16} color="#FF3B30" />
          <Text style={[styles.statText, isDark && styles.darkText]}>
            {formatAmount(transactionStats.totalExpenses)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="list" size={16} color="#007AFF" />
          <Text style={[styles.statText, isDark && styles.darkText]}>
            {accountTransactions.length}
          </Text>
        </View>
      </View>

      {/* Information sur les transactions automatiques */}
      {specialTransactionsCount > 0 && (
        <View style={[styles.specialInfoCard, isDark && styles.darkSpecialInfoCard]}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text style={[styles.specialInfoText, isDark && styles.darkText]}>
            Les transactions de dettes, épargne et charges annuelles sont en lecture seule
          </Text>
        </View>
      )}

      {/* Liste des transactions */}
      <View style={styles.transactionsList}>
        {accountTransactions.slice(0, 15).map((transaction) => (
          <TransactionItem 
            key={transaction.id} 
            transaction={transaction}
            isDark={isDark}
            navigation={navigation}
            formatAmount={formatAmount}
            isProcessing={isProcessing}
            getCategoryName={getCategoryName}
            isReadOnly={READONLY_CATEGORIES.includes(transaction.category)} // ✅ PASSER L'INFO LECTURE SEULE
          />
        ))}
        
        {accountTransactions.length > 15 && (
          <TouchableOpacity 
            style={styles.moreTransactions}
            onPress={() => {
              console.log('🎯 Navigation vers liste complète transactions:', accountId);
              navigation.navigate('Transactions', { 
                accountFilter: accountId 
              });
            }}
            disabled={isProcessing}
          >
            <Text style={[styles.moreTransactionsText, isDark && styles.darkSubtext]}>
              Voir les {accountTransactions.length - 15} transactions restantes
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const AccountDetailScreen = () => {
  const navigation = useNavigation<AccountDetailScreenNavigationProp>();
  const route = useRoute<AccountDetailScreenRouteProp>();
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { accounts, updateAccount, deleteAccount, refreshAccounts } = useAccounts();
  const { transactions, refreshTransactions } = useTransactions();
  const { categories } = useCategories();
  const { accountId } = route.params;
  const isDark = theme === 'dark';

  const [showAccountForm, setShowAccountForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ FONCTION POUR OBTENIR LE NOM DE LA CATÉGORIE
  const getCategoryName = useCallback((categoryId: string): string => {
    if (!categories || categories.length === 0) {
      return 'Catégorie inconnue';
    }
    
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Catégorie inconnue';
  }, [categories]);

  // ✅ CORRECTION : Navigation sécurisée pour les actions
  const handleAddTransaction = useCallback((type: 'income' | 'expense') => {
    console.log('🎯 Navigation vers ajout transaction:', { accountId, type });
    navigation.navigate('AddTransaction', { 
      accountId: accountId,
      initialType: type
    });
  }, [navigation, accountId]);

  const handleTransfer = useCallback(() => {
    console.log('🎯 Navigation vers transfert depuis:', accountId);
    navigation.navigate('Transfer', { 
      fromAccountId: accountId 
    });
  }, [navigation, accountId]);

  // Utilisation de useMemo pour éviter les recalculs inutiles
  const account = useMemo(() => 
    accounts.find(acc => acc.id === accountId),
    [accounts, accountId]
  );

  // Filtrage optimisé des transactions - MAINTENANT TOUTES LES TRANSACTIONS
  const accountTransactions = useMemo(() => {
    if (!accountId || !transactions) return [];
    return transactions.filter(
      transaction => transaction.accountId === accountId
    );
  }, [accountId, transactions]);

  // Statistiques optimisées
  const transactionStats = useMemo(() => {
    const totalIncome = accountTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalExpenses = accountTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const transactionCount = accountTransactions.length;

    return { totalIncome, totalExpenses, transactionCount };
  }, [accountTransactions]);

  // ✅ CORRECTION : Gestion de la modification avec rafraîchissement
  const handleUpdateAccount = useCallback(async (accountData: Omit<Account, 'id' | 'createdAt'>) => {
    if (!account) return;
    
    try {
      setIsProcessing(true);
      console.log('🔄 [AccountDetailScreen] Modification du compte...');
      
      await updateAccount(account.id, accountData);
      console.log('🔄 [AccountDetailScreen] Rafraîchissement des comptes...');
      await refreshAccounts();
      
      setShowAccountForm(false);
      
      setTimeout(() => {
        Alert.alert('Succès', 'Compte modifié avec succès');
      }, 300);
      
    } catch (error) {
      console.error('❌ [AccountDetailScreen] Erreur modification:', error);
      Alert.alert('Erreur', 'Impossible de modifier le compte');
    } finally {
      setIsProcessing(false);
    }
  }, [account, updateAccount, refreshAccounts]);

  // ✅ CORRECTION : Gestion de la suppression avec rafraîchissement
  const handleDeleteAccount = useCallback(() => {
    if (!account) return;

    Alert.alert(
      'Supprimer le compte',
      `Êtes-vous sûr de vouloir supprimer le compte "${account.name}" ?\n\nCette action est irréversible et supprimera toutes les données associées.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              console.log('🗑️ [AccountDetailScreen] Suppression du compte...');
              
              await deleteAccount(account.id);
              console.log('🔄 [AccountDetailScreen] Rafraîchissement après suppression...');
              await refreshAccounts();
              
              console.log('✅ [AccountDetailScreen] Compte supprimé avec succès');
              navigation.goBack();
              
            } catch (error: any) {
              console.error('❌ [AccountDetailScreen] Erreur suppression:', error);
              Alert.alert('Erreur', error.message || 'Impossible de supprimer le compte');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  }, [account, deleteAccount, navigation, refreshAccounts]);

  // ✅ CORRECTION : Rafraîchissement automatique quand l'écran est focus
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🎯 [AccountDetailScreen] Écran focus - rafraîchissement auto');
      refreshAccounts();
      refreshTransactions();
    });

    return unsubscribe;
  }, [navigation, refreshAccounts, refreshTransactions]);

  if (!account) {
    return (
      <View style={[styles.container, isDark && styles.darkContainer, styles.center]}>
        <Ionicons name="alert-circle" size={64} color="#FF3B30" />
        <Text style={[styles.errorText, isDark && styles.darkText]}>
          Compte non trouvé
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.darkHeader]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isProcessing}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.darkText]}>
          Détails du compte
        </Text>
        <TouchableOpacity 
          style={[styles.editButton, isProcessing && styles.disabledButton]}
          onPress={() => setShowAccountForm(true)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={isDark ? '#fff' : '#000'} />
          ) : (
            <Ionicons name="create-outline" size={24} color={isDark ? '#fff' : '#000'} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Carte principale */}
        <View style={[styles.mainCard, isDark && styles.darkCard]}>
          <View style={styles.accountHeader}>
            <View style={[styles.colorIndicator, { backgroundColor: account.color }]} />
            <View style={styles.accountInfo}>
              <Text style={[styles.accountName, isDark && styles.darkText]}>
                {account.name}
              </Text>
              <Text style={[styles.accountType, isDark && styles.darkSubtext]}>
                {account.type === 'cash' ? 'Espèces' : 
                 account.type === 'bank' ? 'Banque' : 
                 account.type === 'card' ? 'Carte' : 'Épargne'}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.balance, isDark && styles.darkText]}>
            {formatAmount(account.balance)}
          </Text>
        </View>

        {/* Actions rapides */}
        <View style={[styles.actionsCard, isDark && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
            Actions
          </Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, isProcessing && styles.disabledButton]}
              onPress={() => handleAddTransaction('expense')}
              disabled={isProcessing}
            >
              <Ionicons name="arrow-up" size={24} color="#FF3B30" />
              <Text style={[styles.actionText, isDark && styles.darkText]}>
                Dépense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, isProcessing && styles.disabledButton]}
              onPress={() => handleAddTransaction('income')}
              disabled={isProcessing}
            >
              <Ionicons name="arrow-down" size={24} color="#34C759" />
              <Text style={[styles.actionText, isDark && styles.darkText]}>
                Revenu
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, isProcessing && styles.disabledButton]}
              onPress={handleTransfer}
              disabled={isProcessing}
            >
              <Ionicons name="swap-horizontal" size={24} color="#007AFF" />
              <Text style={[styles.actionText, isDark && styles.darkText]}>
                Transfert
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section des transactions */}
        <TransactionsSection
          accountTransactions={accountTransactions}
          transactionStats={transactionStats}
          accountId={accountId}
          account={account}
          isDark={isDark}
          navigation={navigation}
          formatAmount={formatAmount}
          isProcessing={isProcessing}
          getCategoryName={getCategoryName}
        />

        {/* Informations détaillées */}
        <View style={[styles.infoCard, isDark && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
            Informations
          </Text>
          
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, isDark && styles.darkSubtext]}>
                Type de compte
              </Text>
              <Text style={[styles.infoValue, isDark && styles.darkText]}>
                {account.type === 'cash' ? 'Espèces' : 
                 account.type === 'bank' ? 'Compte bancaire' : 
                 account.type === 'card' ? 'Carte' : 'Compte épargne'}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, isDark && styles.darkSubtext]}>
                Date de création
              </Text>
              <Text style={[styles.infoValue, isDark && styles.darkText]}>
                {new Date(account.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, isDark && styles.darkSubtext]}>
                Nombre de transactions
              </Text>
              <Text style={[styles.infoValue, isDark && styles.darkText]}>
                {accountTransactions.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Zone de danger */}
        <View style={[styles.dangerCard, isDark && styles.darkCard]}>
          <Text style={[styles.dangerTitle, isDark && styles.darkText]}>
            Zone de danger
          </Text>
          <Text style={[styles.dangerText, isDark && styles.darkSubtext]}>
            La suppression est irréversible et supprimera toutes les données associées à ce compte.
          </Text>
          <TouchableOpacity 
            style={[styles.deleteButton, isProcessing && styles.disabledButton]}
            onPress={handleDeleteAccount}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <Text style={styles.deleteButtonText}>Supprimer le compte</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Formulaire de modification */}
      <AccountForm
        visible={showAccountForm}
        onClose={() => {
          console.log('📝 [AccountDetailScreen] Fermeture formulaire');
          setShowAccountForm(false);
        }}
        onSubmit={handleUpdateAccount}
        editingAccount={account}
      />
    </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  darkHeader: {
    backgroundColor: '#2c2c2e',
    borderBottomColor: '#38383a',
  },
  backButton: {
    padding: 4,
  },
  editButton: {
    padding: 4,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mainCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkCard: {
    backgroundColor: '#2c2c2e',
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 14,
    color: '#666',
  },
  balance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  actionsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    padding: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    marginTop: 8,
    textAlign: 'center',
  },
  transactionsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  specialTransactionsInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  darkStatsContainer: {
    backgroundColor: '#38383a',
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  // ✅ NOUVEAUX STYLES POUR LECTURE SEULE
  specialInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  darkSpecialInfoCard: {
    backgroundColor: '#1a237e',
  },
  specialInfoText: {
    fontSize: 12,
    color: '#1565C0',
    flex: 1,
    fontStyle: 'italic',
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  readOnlyTransaction: {
    backgroundColor: '#f5f5f5',
    opacity: 0.8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionDetails: {
    marginLeft: 12,
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#666',
  },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  readOnlyBadgeText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 11,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  readOnlyAmount: {
    opacity: 0.7,
  },
  emptyContainer: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    marginBottom: 20,
  },
  addTransactionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addTransactionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  moreTransactions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 8,
  },
  moreTransactionsText: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoList: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  dangerCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
  },
  dangerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FF3B3010',
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    gap: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default AccountDetailScreen;