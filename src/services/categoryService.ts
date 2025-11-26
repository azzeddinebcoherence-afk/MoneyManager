// src/services/categoryService.ts - VERSION COMPLÈTE AVEC TOUTES LES CATÉGORIES
import { Category } from '../types';
import { getDatabase } from './database/sqlite';

// ✅ INTERFACES TYPÉES AVEC SOUS-CATÉGORIES
interface DatabaseCategory {
  id: string;
  user_id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
  parent_id: string | null;
  level: number;
  sort_order: number;
  is_active: number;
  budget: number;
  created_at: string;
}

interface CreateCategoryData {
  name: string;
  type: 'expense' | 'income';
  color: string;
  icon: string;
  parentId?: string | null;
  level?: number;
  sortOrder?: number;
  budget?: number;
  isActive?: boolean;
}

interface CategoryStats {
  totalCategories: number;
  expenseCategories: number;
  incomeCategories: number;
  categoriesByType: Record<string, number>;
  subcategoriesCount: number;
}

interface TableDiagnosis {
  exists: boolean;
  structure: any[];
  rowCount: number;
  sampleData: any[];
}

interface CategoryTree {
  category: Category;
  subcategories: Category[];
}

// ✅ SERVICE PRINCIPAL AVEC TOUTES LES CATÉGORIES
export const categoryService = {
  // ===== OPÉRATIONS CRUD =====

  // CREATE - Créer une catégorie (avec support sous-catégories)
  async createCategory(categoryData: CreateCategoryData, userId: string = 'default-user'): Promise<string> {
    const db = await getDatabase();
    
    try {
      await checkAndRepairCategoriesTable();

      const id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();
      
      const level = categoryData.parentId ? 1 : 0;
      const sortOrder = categoryData.sortOrder || 0;
      const isActive = categoryData.isActive !== false ? 1 : 0;
      const budget = categoryData.budget || 0;

      console.log('🔄 [categoryService] Creating category:', { 
        id, 
        name: categoryData.name, 
        type: categoryData.type,
        parentId: categoryData.parentId,
        level
      });

      await db.runAsync(
          `INSERT OR IGNORE INTO categories (id, user_id, name, type, color, icon, parent_id, level, sort_order, is_active, budget, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, 
          userId, 
          categoryData.name, 
          categoryData.type, 
          categoryData.color, 
          categoryData.icon,
          categoryData.parentId || null,
          level,
          sortOrder,
          isActive,
          budget,
          createdAt
        ]
      );
      
      console.log('✅ [categoryService] Category created successfully:', id);
      return id;
      
    } catch (error) {
      console.error('❌ [categoryService] Error in createCategory:', error);
      
      if (error instanceof Error && (
        error.message.includes('no such table') ||
        error.message.includes('no column named')
      )) {
        console.log('🛠️ [categoryService] Table issue detected, repairing...');
        await repairCategoriesTable();
        
        return await categoryService.createCategory(categoryData, userId);
      }
      
      throw new Error(`Impossible de créer la catégorie: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  },

  // READ - Récupérer toutes les catégories (avec hiérarchie)
  async getAllCategories(userId: string = 'default-user'): Promise<Category[]> {
    try {
      const db = await getDatabase();
      
      await checkAndRepairCategoriesTable();
      
      console.log('🔍 [categoryService] Fetching all categories...');
      
      const result = await db.getAllAsync(
          `SELECT * FROM categories WHERE user_id = ? ORDER BY level, sort_order, name`,
        [userId]
      ) as DatabaseCategory[];
      
      console.log('✅ [categoryService] Found', result.length, 'categories');
      
      const categories: Category[] = result.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type as 'expense' | 'income',
        color: item.color,
        icon: item.icon,
        parentId: item.parent_id || undefined,
        level: item.level || 0,
        sortOrder: item.sort_order || 0,
        isActive: item.is_active !== 0,
        budget: item.budget || 0,
        createdAt: item.created_at,
      }));
      
      return categories;
    } catch (error) {
      console.error('❌ [categoryService] Error in getAllCategories:', error);
      
      if (error instanceof Error && error.message.includes('no such table')) {
        await repairCategoriesTable();
        return [];
      }
      
      throw error;
    }
  },

  // ✅ NOUVELLE MÉTHODE : Obtenir l'arbre des catégories
  async getCategoryTree(userId: string = 'default-user'): Promise<CategoryTree[]> {
    try {
      const allCategories = await this.getAllCategories(userId);
      const mainCategories = allCategories.filter(cat => cat.level === 0);
      
      const categoryTree: CategoryTree[] = mainCategories.map(mainCategory => ({
        category: mainCategory,
        subcategories: allCategories.filter(cat => cat.parentId === mainCategory.id)
      }));
      
      console.log('🌳 [categoryService] Category tree built:', categoryTree.length, 'main categories');
      return categoryTree;
    } catch (error) {
      console.error('❌ [categoryService] Error building category tree:', error);
      return [];
    }
  },

  // READ - Récupérer les catégories principales (niveau 0)
  async getMainCategories(userId: string = 'default-user'): Promise<Category[]> {
    try {
      const db = await getDatabase();
      
      await checkAndRepairCategoriesTable();
      
      console.log('🔍 [categoryService] Fetching main categories...');
      
      const result = await db.getAllAsync(
          `SELECT * FROM categories WHERE user_id = ? AND level = 0 ORDER BY sort_order, name`,
        [userId]
      ) as DatabaseCategory[];
      
      const categories: Category[] = result.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type as 'expense' | 'income',
        color: item.color,
        icon: item.icon,
        parentId: item.parent_id || undefined,
        level: item.level || 0,
        sortOrder: item.sort_order || 0,
        isActive: item.is_active !== 0,
        budget: item.budget || 0,
        createdAt: item.created_at,
      }));
      
      console.log('✅ [categoryService] Found', categories.length, 'main categories');
      return categories;
    } catch (error) {
      console.error('❌ [categoryService] Error in getMainCategories:', error);
      
      if (error instanceof Error && error.message.includes('no such table')) {
        await repairCategoriesTable();
        return [];
      }
      
      throw error;
    }
  },

  // READ - Récupérer les sous-catégories d'une catégorie parent
  async getSubcategories(parentId: string, userId: string = 'default-user'): Promise<Category[]> {
    try {
      const db = await getDatabase();
      
      await checkAndRepairCategoriesTable();
      
      console.log('🔍 [categoryService] Fetching subcategories for parent:', parentId);
      
      const result = await db.getAllAsync(
          `SELECT * FROM categories WHERE user_id = ? AND parent_id = ? ORDER BY sort_order, name`,
        [userId, parentId]
      ) as DatabaseCategory[];
      
      const categories: Category[] = result.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type as 'expense' | 'income',
        color: item.color,
        icon: item.icon,
        parentId: item.parent_id || undefined,
        level: item.level || 0,
        sortOrder: item.sort_order || 0,
        isActive: item.is_active !== 0,
        budget: item.budget || 0,
        createdAt: item.created_at,
      }));
      
      console.log('✅ [categoryService] Found', categories.length, 'subcategories');
      return categories;
    } catch (error) {
      console.error('❌ [categoryService] Error in getSubcategories:', error);
      
      if (error instanceof Error && error.message.includes('no such table')) {
        await repairCategoriesTable();
        return [];
      }
      
      throw error;
    }
  },

  // READ - Récupérer une catégorie par ID
  async getCategoryById(id: string, userId: string = 'default-user'): Promise<Category | null> {
    try {
      const db = await getDatabase();
      
      await checkAndRepairCategoriesTable();
      
      console.log('🔍 [categoryService] Fetching category by ID:', id);
      
      const result = await db.getFirstAsync(
        `SELECT * FROM categories WHERE id = ? AND user_id = ?`,
        [id, userId]
      ) as DatabaseCategory | null;
      
      if (result) {
        const category: Category = {
          id: result.id,
          name: result.name,
          type: result.type as 'expense' | 'income',
          color: result.color,
          icon: result.icon,
          parentId: result.parent_id || undefined,
          level: result.level || 0,
          sortOrder: result.sort_order || 0,
          isActive: result.is_active !== 0,
          budget: result.budget || 0,
          createdAt: result.created_at,
        };
        console.log('✅ [categoryService] Category found:', category.name);
        return category;
      }
      
      console.log('❌ [categoryService] Category not found for ID:', id);
      return null;
    } catch (error) {
      console.error('❌ [categoryService] Error in getCategoryById:', error);
      
      if (error instanceof Error && error.message.includes('no such table')) {
        await repairCategoriesTable();
        return null;
      }
      
      throw error;
    }
  },

  // READ - Récupérer les catégories par type
  async getCategoriesByType(type: 'expense' | 'income', userId: string = 'default-user'): Promise<Category[]> {
    try {
      const db = await getDatabase();
      
      await checkAndRepairCategoriesTable();
      
      console.log('🔍 [categoryService] Fetching categories by type:', type);
      
      const result = await db.getAllAsync(
          `SELECT * FROM categories WHERE type = ? AND user_id = ? ORDER BY level, sort_order, name`,
        [type, userId]
      ) as DatabaseCategory[];
      
      console.log('✅ [categoryService] Found', result.length, 'categories for type:', type);
      
      const categories: Category[] = result.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type as 'expense' | 'income',
        color: item.color,
        icon: item.icon,
        parentId: item.parent_id || undefined,
        level: item.level || 0,
        sortOrder: item.sort_order || 0,
        isActive: item.is_active !== 0,
        budget: item.budget || 0,
        createdAt: item.created_at,
      }));
      
      return categories;
    } catch (error) {
      console.error('❌ [categoryService] Error in getCategoriesByType:', error);
      
      if (error instanceof Error && error.message.includes('no such table')) {
        await repairCategoriesTable();
        return [];
      }
      
      throw error;
    }
  },

  // UPDATE - Mettre à jour une catégorie
  async updateCategory(
    id: string, 
    categoryData: Partial<Omit<Category, 'id' | 'createdAt'>>, 
    userId: string = 'default-user'
  ): Promise<void> {
    const db = await getDatabase();
    
    await checkAndRepairCategoriesTable();
    
    try {
      console.log('🔄 [categoryService] Updating category:', id);
      
      const updates: string[] = [];
      const values: any[] = [];
      
      if (categoryData.name !== undefined) {
        updates.push('name = ?');
        values.push(categoryData.name);
      }
      if (categoryData.type !== undefined) {
        updates.push('type = ?');
        values.push(categoryData.type);
      }
      if (categoryData.color !== undefined) {
        updates.push('color = ?');
        values.push(categoryData.color);
      }
      if (categoryData.icon !== undefined) {
        updates.push('icon = ?');
        values.push(categoryData.icon);
      }
      if (categoryData.parentId !== undefined) {
        updates.push('parent_id = ?');
        values.push(categoryData.parentId);
      }
      if (categoryData.level !== undefined) {
        updates.push('level = ?');
        values.push(categoryData.level);
      }
      if (categoryData.sortOrder !== undefined) {
        updates.push('sort_order = ?');
        values.push(categoryData.sortOrder);
      }
      if (categoryData.isActive !== undefined) {
        updates.push('is_active = ?');
        values.push(categoryData.isActive ? 1 : 0);
      }
      if (categoryData.budget !== undefined) {
        updates.push('budget = ?');
        values.push(categoryData.budget);
      }
      
      if (updates.length === 0) {
        console.log('ℹ️ [categoryService] No updates provided for category:', id);
        return;
      }
      
      values.push(id, userId);
      
      await db.runAsync(
        `UPDATE categories SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        values
      );
      
      console.log('✅ [categoryService] Category updated successfully');
    } catch (error) {
      console.error('❌ [categoryService] Error in updateCategory:', error);
      throw error;
    }
  },

  // DELETE - Supprimer une catégorie
  async deleteCategory(id: string, userId: string = 'default-user'): Promise<void> {
    const db = await getDatabase();
    
    await checkAndRepairCategoriesTable();
    
    try {
      console.log('🗑️ [categoryService] Deleting category:', id);
      
      // Vérifier si la catégorie a des sous-catégories
      const subcategories = await this.getSubcategories(id, userId);
      if (subcategories.length > 0) {
        throw new Error('Impossible de supprimer une catégorie qui a des sous-catégories');
      }
      
      await db.runAsync(
        `DELETE FROM categories WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      
      console.log('✅ [categoryService] Category deleted successfully');
    } catch (error) {
      console.error('❌ [categoryService] Error in deleteCategory:', error);
      throw error;
    }
  },

  // ===== RECHERCHE ET FILTRES =====

  // Rechercher des catégories par nom
  async searchCategories(searchTerm: string, userId: string = 'default-user'): Promise<Category[]> {
    try {
      const db = await getDatabase();
      
      await checkAndRepairCategoriesTable();
      
      console.log('🔍 [categoryService] Searching categories for:', searchTerm);
      
      const result = await db.getAllAsync(
        `SELECT * FROM categories WHERE name LIKE ? AND user_id = ? ORDER BY level, sort_order, name`,
        [`%${searchTerm}%`, userId]
      ) as DatabaseCategory[];
      
      const categories: Category[] = result.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type as 'expense' | 'income',
        color: item.color,
        icon: item.icon,
        parentId: item.parent_id || undefined,
        level: item.level || 0,
        sortOrder: item.sort_order || 0,
        isActive: item.is_active !== 0,
        budget: item.budget || 0,
        createdAt: item.created_at,
      }));
      
      console.log('✅ [categoryService] Search results:', categories.length, 'categories found');
      return categories;
    } catch (error) {
      console.error('❌ [categoryService] Error in searchCategories:', error);
      
      if (error instanceof Error && error.message.includes('no such table')) {
        await repairCategoriesTable();
        return [];
      }
      
      throw error;
    }
  },

  // ===== UTILITAIRES AVEC SOUS-CATÉGORIES =====

  // Vérifier si une catégorie est utilisée dans des transactions
  async isCategoryUsed(categoryId: string, userId: string = 'default-user'): Promise<boolean> {
    try {
      const db = await getDatabase();
      
      await checkAndRepairCategoriesTable();
      
      const result = await db.getFirstAsync(
        `SELECT COUNT(*) as count FROM transactions WHERE category = ? AND user_id = ?`,
        [categoryId, userId]
      ) as { count: number } | null;
      
      const isUsed = result?.count ? result.count > 0 : false;
      console.log(`🔍 [categoryService] Category ${categoryId} is used:`, isUsed);
      
      return isUsed;
    } catch (error) {
      console.error('❌ [categoryService] Error in isCategoryUsed:', error);
      
      if (error instanceof Error && error.message.includes('no such table')) {
        await repairCategoriesTable();
        return false;
      }
      
      throw error;
    }
  },

  // Obtenir les statistiques des catégories
  async getCategoryStats(userId: string = 'default-user'): Promise<CategoryStats> {
    try {
      const db = await getDatabase();
      
      await checkAndRepairCategoriesTable();
      
      // Total des catégories
      const countResult = await db.getFirstAsync(
        `SELECT COUNT(*) as count FROM categories WHERE user_id = ?`,
        [userId]
      ) as { count: number } | null;
      const totalCategories = countResult?.count || 0;
      
      // Sous-catégories
      const subcategoriesResult = await db.getFirstAsync(
        `SELECT COUNT(*) as count FROM categories WHERE user_id = ? AND level > 0`,
        [userId]
      ) as { count: number } | null;
      const subcategoriesCount = subcategoriesResult?.count || 0;
      
      // Catégories par type
      const typeResult = await db.getAllAsync(
        `SELECT type, COUNT(*) as count FROM categories WHERE user_id = ? GROUP BY type`,
        [userId]
      ) as { type: string; count: number }[];
      
      const categoriesByType: Record<string, number> = {};
      let expenseCategories = 0;
      let incomeCategories = 0;
      
      typeResult.forEach(item => {
        categoriesByType[item.type] = item.count;
        if (item.type === 'expense') expenseCategories = item.count;
        if (item.type === 'income') incomeCategories = item.count;
      });
      
      console.log('📊 [categoryService] Category stats:', { 
        totalCategories, 
        expenseCategories, 
        incomeCategories,
        subcategoriesCount,
        categoriesByType 
      });
      
      return {
        totalCategories,
        expenseCategories,
        incomeCategories,
        categoriesByType,
        subcategoriesCount
      };
    } catch (error) {
      console.error('❌ [categoryService] Error in getCategoryStats:', error);
      
      if (error instanceof Error && error.message.includes('no such table')) {
        await repairCategoriesTable();
        return {
          totalCategories: 0,
          expenseCategories: 0,
          incomeCategories: 0,
          categoriesByType: {},
          subcategoriesCount: 0
        };
      }
      
      throw error;
    }
  },

  // ✅ INITIALISATION AVEC TOUTES LES CATÉGORIES DÉTAILLÉES
  async initializeDefaultCategories(userId: string = 'default-user'): Promise<void> {
    try {
      const db = await getDatabase();
      
      await checkAndRepairCategoriesTable();
      
      // Vérifier si des catégories existent déjà pour cet utilisateur
      const existingCategories = await db.getAllAsync(
        `SELECT * FROM categories WHERE user_id = ?`,
        [userId]
      ) as DatabaseCategory[];
      
      if (existingCategories.length === 0) {
        console.log('🔄 [categoryService] Initializing ALL categories with complete hierarchy...');
        
        interface DefaultCategory {
          id: string;
          name: string;
          type: 'expense' | 'income';
          color: string;
          icon: string;
          parentId?: string | null;
          level: number;
          sortOrder: number;
        }

        // ✅ CATÉGORIES PRINCIPALES DÉPENSES
        const mainExpenseCategories: DefaultCategory[] = [
          { id: 'cat_main_housing', name: '🏠 Logement', type: 'expense', color: '#45B7D1', icon: 'home', level: 0, sortOrder: 1 },
          { id: 'cat_main_food', name: '🍴 Nourriture & Courses', type: 'expense', color: '#FF6B6B', icon: 'restaurant', level: 0, sortOrder: 2 },
          { id: 'cat_main_transport', name: '🚗 Transport', type: 'expense', color: '#4ECDC4', icon: 'car', level: 0, sortOrder: 3 },
          { id: 'cat_main_health', name: '🧍‍♂️ Santé & Bien-être', type: 'expense', color: '#FFEAA7', icon: 'medical', level: 0, sortOrder: 4 },
          { id: 'cat_main_family', name: '👨‍👩‍👦 Famille & Enfants', type: 'expense', color: '#A78BFA', icon: 'people', level: 0, sortOrder: 5 },
          { id: 'cat_main_shopping', name: '🛍️ Achats personnels', type: 'expense', color: '#DDA0DD', icon: 'cart', level: 0, sortOrder: 6 },
          { id: 'cat_main_entertainment', name: '🎉 Loisirs & Sorties', type: 'expense', color: '#96CEB4', icon: 'game-controller', level: 0, sortOrder: 7 },
          { id: 'cat_main_work', name: '💼 Travail / Études', type: 'expense', color: '#F39C12', icon: 'briefcase', level: 0, sortOrder: 8 },
          { id: 'cat_main_finances', name: '💳 Finances & Obligations', type: 'expense', color: '#E74C3C', icon: 'card', level: 0, sortOrder: 9 },
          { id: 'cat_main_religion', name: '🕌 Religion / Spiritualité', type: 'expense', color: '#16A085', icon: 'star', level: 0, sortOrder: 10 },
          { id: 'cat_main_savings', name: '💾 Épargne & Investissements', type: 'expense', color: '#27AE60', icon: 'trending-up', level: 0, sortOrder: 11 },
          { id: 'cat_main_other', name: '⚙️ Autres', type: 'expense', color: '#95A5A6', icon: 'ellipsis-horizontal', level: 0, sortOrder: 12 },
        ];

        // ✅ CATÉGORIES PRINCIPALES REVENUS
        const mainIncomeCategories: DefaultCategory[] = [
          { id: 'cat_main_primary_income', name: '👨‍💼 Salaire', type: 'income', color: '#52C41A', icon: 'cash', level: 0, sortOrder: 13 },
          { id: 'cat_main_secondary_income', name: '💻 Revenus secondaires', type: 'income', color: '#FAAD14', icon: 'laptop', level: 0, sortOrder: 14 },
          { id: 'cat_main_financial_income', name: '💵 Revenus financiers', type: 'income', color: '#20B2AA', icon: 'trending-up', level: 0, sortOrder: 15 },
          { id: 'cat_main_other_income', name: '🎁 Autres revenus', type: 'income', color: '#BB8FCE', icon: 'gift', level: 0, sortOrder: 16 },
          { id: 'cat_main_spiritual_income', name: '🕌 Revenus spirituels', type: 'income', color: '#16A085', icon: 'star', level: 0, sortOrder: 17 },
        ];

        // ✅ SOUS-CATÉGORIES DÉTAILLÉES
        const subcategories: DefaultCategory[] = [
          // 🏠 SOUS-CATÉGORIES LOGEMENT
          { id: 'cat_sub_rent', name: 'Loyer / Crédit immobilier', type: 'expense', color: '#45B7D1', icon: 'home', parentId: 'cat_main_housing', level: 1, sortOrder: 1 },
          { id: 'cat_sub_charges', name: 'Charges de copropriété', type: 'expense', color: '#45B7D1', icon: 'document', parentId: 'cat_main_housing', level: 1, sortOrder: 2 },
          { id: 'cat_sub_electricity', name: 'Électricité', type: 'expense', color: '#45B7D1', icon: 'flash', parentId: 'cat_main_housing', level: 1, sortOrder: 3 },
          { id: 'cat_sub_water', name: 'Eau', type: 'expense', color: '#45B7D1', icon: 'water', parentId: 'cat_main_housing', level: 1, sortOrder: 4 },
          { id: 'cat_sub_gas', name: 'Gaz', type: 'expense', color: '#45B7D1', icon: 'flame', parentId: 'cat_main_housing', level: 1, sortOrder: 5 },
          { id: 'cat_sub_internet', name: 'Internet / Wi-Fi', type: 'expense', color: '#45B7D1', icon: 'wifi', parentId: 'cat_main_housing', level: 1, sortOrder: 6 },
          { id: 'cat_sub_phone', name: 'Téléphone', type: 'expense', color: '#45B7D1', icon: 'call', parentId: 'cat_main_housing', level: 1, sortOrder: 7 },
          { id: 'cat_sub_maintenance', name: 'Entretien maison / Réparations', type: 'expense', color: '#45B7D1', icon: 'build', parentId: 'cat_main_housing', level: 1, sortOrder: 8 },
          { id: 'cat_sub_housing_insurance', name: 'Assurance habitation', type: 'expense', color: '#45B7D1', icon: 'shield', parentId: 'cat_main_housing', level: 1, sortOrder: 9 },
          { id: 'cat_sub_furniture', name: 'Meubles / Décoration', type: 'expense', color: '#45B7D1', icon: 'bed', parentId: 'cat_main_housing', level: 1, sortOrder: 10 },
          { id: 'cat_sub_cleaning', name: 'Produits ménagers', type: 'expense', color: '#45B7D1', icon: 'sparkles', parentId: 'cat_main_housing', level: 1, sortOrder: 11 },

          // 🍴 SOUS-CATÉGORIES NOURRITURE
          { id: 'cat_sub_groceries', name: 'Super marché / Épicerie', type: 'expense', color: '#FF6B6B', icon: 'basket', parentId: 'cat_main_food', level: 1, sortOrder: 1 },
          { id: 'cat_sub_butcher', name: 'Boucherie / Poissonnerie', type: 'expense', color: '#FF6B6B', icon: 'restaurant', parentId: 'cat_main_food', level: 1, sortOrder: 2 },
          { id: 'cat_sub_fruits', name: 'Fruits & légumes', type: 'expense', color: '#FF6B6B', icon: 'nutrition', parentId: 'cat_main_food', level: 1, sortOrder: 3 },
          { id: 'cat_sub_basics', name: 'Produits de base (huile, farine, sucre…)', type: 'expense', color: '#FF6B6B', icon: 'cube', parentId: 'cat_main_food', level: 1, sortOrder: 4 },
          { id: 'cat_sub_takeaway', name: 'Repas à emporter / Livraison', type: 'expense', color: '#FF6B6B', icon: 'fast-food', parentId: 'cat_main_food', level: 1, sortOrder: 5 },
          { id: 'cat_sub_restaurants', name: 'Restaurants / Cafés', type: 'expense', color: '#FF6B6B', icon: 'cafe', parentId: 'cat_main_food', level: 1, sortOrder: 6 },
          { id: 'cat_sub_drinks', name: 'Eau / Boissons', type: 'expense', color: '#FF6B6B', icon: 'water', parentId: 'cat_main_food', level: 1, sortOrder: 7 },

          // 🚗 SOUS-CATÉGORIES TRANSPORT
          { id: 'cat_sub_fuel', name: 'Carburant', type: 'expense', color: '#4ECDC4', icon: 'car', parentId: 'cat_main_transport', level: 1, sortOrder: 1 },
          { id: 'cat_sub_public_transport', name: 'Transport en commun', type: 'expense', color: '#4ECDC4', icon: 'bus', parentId: 'cat_main_transport', level: 1, sortOrder: 2 },
          { id: 'cat_sub_taxi', name: 'Taxi / VTC', type: 'expense', color: '#4ECDC4', icon: 'car', parentId: 'cat_main_transport', level: 1, sortOrder: 3 },
          { id: 'cat_sub_car_insurance', name: 'Assurance auto', type: 'expense', color: '#4ECDC4', icon: 'shield', parentId: 'cat_main_transport', level: 1, sortOrder: 4 },
          { id: 'cat_sub_car_repair', name: 'Réparation / Entretien', type: 'expense', color: '#4ECDC4', icon: 'build', parentId: 'cat_main_transport', level: 1, sortOrder: 5 },
          { id: 'cat_sub_parking', name: 'Stationnement / Péage', type: 'expense', color: '#4ECDC4', icon: 'location', parentId: 'cat_main_transport', level: 1, sortOrder: 6 },
          { id: 'cat_sub_vehicle_purchase', name: 'Achat de véhicule', type: 'expense', color: '#4ECDC4', icon: 'car-sport', parentId: 'cat_main_transport', level: 1, sortOrder: 7 },
          { id: 'cat_sub_technical_check', name: 'Visite technique', type: 'expense', color: '#4ECDC4', icon: 'document', parentId: 'cat_main_transport', level: 1, sortOrder: 8 },
          { id: 'cat_sub_sticker', name: 'Vignette', type: 'expense', color: '#4ECDC4', icon: 'pricetag', parentId: 'cat_main_transport', level: 1, sortOrder: 9 },
          { id: 'cat_sub_car_wash', name: 'Lavage voiture', type: 'expense', color: '#4ECDC4', icon: 'water', parentId: 'cat_main_transport', level: 1, sortOrder: 10 },

          // 🧍‍♂️ SOUS-CATÉGORIES SANTÉ
          { id: 'cat_sub_doctor', name: 'Médecin / Pharmacie', type: 'expense', color: '#FFEAA7', icon: 'medical', parentId: 'cat_main_health', level: 1, sortOrder: 1 },
          { id: 'cat_sub_lab', name: 'Analyses / Laboratoire', type: 'expense', color: '#FFEAA7', icon: 'flask', parentId: 'cat_main_health', level: 1, sortOrder: 2 },
          { id: 'cat_sub_hospital', name: 'Hôpital / Clinique', type: 'expense', color: '#FFEAA7', icon: 'medical', parentId: 'cat_main_health', level: 1, sortOrder: 3 },
          { id: 'cat_sub_glasses_dental', name: 'Lunettes / Dentiste', type: 'expense', color: '#FFEAA7', icon: 'eye', parentId: 'cat_main_health', level: 1, sortOrder: 4 },
          { id: 'cat_sub_health_insurance', name: 'Assurance santé', type: 'expense', color: '#FFEAA7', icon: 'shield', parentId: 'cat_main_health', level: 1, sortOrder: 5 },
          { id: 'cat_sub_health_products', name: 'Produits de santé', type: 'expense', color: '#FFEAA7', icon: 'fitness', parentId: 'cat_main_health', level: 1, sortOrder: 6 },
          { id: 'cat_sub_gym', name: 'Salle de sport / Coach', type: 'expense', color: '#FFEAA7', icon: 'barbell', parentId: 'cat_main_health', level: 1, sortOrder: 7 },
          { id: 'cat_sub_personal_care', name: 'Soins personnels (coiffeur, esthétique, etc.)', type: 'expense', color: '#FFEAA7', icon: 'cut', parentId: 'cat_main_health', level: 1, sortOrder: 8 },

          // 👨‍👩‍👦 SOUS-CATÉGORIES FAMILLE
          { id: 'cat_sub_childcare', name: 'Garde d\'enfant', type: 'expense', color: '#A78BFA', icon: 'people', parentId: 'cat_main_family', level: 1, sortOrder: 1 },
          { id: 'cat_sub_school', name: 'École / Crèche', type: 'expense', color: '#A78BFA', icon: 'school', parentId: 'cat_main_family', level: 1, sortOrder: 2 },
          { id: 'cat_sub_school_supplies', name: 'Fournitures scolaires', type: 'expense', color: '#A78BFA', icon: 'pencil', parentId: 'cat_main_family', level: 1, sortOrder: 3 },
          { id: 'cat_sub_kids_activities', name: 'Activités / Loisirs enfants', type: 'expense', color: '#A78BFA', icon: 'game-controller', parentId: 'cat_main_family', level: 1, sortOrder: 4 },
          { id: 'cat_sub_kids_clothes', name: 'Vêtements enfants', type: 'expense', color: '#A78BFA', icon: 'shirt', parentId: 'cat_main_family', level: 1, sortOrder: 5 },
          { id: 'cat_sub_gifts', name: 'Cadeaux / Anniversaire', type: 'expense', color: '#A78BFA', icon: 'gift', parentId: 'cat_main_family', level: 1, sortOrder: 6 },
          { id: 'cat_sub_kids_savings', name: 'Épargne pour enfants', type: 'expense', color: '#A78BFA', icon: 'trending-up', parentId: 'cat_main_family', level: 1, sortOrder: 7 },

          // 🛍️ SOUS-CATÉGORIES ACHATS PERSONNELS
          { id: 'cat_sub_clothes', name: 'Vêtements / Chaussures', type: 'expense', color: '#DDA0DD', icon: 'shirt', parentId: 'cat_main_shopping', level: 1, sortOrder: 1 },
          { id: 'cat_sub_accessories', name: 'Accessoires / Bijoux', type: 'expense', color: '#DDA0DD', icon: 'diamond', parentId: 'cat_main_shopping', level: 1, sortOrder: 2 },
          { id: 'cat_sub_beauty', name: 'Produits de beauté', type: 'expense', color: '#DDA0DD', icon: 'sparkles', parentId: 'cat_main_shopping', level: 1, sortOrder: 3 },
          { id: 'cat_sub_tech', name: 'Téléphone / Accessoires tech', type: 'expense', color: '#DDA0DD', icon: 'phone-portrait', parentId: 'cat_main_shopping', level: 1, sortOrder: 4 },
          { id: 'cat_sub_electronics', name: 'Électronique', type: 'expense', color: '#DDA0DD', icon: 'tv', parentId: 'cat_main_shopping', level: 1, sortOrder: 5 },
          { id: 'cat_sub_books_games', name: 'Livres / Jeux', type: 'expense', color: '#DDA0DD', icon: 'book', parentId: 'cat_main_shopping', level: 1, sortOrder: 6 },
          { id: 'cat_sub_other_shopping', name: 'Autres achats personnels', type: 'expense', color: '#DDA0DD', icon: 'cart', parentId: 'cat_main_shopping', level: 1, sortOrder: 7 },

          // 🎉 SOUS-CATÉGORIES LOISIRS
          { id: 'cat_sub_outings', name: 'Sorties / Cinéma / Café', type: 'expense', color: '#96CEB4', icon: 'film', parentId: 'cat_main_entertainment', level: 1, sortOrder: 1 },
          { id: 'cat_sub_travel', name: 'Voyages / Vacances', type: 'expense', color: '#96CEB4', icon: 'airplane', parentId: 'cat_main_entertainment', level: 1, sortOrder: 2 },
          { id: 'cat_sub_excursions', name: 'Excursions', type: 'expense', color: '#96CEB4', icon: 'map', parentId: 'cat_main_entertainment', level: 1, sortOrder: 3 },
          { id: 'cat_sub_subscriptions', name: 'Abonnements Netflix, Spotify, etc.', type: 'expense', color: '#96CEB4', icon: 'play-circle', parentId: 'cat_main_entertainment', level: 1, sortOrder: 4 },
          { id: 'cat_sub_hobbies', name: 'Hobbies / Sport', type: 'expense', color: '#96CEB4', icon: 'game-controller', parentId: 'cat_main_entertainment', level: 1, sortOrder: 5 },
          { id: 'cat_sub_pets', name: 'Animaux de compagnie', type: 'expense', color: '#96CEB4', icon: 'paw', parentId: 'cat_main_entertainment', level: 1, sortOrder: 6 },

          // 💼 SOUS-CATÉGORIES TRAVAIL
          { id: 'cat_sub_training', name: 'Formation / Cours', type: 'expense', color: '#F39C12', icon: 'school', parentId: 'cat_main_work', level: 1, sortOrder: 1 },
          { id: 'cat_sub_work_supplies', name: 'Matériel de travail', type: 'expense', color: '#F39C12', icon: 'briefcase', parentId: 'cat_main_work', level: 1, sortOrder: 2 },
          { id: 'cat_sub_work_transport', name: 'Transport professionnel', type: 'expense', color: '#F39C12', icon: 'car', parentId: 'cat_main_work', level: 1, sortOrder: 3 },
          { id: 'cat_sub_professional_taxes', name: 'Cotisations / Impôts professionnels', type: 'expense', color: '#F39C12', icon: 'document', parentId: 'cat_main_work', level: 1, sortOrder: 4 },
          { id: 'cat_sub_software', name: 'Outils logiciels / Abonnements', type: 'expense', color: '#F39C12', icon: 'desktop', parentId: 'cat_main_work', level: 1, sortOrder: 5 },
          { id: 'cat_sub_coworking', name: 'Coworking / Bureau', type: 'expense', color: '#F39C12', icon: 'business', parentId: 'cat_main_work', level: 1, sortOrder: 6 },

          // 💳 SOUS-CATÉGORIES FINANCES
          { id: 'cat_sub_taxes', name: 'Impôts / Taxes', type: 'expense', color: '#E74C3C', icon: 'document', parentId: 'cat_main_finances', level: 1, sortOrder: 1 },
          { id: 'cat_sub_insurances', name: 'Assurances (auto, vie, habitation, etc.)', type: 'expense', color: '#E74C3C', icon: 'shield', parentId: 'cat_main_finances', level: 1, sortOrder: 2 },
          { id: 'cat_sub_credits', name: 'Crédits / Remboursements', type: 'expense', color: '#E74C3C', icon: 'card', parentId: 'cat_main_finances', level: 1, sortOrder: 3 },
          { id: 'cat_sub_bank_fees', name: 'Frais bancaires', type: 'expense', color: '#E74C3C', icon: 'card', parentId: 'cat_main_finances', level: 1, sortOrder: 4 },
          { id: 'cat_sub_interests', name: 'Intérêts', type: 'expense', color: '#E74C3C', icon: 'trending-up', parentId: 'cat_main_finances', level: 1, sortOrder: 5 },
          { id: 'cat_sub_charity', name: 'Sadaqa / Don / Zakat', type: 'expense', color: '#E74C3C', icon: 'heart', parentId: 'cat_main_finances', level: 1, sortOrder: 6 },
          { id: 'cat_sub_associations', name: 'Cotisations / Associations', type: 'expense', color: '#E74C3C', icon: 'people', parentId: 'cat_main_finances', level: 1, sortOrder: 7 },
          { id: 'cat_sub_other_financial', name: 'Autres obligations financières', type: 'expense', color: '#E74C3C', icon: 'card', parentId: 'cat_main_finances', level: 1, sortOrder: 8 },

          // 🕌 SOUS-CATÉGORIES RELIGION
          { id: 'cat_sub_mosque', name: 'Mosquée / Sadaqa / Zakat', type: 'expense', color: '#16A085', icon: 'star', parentId: 'cat_main_religion', level: 1, sortOrder: 1 },
          { id: 'cat_sub_hajj', name: 'Hajj / Omra', type: 'expense', color: '#16A085', icon: 'airplane', parentId: 'cat_main_religion', level: 1, sortOrder: 2 },
          { id: 'cat_sub_eid_ramadan', name: 'Aïd / Ramadan (achats, cadeaux, viande, etc.)', type: 'expense', color: '#16A085', icon: 'moon', parentId: 'cat_main_religion', level: 1, sortOrder: 3 },
          { id: 'cat_sub_religious_books', name: 'Livres / Cours religieux', type: 'expense', color: '#16A085', icon: 'book', parentId: 'cat_main_religion', level: 1, sortOrder: 4 },

          // 💾 SOUS-CATÉGORIES ÉPARGNE
          { id: 'cat_sub_monthly_savings', name: 'Épargne mensuelle', type: 'expense', color: '#27AE60', icon: 'trending-up', parentId: 'cat_main_savings', level: 1, sortOrder: 1 },
          { id: 'cat_sub_emergency_savings', name: 'Épargne d\'urgence', type: 'expense', color: '#27AE60', icon: 'shield', parentId: 'cat_main_savings', level: 1, sortOrder: 2 },
          { id: 'cat_sub_car_house_savings', name: 'Épargne voiture / maison', type: 'expense', color: '#27AE60', icon: 'home', parentId: 'cat_main_savings', level: 1, sortOrder: 3 },
          { id: 'cat_sub_kids_savings', name: 'Épargne enfant', type: 'expense', color: '#27AE60', icon: 'people', parentId: 'cat_main_savings', level: 1, sortOrder: 4 },
          { id: 'cat_sub_crypto', name: 'Crypto / Bourse / Placements', type: 'expense', color: '#27AE60', icon: 'trending-up', parentId: 'cat_main_savings', level: 1, sortOrder: 5 },
          { id: 'cat_sub_retirement', name: 'Fonds retraite', type: 'expense', color: '#27AE60', icon: 'person', parentId: 'cat_main_savings', level: 1, sortOrder: 6 },

          // ⚙️ SOUS-CATÉGORIES AUTRES
          { id: 'cat_sub_gifts_other', name: 'Cadeaux / Fêtes', type: 'expense', color: '#95A5A6', icon: 'gift', parentId: 'cat_main_other', level: 1, sortOrder: 1 },
          { id: 'cat_sub_unexpected', name: 'Imprévus / Urgences', type: 'expense', color: '#95A5A6', icon: 'warning', parentId: 'cat_main_other', level: 1, sortOrder: 2 },
          { id: 'cat_sub_other_expenses', name: 'Autres dépenses diverses', type: 'expense', color: '#95A5A6', icon: 'ellipsis-horizontal', parentId: 'cat_main_other', level: 1, sortOrder: 3 },

          // 👨‍💼 SOUS-CATÉGORIES REVENUS PRINCIPAUX
          { id: 'cat_sub_salary', name: 'Salaire', type: 'income', color: '#52C41A', icon: 'cash', parentId: 'cat_main_primary_income', level: 1, sortOrder: 1 },
          { id: 'cat_sub_bonus', name: 'Prime / Bonus', type: 'income', color: '#52C41A', icon: 'trophy', parentId: 'cat_main_primary_income', level: 1, sortOrder: 2 },
          { id: 'cat_sub_allowance', name: 'Indemnité / Allocation', type: 'income', color: '#52C41A', icon: 'document', parentId: 'cat_main_primary_income', level: 1, sortOrder: 3 },
          { id: 'cat_sub_pension', name: 'Pension / Retraite', type: 'income', color: '#52C41A', icon: 'person', parentId: 'cat_main_primary_income', level: 1, sortOrder: 4 },

          // 💻 SOUS-CATÉGORIES REVENUS SECONDAIRES
          { id: 'cat_sub_freelance', name: 'Freelance / Auto-entrepreneur', type: 'income', color: '#FAAD14', icon: 'laptop', parentId: 'cat_main_secondary_income', level: 1, sortOrder: 1 },
          { id: 'cat_sub_sales', name: 'Vente de produits', type: 'income', color: '#FAAD14', icon: 'cart', parentId: 'cat_main_secondary_income', level: 1, sortOrder: 2 },
          { id: 'cat_sub_services', name: 'Prestation de service', type: 'income', color: '#FAAD14', icon: 'construct', parentId: 'cat_main_secondary_income', level: 1, sortOrder: 3 },
          { id: 'cat_sub_rental', name: 'Location (appartement, voiture, matériel)', type: 'income', color: '#FAAD14', icon: 'home', parentId: 'cat_main_secondary_income', level: 1, sortOrder: 4 },
          { id: 'cat_sub_commissions', name: 'Commissions / Affiliations', type: 'income', color: '#FAAD14', icon: 'people', parentId: 'cat_main_secondary_income', level: 1, sortOrder: 5 },
          { id: 'cat_sub_tips', name: 'Pourboires', type: 'income', color: '#FAAD14', icon: 'cash', parentId: 'cat_main_secondary_income', level: 1, sortOrder: 6 },

          // 💵 SOUS-CATÉGORIES REVENUS FINANCIERS
          { id: 'cat_sub_bank_interest', name: 'Intérêts bancaires', type: 'income', color: '#20B2AA', icon: 'trending-up', parentId: 'cat_main_financial_income', level: 1, sortOrder: 1 },
          { id: 'cat_sub_dividends', name: 'Dividendes', type: 'income', color: '#20B2AA', icon: 'trending-up', parentId: 'cat_main_financial_income', level: 1, sortOrder: 2 },
          { id: 'cat_sub_investment_gains', name: 'Gains d\'investissement', type: 'income', color: '#20B2AA', icon: 'trending-up', parentId: 'cat_main_financial_income', level: 1, sortOrder: 3 },
          { id: 'cat_sub_crypto_income', name: 'Revenus crypto', type: 'income', color: '#20B2AA', icon: 'logo-bitcoin', parentId: 'cat_main_financial_income', level: 1, sortOrder: 4 },

          // 🎁 SOUS-CATÉGORIES AUTRES REVENUS
          { id: 'cat_sub_gifts_received', name: 'Cadeaux reçus', type: 'income', color: '#BB8FCE', icon: 'gift', parentId: 'cat_main_other_income', level: 1, sortOrder: 1 },
          { id: 'cat_sub_refunds', name: 'Remboursement', type: 'income', color: '#BB8FCE', icon: 'refresh', parentId: 'cat_main_other_income', level: 1, sortOrder: 2 },
          { id: 'cat_sub_inheritance', name: 'Héritage / Don', type: 'income', color: '#BB8FCE', icon: 'heart', parentId: 'cat_main_other_income', level: 1, sortOrder: 3 },
          { id: 'cat_sub_family_help', name: 'Aide familiale', type: 'income', color: '#BB8FCE', icon: 'people', parentId: 'cat_main_other_income', level: 1, sortOrder: 4 },
          { id: 'cat_sub_cashback', name: 'Cashback / Réductions', type: 'income', color: '#BB8FCE', icon: 'pricetag', parentId: 'cat_main_other_income', level: 1, sortOrder: 5 },

          // 🕌 SOUS-CATÉGORIES REVENUS SPIRITUELS
          { id: 'cat_sub_charity_received', name: 'Aide / Sadaqa reçue', type: 'income', color: '#16A085', icon: 'heart', parentId: 'cat_main_spiritual_income', level: 1, sortOrder: 1 },
          { id: 'cat_sub_association_funds', name: 'Fonds associatifs', type: 'income', color: '#16A085', icon: 'people', parentId: 'cat_main_spiritual_income', level: 1, sortOrder: 2 },
        ];

        // ✅ INSERTION DE TOUTES LES CATÉGORIES
        const allCategories = [...mainExpenseCategories, ...mainIncomeCategories, ...subcategories];
        
        for (const category of allCategories) {
          const createdAt = new Date().toISOString();
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
              category.parentId || null,
              category.level,
              category.sortOrder,
              1, // is_active
              0, // budget
              createdAt
            ]
          );
        }
        
        console.log('✅ [categoryService] ALL categories initialized successfully:', allCategories.length, 'categories');
      } else {
        console.log('ℹ️ [categoryService] Categories already exist, skipping initialization');
      }
    } catch (error) {
      console.error('❌ [categoryService] Error initializing default categories:', error);
      throw error;
    }
  },

  // ===== DIAGNOSTIC ET RÉPARATION =====

  // Diagnostic de la table
  async diagnoseTable(): Promise<TableDiagnosis> {
    try {
      const db = await getDatabase();
      console.log('🔧 [categoryService] Comprehensive table diagnosis...');
      
      const tableExists = await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='categories'"
      );
      
      if (!tableExists) {
        console.log('❌ [categoryService] Table categories does not exist');
        return {
          exists: false,
          structure: [],
          rowCount: 0,
          sampleData: []
        };
      }
      
      const structure = await db.getAllAsync(`PRAGMA table_info(categories)`) as any[];
      console.log('🔧 [categoryService] Table structure:', structure);
      
      const countResult = await db.getFirstAsync(`SELECT COUNT(*) as count FROM categories`) as { count: number } | null;
      const rowCount = countResult?.count || 0;
      
      const sampleData = rowCount > 0 ? 
        await db.getAllAsync(`SELECT * FROM categories LIMIT 3`) as any[] : [];
      
      console.log('✅ [categoryService] Diagnosis completed:', {
        exists: true,
        rowCount,
        sampleDataCount: sampleData.length
      });
      
      return {
        exists: true,
        structure,
        rowCount,
        sampleData
      };
    } catch (error) {
      console.error('❌ [categoryService] Error in diagnoseTable:', error);
      return {
        exists: false,
        structure: [],
        rowCount: 0,
        sampleData: []
      };
    }
  },

  // Réparation d'urgence
  async emergencyRepair(): Promise<void> {
    console.log('🛠️ [categoryService] Starting emergency repair...');
    await repairCategoriesTable();
    console.log('✅ [categoryService] Emergency repair completed');
  },

  // ✅ NOUVELLE MÉTHODE : Création multiple de catégories
  async createMultipleCategories(
    categoriesData: CreateCategoryData[], 
    userId: string = 'default-user'
  ): Promise<{ success: boolean; created: number; errors: string[] }> {
    const results = {
      success: true,
      created: 0,
      errors: [] as string[]
    };

    try {
      const db = await getDatabase();
      await checkAndRepairCategoriesTable();

      console.log(`🔄 [categoryService] Creating ${categoriesData.length} categories...`);

      for (const categoryData of categoriesData) {
        try {
          if (!categoryData.name.trim()) {
            results.errors.push(`Nom manquant pour une catégorie`);
            continue;
          }

          if (!categoryData.type || !['expense', 'income'].includes(categoryData.type)) {
            results.errors.push(`Type invalide pour: ${categoryData.name}`);
            continue;
          }

          if (!categoryData.color) {
            results.errors.push(`Couleur manquante pour: ${categoryData.name}`);
            continue;
          }

          if (!categoryData.icon) {
            results.errors.push(`Icône manquante pour: ${categoryData.name}`);
            continue;
          }

          const id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const createdAt = new Date().toISOString();
          const level = categoryData.parentId ? 1 : 0;
          const sortOrder = categoryData.sortOrder || 0;
          const isActive = categoryData.isActive !== false ? 1 : 0;
          const budget = categoryData.budget || 0;

          await db.runAsync(
            `INSERT OR IGNORE INTO categories (id, user_id, name, type, color, icon, parent_id, level, sort_order, is_active, budget, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id, 
              userId, 
              categoryData.name.trim(), 
              categoryData.type, 
              categoryData.color, 
              categoryData.icon,
              categoryData.parentId || null,
              level,
              sortOrder,
              isActive,
              budget,
              createdAt
            ]
          );

          results.created++;
          console.log(`✅ [categoryService] Category created: ${categoryData.name}`);

        } catch (error) {
          const errorMsg = `Erreur création "${categoryData.name}": ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
          results.errors.push(errorMsg);
          console.error(`❌ [categoryService] ${errorMsg}`);
        }
      }

      if (results.errors.length > 0) {
        results.success = false;
        console.warn(`⚠️ [categoryService] Completed with ${results.errors.length} errors`);
      } else {
        console.log(`✅ [categoryService] All ${results.created} categories created successfully`);
      }

      return results;

    } catch (error) {
      const errorMsg = `Erreur globale création multiple: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
      console.error(`❌ [categoryService] ${errorMsg}`);
      
      return {
        success: false,
        created: results.created,
        errors: [...results.errors, errorMsg]
      };
    }
  }
};

// ===== FONCTIONS INTERNES =====

// Vérifier et réparer la table categories si nécessaire
const checkAndRepairCategoriesTable = async (): Promise<void> => {
  try {
    const db = await getDatabase();
    
    const tableExists = await db.getFirstAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='categories'"
    );
    
    if (!tableExists) {
      console.log('🛠️ [categoryService] Categories table does not exist, creating...');
      await repairCategoriesTable();
      return;
    }
    
    const tableInfo = await db.getAllAsync(`PRAGMA table_info(categories)`) as any[];
    const requiredColumns = [
      'id', 'user_id', 'name', 'type', 'color', 'icon', 
      'parent_id', 'level', 'sort_order', 'is_active', 'budget', 'created_at'
    ];
    const missingColumns = requiredColumns.filter(col => 
      !tableInfo.some(column => column.name === col)
    );
    
    if (missingColumns.length > 0) {
      console.log('🛠️ [categoryService] Missing columns detected:', missingColumns);
      await repairCategoriesTable();
    }
    
  } catch (error) {
    console.error('❌ [categoryService] Error checking table structure:', error);
    await repairCategoriesTable();
  }
};

// Fonction de réparation de la table categories AVEC SOUS-CATÉGORIES
const repairCategoriesTable = async (): Promise<void> => {
  try {
    const db = await getDatabase();
    console.log('🛠️ [categoryService] Repairing categories table with subcategories support...');
    
    let existingData: DatabaseCategory[] = [];
    try {
      existingData = await db.getAllAsync(`SELECT * FROM categories`) as DatabaseCategory[];
      console.log(`🔧 [categoryService] Backing up ${existingData.length} categories`);
    } catch (error) {
      console.log('🔧 [categoryService] No existing data to backup');
    }
    
    await db.execAsync('DROP TABLE IF EXISTS categories');
    
    await db.execAsync(`
      CREATE TABLE categories (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        parent_id TEXT,
        level INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        budget REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE SET NULL
      );
    `);
    
    console.log('✅ [categoryService] Categories table with subcategories recreated');
    
    if (existingData.length > 0) {
      let restoredCount = 0;
      for (const category of existingData) {
        try {
          await db.runAsync(
            `INSERT OR IGNORE INTO categories (id, user_id, name, type, color, icon, parent_id, level, sort_order, is_active, budget, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              category.id,
              category.user_id,
              category.name,
              category.type,
              category.color,
              category.icon,
              category.parent_id || null,
              category.level || 0,
              category.sort_order || 0,
              category.is_active !== undefined ? category.is_active : 1,
              category.budget || 0,
              category.created_at || new Date().toISOString()
            ]
          );
          restoredCount++;
        } catch (insertError) {
          console.warn('⚠️ [categoryService] Could not restore category:', category.id);
        }
      }
      console.log(`✅ [categoryService] Restored ${restoredCount}/${existingData.length} categories`);
    }
    
  } catch (error) {
    console.error('❌ [categoryService] Error repairing categories table:', error);
    throw error;
  }
};

export default categoryService;