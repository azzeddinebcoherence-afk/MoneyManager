// src/screens/DebtsScreen.tsx - VERSION MODERNISÉE
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import DebtForm from '../components/debts/DebtForm';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { useDebts } from '../hooks/useDebts';
import { Debt } from '../types/Debt';

const DebtsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const { debts, stats, createDebt, updateDebt, refreshDebts } = useDebts();
  const isDark = theme === 'dark';

  const [showDebtForm, setShowDebtForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | undefined>(undefined);
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'paid' | 'future'>('all');

  // Charger les dettes au démarrage
  useEffect(() => {
    refreshDebts();
  }, []);

  // Fonction de soumission unifiée
  const handleSubmitDebt = async (debtData: any) => {
    try {
      if (editingDebt) {
        await updateDebt(editingDebt.id, debtData);
      } else {
        await createDebt(debtData);
      }
      setShowDebtForm(false);
      setEditingDebt(undefined);
      await refreshDebts();
    } catch (error) {
      console.error('Erreur gestion dette:', error);
    }
  };

  // ✅ CORRECTION : Filtrage avec les nouveaux statuts
  const filteredDebts = debts.filter(debt => {
    switch (filter) {
      case 'active':
        return debt.status === 'active';
      case 'overdue':
        return debt.status === 'overdue';
      case 'paid':
        return debt.status === 'paid';
      case 'future':
        return debt.status === 'future';
      default:
        return true;
    }
  });

  // ✅ CORRECTION : Fonction pour obtenir le libellé du statut
  const getStatusLabel = (status: Debt['status']): string => {
    switch (status) {
      case 'active': return 'Active';
      case 'overdue': return 'En retard';
      case 'paid': return 'Payée';
      case 'future': return 'Future';
      default: return status;
    }
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: Debt['status']): string => {
    switch (status) {
      case 'active': return '#3B82F6';
      case 'overdue': return '#EF4444';
      case 'paid': return '#10B981';
      case 'future': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const renderDebtItem = ({ item }: { item: Debt }) => (
    <TouchableOpacity
      style={[styles.modernDebtCard, isDark && styles.darkModernDebtCard]}
      onPress={() => navigation.navigate('DebtDetail', { debtId: item.id })}
      activeOpacity={0.7}
    >
      {/* En-tête avec icône et nom */}
      <View style={styles.modernDebtHeader}>
        <View style={[styles.modernDebtIcon, { backgroundColor: item.color || '#007AFF' }]}>
          <Ionicons name="card" size={20} color="#fff" />
        </View>
        <View style={styles.modernDebtInfo}>
          <Text style={[styles.modernDebtName, isDark && styles.darkText]}>
            {item.name}
          </Text>
          <Text style={[styles.modernDebtCreditor, isDark && styles.darkSubtext]}>
            {item.creditor}
          </Text>
        </View>
        <Text style={[styles.modernDebtAmount, { color: '#EF4444' }]}>
          {formatAmount(item.currentAmount)}
        </Text>
      </View>

      {/* Barre de progression */}
      <View style={styles.modernProgressSection}>
        <View style={styles.modernProgressInfo}>
          <Text style={[styles.modernProgressLabel, isDark && styles.darkSubtext]}>
            Payé: {formatAmount(item.initialAmount - item.currentAmount)} / {formatAmount(item.initialAmount)}
          </Text>
        </View>
        <View style={[styles.modernProgressBar, isDark && styles.darkModernProgressBar]}>
          <View 
            style={[
              styles.modernProgressFill,
              { 
                width: `${Math.max(0, Math.min(100, ((item.initialAmount - item.currentAmount) / item.initialAmount) * 100))}%`,
                backgroundColor: getStatusColor(item.status)
              }
            ]} 
          />
        </View>
      </View>

      {/* Détails en bas */}
      <View style={styles.modernDebtFooter}>
        <View style={styles.modernDebtDetail}>
          <Text style={[styles.modernDetailLabel, isDark && styles.darkSubtext]}>
            Mensualité:
          </Text>
          <Text style={[styles.modernDetailValue, isDark && styles.darkText]}>
            {formatAmount(item.monthlyPayment)}
          </Text>
        </View>
        <View style={styles.modernDebtDetail}>
          <Text style={[styles.modernDetailLabel, isDark && styles.darkSubtext]}>
            Échéance:
          </Text>
          <Text style={[styles.modernDetailValue, isDark && styles.darkText]}>
            {new Date(item.dueDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
          </Text>
        </View>
      </View>

      {/* Avertissement d'éligibilité si nécessaire */}
      {item.paymentEligibility && !item.paymentEligibility.isEligible && (
        <View style={[
          styles.eligibilityWarning,
          isDark && styles.darkEligibilityWarning
        ]}>
          <Ionicons name="information-circle" size={14} color="#F59E0B" />
          <Text style={[
            styles.eligibilityText,
            isDark && styles.darkEligibilityText
          ]}>
            {item.paymentEligibility.reason}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      {/* Header moderne avec flèche retour */}
      <View style={[styles.modernHeader, isDark && styles.darkModernHeader]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>
        <Text style={[styles.modernTitle, isDark && styles.darkText]}>
          Dettes
        </Text>
      </View>

      <FlatList
        data={filteredDebts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshing={false}
        onRefresh={refreshDebts}
        ListHeaderComponent={() => (
          <>
            {/* Carte résumé total */}
            <View style={[styles.totalCard, isDark && styles.darkTotalCard]}>
              <Text style={[styles.totalLabel, isDark && styles.darkSubtext]}>
                Total des dettes
              </Text>
              <View style={styles.totalRow}>
                <Text style={[styles.totalCount, isDark && styles.darkSubtext]}>
                  {stats.totalDebt} dettes actives
                </Text>
                <Text style={[styles.totalAmount, { color: '#EF4444' }]}>
                  {formatAmount(stats.totalRemaining || 0)}
                </Text>
              </View>
            </View>

            {/* Section dettes en cours avec titre */}
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
              Dettes en cours
            </Text>

            {/* Filtres horizontaux modernisés */}
            <View style={styles.modernFilters}>
              <TouchableOpacity
                style={[
                  styles.modernFilterChip,
                  filter === 'all' && styles.modernFilterChipActive,
                  isDark && styles.darkModernFilterChip
                ]}
                onPress={() => setFilter('all')}
              >
                <Text style={[
                  styles.modernFilterText,
                  filter === 'all' && styles.modernFilterTextActive,
                  isDark && !filter && styles.darkText
                ]}>
                  Toutes
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modernFilterChip,
                  filter === 'active' && styles.modernFilterChipActive,
                  isDark && styles.darkModernFilterChip
                ]}
                onPress={() => setFilter('active')}
              >
                <Text style={[
                  styles.modernFilterText,
                  filter === 'active' && styles.modernFilterTextActive,
                  isDark && filter !== 'active' && styles.darkText
                ]}>
                  Actives
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modernFilterChip,
                  filter === 'overdue' && styles.modernFilterChipActive,
                  isDark && styles.darkModernFilterChip
                ]}
                onPress={() => setFilter('overdue')}
              >
                <Text style={[
                  styles.modernFilterText,
                  filter === 'overdue' && styles.modernFilterTextActive,
                  isDark && filter !== 'overdue' && styles.darkText
                ]}>
                  En retard
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modernFilterChip,
                  filter === 'future' && styles.modernFilterChipActive,
                  isDark && styles.darkModernFilterChip
                ]}
                onPress={() => setFilter('future')}
              >
                <Text style={[
                  styles.modernFilterText,
                  filter === 'future' && styles.modernFilterTextActive,
                  isDark && filter !== 'future' && styles.darkText
                ]}>
                  Futures
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modernFilterChip,
                  filter === 'paid' && styles.modernFilterChipActive,
                  isDark && styles.darkModernFilterChip
                ]}
                onPress={() => setFilter('paid')}
              >
                <Text style={[
                  styles.modernFilterText,
                  filter === 'paid' && styles.modernFilterTextActive,
                  isDark && filter !== 'paid' && styles.darkText
                ]}>
                  Payées
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        renderItem={renderDebtItem}
        contentContainerStyle={styles.modernListContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons 
              name="card-outline" 
              size={64} 
              color={isDark ? "#888" : "#666"} 
            />
            <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
              Aucune dette {filter !== 'all' ? `"${getStatusLabel(filter as Debt['status'])}"` : ''} trouvée
            </Text>
            <TouchableOpacity 
              style={[styles.emptyButton, isDark && styles.darkEmptyButton]}
              onPress={() => {
                setEditingDebt(undefined);
                setShowDebtForm(true);
              }}
            >
              <Text style={styles.emptyButtonText}>
                Ajouter une dette
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Bouton flottant d'ajout */}
      <TouchableOpacity 
        style={[styles.fab, isDark && styles.darkFab]}
        onPress={() => {
          setEditingDebt(undefined);
          setShowDebtForm(true);
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Formulaire */}
      <DebtForm
        visible={showDebtForm}
        onClose={() => {
          setShowDebtForm(false);
          setEditingDebt(undefined);
        }}
        onSubmit={handleSubmitDebt}
        editingDebt={editingDebt}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  darkContainer: {
    backgroundColor: '#000',
  },
  
  // Header moderne
  modernHeader: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  darkModernHeader: {
    backgroundColor: '#1c1c1e',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },

  // Carte total modernisée
  totalCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  darkTotalCard: {
    backgroundColor: '#1c1c1e',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalCount: {
    fontSize: 14,
    color: '#888',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Section titre
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginHorizontal: 16,
    marginBottom: 16,
  },

  // Filtres modernisés
  modernFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  modernFilterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  darkModernFilterChip: {
    backgroundColor: '#2c2c2e',
  },
  modernFilterChipActive: {
    backgroundColor: '#007AFF',
  },
  modernFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  modernFilterTextActive: {
    color: '#fff',
  },

  // Liste moderne
  modernListContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Carte dette modernisée
  modernDebtCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  darkModernDebtCard: {
    backgroundColor: '#1c1c1e',
  },
  modernDebtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernDebtIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modernDebtInfo: {
    flex: 1,
  },
  modernDebtName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  modernDebtCreditor: {
    fontSize: 13,
    color: '#666',
  },
  modernDebtAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Progression modernisée
  modernProgressSection: {
    marginBottom: 12,
  },
  modernProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modernProgressLabel: {
    fontSize: 12,
    color: '#888',
  },
  modernProgressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  darkModernProgressBar: {
    backgroundColor: '#2c2c2e',
  },
  modernProgressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Pied de carte modernisé
  modernDebtFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modernDebtDetail: {
    flex: 1,
  },
  modernDetailLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  modernDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },

  // Bouton flottant
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  darkFab: {
    backgroundColor: '#0A84FF',
  },

  // Avertissements
  eligibilityWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    gap: 6,
  },
  darkEligibilityWarning: {
    backgroundColor: '#453209',
  },
  eligibilityText: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
  },
  darkEligibilityText: {
    color: '#FBBF24',
  },

  // État vide
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  darkEmptyButton: {
    backgroundColor: '#0A84FF',
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Utilitaires
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default DebtsScreen;