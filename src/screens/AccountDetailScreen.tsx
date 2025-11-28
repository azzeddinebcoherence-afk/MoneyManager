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
import { useLanguage } from '../context/LanguageContext';
import { useDesignSystem, useTheme } from '../context/ThemeContext';
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
  isReadOnly, // ✅ NOUVEAU PROP POUR LECTURE SEULE
  colors
}: { 
  transaction: Transaction;
  isDark: boolean;
  navigation: AccountDetailScreenNavigationProp;
  formatAmount: (amount: number) => string;
  isProcessing: boolean;
  getCategoryName: (categoryId: string) => string;
  isReadOnly: boolean; // ✅ INDICATION SI LECTURE SEULE
  colors: any;
}) => {
  const isSpecialTransaction = READONLY_CATEGORIES.includes(transaction.category);
  
  return (
    <TouchableOpacity
      style={[
        styles.transactionItem, 
        { backgroundColor: colors.background.card },
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
          color={transaction.type === 'income' ? colors.semantic.success : colors.semantic.error} 
        />
        <View style={styles.transactionDetails}>
          <Text style={[styles.transactionDescription, { color: colors.text.primary }]}>
            {transaction.description || 'Sans description'}
          </Text>
          <View style={styles.categoryContainer}>
            <Text style={[styles.transactionCategory, { color: colors.text.secondary }]}>
              {getCategoryName(transaction.category)}
            </Text>
            {isReadOnly && ( // ✅ BADGE "AUTOMATIQUE" POUR LES TRANSACTIONS SPÉCIALES
              <View style={styles.readOnlyBadge}>
              </View>
            )}
          </View>
          <Text style={[styles.transactionDate, { color: colors.text.secondary }]}>
            {new Date(transaction.date).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: transaction.type === 'income' ? colors.semantic.success : colors.semantic.error },
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
  getCategoryName,
  colors
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
  colors: any;
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
      <View style={[styles.emptyContainer, { backgroundColor: colors.background.card }]}>
        <Ionicons name="receipt-outline" size={48} color={colors.text.disabled} />
        <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
          Aucune transaction
        </Text>
        <TouchableOpacity 
          style={[styles.addTransactionButton, { backgroundColor: colors.primary[500] }, isProcessing && styles.disabledButton]}
          onPress={() => {
            console.log('🎯 Navigation vers ajout transaction depuis compte:', accountId);
            navigation.navigate('AddTransaction', { 
              accountId: account?.id,
              initialType: 'expense'
            });
          }}
          disabled={isProcessing}
        >
          <Text style={[styles.addTransactionButtonText, { color: colors.text.inverse }]}>
            Ajouter une transaction
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.transactionsCard, { backgroundColor: colors.background.card }]}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Transactions ({editableTransactions.length})
          </Text>
          {specialTransactionsCount > 0 && (
            <Text style={[styles.specialTransactionsInfo, { color: colors.text.secondary }]}>
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
          <Text style={[styles.seeAllText, { color: colors.text.secondary }]}>
            Voir tout
          </Text>
        </TouchableOpacity>
      </View>

      {/* Statistiques rapides */}
      <View style={[styles.statsContainer, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.statItem}>
          <Ionicons name="arrow-down" size={16} color={colors.semantic.success} />
          <Text style={[styles.statText, { color: colors.text.primary }]}>
            {formatAmount(transactionStats.totalIncome)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="arrow-up" size={16} color={colors.semantic.error} />
          <Text style={[styles.statText, { color: colors.text.primary }]}>
            {formatAmount(transactionStats.totalExpenses)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="list" size={16} color={colors.primary[500]} />
          <Text style={[styles.statText, { color: colors.text.primary }]}>
            {accountTransactions.length}
          </Text>
        </View>
      </View>

      {/* Information sur les transactions automatiques */}
      {specialTransactionsCount > 0 && (
        <View style={[styles.specialInfoCard, { backgroundColor: colors.primary[100] }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary[500]} />
          <Text style={[styles.specialInfoText, { color: colors.text.primary }]}>
            Les transactions de dettes, épargne et charges annuelles sont en lecture seule
          </Text>
        </View>
      )}

      {/* Liste des transactions */}
      <View style={styles.transactionsList}>
        {accountTransactions
          // ✅ DÉDUPLICATION EXPLICITE au niveau du rendu
          .filter((transaction, index, self) => 
            self.findIndex(t => t.id === transaction.id) === index
          )
          .slice(0, 15)
          .map((transaction) => (
          <TransactionItem 
            key={transaction.id} 
            transaction={transaction}
            isDark={isDark}
            navigation={navigation}
            formatAmount={formatAmount}
            isProcessing={isProcessing}
            getCategoryName={getCategoryName}
            isReadOnly={READONLY_CATEGORIES.includes(transaction.category)} // ✅ PASSER L'INFO LECTURE SEULE
            colors={colors}
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
            <Text style={[styles.moreTransactionsText, { color: colors.text.secondary }]}>
              Voir les {accountTransactions.length - 15} transactions restantes
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const AccountDetailScreen = () => {
  const navigation = useNavigation<AccountDetailScreenNavigationProp>();
  const route = useRoute<AccountDetailScreenRouteProp>();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { colors } = useDesignSystem();
  const { formatAmount } = useCurrency();
  const { accounts, updateAccount, deleteAccount, refreshAccounts, loading: accountsLoading } = useAccounts();
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
    
    const filtered = transactions.filter(
      transaction => transaction.accountId === accountId
    );
    
    // 🔍 DIAGNOSTIC : Vérifier les doublons
    const uniqueIds = new Set(filtered.map(t => t.id));
    if (uniqueIds.size !== filtered.length) {
      console.warn('🚨 DOUBLONS DÉTECTÉS dans accountTransactions:', {
        totalTransactions: filtered.length,
        uniqueIds: uniqueIds.size,
        accountId
      });
      
      // Log des transactions dupliquées
      const ids = filtered.map(t => t.id);
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      console.log('🔍 IDs dupliqués:', duplicates);
    } else {
      console.log('✅ Aucun doublon dans accountTransactions:', {
        count: filtered.length,
        accountId
      });
    }
    
    return filtered;
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
        Alert.alert(t.success, 'Compte modifié avec succès');
      }, 300);
      
    } catch (error) {
      console.error('❌ [AccountDetailScreen] Erreur modification:', error);
      Alert.alert(t.error, 'Impossible de modifier le compte');
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
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
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
              Alert.alert(t.error, error.message || 'Impossible de supprimer le compte');
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

  // ✅ AFFICHER UN LOADER PENDANT LE CHARGEMENT INITIAL
  if (accountsLoading && !account) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Chargement du compte...
        </Text>
      </View>
    );
  }

  if (!account) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }, styles.center]}>
        <Ionicons name="alert-circle" size={64} color={colors.semantic.error} />
        <Text style={[styles.errorText, { color: colors.text.primary }]}>
          Compte non trouvé
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.primary[500] }]}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isProcessing}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Détails du compte
        </Text>
        <TouchableOpacity 
          style={[styles.editButton, isProcessing && styles.disabledButton]}
          onPress={() => setShowAccountForm(true)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.primary[500]} />
          ) : (
            <Ionicons name="create-outline" size={24} color={colors.text.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Carte principale */}
        <View style={[styles.mainCard, { backgroundColor: colors.background.card }]}>
          <View style={styles.accountHeader}>
            <View style={[styles.colorIndicator, { backgroundColor: account.color }]} />
            <View style={styles.accountInfo}>
              <Text style={[styles.accountName, { color: colors.text.primary }]}>
                {account.name}
              </Text>
              <Text style={[styles.accountType, { color: colors.text.secondary }]}>
                {account.type === 'cash' ? 'Espèces' : 
                 account.type === 'bank' ? 'Banque' : 
                 account.type === 'card' ? 'Carte' : 'Épargne'}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.balance, { color: colors.text.primary }]}>
            {formatAmount(account.balance)}
          </Text>
        </View>

        {/* Actions rapides */}
        <View style={[styles.actionsCard, { backgroundColor: colors.background.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Actions
          </Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, isProcessing && styles.disabledButton]}
              onPress={() => handleAddTransaction('expense')}
              disabled={isProcessing}
            >
              <Ionicons name="arrow-up" size={24} color={colors.semantic.error} />
              <Text style={[styles.actionText, { color: colors.text.primary }]}>
                Dépense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, isProcessing && styles.disabledButton]}
              onPress={() => handleAddTransaction('income')}
              disabled={isProcessing}
            >
              <Ionicons name="arrow-down" size={24} color={colors.semantic.success} />
              <Text style={[styles.actionText, { color: colors.text.primary }]}>
                Revenu
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, isProcessing && styles.disabledButton]}
              onPress={handleTransfer}
              disabled={isProcessing}
            >
              <Ionicons name="swap-horizontal" size={24} color={colors.primary[500]} />
              <Text style={[styles.actionText, { color: colors.text.primary }]}>
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
          colors={colors}
        />

        {/* Informations détaillées */}
        <View style={[styles.infoCard, { backgroundColor: colors.background.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Informations
          </Text>
          
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
                Type de compte
              </Text>
              <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                {account.type === 'cash' ? 'Espèces' : 
                 account.type === 'bank' ? 'Compte bancaire' : 
                 account.type === 'card' ? 'Carte' : 'Compte épargne'}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
                Date de création
              </Text>
              <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                {new Date(account.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
                Nombre de transactions
              </Text>
              <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                {accountTransactions.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Zone de danger */}
        <View style={[styles.dangerCard, { backgroundColor: colors.background.card }]}>
          <Text style={[styles.dangerTitle, { color: colors.semantic.error }]}>
            Zone de danger
          </Text>
          <Text style={[styles.dangerText, { color: colors.text.secondary }]}>
            La suppression est irréversible et supprimera toutes les données associées à ce compte.
          </Text>
          <TouchableOpacity 
            style={[styles.deleteButton, isProcessing && styles.disabledButton]}
            onPress={handleDeleteAccount}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.semantic.error} />
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
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
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
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mainCard: {
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
    marginBottom: 4,
  },
  accountType: {
    fontSize: 14,
  },
  balance: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actionsCard: {
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
    marginTop: 8,
    textAlign: 'center',
  },
  transactionsCard: {
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
    marginTop: 4,
    fontStyle: 'italic',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // ✅ NOUVEAUX STYLES POUR LECTURE SEULE
  specialInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  specialInfoText: {
    fontSize: 12,
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
    borderRadius: 12,
  },
  readOnlyTransaction: {
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
  },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  readOnlyBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 11,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  readOnlyAmount: {
    opacity: 0.7,
  },
  emptyContainer: {
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
    marginTop: 12,
    marginBottom: 20,
  },
  addTransactionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addTransactionButtonText: {
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
    marginRight: 4,
  },
  infoCard: {
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
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  dangerCard: {
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
    marginBottom: 8,
  },
  dangerText: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    gap: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default AccountDetailScreen;