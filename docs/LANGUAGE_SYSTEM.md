# Système de Langues (i18n) - Guide d'Utilisation

## 📚 Vue d'ensemble

Le système de langues permet de supporter 3 langues dans l'application :
- 🇫🇷 **Français** (par défaut)
- 🇬🇧 **English**
- 🇸🇦 **العربية** (avec support RTL)

## 🏗️ Architecture

### Fichiers principaux

```
src/
├── i18n/
│   └── translations.ts          # Définitions de toutes les traductions
├── context/
│   └── LanguageContext.tsx      # Context provider pour la langue
└── components/
    └── settings/
        └── LanguageSelector.tsx # Composant de sélection de langue
```

## 🚀 Utilisation dans un composant

### 1. Importer le hook

```typescript
import { useLanguage } from '../context/LanguageContext';
```

### 2. Utiliser dans le composant

```typescript
const MyComponent = () => {
  const { language, t, changeLanguage, isRTL } = useLanguage();
  
  return (
    <View>
      <Text>{t.dashboard}</Text>
      <Text>{t.transactions}</Text>
      <Text>{t.myAccounts}</Text>
    </View>
  );
};
```

### 3. Propriétés disponibles

- **`language`**: `'fr' | 'en' | 'ar'` - Langue actuelle
- **`t`**: `Translations` - Objet contenant toutes les traductions
- **`changeLanguage(lang)`**: Fonction pour changer la langue
- **`isRTL`**: `boolean` - True si la langue est RTL (arabe)

## 📝 Ajouter de nouvelles traductions

### 1. Ajouter la clé dans l'interface

```typescript
// src/i18n/translations.ts
export interface Translations {
  // ... clés existantes
  myNewKey: string;
}
```

### 2. Ajouter les traductions pour chaque langue

```typescript
export const translations = {
  fr: {
    // ... traductions existantes
    myNewKey: 'Ma nouvelle clé',
  },
  en: {
    // ... traductions existantes
    myNewKey: 'My new key',
  },
  ar: {
    // ... traductions existantes
    myNewKey: 'مفتاحي الجديد',
  },
};
```

### 3. Utiliser la nouvelle clé

```typescript
const { t } = useLanguage();
<Text>{t.myNewKey}</Text>
```

## 🔧 Clés de traduction disponibles

### Navigation
- `dashboard`, `transactions`, `accounts`, `budgets`, `categories`
- `savings`, `debts`, `reports`, `settings`, `profile`

### Actions communes
- `add`, `edit`, `delete`, `save`, `cancel`, `confirm`
- `search`, `filter`, `export`, `import`, `refresh`

### Dashboard
- `totalBalance`, `monthlyIncome`, `monthlyExpenses`
- `recentTransactions`, `viewAll`, `noDataThisMonth`
- `netWorth`, `recentActivity`, `quickActions`

### Transactions
- `newTransaction`, `income`, `expense`, `transfer`
- `amount`, `description`, `date`, `category`, `account`

### Comptes
- `myAccounts`, `addAccount`, `accountName`, `balance`

### Budgets
- `myBudgets`, `createBudget`, `spent`, `remaining`

### Catégories
- `myCategories`, `addCategory`, `parentCategory`, `subCategory`

### Épargne
- `savingsGoals`, `goalName`, `targetAmount`, `currentAmount`, `progress`

### Dettes
- `myDebts`, `debtName`, `totalDebt`, `remainingDebt`, `monthlyPayment`

### Paramètres
- `generalSettings`, `language`, `theme`, `currency`, `security`, `backup`

### Messages
- `success`, `error`, `loading`, `noData`, `confirmDelete`

### Calendrier
- `calendar`, `expenseCalendar`, `monthView`, `annualCharges`, `calendarExpenses`

### Autres
- `alerts`, `currencies`, `islamicCharges`, `categoryAnalysis`

## 🌍 Support RTL (Right-to-Left)

### Détection automatique

```typescript
const { isRTL } = useLanguage();

<View style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
  {/* Contenu */}
</View>
```

### Changement vers l'arabe

Lorsque l'utilisateur change vers l'arabe :
1. La langue est sauvegardée dans AsyncStorage
2. `I18nManager.forceRTL(true)` est appelé
3. Une alerte demande à l'utilisateur de redémarrer l'app
4. Au prochain démarrage, l'interface est en RTL

## 🎨 Interface utilisateur

### Sélecteur de langue

Le composant `LanguageSelector` est déjà intégré dans **Paramètres > Paramètres Généraux**.

Caractéristiques :
- ✅ 3 options avec drapeaux
- ✅ Indication visuelle de la langue active
- ✅ Badge RTL pour l'arabe
- ✅ Alerte pour le redémarrage (changement RTL)
- ✅ Message informatif

## 🔄 Persistance

La langue est automatiquement sauvegardée dans AsyncStorage avec la clé `@app_language` et restaurée au démarrage de l'application.

## 📱 Exemples d'utilisation

### Exemple 1 : Menu de navigation

```typescript
// ModernDrawerContent.tsx
const { t } = useLanguage();

const menuSections = [
  {
    title: t.dashboard.toUpperCase(),
    items: [
      { label: t.dashboard, icon: 'speedometer', screen: 'Dashboard' },
      { label: t.transactions, icon: 'list', screen: 'Transactions' },
    ],
  },
];
```

### Exemple 2 : Formulaire

```typescript
const AddTransactionScreen = () => {
  const { t } = useLanguage();
  
  return (
    <View>
      <Text>{t.newTransaction}</Text>
      <TextInput placeholder={t.amount} />
      <TextInput placeholder={t.description} />
      <TextInput placeholder={t.category} />
      <Button title={t.save} />
    </View>
  );
};
```

### Exemple 3 : Messages dynamiques

```typescript
const { t } = useLanguage();

Alert.alert(
  t.success,
  `${t.save} ${t.success.toLowerCase()}`,
  [{ text: t.confirm }]
);
```

## 🚧 TODO / Améliorations futures

- [ ] Traduire tous les écrans restants
- [ ] Ajouter plus de clés de traduction
- [ ] Supporter le format de date selon la langue
- [ ] Supporter le format de nombre selon la langue
- [ ] Ajouter d'autres langues (espagnol, allemand, etc.)
- [ ] Tester complètement le mode RTL sur un appareil réel

## 📊 État d'avancement

### Écrans traduits (partiellement ou complètement)
- ✅ ModernDrawerContent (menu)
- ✅ DashboardScreen (partiel)
- ✅ TransactionsScreen (hooks ajoutés)
- ✅ GeneralSettingsScreen (avec LanguageSelector)

### Écrans à traduire
- ⏳ AccountsScreen
- ⏳ BudgetsScreen
- ⏳ CategoriesScreen
- ⏳ SavingsScreen
- ⏳ DebtsScreen
- ⏳ ReportsScreen
- ⏳ Et tous les autres écrans...

## 🛠️ Maintenance

Pour garder le système à jour :
1. Ajouter les nouvelles clés à l'interface `Translations`
2. Ajouter les traductions dans les 3 langues (fr, en, ar)
3. Vérifier que TypeScript ne signale aucune erreur
4. Tester le changement de langue dans l'app

---

**Note**: Le système de langue est maintenant opérationnel ! Vous pouvez changer de langue dans **Paramètres > Paramètres Généraux > Langue**.
