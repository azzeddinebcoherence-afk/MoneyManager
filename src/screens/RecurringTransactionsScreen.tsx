import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { useLanguage } from '../context/LanguageContext';
import { useDesignSystem } from '../context/ThemeContext';
import { useTransactions } from '../hooks/useTransactions';
import { notificationService } from '../services/NotificationService';

// recurring transactions will be fetched from `useTransactions`

const RecurringTransactionsScreen: React.FC = () => {
  const { t } = useLanguage();
  const { colors } = useDesignSystem();
  const { getRecurringTransactions, refreshTransactions } = useTransactions();

  useEffect(() => {
    let mounted = true;

    const sync = async () => {
      try {
        // Refresh transactions to ensure latest data
        await refreshTransactions();
        const recurring = getRecurringTransactions();
        if (!mounted) return;

        // Create a lightweight sync notification to inform user data loaded
        await notificationService.notifySyncSuccess(recurring.length);
      } catch (err) {
        console.error('❌ Error syncing recurring transactions:', err);
      }
    };

    sync();
    return () => { mounted = false; };
  }, [getRecurringTransactions, refreshTransactions]);

  const recurring = getRecurringTransactions();

  return (
    <SafeAreaView>
      <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>{t.recurringTransactions}</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.summaryCard, { backgroundColor: colors.background.secondary }]}>
            <Text style={[styles.summaryTop, { color: colors.text.secondary }]}>{t.monthlyTotal}</Text>
            <Text style={[styles.summaryAmount, { color: '#EF4444' }]}>-1 090 €</Text>
            <Text style={[styles.summarySub, { color: colors.text.secondary }]}>9 abonnements actifs</Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t.monthlySubscriptions}</Text>

          {recurring.map((s) => (
            <View key={s.id} style={[styles.subscriptionCard, { backgroundColor: colors.background.secondary }]}>
              <View style={styles.subLeft}>
                <View style={styles.iconBox}><Ionicons name="home" size={20} color={colors.primary[600]} /></View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={[styles.subTitle, { color: colors.text.primary }]}>{s.description || s.category}</Text>
                  <Text style={[styles.subDate, { color: colors.text.secondary }]}>{s.nextOccurrence || s.date || t.nextCharge}</Text>
                </View>
              </View>

              <View style={styles.subRight}>
                <Text style={[styles.subAmount, { color: colors.text.primary }]}>{s.amount ? String(s.amount) : ''}</Text>
                <Text style={[styles.subFreq, { color: colors.text.secondary }]}>Mensuel</Text>
              </View>
            </View>
          ))}

          {/* Add is handled in Transactions screen; recurring view shows only recurring items */}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  summaryCard: { borderRadius: 12, padding: 16, marginBottom: 16 },
  summaryTop: { fontSize: 13, fontWeight: '600' },
  summaryAmount: { fontSize: 18, fontWeight: '800', marginTop: 8 },
  summarySub: { fontSize: 13, marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  subscriptionCard: { borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  subLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  subTitle: { fontSize: 16, fontWeight: '700' },
  subDate: { fontSize: 13, marginTop: 6 },
  subRight: { alignItems: 'flex-end' },
  subAmount: { fontSize: 16, fontWeight: '800' },
  subFreq: { fontSize: 12, marginTop: 6 },
  addButton: { marginTop: 20, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  addButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});

export default RecurringTransactionsScreen;
