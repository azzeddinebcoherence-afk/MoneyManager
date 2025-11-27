// src/screens/SettingsScreen.tsx - VERSION MODERNE
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useDesignSystem } from '../context/ThemeContext';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useDesignSystem();
  const { t } = useLanguage();
  const { user } = useAuth();

  // Extraction du nom depuis l'email
  const userName = user?.email ? user.email.split('@')[0].split('.')[0] : t.user;
  const capitalizedUserName = userName.charAt(0).toUpperCase() + userName.slice(1);
  
  const handleNavigate = (screenName: string) => {
    navigation.navigate(screenName);
  };

  const settingsSections = [
    {
      title: 'COMPTE',
      items: [
        {
          icon: 'person-outline',
          title: t.profile || 'Profil',
          description: 'Informations personnelles',
          color: colors.primary[500],
          screen: 'Profile',
        },
      ],
    },
    {
      title: 'PRÉFÉRENCES',
      items: [
        {
          icon: 'settings-outline',
          title: t.general,
          description: 'Devise, langue, thème',
          color: '#5AC8FA',
          screen: 'GeneralSettings',
        },
        {
          icon: 'notifications-outline',
          title: t.notifications,
          description: 'Gestion des notifications push',
          color: '#FF9500',
          screen: 'NotificationSettings',
        },
      ],
    },
    {
      title: 'SÉCURITÉ',
      items: [
        {
          icon: 'shield-checkmark-outline',
          title: t.security,
          description: 'Mot de passe, biométrie, code PIN',
          color: '#FF3B30',
          screen: 'SecuritySettings',
        },
        {
          icon: 'cloud-upload-outline',
          title: t.backup,
          description: 'Sauvegarde et restauration',
          color: '#34C759',
          screen: 'Backup',
        },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        {
          icon: 'information-circle-outline',
          title: t.about,
          description: 'Version, aide, conditions',
          color: '#5856D6',
          screen: 'AboutScreen',
        },
      ],
    },
  ];

  return (
    <SafeAreaView>
      <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Section Profil */}
        <View style={[styles.profileSection, { backgroundColor: colors.background.secondary }]}>
          <View style={[styles.profileImageContainer, { backgroundColor: colors.primary[100] }]}>
            <Ionicons name="person" size={48} color={colors.primary[500]} />
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text.primary }]}>
              {capitalizedUserName}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.text.secondary }]}>
              {user?.email || 'Non connecté'}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.primary[100] }]}>
              <Text style={[styles.roleText, { color: colors.primary[700] }]}>
                Utilisateur
              </Text>
            </View>
          </View>
        </View>

        {/* Titre Paramètres */}
        <Text style={[styles.pageTitle, { color: colors.text.primary }]}>
          Paramètres
        </Text>

        {/* Sections de paramètres avec catégories */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex}>
            <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>
              {section.title}
            </Text>
            
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[styles.settingCard, { backgroundColor: colors.background.secondary }]}
                onPress={() => handleNavigate(item.screen)}
                activeOpacity={0.7}
              >
                <View style={[styles.settingIconContainer, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text.primary }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                    {item.description}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Section Profil
  profileSection: {
    flexDirection: 'row',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Titre de la page
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginLeft: 24,
    marginTop: 20,
    marginBottom: 8,
  },
  
  // En-tête sections
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 24,
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  
  // Cartes de paramètres
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
});

export default SettingsScreen;