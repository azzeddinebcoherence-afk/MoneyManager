// src/screens/AnnualChargesScreen.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
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
import { AnnualCharge } from '../types/AnnualCharge';

export const AnnualChargesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  
  const {
    charges,
    loading,
    error,
    getStats,
    refreshAnnualCharges,
    deleteAnnualCharge,
    togglePaidStatus,
    getChargesByStatus
  } = useAnnualCharges();

  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filteredCharges, setFilteredCharges] = useState<AnnualCharge[]>([]);

  const isDark = theme === 'dark';

  // ✅ GÉNÉRER LES ANNÉES DE 2025 À 2030
  const years = Array.from({ length: 6 }, (_, i) => 2025 + i);

  // ✅ CORRECTION : Charger les données au focus de l'écran
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedYear])
  );

  const loadData = async () => {
    try {
      setRefreshing(true);
      const chargesStats = await getStats();
      setStats(chargesStats);
      
      // Charger les charges filtrées
      await applyFilters();
    } catch (error) {
      console.error('Error loading annual charges data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const applyFilters = async () => {
    try {
      let filtered = await getChargesByStatus(selectedStatus);
      
      // ✅ FILTRER PAR ANNÉE
      filtered = filtered.filter(charge => {
        const chargeYear = new Date(charge.dueDate).getFullYear();
        return chargeYear === selectedYear;
      });
      
      setFilteredCharges(filtered);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  const handleRefresh = async () => {
    await loadData();
  };

  const handleStatusFilter = async (status: 'all' | 'paid' | 'pending') => {
    setSelectedStatus(status);
    await applyFilters();
  };

  const handleYearFilter = async (year: number) => {
    setSelectedYear(year);
    // Le useEffect se chargera du rechargement
  };

  const handleAddCharge = () => {
    navigation.navigate('AddAnnualCharge' as never);
  };

  const handleEditCharge = (chargeId: string) => {
    (navigation as any).navigate('EditAnnualCharge', { chargeId });
  };

  const handleTogglePaid = async (chargeId: string, isPaid: boolean) => {
    try {
      await togglePaidStatus(chargeId, isPaid);
      await loadData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le statut de paiement');
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
              await loadData();
              Alert.alert('Succès', 'Charge supprimée avec succès');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la charge');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (charge: AnnualCharge) => {
    if (charge.isPaid) return '#10B981';
    
    const dueDate = new Date(charge.dueDate);
    const today = new Date();
    
    if (dueDate < today) return '#EF4444';
    if (dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear()) {
      return '#F59E0B';
    }
    
    return '#6B7280';
  };

  const getStatusText = (charge: AnnualCharge) => {
    if (charge.isPaid) return 'Payée';
    
    const dueDate = new Date(charge.dueDate);
    const today = new Date();
    
    if (dueDate < today) return 'En retard';
    if (dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear()) {
      return 'Ce mois';
    }
    
    return 'À venir';
  };

  // ✅ FILTRES SIMPLIFIÉS
  const statusFilters = [
    { key: 'all' as const, label: 'Toutes', icon: '📋' },
    { key: 'pending' as const, label: 'En attente', icon: '⏳' },
    { key: 'paid' as const, label: 'Payées', icon: '✅' },
  ];

  // ✅ CALCULER LES STATISTIQUES POUR L'ANNÉE SÉLECTIONNÉE
  const getYearStats = () => {
    if (!charges.length) {
      return {
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        paidCount: 0,
        pendingCount: 0
      };
    }

    const yearCharges = charges.filter(charge => 
      new Date(charge.dueDate).getFullYear() === selectedYear
    );

    const totalAmount = yearCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const paidCharges = yearCharges.filter(charge => charge.isPaid);
    const paidAmount = paidCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const pendingAmount = totalAmount - paidAmount;

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      paidCount: paidCharges.length,
      pendingCount: yearCharges.length - paidCharges.length
    };
  };

  const yearStats = getYearStats();

  if (loading && !refreshing) {
    return (
      <SafeAreaView>
        <View style={[styles.container, isDark && styles.darkContainer, styles.center]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>
            Chargement des charges annuelles...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <ScrollView 
        style={[styles.container, isDark && styles.darkContainer]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor={isDark ? '#007AFF' : '#007AFF'}
          />
        }
      >
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.title, isDark && styles.darkText]}>
            Charges Annuelles
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddCharge}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* ✅ FILTRE PAR ANNÉE */}
        <View style={styles.yearFilterContainer}>
          <Text style={[styles.yearFilterLabel, isDark && styles.darkText]}>
            Année:
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.yearsScrollView}
          >
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearButton,
                  selectedYear === year && styles.yearButtonSelected,
                  isDark && styles.darkYearButton
                ]}
                onPress={() => handleYearFilter(year)}
              >
                <Text style={[
                  styles.yearButtonText,
                  selectedYear === year && styles.yearButtonTextSelected,
                  isDark && styles.darkText
                ]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ✅ MONTANT TOTAL EN HAUT */}
        <View style={[styles.totalAmountCard, isDark && styles.darkTotalAmountCard]}>
          <Text style={[styles.totalAmountLabel, isDark && styles.darkSubtext]}>
            Montant Total {selectedYear}
          </Text>
          <Text style={[styles.totalAmountValue, isDark && styles.darkText]}>
            {formatAmount(yearStats.totalAmount)}
          </Text>
        </View>

        {/* ✅ CARTES DE STATISTIQUES EN BAS */}
        <View style={styles.statsCardsContainer}>
          <View style={[styles.statCard, isDark && styles.darkStatCard]}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F5E8' }]}>
              <Text style={styles.statIconText}>✅</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, isDark && styles.darkText]}>
                {formatAmount(yearStats.paidAmount)}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                Payé ({yearStats.paidCount})
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, isDark && styles.darkStatCard]}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.statIconText}>⏳</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, isDark && styles.darkText]}>
                {formatAmount(yearStats.pendingAmount)}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                En attente ({yearStats.pendingCount})
              </Text>
            </View>
          </View>
        </View>

        {/* ✅ FILTRES DE STATUT SIMPLIFIÉS */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedStatus === filter.key && styles.filterButtonSelected,
                isDark && styles.darkFilterButton
              ]}
              onPress={() => handleStatusFilter(filter.key)}
            >
              <Text style={[
                styles.filterText,
                selectedStatus === filter.key && styles.filterTextSelected,
                isDark && styles.darkText
              ]}>
                {filter.icon} {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Liste des charges */}
        <View style={styles.chargesSection}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
            {selectedStatus === 'all' ? 'Toutes les charges' :
             selectedStatus === 'paid' ? 'Charges payées' : 'Charges en attente'}
            ({filteredCharges.length})
          </Text>

          {filteredCharges.length === 0 ? (
            <View style={[styles.emptyState, isDark && styles.darkEmptyState]}>
              <Ionicons name="calendar-outline" size={64} color={isDark ? '#555' : '#ccc'} />
              <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
                Aucune charge {selectedStatus !== 'all' ? statusFilters.find(f => f.key === selectedStatus)?.label.toLowerCase() : ''} en {selectedYear}
              </Text>
              <Text style={[styles.emptyDescription, isDark && styles.darkSubtext]}>
                {selectedStatus === 'all' 
                  ? `Commencez par ajouter votre première charge annuelle pour ${selectedYear}`
                  : `Aucune charge ${statusFilters.find(f => f.key === selectedStatus)?.label.toLowerCase()} pour ${selectedYear}`
                }
              </Text>
              {selectedStatus === 'all' && (
                <TouchableOpacity 
                  style={styles.addFirstButton}
                  onPress={handleAddCharge}
                >
                  <Text style={styles.addFirstButtonText}>
                    ➕ Ajouter une charge
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredCharges.map((charge) => (
              <View key={charge.id} style={[styles.chargeCard, isDark && styles.darkChargeCard]}>
                <View style={styles.chargeHeader}>
                  <View style={styles.chargeInfo}>
                    <Text style={[styles.chargeName, isDark && styles.darkText]}>
                      {charge.name}
                    </Text>
                    {charge.isIslamic && (
                      <View style={styles.islamicBadge}>
                        <Text style={styles.islamicBadgeText}>🕌 Islamique</Text>
                      </View>
                    )}
                    {charge.isRecurring && charge.recurrence && (
                      <View style={styles.recurrenceBadge}>
                        <Text style={styles.recurrenceBadgeText}>
                          🔄 {charge.recurrence === 'yearly' ? 'Annuelle' : 
                              charge.recurrence === 'monthly' ? 'Mensuelle' : 'Trimestrielle'}
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.chargeCategory, isDark && styles.darkSubtext]}>
                      {charge.category}
                    </Text>
                  </View>
                  <Text style={[styles.chargeAmount, isDark && styles.darkText]}>
                    {formatAmount(charge.amount)}
                  </Text>
                </View>

                <View style={styles.chargeDetails}>
                  <View style={styles.chargeMeta}>
                    <Text style={[styles.chargeDate, isDark && styles.darkSubtext]}>
                      📅 {new Date(charge.dueDate).toLocaleDateString('fr-FR')}
                    </Text>
                    <Text style={[styles.chargeStatus, { color: getStatusColor(charge) }]}>
                      {getStatusText(charge)}
                    </Text>
                    {charge.accountId && (
                      <Text style={[styles.chargeAccount, isDark && styles.darkSubtext]}>
                        💳 Compte associé
                      </Text>
                    )}
                  </View>

                  <View style={styles.chargeActions}>
                    {!charge.isPaid && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.payButton]}
                        onPress={() => handleTogglePaid(charge.id, true)}
                      >
                        <Text style={styles.actionButtonText}>💰 Payer</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEditCharge(charge.id)}
                    >
                      <Text style={styles.actionButtonText}>✏️ Modifier</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteCharge(charge.id, charge.name)}
                    >
                      <Text style={styles.actionButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {charge.notes && (
                  <Text style={[styles.chargeNotes, isDark && styles.darkSubtext]}>
                    📝 {charge.notes}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Bouton d'action flottant */}
        <TouchableOpacity 
          style={[styles.fab, isDark && styles.darkFab]}
          onPress={handleAddCharge}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
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
  headerLeft: {
    width: 40,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  addButton: {
    padding: 8,
    width: 40,
    alignItems: 'flex-end',
  },
  // ✅ FILTRE ANNÉE
  yearFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  yearFilterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 12,
  },
  yearsScrollView: {
    flex: 1,
  },
  yearButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  darkYearButton: {
    backgroundColor: '#2c2c2e',
    borderColor: '#444',
  },
  yearButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  yearButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  yearButtonTextSelected: {
    color: '#fff',
  },
  // ✅ MONTANT TOTAL
  totalAmountCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  darkTotalAmountCard: {
    backgroundColor: '#0A84FF',
  },
  totalAmountLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontWeight: '500',
  },
  totalAmountValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  // ✅ CARTES STATISTIQUES
  statsCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkStatCard: {
    backgroundColor: '#2c2c2e',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statIconText: {
    fontSize: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  // FILTRES
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  darkFilterButton: {
    backgroundColor: '#2c2c2e',
    borderColor: '#444',
  },
  filterButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextSelected: {
    color: '#fff',
  },
  // CHARGES
  chargesSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
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
    marginBottom: 12,
  },
  chargeInfo: {
    flex: 1,
  },
  chargeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  islamicBadge: {
    backgroundColor: '#E5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  islamicBadgeText: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '600',
  },
  recurrenceBadge: {
    backgroundColor: '#F0E5FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  recurrenceBadgeText: {
    fontSize: 10,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  chargeCategory: {
    fontSize: 14,
    color: '#666',
  },
  chargeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  chargeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  chargeMeta: {
    flex: 1,
  },
  chargeDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  chargeStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  chargeAccount: {
    fontSize: 11,
    color: '#666',
  },
  chargeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButton: {
    backgroundColor: '#10B981',
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  chargeNotes: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  darkEmptyState: {
    backgroundColor: '#2c2c2e',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  addFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default AnnualChargesScreen;