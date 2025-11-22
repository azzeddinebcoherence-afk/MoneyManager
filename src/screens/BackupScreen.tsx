// src/screens/BackupScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from '../components/SafeAreaView';
import { useDesignSystem } from '../context/ThemeContext';
import { useBackup } from '../hooks/useBackup';
import { useExport } from '../hooks/useExport';

const AUTO_BACKUP_KEY = '@auto_backup_enabled';
const LAST_BACKUP_KEY = '@last_backup_date';

export const BackupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useDesignSystem();
  const { createBackup, isLoading: backupLoading } = useBackup();
  const { exportFullBackup, exportTransactions, isExporting, exportProgress } = useExport();
  
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Charger les paramètres au montage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [autoBackup, lastBackup] = await Promise.all([
        AsyncStorage.getItem(AUTO_BACKUP_KEY),
        AsyncStorage.getItem(LAST_BACKUP_KEY)
      ]);
      
      setAutoBackupEnabled(autoBackup === 'true');
      setLastBackupDate(lastBackup);
    } catch (error) {
      console.error('❌ Erreur chargement paramètres:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleToggleAutoBackup = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(AUTO_BACKUP_KEY, value.toString());
      setAutoBackupEnabled(value);
      
      if (value) {
        Alert.alert(
          'Sauvegarde automatique activée',
          'Vos données seront sauvegardées automatiquement chaque jour.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier les paramètres');
    }
  };

  const handleCreateBackup = async () => {
    try {
      Alert.alert(
        'Créer une sauvegarde',
        'Voulez-vous créer une sauvegarde complète de vos données ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Créer',
            onPress: async () => {
              try {
                const result = await createBackup();
                
                if (result.success) {
                  const now = new Date().toISOString();
                  await AsyncStorage.setItem(LAST_BACKUP_KEY, now);
                  setLastBackupDate(now);
                  
                  Alert.alert(
                    'Sauvegarde créée',
                    'La sauvegarde a été créée avec succès.',
                    [{ text: 'OK' }]
                  );
                }
              } catch (error) {
                Alert.alert(
                  'Erreur',
                  error instanceof Error ? error.message : 'Impossible de créer la sauvegarde'
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Erreur création backup:', error);
    }
  };

  const handleExportJSON = async () => {
    try {
      Alert.alert(
        'Export JSON',
        'Exporter toutes les données au format JSON ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Exporter',
            onPress: async () => {
              try {
                const result = await exportFullBackup('json');
                
                if (result.success && result.filePath) {
                  const canShare = await Sharing.isAvailableAsync();
                  if (canShare) {
                    await Sharing.shareAsync(result.filePath, {
                      mimeType: 'application/json',
                      dialogTitle: 'Exporter les données'
                    });
                  }
                  
                  Alert.alert(
                    'Export réussi',
                    `${result.recordsCount || 0} enregistrements exportés`,
                    [{ text: 'OK' }]
                  );
                }
              } catch (error) {
                Alert.alert(
                  'Erreur',
                  error instanceof Error ? error.message : 'Impossible d\'exporter les données'
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Erreur export JSON:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      Alert.alert(
        'Export CSV',
        'Exporter les transactions au format CSV ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Exporter',
            onPress: async () => {
              try {
                const result = await exportTransactions(undefined, undefined, 'csv');
                
                if (result.success && result.filePath) {
                  const canShare = await Sharing.isAvailableAsync();
                  if (canShare) {
                    await Sharing.shareAsync(result.filePath, {
                      mimeType: 'text/csv',
                      dialogTitle: 'Exporter les transactions'
                    });
                  }
                  
                  Alert.alert(
                    'Export réussi',
                    `${result.recordsCount || 0} transactions exportées`,
                    [{ text: 'OK' }]
                  );
                }
              } catch (error) {
                Alert.alert(
                  'Erreur',
                  error instanceof Error ? error.message : 'Impossible d\'exporter les transactions'
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Erreur export CSV:', error);
    }
  };

  const handleImportData = async () => {
    try {
      Alert.alert(
        'Importer des données',
        'Cette fonctionnalité remplacera vos données actuelles. Créez une sauvegarde avant de continuer.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Continuer',
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await DocumentPicker.getDocumentAsync({
                  type: ['application/json', 'text/csv'],
                  copyToCacheDirectory: true
                });

                if (result.canceled) return;

                Alert.alert(
                  'Fonctionnalité à venir',
                  'L\'import de données sera disponible dans une prochaine version.',
                  [{ text: 'OK' }]
                );
              } catch (error) {
                Alert.alert(
                  'Erreur',
                  error instanceof Error ? error.message : 'Impossible d\'importer les données'
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Erreur import:', error);
    }
  };

  const formatDate = (isoDate: string | null) => {
    if (!isoDate) return 'Jamais';
    
    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoadingSettings) {
    return (
      <SafeAreaView>
        <View style={[styles.container, { backgroundColor: colors.background.primary }, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={[styles.loadingText, { color: colors.text.primary }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  }

  return (
    <SafeAreaView>
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background.card }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Sauvegarde & Export
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
              Protégez vos données financières
            </Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Sauvegarde automatique */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>
              SAUVEGARDE AUTOMATIQUE
            </Text>
            
            <View style={[styles.card, { backgroundColor: colors.background.secondary }]}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary[100] }]}>
                <Ionicons name="cloud-upload-outline" size={24} color={colors.primary[500]} />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
                  Sauvegarde auto
                </Text>
                <Text style={[styles.cardDescription, { color: colors.text.secondary }]}>
                  Sauvegarde quotidienne automatique
                </Text>
              </View>
              <Switch
                value={autoBackupEnabled}
                onValueChange={handleToggleAutoBackup}
                trackColor={{ false: colors.text.tertiary, true: colors.primary[500] }}
                thumbColor="#ffffff"
              />
            </View>

            {lastBackupDate && (
              <View style={[styles.infoCard, { backgroundColor: colors.primary[50] }]}>
                <Ionicons name="time-outline" size={16} color={colors.primary[500]} />
                <Text style={[styles.infoText, { color: colors.primary[700] }]}>
                  Dernière sauvegarde : {formatDate(lastBackupDate)}
                </Text>
              </View>
            )}
          </View>

          {/* Sauvegarde manuelle */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>
              SAUVEGARDE MANUELLE
            </Text>
            
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.background.secondary }]}
              onPress={handleCreateBackup}
              disabled={backupLoading}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="save-outline" size={24} color="#4CAF50" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: colors.text.primary }]}>
                  Créer une sauvegarde
                </Text>
                <Text style={[styles.actionDescription, { color: colors.text.secondary }]}>
                  Sauvegarde complète de toutes vos données
                </Text>
              </View>
              {backupLoading ? (
                <ActivityIndicator size="small" color={colors.primary[500]} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Export des données */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>
              EXPORT DES DONNÉES
            </Text>
            
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.background.secondary }]}
              onPress={handleExportJSON}
              disabled={isExporting}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="code-outline" size={24} color="#2196F3" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: colors.text.primary }]}>
                  Exporter en JSON
                </Text>
                <Text style={[styles.actionDescription, { color: colors.text.secondary }]}>
                  Format structuré pour réimport complet
                </Text>
              </View>
              {isExporting ? (
                <View style={styles.progressContainer}>
                  <ActivityIndicator size="small" color={colors.primary[500]} />
                  <Text style={[styles.progressText, { color: colors.text.secondary }]}>
                    {exportProgress}%
                  </Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.background.secondary }]}
              onPress={handleExportCSV}
              disabled={isExporting}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="document-text-outline" size={24} color="#FF9800" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: colors.text.primary }]}>
                  Exporter en CSV
                </Text>
                <Text style={[styles.actionDescription, { color: colors.text.secondary }]}>
                  Transactions pour Excel/Sheets
                </Text>
              </View>
              {isExporting ? (
                <View style={styles.progressContainer}>
                  <ActivityIndicator size="small" color={colors.primary[500]} />
                  <Text style={[styles.progressText, { color: colors.text.secondary }]}>
                    {exportProgress}%
                  </Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Import des données */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>
              IMPORT DE DONNÉES
            </Text>
            
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.background.secondary }]}
              onPress={handleImportData}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="cloud-download-outline" size={24} color="#FF9800" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: colors.text.primary }]}>
                  Restaurer une sauvegarde
                </Text>
                <Text style={[styles.actionDescription, { color: colors.text.secondary }]}>
                  Importer depuis JSON ou CSV
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
            </TouchableOpacity>

            <View style={[styles.warningCard, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="warning-outline" size={20} color="#F57C00" />
              <Text style={[styles.warningText, { color: '#E65100' }]}>
                L'import remplacera toutes vos données actuelles. Créez une sauvegarde avant de procéder.
              </Text>
            </View>
          </View>

          {/* Informations */}
          <View style={[styles.infoSection, { backgroundColor: colors.primary[50] }]}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary[500]} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.primary[700] }]}>
                Sécurité de vos données
              </Text>
              <Text style={[styles.infoDescription, { color: colors.primary[600] }]}>
                Les sauvegardes sont stockées localement sur votre appareil. Pensez à exporter régulièrement vos données vers un stockage externe.
              </Text>
            </View>
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 14,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    marginTop: 4,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  infoSection: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  spacer: {
    height: 40,
  },
});

export default BackupScreen;