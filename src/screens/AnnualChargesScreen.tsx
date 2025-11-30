import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { useAnnualCharges } from '../hooks/useAnnualCharges';
import { recurrenceService } from '../services/recurrenceService';
import { AnnualCharge } from '../types/AnnualCharge';

type FilterType = 'all' | 'pending' | 'paid' | 'upcoming';

interface AnnualChargesScreenProps {
  navigation: any;
}

export default function AnnualChargesScreen({ navigation }: AnnualChargesScreenProps) {
  const { designSystem } = useTheme();
  const colors = designSystem.colors;
  const { formatAmount } = useCurrency();
  const { 
    charges, 
    loading, 
    error,
    refreshAnnualCharges,
    updateAnnualCharge,
    deleteAnnualCharge,
    processAutoDeductCharges
  } = useAnnualCharges();
  
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Charger les données au focus de l'écran (hook unique)
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await refreshAnnualCharges();
        
        // Traiter les récurrences des charges payées
        try {
          const recurringResult = await recurrenceService.processRecurringCharges();
          if (recurringResult.processed > 0) {
            console.log(`✅ Created ${recurringResult.processed} recurring charge occurrences`);
            await refreshAnnualCharges(); // Recharger pour afficher les nouvelles occurrences
          }
        } catch (error) {
          console.error('Error processing recurring charges:', error);
        }
        
        // Traiter les prélèvements automatiques après chargement
        if (processAutoDeductCharges) {
          try {
            const result = await processAutoDeductCharges();
            if (result.processed > 0) {
              console.log(`✅ Processed ${result.processed} auto-deduct charges`);
            }
          } catch (error) {
            console.error('Error processing auto-deduct:', error);
          }
        }
      };
      loadData();
    }, [refreshAnnualCharges, processAutoDeductCharges])
  );

  // Filtres disponibles avec compteurs et montants
  const filters = useMemo(() => {
    const now = new Date();
    
    // Calculer les montants pour chaque catégorie
    const allTotal = charges.reduce((sum, c) => sum + c.amount, 0);
    const pendingCharges = charges.filter(c => !c.isPaid && new Date(c.dueDate) <= now);
    const pendingTotal = pendingCharges.reduce((sum, c) => sum + c.amount, 0);
    const paidCharges = charges.filter(c => c.isPaid);
    const paidTotal = paidCharges.reduce((sum, c) => sum + c.amount, 0);
    const upcomingCharges = charges.filter(c => !c.isPaid && new Date(c.dueDate) > now);
    const upcomingTotal = upcomingCharges.reduce((sum, c) => sum + c.amount, 0);
    
    return [
      { 
        key: 'all' as FilterType, 
        label: 'Toutes', 
        count: charges.length, 
        icon: 'list-outline',
        amount: allTotal
      },
      { 
        key: 'pending' as FilterType, 
        label: 'En attente', 
        count: pendingCharges.length,
        icon: 'time-outline',
        amount: pendingTotal
      },
      { 
        key: 'paid' as FilterType, 
        label: 'Payées', 
        count: paidCharges.length,
        icon: 'checkmark-circle-outline',
        amount: paidTotal
      },
      { 
        key: 'upcoming' as FilterType, 
        label: 'À venir', 
        count: upcomingCharges.length,
        icon: 'calendar-outline',
        amount: upcomingTotal
      }
    ];
  }, [charges]);

  // Filtrage des charges
  const filteredCharges = useMemo(() => {
    if (!charges) return [];
    
    const now = new Date();
    
    switch (selectedFilter) {
      case 'pending':
        return charges.filter(charge => !charge.isPaid && new Date(charge.dueDate) <= now);
      case 'paid':
        return charges.filter(charge => charge.isPaid);
      case 'upcoming':
        return charges.filter(charge => !charge.isPaid && new Date(charge.dueDate) > now);
      default:
        return charges;
    }
  }, [charges, selectedFilter]);

  // Calculer les statistiques pour la carte budget
  const budgetCard = useMemo(() => {
    if (!charges || charges.length === 0) return null;

    const currentYear = new Date().getFullYear();
    const chargesThisYear = charges.filter(c => new Date(c.dueDate).getFullYear() === currentYear);
    if (chargesThisYear.length === 0) return { totalCharges: 0, paidAmount: 0, remainingAmount: 0 };

    const totalCharges = chargesThisYear.reduce((sum, charge) => sum + charge.amount, 0);
    const paidAmount = chargesThisYear.filter(c => c.isPaid).reduce((sum, charge) => sum + charge.amount, 0);
    const remainingAmount = totalCharges - paidAmount;

    return {
      totalCharges,
      paidAmount,
      remainingAmount
    };
  }, [charges]);

  // Gestion de l'auto-déduction
  const handleAutoDeductToggle = useCallback(async (charge: AnnualCharge, enabled: boolean) => {
    try {
      await updateAnnualCharge(charge.id, { autoDeduct: enabled });
      Alert.alert(
        'Succès',
        enabled ? 'Prélèvement automatique activé' : 'Prélèvement automatique désactivé'
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le prélèvement automatique');
    }
  }, [updateAnnualCharge]);

  const handleDelete = useCallback((charge: AnnualCharge) => {
    Alert.alert(
      'Supprimer la charge',
      `Êtes-vous sûr de vouloir supprimer "${charge.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAnnualCharge(charge.id);
              await refreshAnnualCharges();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la charge');
            }
          }
        }
      ]
    );
  }, [deleteAnnualCharge, refreshAnnualCharges]);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAnnualCharges();
      
      // Traiter les récurrences
      await recurrenceService.processRecurringCharges();
      
      // Traiter les prélèvements automatiques
      if (processAutoDeductCharges) {
        await processAutoDeductCharges();
      }
      
      // Recharger pour afficher les changements
      await refreshAnnualCharges();
    } catch (error) {
      console.error('Error refreshing:', error);
    }
    setRefreshing(false);
  }, [refreshAnnualCharges, processAutoDeductCharges]);

  // Obtenir l'icône de catégorie
  const getCategoryIcon = (category: string): string => {
    const iconMap: { [key: string]: string } = {
      'Logement': 'home-outline',
      'Transport': 'car-outline',
      'Assurance': 'shield-checkmark-outline',
      'Santé': 'medical-outline',
      'Education': 'school-outline',
      'Loisirs': 'game-controller-outline',
      'Autres': 'ellipsis-horizontal-outline'
    };
    return iconMap[category] || 'document-outline';
  };

  // Obtenir la couleur de statut
  const getStatusColor = (charge: AnnualCharge) => {
    const successColor = '#10B981';
    const errorColor = '#EF4444';
    const warningColor = '#F59E0B';
    const secondaryColor = colors.neutral?.[500] || '#6B7280';
    
    if (charge.isPaid) return successColor;
    const now = new Date();
    const dueDate = new Date(charge.dueDate);
    
    if (dueDate < now) return errorColor;
    if (dueDate.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000) return warningColor;
    return secondaryColor;
  };

  // Obtenir les couleurs sûres
  const safeColors = {
    background: colors.background?.[50] || '#FFFFFF',
    card: colors.background?.[100] || '#F9FAFB',
    border: colors.neutral?.[200] || '#E5E7EB',
    primary: colors.primary?.[500] || '#007AFF',
    text: {
      primary: colors.neutral?.[900] || '#111827',
      secondary: colors.neutral?.[600] || '#6B7280'
    },
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444'
  };

  // Composant carte de charge
  const ChargeCard = ({ charge }: { charge: AnnualCharge }) => (
    <View
      style={[styles.chargeCard, { backgroundColor: safeColors.card, borderColor: safeColors.border }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconContainer, { backgroundColor: safeColors.primary + '20' }]}>
            <Ionicons 
              name={getCategoryIcon(charge.category) as any}
              size={24}
              color={safeColors.primary}
            />
          </View>
          <View style={styles.chargeInfo}>
            <View style={styles.chargeNameRow}>
              <Text style={[styles.chargeName, { color: safeColors.text.primary }]} numberOfLines={1}>
                {charge.name}
              </Text>
              {charge.isRecurring && charge.recurrence && (
                <View style={[styles.recurrenceBadge, { backgroundColor: '#8B5CF6' + '15', borderWidth: 1, borderColor: '#8B5CF6' + '40' }]}>
                  <Ionicons name="repeat" size={12} color="#8B5CF6" />
                  <Text style={[styles.recurrenceText, { color: '#8B5CF6' }]}>
                    {charge.recurrence === 'monthly' ? '📅 Mensuel' : 
                     charge.recurrence === 'quarterly' ? '📅 Trimestriel' : 
                     '📅 Annuel'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.chargeCategory, { color: safeColors.text.secondary }]}>
              {charge.category}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardRight}>
          <Text style={[styles.chargeAmount, { color: safeColors.text.primary }]}>
            {formatAmount(charge.amount)}
          </Text>
          <Text style={[styles.chargeDueDate, { color: getStatusColor(charge) }]}>
            {new Date(charge.dueDate).toLocaleDateString('fr-FR', { 
              day: '2-digit', 
              month: 'short' 
            })}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.badgesContainer}>
          {charge.autoDeduct && charge.accountId && (
            <View style={[styles.infoBadge, { backgroundColor: '#10B981' + '15', borderWidth: 1, borderColor: '#10B981' + '40' }]}>
              <Ionicons name="flash" size={12} color="#10B981" />
              <Text style={[styles.infoBadgeText, { color: '#10B981' }]}>Auto</Text>
            </View>
          )}
          {charge.isPaid && (
            <View style={[styles.infoBadge, { backgroundColor: safeColors.success + '20', borderWidth: 1, borderColor: safeColors.success + '40' }]}>
              <Ionicons name="checkmark-circle" size={12} color={safeColors.success} />
              <Text style={[styles.infoBadgeText, { color: safeColors.success }]}>Payée</Text>
            </View>
          )}
          <View style={[styles.infoBadge, { backgroundColor: safeColors.primary + '15', borderWidth: 1, borderColor: safeColors.primary + '40' }]}>
            <Ionicons name="calendar-outline" size={12} color={safeColors.primary} />
            <Text style={[styles.infoBadgeText, { color: safeColors.primary }]}>Annuel</Text>
          </View>
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: safeColors.primary + '15' }]}
            onPress={() => navigation.navigate('EditAnnualCharge', { chargeId: charge.id })}
          >
            <Ionicons name="create-outline" size={18} color={safeColors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: safeColors.error + '15' }]}
            onPress={() => handleDelete(charge)}
          >
            <Ionicons name="trash-outline" size={18} color={safeColors.error} />
          </TouchableOpacity>
          <Switch
            value={charge.autoDeduct || false}
            onValueChange={(enabled) => handleAutoDeductToggle(charge, enabled)}
            trackColor={{ false: safeColors.border, true: safeColors.primary + '30' }}
            thumbColor={charge.autoDeduct ? safeColors.primary : safeColors.text.secondary}
            style={styles.switchStyle}
          />
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: safeColors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={safeColors.primary} />
          <Text style={[styles.loadingText, { color: safeColors.text.secondary }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: safeColors.background }]} edges={['top']}>
      {/* En-tête avec bouton d'ajout */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: safeColors.text.primary }]}>
          Charges Annuelles
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: safeColors.primary }]}
          onPress={() => navigation.navigate('AddAnnualCharge')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Message informatif */}
      <View style={[styles.infoMessage, { backgroundColor: safeColors.primary + '10', borderColor: safeColors.primary + '30' }]}>
        <Ionicons name="information-circle" size={20} color={safeColors.primary} />
        <Text style={[styles.infoMessageText, { color: safeColors.text.primary }]}>
          <Text style={{ fontWeight: '600' }}>💡 Astuce :</Text> Les charges avec 📅 sont récurrentes, ⚡ indique un prélèvement automatique actif
        </Text>
      </View>

      {/* Carte budget */}
      {budgetCard && (
        <View style={[styles.budgetCard, { backgroundColor: safeColors.card, borderColor: safeColors.border }]}>
          <View style={styles.budgetHeader}>
            <Ionicons name="wallet-outline" size={24} color={safeColors.primary} />
            <Text style={[styles.budgetTitle, { color: safeColors.text.primary }]}>
              Budget Annuel
            </Text>
          </View>
          <View style={styles.budgetContent}>
            <View style={styles.budgetRow}>
              <Text style={[styles.budgetLabel, { color: safeColors.text.secondary }]}>Total charges</Text>
              <Text style={[styles.budgetAmount, { color: safeColors.text.primary }]}>
                {formatAmount(budgetCard.totalCharges)}
              </Text>
            </View>
            <View style={styles.budgetRow}>
              <Text style={[styles.budgetLabel, { color: safeColors.text.secondary }]}>Payées</Text>
              <Text style={[styles.budgetAmount, { color: safeColors.success }]}>
                {formatAmount(budgetCard.paidAmount)}
              </Text>
            </View>
            <View style={styles.budgetRow}>
              <Text style={[styles.budgetLabel, { color: safeColors.text.secondary }]}>Restantes</Text>
              <Text style={[styles.budgetAmount, { color: safeColors.warning }]}>
                {formatAmount(budgetCard.remainingAmount)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Filtres */}
      <View style={[styles.filtersWrapper, { backgroundColor: safeColors.card }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => {
            const isSelected = selectedFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  { 
                    backgroundColor: isSelected ? safeColors.primary : 'transparent',
                    borderColor: isSelected ? safeColors.primary : safeColors.border
                  }
                ]}
                onPress={() => setSelectedFilter(filter.key)}
              >
                <Ionicons 
                  name={filter.icon as any} 
                  size={18} 
                  color={isSelected ? 'white' : safeColors.text.secondary}
                  style={styles.filterIcon}
                />
                <Text style={[
                  styles.filterText,
                  { 
                    color: isSelected ? 'white' : safeColors.text.primary 
                  }
                ]}>
                  {filter.label}
                </Text>
                {filter.count > 0 && (
                  <View style={[
                    styles.filterBadge,
                    { backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : safeColors.primary + '15' }
                  ]}>
                    <Text style={[
                      styles.filterBadgeText,
                      { color: isSelected ? 'white' : safeColors.primary }
                    ]}>
                      {filter.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Liste des charges */}
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[safeColors.primary]}
            tintColor={safeColors.primary}
          />
        }
      >
        <View style={styles.content}>
          {filteredCharges.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color={safeColors.text.secondary} />
              <Text style={[styles.emptyTitle, { color: safeColors.text.primary }]}>
                Aucune charge
              </Text>
              <Text style={[styles.emptyDescription, { color: safeColors.text.secondary }]}>
                {selectedFilter === 'all' 
                  ? 'Ajoutez votre première charge annuelle'
                  : `Aucune charge ${filters.find(f => f.key === selectedFilter)?.label.toLowerCase()}`
                }
              </Text>
            </View>
          ) : (
            <View style={styles.chargesList}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: safeColors.text.primary }]}>
                  {selectedFilter === 'all' ? 'Toutes les charges' :
                   selectedFilter === 'pending' ? 'Charges en attente' :
                   selectedFilter === 'paid' ? 'Charges payées' :
                   selectedFilter === 'upcoming' ? 'Charges à venir' : 'Charges'}
                </Text>
                <View style={[styles.sectionBadge, { backgroundColor: safeColors.primary }]}>
                  <Text style={styles.sectionBadgeText}>Total</Text>
                </View>
                <Text style={[styles.sectionAmount, { color: safeColors.text.primary }]}>
                  {formatAmount(filters.find(f => f.key === selectedFilter)?.amount || 0)}
                </Text>
              </View>
              
              {filteredCharges.map((charge) => (
                <ChargeCard key={charge.id} charge={charge} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Message d'erreur */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: safeColors.error + '20' }]}>
          <Text style={[styles.errorText, { color: safeColors.error }]}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  infoMessageText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  budgetCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  budgetContent: {
    gap: 8,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 14,
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  filtersWrapper: {
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  filterIcon: {
    marginRight: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadge: {
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  chargesList: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  sectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  chargeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chargeInfo: {
    flex: 1,
  },
  chargeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  chargeName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  recurrenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  recurrenceText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  chargeCategory: {
    fontSize: 14,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  chargeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  chargeDueDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  infoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
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

