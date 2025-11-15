// src/services/database/categoryMigration.ts - MIGRATION SOUS-CATÉGORIES
import { getDatabase } from './sqlite';

export const migrateCategoriesWithSubcategories = async (): Promise<void> => {
  const db = await getDatabase();
  
  try {
    console.log('🔄 Migration des catégories avec sous-catégories...');

    // 1. Ajouter les colonnes aux catégories
    try {
      await db.execAsync(`
        ALTER TABLE categories ADD COLUMN parent_id TEXT;
      `);
      console.log('✅ Colonne parent_id ajoutée');
    } catch (error: any) {
      if (!error.message?.includes('duplicate column name')) {
        throw error;
      }
    }

    try {
      await db.execAsync(`
        ALTER TABLE categories ADD COLUMN is_system INTEGER DEFAULT 0;
      `);
      console.log('✅ Colonne is_system ajoutée');
    } catch (error: any) {
      if (!error.message?.includes('duplicate column name')) {
        throw error;
      }
    }

    // 2. Ajouter la colonne subcategory aux transactions
    try {
      await db.execAsync(`
        ALTER TABLE transactions ADD COLUMN subcategory TEXT;
      `);
      console.log('✅ Colonne subcategory ajoutée aux transactions');
    } catch (error: any) {
      if (!error.message?.includes('duplicate column name')) {
        throw error;
      }
    }

    // 3. Recréer les catégories avec sous-catégories
    await recreateCategoriesWithSubcategories();

    console.log('✅ Migration des sous-catégories terminée');

  } catch (error) {
    console.error('❌ Erreur migration sous-catégories:', error);
    throw error;
  }
};

