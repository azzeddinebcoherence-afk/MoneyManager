import { Category, CreateCategoryData } from '../types';
import { getDatabase } from './database/sqlite';

export interface DatabaseCategory extends Category {
  user_id: string;
  parent_id?: string;
  is_active: number;
  level: number;
  sort_order: number;
}

// Helper pour créer une catégorie avec tous les champs requis
const createCategoryRecord = (
  id: string,
  name: string, 
  type: 'income' | 'expense',
  color: string,
  icon: string,
  level: number,
  sortOrder: number,
  parentId?: string
): Category => ({
  id,
  name,
  type,
  color,
  icon,
  parentId,
  level,
  sortOrder,
  isActive: true,
  createdAt: new Date().toISOString()
});

// 🔄 NOUVELLE STRUCTURE DE CATÉGORIES SELON VOS DEMANDES
const mainIncomeCategories: Category[] = [
  // ✅ 1. REVENUS (3 catégories)
  createCategoryRecord('cat_main_salary', '💼 Salaire', 'income', '#52C41A', 'briefcase', 0, 1),
  createCategoryRecord('cat_main_secondary_income', '📈 Revenus secondaires', 'income', '#52C41A', 'trending-up', 0, 2),
  createCategoryRecord('cat_main_family_income', '👨‍👩‍👧‍👦 Revenus familiaux', 'income', '#52C41A', 'people', 0, 3),
];

const mainExpenseCategories: Category[] = [
  // ✅ 2. DÉPENSES MENSUELLES (9 catégories)
  createCategoryRecord('cat_main_housing', '🏠 Logement & Charges', 'expense', '#45B7D1', 'home', 0, 4),
  createCategoryRecord('cat_main_food', '🛒 Nourriture & Courses', 'expense', '#FFA940', 'restaurant', 0, 5),
  createCategoryRecord('cat_main_transport', '🚗 Transport & Voiture', 'expense', '#FA8C16', 'car', 0, 6),
  createCategoryRecord('cat_main_health', '💊 Santé', 'expense', '#FF4D4F', 'medical', 0, 7),
  createCategoryRecord('cat_main_child', '👶 Enfant', 'expense', '#FF85C0', 'happy', 0, 8),
  createCategoryRecord('cat_main_subscriptions', '📱 Abonnements', 'expense', '#722ED1', 'phone-portrait', 0, 9),
  createCategoryRecord('cat_main_personal', '👤 Dépenses personnelles', 'expense', '#13C2C2', 'person', 0, 10),
  createCategoryRecord('cat_main_house', '🏡 Maison', 'expense', '#96CEB4', 'hammer', 0, 11),
  createCategoryRecord('cat_main_misc', '🎁 Divers & imprévus', 'expense', '#95A5A6', 'gift', 0, 12),
];

const annualExpenseCategories: Category[] = [
  // ✅ 3. CHARGES ANNUELLES (8 catégories)  
  createCategoryRecord('cat_annual_car_insurance', '🛡️ Assurance voiture', 'expense', '#1890FF', 'shield', 0, 13),
  createCategoryRecord('cat_annual_car_sticker', '🏷️ Vignette voiture', 'expense', '#1890FF', 'pricetag', 0, 14),
  createCategoryRecord('cat_annual_car_inspection', '🔧 Visite technique', 'expense', '#1890FF', 'build', 0, 15),
  createCategoryRecord('cat_annual_taxes', '🏛️ Impôts/taxes', 'expense', '#1890FF', 'business', 0, 16),
  createCategoryRecord('cat_annual_ramadan', '🌙 Ramadan', 'expense', '#1890FF', 'moon', 0, 17),
  createCategoryRecord('cat_annual_eid', '🎉 Aïd Al Adha', 'expense', '#1890FF', 'star', 0, 18),
  createCategoryRecord('cat_annual_school', '🎒 Rentrée scolaire', 'expense', '#1890FF', 'school', 0, 19),
  createCategoryRecord('cat_annual_vacation', '✈️ Voyages/vacances', 'expense', '#1890FF', 'airplane', 0, 20),
];

