// src/components/islamic/IslamicSettings.tsx - VERSION AVEC ICÔNE DANS HEADER
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
import { useTheme } from '../../context/ThemeContext';
import { useIslamicCharges } from '../../hooks/useIslamicCharges';
import { IslamicSettings as IslamicSettingsType } from '../../types/IslamicCharge';

interface IslamicSettingsProps {
  visible: boolean;
  onClose: () => void;
}

export const IslamicSettings: React.FC<IslamicSettingsProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const { settings, saveSettings, generateChargesForCurrentYear } = useIslamicCharges();
  
  const [localSettings, setLocalSettings] = useState<IslamicSettingsType>(settings);
  const [isLoading, setIsLoading] = useState(false);

  const isDark = theme === 'dark';

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await saveSettings(localSettings);
      
      if (localSettings.autoCreateCharges && localSettings.isEnabled) {
        await generateChargesForCurrentYear();
      }
      
      Alert.alert(
        '✅ Paramètres Sauvegardés', 
        'Les paramètres islamiques ont été sauvegardés avec succès.\n\n' +
        (localSettings.isEnabled ? 
          'Une icône étoile 📈 apparaîtra dans le header du Dashboard pour accéder aux charges islamiques.' : 
          'Les charges islamiques ont été désactivées.')
      );
      onClose();
    } catch (error) {
      console.error('Error saving islamic settings:', error);
      Alert.alert('❌ Erreur', 'Impossible de sauvegarder les paramètres');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof IslamicSettingsType, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!visible) return null;

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.darkText]}>
          ⚙️ Paramètres Islamiques
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Activation des charges islamiques */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, isDark && styles.darkText]}>
              Activer les charges islamiques
            </Text>
            <Text style={[styles.settingDescription, isDark && styles.darkSubtext]}>
              Active la gestion des charges liées aux fêtes musulmanes
            </Text>
          </View>
          <Switch
            value={localSettings.isEnabled}
            onValueChange={(value) => handleToggle('isEnabled', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={localSettings.isEnabled ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {/* Méthode de calcul */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, isDark && styles.darkText]}>
              Méthode de calcul
            </Text>
            <Text style={[styles.settingDescription, isDark && styles.darkSubtext]}>
              Méthode utilisée pour calculer les dates islamiques
            </Text>
          </View>
          <View style={styles.methodButtons}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                localSettings.calculationMethod === 'UmmAlQura' && styles.methodButtonSelected,
                isDark && styles.darkMethodButton
              ]}
              onPress={() => handleToggle('calculationMethod', 'UmmAlQura')}
            >
              <Text style={[
                styles.methodText,
                localSettings.calculationMethod === 'UmmAlQura' && styles.methodTextSelected,
                isDark && styles.darkText
              ]}>
                Umm Al-Qura
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.methodButton,
                localSettings.calculationMethod === 'Fixed' && styles.methodButtonSelected,
                isDark && styles.darkMethodButton
              ]}
              onPress={() => handleToggle('calculationMethod', 'Fixed')}
            >
              <Text style={[
                styles.methodText,
                localSettings.calculationMethod === 'Fixed' && styles.methodTextSelected,
                isDark && styles.darkText
              ]}>
                Dates fixes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Création automatique */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, isDark && styles.darkText]}>
              Création automatique
            </Text>
            <Text style={[styles.settingDescription, isDark && styles.darkSubtext]}>
              Créer automatiquement les charges pour l'année en cours
            </Text>
          </View>
          <Switch
            value={localSettings.autoCreateCharges}
            onValueChange={(value) => handleToggle('autoCreateCharges', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={localSettings.autoCreateCharges ? '#007AFF' : '#f4f3f4'}
            disabled={!localSettings.isEnabled}
          />
        </View>

        {/* Inclure les charges recommandées */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, isDark && styles.darkText]}>
              Inclure les charges recommandées
            </Text>
            <Text style={[styles.settingDescription, isDark && styles.darkSubtext]}>
              Inclure les charges recommandées (non obligatoires)
            </Text>
          </View>
          <Switch
            value={localSettings.includeRecommended}
            onValueChange={(value) => handleToggle('includeRecommended', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={localSettings.includeRecommended ? '#007AFF' : '#f4f3f4'}
            disabled={!localSettings.isEnabled}
          />
        </View>

        {/* Informations */}
        <View style={styles.infoBox}>
          <Text style={[styles.infoTitle, isDark && styles.darkText]}>
            💡 Fonctionnalité Charges Islamiques
          </Text>
          <Text style={[styles.infoText, isDark && styles.darkSubtext]}>
            • Gestion des charges liées aux fêtes musulmanes{'\n'}
            • Calcul automatique des dates selon le calendrier hégirien{'\n'}
            • Possibilité de définir des montants par défaut{'\n'}
            • Intégration avec les comptes pour prélèvement automatique{'\n'}
            • ✅ Une fois activé, une icône étoile 📈 apparaît dans le header du Dashboard
          </Text>
        </View>

        {/* État actuel */}
        <View style={[styles.statusBox, localSettings.isEnabled ? styles.statusEnabled : styles.statusDisabled]}>
          <Text style={[styles.statusTitle, isDark && styles.darkText]}>
            {localSettings.isEnabled ? '✅ Activé' : '❌ Désactivé'}
          </Text>
          <Text style={[styles.statusText, isDark && styles.darkSubtext]}>
            {localSettings.isEnabled ? 
              'Une icône étoile 📈 apparaît dans le header du Dashboard pour accéder aux charges islamiques.' : 
              'Les charges islamiques sont désactivées.'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.cancelButton, isDark && styles.darkCancelButton]}
          onPress={onClose}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  darkContainer: {
    backgroundColor: '#1c1c1e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
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
  methodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  methodButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  darkMethodButton: {
    backgroundColor: '#2c2c2e',
    borderColor: '#444',
  },
  methodButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  methodText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  methodTextSelected: {
    color: '#fff',
  },
  infoBox: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statusBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusEnabled: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  statusDisabled: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  darkCancelButton: {
    backgroundColor: '#2c2c2e',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  darkText: {
    color: '#fff',
  },
  darkSubtext: {
    color: '#888',
  },
});

export default IslamicSettings;