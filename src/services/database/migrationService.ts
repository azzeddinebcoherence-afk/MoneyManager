// src/services/database/migrationService.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { getDatabase } from './sqlite';

export interface MySQLData {
  accounts: any[];
  categories: any[];
  expenses: any[];
  incomes: any[];
  debts: any[];
  annual_expenses: any[];
  savings_goals: any[];
  transfers: any[];
}

export const migrationService = {
  async addIslamicColumnsToAnnualCharges(): Promise<void> {
    try {
      const db = await getDatabase();
      
      console.log('🔄 Vérification/ajout des colonnes islamiques à annual_charges...');
      
      // Vérifier si la table existe
      const tableExists = await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='annual_charges'"
      );
      
      if (!tableExists) {
        console.log('❌ Table annual_charges n\'existe pas');
        return;
      }

      // Vérifier la structure actuelle
      const tableInfo = await db.getAllAsync(`PRAGMA table_info(annual_charges)`) as any[];
      const existingColumns = tableInfo.map(col => col.name);
      
      console.log('📋 Colonnes existantes:', existingColumns);

      // Colonnes à ajouter
      const islamicColumns = [
        { name: 'is_islamic', type: 'INTEGER DEFAULT 0' },
        { name: 'islamic_holiday_id', type: 'TEXT' },
        { name: 'arabic_name', type: 'TEXT' },
        { name: 'type', type: 'TEXT DEFAULT "normal"' }
      ];

      for (const column of islamicColumns) {
        if (!existingColumns.includes(column.name)) {
          console.log(`🔄 Ajout colonne ${column.name}...`);
          try {
            await db.execAsync(
              `ALTER TABLE annual_charges ADD COLUMN ${column.name} ${column.type}`
            );
            console.log(`✅ Colonne ${column.name} ajoutée`);
          } catch (alterError: any) {
            if (alterError.message?.includes('duplicate column name')) {
              console.log(`ℹ️ Colonne ${column.name} existe déjà`);
            } else {
              console.warn(`⚠️ Impossible d'ajouter ${column.name}:`, alterError);
            }
          }
        } else {
          console.log(`✅ Colonne ${column.name} existe déjà`);
        }
      }
      
      console.log('✅ Structure table annual_charges vérifiée et mise à jour');
    } catch (error) {
      console.error('❌ Erreur migration colonnes islamiques:', error);
      throw error;
    }
  },

  async addIslamicColumnsToTables(): Promise<{ success: boolean; errors: string[] }> {
    const db = await getDatabase();
    const errors: string[] = [];

    try {
      console.log('🔄 Ajout des colonnes islamiques aux tables...');

      // Colonnes à ajouter à annual_charges
      const islamicColumns = [
        { name: 'is_islamic', type: 'INTEGER DEFAULT 0' },
        { name: 'islamic_holiday_id', type: 'TEXT' },
        { name: 'arabic_name', type: 'TEXT' },
        { name: 'type', type: 'TEXT DEFAULT "normal"' }
      ];

      for (const column of islamicColumns) {
        try {
          await db.execAsync(
            `ALTER TABLE annual_charges ADD COLUMN ${column.name} ${column.type}`
          );
          console.log(`✅ Colonne ${column.name} ajoutée à annual_charges`);
        } catch (error: any) {
          if (!error.message?.includes('duplicate column name')) {
            errors.push(`Erreur colonne ${column.name}: ${error}`);
          } else {
            console.log(`ℹ️ Colonne ${column.name} existe déjà`);
          }
        }
      }

      return { success: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Erreur migration islamique: ${error}`);
      return { success: false, errors };
    }
  }
};

export class MigrationService {
  private static instance: MigrationService;

  public static getInstance(): MigrationService {
    if (!MigrationService.instance) {
      MigrationService.instance = new MigrationService();
    }
    return MigrationService.instance;
  }

  // Vérifier la compatibilité des données avant migration
  public validateMySQLData(data: MySQLData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validation des comptes
    data.accounts?.forEach((account, index) => {
      if (!account.name) errors.push(`Compte ${index}: nom manquant`);
      if (account.balance === undefined) errors.push(`Compte ${index}: solde manquant`);
    });

    // Validation des catégories
    data.categories?.forEach((category, index) => {
      if (!category.name) errors.push(`Catégorie ${index}: nom manquant`);
      if (!category.type) errors.push(`Catégorie ${index}: type manquant`);
    });

    // Validation des transactions
    [...(data.expenses || []), ...(data.incomes || [])].forEach((transaction, index) => {
      if (!transaction.amount) errors.push(`Transaction ${index}: montant manquant`);
      if (!transaction.date) errors.push(`Transaction ${index}: date manquant`);
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Convertir les données MySQL vers le format SQLite
  private convertMySQLToSQLite(data: MySQLData) {
    const userId = 'default-user'; // ID utilisateur par défaut
    
    return {
      // Conversion des comptes
      accounts: (data.accounts || []).map(account => ({
        id: `acc_${account.id}`,
        user_id: userId,
        name: account.name,
        type: this.mapAccountType(account.type),
        balance: parseFloat(account.balance) || 0,
        currency: 'EUR',
        color: account.color || '#007AFF',
        created_at: account.created_at || new Date().toISOString()
      })),

      // Conversion des catégories
      categories: (data.categories || []).map(category => ({
        id: `cat_${category.id}`,
        user_id: userId,
        name: category.name,
        type: this.mapCategoryType(category.type),
        color: category.color || '#6B7280',
        icon: category.icon || 'receipt',
        created_at: category.created_at || new Date().toISOString()
      })),

      // Conversion des dépenses
      expenses: (data.expenses || []).map(expense => ({
        id: `exp_${expense.id}`,
        user_id: userId,
        amount: Math.abs(parseFloat(expense.amount)) || 0,
        type: 'expense',
        category: expense.category,
        account_id: expense.account_id ? `acc_${expense.account_id}` : 'acc_1',
        description: expense.description || '',
        date: expense.date,
        created_at: expense.created_at || new Date().toISOString()
      })),

      // Conversion des revenus
      incomes: (data.incomes || []).map(income => ({
        id: `inc_${income.id}`,
        user_id: userId,
        amount: Math.abs(parseFloat(income.amount)) || 0,
        type: 'income',
        category: income.type,
        account_id: income.account_id ? `acc_${income.account_id}` : 'acc_1',
        description: income.description || '',
        date: income.date,
        created_at: income.created_at || new Date().toISOString()
      })),

      // Conversion des dettes - ✅ CORRIGÉ : avec payment_account_id
      debts: (data.debts || []).map(debt => ({
        id: `debt_${debt.id}`,
        user_id: userId,
        name: debt.creditor,
        initial_amount: parseFloat(debt.amount) || 0,
        current_amount: debt.paid ? 0 : parseFloat(debt.amount) || 0,
        interest_rate: 0,
        monthly_payment: 0,
        due_date: debt.due_date,
        creditor: debt.creditor,
        type: 'personal',
        status: debt.paid ? 'paid' : 'active',
        created_at: debt.created_at || new Date().toISOString(),
        payment_account_id: debt.account_id ? `acc_${debt.account_id}` : null, // ✅ AJOUTÉ
        auto_pay: 0 // ✅ AJOUTÉ
      })),

      // Conversion des charges annuelles - ✅ CORRIGÉ : avec account_id
      annual_charges: (data.annual_expenses || []).map(charge => ({
        id: `annual_${charge.id}`,
        user_id: userId,
        name: charge.description,
        amount: parseFloat(charge.estimated_amount) || 0,
        due_date: this.generateDueDate(charge),
        category: 'Autres dépenses',
        is_paid: charge.paid ? 1 : 0,
        reminder_days: 30,
        created_at: charge.created_at || new Date().toISOString(),
        account_id: charge.account_id ? `acc_${charge.account_id}` : null, // ✅ AJOUTÉ
        auto_deduct: 0 // ✅ AJOUTÉ
      })),

      // Conversion des objectifs d'épargne - ✅ CORRIGÉ : avec comptes associés
      savings_goals: (data.savings_goals || []).map(goal => ({
        id: `sav_${goal.id}`,
        user_id: userId,
        name: goal.name,
        target_amount: parseFloat(goal.target_amount) || 0,
        current_amount: parseFloat(goal.current_amount) || 0,
        target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +1 an
        monthly_contribution: 0,
        category: 'other',
        color: '#007AFF',
        icon: 'flag',
        is_completed: 0,
        created_at: goal.created_at || new Date().toISOString(),
        savings_account_id: goal.account_id ? `acc_${goal.account_id}` : null, // ✅ AJOUTÉ
        contribution_account_id: goal.account_id ? `acc_${goal.account_id}` : null // ✅ AJOUTÉ
      }))
    };
  }

  // Mapper les types de compte
  private mapAccountType(mysqlType: string): string {
    const typeMap: { [key: string]: string } = {
      'cash': 'cash',
      'bank': 'bank', 
      'mobile_money': 'mobile',
      'savings': 'savings',
      'credit': 'credit'
    };
    return typeMap[mysqlType] || 'cash';
  }

  // Mapper les types de catégorie
  private mapCategoryType(mysqlType: string): string {
    return mysqlType === 'income' ? 'income' : 'expense';
  }

  // Générer une date d'échéance pour les charges annuelles
  private generateDueDate(charge: any): string {
    if (charge.is_fixed_date && charge.fixed_month) {
      const year = charge.year || new Date().getFullYear();
      return `${year}-${charge.fixed_month.toString().padStart(2, '0')}-01`;
    }
    // Date par défaut : fin d'année courante
    const year = new Date().getFullYear();
    return `${year}-12-31`;
  }

  // ✅ MÉTHODE : Migration des colonnes account_id
  public async migrateAccountIdColumns(): Promise<{ success: boolean; errors: string[] }> {
    const db = await getDatabase();
    const errors: string[] = [];

    try {
      console.log('🔄 Début de la migration des colonnes account_id...');


      // Migration pour annual_charges
      // Ajout de la colonne dueDate si elle n'existe pas
      try {
        await db.execAsync(`ALTER TABLE annual_charges ADD COLUMN dueDate TEXT`);
        console.log('✅ Colonne dueDate ajoutée à annual_charges');
      } catch (error: any) {
        if (error.message?.includes('duplicate column name')) {
          console.log('ℹ️ Colonne dueDate existe déjà dans annual_charges');
        } else {
          errors.push(`Erreur dueDate annual_charges: ${error}`);
        }
      }

      // Ajouter colonne last_processed_date si absente
      try {
        await db.execAsync(`ALTER TABLE annual_charges ADD COLUMN last_processed_date TEXT`);
        console.log('✅ Colonne last_processed_date ajoutée à annual_charges');
      } catch (error: any) {
        if (error.message?.includes('duplicate column name')) {
          console.log('ℹ️ Colonne last_processed_date existe déjà dans annual_charges');
        } else {
          errors.push(`Erreur last_processed_date annual_charges: ${error}`);
        }
      }

      try {
        await db.execAsync(`ALTER TABLE annual_charges ADD COLUMN account_id TEXT`);
        console.log('✅ Colonne account_id ajoutée à annual_charges');
      } catch (error: any) {
        if (error.message?.includes('duplicate column name')) {
          console.log('ℹ️ Colonne account_id existe déjà dans annual_charges');
        } else {
          errors.push(`Erreur account_id annual_charges: ${error}`);
        }
      }

      try {
        await db.execAsync(`ALTER TABLE annual_charges ADD COLUMN auto_deduct INTEGER DEFAULT 0`);
        console.log('✅ Colonne auto_deduct ajoutée à annual_charges');
      } catch (error: any) {
        if (error.message?.includes('duplicate column name')) {
          console.log('ℹ️ Colonne auto_deduct existe déjà dans annual_charges');
        } else {
          errors.push(`Erreur auto_deduct annual_charges: ${error}`);
        }
      }

      // Migration pour debts
      try {
        await db.execAsync(`
          ALTER TABLE debts ADD COLUMN payment_account_id TEXT;
        `);
        console.log('✅ Colonne payment_account_id ajoutée à debts');
      } catch (error: any) {
        if (error.message?.includes('duplicate column name')) {
          console.log('ℹ️ Colonne payment_account_id existe déjà dans debts');
        } else {
          errors.push(`Erreur payment_account_id debts: ${error}`);
        }
      }

      try {
        await db.execAsync(`
          ALTER TABLE debts ADD COLUMN auto_pay INTEGER DEFAULT 0;
        `);
        console.log('✅ Colonne auto_pay ajoutée à debts');
      } catch (error: any) {
        if (error.message?.includes('duplicate column name')) {
          console.log('ℹ️ Colonne auto_pay existe déjà dans debts');
        } else {
          errors.push(`Erreur auto_pay debts: ${error}`);
        }
      }

      // Migration pour savings_goals
      try {
        await db.execAsync(`
          ALTER TABLE savings_goals ADD COLUMN savings_account_id TEXT;
        `);
        console.log('✅ Colonne savings_account_id ajoutée à savings_goals');
      } catch (error: any) {
        if (error.message?.includes('duplicate column name')) {
          console.log('ℹ️ Colonne savings_account_id existe déjà dans savings_goals');
        } else {
          errors.push(`Erreur savings_account_id savings_goals: ${error}`);
        }
      }

      try {
        await db.execAsync(`
          ALTER TABLE savings_goals ADD COLUMN contribution_account_id TEXT;
        `);
        console.log('✅ Colonne contribution_account_id ajoutée à savings_goals');
      } catch (error: any) {
        if (error.message?.includes('duplicate column name')) {
          console.log('ℹ️ Colonne contribution_account_id existe déjà dans savings_goals');
        } else {
          errors.push(`Erreur contribution_account_id savings_goals: ${error}`);
        }
      }

      console.log('✅ Migration des colonnes account_id terminée avec succès');
      return { success: errors.length === 0, errors };

    } catch (error) {
      const errorMessage = `Erreur lors de la migration: ${error}`;
      console.error('❌', errorMessage);
      errors.push(errorMessage);
      return { success: false, errors };
    }
  }

  // ✅ MÉTHODE : Mettre à jour les données existantes avec account_id
  public async updateExistingDataWithAccountIds(): Promise<{ success: boolean; updated: number; errors: string[] }> {
    const db = await getDatabase();
    const errors: string[] = [];
    let updated = 0;

    try {
      console.log('🔄 Mise à jour des données existantes avec account_id...');

      // 1. Récupérer le compte principal
      const mainAccount = await db.getFirstAsync<{ id: string }>('SELECT id FROM accounts LIMIT 1');
      
      if (!mainAccount) {
        errors.push('Aucun compte trouvé pour la mise à jour');
        return { success: false, updated: 0, errors };
      }

      const accountId = mainAccount.id;

      // 2. Mettre à jour les annual_charges sans account_id
      try {
        const result1 = await db.runAsync(
          'UPDATE annual_charges SET account_id = ? WHERE account_id IS NULL',
          [accountId]
        );
        if (result1 && 'changes' in result1) {
          updated += result1.changes || 0;
          console.log(`✅ ${result1.changes || 0} charges annuelles mises à jour`);
        }
      } catch (error) {
        errors.push(`Erreur mise à jour annual_charges: ${error}`);
      }

      // 3. Mettre à jour les debts sans payment_account_id
      try {
        const result2 = await db.runAsync(
          'UPDATE debts SET payment_account_id = ? WHERE payment_account_id IS NULL',
          [accountId]
        );
        if (result2 && 'changes' in result2) {
          updated += result2.changes || 0;
          console.log(`✅ ${result2.changes || 0} dettes mises à jour`);
        }
      } catch (error) {
        errors.push(`Erreur mise à jour debts: ${error}`);
      }

      // 4. Mettre à jour les savings_goals sans comptes
      try {
        const result3 = await db.runAsync(
          'UPDATE savings_goals SET savings_account_id = ?, contribution_account_id = ? WHERE savings_account_id IS NULL',
          [accountId, accountId]
        );
        if (result3 && 'changes' in result3) {
          updated += result3.changes || 0;
          console.log(`✅ ${result3.changes || 0} objectifs d'épargne mis à jour`);
        }
      } catch (error) {
        errors.push(`Erreur mise à jour savings_goals: ${error}`);
      }

      console.log(`✅ Mise à jour terminée: ${updated} enregistrements mis à jour`);
      return { success: errors.length === 0, updated, errors };

    } catch (error) {
      const errorMessage = `Erreur lors de la mise à jour: ${error}`;
      console.error('❌', errorMessage);
      errors.push(errorMessage);
      return { success: false, updated, errors };
    }
  }

  // Migrer les données MySQL
  public async migrateData(mysqlData: MySQLData): Promise<{ success: boolean; stats: any; errors: string[] }> {
    const db = await getDatabase();
    const errors: string[] = [];
    const stats = {
      accounts: 0,
      categories: 0,
      transactions: 0,
      debts: 0,
      annual_charges: 0,
      savings_goals: 0
    };

    try {
      await db.execAsync('BEGIN TRANSACTION');

      // 1. Valider les données
      const validation = this.validateMySQLData(mysqlData);
      if (!validation.isValid) {
        throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
      }

      // 2. Convertir les données
      const sqliteData = this.convertMySQLToSQLite(mysqlData);

      // 3. Insérer les comptes
      for (const account of sqliteData.accounts) {
        try {
          await db.runAsync(
            `INSERT OR REPLACE INTO accounts (id, user_id, name, type, balance, currency, color, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [account.id, account.user_id, account.name, account.type, account.balance, 
             account.currency, account.color, account.created_at]
          );
          stats.accounts++;
        } catch (error) {
          errors.push(`Erreur compte ${account.name}: ${error}`);
        }
      }

      // 4. Insérer les catégories (uniquement si elles n'existent pas)
      for (const category of sqliteData.categories) {
        try {
          const existing = await db.getFirstAsync(
            'SELECT 1 FROM categories WHERE name = ? AND type = ?',
            [category.name, category.type]
          );
          
          if (!existing) {
            await db.runAsync(
              `INSERT OR IGNORE INTO categories (id, user_id, name, type, color, icon, created_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [category.id, category.user_id, category.name, category.type, 
               category.color, category.icon, category.created_at]
            );
            stats.categories++;
          }
        } catch (error) {
          errors.push(`Erreur catégorie ${category.name}: ${error}`);
        }
      }

      // 5. Insérer les transactions
      const allTransactions = [...sqliteData.expenses, ...sqliteData.incomes];
      for (const transaction of allTransactions) {
        try {
          await db.runAsync(
            `INSERT INTO transactions (id, user_id, amount, type, category, account_id, description, date, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [transaction.id, transaction.user_id, transaction.amount, transaction.type,
             transaction.category, transaction.account_id, transaction.description,
             transaction.date, transaction.created_at]
          );
          stats.transactions++;
        } catch (error) {
          errors.push(`Erreur transaction ${transaction.id}: ${error}`);
        }
      }

      // 6. Insérer les dettes - ✅ CORRIGÉ : avec les nouvelles colonnes
      for (const debt of sqliteData.debts) {
        try {
          await db.runAsync(
            `INSERT INTO debts (id, user_id, name, initial_amount, current_amount, interest_rate, monthly_payment, due_date, creditor, type, status, created_at, payment_account_id, auto_pay) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [debt.id, debt.user_id, debt.name, debt.initial_amount, debt.current_amount,
             debt.interest_rate, debt.monthly_payment, debt.due_date, debt.creditor,
             debt.type, debt.status, debt.created_at, debt.payment_account_id, debt.auto_pay]
          );
          stats.debts++;
        } catch (error) {
          errors.push(`Erreur dette ${debt.name}: ${error}`);
        }
      }

      // 7. Insérer les charges annuelles - ✅ CORRIGÉ : avec les nouvelles colonnes
      for (const charge of sqliteData.annual_charges) {
        try {
          await db.runAsync(
            `INSERT INTO annual_charges (id, user_id, name, amount, due_date, category, is_paid, reminder_days, created_at, account_id, auto_deduct) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [charge.id, charge.user_id, charge.name, charge.amount, charge.due_date,
             charge.category, charge.is_paid, charge.reminder_days, charge.created_at,
             charge.account_id, charge.auto_deduct]
          );
          stats.annual_charges++;
        } catch (error) {
          errors.push(`Erreur charge annuelle ${charge.name}: ${error}`);
        }
      }

      // 8. Insérer les objectifs d'épargne - ✅ CORRIGÉ : avec les nouvelles colonnes
      for (const goal of sqliteData.savings_goals) {
        try {
          await db.runAsync(
            `INSERT INTO savings_goals (id, user_id, name, target_amount, current_amount, target_date, monthly_contribution, category, color, icon, is_completed, created_at, savings_account_id, contribution_account_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [goal.id, goal.user_id, goal.name, goal.target_amount, goal.current_amount,
             goal.target_date, goal.monthly_contribution, goal.category, goal.color,
             goal.icon, goal.is_completed, goal.created_at, goal.savings_account_id, goal.contribution_account_id]
          );
          stats.savings_goals++;
        } catch (error) {
          errors.push(`Erreur objectif ${goal.name}: ${error}`);
        }
      }

      await db.execAsync('COMMIT');

      return {
        success: errors.length === 0,
        stats,
        errors
      };

    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }

  // Vérifier l'intégrité après migration
  public async verifyMigration(): Promise<{ table: string; count: number }[]> {
    const db = await getDatabase();
    const tables = ['accounts', 'categories', 'transactions', 'debts', 'annual_charges', 'savings_goals'];
    const results: { table: string; count: number }[] = [];

    for (const table of tables) {
      try {
        const result = await db.getFirstAsync(`SELECT COUNT(*) as count FROM ${table}`) as { count: number };
        results.push({ table, count: result.count });
      } catch (error) {
        results.push({ table, count: 0 });
      }
    }

    return results;
  }

  // ✅ MÉTHODE : Vérifier la présence des colonnes account_id
  public async verifyAccountIdColumns(): Promise<{ 
    table: string; 
    hasAccountId: boolean; 
    hasAdditionalColumns: boolean;
  }[]> {
    const db = await getDatabase();
    const tables = [
      { name: 'annual_charges', accountColumn: 'account_id', additionalColumn: 'auto_deduct' },
      { name: 'debts', accountColumn: 'payment_account_id', additionalColumn: 'auto_pay' },
      { name: 'savings_goals', accountColumn: 'savings_account_id', additionalColumn: 'contribution_account_id' }
    ];
    
    const results: { table: string; hasAccountId: boolean; hasAdditionalColumns: boolean }[] = [];

    for (const table of tables) {
      try {
        // Vérifier la colonne account_id
        const accountColumnResult = await db.getFirstAsync(
          `PRAGMA table_info(${table.name}) WHERE name = ?`,
          [table.accountColumn]
        );
        
        // Vérifier la colonne additionnelle
        const additionalColumnResult = await db.getFirstAsync(
          `PRAGMA table_info(${table.name}) WHERE name = ?`,
          [table.additionalColumn]
        );

        results.push({
          table: table.name,
          hasAccountId: !!accountColumnResult,
          hasAdditionalColumns: !!additionalColumnResult
        });
      } catch (error) {
        results.push({
          table: table.name,
          hasAccountId: false,
          hasAdditionalColumns: false
        });
      }
    }

    return results;
  }

  // ✅ MÉTHODE : Migration complète incluant account_id
  public async completeMigration(mysqlData?: MySQLData): Promise<{ 
    success: boolean; 
    steps: {
      accountIdMigration: boolean;
      dataUpdate: boolean;
      mysqlMigration?: boolean;
    };
    errors: string[];
  }> {
    const errors: string[] = [];
    const steps = {
      accountIdMigration: false,
      dataUpdate: false,
      mysqlMigration: false
    };

    try {
      console.log('🚀 Début de la migration complète...');

      // Étape 1: Migration des colonnes account_id
      const migrationResult = await this.migrateAccountIdColumns();
      steps.accountIdMigration = migrationResult.success;
      if (!migrationResult.success) {
        errors.push(...migrationResult.errors);
      }

      // Étape 2: Mise à jour des données existantes
      const updateResult = await this.updateExistingDataWithAccountIds();
      steps.dataUpdate = updateResult.success;
      if (!updateResult.success) {
        errors.push(...updateResult.errors);
      }

      // Étape 3: Migration des données MySQL si fournies
      if (mysqlData) {
        try {
          const mysqlResult = await this.migrateData(mysqlData);
          steps.mysqlMigration = mysqlResult.success;
          if (!mysqlResult.success) {
            errors.push(...mysqlResult.errors);
          }
        } catch (error) {
          errors.push(`Erreur migration MySQL: ${error}`);
          steps.mysqlMigration = false;
        }
      }

      const success = errors.length === 0;
      console.log(`✅ Migration complète ${success ? 'terminée avec succès' : 'terminée avec des erreurs'}`);
      
      return { success, steps, errors };

    } catch (error) {
      const errorMessage = `Erreur lors de la migration complète: ${error}`;
      console.error('❌', errorMessage);
      errors.push(errorMessage);
      return { success: false, steps, errors };
    }
  }
}

export default MigrationService.getInstance();