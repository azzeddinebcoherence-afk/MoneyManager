// src/screens/islamic/IslamicChargesScreen.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import IslamicChargeCard from '../../components/islamic/IslamicChargeCard';
import { SafeAreaView } from '../../components/SafeAreaView';
import { useCurrency } from '../../context/CurrencyContext';
import { useTheme } from '../../context/ThemeContext';
import { useIslamicCharges } from '../../hooks/useIslamicCharges';

export const IslamicChargesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { 
    islamicCharges, 
    settings, 
    loading,
    error,
    updateChargeAmount,
    markAsPaid,
    generateChargesForCurrentYear
  } = useIslamicCharges();
  
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const isDark = theme === 'dark';

  const totalAmount = islamicCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const paidAmount = islamicCharges
    .filter(charge => charge.isPaid)
    .reduce((sum, charge) => sum + charge.amount, 0);
  const pendingCharges = islamicCharges.filter(charge => !charge.isPaid);
  const paidCharges = islamicCharges.filter(charge => charge.isPaid);

  if (!settings.isEnabled) {
    return (
      <SafeAreaView>
        <View style={[styles.container, isDark && styles.darkContainer]}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
            </TouchableOpacity>
            <Text style={[styles.title, isDark && styles.darkText]}>
              Charges Islamiques
            </Text>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.disabledState}>
            <Ionicons name="star-outline" size={64} color={isDark ? "#555" : "#ccc"} />
            <Text style={[styles.disabledText, isDark && styles.darkText]}>
              Fonctionnalité désactivée
            </Text>
            <Text style={[styles.disabledDescription, isDark && styles.darkSubtext]}>
              Activez les charges islamiques dans les paramètres pour gérer les charges liées aux fêtes musulmanes
            </Text>
            <TouchableOpacity 
              style={[styles.enableButton, isDark && styles.darkEnableButton]}
              onPress={() => navigation.navigate('Settings' as never)}
            >
              <Text style={styles.enableButtonText}>Aller aux paramètres</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView>
        <View style={[styles.container, isDark && styles.darkContainer, styles.center]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>
            Chargement des charges islamiques...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <View style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.darkText]}>
            Charges Islamiques
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={generateChargesForCurrentYear}
          >
            <Ionicons name="refresh" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

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

        {/* Statistiques détaillées */}
        <View style={[styles.stats, isDark && styles.darkStats]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, isDark && styles.darkText]}>
              {islamicCharges.length}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
              Charges
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>
              {paidCharges.length}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
              Payées
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
              {pendingCharges.length}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
              En attente
            </Text>
          </View>
        </View>

        {/* Liste des charges */}
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {islamicCharges.length > 0 ? (
            islamicCharges.map(charge => (
              <IslamicChargeCard
                key={charge.id}
                charge={charge}
                onUpdateAmount={updateChargeAmount}
                onMarkAsPaid={markAsPaid}
                onAssignAccount={(chargeId: string, accountId: string, autoDeduct: boolean) => {
                  // Implémentation temporaire - à compléter dans useIslamicCharges
                  console.log('Assign account to charge:', { chargeId, accountId, autoDeduct });
                }}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={isDark ? '#555' : '#ccc'} />
              <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
                Aucune charge islamique cette année
              </Text>
              <Text style={[styles.emptySubtext, isDark && styles.darkSubtext]}>
                Les charges seront générées automatiquement selon le calendrier hijri
              </Text>
              <TouchableOpacity 
                style={styles.generateButton}
                onPress={generateChargesForCurrentYear}
              >
                <Text style={styles.generateButtonText}>Générer les charges</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Bouton d'action */}
        {islamicCharges.length > 0 && (
          <TouchableOpacity 
            style={[styles.fab, isDark && styles.darkFab]}
            onPress={generateChargesForCurrentYear}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  refreshButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  summary: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  stats: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkStats: {
    backgroundColor: '#2c2c2e',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  disabledState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  disabledText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  disabledDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  enableButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  darkEnableButton: {
    backgroundColor: '#0A84FF',
  },
  enableButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  generateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  darkFab: {
    backgroundColor: '#0A84FF',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default IslamicChargesScreen;