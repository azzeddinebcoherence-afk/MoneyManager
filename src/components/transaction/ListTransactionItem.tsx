// src/components/transaction/ListTransactionItem.tsx
// Composant de transaction unifié pour toutes les pages

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCurrency } from '../../context/CurrencyContext';
import { useDesignSystem } from '../../context/ThemeContext';
import useCategories from '../../hooks/useCategories';
import resolveCategoryLabel from '../../utils/categoryResolver';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category?: string;
  subCategory?: string;
  date: string;
  createdAt?: string;
}

interface ListTransactionItemProps {
  item: Transaction;
  onPress?: (id: string) => void;
  disablePress?: boolean; // ✅ Nouveau prop pour désactiver le clic
}

// ✅ Catégories qui rendent la transaction non-cliquable (automatiques)
const READONLY_CATEGORIES = [
  'dette',
  'épargne',
  'remboursement épargne',
  'charge_annuelle',
  'transfert'
];

export const ListTransactionItem: React.FC<ListTransactionItemProps> = ({ item, onPress, disablePress = false }) => {
  const { colors } = useDesignSystem();
  const { formatAmount } = useCurrency();
  const { categories } = useCategories();
  
  const isIncome = item.type === 'income';
  const isTransfer = item.type === 'transfer';
  const resolved = resolveCategoryLabel(item.subCategory || item.category, categories || []);
  const label = resolved.child;
  
  // ✅ Vérifier si la transaction est en lecture seule
  const isReadOnly = disablePress || READONLY_CATEGORIES.some(cat => 
    item.category?.toLowerCase().includes(cat.toLowerCase())
  );
  
  // Formater le montant (sans décimales maintenant géré dans formatAmount)
  const formattedAmount = formatAmount(Math.abs(item.amount));

  return (
    <TouchableOpacity 
      style={[
        styles.transactionCard, 
        { backgroundColor: colors.background.card },
        isReadOnly && styles.readOnlyTransaction // ✅ Style spécial si lecture seule
      ]} 
      onPress={() => !isReadOnly && onPress?.(item.id)} 
      activeOpacity={isReadOnly ? 1 : 0.7} // ✅ Pas de feedback si lecture seule
      disabled={isReadOnly} // ✅ Désactiver complètement si lecture seule
    >
      <View style={styles.transactionMain}>
        <View style={[
          styles.iconContainer, 
          { 
            backgroundColor: colors.background.primary, 
            borderColor: colors.border.primary 
          }
        ]}>
          <Ionicons 
            name={isTransfer ? 'swap-horizontal' : (isIncome ? 'arrow-down' : 'arrow-up')} 
            size={20} 
            color={isTransfer ? colors.primary[500] : (isIncome ? colors.semantic.success : colors.semantic.error)} 
          />
        </View>

        <View style={styles.transactionInfo}>
          <Text 
            style={[styles.transactionDescription, { color: colors.text.primary }]} 
            numberOfLines={2}
          >
            {item.description || 'Sans description'}
          </Text>
          <View style={styles.transactionBottom}>
            <View style={styles.transactionMeta}>
              <Text style={[styles.transactionCategory, { color: colors.text.secondary }]}>
                {label}
              </Text>
              <Text style={[styles.transactionDate, { color: colors.text.secondary }]}>
                {new Date(item.date).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <Text 
              style={[
                styles.transactionAmount, 
                { color: isTransfer ? colors.primary[500] : (isIncome ? colors.semantic.success : colors.semantic.error) }
              ]}
            >
              {isTransfer ? '' : (isIncome ? '+' : '-')}{formattedAmount}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  transactionCard: {
    borderRadius: 16,
    marginHorizontal: 0,
    marginVertical: 6,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  readOnlyTransaction: {
    opacity: 0.7, // ✅ Réduire l'opacité pour indiquer lecture seule
  },
  transactionMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  transactionBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionMeta: {
    flexDirection: 'column',
    gap: 2,
  },
  transactionCategory: {
    fontSize: 11,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ListTransactionItem;