const recreateCategoriesWithSubcategories = async (): Promise<void> => {
  const db = await getDatabase();
  
  try {
    // Vérifier si des catégories existent déjà
    const existingCategories = await db.getAllAsync('SELECT COUNT(*) as count FROM categories') as any[];
    const hasExistingCategories = existingCategories[0].count > 0;

    if (hasExistingCategories) {
      console.log('ℹ️ Catégories existantes détectées, conservation des données...');
      return;
    }

    console.log('📦 Création des catégories et sous-catégories par défaut...');

    const userId = 'default-user';
    const now = new Date().toISOString();

    // Catégories principales (parent)
    const mainCategories = [
      // DÉPENSES
      { id: 'cat_housing', name: 'Logement', type: 'expense', color: '#45B7D1', icon: 'home', isSystem: true },
      { id: 'cat_food', name: 'Alimentation', type: 'expense', color: '#FF6B6B', icon: 'restaurant', isSystem: true },
      { id: 'cat_transport', name: 'Transport', type: 'expense', color: '#4ECDC4', icon: 'car', isSystem: true },
      { id: 'cat_health', name: 'Santé', type: 'expense', color: '#FFEAA7', icon: 'medical', isSystem: true },
      { id: 'cat_entertainment', name: 'Loisirs', type: 'expense', color: '#96CEB4', icon: 'game-controller', isSystem: true },
      { id: 'cat_shopping', name: 'Shopping', type: 'expense', color: '#DDA0DD', icon: 'cart', isSystem: true },
      { id: 'cat_education', name: 'Éducation', type: 'expense', color: '#98D8C8', icon: 'school', isSystem: true },
      { id: 'cat_travel', name: 'Voyages', type: 'expense', color: '#F7DC6F', icon: 'airplane', isSystem: true },
      
      // REVENUS
      { id: 'cat_income_main', name: 'Revenus Principaux', type: 'income', color: '#52C41A', icon: 'cash', isSystem: true },
      { id: 'cat_income_secondary', name: 'Revenus Secondaires', type: 'income', color: '#FAAD14', icon: 'trending-up', isSystem: true },
      { id: 'cat_income_other', name: 'Autres Revenus', type: 'income', color: '#722ED1', icon: 'gift', isSystem: true },
    ];

    // Sous-catégories
    const subcategories = [
      // LOGEMENT
      { id: 'sub_rent', name: 'Loyer', type: 'expense', color: '#45B7D1', icon: 'home', parentId: 'cat_housing', isSystem: true },
      { id: 'sub_mortgage', name: 'Prêt Immobilier', type: 'expense', color: '#45B7D1', icon: 'business', parentId: 'cat_housing', isSystem: true },
      { id: 'sub_utilities', name: 'Factures', type: 'expense', color: '#45B7D1', icon: 'flash', parentId: 'cat_housing', isSystem: true },
      { id: 'sub_maintenance', name: 'Entretien', type: 'expense', color: '#45B7D1', icon: 'build', parentId: 'cat_housing', isSystem: true },

      // ALIMENTATION
      { id: 'sub_groceries', name: 'Épicerie', type: 'expense', color: '#FF6B6B', icon: 'basket', parentId: 'cat_food', isSystem: true },
      { id: 'sub_restaurant', name: 'Restaurant', type: 'expense', color: '#FF6B6B', icon: 'restaurant', parentId: 'cat_food', isSystem: true },
      { id: 'sub_delivery', name: 'Livraison', type: 'expense', color: '#FF6B6B', icon: 'fast-food', parentId: 'cat_food', isSystem: true },

      // TRANSPORT
      { id: 'sub_fuel', name: 'Carburant', type: 'expense', color: '#4ECDC4', icon: 'flash', parentId: 'cat_transport', isSystem: true },
      { id: 'sub_public_transport', name: 'Transport Public', type: 'expense', color: '#4ECDC4', icon: 'bus', parentId: 'cat_transport', isSystem: true },
      { id: 'sub_taxi', name: 'Taxi/VTC', type: 'expense', color: '#4ECDC4', icon: 'car', parentId: 'cat_transport', isSystem: true },
      { id: 'sub_maintenance_car', name: 'Entretien Voiture', type: 'expense', color: '#4ECDC4', icon: 'construct', parentId: 'cat_transport', isSystem: true },

      // SANTÉ
      { id: 'sub_doctor', name: 'Médecin', type: 'expense', color: '#FFEAA7', icon: 'medical', parentId: 'cat_health', isSystem: true },
      { id: 'sub_pharmacy', name: 'Pharmacie', type: 'expense', color: '#FFEAA7', icon: 'medical', parentId: 'cat_health', isSystem: true },
      { id: 'sub_insurance', name: 'Assurance Santé', type: 'expense', color: '#FFEAA7', icon: 'shield', parentId: 'cat_health', isSystem: true },

      // LOISIRS
      { id: 'sub_cinema', name: 'Cinéma', type: 'expense', color: '#96CEB4', icon: 'film', parentId: 'cat_entertainment', isSystem: true },
      { id: 'sub_sports', name: 'Sports', type: 'expense', color: '#96CEB4', icon: 'basketball', parentId: 'cat_entertainment', isSystem: true },
      { id: 'sub_hobbies', name: 'Loisirs Créatifs', type: 'expense', color: '#96CEB4', icon: 'brush', parentId: 'cat_entertainment', isSystem: true },

      // REVENUS PRINCIPAUX
      { id: 'sub_salary', name: 'Salaire', type: 'income', color: '#52C41A', icon: 'cash', parentId: 'cat_income_main', isSystem: true },
      { id: 'sub_business', name: 'Revenus Business', type: 'income', color: '#52C41A', icon: 'business', parentId: 'cat_income_main', isSystem: true },

      // REVENUS SECONDAIRES
      { id: 'sub_freelance', name: 'Freelance', type: 'income', color: '#FAAD14', icon: 'laptop', parentId: 'cat_income_secondary', isSystem: true },
      { id: 'sub_investments', name: 'Investissements', type: 'income', color: '#FAAD14', icon: 'trending-up', parentId: 'cat_income_secondary', isSystem: true },

      // AUTRES REVENUS
      { id: 'sub_gifts', name: 'Cadeaux', type: 'income', color: '#722ED1', icon: 'gift', parentId: 'cat_income_other', isSystem: true },
      { id: 'sub_refunds', name: 'Remboursements', type: 'income', color: '#722ED1', icon: 'arrow-undo', parentId: 'cat_income_other', isSystem: true },
    ];

    // Insérer toutes les catégories
    const allCategories = [...mainCategories, ...subcategories];
    
    for (const category of allCategories) {
      await db.runAsync(
        `INSERT INTO categories (id, user_id, name, type, color, icon, parent_id, is_system, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          category.id,
          userId,
          category.name,
          category.type,
          category.color,
          category.icon,
          category.parentId || null,
          category.isSystem ? 1 : 0,
          now
        ]
      );
    }

    console.log(`✅ ${allCategories.length} catégories créées avec sous-catégories`);

  } catch (error) {
    console.error('❌ Erreur création catégories:', error);
    throw error;
  }
};

export default migrateCategoriesWithSubcategories;