// src/screens/IslamicChargesScreen.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import IslamicChargeCard from '../../components/islamic/IslamicChargeCard';
import { SafeAreaView } from '../../components/SafeAreaView';
import { useCurrency } from '../../context/CurrencyContext';
import { useTheme } from '../../context/ThemeContext';
import { useAccounts } from '../../hooks/useAccounts';
import { useIslamicCharges } from '../../hooks/useIslamicCharges';

export const IslamicChargesScreen: React.FC = () => {
  const { 
    islamicCharges, 
    settings, 
    isLoading,
    updateChargeAmount,
    markAsPaid,
    assignAccountToCharge,
    generateChargesForCurrentYear,
    loadChargesForCurrentYear
  } = useIslamicCharges(); 
  
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { accounts } = useAccounts();
  
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'obligatory' | 'recommended'>('all');

  const isDark = theme === 'dark';

  // Filtrer les charges selon le filtre sélectionné
  const filteredCharges = islamicCharges.filter(charge => {
    switch (filter) {
      case 'paid':
        return charge.isPaid;
      case 'pending':
        return !charge.isPaid;
      case 'obligatory':
        return charge.type === 'obligatory';
      case 'recommended':
        return charge.type === 'recommended';
      default:
        return true;
    }
  });

  const totalAmount = islamicCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const paidAmount = islamicCharges
    .filter(charge => charge.isPaid)
    .reduce((sum, charge) => sum + charge.amount, 0);
  
  const obligatoryCharges = islamicCharges.filter(charge => charge.type === 'obligatory');
  const obligatoryAmount = obligatoryCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const paidObligatoryAmount = obligatoryCharges
    .filter(charge => charge.isPaid)
    .reduce((sum, charge) => sum + charge.amount, 0);

  const handleUpdateAmount = async (chargeId: string, newAmount: number) => {
    try {
      await updateChargeAmount(chargeId, newAmount);
      Alert.alert('Succès', 'Montant mis à jour avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le montant');
    }
  };

  const handleMarkAsPaid = async (chargeId: string, accountId?: string) => {
    try {
      await markAsPaid(chargeId, accountId);
      Alert.alert('Succès', 'Charge marquée comme payée');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de marquer la charge comme payée');
    }
  };

  const handleAssignAccount = async (chargeId: string, accountId: string, autoDeduct: boolean) => {
    try {
      await assignAccountToCharge(chargeId, accountId, autoDeduct);
      Alert.alert('Succès', 'Compte assigné avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'assigner le compte');
    }
  };

  const handleGenerateCharges = async () => {
    try {
      await generateChargesForCurrentYear();
      Alert.alert('Succès', 'Charges islamiques générées pour cette année');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer les charges');
    }
  };

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

        {/* Actions rapides */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, isDark && styles.darkActionButton]}
            onPress={handleGenerateCharges}
            disabled={isLoading}
          >
            <Text style={[styles.actionButtonText, isDark && styles.darkText]}>
              🔄 Générer les charges
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, isDark && styles.darkActionButton]}
            onPress={loadChargesForCurrentYear}
            disabled={isLoading}
          >
            <Text style={[styles.actionButtonText, isDark && styles.darkText]}>
              📥 Recharger
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filtres */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'all' && styles.filterButtonActive,
              isDark && styles.darkFilterButton
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={[
              styles.filterText,
              filter === 'all' && styles.filterTextActive
            ]}>
              Toutes ({islamicCharges.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'pending' && styles.filterButtonActive,
              isDark && styles.darkFilterButton
            ]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[
              styles.filterText,
              filter === 'pending' && styles.filterTextActive
            ]}>
              En attente ({islamicCharges.filter(c => !c.isPaid).length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'paid' && styles.filterButtonActive,
              isDark && styles.darkFilterButton
            ]}
            onPress={() => setFilter('paid')}
          >
            <Text style={[
              styles.filterText,
              filter === 'paid' && styles.filterTextActive
            ]}>
              Payées ({islamicCharges.filter(c => c.isPaid).length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'obligatory' && styles.filterButtonActive,
              isDark && styles.darkFilterButton
            ]}
            onPress={() => setFilter('obligatory')}
          >
            <Text style={[
              styles.filterText,
              filter === 'obligatory' && styles.filterTextActive
            ]}>
              Obligatoires ({obligatoryCharges.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'recommended' && styles.filterButtonActive,
              isDark && styles.darkFilterButton
            ]}
            onPress={() => setFilter('recommended')}
          >
            <Text style={[
              styles.filterText,
              filter === 'recommended' && styles.filterTextActive
            ]}>
              Recommandées
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Résumé */}
        <View style={[styles.summary, isDark && styles.darkSummary]}>
          <View style={styles.summaryRow}>
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
          
          {obligatoryCharges.length > 0 && (
            <View style={styles.obligatorySummary}>
              <Text style={[styles.obligatoryTitle, isDark && styles.darkText]}>
                Obligatoires: {formatAmount(paidObligatoryAmount)} / {formatAmount(obligatoryAmount)}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${obligatoryAmount > 0 ? (paidObligatoryAmount / obligatoryAmount) * 100 : 0}%` }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>

        {/* Liste des charges */}
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {filteredCharges.map(charge => (
            <IslamicChargeCard
              key={charge.id}
              charge={charge}
              onUpdateAmount={handleUpdateAmount}
              onMarkAsPaid={handleMarkAsPaid}
              onAssignAccount={handleAssignAccount}
            />
          ))}
        </ScrollView>

        {filteredCharges.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
              {filter === 'all' 
                ? 'Aucune charge islamique cette année' 
                : `Aucune charge ${filter} cette année`}
            </Text>
            <TouchableOpacity 
              style={[styles.generateButton, isDark && styles.darkGenerateButton]}
              onPress={handleGenerateCharges}
            >
              <Text style={styles.generateButtonText}>
                Générer les charges de cette année
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingState}>
            <Text style={[styles.loadingText, isDark && styles.darkSubtext]}>
              Chargement des charges islamiques...
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
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  darkActionButton: {
    backgroundColor: '#2c2c2e',
    borderColor: '#444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  darkFilterButton: {
    backgroundColor: '#2c2c2e',
    borderColor: '#444',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  summary: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  obligatorySummary: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  obligatoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
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
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  darkGenerateButton: {
    backgroundColor: '#0A84FF',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
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