// 🔄 SOUS-CATÉGORIES DÉTAILLÉES SELON VOS DEMANDES
const subcategories: Category[] = [
  // 💼 Salaire
  createCategoryRecord('cat_sub_base_salary', 'Salaire de base', 'income', '#52C41A', 'card', 1, 21, 'cat_main_salary'),
  createCategoryRecord('cat_sub_overtime', 'Heures supplémentaires', 'income', '#52C41A', 'time', 1, 22, 'cat_main_salary'),
  createCategoryRecord('cat_sub_bonus', 'Prime/bonus', 'income', '#52C41A', 'trophy', 1, 23, 'cat_main_salary'),
  createCategoryRecord('cat_sub_allowances', 'Indemnités', 'income', '#52C41A', 'receipt', 1, 24, 'cat_main_salary'),

  // 📈 Revenus secondaires
  createCategoryRecord('cat_sub_freelance', 'Freelance/consulting', 'income', '#52C41A', 'laptop', 1, 25, 'cat_main_secondary_income'),
  createCategoryRecord('cat_sub_rental', 'Revenus locatifs', 'income', '#52C41A', 'key', 1, 26, 'cat_main_secondary_income'),
  createCategoryRecord('cat_sub_investments', 'Investissements', 'income', '#52C41A', 'trending-up', 1, 27, 'cat_main_secondary_income'),
  createCategoryRecord('cat_sub_side_business', 'Activité secondaire', 'income', '#52C41A', 'storefront', 1, 28, 'cat_main_secondary_income'),

  // 👨‍👩‍👧‍👦 Revenus familiaux
  createCategoryRecord('cat_sub_family_allowance', 'Allocations familiales', 'income', '#52C41A', 'people', 1, 29, 'cat_main_family_income'),
  createCategoryRecord('cat_sub_child_support', 'Pension alimentaire', 'income', '#52C41A', 'heart', 1, 30, 'cat_main_family_income'),
  createCategoryRecord('cat_sub_family_help', 'Aide familiale', 'income', '#52C41A', 'hand-right', 1, 31, 'cat_main_family_income'),

  // 🏠 Logement & Charges
  createCategoryRecord('cat_sub_rent', 'Loyer/hypothèque', 'expense', '#45B7D1', 'home', 1, 32, 'cat_main_housing'),
  createCategoryRecord('cat_sub_charges', 'Charges de copropriété', 'expense', '#45B7D1', 'document', 1, 33, 'cat_main_housing'),
  createCategoryRecord('cat_sub_electricity', 'Électricité', 'expense', '#45B7D1', 'flash', 1, 34, 'cat_main_housing'),
  createCategoryRecord('cat_sub_water', 'Eau', 'expense', '#45B7D1', 'water', 1, 35, 'cat_main_housing'),
  createCategoryRecord('cat_sub_gas', 'Gaz', 'expense', '#45B7D1', 'flame', 1, 36, 'cat_main_housing'),
  createCategoryRecord('cat_sub_internet', 'Internet / Wi-Fi', 'expense', '#45B7D1', 'wifi', 1, 37, 'cat_main_housing'),
  createCategoryRecord('cat_sub_phone_home', 'Téléphone fixe', 'expense', '#45B7D1', 'call', 1, 38, 'cat_main_housing'),
  createCategoryRecord('cat_sub_maintenance', 'Entretien/réparations', 'expense', '#45B7D1', 'build', 1, 39, 'cat_main_housing'),
  createCategoryRecord('cat_sub_housing_insurance', 'Assurance habitation', 'expense', '#45B7D1', 'shield', 1, 40, 'cat_main_housing'),

  // 🛒 Nourriture & Courses
  createCategoryRecord('cat_sub_groceries', 'Courses alimentaires', 'expense', '#FFA940', 'basket', 1, 41, 'cat_main_food'),
  createCategoryRecord('cat_sub_restaurants', 'Restaurants', 'expense', '#FFA940', 'restaurant', 1, 42, 'cat_main_food'),
  createCategoryRecord('cat_sub_takeaway', 'Plats à emporter', 'expense', '#FFA940', 'bag', 1, 43, 'cat_main_food'),
  createCategoryRecord('cat_sub_coffee_snacks', 'Café/snacks', 'expense', '#FFA940', 'cafe', 1, 44, 'cat_main_food'),

  // 🚗 Transport & Voiture
  createCategoryRecord('cat_sub_fuel', 'Carburant', 'expense', '#FA8C16', 'car', 1, 45, 'cat_main_transport'),
  createCategoryRecord('cat_sub_car_maintenance', 'Entretien voiture', 'expense', '#FA8C16', 'build', 1, 46, 'cat_main_transport'),
  createCategoryRecord('cat_sub_parking', 'Parking/stationnement', 'expense', '#FA8C16', 'car-sport', 1, 47, 'cat_main_transport'),
  createCategoryRecord('cat_sub_public_transport', 'Transport public', 'expense', '#FA8C16', 'bus', 1, 48, 'cat_main_transport'),
  createCategoryRecord('cat_sub_taxi_uber', 'Taxi/Uber', 'expense', '#FA8C16', 'speedometer', 1, 49, 'cat_main_transport'),

  // 💊 Santé
  createCategoryRecord('cat_sub_doctor', 'Médecin/consultations', 'expense', '#FF4D4F', 'medical', 1, 50, 'cat_main_health'),
  createCategoryRecord('cat_sub_pharmacy', 'Pharmacie/médicaments', 'expense', '#FF4D4F', 'medkit', 1, 51, 'cat_main_health'),
  createCategoryRecord('cat_sub_dentist', 'Dentiste', 'expense', '#FF4D4F', 'heart', 1, 52, 'cat_main_health'),
  createCategoryRecord('cat_sub_lab_tests', 'Analyses/examens', 'expense', '#FF4D4F', 'flask', 1, 53, 'cat_main_health'),
  createCategoryRecord('cat_sub_health_insurance', 'Mutuelle santé', 'expense', '#FF4D4F', 'shield', 1, 54, 'cat_main_health'),

  // 👶 Enfant
  createCategoryRecord('cat_sub_childcare', 'Garde d\'enfant/crèche', 'expense', '#FF85C0', 'happy', 1, 55, 'cat_main_child'),
  createCategoryRecord('cat_sub_school_supplies', 'Fournitures scolaires', 'expense', '#FF85C0', 'school', 1, 56, 'cat_main_child'),
  createCategoryRecord('cat_sub_child_clothes', 'Vêtements enfant', 'expense', '#FF85C0', 'shirt', 1, 57, 'cat_main_child'),
  createCategoryRecord('cat_sub_toys_games', 'Jouets/jeux', 'expense', '#FF85C0', 'game-controller', 1, 58, 'cat_main_child'),
  createCategoryRecord('cat_sub_child_activities', 'Activités enfant', 'expense', '#FF85C0', 'football', 1, 59, 'cat_main_child'),

  // 📱 Abonnements
  createCategoryRecord('cat_sub_phone_mobile', 'Téléphone mobile', 'expense', '#722ED1', 'phone-portrait', 1, 60, 'cat_main_subscriptions'),
  createCategoryRecord('cat_sub_streaming', 'Streaming (Netflix, etc.)', 'expense', '#722ED1', 'tv', 1, 61, 'cat_main_subscriptions'),
  createCategoryRecord('cat_sub_gym', 'Salle de sport', 'expense', '#722ED1', 'fitness', 1, 62, 'cat_main_subscriptions'),
  createCategoryRecord('cat_sub_magazines', 'Magazines/journaux', 'expense', '#722ED1', 'newspaper', 1, 63, 'cat_main_subscriptions'),
  createCategoryRecord('cat_sub_software', 'Logiciels/applications', 'expense', '#722ED1', 'apps', 1, 64, 'cat_main_subscriptions'),

  // 👤 Dépenses personnelles
  createCategoryRecord('cat_sub_clothing', 'Vêtements', 'expense', '#13C2C2', 'shirt', 1, 65, 'cat_main_personal'),
  createCategoryRecord('cat_sub_beauty', 'Beauté/cosmétiques', 'expense', '#13C2C2', 'sparkles', 1, 66, 'cat_main_personal'),
  createCategoryRecord('cat_sub_haircut', 'Coiffeur', 'expense', '#13C2C2', 'cut', 1, 67, 'cat_main_personal'),
  createCategoryRecord('cat_sub_personal_care', 'Soins personnels', 'expense', '#13C2C2', 'heart', 1, 68, 'cat_main_personal'),
  createCategoryRecord('cat_sub_hobbies', 'Loisirs/hobbies', 'expense', '#13C2C2', 'game-controller', 1, 69, 'cat_main_personal'),

  // 🏡 Maison
  createCategoryRecord('cat_sub_furniture', 'Meubles', 'expense', '#96CEB4', 'bed', 1, 70, 'cat_main_house'),
  createCategoryRecord('cat_sub_appliances', 'Électroménager', 'expense', '#96CEB4', 'desktop', 1, 71, 'cat_main_house'),
  createCategoryRecord('cat_sub_decoration', 'Décoration', 'expense', '#96CEB4', 'flower', 1, 72, 'cat_main_house'),
  createCategoryRecord('cat_sub_cleaning', 'Produits ménagers', 'expense', '#96CEB4', 'sparkles', 1, 73, 'cat_main_house'),
  createCategoryRecord('cat_sub_tools', 'Outils/bricolage', 'expense', '#96CEB4', 'construct', 1, 74, 'cat_main_house'),

  // 🎁 Divers & imprévus
  createCategoryRecord('cat_sub_gifts', 'Cadeaux', 'expense', '#95A5A6', 'gift', 1, 75, 'cat_main_misc'),
  createCategoryRecord('cat_sub_donations', 'Dons/charité', 'expense', '#95A5A6', 'heart', 1, 76, 'cat_main_misc'),
  createCategoryRecord('cat_sub_bank_fees', 'Frais bancaires', 'expense', '#95A5A6', 'card', 1, 77, 'cat_main_misc'),
  createCategoryRecord('cat_sub_unexpected', 'Imprévus', 'expense', '#95A5A6', 'warning', 1, 78, 'cat_main_misc'),
];

