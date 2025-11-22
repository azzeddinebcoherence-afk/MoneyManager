# 📱 Système de Notifications et Alertes - Documentation

## 🎯 Vue d'ensemble

Le système de notifications et d'alertes de Mylife offre deux écrans distincts pour une gestion complète des informations importantes :

### 1. **NotificationsScreen** - Notifications générales
- 📬 Toutes les notifications de l'application
- 🔔 Groupées par date (Aujourd'hui, Hier, Cette semaine)
- ✅ Filtrage par statut (Toutes, Non lues, Alertes)
- 📱 Interface moderne façon iOS
- 🎨 Support du mode sombre complet

### 2. **AlertsScreen** - Alertes intelligentes
- 🚨 Alertes critiques et importantes
- 📊 Statistiques par priorité
- 🎯 Filtrage avancé (Critique, Élevée, Moyenne, Basse)
- 🤖 Système d'alertes intelligentes
- 📈 Analyse financière automatique

---

## 📂 Structure des fichiers

```
src/
├── screens/
│   ├── NotificationsScreen.tsx      # 🆕 Page de notifications
│   └── AlertsScreen.tsx              # ✅ Page d'alertes améliorée
├── hooks/
│   └── useSmartAlerts.ts             # Hook pour alertes intelligentes
├── services/
│   └── SmartAlertService.ts          # Service d'alertes
├── components/
│   └── alerts/
│       ├── AlertBanner.tsx           # Bannière d'alerte urgente
│       ├── AlertList.tsx             # Liste d'alertes
│       ├── SmartAlertCard.tsx        # Carte d'alerte
│       └── AlertPreferences.tsx      # Préférences d'alertes
└── types/
    └── Alert.ts                      # Types TypeScript
```

---

## 🎨 NotificationsScreen - Caractéristiques

### Interface utilisateur

#### En-tête
```tsx
- Bouton retour (←)
- Titre "Notifications" + badge du nombre non lu
- Bouton "Tout marquer comme lu" (✓✓)
```

#### Onglets de filtrage
```tsx
- 🔵 Toutes (affiche le compte total)
- 🔴 Non lues (affiche le badge)
- ⚠️ Alertes (critiques + élevées uniquement)
```

#### Groupes de notifications
```tsx
- 📅 Aujourd'hui
- 📆 Hier
- 🗓️ Cette semaine
```

#### Carte de notification
```tsx
┌─────────────────────────────────┐
│ 🔵 [Titre]              2h      │
│    Message de la notification   │
│    Action suggérée →            │
│                            ✕    │
└─────────────────────────────────┘
```

### Fonctionnalités

#### 1. **Affichage groupé par date**
```typescript
const groupedNotifications = useMemo(() => {
  const groups = {
    "Aujourd'hui": [],
    "Hier": [],
    "Cette semaine": [],
  };
  // Logique de groupement par date
  return groups;
}, [filteredNotifications]);
```

#### 2. **Formatage intelligent du temps**
```typescript
const formatTime = (dateString: string): string => {
  const diffMinutes = /* calcul */;
  
  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return date.toLocaleDateString('fr-FR');
};
```

#### 3. **Navigation contextuelle**
```typescript
const handleNotificationPress = (notification: Alert) => {
  markAsRead(notification.id);
  
  if (notification.actionUrl) {
    navigation.navigate(notification.actionUrl);
  }
};
```

#### 4. **Icônes selon le type**
```typescript
const getTypeIcon = (type: string): string => {
  const icons = {
    budget: 'wallet',
    savings: 'trending-up',
    debt: 'card',
    system: 'settings',
    security: 'shield-checkmark',
    transaction: 'cash',
    bill: 'document-text',
    reminder: 'alarm',
    // ...
  };
  return icons[type] || 'notifications';
};
```

#### 5. **Couleurs par priorité**
```typescript
const getPriorityColor = (priority: AlertPriority): string => {
  return {
    critical: '#FF3B30',  // Rouge
    high: '#FF9500',      // Orange
    medium: '#FFCC00',    // Jaune
    low: '#34C759',       // Vert
  }[priority];
};
```

---

## 🚨 AlertsScreen - Caractéristiques

### Interface utilisateur

#### En-tête moderne
```tsx
- 📊 Titre "Alertes" + statistiques
- 📈 Badges de priorité (Critical, High, Medium, Low)
- ✅ Bouton "Tout lire"
```

#### Bannière d'alerte urgente
```tsx
[🔴 ALERTE CRITIQUE]
Budget dépassé de 25%
→ Voir les détails
```

#### Filtres horizontaux
```tsx
[Toutes 12] [Non lues 3] [Critique 1] [Élevée 4] [Moyenne 5] [Basse 2]
```

#### Liste d'alertes groupées
```tsx
Alertes par priorité :
- 🔴 Critical
- 🟠 High
- 🟡 Medium
- 🟢 Low
```

### Fonctionnalités

#### 1. **Alertes intelligentes**
```typescript
const {
  alerts,
  loading,
  error,
  unreadCount,
  markAsRead,
  markAllAsRead,
  dismissAlert,
  refreshAlerts,
} = useSmartAlerts();
```

#### 2. **Statistiques en temps réel**
```typescript
const getAlertCounts = useCallback(() => {
  return {
    critical: getAlertsByPriority('critical').length,
    high: getAlertsByPriority('high').length,
    medium: getAlertsByPriority('medium').length,
    low: getAlertsByPriority('low').length,
    total: alerts.length
  };
}, [alerts]);
```

#### 3. **Alerte la plus urgente**
```typescript
const mostUrgentAlert = useMemo(() => {
  const unreadAlerts = alerts.filter(alert => !alert.read);
  
  // Priorisation : critical > high > medium > low
  const critical = unreadAlerts.filter(a => a.priority === 'critical');
  if (critical.length > 0) return critical[0];
  
  // ...
}, [alerts]);
```

#### 4. **Actions sur les alertes**
```typescript
const handleAlertPress = (alert: Alert) => {
  markAsRead(alert.id);
  
  if (alert.actionUrl) {
    navigation.navigate(alert.actionUrl as never);
  }
};

const handleAlertDismiss = (alertId: string) => {
  dismissAlert(alertId);
};
```

---

## 🔗 Intégration dans la navigation

### ModernDrawerNavigator.tsx

```typescript
// Import
import NotificationsScreen from '../screens/NotificationsScreen';

// Types
type DrawerParamList = {
  // ...
  Alerts: undefined;
  Notifications: undefined;
  // ...
};

// Drawer Screens
<Drawer.Screen
  name="Alerts"
  component={AlertsScreen}
  options={{
    drawerIcon: ({ size }) => (
      <View style={[styles.iconContainer, { backgroundColor: '#FFD60A' }]}>
        <Ionicons name="alert-circle" size={size-2} color="#000000" />
      </View>
    ),
    drawerLabel: "Alertes Intelligentes",
  }}
/>

<Drawer.Screen
  name="Notifications"
  component={NotificationsScreen}
  options={{
    drawerIcon: ({ size }) => (
      <View style={[styles.iconContainer, { backgroundColor: '#FF3B30' }]}>
        <Ionicons name="notifications" size={size-2} color="#FFFFFF" />
      </View>
    ),
    drawerLabel: "Notifications",
  }}
/>
```

---

## 🎯 Types de notifications

### AlertType
```typescript
type AlertType = 
  | 'budget'        // 💰 Alertes de budget
  | 'savings'       // 🎯 Objectifs d'épargne
  | 'debt'          // 💳 Dettes et échéances
  | 'system'        // ⚙️ Système
  | 'security'      // 🔒 Sécurité
  | 'transaction'   // 💸 Transactions
  | 'bill'          // 📄 Factures
  | 'reminder'      // ⏰ Rappels
  | 'report'        // 📊 Rapports
  | 'account'       // 🏦 Comptes
  | 'summary';      // 📈 Résumés
```

### AlertPriority
```typescript
type AlertPriority = 
  | 'low'       // 🟢 Basse
  | 'medium'    // 🟡 Moyenne
  | 'high'      // 🟠 Élevée
  | 'critical'; // 🔴 Critique
```

### Alert Interface
```typescript
interface Alert {
  id: string;
  userId: string;
  type: AlertType;
  title: string;
  message: string;
  priority: AlertPriority;
  status: AlertStatus;
  data?: any;
  actions?: AlertAction[];
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  read: boolean;
  category?: string;
  source?: string;
  actionUrl?: string;      // URL de navigation
  actionLabel?: string;    // Label du bouton d'action
}
```

---

## 🎨 Design System

### Couleurs

#### Priorités
```css
Critical: #FF3B30  /* Rouge vif */
High:     #FF9500  /* Orange */
Medium:   #FFCC00  /* Jaune */
Low:      #34C759  /* Vert */
```

#### Icônes du Drawer
```css
Alertes:       #FFD60A (Jaune) - alert-circle
Notifications: #FF3B30 (Rouge) - notifications
```

### Animations

#### Fade In
```typescript
const fadeAnim = useRef(new Animated.Value(0)).current;

Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 600,
  useNativeDriver: true,
}).start();
```

#### Pull to Refresh
```tsx
<RefreshControl
  refreshing={refreshing}
  onRefresh={onRefresh}
  tintColor={isDark ? '#fff' : '#000'}
/>
```

---

## 📊 États et données

### useSmartAlerts Hook

```typescript
interface UseSmartAlertsReturn {
  // État
  alerts: Alert[];
  scheduledAlerts: Alert[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  
  // Actions
  markAsRead: (alertId: string) => void;
  markAllAsRead: () => void;
  dismissAlert: (alertId: string) => void;
  refreshAlerts: () => Promise<void>;
  
  // Analyses
  analyzeTransaction: (transaction: any) => Promise<void>;
  analyzeBudgets: () => Promise<void>;
  analyzeDebts: () => Promise<void>;
  analyzeSavings: () => Promise<void>;
  
  // Filtres
  getAlertsByPriority: (priority: AlertPriority) => Alert[];
  getAlertsByType: (type: string) => Alert[];
  clearAllAlerts: () => void;
}
```

---

## 🔄 Flux de données

```
1. User Action (Budget dépassé, etc.)
     ↓
2. SmartAlertService.analyzeData()
     ↓
3. Création d'une alerte
     ↓
4. Stockage (SQLite + AsyncStorage)
     ↓
5. useSmartAlerts.loadAlerts()
     ↓
6. Affichage dans NotificationsScreen ou AlertsScreen
     ↓
7. User clicks notification
     ↓
8. markAsRead() + Navigation
```

---

## ✅ Fonctionnalités complètes

### NotificationsScreen
- ✅ Affichage groupé par date
- ✅ Filtrage par statut (Toutes, Non lues, Alertes)
- ✅ Badges de comptage
- ✅ Marquer comme lu au clic
- ✅ Marquer toutes comme lues
- ✅ Rejeter une notification
- ✅ Navigation contextuelle
- ✅ Pull to refresh
- ✅ État vide élégant
- ✅ Gestion des erreurs
- ✅ Mode sombre
- ✅ Animations fluides

### AlertsScreen
- ✅ Bannière d'alerte urgente
- ✅ Statistiques par priorité
- ✅ Filtrage avancé
- ✅ Groupement par priorité
- ✅ Actions sur alertes
- ✅ Pull to refresh
- ✅ État vide élégant
- ✅ Gestion des erreurs
- ✅ Mode sombre
- ✅ Animations fluides

---

## 🚀 Comment utiliser

### Navigation vers Notifications
```typescript
navigation.navigate('Notifications');
```

### Navigation vers Alertes
```typescript
navigation.navigate('Alerts');
```

### Depuis le menu burger
```
Menu → 🔔 Notifications
Menu → ⚠️ Alertes Intelligentes
```

### Créer une notification
```typescript
const notification: Omit<Alert, 'id' | 'createdAt'> = {
  userId: 'user-123',
  type: 'budget',
  title: 'Budget dépassé',
  message: 'Votre budget alimentation a dépassé 100%',
  priority: 'high',
  status: 'active',
  read: false,
  actionUrl: 'Budgets',
  actionLabel: 'Voir le budget',
};

await createAlert(notification);
```

---

## 🎯 Améliorations futures possibles

1. **Notifications push** (React Native Push Notifications)
2. **Sons personnalisés** par type d'alerte
3. **Vibrations** pour alertes critiques
4. **Planification d'alertes** récurrentes
5. **Analyse ML** pour alertes prédictives
6. **Exports** de l'historique
7. **Recherche** dans les notifications
8. **Archivage** automatique après 30 jours
9. **Catégories personnalisées** d'alertes
10. **Webhooks** pour alertes externes

---

## 📝 Notes importantes

- Les notifications sont **persistées en base de données**
- Le système utilise **SmartAlertService** pour l'analyse automatique
- Les couleurs respectent les **guidelines iOS**
- Le mode sombre est **entièrement supporté**
- Les animations utilisent **native driver** pour les performances
- Le refresh est **optimisé** avec état local

---

**Créé le :** 21 novembre 2025  
**Auteur :** GitHub Copilot (Claude Sonnet 4.5)  
**Version :** 1.0.0
