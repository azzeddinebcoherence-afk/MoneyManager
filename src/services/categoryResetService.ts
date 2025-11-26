// src/services/categoryResetService.ts - VERSION CORRIGÉE
import { getDatabase } from './database/sqlite';

export const categoryResetService = {
  // Forcer la réinitialisation complète des catégories
  async forceResetCategories(userId: string = 'default-user'): Promise<void> {
    try {
      const db = await getDatabase();
      console.log('🔄 FORCE RESET des catégories...');

      // 1. Désactiver les contraintes temporairement
      await db.execAsync('PRAGMA foreign_keys = OFF');
      
      // 2. Supprimer toutes les catégories existantes
      await db.runAsync('DELETE FROM categories WHERE user_id = ?', [userId]);
      console.log('✅ Anciennes catégories supprimées');

      // 3. Vérifier que la table est vide
      const countResult = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM categories WHERE user_id = ?',
        [userId]
      ) as { count: number };
      
      console.log(`✅ Table categories vidée: ${countResult.count} catégories restantes`);

      // 4. Réactiver les contraintes
      await db.execAsync('PRAGMA foreign_keys = ON');

      // 5. Réinitialiser la table avec des IDs uniques
      await resetCategoriesWithUniqueIds(userId);

      console.log('✅ Reset forcé des catégories terminé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du reset forcé:', error);
      // Réactiver les contraintes en cas d'erreur
      try {
        const db = await getDatabase();
        await db.execAsync('PRAGMA foreign_keys = ON');
      } catch (e) {
        // Ignorer les erreurs de réactivation
      }
      throw error;
    }
  },

  // Vérifier la structure de la table
  async diagnoseCategories(userId: string = 'default-user'): Promise<any> {
    try {
      const db = await getDatabase();
      
      // Vérifier la structure de la table
      const tableInfo = await db.getAllAsync('PRAGMA table_info(categories)');
      
      // Compter les catégories par niveau
      const levelCounts = await db.getAllAsync(`
        SELECT level, COUNT(*) as count 
        FROM categories 
        WHERE user_id = ? 
        GROUP BY level 
        ORDER BY level
      `, [userId]);

      // Compter par type
      const typeCounts = await db.getAllAsync(`
        SELECT type, COUNT(*) as count 
        FROM categories 
        WHERE user_id = ? 
        GROUP BY type
      `, [userId]);

      // Vérifier les doublons d'ID
      const duplicateIds = await db.getAllAsync(`
        SELECT id, COUNT(*) as count 
        FROM categories 
        WHERE user_id = ? 
        GROUP BY id 
        HAVING COUNT(*) > 1
      `, [userId]);

      // Afficher quelques exemples
      const sampleCategories = await db.getAllAsync(`
        SELECT id, name, type, level, parent_id 
        FROM categories 
        WHERE user_id = ? 
        ORDER BY level, name 
        LIMIT 10
      `, [userId]);

      return {
        tableStructure: tableInfo,
        levelCounts,
        typeCounts,
        duplicateIds,
        totalCategories: levelCounts.reduce((acc, item: any) => acc + item.count, 0),
        sampleCategories
      };
    } catch (error) {
      console.error('❌ Erreur diagnostic:', error);
      throw error;
    }
  }
};

