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
import { useTheme } from '../context/ThemeContext';
import { useSmartAlerts } from '../hooks/useSmartAlerts';
import { Alert } from '../types/Alert';

type TabType = 'toutes' | 'nonLues' | 'alertes';

const NotificationsScreen = () => {
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
      budget: { icon: 'notifications', bgColor: '#E8EAFF', iconColor: '#5856D6' },
      debt: { icon: 'time', bgColor: '#F4EBFF', iconColor: '#AF52DE' },
      bill: { icon: 'warning', bgColor: '#FFF4E3', iconColor: '#FF9500' },
      security: { icon: 'shield-checkmark', bgColor: '#FFEBEE', iconColor: '#FF3B30' },
      
      // Notifications informatives
      transaction: { icon: 'swap-horizontal', bgColor: '#E3F2FD', iconColor: '#007AFF' },
      payment: { icon: 'card', bgColor: '#E8F5E9', iconColor: '#34C759' },
      refund: { icon: 'arrow-undo', bgColor: '#E8F5E9', iconColor: '#34C759' },
      transfer: { icon: 'git-compare', bgColor: '#FFF4E3', iconColor: '#FF9500' },
      
      // Épargne et objectifs
      savings: { icon: 'trending-up', bgColor: '#E3F9E5', iconColor: '#34C759' },
      goal: { icon: 'trophy', bgColor: '#FFF9E6', iconColor: '#FFD60A' },
      
      // Système
      account: { icon: 'wallet', bgColor: '#E8EAFF', iconColor: '#5856D6' },
      report: { icon: 'bar-chart', bgColor: '#F4EBFF', iconColor: '#AF52DE' },
      backup: { icon: 'cloud-upload', bgColor: '#E3F2FD', iconColor: '#007AFF' },
      sync: { icon: 'refresh-circle', bgColor: '#E3F2FD', iconColor: '#007AFF' },
      
      // Général
      reminder: { icon: 'alarm', bgColor: '#FFF4E3', iconColor: '#FF9500' },
      success: { icon: 'checkmark-circle', bgColor: '#E3F9E5', iconColor: '#34C759' },
      info: { icon: 'information-circle', bgColor: '#E3F2FD', iconColor: '#007AFF' },
      system: { icon: 'settings', bgColor: '#F5F5F5', iconColor: '#8E8E93' },
      summary: { icon: 'document-text', bgColor: '#F4EBFF', iconColor: '#AF52DE' },
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
        style={[styles.notificationCard, isDark && styles.darkCard]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
          <Ionicons name={icon as any} size={24} color={iconColor} />
        </View>

        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, isDark && styles.darkText]}>
            {notification.title}
          </Text>
          <Text style={[styles.notificationSubtitle, isDark && styles.darkSubtext]}>
            {notification.message} • {formatTime(notification.createdAt)}
          </Text>
        </View>

        {!notification.read && <View style={styles.unreadBadge} />}
      </TouchableOpacity>
    );
  };

  const renderTab = (tab: TabType, label: string, count?: number) => (
    <TouchableOpacity
      style={[styles.tab, activeTab === tab && styles.activeTab]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {label}
      </Text>
      {count !== undefined && count > 0 && activeTab !== tab && (
        <View style={styles.tabCount}>
          <Text style={styles.tabCountText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.darkHeader]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#1C1C1E'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.darkText]}>Notifications</Text>
        <View style={styles.backButton} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, isDark && styles.darkTabsContainer]}>
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
            tintColor={isDark ? '#fff' : '#000'}
          />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={isDark ? '#333' : '#E5E5E5'}
            />
            <Text style={[styles.emptyTitle, isDark && styles.darkText]}>
              Aucune notification
            </Text>
            <Text style={[styles.emptySubtitle, isDark && styles.darkSubtext]}>
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
                <Text style={[styles.sectionTitle, isDark && styles.darkSubtext]}>
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
    backgroundColor: '#F2F2F7',
  },
  darkContainer: {
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#F2F2F7',
  },
  darkHeader: {
    backgroundColor: '#000',
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
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#999',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#F2F2F7',
  },
  darkTabsContainer: {
    backgroundColor: '#000',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabCount: {
    backgroundColor: 'rgba(142, 142, 147, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
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
    color: '#1C1C1E',
    marginBottom: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  darkCard: {
    backgroundColor: '#1C1C1E',
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
    color: '#1C1C1E',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
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
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NotificationsScreen;
