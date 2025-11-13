// src/screens/AnnualChargesScreen.tsx - VERSION CORRIGÉE
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { useAnnualCharges } from '../hooks/useAnnualCharges';

const AnnualChargesScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { 
    charges, // ✅ CORRECTION : Utiliser 'charges' au lieu de 'annualCharges'
    loading, // ✅ CORRECTION : Utiliser 'loading' au lieu de 'isLoading'
    getStats,
    deleteAnnualCharge,
    refreshAnnualCharges
  } = useAnnualCharges();

  const [stats, setStats] = useState({
    totalCharges: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    loadStats();
  }, [charges]);

  const loadStats = async () => {
    try {
      const statsData = await getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleDeleteCharge = (chargeId: string, chargeName: string) => {
    Alert.alert(
      'Supprimer la charge',
      `Êtes-vous sûr de vouloir supprimer "${chargeName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAnnualCharge(chargeId);
              Alert.alert('Succès', 'Charge supprimée avec succès');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la charge');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    await refreshAnnualCharges();
  };

  return (
    <SafeAreaView>
      <View style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.darkText]}>
            Charges Annuelle
          </Text>
          <TouchableOpacity 
            style={[styles.addButton, isDark && styles.darkAddButton]}
            onPress={() => navigation.navigate('AddAnnualCharge')}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Statistiques */}
        <View style={[styles.statsCard, isDark && styles.darkStatsCard]}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
              Total
            </Text>
            <Text style={[styles.statValue, isDark && styles.darkText]}>
              {formatAmount(stats.totalAmount)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
              Payé
            </Text>
            <Text style={[styles.statValue, isDark && styles.darkText]}>
              {formatAmount(stats.paidAmount)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
              En attente
            </Text>
            <Text style={[styles.statValue, isDark && styles.darkText]}>
              {formatAmount(stats.pendingAmount)}
            </Text>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, isDark && styles.darkActionButton]}
            onPress={() => navigation.navigate('AddAnnualCharge')}
          >
            <Text style={[styles.actionText, isDark && styles.darkText]}>
              ➕ Nouvelle charge
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, isDark && styles.darkActionButton]}
            onPress={handleRefresh}
            disabled={loading}
          >
            <Text style={[styles.actionText, isDark && styles.darkText]}>
              🔄 Actualiser
            </Text>
          </TouchableOpacity>
        </View>

        {/* Liste des charges */}
        <ScrollView style={styles.chargesList}>
          {charges.map((charge) => (
            <TouchableOpacity
              key={charge.id}
              style={[styles.chargeCard, isDark && styles.darkChargeCard]}
              onPress={() => navigation.navigate('EditAnnualCharge', { chargeId: charge.id })}
              onLongPress={() => handleDeleteCharge(charge.id, charge.name)}
            >
              <View style={styles.chargeHeader}>
                <Text style={[styles.chargeName, isDark && styles.darkText]}>
                  {charge.name}
                </Text>
                <Text style={[
                  styles.chargeAmount,
                  isDark && styles.darkText
                ]}>
                  {formatAmount(charge.amount)}
                </Text>
              </View>
              
              <View style={styles.chargeDetails}>
                <Text style={[styles.chargeCategory, isDark && styles.darkSubtext]}>
                  {charge.category}
                </Text>
                <Text style={[styles.chargeDate, isDark && styles.darkSubtext]}>
                  📅 {new Date(charge.dueDate).toLocaleDateString('fr-FR')}
                </Text>
              </View>

              <View style={styles.chargeFooter}>
                <View style={[
                  styles.statusBadge,
                  charge.isPaid ? styles.paidBadge : styles.pendingBadge
                ]}>
                  <Text style={styles.statusText}>
                    {charge.isPaid ? '✅ Payé' : '⏳ En attente'}
                  </Text>
                </View>
                
                {charge.accountId && (
                  <Text style={[styles.accountInfo, isDark && styles.darkSubtext]}>
                    💳 Compte associé
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {charges.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
              Aucune charge annuelle
            </Text>
            <TouchableOpacity 
              style={[styles.addFirstButton, isDark && styles.darkAddFirstButton]}
              onPress={() => navigation.navigate('AddAnnualCharge')}
            >
              <Text style={styles.addFirstButtonText}>
                Ajouter votre première charge
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <View style={styles.loadingState}>
            <Text style={[styles.loadingText, isDark && styles.darkSubtext]}>
              Chargement des charges...
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkAddButton: {
    backgroundColor: '#0A84FF',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsCard: {
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
  darkStatsCard: {
    backgroundColor: '#2c2c2e',
  },
  statItem: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  chargesList: {
    flex: 1,
  },
  chargeCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkChargeCard: {
    backgroundColor: '#2c2c2e',
  },
  chargeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  chargeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  chargeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  chargeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chargeCategory: {
    fontSize: 14,
    color: '#666',
  },
  chargeDate: {
    fontSize: 12,
    color: '#666',
  },
  chargeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paidBadge: {
    backgroundColor: '#E5F3FF',
  },
  pendingBadge: {
    backgroundColor: '#FFE5E5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  accountInfo: {
    fontSize: 11,
    color: '#666',
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
  addFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  darkAddFirstButton: {
    backgroundColor: '#0A84FF',
  },
  addFirstButtonText: {
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

export default AnnualChargesScreen;