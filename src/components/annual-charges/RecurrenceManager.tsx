// src/components/annual-charges/RecurrenceManager.tsx - NOUVEAU COMPOSANT
import React from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRecurrenceCharges } from '../../hooks/useRecurrenceCharges';

interface RecurrenceManagerProps {
  onChargesUpdated?: () => void;
}

export const RecurrenceManager: React.FC<RecurrenceManagerProps> = ({
  onChargesUpdated
}) => {
  const { theme } = useTheme();
  const {
    processRecurringCharges,
    generateNextYearCharges,
    getRecurrenceStats,
    loading,
    error
  } = useRecurrenceCharges();

  const [stats, setStats] = React.useState<{
    totalRecurring: number;
    yearly: number;
    monthly: number;
    quarterly: number;
    active: number;
  } | null>(null);

  const isDark = theme === 'dark';

  // Charger les statistiques au montage
  React.useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await getRecurrenceStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const handleProcessRecurring = async () => {
    try {
      const result = await processRecurringCharges();
      await loadStats();
      onChargesUpdated?.();
    } catch (error) {
      // Gestion d'erreur déjà faite dans le hook
    }
  };

  const handleGenerateNextYear = async () => {
    try {
      const result = await generateNextYearCharges();
      await loadStats();
      onChargesUpdated?.();
    } catch (error) {
      // Gestion d'erreur déjà faite dans le hook
    }
  };

  const handleShowStats = () => {
    if (!stats) return;

    Alert.alert(
      '📊 Statistiques des Charges Récurrentes',
      `Total: ${stats.totalRecurring} charges\n` +
      `🔸 Annuelle: ${stats.yearly}\n` +
      `🔸 Mensuelle: ${stats.monthly}\n` +
      `🔸 Trimestrielle: ${stats.quarterly}\n` +
      `✅ Actives: ${stats.active}\n` +
      `❌ Inactives: ${stats.totalRecurring - stats.active}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <Text style={[styles.title, isDark && styles.darkText]}>
        🔄 Gestion des Récurrences
      </Text>

      {stats && stats.totalRecurring > 0 && (
        <View style={[styles.statsCard, isDark && styles.darkStatsCard]}>
          <Text style={[styles.statsTitle, isDark && styles.darkText]}>
            Charges Récurrentes Actives
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, isDark && styles.darkText]}>
                {stats.totalRecurring}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                Total
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, isDark && styles.darkText]}>
                {stats.yearly}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                Annuelle
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, isDark && styles.darkText]}>
                {stats.monthly}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                Mensuelle
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, isDark && styles.darkText]}>
                {stats.quarterly}
              </Text>
              <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>
                Trimestrielle
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, isDark && styles.darkActionButton]}
          onPress={handleProcessRecurring}
          disabled={loading}
        >
          <Text style={[styles.actionText, isDark && styles.darkText]}>
            {loading ? '⏳ Traitement...' : '🔄 Traiter les Récurrences'}
          </Text>
          <Text style={[styles.actionDescription, isDark && styles.darkSubtext]}>
            Génère les prochaines occurrences des charges payées
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isDark && styles.darkActionButton]}
          onPress={handleGenerateNextYear}
          disabled={loading}
        >
          <Text style={[styles.actionText, isDark && styles.darkText]}>
            {loading ? '⏳ Génération...' : '📅 Générer Année Prochaine'}
          </Text>
          <Text style={[styles.actionDescription, isDark && styles.darkSubtext]}>
            Crée toutes les charges récurrentes pour l'année suivante
          </Text>
        </TouchableOpacity>

        {stats && (
          <TouchableOpacity
            style={[styles.actionButton, isDark && styles.darkActionButton]}
            onPress={handleShowStats}
          >
            <Text style={[styles.actionText, isDark && styles.darkText]}>
              📊 Voir les Statistiques
            </Text>
            <Text style={[styles.actionDescription, isDark && styles.darkSubtext]}>
              Détails des charges récurrentes
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {!stats || stats.totalRecurring === 0 ? (
        <View style={[styles.emptyState, isDark && styles.darkEmptyState]}>
          <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
            Aucune charge récurrente configurée
          </Text>
          <Text style={[styles.emptyDescription, isDark && styles.darkSubtext]}>
            Configurez la récurrence sur vos charges pour les voir apparaître ici
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkContainer: {
    backgroundColor: '#2c2c2e',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  darkStatsCard: {
    backgroundColor: '#38383a',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
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
    textAlign: 'center',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  darkActionButton: {
    backgroundColor: '#38383a',
    borderColor: '#555',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    backgroundColor: '#f8f9fa',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  darkEmptyState: {
    backgroundColor: '#38383a',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default RecurrenceManager;