// src/screens/DashboardScreen.tsx - VERSION OPTIMISÉE AVEC DESIGN SYSTEM

// Interface pour les données de patrimoine
interface NetWorthData {
  netWorth: number | {
    netWorth: number;
    totalAssets?: number;
    totalLiabilities?: number;
    history?: Array<{ netWorth: number; date: string }>;
  };
  evolution?: number;
  trend?: 'up' | 'down' | 'stable';
}
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import DonutChart from '../components/charts/DonutChart';
import { SafeAreaView } from '../components/SafeAreaView';
import ListTransactionItem from '../components/transaction/ListTransactionItem';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { useRefresh } from '../context/RefreshContext';
import { useDesignSystem } from '../context/ThemeContext';
import { useAccounts } from '../hooks/useAccounts';
import { useAnalytics } from '../hooks/useAnalytics';
import useAnnualCharges from '../hooks/useAnnualCharges';
import { useBudgets } from '../hooks/useBudgets';
import useCategories from '../hooks/useCategories';
import { useDebts } from '../hooks/useDebts';
import { useSavings } from '../hooks/useSavings';
import { useSmartAlerts } from '../hooks/useSmartAlerts';
import { useSync } from '../hooks/useSync';
import { useTransactions } from '../hooks/useTransactions';
import { calculationService } from '../services/calculationService';

const { width } = Dimensions.get('window');
const HEADER_BG = require('../../assets/images/interfaces/Dashboard.png');

// ✅ COMPOSANT : GRAPHIQUE FINANCIER MODERNE
interface FinancialChartProps {
  income: number;
  expenses: number;
  balance: number;
  formatAmount: (amount: number) => string;
}

const FinancialChart: React.FC<FinancialChartProps> = ({ 
  income, 
  expenses, 
  balance, 
  formatAmount 
}) => {
  const { colors, spacing } = useDesignSystem();
  const { t } = useLanguage();
  
  const total = income + expenses + Math.abs(balance);
  
  if (total === 0) {
    return (
      <View style={[styles.chartEmpty, { backgroundColor: colors.background.secondary }]}>
        <Ionicons name="bar-chart-outline" size={32} color={colors.text.tertiary} />
        <Text style={[styles.chartEmptyText, { color: colors.text.tertiary }]}>
          {t.noDataThisMonth}
        </Text>
      </View>
    );
  }

  const incomePercentage = (income / total) * 100;
  const expensesPercentage = (expenses / total) * 100;
  const balancePercentage = (Math.abs(balance) / total) * 100;

  return (
    <View style={styles.chartContainer}>
      {/* Barre de progression horizontale */}
      <View style={[styles.chartBar, { backgroundColor: colors.background.tertiary }]}>
        {incomePercentage > 0 && (
          <View
            style={[
              styles.chartSegment,
              { 
                width: `${incomePercentage}%`,
                backgroundColor: colors.functional.income,
              }
            ]}
          />
        )}
        {expensesPercentage > 0 && (
          <View
            style={[
              styles.chartSegment,
              { 
                width: `${expensesPercentage}%`,
                backgroundColor: colors.functional.expense,
                marginLeft: incomePercentage > 0 ? 2 : 0,
              }
            ]}
          />
        )}
        {balancePercentage > 0 && (
          <View
            style={[
              styles.chartSegment,
              { 
                width: `${balancePercentage}%`,
                backgroundColor: balance >= 0 ? colors.functional.savings : colors.functional.debt,
                marginLeft: (incomePercentage > 0 || expensesPercentage > 0) ? 2 : 0,
              }
            ]}
          />
        )}
      </View>
      
      {/* Légende détaillée */}
      <View style={styles.chartLegend}>
        <ChartLegendItem 
          color={colors.functional.income}
          label={t.revenue}
          amount={income}
          formatAmount={formatAmount}
        />
        <ChartLegendItem 
          color={colors.functional.expense}
          label={t.expenses}
          amount={expenses}
          formatAmount={formatAmount}
        />
        <ChartLegendItem 
          color={balance >= 0 ? colors.functional.savings : colors.functional.debt}
          label={balance >= 0 ? t.savings : t.deficit}
          amount={Math.abs(balance)}
          formatAmount={formatAmount}
        />
      </View>
    </View>
  );
};

