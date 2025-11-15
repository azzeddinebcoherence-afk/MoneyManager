// src/components/analytics/MonthCard.tsx - VERSION CORRIGÉE
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCurrency } from '../../context/CurrencyContext';
import { useTheme } from '../../context/ThemeContext';

export interface MonthCardProps {
  year: number;
  month: number;
  income: number;
  expenses: number;
  netFlow: number;
  transactionCount: number;
  onPress: (year: number, month: number) => void;
  isCurrentMonth?: boolean;
  highlightMetric?: 'income' | 'expenses' | 'netFlow';
  animationDelay?: number; // ✅ AJOUTÉ
}

const MonthCard: React.FC<MonthCardProps> = ({
  year,
  month,
  income,
  expenses,
  netFlow,
  transactionCount,
  onPress,
  isCurrentMonth = false,
  highlightMetric = 'netFlow',
  animationDelay = 0 // ✅ VALEUR PAR DÉFAUT
}) => {
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const isDark = theme === 'dark';

  // ✅ ANIMATIONS
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start();
    }, animationDelay);

    return () => clearTimeout(timer);
  }, [animationDelay]);

  const monthName = new Date(year, month).toLocaleDateString('fr-FR', { 
    month: 'long',
    year: 'numeric'
  });

  const getMonthStatus = () => {
    if (netFlow > 0) return { status: 'positif', color: '#10B981', icon: 'trending-up' as const };
    if (netFlow < 0) return { status: 'négatif', color: '#EF4444', icon: 'trending-down' as const };
    return { status: 'équilibré', color: '#6B7280', icon: 'remove' as const };
  };

  const status = getMonthStatus();

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }}
    >
      <TouchableOpacity
        style={[
          styles.container,
          isDark && styles.darkContainer,
          isCurrentMonth && styles.currentMonth
        ]}
        onPress={() => onPress(year, month)}
        activeOpacity={0.8}
      >
        {/* En-tête du mois */}
        <View style={styles.header}>
          <View style={styles.monthInfo}>
            <Text style={[styles.monthName, isDark && styles.darkText]}>
              {monthName}
            </Text>
            {isCurrentMonth && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Mois en cours</Text>
              </View>
            )}
          </View>
          
          <View style={[styles.statusIndicator, { backgroundColor: status.color }]}>
            <Ionicons 
              name={status.icon} 
              size={16} 
              color="#FFFFFF" 
            />
          </View>
        </View>

        {/* Statistiques principales */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <Ionicons name="arrow-down" size={16} color="#10B981" />
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                Revenus
              </Text>
            </View>
            <Text style={[styles.statValue, isDark && styles.darkText]}>
              {formatAmount(income)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <Ionicons name="arrow-up" size={16} color="#EF4444" />
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                Dépenses
              </Text>
            </View>
            <Text style={[styles.statValue, isDark && styles.darkText]}>
              {formatAmount(expenses)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <Ionicons 
                name={status.icon} 
                size={16} 
                color={status.color} 
              />
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                Solde
              </Text>
            </View>
            <Text style={[styles.statValue, { color: status.color }]}>
              {formatAmount(netFlow)}
            </Text>
          </View>
        </View>

        {/* Indicateur de performance */}
        <View style={styles.performanceIndicator}>
          <View style={styles.performanceBar}>
            <View 
              style={[
                styles.performanceFill,
                { 
                  width: `${Math.min((income > 0 ? (expenses / income) * 100 : 0), 100)}%`,
                  backgroundColor: expenses > income ? '#EF4444' : '#10B981'
                }
              ]} 
            />
          </View>
          <Text style={[styles.performanceText, isDark && styles.darkSubtext]}>
            {income > 0 ? `${((expenses / income) * 100).toFixed(1)}% des revenus` : 'Aucun revenu'}
          </Text>
        </View>

        {/* Pied de carte */}
        <View style={[styles.footer, isDark && styles.darkFooter]}>
          <View style={styles.transactionInfo}>
            <Ionicons 
              name="list" 
              size={14} 
              color={isDark ? '#888' : '#666'} 
            />
            <Text style={[styles.transactionText, isDark && styles.darkSubtext]}>
              {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
            </Text>
          </View>
          
          <View style={styles.actions}>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={isDark ? '#888' : '#666'} 
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  darkContainer: {
    backgroundColor: '#2C2C2E',
    borderColor: '#38383A',
  },
  currentMonth: {
    borderColor: '#007AFF',
    borderWidth: 2,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  monthInfo: {
    flex: 1,
  },
  monthName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  currentBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  performanceIndicator: {
    marginBottom: 16,
  },
  performanceBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  performanceFill: {
    height: '100%',
    borderRadius: 3,
  },
  performanceText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  darkFooter: {
    borderTopColor: '#38383A',
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  actions: {
    padding: 4,
  },
  darkText: {
    color: '#F3F4F6',
  },
  darkSubtext: {
    color: '#9CA3AF',
  },
});

export default MonthCard;