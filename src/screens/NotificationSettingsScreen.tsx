// src/screens/NotificationSettingsScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { useTheme } from '../context/ThemeContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { notificationService } from '../services/NotificationService';
import { pushNotificationService } from '../services/PushNotificationService';
import { secureStorage } from '../services/storage/secureStorage';

interface NotificationPreferences {
  pushEnabled: boolean;
  transactionsEnabled: boolean;
  budgetAlertsEnabled: boolean;
  debtRemindersEnabled: boolean;
  savingsGoalsEnabled: boolean;
  reportsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
}

export default function NotificationSettingsScreen() {
  const { designSystem } = useTheme();
  const { isInitialized, hasPermission } = usePushNotifications();
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    pushEnabled: true,
    transactionsEnabled: true,
    budgetAlertsEnabled: true,
    debtRemindersEnabled: true,
    savingsGoalsEnabled: true,
    reportsEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    badgeEnabled: true,
  });

  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    loadPreferences();
    loadScheduledCount();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await secureStorage.getItem('notificationPreferences');
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (error) {
      console.error('❌ Erreur chargement préférences:', error);
    }
  };

  const loadScheduledCount = async () => {
    try {
      const scheduled = await pushNotificationService.getScheduledNotifications();
      setScheduledCount(scheduled.length);
    } catch (error) {
      console.error('❌ Erreur comptage notifications:', error);
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      await secureStorage.setItem('notificationPreferences', JSON.stringify(newPreferences));
      setPreferences(newPreferences);
      
      // Appliquer les paramètres
      notificationService.setPushEnabled(newPreferences.pushEnabled);
    } catch (error) {
      console.error('❌ Erreur sauvegarde préférences:', error);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    savePreferences(newPreferences);
  };

  const handleTestNotification = async () => {
    try {
      await pushNotificationService.sendLocalNotification({
        title: '🔔 Notification de test',
        body: 'Les notifications fonctionnent correctement !',
        data: { type: 'test' },
        sound: preferences.soundEnabled,
      });
      
      Alert.alert(
        'Test réussi !',
        'Une notification a été envoyée'
      );
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Impossible d\'envoyer la notification de test'
      );
    }
  };

  const handleClearAll = async () => {
    Alert.alert(
      'Effacer les notifications',
      'Voulez-vous effacer toutes les notifications programmées ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            await pushNotificationService.cancelAllNotifications();
            await pushNotificationService.clearAllNotifications();
            await pushNotificationService.resetBadge();
            setScheduledCount(0);
            Alert.alert('Terminé', 'Toutes les notifications ont été effacées');
          },
        },
      ]
    );
  };

  const handleScheduleDailyReminder = async () => {
    try {
      await pushNotificationService.scheduleDailyReminder(
        18, // 18h00
        0,
        'N\'oubliez pas de vérifier vos transactions du jour'
      );
      
      Alert.alert(
        'Rappel programmé',
        'Vous recevrez un rappel quotidien à 18h00'
      );
      
      loadScheduledCount();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de programmer le rappel');
    }
  };

  if (!isInitialized) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: designSystem.colors.background.primary }]}>
        <View style={styles.centered}>
          <Text style={[styles.message, { color: designSystem.colors.text.secondary }]}>
            Chargement des paramètres...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: designSystem.colors.background.primary }]}>
        <View style={styles.centered}>
          <Ionicons name="notifications-off" size={64} color={designSystem.colors.text.tertiary} />
          <Text style={[styles.title, { color: designSystem.colors.text.primary }]}>
            Notifications désactivées
          </Text>
          <Text style={[styles.message, { color: designSystem.colors.text.secondary }]}>
            Veuillez activer les notifications dans les paramètres de votre appareil
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: designSystem.colors.background.primary }]}>
      <ScrollView style={styles.scrollView}>
        {/* En-tête */}
        <View style={styles.header}>
          <Ionicons name="notifications" size={48} color={designSystem.colors.primary[500]} />
          <Text style={[styles.headerTitle, { color: designSystem.colors.text.primary }]}>
            Paramètres de notification
          </Text>
          <Text style={[styles.headerSubtitle, { color: designSystem.colors.text.secondary }]}>
            {scheduledCount} notification(s) programmée(s)
          </Text>
        </View>

        {/* Notifications Push */}
        <View style={[styles.section, { backgroundColor: designSystem.colors.background.card }]}>
          <Text style={[styles.sectionTitle, { color: designSystem.colors.text.primary }]}>
            Notifications Push
          </Text>
          
          <SettingRow
            icon="notifications-outline"
            title="Activer les notifications"
            subtitle="Recevoir des notifications sur votre appareil"
            value={preferences.pushEnabled}
            onToggle={() => togglePreference('pushEnabled')}
            colors={designSystem.colors}
          />

          <SettingRow
            icon="volume-high-outline"
            title="Son"
            subtitle="Jouer un son pour les notifications"
            value={preferences.soundEnabled}
            onToggle={() => togglePreference('soundEnabled')}
            colors={designSystem.colors}
            disabled={!preferences.pushEnabled}
          />

          <SettingRow
            icon="phone-portrait-outline"
            title="Vibration"
            subtitle="Vibrer pour les notifications"
            value={preferences.vibrationEnabled}
            onToggle={() => togglePreference('vibrationEnabled')}
            colors={designSystem.colors}
            disabled={!preferences.pushEnabled}
          />

          <SettingRow
            icon="ellipse"
            title="Badge"
            subtitle="Afficher le nombre sur l'icône de l'app"
            value={preferences.badgeEnabled}
            onToggle={() => togglePreference('badgeEnabled')}
            colors={designSystem.colors}
            disabled={!preferences.pushEnabled}
          />
        </View>

        {/* Types de notifications */}
        <View style={[styles.section, { backgroundColor: designSystem.colors.background.card }]}>
          <Text style={[styles.sectionTitle, { color: designSystem.colors.text.primary }]}>
            Types de notifications
          </Text>
          
          <SettingRow
            icon="swap-horizontal"
            title="Transactions"
            subtitle="Ajout, modification, suppression"
            value={preferences.transactionsEnabled}
            onToggle={() => togglePreference('transactionsEnabled')}
            colors={designSystem.colors}
            disabled={!preferences.pushEnabled}
          />

          <SettingRow
            icon="alert-circle"
            title="Alertes budgets"
            subtitle="Budget dépassé, avertissements"
            value={preferences.budgetAlertsEnabled}
            onToggle={() => togglePreference('budgetAlertsEnabled')}
            colors={designSystem.colors}
            disabled={!preferences.pushEnabled}
          />

          <SettingRow
            icon="time"
            title="Rappels de dettes"
            subtitle="Échéances proches, paiements"
            value={preferences.debtRemindersEnabled}
            onToggle={() => togglePreference('debtRemindersEnabled')}
            colors={designSystem.colors}
            disabled={!preferences.pushEnabled}
          />

          <SettingRow
            icon="trophy"
            title="Objectifs d'épargne"
            subtitle="Progrès, objectifs atteints"
            value={preferences.savingsGoalsEnabled}
            onToggle={() => togglePreference('savingsGoalsEnabled')}
            colors={designSystem.colors}
            disabled={!preferences.pushEnabled}
          />

          <SettingRow
            icon="bar-chart"
            title="Rapports"
            subtitle="Rapports mensuels, statistiques"
            value={preferences.reportsEnabled}
            onToggle={() => togglePreference('reportsEnabled')}
            colors={designSystem.colors}
            disabled={!preferences.pushEnabled}
          />
        </View>

        {/* Actions */}
        <View style={[styles.section, { backgroundColor: designSystem.colors.background.card }]}>
          <Text style={[styles.sectionTitle, { color: designSystem.colors.text.primary }]}>
            Actions
          </Text>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: designSystem.colors.primary[500] }]}
            onPress={handleTestNotification}
            disabled={!preferences.pushEnabled}
          >
            <Ionicons name="flask" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              Tester les notifications
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: designSystem.colors.functional.savings }]}
            onPress={handleScheduleDailyReminder}
            disabled={!preferences.pushEnabled}
          >
            <Ionicons name="alarm" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              Programmer rappel quotidien (18h)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: designSystem.colors.semantic.error }]}
            onPress={handleClearAll}
          >
            <Ionicons name="trash" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              Effacer toutes les notifications
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Ionicons name="information-circle" size={20} color={designSystem.colors.text.tertiary} />
          <Text style={[styles.infoText, { color: designSystem.colors.text.tertiary }]}>
            Les notifications push ne fonctionnent que sur un appareil physique.
            {'\n'}Les notifications sont envoyées localement et ne nécessitent pas de connexion internet.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SettingRowProps {
  icon: any;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
  colors: any;
  disabled?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  title,
  subtitle,
  value,
  onToggle,
  colors,
  disabled = false,
}) => {
  return (
    <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
      <View style={styles.settingIcon}>
        <Ionicons
          name={icon}
          size={24}
          color={disabled ? colors.text.disabled : colors.primary[500]}
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: disabled ? colors.text.disabled : colors.text.primary }]}>
          {title}
        </Text>
        <Text style={[styles.settingSubtitle, { color: colors.text.tertiary }]}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colors.neutral[300], true: colors.primary[200] }}
        thumbColor={value ? colors.primary[500] : colors.neutral[500]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 13,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    flexDirection: 'row',
    margin: 16,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
