// src/screens/TransactionDetailScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../hooks/useTransactions';

const TransactionDetailScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const { transactions } = useTransactions();
  const { transactionId } = route.params; 
  const isDark = theme === 'dark';

  const transaction = transactions.find(t => t.id === transactionId);

  if (!transaction) {
    return (
      <View style={[styles.container, isDark && styles.darkContainer, styles.center]}>
        <Ionicons name="alert-circle" size={64} color="#FF3B30" />
        <Text style={[styles.errorText, isDark && styles.darkText]}>
          Transaction non trouvée
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={[styles.header, isDark && styles.darkHeader]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.darkText]}>
          Détails de la transaction
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.mainCard, isDark && styles.darkCard]}>
          <Text style={[styles.amount, isDark && styles.darkText]}>
            {transaction.amount.toFixed(2)} €
          </Text>
          <Text style={[styles.description, isDark && styles.darkText]}>
            {transaction.description || 'Sans description'}
          </Text>
          <Text style={[styles.date, isDark && styles.darkSubtext]}>
            {new Date(transaction.date).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  darkContainer: { backgroundColor: '#1c1c1e' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  darkHeader: {
    backgroundColor: '#2c2c2e',
    borderBottomColor: '#38383a',
  },
  backButton: { padding: 4 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: { width: 32 },
  content: { flex: 1, padding: 16 },
  mainCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  darkCard: { backgroundColor: '#2c2c2e' },
  amount: { fontSize: 32, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  description: { fontSize: 18, color: '#000', marginBottom: 8 },
  date: { fontSize: 14, color: '#666' },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  darkText: { color: '#fff' },
  darkSubtext: { color: '#888' },
});

export default TransactionDetailScreen;