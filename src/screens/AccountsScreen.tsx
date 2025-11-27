// src/screens/AccountsScreen.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AccountForm from '../components/account/AccountForm';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { useDesignSystem, useTheme } from '../context/ThemeContext';
import { useAccounts } from '../hooks/useAccounts';
import { Account } from '../types';

const AccountsScreen = ({ navigation }: any) => {
  const { formatAmount } = useCurrency();
  const { t } = useLanguage();
  const { colors } = useDesignSystem();
  const { theme } = useTheme();
  const { 
    accounts, 
    loading, 
    totalBalance, 
    createAccount,
    updateAccount, 
    deleteAccount,
    refreshAccounts // ✅ AJOUT DU RAFRAÎCHISSEMENT
  } = useAccounts();
  
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const isDark = theme === 'dark';

  // ✅ RAFRAÎCHISSEMENT AUTOMATIQUE AU FOCUS
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 [AccountsScreen] Rafraîchissement automatique');
      refreshAccounts();
    }, [refreshAccounts])
  );

  // ✅ RAFRAÎCHISSEMENT MANUEL
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log('🔄 [AccountsScreen] Rafraîchissement manuel');
    await refreshAccounts();
    setRefreshing(false);
  }, [refreshAccounts]);

  const handleCreateAccount = async (accountData: Omit<Account, 'id' | 'createdAt'>) => {
    try {
      await createAccount(accountData);
      setShowAccountForm(false);
      setEditingAccount(null);
      await refreshAccounts();
    } catch (error) {
      Alert.alert(t.error, 'Impossible de créer le compte');
    }
  };

  const handleUpdateAccount = async (accountData: Omit<Account, 'id' | 'createdAt'>) => {
    try {
      if (!editingAccount?.id) throw new Error('Identifiant manquant');
      
      console.log('🔄 [AccountsScreen] Modification du compte:', editingAccount.name);
      await updateAccount(editingAccount.id, accountData);
      
      setShowAccountForm(false);
      setEditingAccount(null);
      await refreshAccounts();
      
      Alert.alert(t.success, 'Compte modifié avec succès');
    } catch (error: any) {
      console.error('❌ [AccountsScreen] Erreur modification:', error);
      Alert.alert(t.error, error.message || 'Impossible de modifier le compte');
    }
  };

  const handleDeleteAccount = (account: Account) => {
    Alert.alert(
      'Supprimer le compte',
      `Êtes-vous sûr de vouloir supprimer le compte "${account.name}" ?\n\nCette action est irréversible.`,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ [AccountsScreen] Suppression du compte:', account.name);
              await deleteAccount(account.id);
              // ✅ RAFRAÎCHIR APRÈS SUPPRESSION
              await refreshAccounts();
              Alert.alert(t.success, 'Compte supprimé avec succès');
            } catch (error: any) {
              console.error('❌ [AccountsScreen] Erreur suppression:', error);
              Alert.alert(t.error, error.message || 'Impossible de supprimer le compte');
            }
          },
        },
      ]
    );
  };

  const handleEditAccount = (account: Account) => {
    console.log('✏️ [AccountsScreen] Modification du compte:', account.name);
    setEditingAccount(account);
    setShowAccountForm(true);
  };

  const renderAccountItem = ({ item }: { item: Account }) => (
    <TouchableOpacity 
      style={[styles.accountCard, { backgroundColor: colors.background.card }]}
      onPress={() => navigation.navigate('AccountDetail', { accountId: item.id })}
    >
      <View style={styles.accountMainInfo}>
        <View style={styles.accountHeader}>
          <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
          <View style={styles.accountTextContainer}>
            <Text style={[styles.accountName, { color: colors.text.primary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.accountType, { color: colors.text.secondary }]}>
              {item.type === 'cash' ? t.cash : 
               item.type === 'bank' ? t.bank : 
               item.type === 'card' ? t.card : t.savings}
            </Text>
          </View>
        </View>
        <Text style={[styles.accountBalance, { color: colors.text.primary }]}>
          {formatAmount(item.balance)}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.accountActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditAccount(item)}
        >
          <Ionicons name="create-outline" size={18} color={colors.primary[500]} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteAccount(item)}
        >
          <Ionicons name="trash-outline" size={18} color={colors.semantic.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  
  
  // New header matching design
  const Header = () => (
    <View style={[styles.topHeader, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}> 
      <View style={styles.topHeaderRow}>
        <TouchableOpacity style={styles.backWrap} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={[styles.pageTitle, { color: colors.text.primary }]}>{t.myAccounts}</Text>

        <TouchableOpacity style={styles.refreshIcon} onPress={onRefresh} disabled={refreshing}>
          <Ionicons name="refresh" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.background.card }]}> 
        <View style={styles.summaryTop}>
          <View>
            <Text style={[styles.summaryLabel, { color: colors.text.secondary }]}>{t.totalBalance?.toUpperCase()}</Text>
            <Text style={[styles.summaryAmount, { color: colors.text.primary }]}>{formatAmount(totalBalance)}</Text>
          </View>
          <View style={styles.summaryIcon}>
            <Ionicons name="library-outline" size={28} color={colors.primary[500]} />
          </View>
        </View>

        <View style={styles.summarySplit}>
          <View style={styles.splitItem}>
            <Text style={[styles.splitLabel, { color: colors.text.secondary }]}>{t.accounts}</Text>
            <Text style={[styles.splitValue, { color: colors.text.primary }]}>{formatAmount(accounts.filter(a => a.type !== 'savings').reduce((s, a) => s + a.balance, 0))}</Text>
          </View>
          <View style={styles.splitItem}>
            <Text style={[styles.splitLabel, { color: colors.text.secondary }]}>{t.savings}</Text>
            <Text style={[styles.splitValue, { color: colors.text.primary }]}>{formatAmount(accounts.filter(a => a.type === 'savings').reduce((s, a) => s + a.balance, 0))}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading && accounts.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }, styles.center]}>
        <Text style={[styles.loadingText, { color: colors.text.primary }]}>
          {t.loading}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={["top"]}>
      <Header />

      <View style={styles.content}>
        <View style={styles.listContainer}>
          <FlatList
            data={accounts}
            renderItem={renderAccountItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary[500]]}
                tintColor={colors.primary[500]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons 
                  name="wallet-outline" 
                  size={64} 
                  color={colors.text.disabled} 
                />
                <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                  Aucun compte créé
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.text.secondary }]}>
                  Ajoutez votre premier compte pour commencer
                </Text>
              </View>
            }
          />
        </View>

        <TouchableOpacity style={[styles.primaryCTA, { backgroundColor: colors.primary[500] }]} onPress={() => { setEditingAccount(null); setShowAccountForm(true); }}>
          <Text style={[styles.primaryCTAText, { color: colors.text.inverse }]}>Ajouter un compte</Text>
        </TouchableOpacity>

        <AccountForm
          visible={showAccountForm}
          onClose={() => {
            setShowAccountForm(false);
            setEditingAccount(null);
          }}
          onSubmit={editingAccount ? handleUpdateAccount : handleCreateAccount}
          editingAccount={editingAccount || undefined}
        />
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
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  accountCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountMainInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  accountTextContainer: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  accountType: {
    fontSize: 14,
  },
  accountActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    borderWidth: 1,
  },
  deleteButton: {
    borderWidth: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    fontSize: 16,
  },
  // New header / summary styles
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  refreshIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '700',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#f0f6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summarySplit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  splitItem: {
    flex: 1,
  },
  splitLabel: {
    fontSize: 12,
  },
  splitValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  // Layout helpers
  content: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    flex: 1,
  },
  separator: {
    height: 12,
  },
  primaryCTA: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryCTAText: {
    fontWeight: '700',
    fontSize: 16,
  },
  emptyWrap: {
    padding: 30,
    alignItems: 'center',
  },
});

export default AccountsScreen;