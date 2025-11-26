// src/screens/IslamicOnboardingScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from '../components/SafeAreaView';
import { useDesignSystem, useTheme } from '../context/ThemeContext';
import { useIslamicCharges } from '../hooks/useIslamicCharges';
import { DEFAULT_ISLAMIC_SETTINGS } from '../types/IslamicCharge';

const ISLAMIC_ONBOARDING_KEY = '@islamic_onboarding_completed';

interface IslamicOnboardingScreenProps {
  onComplete: () => void;
}

export const IslamicOnboardingScreen: React.FC<IslamicOnboardingScreenProps> = ({ onComplete }) => {
  const { colors } = useDesignSystem();
  const { theme } = useTheme();
  const { saveSettings, generateChargesForCurrentYear } = useIslamicCharges();
  const [loading, setLoading] = useState(false);
  const isDark = theme === 'dark';

  const handleChoice = async (enableIslamic: boolean) => {
    try {
      setLoading(true);

      // Sauvegarder le choix de l'utilisateur avec les paramètres complets
      const newSettings = {
        ...DEFAULT_ISLAMIC_SETTINGS,
        isEnabled: enableIslamic,
        autoCreateCharges: enableIslamic
      };
      await saveSettings(newSettings);

      // Si l'utilisateur active les charges islamiques, les générer automatiquement
      if (enableIslamic) {
        const currentYear = new Date().getFullYear();
        await generateChargesForCurrentYear();
        console.log(`✅ Charges islamiques générées pour ${currentYear}`);
      }

      // Marquer l'onboarding comme complété
      await AsyncStorage.setItem(ISLAMIC_ONBOARDING_KEY, 'true');

      // Continuer vers l'app
      onComplete();
    } catch (error) {
      console.error('❌ Erreur lors de la configuration des charges islamiques:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue. Vous pourrez configurer cela plus tard dans les paramètres.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await AsyncStorage.setItem(ISLAMIC_ONBOARDING_KEY, 'true');
              onComplete();
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.primary[100] }]}>
          <Ionicons name="moon" size={64} color={colors.primary[500]} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Charges Islamiques
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.text.secondary }]}>
          Souhaitez-vous activer le suivi automatique des charges islamiques (Zakat, Ramadan, Aid, etc.) ?
          {'\n\n'}
          Ces charges seront ajoutées à votre planning annuel et vous recevrez des rappels avant leur échéance.
        </Text>

        {/* Buttons */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary[500]} style={styles.loader} />
        ) : (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary[500] }]}
              onPress={() => handleChoice(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Oui, activer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { 
                backgroundColor: isDark ? colors.background.card : colors.background.secondary,
                borderColor: colors.border.primary 
              }]}
              onPress={() => handleChoice(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={24} color={colors.text.secondary} />
              <Text style={[styles.secondaryButtonText, { color: colors.text.primary }]}>
                Non, peut-être plus tard
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer note */}
        <Text style={[styles.footerNote, { color: colors.text.tertiary }]}>
          Vous pourrez modifier ce choix à tout moment dans les paramètres
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '500',
  },
  loader: {
    marginVertical: 40,
  },
  footerNote: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
});

export default IslamicOnboardingScreen;

// Export helper to check if onboarding is needed
export const checkIfIslamicOnboardingNeeded = async (): Promise<boolean> => {
  try {
    const completed = await AsyncStorage.getItem(ISLAMIC_ONBOARDING_KEY);
    return completed !== 'true';
  } catch (error) {
    console.error('Error checking Islamic onboarding status:', error);
    return false;
  }
};
