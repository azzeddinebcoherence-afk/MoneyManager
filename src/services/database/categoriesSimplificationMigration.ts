// src/services/database/categoriesSimplificationMigration.ts
import { getDatabase } from './sqlite';

/**
 * Migration pour simplifier les catégories :
 * - Garder uniquement les catégories principales (level 0)
 * - Créer une seule sous-catégorie "Autres" pour chacune
 */

interface SimplifiedCategory {
  id: string;
  name: string;
  type: 'expense' | 'income';
  color: string;
  icon: string;
}

// Catégories principales simplifiées
const SIMPLIFIED_MAIN_CATEGORIES: SimplifiedCategory[] = [
  // Dépenses
  { id: 'cat_food', name: 'Alimentation', type: 'expense', color: '#FF6B6B', icon: 'fast-food' },
  { id: 'cat_transport', name: 'Transport', type: 'expense', color: '#4ECDC4', icon: 'car' },
  { id: 'cat_housing', name: 'Logement', type: 'expense', color: '#45B7D1', icon: 'home' },
  { id: 'cat_health', name: 'Santé', type: 'expense', color: '#FF8C94', icon: 'medical' },
  { id: 'cat_entertainment', name: 'Loisirs', type: 'expense', color: '#A8E6CF', icon: 'game-controller' },
  { id: 'cat_shopping', name: 'Shopping', type: 'expense', color: '#FFD93D', icon: 'cart' },
  { id: 'cat_education', name: 'Éducation', type: 'expense', color: '#C7CEEA', icon: 'school' },
  { id: 'cat_bills', name: 'Factures', type: 'expense', color: '#FFEAA7', icon: 'document-text' },
  
  // Revenus
  { id: 'cat_salary', name: 'Salaire', type: 'income', color: '#00B894', icon: 'cash' },
  { id: 'cat_business', name: 'Business', type: 'income', color: '#6C5CE7', icon: 'briefcase' },
  { id: 'cat_investment', name: 'Investissement', type: 'income', color: '#FDCB6E', icon: 'trending-up' },
  { id: 'cat_other_income', name: 'Autres revenus', type: 'income', color: '#74B9FF', icon: 'add-circle' },
];

export const categoriesSimplificationMigration = {
  /**
   * Simplifie la structure des catégories
   */
  async simplifyCategories(userId: string = 'default-user'): Promise<void> {
    const db = await getDatabase();
    
    try {
      console.log('🔄 [Migration] Début de la simplification des catégories...');

      // ✅ TRANSACTION : Encapsuler toutes les opérations
      await db.execAsync('BEGIN TRANSACTION');

      try {
        // 1. Vérifier si la table transactions existe et a des données
        let usedCategoryIds: string[] = [];
        try {
          const existingTransactions = await db.getAllAsync<any>(
            'SELECT DISTINCT category FROM transactions WHERE user_id = ?',
            [userId]
          );
          usedCategoryIds = existingTransactions.map((t) => t.category).filter(Boolean);
          console.log(`📊 ${usedCategoryIds.length} catégories utilisées dans les transactions`);
        } catch (err) {
          console.log('ℹ️ Aucune transaction existante ou table absente');
        }

        // 2. Supprimer toutes les anciennes catégories qui ne sont pas utilisées dans les transactions
        if (usedCategoryIds.length > 0) {
          const placeholders = usedCategoryIds.map(() => '?').join(',');
          await db.runAsync(
            `DELETE FROM categories WHERE user_id = ? AND id NOT IN (${placeholders})`,
            [userId, ...usedCategoryIds]
          );
          console.log('🗑️ Anciennes catégories non utilisées supprimées');
        } else {
          // Supprimer toutes les catégories si aucune transaction
          await db.runAsync(
            'DELETE FROM categories WHERE user_id = ?',
            [userId]
          );
          console.log('🗑️ Toutes les anciennes catégories supprimées');
        }

        // 3. Créer les nouvelles catégories principales simplifiées
        const createdAt = new Date().toISOString();
        
        for (const cat of SIMPLIFIED_MAIN_CATEGORIES) {
          await db.runAsync(
            `INSERT OR IGNORE INTO categories (id, user_id, name, type, color, icon, parent_id, level, sort_order, is_active, budget, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [cat.id, userId, cat.name, cat.type, cat.color, cat.icon, null, 0, 0, 1, 0, createdAt]
          );
          console.log(`✅ Catégorie principale créée: ${cat.name}`);

          // 4. Créer une sous-catégorie "Autres" pour chaque catégorie principale
          const subCatId = `${cat.id}_other`;
          await db.runAsync(
            `INSERT OR IGNORE INTO categories (id, user_id, name, type, color, icon, parent_id, level, sort_order, is_active, budget, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [subCatId, userId, 'Autres', cat.type, cat.color, 'ellipsis-horizontal', cat.id, 1, 0, 1, 0, createdAt]
          );
          console.log(`   └─ Sous-catégorie créée: Autres`);
        }

        // ✅ VALIDER LA TRANSACTION
        await db.execAsync('COMMIT');
        console.log('✅ [Migration] Simplification des catégories terminée avec succès');
      } catch (innerError) {
        // ✅ ROLLBACK EN CAS D'ERREUR
        await db.execAsync('ROLLBACK');
        throw innerError;
      }
    } catch (error) {
      console.error('❌ [Migration] Erreur lors de la simplification des catégories:', error);
      throw error;
    }
  },

  /**
   * Vérifie si la simplification a déjà été effectuée
   */
  async isSimplified(userId: string = 'default-user'): Promise<boolean> {
    const db = await getDatabase();
    
    try {
      // Vérifier si les catégories principales simplifiées existent
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM categories WHERE user_id = ? AND id IN (?, ?, ?, ?)',
        [userId, 'cat_food', 'cat_transport', 'cat_housing', 'cat_salary']
      );
      
      // Si au moins 4 catégories principales simplifiées existent, on considère que c'est simplifié
      return (result?.count || 0) >= 4;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de la simplification:', error);
      return false;
    }
  },

  /**
   * Obtenir les catégories principales simplifiées
   */
  getSimplifiedMainCategories(): SimplifiedCategory[] {
    return SIMPLIFIED_MAIN_CATEGORIES;
  },
};

export default categoriesSimplificationMigration;
