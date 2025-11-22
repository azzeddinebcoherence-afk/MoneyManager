// src/screens/BiometricLockScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDesignSystem } from '../context/ThemeContext';
import { useBiometricAuth } from '../hooks/useBiometricAuth';

interface BiometricLockScreenProps {
  onUnlock: () => void;
}

export const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({ onUnlock }) => {
  const { colors } = useDesignSystem();
  const { authenticate, biometricAvailable, biometricType, isLoading } = useBiometricAuth();
  const [attemptCount, setAttemptCount] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Lancer l'authentification automatiquement au montage
    handleAuthenticate();
  }, []);

  const handleAuthenticate = async () => {
    if (isAuthenticating) return;

    setIsAuthenticating(true);
    setAttemptCount(prev => prev + 1);

    try {
      const result = await authenticate();
      
      if (result.success) {
        console.log('✅ Authentification biométrique réussie');
        onUnlock();
      } else {
        console.log('❌ Authentification échouée:', result.error);
        
        // Après 3 tentatives échouées, afficher un message
        if (attemptCount >= 2) {
          Alert.alert(
            'Authentification échouée',
            'Trop de tentatives échouées. Veuillez réessayer.',
            [
              {
                text: 'Réessayer',
                onPress: () => {
                  setAttemptCount(0);
                  setTimeout(handleAuthenticate, 500);
                }
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('❌ Erreur authentification:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de l\'authentification',
        [
          {
            text: 'Réessayer',
            onPress: () => setTimeout(handleAuthenticate, 500)
          }
        ]
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.content}>
        {/* Icône de verrouillage */}
        <View style={[styles.iconContainer, { backgroundColor: colors.primary[100] }]}>
          <Ionicons name="lock-closed" size={80} color={colors.primary[500]} />
        </View>

        {/* Titre */}
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Application verrouillée
        </Text>

        {/* Sous-titre */}
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          {biometricAvailable 
            ? `Utilisez ${biometricType} pour déverrouiller`
            : 'Authentification biométrique non disponible'
          }
        </Text>

        {/* Indicateur de tentatives */}
        {attemptCount > 0 && (
          <View style={[styles.attemptIndicator, { backgroundColor: colors.semantic.warning + '20' }]}>
            <Ionicons name="warning-outline" size={20} color={colors.semantic.warning} />
            <Text style={[styles.attemptText, { color: colors.semantic.warning }]}>
              Tentative {attemptCount}
            </Text>
          </View>
        )}

        {/* Bouton de déverrouillage */}
        <TouchableOpacity
          style={[
            styles.unlockButton,
            { backgroundColor: colors.primary[500] },
            (isAuthenticating || isLoading) && styles.buttonDisabled
          ]}
          onPress={handleAuthenticate}
          disabled={isAuthenticating || isLoading}
        >
          {(isAuthenticating || isLoading) ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="finger-print" size={24} color="#fff" />
              <Text style={styles.buttonText}>Déverrouiller</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Information de sécurité */}
        <View style={[styles.securityInfo, { backgroundColor: colors.background.secondary }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary[500]} />
          <Text style={[styles.securityText, { color: colors.text.secondary }]}>
            Vos données sont protégées par {biometricType}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  attemptIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  attemptText: {
    fontSize: 14,
    fontWeight: '600',
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  securityText: {
    fontSize: 13,
    flex: 1,
  },
});
