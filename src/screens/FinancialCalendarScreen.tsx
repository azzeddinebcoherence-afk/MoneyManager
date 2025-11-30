// src/screens/FinancialCalendarScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useDesignSystem } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAnnualCharges } from '../hooks/useAnnualCharges';
import { useCategories } from '../hooks/useCategories';
import { useDebts } from '../hooks/useDebts';
import { useSavings } from '../hooks/useSavings';
import { useTransactions } from '../hooks/useTransactions';
import resolveCategoryLabel from '../utils/categoryResolver';


export const FinancialCalendarScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useDesignSystem();
  const { formatAmount, currency } = useCurrency();
  const { transactions, refreshTransactions } = useTransactions();
  const { charges, refreshAnnualCharges } = useAnnualCharges();
  const { debts, refreshDebts } = useDebts();
  const { goals } = useSavings();
  const { categories } = useCategories();
  
  // Debug: Afficher la devise actuelle
  console.log('💰 [Calendar] Devise actuelle:', currency?.code, currency?.symbol);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshTransactions(),
        refreshAnnualCharges(),
        refreshDebts()
      ]);
    } catch (error) {
      console.error('Error refreshing calendar:', error);
    }
    setRefreshing(false);
  };

  // Obtenir le premier et dernier jour du mois
  const getMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    return { daysInMonth, startDayOfWeek, year, month };
  };

  // ✅ FONCTION UTILITAIRE : Formater date sans problème de timezone
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ✅ NOUVELLE FONCTION : Générer les occurrences récurrentes pour le mois affiché
  const getRecurringTransactionsForMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const recurringOccurrences: any[] = [];

    // Filtrer les transactions récurrentes actives
    const recurringTransactions = transactions.filter(t => 
      t.isRecurring && 
      t.recurrenceType && 
      (!t.recurrenceEndDate || new Date(t.recurrenceEndDate) >= new Date(year, month, 1))
    );

    recurringTransactions.forEach(t => {
      const originalDate = new Date(t.date);
      const occurrences: Date[] = [];

      switch (t.recurrenceType) {
        case 'daily':
          // Générer une occurrence par jour du mois
          for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) {
            occurrences.push(new Date(year, month, day));
          }
          break;

        case 'weekly':
          // Générer une occurrence par semaine (même jour de la semaine)
          const dayOfWeek = originalDate.getDay();
          for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) {
            const date = new Date(year, month, day);
            if (date.getDay() === dayOfWeek && date >= originalDate) {
              occurrences.push(date);
            }
          }
          break;

        case 'monthly':
          // Une occurrence le même jour du mois
          const dayOfMonth = originalDate.getDate();
          const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
          const targetDay = Math.min(dayOfMonth, lastDayOfMonth);
          const monthDate = new Date(year, month, targetDay);
          if (monthDate >= originalDate) {
            occurrences.push(monthDate);
          }
          break;

        case 'yearly':
          // Une occurrence si c'est le même mois et jour
          if (originalDate.getMonth() === month) {
            const yearDate = new Date(year, month, originalDate.getDate());
            if (yearDate >= originalDate) {
              occurrences.push(yearDate);
            }
          }
          break;
      }

      // Ajouter les occurrences générées
      occurrences.forEach(occDate => {
        // Vérifier si ce n'est pas la transaction originale
        const occDateStr = formatDateLocal(occDate);
        const originalDateStr = formatDateLocal(originalDate);
        
        if (occDateStr !== originalDateStr) {
          recurringOccurrences.push({
            ...t,
            date: occDateStr,
            isVirtualRecurrence: true, // Marquer comme occurrence virtuelle
            originalTransactionId: t.id
          });
        }
      });
    });

    return recurringOccurrences;
  }, [transactions, currentMonth]);

  // Calculer les montants par jour
  const getDayData = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, day);
    const dateStr = formatDateLocal(date); // ✅ CORRECTION : Utiliser le format local

    let income = 0;
    let expenses = 0;

    // Transactions normales
    transactions.forEach(t => {
      const tDateStr = formatDateLocal(new Date(t.date)); // ✅ CORRECTION : Format local
      if (tDateStr === dateStr) {
        if (t.type === 'income') {
          income += t.amount;
        } else if (t.type === 'expense') {
          expenses += Math.abs(t.amount);
        }
      }
    });

    // ✅ NOUVEAU : Transactions récurrentes virtuelles
    getRecurringTransactionsForMonth.forEach(t => {
      if (t.date === dateStr) {
        if (t.type === 'income') {
          income += t.amount;
        } else if (t.type === 'expense') {
          expenses += Math.abs(t.amount);
        }
      }
    });

    // Charges annuelles
    charges.forEach(c => {
      const cDateStr = formatDateLocal(new Date(c.dueDate)); // ✅ CORRECTION : Format local
      if (cDateStr === dateStr && !c.isPaid) {
        expenses += c.amount;
      }
    });

    // Dettes (échéances)
    debts.forEach(d => {
      if (d.nextDueDate) {
        const dDateStr = formatDateLocal(new Date(d.nextDueDate)); // ✅ CORRECTION : Format local
        if (dDateStr === dateStr && d.status === 'active') {
          expenses += d.monthlyPayment || 0;
        }
      }
    });

    const netAmount = income - expenses;
    return { income, expenses, netAmount };
  };

  // Naviguer entre les mois
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newDate);
  };

  // Fonction pour obtenir le nom complet de la catégorie (parent + sous-catégorie)
  const getCategoryName = (categoryId: string, subCategoryId?: string) => {
    const resolved = resolveCategoryLabel(subCategoryId || categoryId, categories);
    if (resolved.parent) {
      return `${resolved.parent} > ${resolved.child}`;
    }
    return resolved.child;
  };

  // Obtenir toutes les opérations du jour sélectionné (transactions + récurrentes + charges + dettes)
  const selectedDayTransactions = useMemo(() => {
    const dateStr = formatDateLocal(selectedDate); // ✅ CORRECTION : Format local
    const items: any[] = [];

    // 1. Transactions normales
    transactions.forEach(t => {
      const tDateStr = formatDateLocal(new Date(t.date)); // ✅ CORRECTION : Format local
      if (tDateStr === dateStr) {
        items.push({
          id: t.id,
          type: t.type,
          description: t.description,
          amount: t.amount,
          category: getCategoryName(t.category, t.subCategory),
          date: t.date,
          icon: 'wallet',
          source: 'transaction',
          isRecurring: t.isRecurring || false
        });
      }
    });

    // 1b. ✅ NOUVEAU : Transactions récurrentes virtuelles
    getRecurringTransactionsForMonth.forEach(t => {
      if (t.date === dateStr) {
        items.push({
          id: `recurring_${t.id}_${dateStr}`,
          type: t.type,
          description: `${t.description} (récurrent)`,
          amount: t.amount,
          category: getCategoryName(t.category, t.subCategory),
          date: t.date,
          icon: 'repeat',
          source: 'recurring',
          isRecurring: true,
          recurrenceType: t.recurrenceType
        });
      }
    });

    // 2. Charges annuelles
    charges.forEach(c => {
      const cDateStr = formatDateLocal(new Date(c.dueDate)); // ✅ CORRECTION : Format local
      if (cDateStr === dateStr && !c.isPaid) {
        items.push({
          id: c.id,
          type: 'expense',
          description: c.name,
          amount: c.amount,
          category: c.category ? getCategoryName(c.category) : 'Charges Annuelles',
          date: c.dueDate,
          icon: 'calendar',
          source: 'charge'
        });
      }
    });

    // 3. Échéances de dettes
    debts.forEach(d => {
      if (d.nextDueDate) {
        const dDateStr = formatDateLocal(new Date(d.nextDueDate)); // ✅ CORRECTION : Format local
        if (dDateStr === dateStr && d.status === 'active') {
          items.push({
            id: d.id,
            type: 'expense',
            description: d.name,
            amount: d.monthlyPayment,
            category: d.category ? getCategoryName(d.category) : 'Remboursement Dette',
            date: d.nextDueDate,
            icon: 'trending-down',
            source: 'debt'
          });
        }
      }
    });

    // Trier par date/heure
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, getRecurringTransactionsForMonth, charges, debts, selectedDate, categories]);

  // ✅ NOUVEAU : Calculer les statistiques du mois affiché
  const monthStats = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    let totalIncome = 0;
    let totalExpenses = 0;

    // Parcourir tous les jours du mois
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDateLocal(date);

      // Transactions normales
      transactions.forEach(t => {
        const tDateStr = formatDateLocal(new Date(t.date));
        if (tDateStr === dateStr) {
          if (t.type === 'income') {
            totalIncome += t.amount;
          } else if (t.type === 'expense') {
            totalExpenses += Math.abs(t.amount);
          }
        }
      });

      // Transactions récurrentes virtuelles
      getRecurringTransactionsForMonth.forEach(t => {
        if (t.date === dateStr) {
          if (t.type === 'income') {
            totalIncome += t.amount;
          } else if (t.type === 'expense') {
            totalExpenses += Math.abs(t.amount);
          }
        }
      });

      // Charges annuelles
      charges.forEach(c => {
        const cDateStr = formatDateLocal(new Date(c.dueDate));
        if (cDateStr === dateStr && !c.isPaid) {
          totalExpenses += c.amount;
        }
      });

      // Dettes (échéances)
      debts.forEach(d => {
        if (d.nextDueDate) {
          const dDateStr = formatDateLocal(new Date(d.nextDueDate));
          if (dDateStr === dateStr && d.status === 'active') {
            totalExpenses += d.monthlyPayment || 0;
          }
        }
      });
    }

    const balance = totalIncome - totalExpenses;

    return {
      income: totalIncome,
      expenses: totalExpenses,
      balance
    };
  }, [currentMonth, transactions, getRecurringTransactionsForMonth, charges, debts]);

  const { daysInMonth, startDayOfWeek, year, month } = getMonthDays();
  const today = new Date();
  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === month && 
           today.getFullYear() === year;
  };

  const isSelectedDay = (day: number) => {
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === month && 
           selectedDate.getFullYear() === year;
  };

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Calendrier des Dépenses
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500] || '#007AFF'}
          />
        }
      >
        {/* Section Statistiques du mois */}
        <View style={[styles.statsCard, { backgroundColor: colors.background.card }]}>
          <Text style={[styles.statsTitle, { color: colors.text.secondary }]}>
            Solde du mois
          </Text>
          <Text style={[
            styles.statsBalance, 
            { color: monthStats.balance >= 0 ? '#34C759' : '#FF3B30' }
          ]}>
            {formatAmount(monthStats.balance)}
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#34C75915' }]}>
                <Ionicons name="arrow-down" size={20} color="#34C759" />
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Revenus</Text>
                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                  {formatAmount(monthStats.income)}
                </Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#FF3B3015' }]}>
                <Ionicons name="arrow-up" size={20} color="#FF3B30" />
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Dépenses</Text>
                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                  {formatAmount(monthStats.expenses)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Calendrier */}
        <View style={[styles.calendarCard, { backgroundColor: colors.background.card }]}>
          {/* Mois et navigation */}
          <View style={styles.monthHeader}>
            <Text style={[styles.monthTitle, { color: colors.text.primary }]}>
              {monthNames[month]} {year}
            </Text>
            <View style={styles.monthNavigation}>
              <TouchableOpacity 
                onPress={() => navigateMonth('prev')}
                style={[styles.navButton, { backgroundColor: colors.background.secondary }]}
              >
                <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => navigateMonth('next')}
                style={[styles.navButton, { backgroundColor: colors.background.secondary }]}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Jours de la semaine */}
          <View style={styles.weekDaysRow}>
            {dayNames.map((day, index) => (
              <View key={index} style={styles.weekDayCell}>
                <Text style={[styles.weekDayText, { color: colors.text.secondary }]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Grille du calendrier */}
          <View style={styles.calendarGrid}>
            {/* Cellules vides avant le premier jour */}
            {Array.from({ length: startDayOfWeek === 0 ? 6 : startDayOfWeek - 1 }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}

            {/* Jours du mois */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayData = getDayData(day);
              const hasData = dayData.netAmount !== 0;

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    isSelectedDay(day) && { backgroundColor: colors.primary[500] },
                  ]}
                  onPress={() => setSelectedDate(new Date(year, month, day))}
                >
                  <Text style={[
                    styles.dayNumber,
                    { color: colors.text.primary },
                    isToday(day) && styles.todayText,
                    isSelectedDay(day) && { color: '#fff' },
                  ]}>
                    {day}
                  </Text>
                  {hasData && (
                    <Text style={[
                      styles.dayAmount,
                      dayData.netAmount < 0 ? { color: '#FF3B30' } : { color: '#34C759' },
                      isSelectedDay(day) && { color: '#fff' },
                    ]}>
                      {dayData.netAmount > 0 ? '+' : ''}{Math.round(dayData.netAmount)}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Transactions du jour sélectionné */}
        <View style={styles.transactionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Transactions du {selectedDate.getDate()} {monthNames[selectedDate.getMonth()].toLowerCase()}
          </Text>

          {selectedDayTransactions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.background.card }]}>
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                Aucune transaction ce jour
              </Text>
            </View>
          ) : (
            selectedDayTransactions.map(item => (
              <View 
                key={`${item.source}-${item.id}`} 
                style={[styles.transactionCard, { backgroundColor: colors.background.card }]}
              >
                <View style={styles.transactionIcon}>
                  <Ionicons 
                    name={item.icon as any} 
                    size={24} 
                    color={item.type === 'expense' ? '#FF3B30' : '#34C759'} 
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionTitle, { color: colors.text.primary }]}>
                    {item.description}
                  </Text>
                  <Text style={[styles.transactionSubtitle, { color: colors.text.secondary }]}>
                    {item.category} • {new Date(item.date).toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: item.type === 'expense' ? '#FF3B30' : '#34C759' }
                ]}>
                  {item.type === 'expense' ? '-' : '+'}{Math.abs(item.amount).toFixed(2)} €
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  statsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  statsBalance: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  calendarCard: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  monthNavigation: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  todayText: {
    fontWeight: 'bold',
  },
  dayAmount: {
    fontSize: 11,
    fontWeight: '600',
  },
  transactionsSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionSubtitle: {
    fontSize: 13,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FinancialCalendarScreen;