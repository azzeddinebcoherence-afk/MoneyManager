// src/components/alerts/SmartAlertCard.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Animated,
    Alert as RNAlert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Alert, AlertPriority, AlertType } from '../../types/Alert';

interface SmartAlertCardProps {
  alert: Alert;
  onPress?: (alert: Alert) => void;
  onDismiss?: (alertId: string) => void;
  onAction?: (alert: Alert, actionId: string) => void;
  compact?: boolean;
  showActions?: boolean;
}

export const SmartAlertCard: React.FC<SmartAlertCardProps> = ({
  alert,
  onPress,
  onDismiss,
  onAction,
  compact = false,
  showActions = true,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [isExpanded, setIsExpanded] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // ✅ CORRIGÉ : Obtenir la couleur selon la priorité
  const getPriorityColor = (priority: AlertPriority): string => {
    const colors: Record<AlertPriority, string> = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#EF4444',
      critical: '#DC2626'
    };
    return colors[priority];
  };

  // ✅ CORRIGÉ : Obtenir l'icône selon le type
  const getTypeIcon = (type: AlertType): string => {
  const icons: Partial<Record<AlertType, string>> = {
    budget: 'wallet',
    savings: 'trending-up',
    debt: 'card',
    system: 'settings',
    security: 'shield-checkmark',
    transaction: 'cash',
    bill: 'document-text',
    reminder: 'alarm',
    report: 'bar-chart',
    account: 'card', // ✅ AJOUTÉ
    summary: 'stats-chart' // ✅ AJOUTÉ
  };
  return (icons[type] as string) || 'notifications';
};

  // ✅ CORRIGÉ : Obtenir le label de priorité
  const getPriorityLabel = (priority: AlertPriority): string => {
    const labels: Record<AlertPriority, string> = {
      low: 'Faible',
      medium: 'Moyenne',
      high: 'Élevée',
      critical: 'Critique'
    };
    return labels[priority];
  };

  // ✅ CORRIGÉ : Formater la date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  // ✅ CORRIGÉ : Gestionnaire de clic
  const handlePress = () => {
    if (onPress) {
      onPress(alert);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  // ✅ CORRIGÉ : Gestionnaire de suppression
  const handleDismiss = () => {
    RNAlert.alert(
      'Supprimer l\'alerte',
      'Voulez-vous vraiment supprimer cette alerte ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => onDismiss?.(alert.id)
        }
      ]
    );
  };

  // ✅ CORRIGÉ : Gestionnaire d'action
  const handleAction = (actionId: string) => {
    onAction?.(alert, actionId);
  };

  // ✅ CORRIGÉ : Animation d'entrée
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const priorityColor = getPriorityColor(alert.priority);
  const typeIcon = getTypeIcon(alert.type);
  const priorityLabel = getPriorityLabel(alert.priority);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={[
          styles.card,
          compact && styles.cardCompact,
          isDark && styles.darkCard,
          !alert.read && styles.unreadCard,
          { borderLeftColor: priorityColor }
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* En-tête de l'alerte */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: priorityColor + '20' }]}>
              <Ionicons name={typeIcon as any} size={compact ? 16 : 20} color={priorityColor} />
            </View>
            <View style={styles.textContainer}>
              <Text 
                style={[
                  styles.title, 
                  isDark && styles.darkText,
                  compact && styles.titleCompact
                ]} 
                numberOfLines={compact ? 1 : 2}
              >
                {alert.title}
              </Text>
              {!compact && (
                <Text 
                  style={[styles.message, isDark && styles.darkSubtext]} 
                  numberOfLines={isExpanded ? undefined : 2}
                >
                  {alert.message}
                </Text>
              )}
            </View>
          </View>

          {/* Badge de priorité */}
          {!compact && (
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
              <Text style={[styles.priorityText, { color: priorityColor }]}>
                {priorityLabel}
              </Text>
            </View>
          )}
        </View>

        {/* Métadonnées et date */}
        <View style={styles.metadata}>
          <View style={styles.metadataLeft}>
            {alert.category && (
              <View style={styles.categoryBadge}>
                <Text style={[styles.categoryText, isDark && styles.darkSubtext]}>
                  {alert.category}
                </Text>
              </View>
            )}
            <Text style={[styles.date, isDark && styles.darkSubtext]}>
              {formatDate(alert.createdAt)}
            </Text>
          </View>

          {/* Indicateur non lu */}
          {!alert.read && (
            <View style={[styles.unreadDot, { backgroundColor: priorityColor }]} />
          )}
        </View>

        {/* Actions rapides */}
        {showActions && !compact && (
          <View style={styles.actions}>
            {alert.actions && alert.actions.length > 0 ? (
              <View style={styles.actionButtons}>
                {alert.actions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={[
                      styles.actionButton,
                      action.type === 'primary' && styles.primaryAction,
                      action.type === 'destructive' && styles.destructiveAction,
                    ]}
                    onPress={() => handleAction(action.id)}
                  >
                    <Text
                      style={[
                        styles.actionText,
                        action.type === 'primary' && styles.primaryActionText,
                        action.type === 'destructive' && styles.destructiveActionText,
                      ]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.defaultActions}>
                {onDismiss && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.secondaryAction]}
                    onPress={handleDismiss}
                  >
                    <Ionicons name="close" size={16} color={isDark ? '#888' : '#666'} />
                    <Text style={[styles.actionText, isDark && styles.darkSubtext]}>
                      Ignorer
                    </Text>
                  </TouchableOpacity>
                )}
                
                {alert.actionUrl && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryAction]}
                    onPress={() => onPress?.(alert)}
                  >
                    <Ionicons name="arrow-forward" size={16} color="#007AFF" />
                    <Text style={styles.primaryActionText}>
                      {alert.actionLabel || 'Voir détails'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* Contenu supplémentaire développé */}
        {isExpanded && alert.data && (
          <View style={styles.expandedContent}>
            {Object.entries(alert.data).map(([key, value]) => (
              <View key={key} style={styles.dataRow}>
                <Text style={[styles.dataKey, isDark && styles.darkSubtext]}>
                  {key}:
                </Text>
                <Text style={[styles.dataValue, isDark && styles.darkText]}>
                  {String(value)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardCompact: {
    padding: 12,
    marginBottom: 8,
  },
  darkCard: {
    backgroundColor: '#2c2c2e',
  },
  unreadCard: {
    backgroundColor: 'rgba(0, 122, 255, 0.03)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    lineHeight: 20,
  },
  titleCompact: {
    fontSize: 14,
    marginBottom: 0,
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metadataLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  defaultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    flex: 1,
    justifyContent: 'center',
  },
  primaryAction: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  secondaryAction: {
    backgroundColor: 'transparent',
  },
  destructiveAction: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginLeft: 4,
  },
  primaryActionText: {
    color: '#007AFF',
  },
  destructiveActionText: {
    color: '#FF3B30',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dataKey: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textTransform: 'capitalize',
  },
  dataValue: {
    fontSize: 12,
    fontWeight: '400',
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default SmartAlertCard;