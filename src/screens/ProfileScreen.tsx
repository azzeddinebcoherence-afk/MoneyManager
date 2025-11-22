// src/screens/ProfileScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { ChangePasswordModal } from '../components/modals/ChangePasswordModal';
import { EditEmailModal } from '../components/modals/EditEmailModal';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';

const ProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, logout, changePassword, updateEmail } = useAuth();
  const { formatAmount, currency } = useCurrency();
  const isDark = theme === 'dark';

  // Hooks pour récupérer les données
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { accountsCount } = useAccounts();

  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Date d'inscription
  const getMemberSince = () => {
    if (user?.createdAt) {
      const date = new Date(user.createdAt);
      return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
    return 'Janvier 2024';
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView>
      <ScrollView style={[styles.container, isDark && styles.darkContainer]}>
        {/* En-tête avec avatar */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, isDark && styles.darkAvatar]}>
              <Ionicons name="person" size={48} color={isDark ? '#fff' : '#6C63FF'} />
            </View>
            <View style={styles.badge}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          </View>
          <Text style={[styles.name, isDark && styles.darkText]}>
            {user?.email?.split('@')[0] || 'Utilisateur'}
          </Text>
          <Text style={[styles.email, isDark && styles.darkSubtext]}>
            {user?.email || 'utilisateur@example.com'}
          </Text>
        </View>

        {/* Statistiques */}
        <View style={[styles.statsCard, isDark && styles.darkCard]}>
          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
            </View>
            <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>Membre depuis</Text>
            <Text style={[styles.statValue, isDark && styles.darkText]}>{getMemberSince()}</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="swap-horizontal-outline" size={20} color="#FF9800" />
            </View>
            <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>Transactions totales</Text>
            <Text style={[styles.statValue, isDark && styles.darkText]}>{transactions.length}</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <View style={[styles.statIconBox, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="grid-outline" size={20} color="#9C27B0" />
            </View>
            <Text style={[styles.statLabel, isDark && styles.darkSubtext]}>Catégories actives</Text>
            <Text style={[styles.statValue, isDark && styles.darkText]}>{categories.length}</Text>
          </View>
        </View>

        {/* Comptes */}
        <View style={[styles.infoCard, isDark && styles.darkCard]}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="card-outline" size={20} color="#6C63FF" />
              <Text style={[styles.infoLabel, isDark && styles.darkText]}>Comptes actifs</Text>
            </View>
            <Text style={[styles.infoValue, isDark && styles.darkText]}>{accountsCount}</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="cash-outline" size={20} color="#4CAF50" />
              <Text style={[styles.infoLabel, isDark && styles.darkText]}>Devise</Text>
            </View>
            <Text style={[styles.infoValue, isDark && styles.darkText]}>{currency.code} - {currency.name}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Actions</Text>

          <TouchableOpacity 
            style={[styles.actionButton, isDark && styles.darkCard]}
            onPress={() => setShowEmailModal(true)}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FFF8E1' }]}>
              <Ionicons name="create-outline" size={22} color="#FFC107" />
            </View>
            <Text style={[styles.actionText, isDark && styles.darkText]}>Modifier l'email</Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : '#ccc'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, isDark && styles.darkCard]}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="lock-closed-outline" size={22} color="#2196F3" />
            </View>
            <Text style={[styles.actionText, isDark && styles.darkText]}>Changer le mot de passe</Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : '#ccc'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, isDark && styles.darkCard]}
            onPress={() => navigation?.navigate('SecuritySettings')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#9C27B0" />
            </View>
            <Text style={[styles.actionText, isDark && styles.darkText]}>Sécurité</Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : '#ccc'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, isDark && styles.darkCard]}
            onPress={() => navigation?.navigate('Backup')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="cloud-upload-outline" size={22} color="#4CAF50" />
            </View>
            <Text style={[styles.actionText, isDark && styles.darkText]}>Sauvegarde & Export</Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : '#ccc'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="log-out-outline" size={22} color="#F44336" />
            </View>
            <Text style={[styles.actionText, { color: '#F44336' }]}>Se déconnecter</Text>
            <Ionicons name="chevron-forward" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={changePassword}
        isDark={isDark}
      />

      <EditEmailModal
        visible={showEmailModal}
        currentEmail={user?.email || ''}
        onClose={() => setShowEmailModal(false)}
        onSubmit={updateEmail}
        isDark={isDark}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },

  // Header avec avatar
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  darkAvatar: {
    backgroundColor: '#2c2c2e',
    borderColor: '#1c1c1e',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#17233C',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Statistiques card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  darkCard: {
    backgroundColor: '#1E1E1E',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17233C',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },

  // Info card (Comptes et Devise)
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#17233C',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6C63FF',
  },

  // Actions section
  actionsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#17233C',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#17233C',
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#FFEBEE',
  },

  // Dark theme
  darkText: {
    color: '#F9FAFB',
  },
  darkSubtext: {
    color: '#9CA3AF',
  },
});

export default ProfileScreen;