// src/screens/BudgetsScreen.tsx - Restored clean version
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BudgetCard from '../components/budget/BudgetCard';
import BudgetForm from '../components/budget/BudgetForm';
import BudgetProgress from '../components/budget/BudgetProgress';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { useBudgets } from '../hooks/useBudgets';
import { Budget } from '../types';

interface BudgetsScreenProps {
  navigation: any;
}

const BudgetsScreen: React.FC<BudgetsScreenProps> = ({ navigation }) => {
  const { formatAmount } = useCurrency();
  const { theme } = useTheme();
  const {
    budgets,
    loading,
    error,
    stats,
    createBudget,
    deleteBudget,
    toggleBudget,
    refreshBudgets,
  } = useBudgets();

  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isDark = theme === 'dark';

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshBudgets();
    setRefreshing(false);
  };

  const handleCreateBudget = async (budgetData: Omit<Budget, 'id' | 'createdAt' | 'spent'>) => {
    try {
      await createBudget(budgetData);
      setShowBudgetForm(false);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de créer le budget');
    }
  };

  const handleDeleteBudget = (id: string) => {
    const budget = budgets.find(b => b.id === id);
    if (!budget) return;

    Alert.alert(
      'Supprimer le budget',
      `Êtes-vous sûr de vouloir supprimer le budget "${budget.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteBudget(id),
        },
      ]
    );
  };

  const handleToggleBudget = (id: string, isActive: boolean) => {
    toggleBudget(id, isActive);
  };

  const handleBudgetPress = (budget: Budget) => {
    navigation.navigate('EditBudget', { budgetId: budget.id });
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, isDark && styles.darkContainer, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.loadingText, isDark && styles.darkText]}>Chargement des budgets...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, isDark && styles.darkContainer, styles.center]}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={[styles.errorText, isDark && styles.darkText]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshBudgets}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const activeBudgets = budgets.filter(budget => budget.isActive);
  const inactiveBudgets = budgets.filter(budget => !budget.isActive);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]} edges={["top"]}>
      <View style={[styles.header, isDark && styles.darkHeader]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, isDark && styles.darkText]}>Budgets</Text>
          <TouchableOpacity style={[styles.headerButton, isDark && styles.darkHeaderButton]} onPress={() => setShowBudgetForm(true)}>
            <Ionicons name="add" size={18} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.subtitle, isDark && styles.darkSubtext]}>Gérez vos limites de dépenses</Text>

        <View style={[styles.statsContainer, isDark && styles.darkStatsContainer]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, isDark && styles.darkText]}>{stats.totalBudgets}</Text>
            <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: stats.activeBudgets > 0 ? '#34C759' : isDark ? '#fff' : '#000' }]}>{stats.activeBudgets}</Text>
            <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>Actifs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: stats.averageUsage > 80 ? '#FF9500' : isDark ? '#fff' : '#000' }]}>{Math.round(stats.averageUsage)}%</Text>
            <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>Utilisation</Text>
          </View>
        </View>
      </View>

      <View style={[styles.summaryCard, isDark && styles.darkCard]}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={[styles.summaryLabel, isDark && styles.darkSubtext]}>Budget mensuel total</Text>
            <Text style={[styles.summaryMonth, isDark && styles.darkSubtext]}>{new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</Text>
          </View>
          <Text style={[styles.summaryAmount, isDark && styles.darkText]}>
            {(() => {
              const total = budgets.filter(b => b.period === 'monthly').reduce((s, b) => s + b.amount, 0);
              return total.toFixed(0) + ' €';
            })()}
          </Text>
        </View>

        <View style={styles.summaryProgressWrap}>
          <BudgetProgress
            spent={budgets.filter(b => b.period === 'monthly').reduce((s, b) => s + b.spent, 0)}
            budget={budgets.filter(b => b.period === 'monthly').reduce((s, b) => s + b.amount, 0) || 1}
            showLabels={false}
            height={10}
          />

          <Text style={[styles.summaryRemaining, isDark && styles.darkSubtext]}>
            {(() => {
              const total = budgets.filter(b => b.period === 'monthly').reduce((s, b) => s + b.amount, 0);
              const spent = budgets.filter(b => b.period === 'monthly').reduce((s, b) => s + b.spent, 0);
              const remain = Math.max(total - spent, 0);
              return `Reste: ${remain.toFixed(0)} € · Sur la bonne voie 🎯`;
            })()}
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionMainTitle, isDark && styles.darkText]}>Budgets par catégorie</Text>

      <SectionList
        sections={[
          { title: `Budgets Actifs (${activeBudgets.length})`, data: activeBudgets },
          { title: `Budgets Inactifs (${inactiveBudgets.length})`, data: inactiveBudgets },
        ]}
        keyExtractor={(item: Budget) => item.id}
        renderItem={({ item }: { item: Budget }) => (
          <BudgetCard
            budget={item}
            onPress={() => handleBudgetPress(item)}
            onLongPress={() => handleDeleteBudget(item.id)}
            onToggle={handleToggleBudget}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        renderSectionHeader={({ section }) => (
          section.data && section.data.length > 0 ? (
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>{section.title}</Text>
            </View>
          ) : null
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} tintColor={isDark ? '#fff' : '#007AFF'} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="pie-chart-outline" size={64} color={isDark ? '#555' : '#ccc'} />
            <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>Aucun budget</Text>
            <Text style={[styles.emptySubtext, isDark && styles.darkSubtext]}>Créez votre premier budget pour suivre vos dépenses</Text>
            <TouchableOpacity style={styles.createButton} onPress={() => setShowBudgetForm(true)}>
              <Text style={styles.createButtonText}>Créer un budget</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: 120 }]}
        ListFooterComponent={<View style={styles.spacer} />}
      />

      <BudgetForm visible={showBudgetForm} onClose={() => setShowBudgetForm(false)} onSubmit={handleCreateBudget} />
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  darkHeader: {
    backgroundColor: '#2c2c2e',
    borderBottomColor: '#38383a',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkHeaderButton: {
    backgroundColor: '#2c2c2e',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  darkStatsContainer: {
    backgroundColor: '#2c2c2e',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
  },
  section: {
    padding: 16,
    paddingBottom: 0,
  },
  sectionHeader: {
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 100,
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
  summaryMonth: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  summaryProgressWrap: {
    gap: 8,
  },
  summaryRemaining: {
    marginTop: 6,
    color: '#34C759',
    fontSize: 13,
  },
  sectionMainTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
  },
  darkCard: {
    backgroundColor: '#2c2c2e',
    borderColor: '#38383a',
  },
  listContent: {
    paddingHorizontal: 12,
  },
  itemSeparator: {
    height: 10,
  },
});

export default BudgetsScreen;