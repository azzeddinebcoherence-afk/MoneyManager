// src/screens/NotificationsScreen.tsx - Design moderne inspiré iOS
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDesignSystem, useTheme } from '../context/ThemeContext';
import { useSmartAlerts } from '../hooks/useSmartAlerts';
import { Alert } from '../types/Alert';

type TabType = 'toutes' | 'nonLues' | 'alertes';

const NotificationsScreen = () => {
  const { colors } = useDesignSystem();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigation = useNavigation();

  const { alerts, unreadCount, markAsRead, refreshAlerts } = useSmartAlerts();

  const [activeTab, setActiveTab] = useState<TabType>('toutes');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAlerts();
    setRefreshing(false);
  }, [refreshAlerts]);

  // Filtrer selon l'onglet actif
  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'toutes':
        return alerts;
      case 'nonLues':
        return alerts.filter((alert) => !alert.read);
      case 'alertes':
        return alerts.filter(
          (alert) => alert.priority === 'critical' || alert.priority === 'high'
        );
      default:
        return alerts;
    }
  }, [alerts, activeTab]);

  // Grouper par date
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Alert[] } = {
      "Aujourd'hui": [],
      Hier: [],
      'Cette semaine': [],
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    filteredNotifications.forEach((notification) => {
      const notifDate = new Date(notification.createdAt);
      notifDate.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - notifDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        groups["Aujourd'hui"].push(notification);
      } else if (diffDays === 1) {
        groups['Hier'].push(notification);
      } else if (diffDays <= 7) {
        groups['Cette semaine'].push(notification);
      }
    });

    return groups;
  }, [filteredNotifications]);

  const getIconAndColor = (notification: Alert) => {
    const config: {
      [key: string]: { icon: string; bgColor: string; iconColor: string };
    } = {
      // Alertes (priorité haute)
      budget: { icon: 'notifications', bgColor: colors.primary[500] + '20', iconColor: colors.primary[500] },
      debt: { icon: 'time', bgColor: colors.semantic.warning + '20', iconColor: colors.semantic.warning },
      bill: { icon: 'warning', bgColor: colors.semantic.warning + '20', iconColor: colors.semantic.warning },
      security: { icon: 'shield-checkmark', bgColor: colors.semantic.error + '20', iconColor: colors.semantic.error },
      
      // Notifications informatives
      transaction: { icon: 'swap-horizontal', bgColor: colors.primary[500] + '20', iconColor: colors.primary[500] },
      payment: { icon: 'card', bgColor: colors.semantic.success + '20', iconColor: colors.semantic.success },
      refund: { icon: 'arrow-undo', bgColor: colors.semantic.success + '20', iconColor: colors.semantic.success },
      transfer: { icon: 'git-compare', bgColor: colors.semantic.warning + '20', iconColor: colors.semantic.warning },
      
      // Épargne et objectifs
      savings: { icon: 'trending-up', bgColor: colors.semantic.success + '20', iconColor: colors.semantic.success },
      goal: { icon: 'trophy', bgColor: colors.semantic.warning + '20', iconColor: colors.semantic.warning },
      
      // Système
      account: { icon: 'wallet', bgColor: colors.primary[500] + '20', iconColor: colors.primary[500] },
      report: { icon: 'bar-chart', bgColor: colors.primary[500] + '20', iconColor: colors.primary[500] },
      backup: { icon: 'cloud-upload', bgColor: colors.primary[500] + '20', iconColor: colors.primary[500] },
      sync: { icon: 'refresh-circle', bgColor: colors.primary[500] + '20', iconColor: colors.primary[500] },
      
      // Général
      reminder: { icon: 'alarm', bgColor: colors.semantic.warning + '20', iconColor: colors.semantic.warning },
      success: { icon: 'checkmark-circle', bgColor: colors.semantic.success + '20', iconColor: colors.semantic.success },
      info: { icon: 'information-circle', bgColor: colors.primary[500] + '20', iconColor: colors.primary[500] },
      system: { icon: 'settings', bgColor: colors.text.disabled + '20', iconColor: colors.text.disabled },
      summary: { icon: 'document-text', bgColor: colors.primary[500] + '20', iconColor: colors.primary[500] },
    };

    return config[notification.type] || config.info;
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 60) return `Il y a ${diffMinutes}min`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hier';

    return `${diffDays} jours`;
  };

  const handleNotificationPress = (notification: Alert) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const renderNotificationItem = (notification: Alert) => {
    const { icon, bgColor, iconColor } = getIconAndColor(notification);

    return (
      <TouchableOpacity
        key={notification.id}
        style={[styles.notificationCard, { backgroundColor: colors.background.card }]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
          <Ionicons name={icon as any} size={24} color={iconColor} />
        </View>

        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, { color: colors.text.primary }]}>
            {notification.title}
          </Text>
          <Text style={[styles.notificationSubtitle, { color: colors.text.secondary }]}>
            {notification.message} • {formatTime(notification.createdAt)}
          </Text>
        </View>

        {!notification.read && <View style={[styles.unreadBadge, { backgroundColor: colors.primary[500] }]} />}
      </TouchableOpacity>
    );
  };

  const renderTab = (tab: TabType, label: string, count?: number) => (
    <TouchableOpacity
      style={[
        styles.tab,
        { backgroundColor: activeTab === tab ? colors.primary[500] : 'transparent' },
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Text
        style={[
          styles.tabText,
          { color: activeTab === tab ? colors.text.inverse : colors.text.secondary },
        ]}
      >
        {label}
      </Text>
      {count !== undefined && count > 0 && activeTab !== tab && (
        <View style={[styles.tabCount, { backgroundColor: colors.text.disabled + '30' }]}>
          <Text style={[styles.tabCountText, { color: colors.text.secondary }]}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Notifications</Text>
        <View style={styles.backButton} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.background.primary }]}>
        {renderTab('toutes', 'Toutes')}
        {renderTab(
          'nonLues',
          `Non lues${unreadCount > 0 ? ` (${unreadCount})` : ''}`,
          unreadCount
        )}
        {renderTab('alertes', 'Alertes')}
      </View>

      {/* Liste des notifications */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={colors.text.disabled}
            />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              Aucune notification
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
              {activeTab === 'nonLues'
                ? 'Toutes vos notifications sont lues'
                : 'Vous n\'avez pas encore de notifications'}
            </Text>
          </View>
        ) : (
          Object.entries(groupedNotifications).map(([group, notifications]) => {
            if (notifications.length === 0) return null;

            return (
              <View key={group} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  {group}
                </Text>
                {notifications.map(renderNotificationItem)}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
  },
  tabCount: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NotificationsScreen;