// ✅ COMPOSANT : ÉLÉMENT DE LÉGENDE
interface ChartLegendItemProps {
  color: string;
  label: string;
  amount: number;
  formatAmount: (amount: number) => string;
}

const ChartLegendItem: React.FC<ChartLegendItemProps> = ({ 
  color, 
  label, 
  amount, 
  formatAmount 
}) => {
  const { colors } = useDesignSystem();
  
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendColor, { backgroundColor: color }]} />
      <View style={styles.legendTextContainer}>
        <Text style={[styles.legendLabel, { color: colors.text.secondary }]}>
          {label}
        </Text>
        <Text style={[styles.legendAmount, { color: colors.text.primary }]}>
          {formatAmount(amount)}
        </Text>
      </View>
    </View>
  );
};

// ✅ COMPOSANT : CARTE DE SANTÉ FINANCIÈRE
interface FinancialHealthCardProps {
  score: number;
  onPress: () => void;
}

const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({ score, onPress }) => {
  const { colors, spacing } = useDesignSystem();
  
  const getHealthStatus = (score: number) => {
    if (score >= 80) return { status: 'Excellent', color: colors.semantic.success, emoji: '🎉' };
    if (score >= 60) return { status: 'Bon', color: colors.semantic.success, emoji: '👍' };
    if (score >= 40) return { status: 'Moyen', color: colors.semantic.warning, emoji: '⚠️' };
    return { status: 'À améliorer', color: colors.semantic.error, emoji: '🚨' };
  };

  const health = getHealthStatus(score);

  return (
    <TouchableOpacity 
      style={[styles.healthCard, { backgroundColor: colors.background.card }]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.healthHeader}>
        <Text style={[styles.healthTitle, { color: colors.text.primary }]}>
          Santé Financière
        </Text>
        <Text style={styles.healthEmoji}>{health.emoji}</Text>
      </View>

      <View style={styles.healthContent}>
        <View style={styles.healthScore}>
          <Text style={[styles.healthScoreValue, { color: health.color }]}>
            {score}/100
          </Text>
          <Text style={[styles.healthScoreLabel, { color: colors.text.tertiary }]}>
            Score
          </Text>
        </View>

        <View style={styles.healthIndicators}>
          <Text style={[styles.healthStatus, { color: health.color }]}>
            {health.status}
          </Text>
          <View style={[styles.healthProgress, { backgroundColor: colors.background.tertiary }]}>
            <View 
              style={[
                styles.healthProgressFill,
                { 
                  width: `${score}%`,
                  backgroundColor: health.color
                }
              ]} 
            />
          </View>
        </View>
      </View>

      <Text style={[styles.healthAdvice, { color: colors.text.secondary }]}>
        {score >= 80 
          ? 'Votre santé financière est excellente !' 
          : score >= 60 
          ? 'Vous êtes sur la bonne voie.'
          : 'Quelques ajustements pourraient aider.'
        }
      </Text>
    </TouchableOpacity>
  );
};

// ✅ COMPOSANT : CARTE DE PATRIMOINE NET
const NetWorthCard: React.FC<{ netWorthData?: NetWorthData }> = React.memo(({ netWorthData }) => {
  const { colors, spacing } = useDesignSystem();
  const { t } = useLanguage();
  const { formatAmount } = useCurrency();
  const navigation = useNavigation();
  const { analytics } = useAnalytics();
  
  const data = netWorthData || analytics;
  const netWorth = typeof data.netWorth === 'number' ? data.netWorth : (data.netWorth?.netWorth || 0);
  const totalAssets = typeof data.netWorth === 'object' ? (data.netWorth?.totalAssets || 0) : 0;
  const totalLiabilities = typeof data.netWorth === 'object' ? (data.netWorth?.totalLiabilities || 0) : 0;
  const history = typeof data.netWorth === 'object' ? data.netWorth?.history : undefined;
  
  const trend = history && history.length >= 2
    ? calculationService.calculateTrend(
        history[history.length - 1].netWorth,
        history[history.length - 2].netWorth
      )
    : { value: 0, isPositive: true };

  return (
    <TouchableOpacity 
      style={[styles.netWorthCard, { backgroundColor: colors.background.card }]}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('Accounts' as never)}
      accessible={true}
      accessibilityLabel={`Patrimoine Net: ${formatAmount(netWorth)}, Tendance ${trend.isPositive ? 'positive' : 'négative'} de ${Math.abs(trend.value).toFixed(1)} pourcent`}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={[colors.primary[500], colors.primary[600]]}
        style={styles.netWorthGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.netWorthHeader}>
          <Text style={[styles.netWorthTitle, { color: colors.text.inverse }]}>
            {t.netWorth}
          </Text>
          <View style={[styles.trendBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <Text style={[styles.trendText, { color: colors.text.inverse }]}>
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value).toFixed(1)}%
            </Text>
          </View>
        </View>
        
        <Text style={[styles.netWorthValue, { color: colors.text.inverse }]}>
          {formatAmount(netWorth)}
        </Text>
        
        <View style={styles.netWorthBreakdown}>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: colors.functional.income }]} />
            <Text style={[styles.breakdownLabel, { color: colors.text.primary }]}>
              {t.assets}
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.text.primary }]}>
              {formatAmount(totalAssets)}
            </Text>
          </View>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: colors.functional.expense }]} />
            <Text style={[styles.breakdownLabel, { color: colors.text.primary }]}>
              {t.liabilities}
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.text.primary }]}>
              {formatAmount(totalLiabilities)}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

