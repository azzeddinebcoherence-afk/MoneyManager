// src/screens/MonthsOverviewScreen.tsx - VERSION CORRIGÉE
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useMemo, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MonthCard from '../components/analytics/MonthCard';
import { SafeAreaView } from '../components/SafeAreaView';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { useMonthlyData } from '../hooks/useMonthlyData';

const { width } = Dimensions.get('window');

// Types pour la navigation
type RootStackParamList = {
  MonthsOverview: undefined;
  MonthDetail: { year: number; month: number };
};

type MonthsOverviewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MonthsOverview'>;

const MonthsOverviewScreen: React.FC = () => {
  const navigation = useNavigation<MonthsOverviewScreenNavigationProp>();
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { getMonthlyOverview, getAvailableYears } = useMonthlyData();
  const isDark = theme === 'dark';
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeMetric, setActiveMetric] = useState<'income' | 'expenses' | 'balance'>('balance');
  
  // ✅ CORRECTION : Obtenir le mois et l'année actuels correctement
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11 (Janvier = 0)
  const currentYear = now.getFullYear();

  // ✅ CORRECTION : getAvailableYears est une fonction, pas une variable
  const availableYears = getAvailableYears;
  const monthlyData = useMemo(() => {
    return getMonthlyOverview(selectedYear);
  }, [getMonthlyOverview, selectedYear]);

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
  }, [selectedYear]);

  // Calcul des totaux annuels avec plus de métriques
  const yearlyTotals = useMemo(() => {
    const totals = monthlyData.reduce((acc, month) => ({
      totalIncome: acc.totalIncome + month.income,
      totalExpenses: acc.totalExpenses + month.expenses,
      totalNetFlow: acc.totalNetFlow + month.netFlow,
      totalTransactions: acc.totalTransactions + month.transactionCount,
      avgMonthlyIncome: acc.avgMonthlyIncome + month.income,
      avgMonthlyExpenses: acc.avgMonthlyExpenses + month.expenses,
    }), {
      totalIncome: 0,
      totalExpenses: 0,
      totalNetFlow: 0,
      totalTransactions: 0,
      avgMonthlyIncome: 0,
      avgMonthlyExpenses: 0,
    });

    const monthCount = monthlyData.length || 1;
    return {
      ...totals,
      avgMonthlyIncome: totals.avgMonthlyIncome / monthCount,
      avgMonthlyExpenses: totals.avgMonthlyExpenses / monthCount,
      savingsRate: totals.totalIncome > 0 ? (totals.totalNetFlow / totals.totalIncome) * 100 : 0,
    };
  }, [monthlyData]);

  const handleMonthPress = (year: number, month: number) => {
    navigation.navigate('MonthDetail', { year, month });
  };

  // Header moderne avec dégradé
  const ModernHeader = () => (
    <View style={[styles.header, isDark && styles.darkHeader]}>
      <View style={styles.headerBackground}>
        <View style={[styles.headerGradient, isDark && styles.darkHeaderGradient]} />
      </View>
      
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <View style={styles.logo}>
            <Ionicons name="calendar" size={28} color="#007AFF" />
          </View>
          <View>
            <Text style={[styles.title, isDark && styles.darkTitle]}>
              Vue par Mois
            </Text>
            <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
              {/* ✅ CORRECTION : Afficher le mois et l'année actuels */}
              {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerStats}>
          <View style={styles.miniStat}>
            <Ionicons name="trending-up" size={14} color="#10B981" />
            <Text style={[styles.miniStatText, isDark && styles.darkSubtext]}>
              {monthlyData.length} mois
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Sélecteur d'année moderne
  const ModernYearSelector = () => (
    <Animated.View 
      style={[
        styles.yearSelectorContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={[styles.yearSelectorLabel, isDark && styles.darkSubtext]}>
        Sélectionnez l'année
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.yearButtonsContainer}
      >
        {/* ✅ CORRECTION : Appeler getAvailableYears() comme une fonction */}
        {getAvailableYears().map(year => (
          <TouchableOpacity
            key={year}
            style={[
              styles.yearButton,
              selectedYear === year && styles.yearButtonActive,
              isDark && styles.darkYearButton
            ]}
            onPress={() => setSelectedYear(year)}
          >
            <Ionicons 
              name="calendar" 
              size={16} 
              color={selectedYear === year ? '#fff' : (isDark ? '#94A3B8' : '#64748B')} 
            />
            <Text style={[
              styles.yearButtonText,
              selectedYear === year && styles.yearButtonTextActive,
              isDark && styles.darkYearButtonText
            ]}>
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );

  // Métriques principales interactives
  const MetricSelector = () => (
    <View style={styles.metricSelector}>
      {[
        { key: 'balance', label: 'Solde', icon: 'trending-up', color: '#007AFF' },
        { key: 'income', label: 'Revenus', icon: 'arrow-down', color: '#10B981' },
        { key: 'expenses', label: 'Dépenses', icon: 'arrow-up', color: '#EF4444' },
      ].map(metric => (
        <TouchableOpacity
          key={metric.key}
          style={[
            styles.metricButton,
            activeMetric === metric.key && styles.metricButtonActive,
            { borderLeftColor: metric.color },
            isDark && styles.darkMetricButton
          ]}
          onPress={() => setActiveMetric(metric.key as any)}
        >
          <Ionicons 
            name={metric.icon as any} 
            size={18} 
            color={activeMetric === metric.key ? '#fff' : metric.color} 
          />
          <Text style={[
            styles.metricButtonText,
            activeMetric === metric.key && styles.metricButtonTextActive,
            isDark && styles.darkText
          ]}>
            {metric.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Carte de résumé annuel moderne
  const ModernYearlySummary = () => (
    <Animated.View 
      style={[
        styles.yearlySummary,
        isDark && styles.darkCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.summaryHeader}>
        <View>
          <Text style={[styles.yearlySummaryTitle, isDark && styles.darkTitle]}>
            Résumé {selectedYear}
          </Text>
          <Text style={[styles.yearlySummarySubtitle, isDark && styles.darkSubtext]}>
            Performance financière annuelle
          </Text>
        </View>
        <View style={[styles.yearBadge, isDark && styles.darkYearBadge]}>
          <Ionicons name="trophy" size={16} color="#F59E0B" />
          <Text style={styles.yearBadgeText}>{selectedYear}</Text>
        </View>
      </View>
      
      <View style={styles.yearlyStatsGrid}>
        <View style={styles.mainStat}>
          <View style={styles.statIconContainer}>
            <Ionicons 
              name={yearlyTotals.totalNetFlow >= 0 ? "trending-up" : "trending-down"} 
              size={24} 
              color={yearlyTotals.totalNetFlow >= 0 ? '#10B981' : '#EF4444'} 
            />
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.mainStatValue, { 
              color: yearlyTotals.totalNetFlow >= 0 ? '#10B981' : '#EF4444' 
            }]}>
              {formatAmount(yearlyTotals.totalNetFlow)}
            </Text>
            <Text style={[styles.mainStatLabel, isDark && styles.darkSubtext]}>
              Solde Annuel
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.miniStatCard}>
            <Ionicons name="arrow-down" size={16} color="#10B981" />
            <Text style={[styles.miniStatValue, isDark && styles.darkText]}>
              {formatAmount(yearlyTotals.totalIncome)}
            </Text>
            <Text style={[styles.miniStatLabel, isDark && styles.darkSubtext]}>
              Revenus
            </Text>
          </View>
          
          <View style={styles.miniStatCard}>
            <Ionicons name="arrow-up" size={16} color="#EF4444" />
            <Text style={[styles.miniStatValue, isDark && styles.darkText]}>
              {formatAmount(yearlyTotals.totalExpenses)}
            </Text>
            <Text style={[styles.miniStatLabel, isDark && styles.darkSubtext]}>
              Dépenses
            </Text>
          </View>
          
          <View style={styles.miniStatCard}>
            <Ionicons name="repeat" size={16} color="#007AFF" />
            <Text style={[styles.miniStatValue, isDark && styles.darkText]}>
              {yearlyTotals.totalTransactions}
            </Text>
            <Text style={[styles.miniStatLabel, isDark && styles.darkSubtext]}>
              Transactions
            </Text>
          </View>
        </View>

        {/* Indicateur de performance */}
        <View style={styles.performanceIndicator}>
          <View style={styles.performanceHeader}>
            <Ionicons name="speedometer" size={16} color="#F59E0B" />
            <Text style={[styles.performanceLabel, isDark && styles.darkSubtext]}>
              Taux d'épargne
            </Text>
          </View>
          <View style={styles.performanceBar}>
            <View 
              style={[
                styles.performanceFill,
                { 
                  width: `${Math.min(Math.abs(yearlyTotals.savingsRate), 100)}%`,
                  backgroundColor: yearlyTotals.savingsRate >= 0 ? '#10B981' : '#EF4444'
                }
              ]} 
            />
          </View>
          <Text style={[
            styles.performanceValue,
            { color: yearlyTotals.savingsRate >= 0 ? '#10B981' : '#EF4444' }
          ]}>
            {yearlyTotals.savingsRate.toFixed(1)}%
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  // État vide stylisé
  const StylishEmptyState = () => (
    <Animated.View 
      style={[
        styles.emptyState,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={[styles.emptyIcon, isDark && styles.darkEmptyIcon]}>
        <Ionicons 
          name="calendar-outline" 
          size={64} 
          color={isDark ? '#4B5563' : '#9CA3AF'} 
        />
      </View>
      <Text style={[styles.emptyTitle, isDark && styles.darkTitle]}>
        Aucune donnée pour {selectedYear}
      </Text>
      <Text style={[styles.emptyDescription, isDark && styles.darkSubtext]}>
        Les transactions de {selectedYear} apparaîtront ici dès que vous ajouterez des données.
      </Text>
      <TouchableOpacity 
        style={styles.emptyActionButton}
        onPress={() => navigation.navigate('AddTransaction' as any)}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.emptyActionText}>Commencer à tracker</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // Section des mois avec en-tête animé
  const MonthsSection = () => (
    <Animated.View 
      style={[
        styles.monthsSection,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, isDark && styles.darkTitle]}>
            Analyse Mensuelle
          </Text>
          <Text style={[styles.sectionSubtitle, isDark && styles.darkSubtext]}>
            Détails mois par mois
          </Text>
        </View>
        <View style={styles.monthCount}>
          <Ionicons name="layers" size={16} color="#007AFF" />
          <Text style={[styles.monthCountText, isDark && styles.darkSubtext]}>
            {monthlyData.length} mois
          </Text>
        </View>
      </View>

      <MetricSelector />
      
      <FlatList
        data={monthlyData}
        renderItem={({ item, index }) => (
          <MonthCard
            year={item.year}
            month={item.month}
            income={item.income}
            expenses={item.expenses}
            netFlow={item.netFlow}
            transactionCount={item.transactionCount}
            onPress={handleMonthPress}
            // ✅ CORRECTION : Vérification correcte du mois en cours
            isCurrentMonth={item.year === currentYear && item.month === currentMonth}
            highlightMetric={activeMetric === 'balance' ? 'netFlow' : activeMetric}
            animationDelay={index * 100}
          />
        )}
        keyExtractor={(item) => `${item.year}-${item.month}`}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.monthsList}
      />
    </Animated.View>
  );

  return (
    <SafeAreaView>
      <View style={[styles.container, isDark && styles.darkContainer]}>
        <ModernHeader />
        
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <ModernYearSelector />
          
          {monthlyData.length > 0 ? (
            <>
              <ModernYearlySummary />
              <MonthsSection />
            </>
          ) : (
            <StylishEmptyState />
          )}

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
  
  // Header moderne avec dégradé
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  darkHeader: {
    backgroundColor: 'transparent',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerGradient: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    opacity: 0.95,
  },
  darkHeaderGradient: {
    backgroundColor: '#1E293B',
    opacity: 0.95,
  },
  headerContent: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  darkTitle: {
    color: '#F1F5F9',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  darkSubtitle: {
    color: '#94A3B8',
  },
  headerStats: {
    alignItems: 'flex-end',
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  miniStatText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  
  // Contenu principal
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Sélecteur d'année moderne
  yearSelectorContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  yearSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  yearButtonsContainer: {
    gap: 8,
  },
  yearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    gap: 8,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  darkYearButton: {
    backgroundColor: '#334155',
  },
  yearButtonActive: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  yearButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  darkYearButtonText: {
    color: '#94A3B8',
  },
  yearButtonTextActive: {
    color: '#FFFFFF',
  },
  
  // Résumé annuel moderne
  yearlySummary: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  darkCard: {
    backgroundColor: '#1E293B',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  yearlySummaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  yearlySummarySubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  yearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  darkYearBadge: {
    backgroundColor: '#451A03',
  },
  yearBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  
  // Grille de statistiques
  yearlyStatsGrid: {
    gap: 20,
  },
  mainStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statInfo: {
    flex: 1,
  },
  mainStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mainStatLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  miniStatValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
  },
  miniStatLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  
  // Indicateur de performance
  performanceIndicator: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  performanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  performanceBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  performanceFill: {
    height: '100%',
    borderRadius: 4,
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Section des mois
  monthsSection: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  monthCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  monthCountText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  
  // Sélecteur de métriques
  metricSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  metricButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    borderLeftWidth: 3,
  },
  darkMetricButton: {
    backgroundColor: 'transparent',
  },
  metricButtonActive: {
    backgroundColor: '#007AFF',
  },
  metricButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  metricButtonTextActive: {
    color: '#FFFFFF',
  },
  
  // Liste des mois
  monthsList: {
    gap: 12,
    paddingBottom: 20,
  },
  
  // État vide stylisé
  emptyState: {
    alignItems: 'center',
    padding: 48,
    marginTop: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkEmptyIcon: {
    backgroundColor: '#334155',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Divers
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

export default MonthsOverviewScreen;