import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useDesignSystem, useTheme } from '../context/ThemeContext';
import { useSmartAlerts } from '../hooks/useSmartAlerts';
import { Alert as AlertType } from '../types/Alert';

type PriorityType = 'all' | 'critical' | 'high' | 'medium' | 'low';

export default function AlertsScreen() {
  const { colors } = useDesignSystem();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { alerts, loading, markAsRead, markAllAsRead, refreshAlerts } = useSmartAlerts();
  
  const [selectedPriority, setSelectedPriority] = useState<PriorityType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAlerts();
    setRefreshing(false);
  };

  // Filtrer par priorité
  const filteredAlerts = useMemo(() => {
    if (selectedPriority === 'all') return alerts;
    return alerts.filter(alert => alert.priority === selectedPriority);
  }, [alerts, selectedPriority]);

  // Compter les alertes par priorité
  const counts = useMemo(() => {
    return {
      all: alerts.length,
      critical: alerts.filter(a => a.priority === 'critical').length,
      high: alerts.filter(a => a.priority === 'high').length,
      medium: alerts.filter(a => a.priority === 'medium').length,
      low: alerts.filter(a => a.priority === 'low').length,
      unread: alerts.filter(a => !a.read).length,
    };
  }, [alerts]);

  // Configuration des icônes et couleurs par priorité
  const getPriorityConfig = (priority: string) => {
    const configs = {
      critical: {
        icon: 'alert-circle' as const,
        bgColor: colors.semantic.error + '20',
        iconColor: colors.semantic.error,
        label: 'Critique',
      },
      high: {
        icon: 'warning' as const,
        bgColor: colors.semantic.warning + '20',
        iconColor: colors.semantic.warning,
        label: 'Élevée',
      },
      medium: {
        icon: 'information-circle' as const,
        bgColor: colors.primary[500] + '20',
        iconColor: colors.primary[500],
        label: 'Moyenne',
      },
      low: {
        icon: 'notifications' as const,
        bgColor: colors.text.disabled + '20',
        iconColor: colors.text.disabled,
        label: 'Faible',
      },
    };
    return configs[priority as keyof typeof configs] || configs.low;
  };

  const handleAlertPress = async (alert: AlertType) => {
    if (!alert.read) {
      await markAsRead(alert.id);
    }
  };

  const priorities: { key: PriorityType; label: string; color: string }[] = [
    { key: 'all', label: 'Toutes', color: colors.primary[500] },
    { key: 'critical', label: 'Critiques', color: colors.semantic.error },
    { key: 'high', label: 'Élevées', color: colors.semantic.warning },
    { key: 'medium', label: 'Moyennes', color: colors.primary[500] },
    { key: 'low', label: 'Faibles', color: colors.text.disabled },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Alertes</Text>
        {counts.unread > 0 && (
          <TouchableOpacity
            style={[styles.markAllButton, { backgroundColor: colors.primary[500] + '15' }]}
            onPress={markAllAsRead}
          >
            <Ionicons name="checkmark-done" size={20} color={colors.primary[500]} />
            <Text style={[styles.markAllText, { color: colors.primary[500] }]}>Tout marquer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres priorité */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {priorities.map((priority) => {
          const isSelected = selectedPriority === priority.key;
          const count = counts[priority.key];
          
          return (
            <TouchableOpacity
              key={priority.key}
              style={[
                styles.filterPill,
                { backgroundColor: isSelected ? priority.color : colors.background.secondary },
              ]}
              onPress={() => setSelectedPriority(priority.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  isSelected
                    ? styles.filterTextActive
                    : { color: colors.text.secondary },
                ]}
              >
                {priority.label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.filterBadge,
                    isSelected
                      ? { backgroundColor: 'rgba(255,255,255,0.3)' }
                      : { backgroundColor: priority.color },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBadgeText,
                      isSelected
                        ? { color: '#FFFFFF' }
                        : { color: '#FFFFFF' },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Liste des alertes */}
      <ScrollView
        style={styles.alertsList}
        contentContainerStyle={styles.alertsContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
      >
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.background.card }]}>
              <Ionicons
                name="checkmark-circle"
                size={48}
                color={colors.text.secondary}
              />
            </View>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              {selectedPriority === 'all'
                ? 'Aucune alerte'
                : `Aucune alerte ${priorities.find(p => p.key === selectedPriority)?.label.toLowerCase()}`}
            </Text>
          </View>
        ) : (
          filteredAlerts.map((alert) => {
            const config = getPriorityConfig(alert.priority);
            
            return (
              <TouchableOpacity
                key={alert.id}
                style={[
                  styles.alertCard,
                  { backgroundColor: colors.background.card },
                  !alert.read && styles.alertCardUnread,
                ]}
                onPress={() => handleAlertPress(alert)}
                activeOpacity={0.7}
              >
                {/* Badge non lu */}
                {!alert.read && <View style={[styles.unreadBadge, { backgroundColor: colors.primary[500] }]} />}

                {/* Icône */}
                <View
                  style={[
                    styles.alertIcon,
                    { backgroundColor: config.bgColor },
                  ]}
                >
                  <Ionicons
                    name={config.icon}
                    size={24}
                    color={config.iconColor}
                  />
                </View>

                {/* Contenu */}
                <View style={styles.alertContent}>
                  <View style={styles.alertHeader}>
                    <Text
                      style={[
                        styles.alertTitle,
                        { color: colors.text.primary },
                        !alert.read && styles.alertTitleUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {alert.title}
                    </Text>
                    <Text style={[styles.alertTime, { color: colors.text.secondary }]}>
                      {formatTime(alert.createdAt)}
                    </Text>
                  </View>

                  <Text
                    style={[styles.alertMessage, { color: colors.text.secondary }]}
                    numberOfLines={2}
                  >
                    {alert.message}
                  </Text>

                  {/* Badge priorité */}
                  <View style={styles.alertFooter}>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: config.bgColor },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityBadgeText,
                          { color: config.iconColor },
                        ]}
                      >
                        {config.label}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

// Fonction pour formater le temps relatif
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filtersContainer: {
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  filterText: {
    fontSize: 15,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  alertsList: {
    flex: 1,
  },
  alertsContent: {
    padding: 20,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '500',
  },
  alertCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  alertCardUnread: {
    shadowOpacity: 0.1,
    elevation: 3,
  },
  unreadBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  alertTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  alertTitleUnread: {
    fontWeight: '700',
  },
  alertTime: {
    fontSize: 13,
    fontWeight: '400',
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
