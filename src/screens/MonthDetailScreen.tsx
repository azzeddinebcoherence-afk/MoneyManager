// src/screens/MonthDetailScreen.tsx - VERSION CORRIGÉE
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from '../components/SafeAreaView';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { useMonthlyData } from '../hooks/useMonthlyData';

type RootStackParamList = {
  MonthDetail: { year: number; month: number };
  MonthsOverview: undefined;
};

type MonthDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MonthDetail'>;
type MonthDetailScreenRouteProp = RouteProp<RootStackParamList, 'MonthDetail'>;

const { width } = Dimensions.get('window');

const MonthDetailScreen: React.FC = () => {
  const navigation = useNavigation<MonthDetailScreenNavigationProp>();
  const route = useRoute<MonthDetailScreenRouteProp>();
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { getMonthlyData } = useMonthlyData();
  const { year, month } = route.params;
  const isDark = theme === 'dark';

  const monthData = useMemo(() => {
    return getMonthlyData(year, month);
  }, [getMonthlyData, year, month]);

  // ✅ CORRECTION : Le paramètre month est déjà au format 0-11, pas besoin de -1
  const monthName = new Date(year, month).toLocaleDateString('fr-FR', { 
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const getSavingsStatus = (savingsRate: number) => {
    if (savingsRate >= 20) return { status: 'EXCELLENT', color: '#10B981', emoji: '🎯', gradient: ['#10B981', '#059669'] };
    if (savingsRate >= 10) return { status: 'BON', color: '#22C55E', emoji: '📈', gradient: ['#22C55E', '#16A34A'] };
    if (savingsRate >= 0) return { status: 'CORRECT', color: '#F59E0B', emoji: '⚡', gradient: ['#F59E0B', '#D97706'] };
    return { status: 'À AMÉLIORER', color: '#EF4444', emoji: '🎯', gradient: ['#EF4444', '#DC2626'] };
  };

  const savingsStatus = getSavingsStatus(monthData.savingsRate);

  // Header moderne avec gradient
  const ModernHeader = () => (
    <LinearGradient
      colors={isDark ? ['#1E293B', '#0F172A'] : ['#007AFF', '#0056CC']}
      style={styles.headerGradient}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.monthName}>{monthName}</Text>
          <Text style={styles.monthSubtitle}>ANALYSE DÉTAILLÉE</Text>
        </View>
        <View style={styles.headerRight} />
      </View>
    </LinearGradient>
  );

  // Carte de résumé principal avec design premium
  const FinancialSummaryCard = () => (
    <Animated.View 
      style={[
        styles.summaryCard,
        isDark && styles.darkCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={isDark ? ['#334155', '#1E293B'] : ['#FFFFFF', '#F8FAFC']}
        style={styles.summaryGradient}
      >
        <View style={styles.summaryHeader}>
          <Text style={[styles.cardTitle, isDark && styles.darkText]}>
            📊 RÉSUMÉ FINANCIER
          </Text>
          <View style={[styles.savingsBadge, { backgroundColor: savingsStatus.color + '20' }]}>
            <Text style={[styles.savingsBadgeText, { color: savingsStatus.color }]}>
              {savingsStatus.emoji} {savingsStatus.status}
            </Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <LinearGradient
              colors={['#10B98120', '#10B98110']}
              style={styles.summaryIcon}
            >
              <Text style={styles.summaryEmoji}>💰</Text>
            </LinearGradient>
            <Text style={styles.incomeValue}>
              {formatAmount(monthData.income)}
            </Text>
            <Text style={[styles.summaryLabel, isDark && styles.darkSubtext]}>
              REVENUS
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <LinearGradient
              colors={['#EF444420', '#EF444410']}
              style={styles.summaryIcon}
            >
              <Text style={styles.summaryEmoji}>💸</Text>
            </LinearGradient>
            <Text style={styles.expenseValue}>
              {formatAmount(monthData.expenses)}
            </Text>
            <Text style={[styles.summaryLabel, isDark && styles.darkSubtext]}>
              DÉPENSES
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <LinearGradient
              colors={monthData.netFlow >= 0 ? ['#10B98120', '#10B98110'] : ['#EF444420', '#EF444410']}
              style={styles.summaryIcon}
            >
              <Text style={styles.summaryEmoji}>
                {monthData.netFlow >= 0 ? '📈' : '📉'}
              </Text>
            </LinearGradient>
            <Text style={[
              styles.netFlowValue,
              { color: monthData.netFlow >= 0 ? '#10B981' : '#EF4444' }
            ]}>
              {formatAmount(monthData.netFlow)}
            </Text>
            <Text style={[styles.summaryLabel, isDark && styles.darkSubtext]}>
              SOLDE
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <LinearGradient
              colors={[savingsStatus.color + '20', savingsStatus.color + '10']}
              style={styles.summaryIcon}
            >
              <Text style={styles.summaryEmoji}>🎯</Text>
            </LinearGradient>
            <Text style={[
              styles.savingsRateValue,
              { color: savingsStatus.color }
            ]}>
              {monthData.savingsRate.toFixed(1)}%
            </Text>
            <Text style={[styles.summaryLabel, isDark && styles.darkSubtext]}>
              ÉPARGNE
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  // Graphique circulaire moderne
  const ExpenseChartCard = () => {
    if (monthData.categoryBreakdown.length === 0) {
      return (
        <Animated.View 
          style={[
            styles.chartCard,
            isDark && styles.darkCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={isDark ? ['#334155', '#1E293B'] : ['#FFFFFF', '#F8FAFC']}
            style={styles.chartGradient}
          >
            <Text style={[styles.cardTitle, isDark && styles.darkText]}>
              📈 RÉPARTITION DES DÉPENSES
            </Text>
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartEmoji}>📊</Text>
              <Text style={[styles.emptyChartText, isDark && styles.darkSubtext]}>
                Aucune dépense ce mois-ci
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      );
    }

    const chartData = monthData.categoryBreakdown.slice(0, 6).map((item, index) => ({
      name: item.category.length > 8 ? `${item.category.substring(0, 8)}...` : item.category,
      value: item.amount,
      color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][index],
      legendFontColor: isDark ? '#94A3B8' : '#64748B',
      legendFontSize: 10
    }));

    return (
      <Animated.View 
        style={[
          styles.chartCard,
          isDark && styles.darkCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={isDark ? ['#334155', '#1E293B'] : ['#FFFFFF', '#F8FAFC']}
          style={styles.chartGradient}
        >
          <Text style={[styles.cardTitle, isDark && styles.darkText]}>
            📈 RÉPARTITION DES DÉPENSES
          </Text>
          
          <PieChart
            data={chartData}
            width={width - 80}
            height={180}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: 'transparent',
              backgroundGradientTo: 'transparent',
              decimalPlaces: 0,
              color: () => isDark ? '#F1F5F9' : '#1E293B',
              labelColor: () => isDark ? '#94A3B8' : '#64748B',
            }}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
            style={styles.chart}
          />
        </LinearGradient>
      </Animated.View>
    );
  };

  // Statistiques avec design moderne
  const StatisticsCard = () => (
    <Animated.View 
      style={[
        styles.statsCard,
        isDark && styles.darkCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={isDark ? ['#334155', '#1E293B'] : ['#FFFFFF', '#F8FAFC']}
        style={styles.statsGradient}
      >
        <Text style={[styles.cardTitle, isDark && styles.darkText]}>
          📊 STATISTIQUES DÉTAILLÉES
        </Text>
        
        <View style={styles.statsList}>
          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                Nombre de transactions
              </Text>
              <Text style={[styles.statSubLabel, isDark && styles.darkSubtext]}>
                Total des opérations
              </Text>
            </View>
            <View style={[styles.statValueContainer, { backgroundColor: '#007AFF20' }]}>
              <Text style={[styles.statValue, isDark && styles.darkText]}>
                {monthData.transactionCount}
              </Text>
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                Dépense moyenne
              </Text>
              <Text style={[styles.statSubLabel, isDark && styles.darkSubtext]}>
                Par transaction
              </Text>
            </View>
            <View style={[styles.statValueContainer, { backgroundColor: '#EF444420' }]}>
              <Text style={[styles.statValue, isDark && styles.darkText]}>
                {monthData.transactionCount > 0 ? formatAmount(monthData.expenses / monthData.transactionCount) : formatAmount(0)}
              </Text>
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                Revenu moyen
              </Text>
              <Text style={[styles.statSubLabel, isDark && styles.darkSubtext]}>
                Par transaction
              </Text>
            </View>
            <View style={[styles.statValueContainer, { backgroundColor: '#10B98120' }]}>
              <Text style={[styles.statValue, isDark && styles.darkText]}>
                {monthData.transactionCount > 0 ? formatAmount(monthData.income / monthData.transactionCount) : formatAmount(0)}
              </Text>
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                Taux d'épargne
              </Text>
              <Text style={[styles.statSubLabel, isDark && styles.darkSubtext]}>
                Performance financière
              </Text>
            </View>
            <View style={[styles.statValueContainer, { backgroundColor: savingsStatus.color + '20' }]}>
              <Text style={[styles.statValue, { color: savingsStatus.color }]}>
                {monthData.savingsRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  // Top catégories avec design moderne
  const TopCategoriesCard = () => {
    if (monthData.categoryBreakdown.length === 0) {
      return null;
    }

    return (
      <Animated.View 
        style={[
          styles.categoriesCard,
          isDark && styles.darkCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={isDark ? ['#334155', '#1E293B'] : ['#FFFFFF', '#F8FAFC']}
          style={styles.categoriesGradient}
        >
          <Text style={[styles.cardTitle, isDark && styles.darkText]}>
            🏆 TOP CATÉGORIES
          </Text>
          
          {monthData.categoryBreakdown.slice(0, 5).map((category, index) => (
            <View key={category.category} style={styles.categoryItem}>
              <View style={styles.categoryLeft}>
                <View style={[
                  styles.categoryRank,
                  { backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][index] }
                ]}>
                  <Text style={styles.categoryRankText}>#{index + 1}</Text>
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, isDark && styles.darkText]}>
                    {category.category}
                  </Text>
                  <View style={styles.categoryProgress}>
                    <View 
                      style={[
                        styles.categoryProgressBar,
                        { 
                          width: `${category.percentage}%`,
                          backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][index]
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
              <View style={styles.categoryRight}>
                <Text style={[styles.categoryAmount, isDark && styles.darkText]}>
                  {formatAmount(category.amount)}
                </Text>
                <Text style={[styles.categoryPercentage, isDark && styles.darkSubtext]}>
                  {category.percentage.toFixed(1)}%
                </Text>
              </View>
            </View>
          ))}
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView>
      <View style={[styles.container, isDark && styles.darkContainer]}>
        <ModernHeader />
        
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <FinancialSummaryCard />
          <ExpenseChartCard />
          <StatisticsCard />
          <TopCategoriesCard />
          
          <View style={styles.spacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  darkContainer: {
    backgroundColor: '#0F172A',
  },
  headerGradient: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  monthName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  monthSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    letterSpacing: 1,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  // Cartes avec gradients et ombres
  summaryCard: {
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  chartCard: {
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  statsCard: {
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  categoriesCard: {
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  darkCard: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  // Gradients pour les cartes
  summaryGradient: {
    padding: 25,
  },
  chartGradient: {
    padding: 25,
    alignItems: 'center',
  },
  statsGradient: {
    padding: 25,
  },
  categoriesGradient: {
    padding: 25,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  savingsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  savingsBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  summaryItem: {
    width: '47%',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryEmoji: {
    fontSize: 20,
  },
  incomeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  expenseValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 4,
  },
  netFlowValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  savingsRateValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Graphique
  emptyChart: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyChartText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  chart: {
    marginVertical: 8,
  },
  // Statistiques
  statsList: {
    gap: 0,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statLeft: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  statSubLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  statValueContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: -10,
  },
  // Catégories
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryRankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  categoryProgress: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  spacer: {
    height: 20,
  },
  darkText: {
    color: '#F1F5F9',
  },
  darkSubtext: {
    color: '#94A3B8',
  },
});

export default MonthDetailScreen;