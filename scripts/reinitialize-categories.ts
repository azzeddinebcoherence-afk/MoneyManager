// Script de test pour forcer la réinitialisation des catégories
// Utilisé pour nettoyer complètement la BD et installer seulement les 20 nouvelles catégories

import categoryService from '../src/services/categoryService';

const forceReinitializeCategories = async () => {
  try {
    console.log('🔄 SCRIPT DE RÉINITIALISATION FORCÉE DES CATÉGORIES');
    console.log('🗑️ Suppression de TOUTES les anciennes catégories...');
    
    await categoryService.forceReinitializeAllCategories('default-user');
    
    console.log('✅ RÉINITIALISATION TERMINÉE !');
    console.log('✅ La base de données contient maintenant SEULEMENT vos 20 catégories principales + sous-catégories');
    
    // Vérification
    const allCategories = await categoryService.getAllCategories('default-user');
    const mainCategories = allCategories.filter(cat => cat.level === 0);
    const subCategories = allCategories.filter(cat => cat.level === 1);
    
    console.log(`📊 RÉSULTAT: ${allCategories.length} catégories au total`);
    console.log(`📊 - ${mainCategories.length} catégories principales`);
    console.log(`📊 - ${subCategories.length} sous-catégories`);
    
    console.log('\n🎯 CATÉGORIES PRINCIPALES INSTALLÉES:');
    mainCategories.forEach(cat => {
      console.log(`  ${cat.type === 'income' ? '💰' : '💸'} ${cat.name}`);
    });
    
  } catch (error) {
    console.error('❌ ERREUR lors de la réinitialisation:', error);
  }
};

// Exporter la fonction pour pouvoir l'appeler
export { forceReinitializeCategories };

// Si ce script est exécuté directement
if (require.main === module) {
  forceReinitializeCategories();
}