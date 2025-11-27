// src/components/ui/Header.tsx - VERSION AVEC SYNCHRONISATION
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSync } from '../../hooks/useSync';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  showIslamicIcon?: boolean;
  showSyncButton?: boolean;
  rightComponent?: React.ReactNode;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  showIslamicIcon = true,
  showSyncButton = true,
  rightComponent,
  onBack,
}) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  // const { settings } = useIslamicCharges(); // Supprimé
  const { syncAllData, isSyncing } = useSync();
  
  const isDark = theme === 'dark';
  const isIslamicChargesEnabled = false; // Désactivé définitivement

  const handleIslamicPress = () => {
    navigation.navigate('IslamicCharges' as never);
  };

  const handleSyncPress = async () => {
    try {
      await syncAllData();
    } catch (error) {
      console.error('Erreur synchronisation:', error);
    }
  };

  const handleMenuPress = () => {
    (navigation as any).openDrawer();
  };

  return (
    <View style={[styles.header, isDark && styles.darkHeader]}>
      {/* Bouton retour */}
      <View style={styles.leftSection}>
        {showBackButton ? (
                <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => {
                          if (typeof onBack === 'function') {
                            onBack();
                          } else {
                            navigation.goBack();
                          }
                        }}
                      >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isDark ? "#fff" : "#000"} 
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Titre */}
      <View style={styles.centerSection}>
        <Text style={[styles.title, isDark && styles.darkTitle]}>
          {title}
        </Text>
      </View>

      {/* Section droite */}
      <View style={styles.rightSection}>
        {rightComponent || (
          <>
            {/* ✅ BOUTON SYNCHRONISATION */}
            {showSyncButton && (
              <TouchableOpacity 
                style={[styles.syncButton, isDark && styles.darkSyncButton]}
                onPress={handleSyncPress}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color={isDark ? "#007AFF" : "#007AFF"} />
                ) : (
                  <Ionicons 
                    name="sync" 
                    size={20} 
                    color={isDark ? "#007AFF" : "#007AFF"} 
                  />
                )}
              </TouchableOpacity>
            )}
            
            {/* ✅ ICÔNE CHARGES ISLAMIQUES - CONDITIONNELLE */}
            {showIslamicIcon && isIslamicChargesEnabled && (
              <TouchableOpacity 
                style={[styles.islamicButton, isDark && styles.darkIslamicButton]}
                onPress={handleIslamicPress}
              >
                <Ionicons 
                  name="star" 
                  size={20} 
                  color={isDark ? "#FFD700" : "#FF6B35"} 
                />
              </TouchableOpacity>
            )}
            
            {/* Bouton menu */}
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={handleMenuPress}
            >
              <Ionicons 
                name="menu" 
                size={24} 
                color={isDark ? "#fff" : "#000"} 
              />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  darkHeader: {
    backgroundColor: '#1C1C1E',
    borderBottomColor: '#2C2C2E',
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  darkTitle: {
    color: '#fff',
  },
  syncButton: {
    padding: 8,
    backgroundColor: 'transparent',
  },
  darkSyncButton: {
    backgroundColor: 'transparent',
  },
  islamicButton: {
    padding: 8,
    backgroundColor: 'transparent',
  },
  darkIslamicButton: {
    backgroundColor: 'transparent',
  },
  menuButton: {
    padding: 8,
  },
});

export default Header;