// src/screens/auth/WelcomeScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const WelcomeScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const markAsLaunched = async () => {
    try {
      await AsyncStorage.setItem('hasLaunched', 'true');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du lancement:', error);
    }
  };

  const goToLogin = async () => {
    await markAsLaunched();
    if (navigation) {
      navigation.navigate('Login');
    }
  };

  const goToRegister = async () => {
    await markAsLaunched();
    if (navigation) {
      navigation.navigate('Register');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="wallet" size={64} color="#6C63FF" />
            </View>
          </View>
          
          <Text style={styles.title}>Bienvenue sur{'\n'}Mon Budget</Text>
          <Text style={styles.subtitle}>
            Prenez le contrôle de vos finances personnelles
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem 
            icon="stats-chart"
            title="Suivi en temps réel"
            description="Visualisez vos dépenses et revenus instantanément"
          />
          <FeatureItem 
            icon="calendar"
            title="Charges annuelles"
            description="Gérez vos charges récurrentes et islamiques"
          />
          <FeatureItem 
            icon="shield-checkmark"
            title="Sécurisé"
            description="Vos données sont protégées et cryptées"
          />
        </View>

        {/* CTA Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={goToRegister}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Créer un compte</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={goToLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>J'ai déjà un compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Feature Item Component
const FeatureItem: React.FC<{ 
  icon: string; 
  title: string; 
  description: string;
}> = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon as any} size={28} color="#6C63FF" />
    </View>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  container: { 
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  // Hero Section
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#17233C',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },

  // Features
  features: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#17233C',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Actions
  actions: {
    marginTop: 'auto',
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#6C63FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#6C63FF',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default WelcomeScreen;
