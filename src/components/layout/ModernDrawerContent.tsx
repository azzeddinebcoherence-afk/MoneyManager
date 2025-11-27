// src/components/layout/ModernDrawerContent.tsx - VERSION CORRIGÉE
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const ModernDrawerContent = (props: any) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  // ✅ STRUCTURE UNIFIÉE AVEC CHARGES ISLAMIQUES CONDITIONNELLES
  const menuSections = [
    {
      title: t.dashboard.toUpperCase(),
      items: [
        {
          label: t.dashboard,
          icon: 'speedometer' as const,
          screen: 'Dashboard',
        },
        {
          label: 'Vue par Mois',
          icon: 'calendar' as const,
          screen: 'MonthsOverviewStack',
        },
        {
          label: t.calendarExpenses,
          icon: 'calendar-outline' as const,
          screen: 'CalendarStack',
        },
      ],
    },
    {
      title: t.transactions.toUpperCase(),
      items: [
        {
          label: t.transactions,
          icon: 'list' as const,
          screen: 'Transactions',
        },
        {
          label: t.search || 'Rechercher',
          icon: 'search' as const,
          screen: 'Search',
        },
        {
          label: t.newTransaction,
          icon: 'add-circle' as const,
          screen: 'AddTransaction',
        },
      ],
    },
    {
      title: t.accounts.toUpperCase() + ' & ' + t.budgets.toUpperCase(),
      items: [
        {
          label: t.accounts,
          icon: 'wallet' as const,
          screen: 'Accounts',
        },
        {
          label: t.budgets,
          icon: 'pie-chart' as const,
          screen: 'Budgets',
        },
        {
          label: t.categories,
          icon: 'pricetags' as const,
          screen: 'Categories',
        },
        {
          label: t.annualCharges,
          icon: 'calendar' as const,
          screen: 'AnnualCharges',
        },
      ],
    },
    {
      title: t.savings.toUpperCase() + ' & ' + t.debts.toUpperCase(),
      items: [
        {
          label: t.savings,
          icon: 'trending-up' as const,
          screen: 'Savings',
        },
        {
          label: t.debts,
          icon: 'trending-down' as const,
          screen: 'Debts',
        },
      ],
    },
    // ✅ SECTION CHARGES ISLAMIQUES (APPEARAÎT SEULEMENT SI ACTIVÉ)
    ...(false ? [{
      title: t.islamicCharges?.toUpperCase() || 'CHARGES ISLAMIQUES',
      items: [
        {
          label: '⭐ ' + (t.islamicCharges || 'Charges Islamiques'),
          icon: 'star' as const,
          screen: 'IslamicCharges',
        },
      ],
    }] : []),
    {
      title: t.reports.toUpperCase(),
      items: [
        {
          label: t.reports,
          icon: 'bar-chart' as const,
          screen: 'Analytics',
        },
        {
          label: t.categoryAnalysis,
          icon: 'pricetags' as const,
          screen: 'CategoryAnalysis',
        },
      ],
    },
    {
      title: t.alerts?.toUpperCase() || 'ALERTES',
      items: [
        {
          label: t.alerts || 'Alertes',
          icon: 'notifications' as const,
          screen: 'Alerts',
        },
      ],
    },
    {
      title: t.settings.toUpperCase(),
      items: [
        {
          label: t.settings,
          icon: 'settings' as const,
          screen: 'Settings',
        },
        {
          label: t.currencies,
          icon: 'cash' as const,
          screen: 'CurrencySettings',
        },
        {
          label: t.profile,
          icon: 'person' as const,
          screen: 'Profile',
        },
      ],
    },
  ];

  // ✅ NAVIGATION CORRIGÉE
  const handleNavigation = (screen: string) => {
    console.log(`🎯 Navigation vers: ${screen}`);
    
    try {
      // Gestion des écrans imbriqués (ouvrir le stack parent puis la route interne)
      const nestedMap: Record<string, { parent: string; screen: string } | undefined> = {
        'Analytics': { parent: 'Analytics', screen: 'AnalyticsDashboard' },
        'CategoryAnalysis': { parent: 'Analytics', screen: 'CategoryAnalysis' },
        'CurrencySettings': { parent: 'Settings', screen: 'CurrencySettings' },
        'Profile': { parent: 'Settings', screen: 'Profile' },
      };

      const nested = nestedMap[screen];
      if (nested) {
        // Naviguer vers le stack parent et demander l'écran imbriqué
        (props.navigation as any).navigate(nested.parent, { screen: nested.screen });
        console.log(`✅ Navigation imbriquée vers: ${nested.parent} -> ${nested.screen}`);
        return;
      }

      // Vérifier si l'écran existe au niveau root
      const state = props.navigation.getState();
      const routeExists = Array.isArray(state.routeNames) && state.routeNames.includes(screen);

      if (routeExists) {
        props.navigation.navigate(screen as any);
        console.log(`✅ Navigation réussie vers: ${screen}`);
      } else {
        console.warn(`⚠️ L'écran ${screen} n'existe pas dans la navigation, fallback vers Dashboard`);
        props.navigation.navigate('Dashboard' as any);
      }
    } catch (error) {
      console.error('❌ Erreur de navigation:', error);
      // Fallback garanti
      props.navigation.navigate('Dashboard' as any);
    }
  };

  // ✅ DÉTECTION ÉCRAN ACTIF CORRIGÉE
  const isScreenActive = (screenName: string) => {
    try {
      const currentRoute = props.state.routes[props.state.index];
      
      // Vérifier les routes imbriquées dans les stacks
      let actualScreenName = currentRoute.name;
      
      // ✅ CORRECTION : Gestion récursive des routes imbriquées
      const getDeepRouteName = (route: any): string => {
        if (route.state && route.state.routes) {
          const nestedRoutes = route.state.routes;
          const currentNestedRoute = nestedRoutes[nestedRoutes.length - 1];
          return getDeepRouteName(currentNestedRoute);
        }
        return route.name;
      };
      
      actualScreenName = getDeepRouteName(currentRoute);
      
      // ✅ CORRECTION : Mapping des noms de stack vers les noms d'écran principaux
      const stackToScreenMap: Record<string, string> = {
        'MonthsOverviewMain': 'MonthsOverviewStack',
        'IslamicChargesMain': 'IslamicCharges',
        'DashboardMain': 'Dashboard',
        'TransactionsList': 'Transactions',
        'AccountsList': 'Accounts',
        'BudgetsList': 'Budgets',
        'CategoriesList': 'Categories',
        'AnnualChargesList': 'AnnualCharges',
        'SettingsList': 'Settings',
        'AnalyticsDashboard': 'Analytics',
        'ReportsList': 'Analytics',
      };
      
      const mappedScreenName = stackToScreenMap[actualScreenName] || actualScreenName;
      
      return mappedScreenName === screenName;
    } catch (error) {
      console.error('❌ Erreur détection écran actif:', error);
      return false;
    }
  };

  return (
    <View style={[
      styles.container, 
      isDark && styles.darkContainer
    ]}>
      
      {/* ✅ HEADER */}
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
            {false && (
              <View style={styles.statusItem}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.statusText}>Mode Islamique</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ✅ MENU PRINCIPAL */}
      <ScrollView 
        style={styles.menuContainer}
        showsVerticalScrollIndicator={false}
      >
        {menuSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              isDark && styles.darkSectionTitle,
              section.title.includes('ISLAMIQUES') && styles.islamicSectionTitle
            ]}>
              {section.title}
            </Text>
            
            <View style={styles.sectionItems}>
              {section.items.map((item) => {
                const isActive = isScreenActive(item.screen);
                const isIslamic = item.label.includes('⭐');
                
                return (
                  <TouchableOpacity
                    key={item.screen}
                    style={[
                      styles.menuItem,
                      isActive && styles.activeMenuItem,
                      isDark && styles.darkMenuItem,
                      isIslamic && styles.islamicMenuItem
                    ]}
                    onPress={() => handleNavigation(item.screen)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuItemLeft}>
                      {/* ✅ ICÔNE */}
                      <View style={[
                        styles.iconWrapper,
                        isActive && styles.activeIconWrapper,
                        isDark && styles.darkIconWrapper,
                        isIslamic && styles.islamicIconWrapper
                      ]}>
                        <Ionicons 
                          name={item.icon} 
                          size={20} 
                          color={
                            isActive ? '#007AFF' : 
                            isIslamic ? '#FFD700' :
                            (isDark ? '#FFFFFF' : '#000000')
                          } 
                        />
                      </View>
                      
                      {/* ✅ LABEL */}
                      <View style={styles.labelContainer}>
                        <Text style={[
                          styles.menuItemText,
                          isDark && styles.darkMenuItemText,
                          isIslamic && styles.islamicMenuText
                        ]}>
                          {item.label}
                        </Text>
                        
                        {/* ✅ BADGE "NOUVEAU" POUR FONCTIONNALITÉS ISLAMIQUES */}
                        {isIslamic && (
                          <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>Nouveau</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    {/* ✅ INDICATEUR VISUEL */}
                    {isActive && (
                      <View style={styles.activeIndicator}>
                        <Ionicons name="chevron-forward" size={16} color="#007AFF" />
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

      {/* ✅ FOOTER */}
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
      </View>
    </View>
  );
};

// Les styles restent identiques...
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
  newBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
});

export default ModernDrawerContent;