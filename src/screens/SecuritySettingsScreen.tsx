// src/screens/SecuritySettingsScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { useDesignSystem } from '../context/ThemeContext';

export const SecuritySettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useDesignSystem();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);

  const handleChangePassword = () => {
    Alert.alert(
      'Changer le mot de passe',
      'Cette fonctionnalité sera bientôt disponible',
      [{ text: 'OK' }]
    );
  };

  const handleBiometricToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Activer la biométrie',
        'Voulez-vous activer Face ID/Touch ID ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Activer',
            onPress: () => {
              setBiometricEnabled(true);
              Alert.alert('Succès', 'Biométrie activée');
            },
          },
        ]
      );
    } else {
      setBiometricEnabled(false);
    }
  };

  const handlePinToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Créer un code PIN',
        'Cette fonctionnalité sera bientôt disponible',
        [{ text: 'OK' }]
      );
    } else {
      setPinEnabled(false);
    }
  };

  return (
    <SafeAreaView>
      <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Section Mot de passe */}
        <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>
          MOT DE PASSE
        </Text>
        <TouchableOpacity
          style={[styles.settingCard, { backgroundColor: colors.background.secondary }]}
          onPress={handleChangePassword}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#FF3B3020' }]}>
            <Ionicons name="key-outline" size={24} color="#FF3B30" />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text.primary }]}>
              Changer le mot de passe
            </Text>
            <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
              Modifier votre mot de passe actuel
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Section Biométrie */}
        <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>
          BIOMÉTRIE
        </Text>
        <View style={[styles.settingCard, { backgroundColor: colors.background.secondary }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#34C75920' }]}>
            <Ionicons name="finger-print-outline" size={24} color="#34C759" />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text.primary }]}>
              Face ID / Touch ID
            </Text>
            <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
              Déverrouiller avec la biométrie
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={handleBiometricToggle}
            trackColor={{ false: colors.text.tertiary, true: colors.primary[500] }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Section Code PIN */}
        <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>
          CODE PIN
        </Text>
        <View style={[styles.settingCard, { backgroundColor: colors.background.secondary }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#5856D620' }]}>
            <Ionicons name="lock-closed-outline" size={24} color="#5856D6" />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text.primary }]}>
              Code PIN
            </Text>
            <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
              Protéger l'app avec un code
            </Text>
          </View>
          <Switch
            value={pinEnabled}
            onValueChange={handlePinToggle}
            trackColor={{ false: colors.text.tertiary, true: colors.primary[500] }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Informations de sécurité */}
        <View style={[styles.infoCard, { backgroundColor: colors.primary[50] }]}>
          <Ionicons name="information-circle" size={24} color={colors.primary[500]} />
          <Text style={[styles.infoText, { color: colors.primary[700] }]}>
            Activez au moins une méthode de sécurité pour protéger vos données financières.
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
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 24,
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
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
  iconContainer: {
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
  infoCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default SecuritySettingsScreen;
