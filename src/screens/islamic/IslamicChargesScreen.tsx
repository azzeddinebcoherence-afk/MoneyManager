// src/screens/IslamicChargesScreen.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from '../../components/SafeAreaView';
import { useIslamicCharges } from '../../hooks/useIslamicCharges';
import IslamicChargeCard from '../../components/islamic/IslamicChargeCard';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';

export const IslamicChargesScreen: React.FC = () => {
  const { 
    islamicCharges, 
    settings, 
    isLoading,
    updateChargeAmount,
    markAsPaid
  } = useIslamicCharges(); 
  
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const isDark = theme === 'dark';

  const totalAmount = islamicCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const paidAmount = islamicCharges
    .filter(charge => charge.isPaid)
    .reduce((sum, charge) => sum + charge.amount, 0);

  if (!settings.isEnabled) {
    return (
      <SafeAreaView> 
        <View style={[styles.container, isDark && styles.darkContainer]}>
          <Text style={[styles.title, isDark && styles.darkText]}>
            Charges Islamiques
          </Text>
          <View style={styles.disabledState}>
            <Text style={[styles.disabledText, isDark && styles.darkSubtext]}>
              ⭐ La fonctionnalité charges islamiques est désactivée
            </Text>
            <Text style={[styles.disabledDescription, isDark && styles.darkSubtext]}>
              Activez-la dans les paramètres pour gérer les charges liées aux fêtes musulmanes
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <View style={[styles.container, isDark && styles.darkContainer]}>
        <Text style={[styles.title, isDark && styles.darkText]}>
          Charges Islamiques
        </Text>

        {/* Résumé */}
        <View style={[styles.summary, isDark && styles.darkSummary]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, isDark && styles.darkSubtext]}>
              Total
            </Text>
            <Text style={[styles.summaryValue, isDark && styles.darkText]}>
              {formatAmount(totalAmount)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, isDark && styles.darkSubtext]}>
              Payé
            </Text>
            <Text style={[styles.summaryValue, isDark && styles.darkText]}>
              {formatAmount(paidAmount)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, isDark && styles.darkSubtext]}>
              Restant
            </Text>
            <Text style={[styles.summaryValue, isDark && styles.darkText]}>
              {formatAmount(totalAmount - paidAmount)}
            </Text>
          </View>
        </View>

        {/* Liste des charges */}
        <ScrollView style={styles.list}>
          {islamicCharges.map(charge => (
            <IslamicChargeCard
              key={charge.id}
              charge={charge}
              onUpdateAmount={updateChargeAmount}
              onMarkAsPaid={markAsPaid}
            />
          ))}
        </ScrollView>

        {islamicCharges.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
              Aucune charge islamique cette année
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  darkContainer: {
    backgroundColor: '#1c1c1e',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  summary: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkSummary: {
    backgroundColor: '#2c2c2e',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  list: {
    flex: 1,
  },
  disabledState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  disabledText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  disabledDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default IslamicChargesScreen;
