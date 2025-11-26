import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
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
import { useLanguage } from '../context/LanguageContext';
import { useDesignSystem, useTheme } from '../context/ThemeContext';
import { useAnnualCharges } from '../hooks/useAnnualCharges';
import { useIslamicCharges } from '../hooks/useIslamicCharges';

export const AnnualChargesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { colors } = useDesignSystem();
  const { formatAmount } = useCurrency();
  
  const {
    charges,
    loading,
    error,
    getStats,
    refreshAnnualCharges,
    deleteAnnualCharge,
    getChargesByStatus,
    processAutoDeductCharges,
    forceRefresh
  } = useAnnualCharges();

  const {
    settings: islamicSettings,
    saveSettings,
    islamicCharges,
    generateChargesForCurrentYear,
    deleteAllIslamicCharges,
    processDueCharges: processIslamicDueCharges // ✅ NOUVEAU
  } = useIslamicCharges();

  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'paid' | 'pending' | 'upcoming'>('all');
  const [filteredCharges, setFilteredCharges] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false); // ✅ Empêcher les appels multiples

  const currentYear = new Date().getFullYear();
  const isDark = theme === 'dark';

  // ✅ CHARGER LES DONNÉES AVEC PRÉLÈVEMENT AUTOMATIQUE
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // ✅ RECHARGER AUTOMATIQUEMENT QUAND LES FILTRES CHANGENT
  useEffect(() => {
    if (charges.length > 0) {
      applyFilters();
    }
  }, [selectedStatus, applyFilters]);

  // ✅ MEMOÏZER LES FILTRES AVANT LOADDATA
  const applyFilters = useCallback(async () => {
    try {
      let filtered;
      if (selectedStatus === 'upcoming') {
        // Charges à venir (non payées et date future)
        const allCharges = await getChargesByStatus('all');
        const today = new Date();
        filtered = allCharges.filter(charge => {
          if (charge.isPaid) return false;
          const dueDate = new Date(charge.dueDate);
          return dueDate > today;
        });
      } else {
        filtered = await getChargesByStatus(selectedStatus);
      }
      setFilteredCharges(filtered);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  }, [selectedStatus, getChargesByStatus]);

  const loadData = useCallback(async () => {
    // ✅ Empêcher les appels multiples simultanés
    if (isProcessing) {
      console.log('⏸️ Traitement déjà en cours, appel ignoré');
      return;
    }

    try {
      setIsProcessing(true);
      setRefreshing(true);

      // ✅ TRAITER D'ABORD LES PRÉLÈVEMENTS AUTOMATIQUES (ANNUELLES + ISLAMIQUES)
      console.log('🔄 Traitement des prélèvements automatiques...');
      
      // 1. Traiter les charges annuelles récurrentes
      const annualResult = await processAutoDeductCharges();
      console.log(`📊 Charges annuelles: ${annualResult.processed} traitée(s)`);
      
      // 2. Traiter les charges islamiques dues (une seule fois)
      if (islamicSettings.isEnabled) {
        const islamicResult = await processIslamicDueCharges();
        console.log(`🕌 Charges islamiques: ${islamicResult.processed} traitée(s)`);
        
        if (islamicResult.processed > 0 || annualResult.processed > 0) {
          console.log(`✅ Total traité: ${annualResult.processed + islamicResult.processed} charge(s)`);
        }
      }
      
      // 3. PUIS CHARGER LES STATISTIQUES
      const chargesStats = await getStats();
      setStats(chargesStats);
      
      // 4. ET APPLIQUER LES FILTRES
      await applyFilters();
    } catch (error) {
      console.error('Error loading annual charges data:', error);
    } finally {
      setRefreshing(false);
      setIsProcessing(false);
    }
  }, [isProcessing, islamicSettings.isEnabled, processAutoDeductCharges, processIslamicDueCharges, getStats, applyFilters]);

  const handleRefresh = async () => {
    await loadData();
  };

  const handleStatusFilter = (status: 'all' | 'paid' | 'pending' | 'upcoming') => {
    setSelectedStatus(status);
    // L'actualisation se fera automatiquement via useEffect
  };

  const handleAddCharge = () => {
    navigation.navigate('AddAnnualCharge' as never);
  };

  const handleEditCharge = (chargeId: string) => {
    (navigation as any).navigate('EditAnnualCharge', { chargeId });
  };

  const handleDeleteCharge = (chargeId: string, chargeName: string) => {
    Alert.alert(
      '🗑️ Supprimer la charge',
      `Êtes-vous sûr de vouloir supprimer "${chargeName}" ?\n\n⚠️ Note: Seules les charges du mois courant peuvent être supprimées.\n\n✅ Si la charge était payée :\n  • Le compte sera remboursé automatiquement\n  • La transaction sera supprimée\n  • Toutes les pages seront mises à jour`,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAnnualCharge(chargeId);
              await loadData();
              Alert.alert(
                '✅ Suppression réussie', 
                'La charge a été supprimée avec succès.\n\n📊 Modifications appliquées :\n  • Charge supprimée\n  • Compte remboursé (si payée)\n  • Transaction supprimée\n  • Toutes les pages synchronisées'
              );
            } catch (error: any) {
              const errorMessage = error?.message || 'Impossible de supprimer la charge';
              Alert.alert('❌ Erreur', errorMessage);
            }
          },
        },
      ]
    );
  };

  // ✅ TOGGLE POUR LES CHARGES ISLAMIQUES - AUTOMATIQUE
  const handleToggleIslamicCharges = async () => {
    const newIsEnabled = !islamicSettings.isEnabled;
    
    try {
      if (newIsEnabled) {
        // Activation - Génération automatique des charges
        console.log('🚀 Activation charges islamiques + génération automatique');
        const newSettings = { ...islamicSettings, isEnabled: true, autoCreateCharges: true };
        await saveSettings(newSettings);
        await generateChargesForCurrentYear();
        
        // Recharger les données
        await loadData();
        
        Alert.alert('✅ Activé', 'Les charges islamiques ont été générées automatiquement');
      } else {
        // Désactivation - Suppression automatique UNIQUEMENT des charges islamiques
        console.log('🗑️ Désactivation + suppression UNIQUEMENT des charges islamiques');
        const deletedCount = await deleteAllIslamicCharges();
        const newSettings = { ...islamicSettings, isEnabled: false };
        await saveSettings(newSettings);
        
        // Recharger les données pour afficher les charges annuelles restantes
        await loadData();
        
        Alert.alert('✅ Désactivé', `${deletedCount} charges islamiques supprimées. Les charges annuelles sont conservées.`);
      }
      
    } catch (error) {
      console.error('❌ Erreur toggle islamic charges:', error);
      Alert.alert(t.error, 'Impossible de modifier les paramètres islamiques');
    }
  };

  const getStatusColor = (charge: any) => {
    if (charge.isPaid) return '#10B981';
    
    const dueDate = new Date(charge.dueDate);
    const today = new Date();
    
    if (dueDate < today) return '#EF4444';
    if (dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear()) {
      return '#F59E0B';
    }
    
    return '#6B7280';
  };

  const getStatusText = (charge: any) => {
    if (charge.isPaid) return 'Payée';
    
    const dueDate = new Date(charge.dueDate);
    const today = new Date();
    
    if (dueDate < today) return 'En retard';
    if (dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear()) {
      return 'Ce mois';
    }
    
    return 'À venir';
  };

  // ✅ RÉCUPÉRER L'ICÔNE SELON LA CATÉGORIE
  const getCategoryIcon = (category: string): string => {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('loyer') || categoryLower.includes('logement')) return 'home';
    if (categoryLower.includes('assurance')) return 'shield-checkmark';
    if (categoryLower.includes('énergie') || categoryLower.includes('électricité') || categoryLower.includes('eau')) return 'flash';
    if (categoryLower.includes('abonnement') || categoryLower.includes('internet') || categoryLower.includes('téléphone')) return 'wifi';
    if (categoryLower.includes('transport') || categoryLower.includes('carburant') || categoryLower.includes('voiture')) return 'car';
    if (categoryLower.includes('santé') || categoryLower.includes('médical')) return 'medical';
    if (categoryLower.includes('education') || categoryLower.includes('école')) return 'school';
    if (categoryLower.includes('islamic') || categoryLower.includes('islamique')) return 'star';
    
    return 'cash-outline';
  };

  // ✅ RÉCUPÉRER LA COULEUR SELON LA CATÉGORIE
  const getCategoryColor = (category: string): string => {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('loyer') || categoryLower.includes('logement')) return '#FF6B6B';
    if (categoryLower.includes('assurance')) return '#4ECDC4';
    if (categoryLower.includes('énergie') || categoryLower.includes('électricité') || categoryLower.includes('eau')) return '#FFE66D';
    if (categoryLower.includes('abonnement') || categoryLower.includes('internet') || categoryLower.includes('téléphone')) return '#95E1D3';
    if (categoryLower.includes('transport') || categoryLower.includes('carburant') || categoryLower.includes('voiture')) return '#A8E6CF';
    if (categoryLower.includes('santé') || categoryLower.includes('médical')) return '#FF8B94';
    if (categoryLower.includes('education') || categoryLower.includes('école')) return '#C7CEEA';
    if (categoryLower.includes('islamic') || categoryLower.includes('islamique')) return '#8A2BE2';
    
    return '#B0B0B0';
  };

  // ✅ FORMATER LA RÉCURRENCE
  const formatRecurrence = (charge: any): string => {
    if (!charge.recurrence) return 'Unique';
    
    switch (charge.recurrence) {
      case 'monthly': return 'Mensuel';
      case 'quarterly': return 'Trimestriel';
      case 'yearly': return 'Annuel';
      default: return 'Variable';
    }
  };

  // ✅ FILTRER TOUTES LES CHARGES (annuelles + islamiques) ENSEMBLE
  const displayCharges = filteredCharges;

  // Filtres simplifiés
  const statusFilters = [
    { key: 'all' as const, label: 'Toutes', icon: '📋' },
    { key: 'pending' as const, label: 'En attente', icon: '⏳' },
    { key: 'upcoming' as const, label: 'À venir', icon: '🔔' },
    { key: 'paid' as const, label: 'Payées', icon: '✅' },
  ];

  if (loading && !refreshing) {
    return (
      <SafeAreaView>
        <View style={[styles.container, { backgroundColor: colors.background.primary }, styles.center]}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={[styles.loadingText, { color: colors.text.primary }]}>
            Chargement des charges annuelles...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background.primary }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
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
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Charges Annuelles {currentYear}
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddCharge}
          >
            <Ionicons name="add" size={24} color={colors.primary[500]} />
          </TouchableOpacity>
        </View>

        {/* Bouton Prélèvement Automatique */}
        <TouchableOpacity
          style={[styles.autoDeductButton, { backgroundColor: colors.background.card }]}
          onPress={async () => {
            Alert.alert(
              '💰 Prélèvement Automatique',
              'Traiter automatiquement toutes les charges récurrentes (annuelles + islamiques) avec prélèvement automatique activé ?',
              [
                { text: t.cancel, style: 'cancel' },
                {
                  text: 'Traiter',
                  onPress: async () => {
                    try {
                      setRefreshing(true);
                      
                      // Traiter les charges annuelles
                      const annualResult = await processAutoDeductCharges();
                      
                      // Traiter les charges islamiques si activées
                      let islamicResult = { processed: 0, errors: [] as string[] };
                      if (islamicSettings.isEnabled) {
                        islamicResult = await processIslamicDueCharges();
                      }
                      
                      const totalProcessed = annualResult.processed + islamicResult.processed;
                      const totalErrors = [...annualResult.errors, ...islamicResult.errors];
                      
                      if (totalProcessed > 0) {
                        let message = `✅ ${totalProcessed} charge(s) traitée(s) automatiquement\n\n`;
                        message += `📋 Annuelles: ${annualResult.processed}\n`;
                        if (islamicSettings.isEnabled) {
                          message += `🕌 Islamiques: ${islamicResult.processed}\n`;
                        }
                        
                        if (totalErrors.length > 0) {
                          message += `\n⚠️ ${totalErrors.length} erreur(s):\n${totalErrors.slice(0, 3).join('\n')}`;
                        }
                        
                        Alert.alert('✅ Traitement réussi', message);
                      } else {
                        Alert.alert(
                          'ℹ️ Information',
                          'Aucune charge à traiter automatiquement.\n\nVérifiez que:\n• Les charges ont le prélèvement automatique activé\n• Un compte est associé\n• Les charges sont arrivées à échéance'
                        );
                      }
                      
                      await loadData();
                    } catch (error: any) {
                      Alert.alert('❌ Erreur', error?.message || 'Erreur lors du traitement automatique');
                    } finally {
                      setRefreshing(false);
                    }
                  }
                }
              ]
            );
          }}
        >
          <View style={styles.autoDeductIconContainer}>
            <Ionicons name="flash" size={20} color="#FFF" />
          </View>
          <View style={styles.autoDeductContent}>
            <Text style={[styles.autoDeductTitle, { color: colors.text.primary }]}>Prélever toutes les charges dues</Text>
            <Text style={[styles.autoDeductSubtitle, { color: colors.text.secondary }]}>Traiter automatiquement les charges échues</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary[500]} />
        </TouchableOpacity>

        {/* Montant total */}
        <View style={[styles.totalAmountCard, { backgroundColor: colors.background.card }]}>
          <Text style={[styles.totalAmountLabel, { color: colors.text.secondary }]}>
            Montant Total {currentYear}
          </Text>
          <Text style={[styles.totalAmountValue, { color: colors.text.primary }]}>
            {formatAmount(stats?.totalAmount || 0)}
          </Text>
        </View>

        {/* Cartes de statistiques */}
        <View style={styles.statsCardsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.background.card }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.semantic.success + '20' }]}>
              <Text style={styles.statIconText}>✅</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {formatAmount(stats?.paidAmount || 0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Payé ({stats?.upcomingCharges?.filter((c: any) => c.isPaid)?.length || 0})
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.background.card }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.semantic.warning + '20' }]}>
              <Text style={styles.statIconText}>⏳</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {formatAmount(stats?.pendingAmount || 0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                En attente ({stats?.upcomingCharges?.filter((c: any) => !c.isPaid)?.length || 0})
              </Text>
            </View>
          </View>
        </View>

        {/* Filtres de statut */}
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
                { backgroundColor: selectedStatus === filter.key ? colors.primary[500] : colors.background.secondary }
              ]}
              onPress={() => handleStatusFilter(filter.key)}
            >
              <Text style={[
                styles.filterText,
                { color: selectedStatus === filter.key ? colors.text.inverse : colors.text.primary }
              ]}>
                {filter.icon} {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Liste des charges */}
        <View style={styles.chargesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            {selectedStatus === 'all' ? 'Toutes les charges' :
             selectedStatus === 'paid' ? 'Charges payées' : 
             selectedStatus === 'upcoming' ? 'Charges à venir' : 'Charges en attente'}
            ({displayCharges.length})
          </Text>

          {displayCharges.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.background.card }]}>
              <Ionicons 
                name="calendar-outline" 
                size={64} 
                color={colors.text.disabled} 
              />
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                {`Aucune charge ${selectedStatus !== 'all' ? statusFilters.find(f => f.key === selectedStatus)?.label.toLowerCase() : ''} en ${currentYear}`}
              </Text>
              <Text style={[styles.emptyDescription, { color: colors.text.secondary }]}>
                {selectedStatus === 'all' 
                  ? `Commencez par ajouter votre première charge annuelle pour ${currentYear}`
                  : `Aucune charge ${statusFilters.find(f => f.key === selectedStatus)?.label.toLowerCase()} pour ${currentYear}`
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
            displayCharges.map((charge) => (
              <TouchableOpacity 
                key={charge.id} 
                style={[styles.modernChargeCard, { backgroundColor: colors.background.card }]}
                onPress={() => handleEditCharge(charge.id)}
                activeOpacity={0.7}
              >
                {/* En-tête avec icône et nom */}
                <View style={styles.modernChargeHeader}>
                  <View style={[styles.chargeIconContainer, { backgroundColor: getCategoryColor(charge.category) + '20' }]}>
                    <Ionicons 
                      name={getCategoryIcon(charge.category) as any} 
                      size={24} 
                      color={getCategoryColor(charge.category)} 
                    />
                  </View>
                  <View style={styles.modernChargeInfo}>
                    <Text style={[styles.modernChargeName, { color: colors.text.primary }]}>
                      {charge.name}
                    </Text>
                    <Text style={[styles.modernChargeCategory, { color: colors.text.secondary }]}>
                      {charge.category}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {charge.autoDeduct && (
                      <View style={styles.autoDeductBadge}>
                        <Ionicons name="flash" size={12} color="#FFA500" />
                        <Text style={styles.autoDeductBadgeText}>Auto</Text>
                      </View>
                    )}
                    {charge.isIslamic && (
                      <View style={styles.modernIslamicBadge}>
                        <Ionicons name="star" size={14} color="#8A2BE2" />
                      </View>
                    )}
                  </View>
                </View>

                {/* Montant principal */}
                <Text style={[styles.modernChargeAmount, { color: colors.text.primary }]}>
                  {formatAmount(charge.amount)}
                </Text>

                {/* Informations de fréquence et échéance */}
                <View style={styles.modernChargeDetails}>
                  <View style={styles.modernDetailItem}>
                    <Ionicons name="repeat" size={14} color={colors.text.secondary} />
                    <Text style={[styles.modernDetailText, { color: colors.text.secondary }]}>
                      {formatRecurrence(charge)}
                    </Text>
                  </View>
                  <View style={styles.modernDetailItem}>
                    <Ionicons name="calendar" size={14} color={colors.text.secondary} />
                    <Text style={[styles.modernDetailText, { color: colors.text.secondary }]}>
                      Échéance: {new Date(charge.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </View>

                {/* Barre de statut */}
                <View style={[styles.modernStatusBar, { backgroundColor: getStatusColor(charge) }]}>
                  <Text style={styles.modernStatusText}>
                    {getStatusText(charge)}
                  </Text>
                </View>

                {/* Actions rapides */}
                <View style={styles.modernQuickActions}>
                  {/* Bouton Payer supprimé - Le prélèvement se fait automatiquement */}
                  
                  <TouchableOpacity
                    style={[styles.modernActionButton, styles.modernDeleteButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteCharge(charge.id, charge.name);
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Bouton d'action flottant */}
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: colors.primary[500] }]}
          onPress={handleAddCharge}
        >
          <Ionicons name="add" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    textAlign: 'center',
    flex: 1,
  },
  addButton: {
    padding: 8,
    width: 40,
    alignItems: 'flex-end',
  },
  // Styles pour le toggle islamique
  islamicToggleCard: {
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  islamicToggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  islamicToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  islamicToggleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  islamicToggleDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  islamicStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  islamicStat: {
    alignItems: 'center',
  },
  islamicStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  islamicStatLabel: {
    fontSize: 12,
  },
  // Filtre charges islamiques
  islamicFilter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  islamicFilterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  islamicFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },
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
  statsCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
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
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chargesSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chargeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    marginBottom: 4,
  },
  islamicBadge: {
    backgroundColor: '#F0E5FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  islamicBadgeText: {
    fontSize: 10,
    color: '#8A2BE2',
    fontWeight: '600',
  },
  recurrenceBadge: {
    backgroundColor: '#E5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  recurrenceBadgeText: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '600',
  },
  chargeCategory: {
    fontSize: 14,
  },
  chargeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
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
    marginBottom: 4,
  },
  chargeStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  chargeAccount: {
    fontSize: 11,
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
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyDescription: {
    fontSize: 14,
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  
  // ✅ STYLES POUR LE BOUTON DE PRÉLÈVEMENT AUTOMATIQUE
  autoDeductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  autoDeductIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  autoDeductContent: {
    flex: 1,
  },
  autoDeductTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  autoDeductSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  
  // ✅ BADGE PRÉLÈVEMENT AUTOMATIQUE
  autoDeductBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  autoDeductBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFA500',
  },
  
  // ✅ NOUVEAUX STYLES MODERNES
  modernChargeCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  modernChargeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chargeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modernChargeInfo: {
    flex: 1,
  },
  modernChargeName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  modernChargeCategory: {
    fontSize: 13,
    fontWeight: '500',
  },
  modernIslamicBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0E5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernChargeAmount: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  modernChargeDetails: {
    marginBottom: 12,
  },
  modernDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  modernDetailText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  modernStatusBar: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  modernStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernQuickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  modernActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modernPayButton: {
    flex: 1,
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  modernDeleteButton: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  modernActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AnnualChargesScreen;