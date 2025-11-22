// src/screens/AboutScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { useDesignSystem } from '../context/ThemeContext';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

export const AboutScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useDesignSystem();

  const handleOpenLink = (url: string, title: string) => {
    Alert.alert(
      title,
      'Cette fonctionnalité sera bientôt disponible',
      [{ text: 'OK' }]
    );
  };

  const aboutItems = [
    {
      icon: 'information-circle-outline',
      title: 'Version',
      value: `${APP_VERSION} (${BUILD_NUMBER})`,
      color: colors.primary[500],
    },
    {
      icon: 'help-circle-outline',
      title: 'Aide & Support',
      subtitle: 'Obtenez de l\'aide',
      color: '#34C759',
      onPress: () => handleOpenLink('support', 'Aide & Support'),
    },
    {
      icon: 'document-text-outline',
      title: 'Conditions d\'utilisation',
      subtitle: 'Lire les conditions',
      color: '#5856D6',
      onPress: () => handleOpenLink('terms', 'Conditions d\'utilisation'),
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Politique de confidentialité',
      subtitle: 'Protection des données',
      color: '#FF9500',
      onPress: () => handleOpenLink('privacy', 'Politique de confidentialité'),
    },
  ];

  return (
    <SafeAreaView>
      <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Logo et nom de l'app */}
        <View style={[styles.appHeader, { backgroundColor: colors.background.secondary }]}>
          <View style={[styles.appIconContainer, { backgroundColor: colors.primary[100] }]}>
            <Ionicons name="wallet" size={48} color={colors.primary[500]} />
          </View>
          <Text style={[styles.appName, { color: colors.text.primary }]}>
            MoneyManager
          </Text>
          <Text style={[styles.appTagline, { color: colors.text.secondary }]}>
            Gérez vos finances intelligemment
          </Text>
        </View>

        {/* Informations */}
        <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>
          INFORMATIONS
        </Text>
        {aboutItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.aboutCard, { backgroundColor: colors.background.secondary }]}
            onPress={item.onPress}
            disabled={!item.onPress}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.aboutContent}>
              <Text style={[styles.aboutTitle, { color: colors.text.primary }]}>
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={[styles.aboutSubtitle, { color: colors.text.secondary }]}>
                  {item.subtitle}
                </Text>
              )}
              {item.value && (
                <Text style={[styles.aboutValue, { color: colors.text.secondary }]}>
                  {item.value}
                </Text>
              )}
            </View>
            {item.onPress && (
              <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
            )}
          </TouchableOpacity>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text.tertiary }]}>
            Fait avec ❤️ pour vous
          </Text>
          <Text style={[styles.footerText, { color: colors.text.tertiary }]}>
            © 2024 MoneyManager
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // En-tête app
  appHeader: {
    alignItems: 'center',
    padding: 32,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  appIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Sections
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 24,
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  
  // Cartes d'information
  aboutCard: {
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  aboutContent: {
    flex: 1,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  aboutSubtitle: {
    fontSize: 13,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 13,
    marginBottom: 4,
  },
});

export default AboutScreen;
