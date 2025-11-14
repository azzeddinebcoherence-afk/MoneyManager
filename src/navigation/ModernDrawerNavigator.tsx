// src/navigation/ModernDrawerNavigator.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import ModernDrawerContent from '../components/layout/ModernDrawerContent';
import { useTheme } from '../context/ThemeContext';

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
import IslamicChargesScreen from '../screens/islamic/IslamicChargesScreen';
import MonthDetailScreen from '../screens/MonthDetailScreen';
import MonthsOverviewScreen from '../screens/MonthsOverviewScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import TransferScreen from '../screens/TransferScreen';
import DebtStackNavigator from './DebtStackNavigator';
import SavingsStackNavigator from './SavingsStackNavigator';

// ✅ CORRECTION : Types étendus pour inclure les paramètres unifiés
type DrawerParamList = {
  // Navigation principale
  Dashboard: undefined;
  Accounts: undefined;
  Transactions: undefined;
  AddTransaction: { isRecurring?: boolean };
  EditTransaction: { transactionId: string; isRecurring?: boolean };
  RecurringTransactions: undefined;
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
  AddDebt: undefined;
  EditDebt: { debtId: string };
  DebtDetail: { debtId: string };
  Savings: undefined;
  AddSavingsGoal: undefined;
  EditSavingsGoal: { goalId: string };
  SavingsDetail: { goalId: string };
  
  // ✅ CORRECTION : Ajout de IslamicCharges
  IslamicCharges: undefined;
  IslamicSettings: undefined;
  
  // Paramètres
  Profile: undefined;
  Settings: undefined;
  CurrencySettings: undefined;
  
  // Autres
  AccountDetail: { accountId: string };
  
  // Vue par Mois
  MonthsOverview: undefined;
  MonthDetail: { year: number; month: number };
};

const Drawer = createDrawerNavigator<DrawerParamList>();
const Stack = createStackNavigator();

// ✅ CORRECTION : Options de navigation corrigées
const stackScreenOptions: StackNavigationOptions = {
  headerShown: false
};

// ✅ CORRECTION : Stack pour Tableau de Bord avec ID
const DashboardStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="DashboardMain" component={DashboardScreen} />
    <Stack.Screen name="AccountDetail" component={AccountDetailScreen} />
    <Stack.Screen name="Transfer" component={TransferScreen} />
  </Stack.Navigator>
);

// ✅ CORRECTION : Stack pour Transactions avec ID
const TransactionStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="TransactionsList" component={TransactionsScreen} />
    <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
    <Stack.Screen name="EditTransaction" component={EditTransactionScreen} />
    <Stack.Screen name="AccountDetail" component={AccountDetailScreen} />
    <Stack.Screen name="Transfer" component={TransferScreen} />
  </Stack.Navigator>
);

// ✅ CORRECTION : Stack pour Comptes avec ID
const AccountsStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="AccountsList" component={AccountsScreen} />
    <Stack.Screen name="AccountDetail" component={AccountDetailScreen} />
    <Stack.Screen name="Transfer" component={TransferScreen} />
    <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
  </Stack.Navigator>
);

// ✅ CORRECTION : Stack pour Budgets avec ID
const BudgetsStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="BudgetsList" component={BudgetsScreen} />
    <Stack.Screen name="EditBudget" component={EditBudgetScreen} />
  </Stack.Navigator>
);

// ✅ CORRECTION : Stack pour Catégories avec ID
const CategoriesStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="CategoriesList" component={CategoriesScreen} />
  </Stack.Navigator>
);

// ✅ CORRECTION : Stack pour Analytics avec ID
const AnalyticsStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="AnalyticsDashboard" component={AnalyticsDashboardScreen} />
    <Stack.Screen name="ReportsList" component={ReportsScreen} />
    <Stack.Screen name="CategoryAnalysis" component={CategoryAnalysisScreen} />
  </Stack.Navigator>
);

// ✅ CORRECTION : Stack pour Paramètres avec ID
const SettingsStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="SettingsList" component={SettingsScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="CurrencySettings" component={CurrencySettingsScreen} />
  </Stack.Navigator>
);

// ✅ CORRECTION : Stack pour Charges Annuelles avec ID
const AnnualChargesStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="AnnualChargesList" component={AnnualChargesScreen} />
    <Stack.Screen name="AddAnnualCharge" component={AddAnnualChargeScreen} />
    <Stack.Screen name="EditAnnualCharge" component={EditAnnualChargeScreen} />
  </Stack.Navigator>
);

// ✅ CORRECTION : Stack pour Transactions Récurrentes UNIFIÉES
const RecurringTransactionsStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen 
      name="RecurringTransactionsList" 
      component={TransactionsScreen}
      initialParams={{ showRecurringOnly: true }}
    />
    <Stack.Screen 
      name="AddRecurringTransaction" 
      component={AddTransactionScreen}
      initialParams={{ isRecurring: true }}
    />
    <Stack.Screen 
      name="EditRecurringTransaction" 
      component={EditTransactionScreen}
      initialParams={{ isRecurring: true }}
    />
  </Stack.Navigator>
);

// ✅ CORRECTION : Stack pour Vue par Mois avec ID
const MonthsStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="MonthsOverview" component={MonthsOverviewScreen} />
    <Stack.Screen name="MonthDetail" component={MonthDetailScreen} />
  </Stack.Navigator>
);

// ✅ CORRECTION : Stack pour Charges Islamiques avec ID
const IslamicChargesStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="IslamicChargesList" component={IslamicChargesScreen} />
  </Stack.Navigator>
);

const ModernDrawerNavigator = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
      drawerContent={(props) => <ModernDrawerContent {...props} />}
      screenOptions={drawerScreenOptions}
      initialRouteName="Dashboard"
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

      {/* VUE PAR MOIS */}
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

      {/* SECTION TRANSACTIONS */}
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

      {/* ✅ NOUVEAU : SECTION CHARGES ISLAMIQUES */}
      <Drawer.Screen
        name="IslamicCharges"
        component={IslamicChargesStack}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={[styles.iconContainer, { backgroundColor: '#FFD700' }]}>
              <Ionicons name="star" size={size-2} color="#000000" />
            </View>
          ),
          drawerLabel: "⭐ Charges Islamiques",
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

      {/* AnalyticsDashboard comme route directe */}
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
          drawerIcon: ({ color, size }) => (
            <View style={[styles.iconContainer, { backgroundColor: '#BF5AF2' }]}>
              <Ionicons name="analytics" size={size-2} color="#FFFFFF" />
            </View>
          ),
          drawerLabel: "Analyse par Catégorie",
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

      <Drawer.Screen 
        name="CurrencySettings" 
        component={CurrencySettingsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <View style={[styles.iconContainer, { backgroundColor: '#FFD60A' }]}>
              <Ionicons name="cash" size={size-2} color="#000000" />
            </View>
          ),
          drawerLabel: "Paramètres Devises",
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

      {/* ✅ CORRECTION : Écrans obsolètes à supprimer */}
      {/* 
        LES ÉCRANS SUIVANTS SONT OBSOLÈTES AVEC L'UNIFICATION :
        - AddRecurringTransaction (remplacé par AddTransaction avec paramètre)
        - EditRecurringTransaction (remplacé par EditTransaction avec paramètre)
      */}

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