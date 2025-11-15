// src/components/layout/ModernDrawerContent.tsx - VERSION COMPLÈTEMENT UNIFIÉE
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useIslamicCharges } from '../../hooks/useIslamicCharges';

const ModernDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { theme, toggleTheme } = useTheme();
  const { settings: islamicSettings } = useIslamicCharges();
  const isDark = theme === 'dark';

  // ✅ STRUCTURE UNIFIÉE - Fusion transactions normales/récurrentes
  const menuSections = [
    {
      title: 'TABLEAU DE BORD',
      items: [
        {
          label: 'Tableau de Bord',
          icon: 'speedometer' as const,
          screen: 'Dashboard',
        },
        {
          label: 'Vue par Mois',
          icon: 'calendar' as const,
          screen: 'MonthsOverview',
        },
      ],
    },
    {
      title: 'GESTION DES TRANSACTIONS',
      items: [
        {
          label: 'Toutes les Transactions',
          icon: 'list' as const,
          screen: 'Transactions',
        },
        {
          label: 'Nouvelle Transaction',
          icon: 'add-circle' as const,
          screen: 'AddTransaction',
        },
      ],
    },
    {
      title: 'COMPTES ET BUDGETS',
      items: [
        {
          label: 'Comptes',
          icon: 'wallet' as const,
          screen: 'Accounts',
        },
        {
          label: 'Budgets',
          icon: 'pie-chart' as const,
          screen: 'Budgets',
        },
        {
          label: 'Catégories',
          icon: 'pricetags' as const,
          screen: 'Categories',
        },
        {
          label: 'Charges Annuelles',
          icon: 'calendar' as const,
          screen: 'AnnualCharges',
        },
      ],
    },
    {
      title: 'ÉPARGNE ET DETTES',
      items: [
        {
          label: 'Épargne & Objectifs',
          icon: 'trending-up' as const,
          screen: 'Savings',
        },
        {
          label: 'Gestion des Dettes',
          icon: 'trending-down' as const,
          screen: 'Debts',
        },
      ],
    },
    // ✅ SECTION CHARGES ISLAMIQUES (conditionnelle)
    ...(islamicSettings.isEnabled ? [{
      title: 'CHARGES ISLAMIQUES',
      items: [
        {
          label: '⭐ Charges Islamiques',
          icon: 'star' as const,
          screen: 'IslamicCharges',
        },
      ],
    }] : []),
    {
      title: 'ANALYTICS ET RAPPORTS',
      items: [
        {
          label: 'Analytics & Rapports',
          icon: 'bar-chart' as const,
          screen: 'AnalyticsDashboard',
        },
        {
          label: 'Analyse par Catégorie',
          icon: 'pricetags' as const,
          screen: 'CategoryAnalysis',
        },
      ],
    },
    {
      title: 'ALERTES ET NOTIFICATIONS',
      items: [
        {
          label: 'Alertes & Notifications',
          icon: 'notifications' as const,
          screen: 'Alerts',
        },
      ],
    },
    {
      title: 'PARAMÈTRES',
      items: [
        {
          label: 'Paramètres',
          icon: 'settings' as const,
          screen: 'Settings',
        },
        {
          label: 'Devises',
          icon: 'cash' as const,
          screen: 'CurrencySettings',
        },
        {
          label: 'Mon Profil',
          icon: 'person' as const,
          screen: 'Profile',
        },
      ],
    },
  ];

  // ✅ NAVIGATION UNIFIÉE avec gestion des écrans obsolètes
  const handleNavigation = (screen: string) => {
    console.log(`🎯 Navigation vers: ${screen}`);
    
    try {
      // ✅ GESTION DES ÉCRANS OBSOLÈTES APRÈS UNIFICATION
      const screenMapping: { [key: string]: string } = {
        'AddRecurringTransaction': 'AddTransaction', // Rediriger vers formulaire unifié
        'EditRecurringTransaction': 'EditTransaction', // Rediriger vers édition unifiée
      };

      const targetScreen = screenMapping[screen] || screen;
      
      // Vérifier si l'écran existe
      const routeExists = props.navigation.getState().routeNames.includes(targetScreen);
      
      if (routeExists) {
        // ✅ PARAMÈTRES SPÉCIAUX POUR LE FORMULAIRE UNIFIÉ
        const params = screen === 'AddRecurringTransaction' ? { isRecurring: true } : undefined;
        
        props.navigation.navigate(targetScreen as any, params);
        console.log(`✅ Navigation réussie vers: ${targetScreen}`, params);
      } else {
        console.warn(`⚠️ L'écran ${targetScreen} n'existe pas dans la navigation`);
        // Navigation de secours vers Dashboard
        props.navigation.navigate('Dashboard' as any);
      }
    } catch (error) {
      console.error('❌ Erreur de navigation:', error);
      // Fallback garanti
      props.navigation.navigate('Dashboard' as any);
    }
  };

  // ✅ DÉTECTION ÉCRAN ACTIF AMÉLIORÉE POUR SYSTÈME UNIFIÉ
  const isScreenActive = (screenName: string) => {
    try {
      const currentRoute = props.state.routes[props.state.index];
      
      // ✅ GESTION DES ALIAS POUR L'UNIFICATION
      const screenAliases: { [key: string]: string[] } = {
        'Transactions': ['Transactions', 'RecurringTransactions'], // Les deux écrans sont liés
        'AddTransaction': ['AddTransaction', 'AddRecurringTransaction'], // Formulaire unifié
      };

      // Vérifier les routes imbriquées dans les stacks
      let actualScreenName = currentRoute.name;
      if (currentRoute.state) {
        const nestedRoutes = currentRoute.state.routes;
        const currentNestedRoute = nestedRoutes[nestedRoutes.length - 1];
        actualScreenName = currentNestedRoute.name;
      }

      // Vérifier si l'écran actuel correspond ou est un alias
      if (actualScreenName === screenName) return true;
      
      // Vérifier les alias pour l'unification
      if (screenAliases[screenName]?.includes(actualScreenName)) return true;

      return false;
    } catch (error) {
      return false;
    }
  };

  // ✅ FONCTION POUR OBTENIR LE LABEL AVEC BADGES
  const getMenuItemLabel = (item: { label: string; screen: string }) => {
    const isRecurringScreen = item.screen === 'RecurringTransactions';
    const isIslamic = item.label.includes('⭐');
    
    return (
      <View style={styles.labelContainer}>
        <Text style={[
          styles.menuItemText,
          isDark && styles.darkMenuItemText,
          isIslamic && styles.islamicMenuText
        ]}>
          {item.label}
        </Text>
        
        {/* ✅ BADGE POUR TRANSACTIONS RÉCURRENTES */}
        {isRecurringScreen && (
          <View style={styles.recurringBadge}>
            <Ionicons name="repeat" size={10} color="#007AFF" />
            <Text style={styles.recurringBadgeText}>Automatique</Text>
          </View>
        )}

        {/* ✅ BADGE "NOUVEAU" POUR FONCTIONNALITÉS ISLAMIQUES */}
        {isIslamic && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>Nouveau</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[
      styles.container, 
      isDark && styles.darkContainer
    ]}>
      
      {/* ✅ HEADER AVEC STATUT UNIFIÉ */}
      <View style={[
        styles.header, 
        isDark && styles.darkHeader
      ]}>
        <View style={styles.avatar}>
          <Ionicons name="cash" size={36} color="#FFFFFF" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>MoneyManager</Text>
          <Text style={styles.userEmail}>Maîtrise ton budget, maîtrise ta vie</Text>
          
          {/* ✅ INDICATEURS DE STATUT */}
          <View style={styles.statusIndicators}>
            {islamicSettings.isEnabled && (
              <View style={styles.statusItem}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.statusText}>Mode Islamique</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ✅ MENU PRINCIPAL UNIFIÉ */}
      <ScrollView 
        style={styles.menuContainer}
        showsVerticalScrollIndicator={false}
      >
        {menuSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            {/* ✅ TITRE DE SECTION AVEC STYLES SPÉCIAUX */}
            <Text style={[
              styles.sectionTitle,
              isDark && styles.darkSectionTitle,
              section.title.includes('ISLAMIQUES') && styles.islamicSectionTitle,
              section.title.includes('TRANSACTIONS') && styles.transactionsSectionTitle
            ]}>
              {section.title}
            </Text>
            
            <View style={styles.sectionItems}>
              {section.items.map((item) => {
                const isActive = isScreenActive(item.screen);
                const isIslamic = item.label.includes('⭐');
                const isRecurring = item.screen === 'RecurringTransactions';
                
                return (
                  <TouchableOpacity
                    key={item.screen}
                    style={[
                      styles.menuItem,
                      isActive && styles.activeMenuItem,
                      isDark && styles.darkMenuItem,
                      isIslamic && styles.islamicMenuItem,
                      isRecurring && styles.recurringMenuItem
                    ]}
                    onPress={() => handleNavigation(item.screen)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuItemLeft}>
                      {/* ✅ ICÔNE AVEC STYLES CONTEXTUELS */}
                      <View style={[
                        styles.iconWrapper,
                        isActive && styles.activeIconWrapper,
                        isDark && styles.darkIconWrapper,
                        isIslamic && styles.islamicIconWrapper,
                        isRecurring && styles.recurringIconWrapper
                      ]}>
                        <Ionicons 
                          name={item.icon} 
                          size={20} 
                          color={
                            isActive ? '#007AFF' : 
                            isIslamic ? '#FFD700' :
                            isRecurring ? '#007AFF' :
                            (isDark ? '#FFFFFF' : '#000000')
                          } 
                        />
                      </View>
                      
                      {/* ✅ LABEL AVEC BADGES */}
                      {getMenuItemLabel(item)}
                    </View>
                    
                    {/* ✅ INDICATEUR VISUEL */}
                    {isActive && (
                      <View style={styles.activeIndicator}>
                        <Ionicons name="chevron-forward" size={16} color="#007AFF" />
                      </View>
                    )}

                    {/* ✅ INDICATEUR DE STATUT POUR RÉCURRENTES */}
                    {isRecurring && !isActive && (
                      <View style={styles.recurringIndicator}>
                        <Ionicons name="flash" size={12} color="#007AFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ✅ SÉPARATEUR DE SECTION */}
            {sectionIndex < menuSections.length - 1 && (
              <View style={[
                styles.sectionSeparator,
                isDark && styles.darkSectionSeparator
              ]} />
            )}
          </View>
        ))}
      </ScrollView>

      {/* ✅ FOOTER AVEC INFORMATIONS SYSTÈME */}
      <View style={[
        styles.footer,
        isDark && styles.darkFooter
      ]}>
        {/* BOUTON CHANGEMENT DE THÈME */}
        <TouchableOpacity 
          style={[
            styles.footerButton,
            isDark && styles.darkFooterButton
          ]}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <View style={[
            styles.themeIcon,
            isDark && styles.darkThemeIcon
          ]}>
            <Ionicons 
              name={isDark ? 'sunny' : 'moon'} 
              size={20} 
              color={isDark ? '#FFD60A' : '#007AFF'} 
            />
          </View>
          <Text style={[
            styles.footerButtonText,
            isDark && styles.darkFooterButtonText,
          ]}>
            {isDark ? 'Mode Clair' : 'Mode Sombre'}
          </Text>
        </TouchableOpacity>

        {/* ✅ STATISTIQUES SYSTÈME */}
        <View style={[
          styles.statsContainer,
          isDark && styles.darkStatsContainer
        ]}>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-done" size={14} color="#34C759" />
            <Text style={[
              styles.statText,
              isDark && styles.darkStatText
            ]}>Système Unifié</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="repeat" size={14} color="#007AFF" />
            <Text style={[
              styles.statText,
              isDark && styles.darkStatText
            ]}>Transactions</Text>
          </View>
          
          {islamicSettings.isEnabled && (
            <View style={styles.statItem}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={[
                styles.statText,
                isDark && styles.darkStatText
              ]}>Islamique</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  darkContainer: {
    backgroundColor: '#1C1C1E',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  darkHeader: {
    backgroundColor: '#0A84FF',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  statusIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  section: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 16,
    marginBottom: 8,
    marginTop: 20,
  },
  darkSectionTitle: {
    color: '#8E8E93',
  },
  islamicSectionTitle: {
    color: '#B8860B',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  transactionsSectionTitle: {
    color: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  sectionItems: {
    paddingHorizontal: 8,
  },
  sectionSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
    marginVertical: 16,
  },
  darkSectionSeparator: {
    backgroundColor: '#38383A',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  darkMenuItem: {
    // Style spécifique sombre
  },
  islamicMenuItem: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  recurringMenuItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  activeMenuItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activeIconWrapper: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  darkIconWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  islamicIconWrapper: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  recurringIconWrapper: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
  },
  labelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginRight: 8,
  },
  darkMenuItemText: {
    color: '#FFFFFF',
  },
  islamicMenuText: {
    color: '#B8860B',
    fontWeight: '600',
  },
  activeIndicator: {
    padding: 4,
  },
  recurringIndicator: {
    padding: 4,
    opacity: 0.7,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  recurringBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 2,
  },
  newBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#F8F8F8',
  },
  darkFooter: {
    borderTopColor: '#38383A',
    backgroundColor: '#2C2C2E',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkFooterButton: {
    backgroundColor: '#3A3A3C',
  },
  themeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkThemeIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    color: '#000000',
  },
  darkFooterButtonText: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  darkStatsContainer: {
    backgroundColor: '#3A3A3C',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 6,
    fontWeight: '500',
  },
  darkStatText: {
    color: '#8E8E93',
  },
});

export default ModernDrawerContent;