// ✅ COMPOSANT : ACTIONS RAPIDES (6 CARTES - 3x2)
const QuickActionsGrid: React.FC = React.memo(() => {
  const { colors, spacing } = useDesignSystem();
  const { t } = useLanguage();
  const navigation = useNavigation();

  const quickActions = [
    { 
      id: 'transaction', 
      title: 'Transaction', 
      icon: 'add-circle' as const, 
      color: colors.primary[500],
      screen: 'Transactions',
      subScreen: 'AddTransaction'
    },
    { 
      id: 'budget', 
      title: 'Budget', 
      icon: 'pie-chart' as const, 
      color: colors.functional.savings,
      screen: 'Budgets',
      subScreen: null
    },
    { 
      id: 'category', 
      title: 'Catégorie', 
      icon: 'pricetags' as const, 
      color: colors.functional.investment,
      screen: 'Categories',
      subScreen: 'AddMultipleCategories'
    },
    { 
      id: 'annualCharge', 
      title: 'Charge Annuelle', 
      icon: 'calendar' as const, 
      color: colors.functional.expense,
      screen: 'AnnualCharges',
      subScreen: 'AddAnnualCharge'
    },
    { 
      id: 'savings', 
      title: 'Épargne', 
      icon: 'trending-up' as const, 
      color: colors.functional.income,
      screen: 'Savings',
      subScreen: 'AddSavingsGoal'
    },
    { 
      id: 'debt', 
      title: 'Dette', 
      icon: 'card' as const, 
      color: '#FF6B6B',
      screen: 'Debts',
      subScreen: 'AddDebt'
    },
  ];

  return (
    <View style={[styles.quickActions, { backgroundColor: colors.background.card }]}>
      <Text style={[styles.quickActionsTitle, { color: colors.text.primary }]}>
        {t.quickActions}
      </Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.quickAction, { backgroundColor: colors.background.secondary }]}
            onPress={() => {
              if (action.subScreen) {
                navigation.navigate(action.screen as never, { screen: action.subScreen } as never);
              } else {
                navigation.navigate(action.screen as never);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
              <Ionicons name={action.icon} size={24} color={colors.text.inverse} />
            </View>
            <Text style={[styles.quickActionText, { color: colors.text.primary }]} numberOfLines={1}>
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

// ✅ COMPOSANT : HEADER MODERNE (restauré)
interface ModernHeaderProps {
  unreadCount: number;
}

const ModernHeader: React.FC<ModernHeaderProps> = ({ unreadCount }) => {
  const { colors, spacing } = useDesignSystem();
  const { t } = useLanguage();
  const navigation = useNavigation();
  const { syncAllData, isSyncing } = useSync();
  const { user } = useAuth();
  
  // Extraire le prénom de l'email de l'utilisateur
  const userName = user?.email ? user.email.split('@')[0].split('.')[0] : 'Utilisateur';
  const capitalizedUserName = userName.charAt(0).toUpperCase() + userName.slice(1);

  return (
    <View style={[styles.header, { backgroundColor: colors.background.card }]}>
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          {/* ✅ Icône burger menu pour ouvrir le drawer */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background.secondary, marginRight: 12 }]}
            onPress={() => (navigation as any).openDrawer()}
          >
            <Ionicons name="menu" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          
          {/* logo removed per design: keep header compact */}
          <View>
            <Text style={[styles.welcomeText, { color: colors.text.secondary }]}>
              {t.welcome}, {capitalizedUserName}
            </Text>
            <Text style={[styles.title, { color: colors.text.primary, fontSize: 18 }]}> 
              {t.dashboard}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          // ...removed islamic charges icon and its condition...

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
            onPress={() => navigation.navigate('Notifications' as never)}
          >
            <Ionicons name="notifications" size={20} color={colors.text.primary} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {/* Home icon to return to Dashboard (keeps header actions compact) */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background.secondary, marginLeft: 8 }]}
            onPress={() => navigation.navigate('Dashboard' as never)}
          >
            <Ionicons name="home" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ✅ COMPOSANT PRINCIPAL DASHBOARD
const DashboardScreen: React.FC = () => {
  const { colors } = useDesignSystem();
  const { formatAmount } = useCurrency();
  const navigation = useNavigation();
  const { syncAllData, isSyncing } = useSync();
  const { refreshKey } = useRefresh(); // ✅ Écoute les changements globaux
  const { unreadCount } = useSmartAlerts(); // ✅ Nombre de notifications non lues
  
  // Hooks pour les données
  const { accounts, totalBalance, refreshAccounts } = useAccounts();
  const { analytics, refreshAnalytics } = useAnalytics();
  const { budgets, stats: budgetStats, refreshBudgets } = useBudgets();
  const { debts, stats: debtStats, refreshDebts } = useDebts();
  const { goals, stats: savingsStats, refreshGoals } = useSavings();
  const { transactions, refreshTransactions } = useTransactions();
  const { categories } = useCategories();
  const { charges: annualCharges } = useAnnualCharges();

  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ✅ Initial loading + Auto-debit processing
  React.useEffect(() => {
    // Simule un chargement initial
    const timer = setTimeout(() => setIsInitialLoading(false), 500);
    
    // ✅ Traiter les prélèvements automatiques au démarrage
    const processDebits = async () => {
      try {
        const { processAutomaticDebits } = await import('../services/autoDebitService');
        const result = await processAutomaticDebits();
        
        if (result.processed > 0) {
          console.log(`✅ ${result.processed} prélèvement(s) automatique(s) traité(s)`);
          // Refresh après traitement
          setTimeout(() => {
            refreshTransactions();
            refreshAccounts();
            refreshAnalytics();
          }, 500);
        }
        
        if (result.errors.length > 0) {
          console.error('⚠️ Erreurs prélèvements:', result.errors);
        }
      } catch (error) {
        console.error('❌ Erreur processAutomaticDebits:', error);
      }
    };
    
    processDebits();
    
    return () => clearTimeout(timer);
  }, []);

  // ✅ Mémoriser les données du donut chart
  const donutData = useMemo(() => [
    { name: 'Revenus', amount: Math.max(0, analytics.cashFlow.income), color: colors.functional.income },
    { name: 'Dépenses', amount: Math.max(0, Math.abs(analytics.cashFlow.expenses)), color: colors.functional.expense },
    { name: 'Solde', amount: Math.max(0, Math.abs(analytics.cashFlow.netFlow)), color: analytics.cashFlow.netFlow >= 0 ? colors.functional.savings : colors.functional.debt }
  ], [analytics.cashFlow, colors]);

  // ✅ Calculer top 3 catégories de dépenses
  const topExpenseCategories = useMemo(() => {
    const expenseTransactions = (transactions || []).filter((tx: any) => tx.type === 'expense');
    const categoryTotals = expenseTransactions.reduce((acc: any, tx: any) => {
      const cat = tx.category || 'Autre';
      acc[cat] = (acc[cat] || 0) + Math.abs(tx.amount);
      return acc;
    }, {});
    
    return Object.entries(categoryTotals)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 3)
      .map(([name, amount]) => ({ name, amount: amount as number }));
  }, [transactions]);

  // ✅ Prochaines charges annuelles (3 prochaines)
  const upcomingCharges = useMemo(() => {
    if (!annualCharges) return [];
    const now = new Date();
    return (annualCharges as any[])
      .filter((charge: any) => new Date(charge.nextDueDate) > now)
      .sort((a: any, b: any) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
      .slice(0, 3);
  }, [annualCharges]);

  // ✅ RECHARGEMENT SYNCHRONISÉ
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log('🔄 Dashboard: Rechargement des données...');

    try {
      await Promise.all([
        refreshAccounts(),
        refreshAnalytics(),
        refreshBudgets(),
        refreshDebts(),
        refreshGoals(),
        refreshTransactions()
      ]);
      
      // Animation de succès
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
      
    } catch (error) {
      console.error('❌ Dashboard: Erreur rechargement', error);
    } finally {
      setRefreshing(false);
    }
  }, [
    refreshAccounts, 
    refreshAnalytics, 
    refreshBudgets, 
    refreshDebts, 
    refreshGoals, 
    refreshTransactions,
    fadeAnim
  ]);

  // ✅ AUTO-REFRESH QUAND refreshKey CHANGE (ex: après suppression de charge)
  React.useEffect(() => {
    if (refreshKey > 0) {
      console.log('🔄 Dashboard: Refresh global détecté, rechargement automatique...');
      onRefresh();
    }
  }, [refreshKey, onRefresh]);

  // Calculs pour labels des donuts
  const goalsProgressPercent = (goals && goals.length)
    ? Math.round(
        (goals.reduce((s: number, g: any) => s + (g.currentAmount || 0), 0) /
         Math.max(1, goals.reduce((s: number, g: any) => s + (g.targetAmount || 0), 0))) * 100
      )
    : null;

  const goalsCenterLabel = goalsProgressPercent !== null ? `${goalsProgressPercent}%` : '—';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <ModernHeader unreadCount={unreadCount} />
        {/* Indicateur de rechargement en haut */}
        <Animated.View 
          style={[
            styles.refreshIndicator, 
            { 
              opacity: fadeAnim,
              backgroundColor: colors.semantic.success 
            }
          ]}
        >
          <Text style={[styles.refreshText, { color: colors.text.inverse }]}>
            ✓ Dashboard mis à jour
          </Text>
        </Animated.View>
        <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
        style={styles.scrollView}
      >

        {isInitialLoading ? (
          <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Chargement...</Text>
          </View>
        ) : (
        <View style={styles.content}>
          {/* Header already rendered above */}

          {/* Patrimoine */}
          <NetWorthCard netWorthData={analytics} />

          {/* Actions rapides */}
          <QuickActionsGrid />

          {/* Donut: Revenus / Dépenses / Solde */}
          <View style={{ width: '100%' }}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary, marginBottom: 12, marginHorizontal: 16 }]}>Aperçu Financier</Text>
            <View style={[styles.financialOverviewCard, { backgroundColor: colors.background.card }]}> 
              <DonutChart
                data={donutData}
                size={180}
                strokeWidth={32}
                centerLabel={`${formatAmount(analytics.cashFlow.netFlow)}`}
                legendPosition="right"
              />
            </View>
          </View>

          {/* Top 3 Catégories de Dépenses */}
          {topExpenseCategories.length > 0 && (
            <View style={{ width: '100%' }} accessible={true} accessibilityLabel="Top 3 des catégories de dépenses">
              <Text style={[styles.sectionTitle, { color: colors.text.primary, marginBottom: 12, marginHorizontal: 16 }]}>Top Dépenses</Text>
              <View style={[styles.topCategoriesCard, { backgroundColor: colors.background.card }]}>
                {topExpenseCategories.map((cat, index) => (
                  <View 
                    key={index} 
                    style={styles.topCategoryItem}
                    accessible={true}
                    accessibilityLabel={`Position ${index + 1}: ${cat.name}, ${formatAmount(cat.amount)}`}
                  >
                    <View style={styles.topCategoryInfo}>
                      <Text style={[styles.topCategoryRank, { color: colors.text.tertiary }]}>#{index + 1}</Text>
                      <Text style={[styles.topCategoryName, { color: colors.text.primary }]}>{cat.name}</Text>
                    </View>
                    <Text style={[styles.topCategoryAmount, { color: colors.semantic.error }]}>
                      {formatAmount(cat.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Transactions récentes */}
          <View style={{ paddingTop: 12 }}> 
            <View style={[styles.sectionHeader, { marginHorizontal: 16, marginBottom: 8 }]}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Transactions Récentes</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Transactions' as never)}
                accessible={true}
                accessibilityLabel="Voir toutes les transactions"
                accessibilityRole="button"
              >
                <Text style={[styles.seeMoreButton, { color: colors.primary[500] }]}>Voir plus</Text>
              </TouchableOpacity>
            </View>
            {(transactions || []).slice(0, 6).map((tx: any) => (
              <ListTransactionItem 
                key={tx.id}
                item={tx}
                onPress={(id) => (navigation as any).navigate('TransactionDetail', { transactionId: id })}
              />
            ))}
          </View>

          {/* Prochaines Charges Annuelles */}
          {upcomingCharges.length > 0 && (
            <View style={{ width: '100%', paddingTop: 12 }} accessible={true} accessibilityLabel="Prochaines charges annuelles à venir">
              <Text style={[styles.sectionTitle, { color: colors.text.primary, marginBottom: 12, marginHorizontal: 16 }]}>Prochaines Charges Annuelles</Text>
              <View style={[styles.upcomingChargesCard, { backgroundColor: colors.background.card }]}>
                {upcomingCharges.map((charge: any, index: number) => (
                  <View 
                    key={index} 
                    style={[styles.chargeItem, { borderBottomColor: colors.border.primary, borderBottomWidth: index < upcomingCharges.length - 1 ? 1 : 0 }]}
                    accessible={true}
                    accessibilityLabel={`${charge.name}, ${formatAmount(charge.amount)}, échéance le ${new Date(charge.nextDueDate).toLocaleDateString('fr-FR')}`}
                  >
                    <View style={styles.chargeInfo}>
                      <Text style={[styles.chargeName, { color: colors.text.primary }]}>{charge.name}</Text>
                      <Text style={[styles.chargeDate, { color: colors.text.tertiary }]}>
                        {new Date(charge.nextDueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                    <Text style={[styles.chargeAmount, { color: colors.semantic.warning }]}>
                      {formatAmount(charge.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ✅ STYLES AVEC DESIGN SYSTEM
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  
  // Header
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerOverlay: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
    // ...existing code...
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconPill: {
    width: 40,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Patrimoine Net
  netWorthCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  netWorthGradient: {
    padding: 20,
  },
  netWorthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  netWorthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  netWorthValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  netWorthBreakdown: {
    gap: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    flex: 1,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Santé Financière
  healthCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  healthEmoji: {
    fontSize: 24,
  },
  healthContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthScore: {
    alignItems: 'center',
    marginRight: 20,
  },
  healthScoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  healthScoreLabel: {
    fontSize: 14,
    marginTop: -4,
  },
  healthIndicators: {
    flex: 1,
  },
  healthStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  healthProgress: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  healthProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  healthAdvice: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Actions Rapides
  quickActions: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '30%', // 3 cartes par ligne
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Graphique
  chartCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartContainer: {
    gap: 16,
  },
  chartBar: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  chartSegment: {
    height: '100%',
    borderRadius: 4,
  },
  chartEmpty: {
    height: 120,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  chartEmptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  chartLegend: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Utilitaires
  refreshIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
    paddingVertical: 8,
  },
  
  // Cartes d'accès rapide (6 cartes - 3x2)
  accessCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    justifyContent: 'space-between',
  },
  accessCard: {
    width: '31%', // 3 cartes par ligne
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  accessCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  accessCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  accessCardValue: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Utilitaires supplémentaires
  refreshTextContainer: {
    padding: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Layout helpers
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  halfCard: {
    flex: 1,
    minWidth: 180,
    borderRadius: 16,
    padding: 8,
    marginVertical: 4,
    marginHorizontal: 2,
  },
  financialOverviewCard: {
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeMoreButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  topCategoriesCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    gap: 12,
  },
  topCategoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  topCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topCategoryRank: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 24,
  },
  topCategoryName: {
    fontSize: 15,
    fontWeight: '600',
  },
  topCategoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  upcomingChargesCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  chargeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  chargeInfo: {
    flex: 1,
  },
  chargeName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  chargeDate: {
    fontSize: 12,
  },
  chargeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  donutSection: {
    width: '100%',
  },
  donutCard: {
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  navCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  navCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    marginVertical: 6,
  },
  navIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  recentCard: {
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  spacer: {
    height: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
});

export default DashboardScreen;