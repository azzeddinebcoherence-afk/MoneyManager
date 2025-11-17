// src/screens/AnnualChargesScreen.tsx - VERSION DESIGN MODERNE
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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

// Types pour la navigation
type NavigationProps = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

export const AnnualChargesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { 
    charges, 
    loading, 
    error, 
    deleteAnnualCharge, 
    togglePaidStatus,
    refreshAnnualCharges,
  } = useAnnualCharges();

  const [yearFilter, setYearFilter] = useState<number>(2025); // ✅ Défaut 2025
  const [filteredCharges, setFilteredCharges] = useState<AnnualCharge[]>([]);
  const [showYearModal, setShowYearModal] = useState(false);
  const [stats, setStats] = useState({
    totalAmount: 0,
    total: 0,
    paid: 0,
    pending: 0
  });

  const isDark = theme === 'dark';

  // ✅ Années de 2025 à 2030 uniquement
  const availableYears = [2025, 2026, 2027, 2028, 2029, 2030];

  // Filtrer et calculer les statistiques
  useEffect(() => {
    const filtered = charges.filter(charge => {
      const chargeYear = new Date(charge.dueDate).getFullYear();
      return chargeYear === yearFilter;
    });

    setFilteredCharges(filtered);

    // Calculer les statistiques
    const total = filtered.length;
    const paid = filtered.filter(c => c.isPaid).length;
    const pending = total - paid;
    const totalAmount = filtered.reduce((sum, charge) => sum + charge.amount, 0);

    setStats({ totalAmount, total, paid, pending });
  }, [charges, yearFilter]);

  // ✅ CORRECTION : Navigation avec types corrects
  const handleEditCharge = (chargeId: string) => {
    navigation.navigate('EditAnnualCharge', { chargeId });
  };

  const handleAddCharge = () => {
    navigation.navigate('AddAnnualCharge');
  };

  const handleDeleteCharge = (chargeId: string) => {
    Alert.alert(
      'Supprimer la charge',
      'Êtes-vous sûr de vouloir supprimer cette charge ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAnnualCharge(chargeId);
              Alert.alert('✅ Succès', 'Charge supprimée avec succès');
            } catch (error) {
              Alert.alert('❌ Erreur', 'Impossible de supprimer la charge');
            }
          },
        },
      ]
    );
  };

  const handleTogglePaid = async (chargeId: string, isPaid: boolean) => {
    try {
      await togglePaidStatus(chargeId, !isPaid);
      Alert.alert('✅ Succès', `Charge ${!isPaid ? 'marquée comme payée' : 'marquée comme non payée'}`);
    } catch (error: any) {
      Alert.alert('❌ Erreur', error.message || 'Impossible de modifier le statut');
    }
  };

  const getStatusColor = (charge: AnnualCharge) => {
    if (charge.isPaid) return '#10B981';
    const dueDate = new Date(charge.dueDate);
    const today = new Date();
    if (dueDate < today) return '#EF4444';
    return '#F59E0B';
  };

  const getStatusText = (charge: AnnualCharge) => {
    if (charge.isPaid) return '✅ Payé';
    const dueDate = new Date(charge.dueDate);
    const today = new Date();
    if (dueDate < today) return '⏰ En retard';
    return '📅 À venir';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderChargeItem = ({ item }: { item: AnnualCharge }) => (
    <View style={[styles.chargeCard, isDark && styles.darkChargeCard]}>
      <View style={styles.chargeHeader}>
        <View style={styles.chargeInfo}>
          <View style={styles.chargeTitleRow}>
            <Text style={[styles.chargeName, isDark && styles.darkText]}>
              {item.name}
            </Text>
            {item.isIslamic && (
              <View style={styles.islamicBadge}>
                <Ionicons name="star" size={12} color="#8B5CF6" />
              </View>
            )}
          </View>
          
          <Text style={[styles.chargeDate, isDark && styles.darkSubtext]}>
            {formatDate(item.dueDate)}
          </Text>
          
          {item.accountId && (
            <Text style={[styles.accountInfo, isDark && styles.darkSubtext]}>
              {item.autoDeduct ? '🔄 Prélèvement auto' : '👤 Paiement manuel'}
            </Text>
          )}
        </View>
        
        <View style={styles.chargeRightSection}>
          <Text style={[styles.chargeAmount, isDark && styles.darkText]}>
            {formatAmount(item.amount)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
            <Text style={styles.statusText}>
              {getStatusText(item)}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.chargeActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            item.isPaid ? styles.paidButton : styles.unpaidButton
          ]}
          onPress={() => handleTogglePaid(item.id, item.isPaid)}
        >
          <Ionicons 
            name={item.isPaid ? "checkmark-circle" : "ellipse-outline"} 
            size={16} 
            color={item.isPaid ? "#10B981" : "#6B7280"} 
          />
          <Text style={[
            styles.actionText,
            { color: item.isPaid ? "#10B981" : "#6B7280" }
          ]}>
            {item.isPaid ? 'Payé' : 'Marquer payé'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditCharge(item.id)}
        >
          <Ionicons name="create-outline" size={16} color="#3B82F6" />
          <Text style={[styles.actionText, { color: "#3B82F6" }]}>
            Modifier
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteCharge(item.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={[styles.actionText, { color: "#EF4444" }]}>
            Supprimer
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && charges.length === 0) {
    return (
      <SafeAreaView>
        <View style={[styles.container, isDark && styles.darkContainer, styles.center]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>
            Chargement des charges...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <View style={[styles.container, isDark && styles.darkContainer]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.darkText]}>
            Charges Annuelles
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshAnnualCharges}
          >
            <Ionicons name="refresh" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* ✅ FILTRE ANNÉE - DESIGN MODERNE */}
        <View style={styles.yearSection}>
          <Text style={[styles.yearLabel, isDark && styles.darkSubtext]}>
            Année sélectionnée
          </Text>
          <TouchableOpacity 
            style={[styles.yearSelector, isDark && styles.darkYearSelector]}
            onPress={() => setShowYearModal(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={isDark ? "#fff" : "#007AFF"} />
            <Text style={[styles.yearText, isDark && styles.darkText]}>
              {yearFilter}
            </Text>
            <Ionicons name="chevron-down" size={16} color={isDark ? "#fff" : "#666"} />
          </TouchableOpacity>
        </View>

        {/* ✅ MONTANT TOTAL EN HAUT - DESIGN MODERNE */}
        <View style={[styles.totalAmountCard, isDark && styles.darkTotalAmountCard]}>
          <View style={styles.totalAmountContent}>
            <Text style={[styles.totalAmountLabel, isDark && styles.darkSubtext]}>
              Montant Total
            </Text>
            <Text style={[styles.totalAmountValue, isDark && styles.darkText]}>
              {formatAmount(stats.totalAmount)}
            </Text>
            <Text style={[styles.chargeCount, isDark && styles.darkSubtext]}>
              {stats.total} charge{stats.total > 1 ? 's' : ''} • {yearFilter}
            </Text>
          </View>
          <View style={styles.totalAmountIcon}>
            <Ionicons name="wallet-outline" size={32} color="#007AFF" />
          </View>
        </View>

        {/* ✅ CARTES STATISTIQUES EN BAS - DESIGN MODERNE */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, isDark && styles.darkStatCard]}>
            <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
            </View>
            <View style={styles.statInfo}>
              <Text style={[styles.statValue, isDark && styles.darkText]}>
                {stats.total}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                Total
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, isDark && styles.darkStatCard]}>
            <View style={[styles.statIcon, { backgroundColor: '#F0F9F4' }]}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={[styles.statValue, isDark && styles.darkText]}>
                {stats.paid}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                Payées
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, isDark && styles.darkStatCard]}>
            <View style={[styles.statIcon, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="time-outline" size={20} color="#F59E0B" />
            </View>
            <View style={styles.statInfo}>
              <Text style={[styles.statValue, isDark && styles.darkText]}>
                {stats.pending}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                En attente
              </Text>
            </View>
          </View>
        </View>

        {/* Liste des charges */}
        {filteredCharges.length > 0 ? (
          <FlatList
            data={filteredCharges}
            renderItem={renderChargeItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            style={styles.list}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={80} color={isDark ? "#555" : "#ccc"} />
            <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
              Aucune charge pour {yearFilter}
            </Text>
            <Text style={[styles.emptySubtext, isDark && styles.darkSubtext]}>
              Commencez par ajouter votre première charge annuelle
            </Text>
            
            <TouchableOpacity 
              style={[styles.addButton, isDark && styles.darkAddButton]}
              onPress={handleAddCharge}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Nouvelle Charge</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bouton d'action flottant */}
        {filteredCharges.length > 0 && (
          <View style={styles.fabContainer}>
            <TouchableOpacity 
              style={[styles.fab, isDark && styles.darkFab]}
              onPress={handleAddCharge}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Modal de sélection d'année */}
        <Modal
          visible={showYearModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowYearModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
              <Text style={[styles.modalTitle, isDark && styles.darkText]}>
                Sélectionner l'année
              </Text>
              
              <View style={styles.yearsGrid}>
                {availableYears.map(year => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearOption,
                      year === yearFilter && styles.yearOptionSelected,
                      isDark && styles.darkYearOption
                    ]}
                    onPress={() => {
                      setYearFilter(year);
                      setShowYearModal(false);
                    }}
                  >
                    <Text style={[
                      styles.yearOptionText,
                      year === yearFilter && styles.yearOptionTextSelected,
                      isDark && styles.darkText
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.modalCloseButton, isDark && styles.darkModalCloseButton]}
                onPress={() => setShowYearModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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

  // ✅ SECTION ANNÉE - DESIGN MODERNE
  yearSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  yearLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  darkYearSelector: {
    backgroundColor: '#2c2c2e',
    borderColor: '#404040',
  },
  yearText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },

  // ✅ CARTE MONTANT TOTAL - DESIGN MODERNE
  totalAmountCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkTotalAmountCard: {
    backgroundColor: '#2c2c2e',
  },
  totalAmountContent: {
    flex: 1,
  },
  totalAmountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  totalAmountValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  chargeCount: {
    fontSize: 12,
    color: '#666',
  },
  totalAmountIcon: {
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },

  // ✅ CARTES STATISTIQUES - DESIGN MODERNE
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginBottom: 14,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 8,
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
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },

  // LISTE
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // CARTE CHARGE
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
    marginRight: 12,
  },
  chargeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  chargeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 8,
  },
  islamicBadge: {
    padding: 4,
    backgroundColor: '#F3E8FF',
    borderRadius: 4,
  },
  chargeDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  accountInfo: {
    fontSize: 11,
    color: '#666',
  },
  chargeRightSection: {
    alignItems: 'flex-end',
  },
  chargeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  chargeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 4,
  },
  paidButton: {
    backgroundColor: '#F0F9F4',
    borderColor: '#10B981',
  },
  unpaidButton: {
    backgroundColor: '#f8f9fa',
    borderColor: '#ddd',
  },
  editButton: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ÉTAT VIDE
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  darkAddButton: {
    backgroundColor: '#0A84FF',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // BOUTON FLOTTANT
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  fab: {
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

  // MODAL ANNÉE
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  darkModalContent: {
    backgroundColor: '#2c2c2e',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  yearOption: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  darkYearOption: {
    backgroundColor: '#38383a',
    borderColor: '#555',
  },
  yearOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  yearOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  yearOptionTextSelected: {
    color: '#fff',
  },
  modalCloseButton: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  darkModalCloseButton: {
    backgroundColor: '#38383a',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
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