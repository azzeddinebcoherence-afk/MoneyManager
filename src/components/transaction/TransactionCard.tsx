// src/components/transaction/TransactionCard.tsx - VERSION CORRIGÉE
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCurrency } from '../../context/CurrencyContext';
import { useTheme } from '../../context/ThemeContext';
import { Transaction } from '../../types';

interface TransactionCardProps {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
  onLongPress?: (transaction: Transaction) => void;
  showRecurrenceBadge?: boolean;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onPress,
  onLongPress,
  showRecurrenceBadge = true,
}) => {
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const isDark = theme === 'dark';

  const isRecurring = transaction.isRecurring;
  const isRecurringInstance = Boolean(transaction.parentTransactionId);

  const getFrequencyLabel = (frequency?: string): string => {
    switch (frequency) {
      case 'daily': return 'Quotidienne';
      case 'weekly': return 'Hebdomadaire';
      case 'monthly': return 'Mensuelle';
      case 'yearly': return 'Annuelle';
      default: return '';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatNextOccurrence = (dateString?: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <TouchableOpacity 
      style={[
        styles.transactionCard,
        isDark && styles.darkCard
      ]}
      onPress={() => onPress(transaction)}
      onLongPress={() => onLongPress?.(transaction)}
      delayLongPress={500}
    >
      {/* Icône et informations principales */}
      <View style={styles.mainContent}>
        <View style={[
          styles.iconContainer,
          { 
            backgroundColor: transaction.type === 'income' 
              ? '#34C75920' 
              : '#FF3B3020' 
          }
        ]}>
          <Ionicons 
            name={transaction.type === 'income' ? 'arrow-down' : 'arrow-up'} 
            size={20} 
            color={transaction.type === 'income' ? '#34C759' : '#FF3B30'} 
          />
        </View>

        <View style={styles.transactionInfo}>
          <Text style={[
            styles.description,
            isDark && styles.darkText
          ]} numberOfLines={1}>
            {transaction.description}
          </Text>
          
          <View style={styles.detailsRow}>
            <Text style={[
              styles.category,
              isDark && styles.darkSubtext
            ]}>
              {transaction.category}
            </Text>
            
            <Text style={[
              styles.date,
              isDark && styles.darkSubtext
            ]}>
              {formatDate(transaction.date)}
            </Text>
          </View>

          {/* Badges pour les transactions récurrentes */}
          {(isRecurring || isRecurringInstance) && showRecurrenceBadge && (
            <View style={styles.badgesContainer}>
              {isRecurring && (
                <View style={[
                  styles.badge,
                  styles.recurringBadge
                ]}>
                  <Ionicons name="repeat" size={12} color="#007AFF" />
                  <Text style={styles.badgeText}>
                    {transaction.recurrenceType ? getFrequencyLabel(transaction.recurrenceType) : 'Récurrente'}
                  </Text>
                </View>
              )}
              
              {isRecurringInstance && (
                <View style={[
                  styles.badge,
                  styles.instanceBadge
                ]}>
                  <Ionicons name="calendar" size={12} color="#34C759" />
                  <Text style={styles.badgeText}>
                    Instance
                  </Text>
                </View>
              )}
              
              {isRecurring && transaction.nextOccurrence && (
                <View style={[
                  styles.badge,
                  styles.nextOccurrenceBadge
                ]}>
                  <Ionicons name="time" size={12} color="#FF9500" />
                  <Text style={styles.badgeText}>
                    Prochaine: {formatNextOccurrence(transaction.nextOccurrence)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Montant */}
      <View style={styles.amountContainer}>
        <Text style={[
          styles.amount,
          { 
            color: transaction.type === 'income' 
              ? '#34C759' 
              : '#FF3B30' 
          }
        ]}>
          {transaction.type === 'income' ? '+' : '-'}{formatAmount(Math.abs(transaction.amount))}
        </Text>
        
        {/* Statut pour les transactions récurrentes */}
        {isRecurring && (
          <Text style={[
            styles.recurrenceStatus,
            isDark && styles.darkSubtext
          ]}>
            {transaction.isActive !== false ? 'Active' : 'Inactive'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  darkCard: {
    backgroundColor: '#2c2c2e',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  recurringBadge: {
    backgroundColor: '#007AFF15',
    borderWidth: 1,
    borderColor: '#007AFF30',
  },
  instanceBadge: {
    backgroundColor: '#34C75915',
    borderWidth: 1,
    borderColor: '#34C75930',
  },
  nextOccurrenceBadge: {
    backgroundColor: '#FF950015',
    borderWidth: 1,
    borderColor: '#FF950030',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recurrenceStatus: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default TransactionCard;