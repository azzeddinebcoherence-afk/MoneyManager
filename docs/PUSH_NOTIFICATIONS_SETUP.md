# Installation des notifications push

## 📦 Installation du package

```bash
npx expo install expo-notifications expo-device
```

## 📱 Configuration Android (android/app/src/main/AndroidManifest.xml)

Ajoutez les permissions suivantes dans le fichier `AndroidManifest.xml` :

```xml
<manifest>
  <!-- Permissions pour les notifications -->
  <uses-permission android:name="android.permission.VIBRATE" />
  <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
  
  <application>
    <!-- ... -->
  </application>
</manifest>
```

## 🍎 Configuration iOS

Pour iOS, les notifications sont automatiquement configurées par Expo.

## 🔧 Configuration app.json

Ajoutez dans votre `app.json` :

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#007AFF",
          "sounds": ["./assets/notification.wav"]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#007AFF",
      "androidMode": "default",
      "androidCollapsedTitle": "#{unread_notifications} nouvelles notifications"
    }
  }
}
```

## 📝 Instructions d'utilisation

### 1. Initialiser dans App.tsx

Ajoutez le hook dans votre composant App :

```typescript
import { usePushNotifications } from './src/hooks/usePushNotifications';

function App() {
  const { isInitialized, hasPermission } = usePushNotifications();

  useEffect(() => {
    if (isInitialized) {
      console.log('✅ Notifications push activées');
    }
  }, [isInitialized]);

  // ... reste du code
}
```

### 2. Utilisation dans les composants

```typescript
import { pushNotificationService } from './src/services/PushNotificationService';

// Envoyer une notification immédiate
await pushNotificationService.sendLocalNotification({
  title: '💰 Nouveau revenu',
  body: '500 Dh ajouté',
  data: { type: 'transaction' }
});

// Programmer une notification
await pushNotificationService.scheduleNotification({
  title: '📅 Rappel',
  body: 'Vérifiez vos budgets',
  trigger: { seconds: 60 }
});
```

### 3. Tester sur appareil physique

⚠️ **Important** : Les notifications push ne fonctionnent QUE sur un appareil physique (pas sur émulateur/simulateur).

Pour tester :
1. Connectez votre téléphone
2. Lancez : `npx expo run:android` ou `npx expo run:ios`
3. Autorisez les notifications quand demandé
4. Les notifications apparaîtront sur votre téléphone

## 🎯 Notifications automatiques configurées

Le système envoie automatiquement des notifications push pour :

### Transactions
- ✅ Transaction ajoutée (revenu/dépense)
- ✅ Transaction modifiée
- ✅ Transaction supprimée

### Alertes critiques
- ⚠️ Budget dépassé
- ⚠️ Dette à échéance proche
- ⚠️ Facture impayée

### Objectifs
- 🎉 Objectif d'épargne atteint
- 📊 Progrès de l'épargne

### Système
- 📈 Rapport mensuel disponible
- ✅ Synchronisation terminée
- 💾 Backup créé

## 🔕 Paramètres utilisateur

Les utilisateurs peuvent activer/désactiver les notifications push dans les paramètres de l'app.

```typescript
// Désactiver les notifications push
notificationService.setPushEnabled(false);

// Réactiver
notificationService.setPushEnabled(true);
```

## 📊 Gestion du badge

```typescript
// Mettre à jour le badge
await pushNotificationService.setBadgeCount(5);

// Réinitialiser le badge
await pushNotificationService.resetBadge();
```

## 🔔 Canaux de notification Android

3 canaux sont configurés :

1. **Default** : Notifications standard
2. **Critical** : Alertes urgentes (budgets, dettes)
3. **Info** : Notifications informatives (rapports, sync)

## 🚨 Dépannage

### Les notifications n'apparaissent pas

1. Vérifiez que vous êtes sur un appareil physique
2. Vérifiez les permissions : Paramètres → Apps → MoneyManager → Notifications
3. Redémarrez l'application
4. Vérifiez les logs : `npx expo start`

### Badge ne s'affiche pas sur iOS

Sur iOS 13+, le badge est géré automatiquement par le système.

### Son de notification

Pour personnaliser le son :
1. Ajoutez votre fichier `.wav` dans `assets/`
2. Mettez à jour `app.json`
3. Reconstruisez : `npx expo prebuild --clean`

## 📱 Production

Pour publier l'app avec les notifications :

```bash
# Build Android
eas build --platform android --profile production

# Build iOS
eas build --platform ios --profile production
```

## 🔐 Sécurité

- Les tokens push sont stockés de manière sécurisée dans `secureStorage`
- Les notifications contiennent uniquement des données non sensibles
- Les montants sont toujours arrondis à 2 décimales

## 📚 Documentation Expo

Pour plus d'informations :
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