// Fonction pour réinitialiser avec des IDs uniques
async function resetCategoriesWithUniqueIds(userId: string): Promise<void> {
  const db = await getDatabase();
  
  console.log('🔄 Création des catégories avec IDs uniques...');
  
  const now = new Date().toISOString();

  // ✅ CATÉGORIES PRINCIPALES DÉPENSES - AVEC IDs UNIQUES
  const mainExpenseCategories = [
    { id: `cat_housing_${Date.now()}_1`, name: '🏠 Logement', type: 'expense' as const, color: '#45B7D1', icon: 'home', level: 0, sortOrder: 1 },
    { id: `cat_food_${Date.now()}_2`, name: '🍴 Nourriture & Courses', type: 'expense' as const, color: '#FF6B6B', icon: 'restaurant', level: 0, sortOrder: 2 },
    { id: `cat_transport_${Date.now()}_3`, name: '🚗 Transport', type: 'expense' as const, color: '#4ECDC4', icon: 'car', level: 0, sortOrder: 3 },
    { id: `cat_health_${Date.now()}_4`, name: '🧍‍♂️ Santé & Bien-être', type: 'expense' as const, color: '#FFEAA7', icon: 'medical', level: 0, sortOrder: 4 },
    { id: `cat_family_${Date.now()}_5`, name: '👨‍👩‍👦 Famille & Enfants', type: 'expense' as const, color: '#A78BFA', icon: 'people', level: 0, sortOrder: 5 },
    { id: `cat_shopping_${Date.now()}_6`, name: '🛍️ Achats personnels', type: 'expense' as const, color: '#DDA0DD', icon: 'cart', level: 0, sortOrder: 6 },
    { id: `cat_entertainment_${Date.now()}_7`, name: '🎉 Loisirs & Sorties', type: 'expense' as const, color: '#96CEB4', icon: 'game-controller', level: 0, sortOrder: 7 },
    { id: `cat_work_${Date.now()}_8`, name: '💼 Travail / Études', type: 'expense' as const, color: '#F39C12', icon: 'briefcase', level: 0, sortOrder: 8 },
    { id: `cat_finances_${Date.now()}_9`, name: '💳 Finances & Obligations', type: 'expense' as const, color: '#E74C3C', icon: 'card', level: 0, sortOrder: 9 },
    { id: `cat_religion_${Date.now()}_10`, name: '🕌 Religion / Spiritualité', type: 'expense' as const, color: '#16A085', icon: 'star', level: 0, sortOrder: 10 },
    { id: `cat_savings_${Date.now()}_11`, name: '💾 Épargne & Investissements', type: 'expense' as const, color: '#27AE60', icon: 'trending-up', level: 0, sortOrder: 11 },
    { id: `cat_other_${Date.now()}_12`, name: '⚙️ Autres', type: 'expense' as const, color: '#95A5A6', icon: 'ellipsis-horizontal', level: 0, sortOrder: 12 },
  ];

  // ✅ CATÉGORIES PRINCIPALES REVENUS - AVEC IDs UNIQUES
  const mainIncomeCategories = [
    { id: `cat_primary_income_${Date.now()}_13`, name: '👨‍💼 Salaire', type: 'income' as const, color: '#52C41A', icon: 'cash', level: 0, sortOrder: 13 },
    { id: `cat_secondary_income_${Date.now()}_14`, name: '💻 Revenus secondaires', type: 'income' as const, color: '#FAAD14', icon: 'laptop', level: 0, sortOrder: 14 },
    { id: `cat_financial_income_${Date.now()}_15`, name: '💵 Revenus financiers', type: 'income' as const, color: '#20B2AA', icon: 'trending-up', level: 0, sortOrder: 15 },
    { id: `cat_other_income_${Date.now()}_16`, name: '🎁 Autres revenus', type: 'income' as const, color: '#BB8FCE', icon: 'gift', level: 0, sortOrder: 16 },
    { id: `cat_spiritual_income_${Date.now()}_17`, name: '🕌 Revenus spirituels', type: 'income' as const, color: '#16A085', icon: 'star', level: 0, sortOrder: 17 },
  ];

  // Stocker le mapping des anciens IDs vers les nouveaux IDs pour les sous-catégories
  const categoryIdMap = new Map();

  // Insérer les catégories principales
  for (const category of [...mainExpenseCategories, ...mainIncomeCategories]) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (id, user_id, name, type, color, icon, parent_id, level, sort_order, is_active, budget, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category.id,
        userId,
        category.name,
        category.type,
        category.color,
        category.icon,
        null,
        category.level,
        category.sortOrder,
        1,
        0,
        now
      ]
    );
    
    // Stocker le mapping pour les sous-catégories
    const oldId = category.id.split('_').slice(0, -2).join('_'); // Récupérer l'ancien format d'ID
    categoryIdMap.set(oldId, category.id);
  }

  // ✅ SOUS-CATÉGORIES DÉTAILLÉES - AVEC IDs UNIQUES ET PARENTS CORRECTS
  const subcategories = [
    // 🏠 SOUS-CATÉGORIES LOGEMENT
    { name: 'Loyer / Crédit immobilier', type: 'expense' as const, color: '#45B7D1', icon: 'home', parentOldId: 'cat_housing', level: 1, sortOrder: 1 },
    { name: 'Charges de copropriété', type: 'expense' as const, color: '#45B7D1', icon: 'document', parentOldId: 'cat_housing', level: 1, sortOrder: 2 },
    { name: 'Électricité', type: 'expense' as const, color: '#45B7D1', icon: 'flash', parentOldId: 'cat_housing', level: 1, sortOrder: 3 },
    { name: 'Eau', type: 'expense' as const, color: '#45B7D1', icon: 'water', parentOldId: 'cat_housing', level: 1, sortOrder: 4 },
    { name: 'Gaz', type: 'expense' as const, color: '#45B7D1', icon: 'flame', parentOldId: 'cat_housing', level: 1, sortOrder: 5 },
    { name: 'Internet / Wi-Fi', type: 'expense' as const, color: '#45B7D1', icon: 'wifi', parentOldId: 'cat_housing', level: 1, sortOrder: 6 },
    { name: 'Téléphone', type: 'expense' as const, color: '#45B7D1', icon: 'call', parentOldId: 'cat_housing', level: 1, sortOrder: 7 },
    { name: 'Entretien maison / Réparations', type: 'expense' as const, color: '#45B7D1', icon: 'build', parentOldId: 'cat_housing', level: 1, sortOrder: 8 },
    { name: 'Assurance habitation', type: 'expense' as const, color: '#45B7D1', icon: 'shield', parentOldId: 'cat_housing', level: 1, sortOrder: 9 },
    { name: 'Meubles / Décoration', type: 'expense' as const, color: '#45B7D1', icon: 'bed', parentOldId: 'cat_housing', level: 1, sortOrder: 10 },
    { name: 'Produits ménagers', type: 'expense' as const, color: '#45B7D1', icon: 'sparkles', parentOldId: 'cat_housing', level: 1, sortOrder: 11 },

    // 🍴 SOUS-CATÉGORIES NOURRITURE
    { name: 'Super marché / Épicerie', type: 'expense' as const, color: '#FF6B6B', icon: 'basket', parentOldId: 'cat_food', level: 1, sortOrder: 1 },
    { name: 'Boucherie / Poissonnerie', type: 'expense' as const, color: '#FF6B6B', icon: 'restaurant', parentOldId: 'cat_food', level: 1, sortOrder: 2 },
    { name: 'Fruits & légumes', type: 'expense' as const, color: '#FF6B6B', icon: 'nutrition', parentOldId: 'cat_food', level: 1, sortOrder: 3 },
    { name: 'Produits de base (huile, farine, sucre…)', type: 'expense' as const, color: '#FF6B6B', icon: 'cube', parentOldId: 'cat_food', level: 1, sortOrder: 4 },
    { name: 'Repas à emporter / Livraison', type: 'expense' as const, color: '#FF6B6B', icon: 'fast-food', parentOldId: 'cat_food', level: 1, sortOrder: 5 },
    { name: 'Restaurants / Cafés', type: 'expense' as const, color: '#FF6B6B', icon: 'cafe', parentOldId: 'cat_food', level: 1, sortOrder: 6 },
    { name: 'Eau / Boissons', type: 'expense' as const, color: '#FF6B6B', icon: 'water', parentOldId: 'cat_food', level: 1, sortOrder: 7 },

    // 🚗 SOUS-CATÉGORIES TRANSPORT
    { name: 'Carburant', type: 'expense' as const, color: '#4ECDC4', icon: 'car', parentOldId: 'cat_transport', level: 1, sortOrder: 1 },
    { name: 'Transport en commun', type: 'expense' as const, color: '#4ECDC4', icon: 'bus', parentOldId: 'cat_transport', level: 1, sortOrder: 2 },
    { name: 'Taxi / VTC', type: 'expense' as const, color: '#4ECDC4', icon: 'car', parentOldId: 'cat_transport', level: 1, sortOrder: 3 },
    { name: 'Assurance auto', type: 'expense' as const, color: '#4ECDC4', icon: 'shield', parentOldId: 'cat_transport', level: 1, sortOrder: 4 },
    { name: 'Réparation / Entretien', type: 'expense' as const, color: '#4ECDC4', icon: 'build', parentOldId: 'cat_transport', level: 1, sortOrder: 5 },
    { name: 'Stationnement / Péage', type: 'expense' as const, color: '#4ECDC4', icon: 'location', parentOldId: 'cat_transport', level: 1, sortOrder: 6 },
    { name: 'Achat de véhicule', type: 'expense' as const, color: '#4ECDC4', icon: 'car-sport', parentOldId: 'cat_transport', level: 1, sortOrder: 7 },
    { name: 'Visite technique', type: 'expense' as const, color: '#4ECDC4', icon: 'document', parentOldId: 'cat_transport', level: 1, sortOrder: 8 },
    { name: 'Vignette', type: 'expense' as const, color: '#4ECDC4', icon: 'pricetag', parentOldId: 'cat_transport', level: 1, sortOrder: 9 },
    { name: 'Lavage voiture', type: 'expense' as const, color: '#4ECDC4', icon: 'water', parentOldId: 'cat_transport', level: 1, sortOrder: 10 },

    // Ajoutez d'autres sous-catégories ici selon le même modèle...
  ];

  // Insérer les sous-catégories
  let subcategoryCount = 0;
  for (const subcategory of subcategories) {
    const parentId = categoryIdMap.get(subcategory.parentOldId);
    if (!parentId) {
      console.warn(`⚠️ Parent non trouvé pour: ${subcategory.name}`);
      continue;
    }

    const subcategoryId = `sub_${subcategory.parentOldId}_${subcategoryCount}_${Date.now()}`;
    
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (id, user_id, name, type, color, icon, parent_id, level, sort_order, is_active, budget, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        subcategoryId,
        userId,
        subcategory.name,
        subcategory.type,
        subcategory.color,
        subcategory.icon,
        parentId,
        subcategory.level,
        subcategory.sortOrder,
        1,
        0,
        now
      ]
    );
    
    subcategoryCount++;
  }

  console.log(`✅ ${mainExpenseCategories.length + mainIncomeCategories.length} catégories principales créées`);
  console.log(`✅ ${subcategoryCount} sous-catégories créées`);
}

export default categoryResetService;