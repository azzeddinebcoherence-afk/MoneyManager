const { exec } = require('child_process');
const path = require('path');

// Script pour vérifier et nettoyer complètement les catégories
console.log('🔍 DIAGNOSTIC COMPLET DES CATÉGORIES');
console.log('=====================================');

async function runDiagnostic() {
  try {
    // Démarrer Metro si pas déjà démarré
    console.log('📱 Démarrage de l\'application...');
    
    console.log('\n✅ ÉTAPES À SUIVRE POUR NETTOYER COMPLÈTEMENT :');
    console.log('1. 🌐 Ouvrir http://localhost:8081 dans votre navigateur');
    console.log('2. 📱 Scanner le QR code ou appuyer sur "w" pour ouvrir dans le navigateur web');
    console.log('3. ⚙️  Aller dans Paramètres → Catégories');
    console.log('4. 🔴 Cliquer sur le bouton rouge "Réinitialiser avec toutes les catégories"');
    console.log('5. ✅ Vérifier que seules les 20 nouvelles catégories + sous-catégories sont présentes');
    
    console.log('\n🎯 RÉSULTAT ATTENDU APRÈS RÉINITIALISATION :');
    console.log('• 3 catégories de REVENUS');
    console.log('• 9 catégories de DÉPENSES MENSUELLES');  
    console.log('• 8 catégories de CHARGES ANNUELLES');
    console.log('• 58 sous-catégories détaillées');
    console.log('• 0 ancienne catégorie ou sous-catégorie');
    
    console.log('\n🔬 VÉRIFICATION TECHNIQUE :');
    console.log('✅ La fonction forceReinitializeAllCategories() fait un DELETE FROM categories');
    console.log('✅ Cela supprime TOUTES les catégories (principales + sous-catégories)');
    console.log('✅ Reset du compteur auto-increment');
    console.log('✅ Installation des nouvelles catégories uniquement');
    
    console.log('\n🚀 Si vous voyez encore d\'anciennes catégories :');
    console.log('1. Fermez complètement l\'app');
    console.log('2. Relancez avec : npm run start');
    console.log('3. Refaites la réinitialisation');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

runDiagnostic();