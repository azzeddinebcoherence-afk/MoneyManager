// src/navigation/ModernDrawerNavigator.tsx
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import ModernDrawerContent from '../components/layout/ModernDrawerContent';
import { useTheme } from '../context/ThemeContext';
import { useIslamicCharges } from '../hooks/useIslamicCharges';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';

// Import des écrans
import AccountDetailScreen from '../screens/AccountDetailScreen';
import AccountsScreen from '../screens/AccountsScreen';
import AddAnnualChargeScreen from '../screens/AddAnnualChargeScreen';
import AddMultipleCategoriesScreen from '../screens/AddMultipleCategoriesScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import AlertsScreen from '../screens/AlertsScreen';
import AnalyticsDashboardScreen from '../screens/AnalyticsDashboardScreen';
import AnnualChargesScreen from '../screens/AnnualChargesScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import CategoryAnalysisScreen from '../screens/CategoryAnalysisScreen';
import CurrencySettingsScreen from '../screens/CurrencySettingsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EditAnnualChargeScreen from '../screens/EditAnnualChargeScreen';
import EditBudgetScreen from '../screens/EditBudgetScreen';
import EditTransactionScreen from '../screens/EditTransactionScreen';
import MonthDetailScreen from '../screens/MonthDetailScreen';
import MonthsOverviewScreen from '../screens/MonthsOverviewScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import TransferScreen from '../screens/TransferScreen';
import DebtStackNavigator from './DebtStackNavigator';
import SavingsStackNavigator from './SavingsStackNavigator';

// Types pour la navigation
type DrawerParamList = {
  // Navigation principale
  Dashboard: undefined;
  Accounts: undefined;
  Transactions: undefined;
  AddTransaction: undefined;
  EditTransaction: { transactionId: string };
  Transfer: undefined;
  Categories: undefined;
  Budgets: undefined;
  EditBudget: { budgetId: string };
  Alerts: undefined;
  Reports: undefined;
  AddMultipleCategories: undefined;
  
  // Analytics et Rapports
  Analytics: undefined;
  AnalyticsDashboard: undefined;
  CategoryAnalysis: undefined;
  
  // Gestion financière
  AnnualCharges: undefined;
  AddAnnualCharge: undefined;
  EditAnnualCharge: { chargeId: string };
  Debts: undefined;
  Savings: undefined;
  
  // ✅ SUPPRIMÉ : IslamicCharges n'est plus dans le menu
  
  // Paramètres
  Profile: undefined;
  Settings: undefined;
  CurrencySettings: undefined;
  
  // Autres
  AccountDetail: { accountId: string };
  
  // ✅ NOUVELLES ROUTES POUR LA PHASE 8
  MonthsOverview: undefined;
  MonthDetail: { year: number; month: number };
};

const Drawer = createDrawerNavigator<DrawerParamList>();
const Stack = createStackNavigator();

// Stack pour Tableau de Bord
const DashboardStack = () => (
  <Stack.Navigator 
    screenOptions={{ headerShown: false }}
    id="DashboardStack"
  >
    <Stack.Screen name="DashboardMain" component={DashboardScreen} />
    <Stack.Screen name="AccountDetail" component={AccountDetailScreen} />
    <Stack.Screen name="Transfer" component={TransferScreen} />
  </Stack.Navigator>
);

// Stack pour Transactions (UNIFIÉES)
const TransactionStack = () => (
  <Stack.Navigator 
    screenOptions={{ headerShown: false }}
    id="TransactionStack"
  >
    <Stack.Screen name="TransactionsList" component={TransactionsScreen} />
    <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
    <Stack.Screen name="EditTransaction" component={EditTransactionScreen} />
    <Stack.Screen name="AccountDetail" component={AccountDetailScreen} />
    <Stack.Screen name="Transfer" component={TransferScreen} />
    <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
  </Stack.Navigator>
);

// Stack pour Comptes
const AccountsStack = () => (
  <Stack.Navigator 
    screenOptions={{ headerShown: false }}
    id="AccountsStack"
  >
    <Stack.Screen name="AccountsList" component={AccountsScreen} />
    <Stack.Screen name="AccountDetail" component={AccountDetailScreen} />
    <Stack.Screen name="Transfer" component={TransferScreen} />
    <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
  </Stack.Navigator>
);

// Stack pour Budgets
const BudgetsStack = () => (
  <Stack.Navigator 
    screenOptions={{ headerShown: false }}
    id="BudgetsStack"
  >
    <Stack.Screen name="BudgetsList" component={BudgetsScreen} />
    <Stack.Screen name="EditBudget" component={EditBudgetScreen} />
  </Stack.Navigator>
);

// Stack pour Catégories
const CategoriesStack = () => (
  <Stack.Navigator 
    screenOptions={{ headerShown: false }}
    id="CategoriesStack"
  >
    <Stack.Screen name="CategoriesList" component={CategoriesScreen} />
  </Stack.Navigator>
);

