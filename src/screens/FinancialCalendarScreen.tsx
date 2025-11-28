// src/screens/FinancialCalendarScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useDesignSystem } from '../context/ThemeContext';
import { useAnnualCharges } from '../hooks/useAnnualCharges';
import { useCategories } from '../hooks/useCategories';
import { useDebts } from '../hooks/useDebts';
import { useSavings } from '../hooks/useSavings';
import { useTransactions } from '../hooks/useTransactions';
import resolveCategoryLabel from '../utils/categoryResolver';


export const FinancialCalendarScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useDesignSystem();
  const { transactions } = useTransactions();
  const { charges } = useAnnualCharges();
  const { debts } = useDebts();
  const { goals } = useSavings();
  const { categories } = useCategories();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  // Calculer les montants par jour
  const getDayData = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, day);
    const dateStr = formatDateLocal(date); // ✅ CORRECTION : Utiliser le format local

    let income = 0;
    let expenses = 0;

    // Transactions
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

  // Obtenir toutes les opérations du jour sélectionné (transactions + charges + dettes)
  const selectedDayTransactions = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const items: any[] = [];

    // 1. Transactions normales
    transactions.forEach(t => {
      const tDateStr = new Date(t.date).toISOString().split('T')[0];
      if (tDateStr === dateStr) {
        items.push({
          id: t.id,
          type: t.type,
          description: t.description,
          amount: t.amount,
          category: getCategoryName(t.category, t.subCategory),
          date: t.date,
          icon: 'wallet',
          source: 'transaction'
        });
      }
    });

    // 2. Charges annuelles
    charges.forEach(c => {
      const cDateStr = new Date(c.dueDate).toISOString().split('T')[0];
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
        const dDateStr = new Date(d.nextDueDate).toISOString().split('T')[0];
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
  }, [transactions, charges, debts, selectedDate, categories]);

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

      <ScrollView style={styles.scrollView}>
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