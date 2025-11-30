// Script pour réinitialiser la devise à MAD
// À exécuter avec: node scripts/reset-currency-to-mad.js

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function resetCurrencyToMAD() {
  try {
    const MAD = {
      code: 'MAD',
      symbol: 'Dh',
      name: 'Dirham Marocain',
      locale: 'fr-FR'
    };

    await AsyncStorage.setItem('selectedCurrency', JSON.stringify(MAD));
    console.log('✅ Devise réinitialisée à MAD (Dh)');
    
    // Vérifier
    const saved = await AsyncStorage.getItem('selectedCurrency');
    console.log('📊 Devise sauvegardée:', JSON.parse(saved));
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

resetCurrencyToMAD();