// Stack pour Analytics
const AnalyticsStack = () => (
  <Stack.Navigator 
    screenOptions={{ headerShown: false }}
    id="AnalyticsStack"
  >
    <Stack.Screen name="AnalyticsDashboard" component={AnalyticsDashboardScreen} />
    <Stack.Screen name="ReportsList" component={ReportsScreen} />
    <Stack.Screen name="CategoryAnalysis" component={CategoryAnalysisScreen} />
  </Stack.Navigator>
);

// Stack pour Paramètres
const SettingsStack = () => (
  <Stack.Navigator 
    screenOptions={{ headerShown: false }}
    id="SettingsStack"
  >
    <Stack.Screen name="SettingsList" component={SettingsScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="CurrencySettings" component={CurrencySettingsScreen} />
  </Stack.Navigator>
);

// Stack pour Charges Annuelles
const AnnualChargesStack = () => (
  <Stack.Navigator 
    screenOptions={{ headerShown: false }}
    id="AnnualChargesStack"
  >
    <Stack.Screen name="AnnualChargesList" component={AnnualChargesScreen} />
    <Stack.Screen name="AddAnnualCharge" component={AddAnnualChargeScreen} />
    <Stack.Screen name="EditAnnualCharge" component={EditAnnualChargeScreen} />
  </Stack.Navigator>
);

// Stack pour Vue par Mois
const MonthsStack = () => (
  <Stack.Navigator 
    screenOptions={{ headerShown: false }}
    id="MonthsStack"
  >
    <Stack.Screen name="MonthsOverview" component={MonthsOverviewScreen} />
    <Stack.Screen name="MonthDetail" component={MonthDetailScreen} />
  </Stack.Navigator>
);

const ModernDrawerNavigator = () => {
  const { theme } = useTheme();
  const { settings } = useIslamicCharges();
  
  const [refreshKey, setRefreshKey] = useState(0);
  const isDark = theme === 'dark';

  // ✅ FORCER LE RE-RENDU QUAND LES SETTINGS CHANGENT
  useEffect(() => {
    console.log('🔄 Settings islamiques mis à jour:', settings.isEnabled);
    setRefreshKey(prev => prev + 1);
  }, [settings.isEnabled]);

  const drawerScreenOptions = {
    headerShown: false,
    drawerStyle: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      width: 320,
    },
    drawerActiveTintColor: isDark ? '#FFFFFF' : '#007AFF',
    drawerInactiveTintColor: isDark ? '#8E8E93' : '#8E8E93',
    drawerLabelStyle: {
      fontSize: 15,
      fontWeight: '500' as const,
      marginLeft: -16,
    },
    drawerItemStyle: {
      borderRadius: 12,
      marginHorizontal: 8,
      marginVertical: 2,
    },
    drawerActiveBackgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
  };

  return (
    <Drawer.Navigator
      key={refreshKey}
      drawerContent={(props) => <ModernDrawerContent {...props} />}
      screenOptions={drawerScreenOptions}
      initialRouteName="Dashboard"
      id="MainDrawer"
    >
      {/* SECTION PRINCIPALE */}
      <Drawer.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={[styles.iconContainer, { backgroundColor: '#007AFF' }]}>
              <Ionicons name="speedometer" size={size-2} color="#FFFFFF" />
            </View>
          ),
          drawerLabel: "Tableau de Bord",
        }}
      />

      {/* SECTION VUE PAR MOIS */}
      <Drawer.Screen
        name="MonthsOverview"
        component={MonthsStack}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' }]}>
              <Ionicons name="calendar" size={size-2} color="#FFFFFF" />
            </View>
          ),
          drawerLabel: "Vue par Mois",
        }}
      />

      {/* SECTION TRANSACTIONS (UNIFIÉES) */}
      <Drawer.Screen
        name="Transactions"
        component={TransactionStack}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={[styles.iconContainer, { backgroundColor: '#34C759' }]}>
              <Ionicons name="swap-horizontal" size={size-2} color="#FFFFFF" />
            </View>
          ),
          drawerLabel: "Transactions",
        }}
      />

      {/* SECTION COMPTES */}
      <Drawer.Screen
        name="Accounts"
        component={AccountsStack}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={[styles.iconContainer, { backgroundColor: '#5856D6' }]}>
              <Ionicons name="wallet" size={size-2} color="#FFFFFF" />
            </View>
          ),
          drawerLabel: "Comptes",
        }}
      />

      {/* SECTION BUDGETS ET PLANIFICATION */}
      <Drawer.Screen
        name="Budgets"
        component={BudgetsStack}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={[styles.iconContainer, { backgroundColor: '#FF9500' }]}>
              <Ionicons name="pie-chart" size={size-2} color="#FFFFFF" />
            </View>
          ),
          drawerLabel: "Budgets",
        }}
      />

      <Drawer.Screen
        name="Categories"
        component={CategoriesStack}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={[styles.iconContainer, { backgroundColor: '#FF6B35' }]}>
              <Ionicons name="pricetags" size={size-2} color="#FFFFFF" />
            </View>
          ),
          drawerLabel: "Catégories",
        }}
      />

      <Drawer.Screen
        name="AnnualCharges"
        component={AnnualChargesStack}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={[styles.iconContainer, { backgroundColor: '#FF3B30' }]}>
              <MaterialIcons name="event" size={size-2} color="#FFFFFF" />
            </View>
          ),
          drawerLabel: "Charges Annuelles",
        }}
      />

      {/* SECTION ÉPARGNE ET DETTES */}
      <Drawer.Screen
        name="Savings"
        component={SavingsStackNavigator}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={[styles.iconContainer, { backgroundColor: '#32D74B' }]}>
              <Ionicons name="trending-up" size={size-2} color="#FFFFFF" />
            </View>
          ),
          drawerLabel: "Épargne & Objectifs",
        }}
      />

      <Drawer.Screen
        name="Debts"
        component={DebtStackNavigator}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={[styles.iconContainer, { backgroundColor: '#FF453A' }]}>
              <Ionicons name="trending-down" size={size-2} color="#FFFFFF" />
            </View>
          ),
          drawerLabel: "Gestion des Dettes",
        }}
      />

      {/* SECTION ANALYTICS */}
      <Drawer.Screen
        name="Analytics"
        component={AnalyticsStack}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={[styles.iconContainer, { backgroundColor: '#AF52DE' }]}>
              <Ionicons name="bar-chart" size={size-2} color="#FFFFFF" />
            </View>
          ),
          drawerLabel: "Analytics & Rapports",
        }}
      />

      {/* SECTION ALERTES */}
      <Drawer.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={[styles.iconContainer, { backgroundColor: '#FFD60A' }]}>
              <Ionicons name="notifications" size={size-2} color="#000000" />
            </View>
          ),
          drawerLabel: "Alertes & Notifications",
        }}
      />

      {/* SECTION PARAMÈTRES */}
      <Drawer.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={[styles.iconContainer, { backgroundColor: '#8E8E93' }]}>
              <Ionicons name="settings" size={size-2} color="#FFFFFF" />
            </View>
          ),
          drawerLabel: "Paramètres",
        }}
      />

      {/* PROFIL */}
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={[styles.iconContainer, { backgroundColor: '#5AC8FA' }]}>
              <Ionicons name="person" size={size-2} color="#FFFFFF" />
            </View>
          ),
          drawerLabel: "Mon Profil",
        }}
      />

      {/* ÉCRANS CACHÉS DU DRAWER */}
      <Drawer.Screen 
        name="AddTransaction" 
        component={AddTransactionScreen} 
        options={{
          drawerLabel: "Nouvelle Transaction",
          drawerItemStyle: { display: 'none' }
        }}
      />

      <Drawer.Screen 
        name="AddMultipleCategories" 
        component={AddMultipleCategoriesScreen}
        options={{ 
          title: 'Ajout Multiple Catégories',
          drawerIcon: ({ color, size }) => (
            <View style={[styles.iconContainer, { backgroundColor: '#FF6B35' }]}>
              <Ionicons name="layers" size={size-2} color="#FFFFFF" />
            </View>
          ),
          drawerLabel: "Ajout Multiple",
        }}
      />

      <Drawer.Screen 
        name="Transfer" 
        component={TransferScreen} 
        options={{
          drawerLabel: "Transfert",
          drawerItemStyle: { display: 'none' }
        }}
      />

      <Drawer.Screen 
        name="EditTransaction" 
        component={EditTransactionScreen} 
        options={{
          drawerLabel: "Modifier Transaction",
          drawerItemStyle: { display: 'none' }
        }}
      />
      
      <Drawer.Screen 
        name="EditBudget" 
        component={EditBudgetScreen} 
        options={{
          drawerLabel: "Modifier Budget",
          drawerItemStyle: { display: 'none' }
        }}
      />
      
      <Drawer.Screen 
        name="EditAnnualCharge" 
        component={EditAnnualChargeScreen} 
        options={{
          drawerLabel: "Modifier Charge",
          drawerItemStyle: { display: 'none' }
        }}
      />
      
      <Drawer.Screen 
        name="AccountDetail" 
        component={AccountDetailScreen} 
        options={{
          drawerLabel: "Détails Compte",
          drawerItemStyle: { display: 'none' }
        }}
      />

      {/* Écran de détail mois (caché) */}
      <Drawer.Screen 
        name="MonthDetail" 
        component={MonthDetailScreen} 
        options={{
          drawerLabel: "Détail du Mois",
          drawerItemStyle: { display: 'none' }
        }}
      />

      {/* AnalyticsDashboard COMME ROUTE DIRECTE */}
      <Drawer.Screen 
        name="AnalyticsDashboard" 
        component={AnalyticsDashboardScreen} 
        options={{
          drawerLabel: "Dashboard Analytics",
          drawerItemStyle: { display: 'none' }
        }}
      />

      <Drawer.Screen 
        name="CategoryAnalysis" 
        component={CategoryAnalysisScreen} 
        options={{
          drawerLabel: "Analyse Catégorie",
          drawerItemStyle: { display: 'none' }
        }}
      />

    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
});

export default ModernDrawerNavigator;