// 🔄 ASSEMBLAGE DE TOUTES LES CATÉGORIES
const allCategories: Category[] = [
  ...mainIncomeCategories,
  ...mainExpenseCategories,
  ...annualExpenseCategories,
  ...subcategories
];

// 🔄 SERVICE DE GESTION DES CATÉGORIES
export const categoryService = {
  // ✅ INITIALISATION AUTORITAIRE : FORCE VOS 20 CATÉGORIES COMME STRUCTURE PAR DÉFAUT
  async smartInitializeCategories(userId: string = 'default-user'): Promise<void> {
    try {
      console.log('👑 [categoryService] Initialisation des catégories (non destructive)...');
      const db = await getDatabase();

      // Vérifier toutes les catégories existantes
      const existingCategories = await db.getAllAsync(`
        SELECT id, name, type FROM categories WHERE user_id = ?
      `, [userId]) as { id: string, name: string, type: string }[];

      const categoryCount = existingCategories.length;

      if (categoryCount === 0) {
        console.log('🔄 [categoryService] Base de données vide - Installation des 20 catégories...');
        await this.installNewCategories(userId);
        return;
      }

      // Vérifier si la structure est EXACTEMENT celle attendue
      const expectedCategoryIds = allCategories.map(cat => cat.id);
      const existingCategoryIds = existingCategories.map(cat => cat.id);
      
      const hasAllNewCategories = expectedCategoryIds.every(id => existingCategoryIds.includes(id));
      const hasOnlyNewCategories = existingCategoryIds.every(id => expectedCategoryIds.includes(id));
      const hasExactCount = categoryCount === allCategories.length;

      if (hasAllNewCategories && hasOnlyNewCategories && hasExactCount) {
        console.log(`✅ [categoryService] Structure parfaite détectée: ${categoryCount} catégories correctes`);
        return;
      }

      // Non destructif: on ajoute seulement les catégories manquantes, on ne supprime rien
      const missingIds = expectedCategoryIds.filter(id => !existingCategoryIds.includes(id));
      if (missingIds.length === 0) {
        console.log('ℹ️ [categoryService] Aucune catégorie manquante. Conservation des catégories personnalisées.');
        return;
      }

      console.log(`🛠️ [categoryService] Ajout des catégories manquantes: ${missingIds.length}`);
      await db.runAsync('BEGIN TRANSACTION');
      try {
        for (const id of missingIds) {
          const cat = allCategories.find(c => c.id === id);
          if (!cat) continue;
          await db.runAsync(`
            INSERT INTO categories (
              id, user_id, name, type, color, icon, parent_id, level, sort_order, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            cat.id,
            userId,
            cat.name,
            cat.type,
            cat.color,
            cat.icon,
            cat.parentId || null,
            cat.level,
            cat.sortOrder,
            1
          ]);
        }
        await db.runAsync('COMMIT');
        console.log('✅ [categoryService] Catégories manquantes ajoutées sans supprimer les personnalisées');
      } catch (insertErr) {
        await db.runAsync('ROLLBACK');
        throw insertErr;
      }
      
    } catch (error) {
      console.error('❌ [categoryService] Error in smart initialization:', error);
      // Non destructif: ne pas réinitialiser automatiquement en cas d'erreur
      console.log('ℹ️ [categoryService] Initialisation non destructive: aucune suppression effectuée');
    }
  },

  // ✅ INSTALLATION PROPRE DES NOUVELLES CATÉGORIES
  async installNewCategories(userId: string = 'default-user'): Promise<void> {
    try {
      const db = await getDatabase();
      await db.runAsync('BEGIN TRANSACTION');

      // Insérer toutes les nouvelles catégories
      for (const category of allCategories) {
        await db.runAsync(`
          INSERT INTO categories (
            id, user_id, name, type, color, icon, parent_id, level, sort_order, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          category.id,
          userId,
          category.name,
          category.type,
          category.color,
          category.icon,
          category.parentId || null,
          category.level,
          category.sortOrder,
          1
        ]);
      }

      await db.runAsync('COMMIT');
      
      console.log(`✅ [categoryService] NOUVELLES catégories installées: ${allCategories.length} categories`);
      console.log(`✅ [categoryService] - ${mainIncomeCategories.length} catégories de revenus`);
      console.log(`✅ [categoryService] - ${mainExpenseCategories.length} catégories de dépenses mensuelles`);
      console.log(`✅ [categoryService] - ${annualExpenseCategories.length} catégories de charges annuelles`);
      console.log(`✅ [categoryService] - ${subcategories.length} sous-catégories`);
      
    } catch (error) {
      const db = await getDatabase();
      await db.runAsync('ROLLBACK');
      console.error('❌ [categoryService] Error installing new categories:', error);
      throw error;
    }
  },

  // ✅ MÉTHODE D'INITIALISATION DES CATÉGORIES PAR DÉFAUT (LEGACY)
  async initializeDefaultCategories(userId: string = 'default-user'): Promise<void> {
    // Rediriger vers la nouvelle méthode intelligente
    await this.smartInitializeCategories(userId);
  },



  // ✅ MÉTHODE POUR FORCER LA RÉINITIALISATION COMPLÈTE DES CATÉGORIES
  async forceReinitializeAllCategories(userId: string = 'default-user'): Promise<void> {
    try {
      console.log('🔄 [categoryService] FORCING complete categories reinitialization...');
      console.log('🗑️ [categoryService] SUPPRESSION TOTALE de toutes les anciennes catégories...');
      const db = await getDatabase();

      await db.runAsync('BEGIN TRANSACTION');

      // SUPPRESSION COMPLÈTE : Supprimer TOUTES les catégories de TOUS les utilisateurs
      await db.runAsync('DELETE FROM categories');
      console.log('🗑️ [categoryService] TOUTES les anciennes catégories supprimées');

      // NETTOYAGE COMPLET : Reset de l'auto-increment si SQLite le permet
      try {
        await db.runAsync('DELETE FROM sqlite_sequence WHERE name = "categories"');
        console.log('🧹 [categoryService] Compteur auto-increment réinitialisé');
      } catch (resetError) {
        console.log('ℹ️ [categoryService] Reset auto-increment non nécessaire');
      }

      // INSTALLATION DES NOUVELLES CATÉGORIES : Seulement les 20 catégories + sous-catégories
      console.log(`🔄 [categoryService] Installation des ${allCategories.length} nouvelles catégories...`);
      
      for (const category of allCategories) {
        await db.runAsync(`
          INSERT INTO categories (
            id, user_id, name, type, color, icon, parent_id, level, sort_order, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          category.id,
          userId,
          category.name,
          category.type,
          category.color,
          category.icon,
          category.parentId || null,
          category.level,
          category.sortOrder,
          1
        ]);
      }

      await db.runAsync('COMMIT');
      
      console.log(`✅ [categoryService] RÉINITIALISATION COMPLÈTE TERMINÉE!`);
      console.log(`✅ [categoryService] ${allCategories.length} nouvelles catégories installées`);
      console.log(`✅ [categoryService] - ${mainIncomeCategories.length} catégories de revenus`);
      console.log(`✅ [categoryService] - ${mainExpenseCategories.length} catégories de dépenses mensuelles`);
      console.log(`✅ [categoryService] - ${annualExpenseCategories.length} catégories de charges annuelles`);
      console.log(`✅ [categoryService] - ${subcategories.length} sous-catégories`);
      
    } catch (error) {
      const db = await getDatabase();
      await db.runAsync('ROLLBACK');
      console.error('❌ [categoryService] Error in forced reinitialization:', error);
      throw error;
    }
  },

  // ✅ RÉCUPÉRER TOUTES LES CATÉGORIES
  async getAllCategories(userId: string = 'default-user'): Promise<Category[]> {
    try {
      console.log('🔍 [categoryService] Fetching all categories...');
      const db = await getDatabase();
      
      const categories = await db.getAllAsync(`
        SELECT id, name, type, color, icon, parent_id, level, sort_order, is_active
        FROM categories 
        WHERE user_id = ? AND is_active = 1
        ORDER BY sort_order ASC
      `, [userId]) as DatabaseCategory[];

      const result = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type as 'income' | 'expense',
        color: cat.color,
        icon: cat.icon,
        parentId: cat.parent_id,
        level: cat.level,
        sortOrder: cat.sort_order,
        isActive: cat.is_active === 1,
        createdAt: new Date().toISOString()
      }));

      console.log(`✅ [categoryService] Found ${result.length} categories`);
      return result;
      
    } catch (error) {
      console.error('❌ [categoryService] Error fetching categories:', error);
      return [];
    }
  },

  // ✅ CONSTRUIRE L'ARBRE DES CATÉGORIES
  async getCategoryTree(userId: string = 'default-user'): Promise<Array<{ category: Category; subcategories: Category[] }>> {
    try {
      const allCategories = await this.getAllCategories(userId);
      
      // Filtrer les catégories principales (level 0)
      const mainCategories = allCategories.filter(cat => cat.level === 0);
      
      // Construire l'arbre avec les sous-catégories
      const tree = mainCategories.map(category => ({
        category,
        subcategories: allCategories.filter(cat => cat.parentId === category.id)
      }));
      
      console.log(`🌳 [categoryService] Category tree built: ${mainCategories.length} main categories`);
      return tree;
      
    } catch (error) {
      console.error('❌ [categoryService] Error building category tree:', error);
      return [];
    }
  },

  // ✅ RÉCUPÉRER LES SOUS-CATÉGORIES D'UNE CATÉGORIE
  async getSubcategories(parentId: string, userId: string = 'default-user'): Promise<Category[]> {
    try {
      const db = await getDatabase();
      
      const subcategories = await db.getAllAsync(`
        SELECT id, name, type, color, icon, parent_id, level, sort_order, is_active
        FROM categories 
        WHERE user_id = ? AND parent_id = ? AND is_active = 1
        ORDER BY sort_order ASC
      `, [userId, parentId]) as DatabaseCategory[];

      return subcategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type as 'income' | 'expense',
        color: cat.color,
        icon: cat.icon,
        parentId: cat.parent_id,
        level: cat.level,
        sortOrder: cat.sort_order,
        isActive: cat.is_active === 1,
        createdAt: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('❌ [categoryService] Error fetching subcategories:', error);
      return [];
    }
  },

  // ✅ CRÉER UNE NOUVELLE CATÉGORIE
  async createCategory(category: CreateCategoryData, userId: string = 'default-user'): Promise<string> {
    try {
      const db = await getDatabase();
      const categoryId = `cat_${Date.now()}`;
      
      await db.runAsync(`
        INSERT INTO categories (
          id, user_id, name, type, color, icon, parent_id, level, sort_order, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        categoryId,
        userId,
        category.name,
        category.type,
        category.color,
        category.icon,
        category.parentId || null,
        category.level || 0,
        category.sortOrder || 0,
        // Par défaut on active la catégorie si non spécifié
        (category.isActive ?? true) ? 1 : 0
      ]);

      console.log(`✅ [categoryService] Category created: ${category.name}`);
      
      return categoryId;
      
    } catch (error) {
      console.error('❌ [categoryService] Error creating category:', error);
      throw error;
    }
  },

  // ✅ METTRE À JOUR UNE CATÉGORIE
  async updateCategory(categoryId: string, updates: Partial<Category>, userId: string = 'default-user'): Promise<void> {
    try {
      const db = await getDatabase();
      
      const setClauses = [];
      const values = [];
      
      if (updates.name !== undefined) {
        setClauses.push('name = ?');
        values.push(updates.name);
      }
      if (updates.color !== undefined) {
        setClauses.push('color = ?');
        values.push(updates.color);
      }
      if (updates.icon !== undefined) {
        setClauses.push('icon = ?');
        values.push(updates.icon);
      }
      
      values.push(userId, categoryId);
      
      await db.runAsync(`
        UPDATE categories 
        SET ${setClauses.join(', ')}
        WHERE user_id = ? AND id = ?
      `, values);

      console.log(`✅ [categoryService] Category updated: ${categoryId}`);
      
    } catch (error) {
      console.error('❌ [categoryService] Error updating category:', error);
      throw error;
    }
  },

  // ✅ SUPPRIMER UNE CATÉGORIE
  async deleteCategory(categoryId: string, userId: string = 'default-user'): Promise<void> {
    try {
      const db = await getDatabase();
      
      await db.runAsync(`
        UPDATE categories 
        SET is_active = 0
        WHERE user_id = ? AND id = ?
      `, [userId, categoryId]);

      console.log(`✅ [categoryService] Category deleted: ${categoryId}`);
      
    } catch (error) {
      console.error('❌ [categoryService] Error deleting category:', error);
      throw error;
    }
  },

  // ✅ RÉCUPÉRER LES CATÉGORIES PAR TYPE
  async getCategoriesByType(type: 'income' | 'expense', userId: string = 'default-user'): Promise<Category[]> {
    try {
      const db = await getDatabase();
      
      const categories = await db.getAllAsync(`
        SELECT id, name, type, color, icon, parent_id, level, sort_order, is_active
        FROM categories 
        WHERE user_id = ? AND type = ? AND is_active = 1
        ORDER BY sort_order ASC
      `, [userId, type]) as DatabaseCategory[];

      return categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type as 'income' | 'expense',
        color: cat.color,
        icon: cat.icon,
        parentId: cat.parent_id,
        level: cat.level,
        sortOrder: cat.sort_order,
        isActive: cat.is_active === 1,
        createdAt: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('❌ [categoryService] Error fetching categories by type:', error);
      return [];
    }
  },

  // ✅ RÉCUPÉRER UNE CATÉGORIE PAR ID
  async getCategoryById(id: string, userId: string = 'default-user'): Promise<Category | null> {
    try {
      const db = await getDatabase();
      
      const category = await db.getFirstAsync(`
        SELECT id, name, type, color, icon, parent_id, level, sort_order, is_active
        FROM categories 
        WHERE user_id = ? AND id = ? AND is_active = 1
      `, [userId, id]) as DatabaseCategory | null;

      if (!category) return null;

      return {
        id: category.id,
        name: category.name,
        type: category.type as 'income' | 'expense',
        color: category.color,
        icon: category.icon,
        parentId: category.parent_id,
        level: category.level,
        sortOrder: category.sort_order,
        isActive: category.is_active === 1,
        createdAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ [categoryService] Error fetching category by id:', error);
      return null;
    }
  },

  // ✅ RÉCUPÉRER LES CATÉGORIES PRINCIPALES
  async getMainCategories(userId: string = 'default-user'): Promise<Category[]> {
    try {
      const db = await getDatabase();
      
      const categories = await db.getAllAsync(`
        SELECT id, name, type, color, icon, parent_id, level, sort_order, is_active
        FROM categories 
        WHERE user_id = ? AND level = 0 AND is_active = 1
        ORDER BY sort_order ASC
      `, [userId]) as DatabaseCategory[];

      return categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type as 'income' | 'expense',
        color: cat.color,
        icon: cat.icon,
        parentId: cat.parent_id,
        level: cat.level,
        sortOrder: cat.sort_order,
        isActive: cat.is_active === 1,
        createdAt: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('❌ [categoryService] Error fetching main categories:', error);
      return [];
    }
  },

  // ✅ CRÉER PLUSIEURS CATÉGORIES
  async createMultipleCategories(categoriesData: CreateCategoryData[], userId: string = 'default-user'): Promise<{ success: boolean; created: number; errors: string[] }> {
    const result = { success: false, created: 0, errors: [] as string[] };
    
    try {
      const db = await getDatabase();
      
      await db.runAsync('BEGIN TRANSACTION');
      
      for (const categoryData of categoriesData) {
        try {
          const categoryId = `cat_${Date.now()}_${result.created}`;
          
          await db.runAsync(`
            INSERT INTO categories (
              id, user_id, name, type, color, icon, parent_id, level, sort_order, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            categoryId,
            userId,
            categoryData.name,
            categoryData.type,
            categoryData.color,
            categoryData.icon,
            categoryData.parentId || null,
            categoryData.level || 0,
            categoryData.sortOrder || 0,
            // Par défaut on active la catégorie si non spécifié
            (categoryData.isActive ?? true) ? 1 : 0
          ]);
          
          result.created++;
        } catch (error) {
          result.errors.push(`Error creating ${categoryData.name}: ${error}`);
        }
      }
      
      await db.runAsync('COMMIT');
      result.success = result.errors.length === 0;
      
      console.log(`✅ [categoryService] Created ${result.created} categories`);
      
    } catch (error) {
      const db = await getDatabase();
      await db.runAsync('ROLLBACK');
      result.errors.push(`Transaction error: ${error}`);
      console.error('❌ [categoryService] Error creating multiple categories:', error);
    }
    
    return result;
  }
};

export default categoryService;