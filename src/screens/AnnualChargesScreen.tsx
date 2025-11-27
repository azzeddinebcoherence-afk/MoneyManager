// src/screens/AnnualChargesScreen.tsx - VERSION SIMPLIFIÉE SANS CHARGES ISLAMIQUES
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { useCurrency } from '../context/CurrencyContext';
import { useRefresh } from '../context/RefreshContext';
import { useDesignSystem, useTheme } from '../context/ThemeContext';
import { useAnnualCharges } from '../hooks/useAnnualCharges';
import { useLanguage } from '../context/LanguageContext';
import { AnnualCharge } from '../types/AnnualCharge';

export const AnnualChargesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useDesignSystem();
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { 
    charges, 
    loading, 
    error, 
    getStats, 
    refreshAnnualCharges,
    togglePaidStatus,
    payCharge
  } = useAnnualCharges();

  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'paid' | 'pending' | 'upcoming'>('all');
  const [filteredCharges, setFilteredCharges] = useState<any[]>([]);

  const currentYear = new Date().getFullYear();
  const isDark = theme === 'dark';

  // ✅ CHARGER LES DONNÉES
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Chargement des statistiques...');
      const chargesStats = await getStats();
      setStats(chargesStats);
    } catch (error) {
      console.error('Error loading annual charges data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [getStats]);

  // ✅ CHARGER AU MOUNT
  useEffect(() => {
    loadData();
  }, []);

  // ✅ APPLIQUER FILTRES QUAND CHARGES OU STATUS CHANGENT
  useEffect(() => {
    if (!charges) {
      setFilteredCharges([]);
      return;
    }

    const filtered = charges.filter(charge => {
      if (selectedStatus === 'paid') {
        return charge.isPaid;
      } else if (selectedStatus === 'pending') {
        return !charge.isPaid;
      } else if (selectedStatus === 'upcoming') {
        const today = new Date();
        const dueDate = new Date(charge.dueDate);
        return !charge.isPaid && dueDate > today;
      }
      return true; // 'all'
    });
    
    setFilteredCharges(filtered);
  }, [charges, selectedStatus]);

  // ✅ PULL TO REFRESH
  const handlePullToRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAnnualCharges();
      const chargesStats = await getStats();
      setStats(chargesStats);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshAnnualCharges, getStats]);

  // ✅ HELPERS POUR ICÔNES ET COULEURS
  const getCategoryIcon = (category: string): string => {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('habitation') || categoryLower.includes('logement')) return 'home';
    if (categoryLower.includes('transport') || categoryLower.includes('voiture')) return 'car';
    if (categoryLower.includes('santé') || categoryLower.includes('medical')) return 'medical';
    if (categoryLower.includes('éducation') || categoryLower.includes('école')) return 'school';
    if (categoryLower.includes('loisir') || categoryLower.includes('divertissement')) return 'game-controller';
    if (categoryLower.includes('professionnel') || categoryLower.includes('travail')) return 'briefcase';
    if (categoryLower.includes('technologie') || categoryLower.includes('internet')) return 'phone-portrait';
    if (categoryLower.includes('autre')) return 'ellipsis-horizontal';
    
    return 'card';
  };

  const getCategoryColor = (category: string): string => {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('habitation') || categoryLower.includes('logement')) return '#10B981';
    if (categoryLower.includes('transport') || categoryLower.includes('voiture')) return '#3B82F6';
    if (categoryLower.includes('santé') || categoryLower.includes('medical')) return '#EF4444';
    if (categoryLower.includes('éducation') || categoryLower.includes('école')) return '#F59E0B';
    if (categoryLower.includes('loisir') || categoryLower.includes('divertissement')) return '#8B5CF6';
    if (categoryLower.includes('professionnel') || categoryLower.includes('travail')) return '#6B7280';
    if (categoryLower.includes('technologie') || categoryLower.includes('internet')) return '#06B6D4';
    if (categoryLower.includes('autre')) return '#9CA3AF';
    
    return colors.primary[500];
  };

  // ✅ ACTIONS
  const handleTogglePaid = async (chargeId: string, currentStatus: boolean) => {
    try {
      await togglePaidStatus(chargeId, !currentStatus);
      await loadData(); // Recharger les stats
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le statut');
    }
  };

  const handlePayCharge = async (chargeId: string) => {
    Alert.alert(
      'Payer la charge',
      'Voulez-vous payer cette charge maintenant ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Payer',
          onPress: async () => {
            try {
              await payCharge(chargeId);
              await loadData();
              Alert.alert('✅ Payé', 'Charge payée avec succès');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de payer la charge');
            }
          }
        }
      ]
    );
  };

  // ✅ RENDER CHARGE CARD
  const renderChargeCard = ({ item: charge }: { item: AnnualCharge }) => {
    const dueDate = new Date(charge.dueDate);
    const isOverdue = !charge.isPaid && dueDate < new Date();
    const categoryColor = getCategoryColor(charge.category);
    const categoryIcon = getCategoryIcon(charge.category);

    return (
      <View style={[styles.modernChargeCard, { backgroundColor: colors.background.card }]}>
        <View style={styles.modernCardContent}>
          {/* En-tête avec icône et infos */}
          <View style={styles.modernCardHeader}>
            <View style={[styles.modernCategoryIcon, { backgroundColor: `${categoryColor}20` }]}>
              <Ionicons name={categoryIcon as any} size={20} color={categoryColor} />
            </View>
            <View style={styles.modernChargeInfo}>
              <Text style={[styles.modernChargeName, { color: colors.text.primary }]} numberOfLines={1}>
                {charge.name}
              </Text>
              <Text style={[styles.modernChargeCategory, { color: colors.text.secondary }]}>
                {charge.category}
              </Text>
            </View>
            <View style={styles.modernChargeAmount}>
              <Text style={[styles.modernAmountText, { color: colors.text.primary }]}>
                {formatAmount(charge.amount)}
              </Text>
              <Text style={[styles.modernDueDate, { 
                color: isOverdue ? '#EF4444' : colors.text.secondary 
              }]}>
                {dueDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.modernCardActions}>
            {charge.isPaid ? (
              <View style={[styles.modernPaidBadge, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={[styles.modernPaidText, { color: '#10B981' }]}>Payé</Text>
              </View>
            ) : (
              <View style={styles.modernActionButtons}>
                <TouchableOpacity
                  style={[styles.modernActionButton, { backgroundColor: colors.primary[100] }]}
                  onPress={() => handlePayCharge(charge.id)}
                >
                  <Ionicons name="card" size={16} color={colors.primary[500]} />
                  <Text style={[styles.modernActionText, { color: colors.primary[500] }]}>
                    Payer
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modernActionButton, { backgroundColor: '#10B98120' }]}
                  onPress={() => handleTogglePaid(charge.id, charge.isPaid)}
                >
                  <Ionicons name="checkmark" size={16} color="#10B981" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Badge en retard */}
        {isOverdue && (
          <View style={styles.modernOverdueBadge}>
            <Text style={styles.modernOverdueText}>En retard</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Chargement des charges annuelles...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Charges Annuelles {currentYear}
        </Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddAnnualCharge' as never)}
        >
          <Ionicons name="add" size={24} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Statistiques */}
      {stats && (
        <View style={[styles.statsContainer, { backgroundColor: colors.background.card }]}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary[500] }]}>
                {formatAmount(stats.totalAmount)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Total
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>
                {formatAmount(stats.paidAmount)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Payé
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                {formatAmount(stats.pendingAmount)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Restant
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Filtres */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.background.card }]}>
        <View style={styles.filtersRow}>
          {[
            { key: 'all', label: 'Toutes', icon: 'list' },
            { key: 'pending', label: 'En attente', icon: 'time' },
            { key: 'paid', label: 'Payées', icon: 'checkmark-circle' },
            { key: 'upcoming', label: 'Prochaines', icon: 'calendar' }
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedStatus === filter.key 
                    ? colors.primary[500] 
                    : colors.background.secondary
                }
              ]}
              onPress={() => setSelectedStatus(filter.key as any)}
            >
              <Ionicons 
                name={filter.icon as any} 
                size={16} 
                color={selectedStatus === filter.key ? 'white' : colors.text.secondary} 
              />
              <Text style={[
                styles.filterText,
                {
                  color: selectedStatus === filter.key ? 'white' : colors.text.secondary
                }
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Liste des charges */}
      <FlatList
        data={filteredCharges}
        renderItem={renderChargeCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handlePullToRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color={colors.text.secondary} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              Aucune charge trouvée
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.text.secondary }]}>
              {selectedStatus === 'all' 
                ? 'Commencez par ajouter vos premières charges annuelles'
                : `Aucune charge ${selectedStatus === 'paid' ? 'payée' : selectedStatus === 'pending' ? 'en attente' : 'prochaine'} trouvée`
              }
            </Text>
          </View>
        }
      />

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: '#FEE2E2' }]}>
          <Text style={[styles.errorText, { color: '#DC2626' }]}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  statsContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  filtersContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
  },
  modernChargeCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  modernCardContent: {
    padding: 16,
  },
  modernCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernCategoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernChargeInfo: {
    flex: 1,
  },
  modernChargeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  modernChargeCategory: {
    fontSize: 14,
  },
  modernChargeAmount: {
    alignItems: 'flex-end',
  },
  modernAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  modernDueDate: {
    fontSize: 12,
  },
  modernCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modernPaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  modernPaidText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modernActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modernActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  modernActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modernOverdueBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modernOverdueText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  errorContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default AnnualChargesScreen;