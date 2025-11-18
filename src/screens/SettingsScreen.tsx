// src/screens/SettingsScreen.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { useTheme } from '../context/ThemeContext';

export const SettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <SafeAreaView>
      <ScrollView style={[styles.container, isDark && styles.darkContainer]}>
        <Text style={[styles.title, isDark && styles.darkText]}>
          Paramètres
        </Text>

        {/* Autres sections de paramètres */}
        <View style={[styles.section, isDark && styles.darkSection]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
            Général
          </Text>
          <Text style={[styles.sectionDescription, isDark && styles.darkSubtext]}>
            Paramètres généraux de l'application
          </Text>
        </View>

        <View style={[styles.section, isDark && styles.darkSection]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
            Sécurité
          </Text>
          <Text style={[styles.sectionDescription, isDark && styles.darkSubtext]}>
            Paramètres de sécurité et authentification
          </Text>
        </View>

        <View style={[styles.section, isDark && styles.darkSection]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
            Notifications
          </Text>
          <Text style={[styles.sectionDescription, isDark && styles.darkSubtext]}>
            Gestion des notifications et alertes
          </Text>
        </View>

        <View style={[styles.section, isDark && styles.darkSection]}>
          <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
            Sauvegarde
          </Text>
          <Text style={[styles.sectionDescription, isDark && styles.darkSubtext]}>
            Sauvegarde et restauration des données
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  darkContainer: {
    backgroundColor: '#1c1c1e',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  darkSection: {
    backgroundColor: '#2c2c2e',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default SettingsScreen;