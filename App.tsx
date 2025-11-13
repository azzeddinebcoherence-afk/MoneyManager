// App.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import * as Font from 'expo-font';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CurrencyProvider } from './src/context/CurrencyContext';

// Components
import { DatabaseLoader } from './src/components/DatabaseLoader';
import { SafeAreaView } from './src/components/SafeAreaView';

// Context Providers
import { DatabaseProvider } from './src/context/DatabaseContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Navigation 
import ModernDrawerNavigator from './src/navigation/ModernDrawerNavigator';

// Hook pour l'initialisation des polices
const useAppInitialization = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const initializeApp = async () => {
    try {
      console.log('🚀 Démarrage de l\'initialisation de l\'application...');
      setIsRetrying(false);
      
      // Étape 1: Chargement des polices
      console.log('🔤 Chargement des polices Ionicons...');
      await Font.loadAsync({
        ...Ionicons.font,
      });
      setFontsLoaded(true);
      console.log('✅ Polices Ionicons chargées avec succès');
      
      setInitializationError(null);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'initialisation';
      console.error('❌ Erreur d\'initialisation:', errorMessage);
      setInitializationError(errorMessage);
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  const retryInitialization = async () => {
    console.log('🔄 Nouvelle tentative d\'initialisation...');
    setIsRetrying(true);
    setInitializationError(null);
    setFontsLoaded(false);
    
    await initializeApp();
    setIsRetrying(false);
  };

  const continueDespiteError = () => {
    console.log('⏭️ Continuation malgré l\'erreur...');
    setFontsLoaded(true);
    setInitializationError(null);
  };

  return { 
    isAppReady: fontsLoaded,
    initializationError, 
    isRetrying,
    retryInitialization,
    continueDespiteError,
  };
};

// Composant de chargement
const InitialLoader = ({ 
  message = "Initialisation de l'application...",
  subMessage 
}: { 
  message?: string;
  subMessage?: string;
}) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.loadingText}>{message}</Text>
    {subMessage && <Text style={styles.loadingSubtext}>{subMessage}</Text>}
    
    {/* Test d'affichage d'icônes pendant le chargement */}
    <View style={styles.iconTest}>
      <Ionicons name="home" size={24} color="#007AFF" style={styles.testIcon} />
      <Ionicons name="settings" size={24} color="#007AFF" style={styles.testIcon} />
      <Ionicons name="notifications" size={24} color="#007AFF" style={styles.testIcon} />
    </View>
  </View>
);

// Composant d'erreur d'initialisation
const InitializationErrorScreen = ({ 
  error, 
  onRetry, 
  onContinue,
  isRetrying 
}: { 
  error: string; 
  onRetry: () => void;
  onContinue: () => void;
  isRetrying: boolean;
}) => (
  <View style={styles.errorContainer}>
    <View style={styles.errorHeader}>
      <Ionicons name="warning-outline" size={48} color="#FF9500" />
      <Text style={styles.errorTitle}>Erreur d'initialisation</Text>
    </View>
    
    <Text style={styles.errorMessage}>{error}</Text>
    
    <View style={styles.errorAdviceBox}>
      <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
      <Text style={styles.errorAdvice}>
        L'application peut fonctionner avec des limitations. Certaines fonctionnalités peuvent ne pas être disponibles.
      </Text>
    </View>

    {isRetrying ? (
      <View style={styles.retryContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.retryText}>Nouvelle tentative...</Text>
      </View>
    ) : (
      <View style={styles.errorButtons}>
        <TouchableOpacity 
          style={[styles.errorButton, styles.retryButton]} 
          onPress={onRetry}
        >
          <Ionicons name="refresh" size={20} color="#FFF" />
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.errorButton, styles.continueButton]} 
          onPress={onContinue}
        >
          <Ionicons name="play" size={20} color="#FFF" />
          <Text style={styles.continueButtonText}>Continuer</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);

// Navigation principale avec thème
const AppNavigation = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <SafeAreaView>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#1c1c1e' : '#ffffff'}
        translucent={false}
      />
      <NavigationContainer>
        <ModernDrawerNavigator />
      </NavigationContainer>
    </SafeAreaView>
  );
};

// Application principale avec tous les providers
const AppWithProviders = () => {
  const { 
    isAppReady,
    initializationError, 
    isRetrying,
    retryInitialization,
    continueDespiteError,
  } = useAppInitialization();

  // Écran de chargement initial
  if (!isAppReady && !initializationError) {
    return (
      <SafeAreaProvider>
        <InitialLoader 
          message="Initialisation de l'application..."
          subMessage="Chargement des polices..."
        />
      </SafeAreaProvider>
    );
  }

  // Écran d'erreur d'initialisation
  if (initializationError && !isAppReady) {
    return (
      <SafeAreaProvider>
        <InitializationErrorScreen
          error={initializationError}
          onRetry={retryInitialization}
          onContinue={continueDespiteError}
          isRetrying={isRetrying}
        />
      </SafeAreaProvider>
    );
  }

  // APPLICATION PRINCIPALE AVEC CURRENCYPROVIDER
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <CurrencyProvider>
          <DatabaseProvider>
            <DatabaseLoader>
              <AppNavigation />
            </DatabaseLoader>
          </DatabaseProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default AppWithProviders;

// Styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  iconTest: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 16,
  },
  testIcon: {
    marginHorizontal: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  errorHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    width: '100%',
  },
  errorAdviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  errorAdvice: {
    fontSize: 14,
    color: '#1976D2',
    textAlign: 'left',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  retryContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  retryText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
  },
  errorButtons: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    maxWidth: 280,
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  retryButton: {
    backgroundColor: '#007AFF',
  },
  continueButton: {
    backgroundColor: '#34C759',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});