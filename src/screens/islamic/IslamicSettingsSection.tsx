// src/screens/islamic/IslamicSettingsSection.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from '../../components/SafeAreaView';
import { useTheme } from '../../context/ThemeContext';
import { useIslamicCharges } from '../../hooks/useIslamicCharges';
import { IslamicSettings } from '../../types/IslamicCharge';

export const IslamicSettingsSection: React.FC = () => {
  const { theme } = useTheme();
  const { settings, saveSettings, generateChargesForCurrentYear } = useIslamicCharges();
  
  const [isLoading, setIsLoading] = useState(false);

  const isDark = theme === 'dark';

  const handleToggleSetting = async (key: keyof IslamicSettings, value: any) => {
    try {
      const newSettings = {
        ...settings,
        [key]: value
      };
      await saveSettings(newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour les paramètres');
    }
  };

  const handleGenerateCharges = async () => {
    setIsLoading(true);
    try {
      await generateChargesForCurrentYear();
      Alert.alert('Succès', 'Charges islamiques générées avec succès');
    } catch (error) {
      console.error('Error generating charges:', error);
      Alert.alert('Erreur', 'Impossible de générer les charges islamiques');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Réinitialiser',
      'Êtes-vous sûr de vouloir réinitialiser les paramètres islamiques ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Réinitialiser', 
          style: 'destructive',
          onPress: async () => {
            try {
              // ✅ CORRECTION : Ajout des propriétés manquantes
              const defaultSettings: IslamicSettings = {
                isEnabled: false,
                calculationMethod: 'UmmAlQura',
                customCharges: [],
                autoCreateCharges: true,
                includeRecommended: true,
                defaultAmounts: {
                  obligatory: 100,
                  recommended: 50
                }
              };
              await saveSettings(defaultSettings);
              Alert.alert('Succès', 'Paramètres réinitialisés');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de réinitialiser les paramètres');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView>
      <ScrollView 
        style={[styles.container, isDark && styles.darkContainer]}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.title, isDark && styles.darkText]}>
          Paramètres Islamiques
        </Text>

        {/* Activation des charges islamiques */}
        <View style={[styles.settingCard, isDark && styles.darkSettingCard]}>
          <View style={styles.settingHeader}>
            <Text style={[styles.settingTitle, isDark && styles.darkText]}>
              Charges Islamiques
            </Text>
            <Switch
              value={settings.isEnabled}
              onValueChange={(value) => handleToggleSetting('isEnabled', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={settings.isEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>
          <Text style={[styles.settingDescription, isDark && styles.darkSubtext]}>
            Activez cette fonctionnalité pour gérer les charges liées aux fêtes musulmanes
          </Text>
        </View>

        {settings.isEnabled && (
          <>
            {/* Méthode de calcul */}
            <View style={[styles.settingCard, isDark && styles.darkSettingCard]}>
              <Text style={[styles.settingTitle, isDark && styles.darkText]}>
                Méthode de Calcul
              </Text>
              <Text style={[styles.settingDescription, isDark && styles.darkSubtext]}>
                Choisissez la méthode de calcul des dates islamiques
              </Text>
              
              <View style={styles.methodsContainer}>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    settings.calculationMethod === 'UmmAlQura' && styles.methodButtonSelected,
                    isDark && styles.darkMethodButton
                  ]}
                  onPress={() => handleToggleSetting('calculationMethod', 'UmmAlQura')}
                >
                  <Text style={[
                    styles.methodText,
                    settings.calculationMethod === 'UmmAlQura' && styles.methodTextSelected
                  ]}>
                    Umm al-Qura
                  </Text>
                  <Text style={[styles.methodSubtext, isDark && styles.darkSubtext]}>
                    Méthode saoudienne
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    settings.calculationMethod === 'Fixed' && styles.methodButtonSelected,
                    isDark && styles.darkMethodButton
                  ]}
                  onPress={() => handleToggleSetting('calculationMethod', 'Fixed')}
                >
                  <Text style={[
                    styles.methodText,
                    settings.calculationMethod === 'Fixed' && styles.methodTextSelected
                  ]}>
                    Dates fixes
                  </Text>
                  <Text style={[styles.methodSubtext, isDark && styles.darkSubtext]}>
                    Calendrier fixe
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Création automatique */}
            <View style={[styles.settingCard, isDark && styles.darkSettingCard]}>
              <View style={styles.settingHeader}>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, isDark && styles.darkText]}>
                    Création Automatique
                  </Text>
                  <Text style={[styles.settingDescription, isDark && styles.darkSubtext]}>
                    Générer automatiquement les charges pour l'année en cours
                  </Text>
                </View>
                <Switch
                  value={settings.autoCreateCharges}
                  onValueChange={(value) => handleToggleSetting('autoCreateCharges', value)}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={settings.autoCreateCharges ? '#007AFF' : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Inclure les charges recommandées */}
            <View style={[styles.settingCard, isDark && styles.darkSettingCard]}>
              <View style={styles.settingHeader}>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, isDark && styles.darkText]}>
                    Charges Recommandées
                  </Text>
                  <Text style={[styles.settingDescription, isDark && styles.darkSubtext]}>
                    Inclure les charges recommandées (non obligatoires)
                  </Text>
                </View>
                <Switch
                  value={settings.includeRecommended}
                  onValueChange={(value) => handleToggleSetting('includeRecommended', value)}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={settings.includeRecommended ? '#007AFF' : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Montants par défaut */}
            <View style={[styles.settingCard, isDark && styles.darkSettingCard]}>
              <Text style={[styles.settingTitle, isDark && styles.darkText]}>
                Montants par Défaut
              </Text>
              
              <View style={styles.amountsContainer}>
                <View style={styles.amountItem}>
                  <Text style={[styles.amountLabel, isDark && styles.darkSubtext]}>
                    Obligatoires
                  </Text>
                  <Text style={[styles.amountValue, isDark && styles.darkText]}>
                    {settings.defaultAmounts.obligatory} MAD
                  </Text>
                </View>
                
                <View style={styles.amountItem}>
                  <Text style={[styles.amountLabel, isDark && styles.darkSubtext]}>
                    Recommandées
                  </Text>
                  <Text style={[styles.amountValue, isDark && styles.darkText]}>
                    {settings.defaultAmounts.recommended} MAD
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={[styles.settingCard, isDark && styles.darkSettingCard]}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                Actions
              </Text>
              
              <TouchableOpacity
                style={[styles.actionButton, isDark && styles.darkActionButton]}
                onPress={handleGenerateCharges}
                disabled={isLoading}
              >
                <Text style={[styles.actionButtonText, isDark && styles.darkText]}>
                  {isLoading ? 'Génération...' : '🔄 Générer les Charges'}
                </Text>
                <Text style={[styles.actionDescription, isDark && styles.darkSubtext]}>
                  Créer toutes les charges islamiques pour cette année
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton, isDark && styles.darkDangerButton]}
                onPress={handleResetSettings}
              >
                <Text style={styles.dangerButtonText}>
                  🗑️ Réinitialiser les Paramètres
                </Text>
                <Text style={[styles.actionDescription, isDark && styles.darkSubtext]}>
                  Remettre les paramètres par défaut
                </Text>
              </TouchableOpacity>
            </View>

            {/* Informations */}
            <View style={[styles.settingCard, isDark && styles.darkSettingCard]}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
                Informations
              </Text>
              
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, isDark && styles.darkSubtext]}>
                  Fêtes gérées
                </Text>
                <Text style={[styles.infoValue, isDark && styles.darkText]}>
                  5 fêtes principales
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, isDark && styles.darkSubtext]}>
                  Méthode actuelle
                </Text>
                <Text style={[styles.infoValue, isDark && styles.darkText]}>
                  {settings.calculationMethod === 'UmmAlQura' ? 'Umm al-Qura' : 'Dates fixes'}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, isDark && styles.darkSubtext]}>
                  Création auto
                </Text>
                <Text style={[styles.infoValue, isDark && styles.darkText]}>
                  {settings.autoCreateCharges ? 'Activée' : 'Désactivée'}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, isDark && styles.darkSubtext]}>
                  Charges recommandées
                </Text>
                <Text style={[styles.infoValue, isDark && styles.darkText]}>
                  {settings.includeRecommended ? 'Inclues' : 'Exclues'}
                </Text>
              </View>
            </View>
          </>
        )}

        {!settings.isEnabled && (
          <View style={[styles.disabledState, isDark && styles.darkDisabledState]}>
            <Text style={[styles.disabledText, isDark && styles.darkSubtext]}>
              ⭐ Activez les charges islamiques pour accéder à toutes les fonctionnalités
            </Text>
            <Text style={[styles.disabledDescription, isDark && styles.darkSubtext]}>
              Cette fonctionnalité vous permet de gérer automatiquement les charges liées aux fêtes musulmanes comme le Ramadan, l'Aïd al-Fitr, l'Aïd al-Adha, etc.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  darkContainer: {
    backgroundColor: '#1c1c1e',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 24,
    textAlign: 'center',
  },
  settingCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkSettingCard: {
    backgroundColor: '#2c2c2e',
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  methodsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  methodButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  darkMethodButton: {
    backgroundColor: '#38383a',
  },
  methodButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  methodTextSelected: {
    color: '#fff',
  },
  methodSubtext: {
    fontSize: 12,
    color: '#666',
  },
  amountsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  amountItem: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  darkActionButton: {
    backgroundColor: '#38383a',
    borderColor: '#555',
  },
  dangerButton: {
    backgroundColor: '#fff5f5',
    borderColor: '#fed7d7',
  },
  darkDangerButton: {
    backgroundColor: '#2a1a1a',
    borderColor: '#742a2a',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e53e3e',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#666',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  disabledState: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  darkDisabledState: {
    backgroundColor: '#2c2c2e',
  },
  disabledText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  disabledDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default IslamicSettingsSection;