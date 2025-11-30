// src/services/debtService.ts - VERSION FINALE AVEC SUPPRESSION COMPLÈTE
import { CreateDebtData, Debt, DebtPayment, PaymentEligibility, UpdateDebtData } from '../types/Debt';
import { accountService } from './accountService';
import { getDatabase } from './database/sqlite';

interface DatabaseDebt {
  id: string;
  user_id: string;
  name: string;
  creditor: string;
  initial_amount: number;
  current_amount: number;
  interest_rate: number;
  monthly_payment: number;
  start_date: string;
  due_date: string;
  due_month: string;
  status: string;
  category: string;
  color: string;
  notes?: string;
  created_at: string;
  next_due_date?: string;
  type: string;
  auto_pay: number;
  payment_account_id?: string;
  start_payment_next_month?: number;
}

interface DatabaseDebtPayment {
  id: string;
  debt_id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  payment_status: string;
  created_at: string;
  from_account_id?: string;
  principal: number;
  interest: number;
  remaining_balance: number;
  payment_month: string;
}

export const debtService = {
  /**
   * ✅ S'ASSURER QUE LA TABLE DEBTS A TOUTES LES COLONNES NÉCESSAIRES
   */
  async ensureDebtsTableExists(): Promise<void> {
    try {
      const db = await getDatabase();
      
      const tableExists = await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='debts'"
      );
      
      if (!tableExists) {
        console.log('🛠️ [debtService] Creating debts table...');
        
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS debts (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            creditor TEXT NOT NULL,
            initial_amount REAL NOT NULL,
            current_amount REAL NOT NULL,
            interest_rate REAL NOT NULL DEFAULT 0,
            monthly_payment REAL NOT NULL,
            start_date TEXT NOT NULL,
            due_date TEXT NOT NULL,
            due_month TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            category TEXT NOT NULL,
            color TEXT NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL,
            next_due_date TEXT,
            type TEXT NOT NULL DEFAULT 'personal',
            auto_pay INTEGER NOT NULL DEFAULT 0,
            payment_account_id TEXT,
            payment_day INTEGER,
            start_payment_next_month INTEGER NOT NULL DEFAULT 0
          );
        `);
        
        console.log('✅ [debtService] debts table created successfully');
      } else {
        console.log('🔍 [debtService] Checking debts table structure...');
        
        const tableInfo = await db.getAllAsync(`PRAGMA table_info(debts)`) as any[];
        
        const requiredColumns = [
          { name: 'notes', type: 'TEXT' },
          { name: 'start_date', type: 'TEXT' },
          { name: 'due_month', type: 'TEXT' },
          { name: 'category', type: 'TEXT' },
          { name: 'color', type: 'TEXT' },
          { name: 'type', type: 'TEXT' },
          { name: 'auto_pay', type: 'INTEGER' },
          { name: 'payment_account_id', type: 'TEXT' },
          { name: 'payment_day', type: 'INTEGER' },
          { name: 'next_due_date', type: 'TEXT' },
          { name: 'start_payment_next_month', type: 'INTEGER' }
        ];
        
        for (const requiredColumn of requiredColumns) {
          const columnExists = tableInfo.some(col => col.name === requiredColumn.name);
          if (!columnExists) {
            console.log(`🛠️ [debtService] Adding ${requiredColumn.name} column to debts...`);
            
            try {
              await db.execAsync(`
                ALTER TABLE debts ADD COLUMN ${requiredColumn.name} ${requiredColumn.type};
              `);
              console.log(`✅ [debtService] ${requiredColumn.name} column added successfully`);
            } catch (alterError) {
              console.warn(`⚠️ [debtService] Could not add column ${requiredColumn.name}:`, alterError);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ [debtService] Error ensuring debts table exists:', error);
      throw error;
    }
  },

  /**
   * ✅ CRÉATION DE LA TABLE DES PAIEMENTS AVEC TOUTES LES COLONNES
   */
  async ensurePaymentsTableExists(): Promise<void> {
    try {
      const db = await getDatabase();
      
      const tableExists = await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='debt_payments'"
      );
      
      if (!tableExists) {
        console.log('🛠️ [debtService] Creating debt_payments table...');
        
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS debt_payments (
            id TEXT PRIMARY KEY NOT NULL,
            debt_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            amount REAL NOT NULL,
            payment_date TEXT NOT NULL,
            payment_status TEXT NOT NULL DEFAULT 'completed',
            created_at TEXT NOT NULL,
            from_account_id TEXT,
            principal REAL NOT NULL DEFAULT 0,
            interest REAL NOT NULL DEFAULT 0,
            remaining_balance REAL NOT NULL DEFAULT 0,
            payment_month TEXT NOT NULL,
            FOREIGN KEY (debt_id) REFERENCES debts (id) ON DELETE CASCADE
          );
        `);
        
        console.log('✅ [debtService] debt_payments table created successfully');
      } else {
        console.log('🔍 [debtService] Checking debt_payments table structure...');
        
        const tableInfo = await db.getAllAsync(`PRAGMA table_info(debt_payments)`) as any[];
        
        const requiredColumns = [
          { name: 'payment_status', type: 'TEXT' },
          { name: 'principal', type: 'REAL' },
          { name: 'interest', type: 'REAL' },
          { name: 'remaining_balance', type: 'REAL' },
          { name: 'payment_month', type: 'TEXT' }
        ];
        
        for (const requiredColumn of requiredColumns) {
          const columnExists = tableInfo.some(col => col.name === requiredColumn.name);
          if (!columnExists) {
            console.log(`🛠️ [debtService] Adding ${requiredColumn.name} column to debt_payments...`);
            
            try {
              await db.execAsync(`
                ALTER TABLE debt_payments ADD COLUMN ${requiredColumn.name} ${requiredColumn.type};
              `);
              console.log(`✅ [debtService] ${requiredColumn.name} column added successfully`);
            } catch (alterError) {
              console.warn(`⚠️ [debtService] Could not add column ${requiredColumn.name}:`, alterError);
            }
          }
        }
        
        console.log('✅ [debtService] debt_payments table structure verified');
      }
    } catch (error) {
      console.error('❌ [debtService] Error ensuring payments table exists:', error);
      throw error;
    }
  },

  /**
   * ✅ AJOUT DE PAIEMENT CORRIGÉ - SOUSTRACTION DU COMPTE
   */
  async addPayment(
    debtId: string, 
    amount: number, 
    fromAccountId?: string, 
    userId: string = 'default-user'
  ): Promise<string> {
    try {
      const db = await getDatabase();
      const id = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const paymentDate = new Date().toISOString().split('T')[0];
      const paymentMonth = new Date().toISOString().slice(0, 7);
      const createdAt = new Date().toISOString();

      console.log('🔄 [debtService] Adding payment:', { 
        debtId, 
        amount, 
        fromAccountId 
      });

      const debt = await this.getDebtById(debtId, userId);
      if (!debt) {
        throw new Error('Dette non trouvée');
      }

      let effectiveFromAccountId = fromAccountId;

      // ✅ SI AUCUN COMPTE SPÉCIFIÉ, UTILISER CELUI DE LA DETTE
      if (!effectiveFromAccountId && debt.paymentAccountId) {
        effectiveFromAccountId = debt.paymentAccountId;
        console.log('💰 [debtService] Utilisation compte paiement dette:', effectiveFromAccountId);
      }

      // ✅ FALLBACK : TROUVER UN COMPTE VALIDE
      if (!effectiveFromAccountId) {
        const validAccount = await accountService.findValidAccountForOperation(amount);
        if (validAccount) {
          effectiveFromAccountId = validAccount.id;
          console.log('💰 [debtService] Compte auto-assigné:', effectiveFromAccountId);
        } else {
          throw new Error('Aucun compte source disponible avec suffisamment de fonds');
        }
      }

      // ✅ VALIDATION FINALE DU COMPTE
      const validation = await accountService.validateAccountForOperation(effectiveFromAccountId, amount, 'debit');
      if (!validation.isValid) {
        throw new Error(validation.message || 'Compte source invalide');
      }

      const fromAccount = validation.account!;

      // Calculer la répartition principal/intérêts
      const monthlyInterest = (debt.currentAmount * debt.interestRate) / 100 / 12;
      const principal = Math.max(0, amount - monthlyInterest);
      const interest = Math.min(amount, monthlyInterest);

      const newBalance = Math.max(0, debt.currentAmount - principal);
      const isPaid = newBalance <= 0;

      await db.execAsync('BEGIN TRANSACTION');

      try {
        // ✅ S'ASSURER QUE LA TABLE DE PAIEMENTS A LES BONNES COLONNES
        await this.ensurePaymentsTableExists();

        // ✅ CORRECTION : SOUSTRAIRE le montant du compte
        const newFromBalance = fromAccount.balance - amount;
        await accountService.updateAccountBalance(effectiveFromAccountId, newFromBalance, userId);

        // ✅ CRÉER UNE TRANSACTION DE DÉPENSE POUR LE PAIEMENT
        await this.createPaymentTransaction({
          amount: amount,
          accountId: effectiveFromAccountId,
          description: `Paiement dette: ${debt.name} - ${debt.creditor}`,
          date: paymentDate,
        }, userId);

        // ✅ ENREGISTREMENT DU PAIEMENT
        await db.runAsync(
          `INSERT INTO debt_payments (
            id, debt_id, user_id, amount, payment_date, payment_status, 
            created_at, from_account_id, principal, interest, remaining_balance, payment_month
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            debtId,
            userId,
            amount,
            paymentDate,
            'completed',
            createdAt,
            effectiveFromAccountId,
            principal,
            interest,
            newBalance,
            paymentMonth
          ]
        );

        // ✅ MISE À JOUR DE LA DETTE
        const newStatus = isPaid ? 'paid' : debt.status;
        await db.runAsync(
          `UPDATE debts SET current_amount = ?, status = ? WHERE id = ? AND user_id = ?`,
          [newBalance, newStatus, debtId, userId]
        );

        await db.execAsync('COMMIT');
        
        console.log('✅ [debtService] Payment added successfully');
        return id;

      } catch (error) {
        await db.execAsync('ROLLBACK');
        console.error('❌ [debtService] Transaction failed, rolling back:', error);
        throw error;
      }

    } catch (error) {
      console.error('❌ [debtService] Error in addPayment:', error);
      throw error;
    }
  },

  /**
   * ✅ CRÉER UNE TRANSACTION DE PAIEMENT
   */
  async createPaymentTransaction(
    transactionData: {
      amount: number;
      accountId: string;
      description: string;
      date: string;
    },
    userId: string = 'default-user'
  ): Promise<string> {
    try {
      const db = await getDatabase();
      const id = `payment_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO transactions (
          id, user_id, amount, type, category, account_id, description, date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          -transactionData.amount, // Montant négatif pour dépense
          'expense',
          'dette',
          transactionData.accountId,
          transactionData.description,
          transactionData.date,
          createdAt
        ]
      );

      console.log('✅ [debtService] Transaction de paiement créée:', id);
      return id;
    } catch (error) {
      console.error('❌ [debtService] Erreur création transaction paiement:', error);
      throw error;
    }
  },

  /**
   * ✅ SUPPRESSION COMPLÈTE D'UNE DETTE AVEC REMBOURSEMENT
   */
  async deleteDebt(id: string, userId: string = 'default-user'): Promise<void> {
    try {
      const db = await getDatabase();
      
      // ✅ RÉCUPÉRER LA DETTE AVANT SUPPRESSION
      const debt = await this.getDebtById(id, userId);
      if (!debt) {
        throw new Error('Dette non trouvée');
      }

      await db.execAsync('BEGIN TRANSACTION');

      try {
        // ✅ 1. RÉCUPÉRER TOUS LES PAIEMENTS EFFECTUÉS
        const payments = await this.getPaymentHistory(id, userId);
        
        // ✅ 2. REMBOURSER LES PAIEMENTS DANS LES COMPTES CORRESPONDANTS
        for (const payment of payments) {
          if (payment.fromAccountId) {
            // Rembourser le montant du paiement au compte source
            const account = await accountService.getAccountById(payment.fromAccountId, userId);
            if (account) {
              const newBalance = account.balance + payment.amount;
              await accountService.updateAccountBalance(payment.fromAccountId, newBalance, userId);
              
              // Créer une transaction de remboursement
              await this.createRefundTransaction({
                amount: payment.amount,
                accountId: payment.fromAccountId,
                description: `Remboursement dette supprimée: ${debt.name}`,
                date: new Date().toISOString().split('T')[0],
              }, userId);
              
              console.log(`💰 Remboursement de ${payment.amount} MAD vers ${account.name}`);
            }
          }
        }

        // ✅ 3. SUPPRIMER LES TRANSACTIONS LIÉES À CETTE DETTE
        await db.runAsync(
          `DELETE FROM transactions 
           WHERE description LIKE ? AND user_id = ?`,
          [`%${debt.name}%`, userId]
        );

        // ✅ 4. SUPPRIMER LES PAIEMENTS (CASCADE AUTOMATIQUE GRÂCE À FOREIGN KEY)
        await db.runAsync(
          `DELETE FROM debt_payments WHERE debt_id = ? AND user_id = ?`,
          [id, userId]
        );

        // ✅ 5. SUPPRIMER LA DETTE
        await db.runAsync(
          `DELETE FROM debts WHERE id = ? AND user_id = ?`,
          [id, userId]
        );

        await db.execAsync('COMMIT');

        console.log('✅ [debtService] Debt completely deleted with refunds');
        
      } catch (error) {
        await db.execAsync('ROLLBACK');
        console.error('❌ [debtService] Transaction failed during debt deletion:', error);
        throw error;
      }

    } catch (error) {
      console.error('❌ [debtService] Error in deleteDebt:', error);
      throw error;
    }
  },

  /**
   * ✅ CRÉER UNE TRANSACTION DE REMBOURSEMENT
   */
  async createRefundTransaction(
    transactionData: {
      amount: number;
      accountId: string;
      description: string;
      date: string;
    },
    userId: string = 'default-user'
  ): Promise<string> {
    try {
      const db = await getDatabase();
      const id = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO transactions (
          id, user_id, amount, type, category, account_id, description, date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          transactionData.amount, // Montant positif pour revenu (remboursement)
          'income',
          'remboursement',
          transactionData.accountId,
          transactionData.description,
          transactionData.date,
          createdAt
        ]
      );

      console.log('✅ [debtService] Transaction de remboursement créée:', id);
      return id;
    } catch (error) {
      console.error('❌ [debtService] Erreur création transaction remboursement:', error);
      throw error;
    }
  },

  /**
   * ✅ RÉCUPÉRATION DE TOUTES LES DETTES AVEC ÉLIGIBILITÉ CALCULÉE
   */
  async getAllDebts(userId: string = 'default-user'): Promise<Debt[]> {
    try {
      await this.ensureDebtsTableExists();

      const db = await getDatabase();
      
      const result = await db.getAllAsync(
        `SELECT * FROM debts WHERE user_id = ? ORDER BY 
         CASE status
           WHEN 'overdue' THEN 1
           WHEN 'active' THEN 2
           WHEN 'future' THEN 3
           ELSE 4
         END, due_date ASC`,
        [userId]
      ) as DatabaseDebt[];

      const debts: Debt[] = result.map((item) => {
        const paymentEligibility = this.calculatePaymentEligibility({
          dueDate: item.due_date,
          dueMonth: item.due_month,
          status: item.status as Debt['status'],
          currentAmount: item.current_amount
        });

        return {
          id: item.id,
          userId: item.user_id,
          name: item.name,
          creditor: item.creditor,
          initialAmount: item.initial_amount,
          currentAmount: item.current_amount,
          interestRate: item.interest_rate,
          monthlyPayment: item.monthly_payment,
          startDate: item.start_date,
          dueDate: item.due_date,
          dueMonth: item.due_month,
          status: item.status as Debt['status'],
          category: item.category,
          color: item.color,
          notes: item.notes || undefined,
          createdAt: item.created_at,
          nextDueDate: item.next_due_date || undefined,
          type: item.type as Debt['type'],
          autoPay: Boolean(item.auto_pay),
          paymentAccountId: item.payment_account_id || undefined,
          paymentEligibility
        };
      });

      return debts;
    } catch (error) {
      console.error('❌ [debtService] Error in getAllDebts:', error);
      throw error;
    }
  },

  /**
   * ✅ CALCUL D'ÉLIGIBILITÉ AVEC RÈGLES STRICTES D'ÉCHÉANCE
   */
  calculatePaymentEligibility(params: {
    dueDate: string;
    dueMonth: string;
    status: Debt['status'];
    currentAmount: number;
  }): PaymentEligibility {
    const now = new Date();
    const dueDate = new Date(params.dueDate);
    const currentMonth = now.toISOString().slice(0, 7);
    
    if (params.currentAmount <= 0 || params.status === 'paid') {
      return { 
        isEligible: false, 
        reason: 'Cette dette est déjà réglée',
        dueMonth: params.dueMonth,
        isCurrentMonth: false,
        isPastDue: false,
        isFutureDue: false
      };
    }

    // ✅ PAIEMENT TOUJOURS AUTORISÉ - Pas de restriction de date
    return { 
      isEligible: true,
      reason: 'Paiement autorisé',
      dueMonth: params.dueMonth,
      isCurrentMonth: false,
      isPastDue: false,
      isFutureDue: false
    };
  },

  /**
   * ✅ CRÉATION DE DETTE AVEC GESTION AUTOMATIQUE DU STATUT
   */
  async createDebt(debtData: CreateDebtData, userId: string = 'default-user'): Promise<string> {
    try {
      await this.ensureDebtsTableExists();

      const db = await getDatabase();
      const id = `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();

      console.log('🔄 [debtService] Creating debt:', { id, ...debtData });

      // ✅ CALCUL DU DUE_DATE À PARTIR DE PAYMENT_DAY
      const startDate = new Date(debtData.startDate + 'T12:00:00'); // Ajouter heure pour éviter timezone
      const paymentDay = debtData.paymentDay || 1;
      const now = new Date();
      
      console.log('📅 [debtService] startDate:', startDate.toISOString(), 'paymentDay:', paymentDay);
      
      // Créer la date d'échéance en format ISO pour éviter les problèmes de timezone
      const year = startDate.getFullYear();
      const month = startDate.getMonth(); // 0-11
      
      // Construire la due_date en format YYYY-MM-DD directement
      let dueYear = year;
      let dueMonth = month;
      
      // ✅ LOGIQUE SELON start_payment_next_month
      if (debtData.startPaymentNextMonth) {
        // Option "Mois prochain" : toujours passer au mois suivant
        dueMonth += 1;
        if (dueMonth > 11) {
          dueMonth = 0;
          dueYear += 1;
        }
      } else {
        // Option "Dès que possible" : 
        // Utiliser le mois actuel même si le jour est passé
        const dayOfMonth = startDate.getDate();
        if (paymentDay < dayOfMonth) {
          // Le jour de paiement est déjà passé ce mois, mais on reste ce mois
          // pour permettre le paiement immédiat
          console.log('📅 Payment day already passed this month, staying in current month');
        }
      }
      
      // Formater la date au format YYYY-MM-DD
      const dueDateString = `${dueYear}-${String(dueMonth + 1).padStart(2, '0')}-${String(paymentDay).padStart(2, '0')}`;
      const dueMonth_str = `${dueYear}-${String(dueMonth + 1).padStart(2, '0')}`;
      
      // Créer l'objet Date pour vérifier le statut
      const dueDate = new Date(dueDateString + 'T12:00:00');
      
      let status: Debt['status'] = 'active';
      if (dueDate > now) {
        status = 'future';
      } else if (dueDate < now) {
        status = 'overdue';
      }

      console.log('📅 [debtService] Calculated due date:', { 
        startDate: debtData.startDate, 
        paymentDay, 
        dueDateString,
        dueMonth: dueMonth_str,
        startPaymentNextMonth: debtData.startPaymentNextMonth,
        status 
      });

      await db.runAsync(
        `INSERT INTO debts (
          id, user_id, name, creditor, initial_amount, current_amount, 
          interest_rate, monthly_payment, start_date, due_date, due_month, status, 
          category, color, notes, created_at, type, auto_pay, payment_account_id, payment_day, start_payment_next_month
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          debtData.name,
          debtData.creditor,
          debtData.initialAmount,
          debtData.initialAmount,
          debtData.interestRate,
          debtData.monthlyPayment,
          debtData.startDate,
          dueDateString,
          dueMonth_str,
          status,
          debtData.category,
          debtData.color,
          debtData.notes || null,
          createdAt,
          debtData.type,
          debtData.autoPay ? 1 : 0,
          debtData.paymentAccountId || null,
          paymentDay,
          debtData.startPaymentNextMonth ? 1 : 0
        ]
      );

      console.log('✅ [debtService] Debt created with status:', status);
      return id;
    } catch (error) {
      console.error('❌ [debtService] Error in createDebt:', error);
      throw error;
    }
  },

  /**
   * ✅ MISE À JOUR AUTOMATIQUE DES STATUTS BASÉS SUR LES DATES
   */
  async updateDebtStatuses(userId: string = 'default-user'): Promise<void> {
    try {
      const db = await getDatabase();
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      
      const debts = await this.getAllDebts(userId);
      let changes = 0;

      for (const debt of debts) {
        if (debt.currentAmount <= 0) {
          if (debt.status !== 'paid') {
            await this.updateDebt(debt.id, { status: 'paid' }, userId);
            changes++;
          }
          continue;
        }

        const dueDate = new Date(debt.dueDate);
        const dueMonth = debt.dueMonth;
        let newStatus = debt.status;

        if (debt.status === 'future' && dueMonth === currentMonth) {
          newStatus = 'active';
        }
        else if (debt.status === 'active' && dueDate < now && dueMonth !== currentMonth) {
          newStatus = 'overdue';
        }
        else if (debt.status === 'overdue' && dueMonth === currentMonth) {
          newStatus = 'active';
        }

        if (newStatus !== debt.status) {
          await this.updateDebt(debt.id, { status: newStatus }, userId);
          changes++;
          console.log(`🔄 [debtService] Updated debt ${debt.name} status: ${debt.status} -> ${newStatus}`);
        }
      }

      if (changes > 0) {
        console.log(`✅ [debtService] ${changes} debt statuses updated successfully`);
      }
    } catch (error) {
      console.error('❌ [debtService] Error updating debt statuses:', error);
      throw error;
    }
  },

  /**
   * ✅ RÉCUPÉRATION D'UNE DETTE PAR ID
   */
  async getDebtById(id: string, userId: string = 'default-user'): Promise<Debt | null> {
    try {
      const db = await getDatabase();
      
      const result = await db.getFirstAsync(
        `SELECT * FROM debts WHERE id = ? AND user_id = ?`,
        [id, userId]
      ) as DatabaseDebt | null;

      if (result) {
        const paymentEligibility = this.calculatePaymentEligibility({
          dueDate: result.due_date,
          dueMonth: result.due_month,
          status: result.status as Debt['status'],
          currentAmount: result.current_amount
        });

        const debt: Debt = {
          id: result.id,
          userId: result.user_id,
          name: result.name,
          creditor: result.creditor,
          initialAmount: result.initial_amount,
          currentAmount: result.current_amount,
          interestRate: result.interest_rate,
          monthlyPayment: result.monthly_payment,
          startDate: result.start_date,
          dueDate: result.due_date,
          dueMonth: result.due_month,
          status: result.status as Debt['status'],
          category: result.category,
          color: result.color,
          notes: result.notes || undefined,
          createdAt: result.created_at,
          nextDueDate: result.next_due_date || undefined,
          type: result.type as Debt['type'],
          autoPay: Boolean(result.auto_pay),
          paymentAccountId: result.payment_account_id || undefined,
          startPaymentNextMonth: Boolean(result.start_payment_next_month),
          paymentEligibility
        };
        return debt;
      }
      return null;
    } catch (error) {
      console.error('❌ [debtService] Error in getDebtById:', error);
      throw error;
    }
  },

  /**
   * ✅ MISE À JOUR D'UNE DETTE
   */
  async updateDebt(id: string, updates: UpdateDebtData, userId: string = 'default-user'): Promise<void> {
    try {
      const db = await getDatabase();
      
      const fields = Object.keys(updates);
      if (fields.length === 0) return;

      const dbFields = fields.map(field => {
        const mapping: { [key: string]: string } = {
          'initialAmount': 'initial_amount',
          'currentAmount': 'current_amount',
          'interestRate': 'interest_rate',
          'monthlyPayment': 'monthly_payment',
          'startDate': 'start_date',
          'dueDate': 'due_date',
          'dueMonth': 'due_month',
          'autoPay': 'auto_pay',
          'paymentAccountId': 'payment_account_id'
        };
        return mapping[field] || field;
      });

      const setClause = dbFields.map(field => `${field} = ?`).join(', ');

      const values = fields.map(field => {
        const value = (updates as any)[field];
        if (field === 'autoPay') {
          return value ? 1 : 0;
        }
        return value;
      });

      values.push(id, userId);

      await db.runAsync(
        `UPDATE debts SET ${setClause} WHERE id = ? AND user_id = ?`,
        values
      );

      console.log('✅ [debtService] Debt updated successfully');
    } catch (error) {
      console.error('❌ [debtService] Error in updateDebt:', error);
      throw error;
    }
  },

  /**
   * ✅ HISTORIQUE DES PAIEMENTS
   */
  async getPaymentHistory(debtId: string, userId: string = 'default-user'): Promise<DebtPayment[]> {
    try {
      const db = await getDatabase();
      
      await this.ensurePaymentsTableExists();
      
      const result = await db.getAllAsync(
        `SELECT dp.* FROM debt_payments dp
         JOIN debts d ON dp.debt_id = d.id
         WHERE dp.debt_id = ? AND d.user_id = ?
         ORDER BY dp.payment_date DESC`,
        [debtId, userId]
      ) as DatabaseDebtPayment[];

      const payments: DebtPayment[] = result.map((item) => ({
        id: item.id,
        debtId: item.debt_id,
        amount: item.amount,
        paymentDate: item.payment_date,
        paymentStatus: item.payment_status as 'completed' | 'pending' | 'failed',
        createdAt: item.created_at,
        fromAccountId: item.from_account_id || undefined,
        principal: item.principal,
        interest: item.interest,
        remainingBalance: item.remaining_balance,
        paymentMonth: item.payment_month
      }));

      return payments;
    } catch (error) {
      console.error('❌ [debtService] Error in getPaymentHistory:', error);
      throw error;
    }
  },

  /**
   * ✅ STATISTIQUES DES DETTES
   */
  async getDebtStats(userId: string = 'default-user'): Promise<{
    totalDebt: number;
    monthlyPayment: number;
    paidDebts: number;
    activeDebts: number;
    overdueDebts: number;
    futureDebts: number;
    totalInterest: number;
    totalRemaining: number;
    totalPaid: number;
    interestPaid: number;
    debtFreeDate: string;
    progressPercentage: number;
    dueThisMonth: number;
    totalDueThisMonth: number;
    upcomingDebts: Debt[];
  }> {
    try {
      const debts = await this.getAllDebts(userId);
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      
      const totalDebt = debts.length;
      const activeDebts = debts.filter(debt => debt.status === 'active').length;
      const overdueDebts = debts.filter(debt => debt.status === 'overdue').length;
      const paidDebts = debts.filter(debt => debt.status === 'paid').length;
      const futureDebts = debts.filter(debt => debt.status === 'future').length;
      
      const totalRemaining = debts.reduce((sum, debt) => sum + debt.currentAmount, 0);
      const totalPaid = debts.reduce((sum, debt) => sum + (debt.initialAmount - debt.currentAmount), 0);
      const monthlyPayment = debts
        .filter(debt => debt.status === 'active' || debt.status === 'overdue')
        .reduce((sum, debt) => sum + debt.monthlyPayment, 0);
      
      const interestPaid = debts.reduce((sum, debt) => {
        return sum + (debt.initialAmount - debt.currentAmount) * (debt.interestRate / 100);
      }, 0);

      const totalInterest = debts.reduce((sum, debt) => {
        const monthlyInterest = (debt.currentAmount * debt.interestRate) / 100 / 12;
        return sum + monthlyInterest;
      }, 0);

      const dueThisMonth = debts.filter(debt => 
        debt.dueMonth === currentMonth && 
        (debt.status === 'active' || debt.status === 'overdue')
      ).length;

      const totalDueThisMonth = debts
        .filter(debt => debt.dueMonth === currentMonth)
        .reduce((sum, debt) => sum + debt.monthlyPayment, 0);

      const upcomingDebts = debts
        .filter(debt => {
          if (!debt.dueDate || debt.status === 'paid') return false;
          const dueDate = new Date(debt.dueDate);
          return dueDate > now;
        })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);

      const progressPercentage = totalPaid > 0 ? 
        (totalPaid / (totalPaid + totalRemaining)) * 100 : 0;

      const activeDebtsList = debts.filter(debt => 
        debt.status === 'active' || debt.status === 'overdue'
      );
      
      let debtFreeDate = new Date().toISOString().split('T')[0];
      if (activeDebtsList.length > 0) {
        let maxDate = new Date();
        activeDebtsList.forEach(debt => {
          if (debt.dueDate) {
            const dueDate = new Date(debt.dueDate);
            if (dueDate > maxDate) {
              maxDate = dueDate;
            }
          }
        });
        debtFreeDate = maxDate.toISOString().split('T')[0];
      }

      return {
        totalDebt,
        activeDebts,
        overdueDebts,
        paidDebts,
        futureDebts,
        totalRemaining,
        totalPaid,
        monthlyPayment,
        interestPaid,
        totalInterest,
        debtFreeDate,
        progressPercentage,
        dueThisMonth,
        totalDueThisMonth,
        upcomingDebts
      };
    } catch (error) {
      console.error('❌ [debtService] Error getting debt stats:', error);
      throw error;
    }
  },

  /**
   * ✅ DETTES ÉLIGIBLES AU PAIEMENT CE MOIS
   */
  async getEligibleDebtsThisMonth(userId: string = 'default-user'): Promise<Debt[]> {
    try {
      const debts = await this.getAllDebts(userId);
      return debts.filter(debt => 
        debt.paymentEligibility.isEligible && 
        debt.paymentEligibility.isCurrentMonth
      );
    } catch (error) {
      console.error('❌ [debtService] Error getting eligible debts:', error);
      throw error;
    }
  },

  /**
   * ✅ DETTES EN RETARD
   */
  async getOverdueDebts(userId: string = 'default-user'): Promise<Debt[]> {
    try {
      const debts = await this.getAllDebts(userId);
      return debts.filter(debt => 
        debt.status === 'overdue' || 
        debt.paymentEligibility.isPastDue
      );
    } catch (error) {
      console.error('❌ [debtService] Error getting overdue debts:', error);
      throw error;
    }
  },

  /**
   * ✅ TRAITER LES DETTES ÉCHUES AVEC PAIEMENT AUTOMATIQUE
   */
  async processDueDebts(userId: string = 'default-user'): Promise<{ processed: number; errors: string[] }> {
    try {
      const db = await getDatabase();
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      console.log('🔄 [debtService] Processing due debts with auto-pay...');

      // Récupérer toutes les dettes avec paiement automatique activé et non payées
      // On ne filtre pas par date ici, on le fera dans la boucle selon start_payment_next_month
      const dueDebtsData = await db.getAllAsync(`
        SELECT * FROM debts 
        WHERE user_id = ? 
          AND auto_pay = 1 
          AND payment_account_id IS NOT NULL 
          AND status != 'paid'
          AND current_amount > 0
        ORDER BY due_date ASC
      `, [userId]) as DatabaseDebt[];

      let processed = 0;
      const errors: string[] = [];

      for (const debtData of dueDebtsData) {
        try {
          const dueMonth = new Date(debtData.due_date).toISOString().slice(0, 7);
          const createdMonth = new Date(debtData.created_at).toISOString().slice(0, 7);
          const dueDate = new Date(debtData.due_date);
          const now = new Date();
          
          // Logique selon start_payment_next_month
          if (debtData.start_payment_next_month) {
            // Option "Mois prochain" : skip si on est encore dans le mois de création
            if (createdMonth === currentMonth) {
              console.log(`⏭️ [debtService] Skipping ${debtData.name}: start_payment_next_month=true, waiting for next month`);
              continue;
            }
            // Sinon, vérifier que la due_date est échue
            if (dueDate > now) {
              console.log(`⏭️ [debtService] Skipping ${debtData.name}: due_date not reached yet (${debtData.due_date})`);
              continue;
            }
          } else {
            // Option "Dès que possible" : payer dès que due_month = currentMonth OU due_date échue
            const canPayThisMonth = (dueMonth === currentMonth);
            const isPastDue = (dueDate <= now);
            
            if (!canPayThisMonth && !isPastDue) {
              console.log(`⏭️ [debtService] Skipping ${debtData.name}: not eligible yet (due_month: ${dueMonth}, current: ${currentMonth})`);
              continue;
            }
          }

          const debt = await this.getDebtById(debtData.id, userId);
          if (!debt) continue;

          // Vérifier si un paiement a déjà été effectué ce mois-ci
          const lastPayment = await db.getFirstAsync(`
            SELECT payment_date FROM debt_payments 
            WHERE debt_id = ? 
            ORDER BY payment_date DESC 
            LIMIT 1
          `, [debt.id]) as { payment_date: string } | null;

          if (lastPayment) {
            const lastPaymentMonth = lastPayment.payment_date.slice(0, 7);
            if (lastPaymentMonth === currentMonth) {
              console.log(`⏭️ [debtService] Skipping ${debt.name}: already paid this month`);
              continue;
            }
          }

          // Vérifier le solde du compte
          const account = await accountService.getAccountById(debt.paymentAccountId!, userId);
          if (!account) {
            errors.push(`${debt.name}: Compte de paiement introuvable`);
            continue;
          }

          // Calculer le montant à payer (minimum entre monthlyPayment et currentAmount)
          const amountToPay = Math.min(debt.monthlyPayment, debt.currentAmount);

          if (account.balance < amountToPay) {
            errors.push(`${debt.name}: Solde insuffisant (${account.balance.toFixed(2)} MAD disponible, ${amountToPay.toFixed(2)} MAD requis)`);
            continue;
          }

          // Effectuer le paiement
          await this.addPayment(debt.id, amountToPay, debt.paymentAccountId, userId);
          
          // Calculer et mettre à jour le prochain due_date
          const currentDueDate = new Date(debt.dueDate);
          const nextDueDate = new Date(currentDueDate);
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          const nextDueDateString = nextDueDate.toISOString().split('T')[0];
          const nextDueMonth = nextDueDate.toISOString().slice(0, 7);

          await db.runAsync(`
            UPDATE debts 
            SET due_date = ?, due_month = ?, next_due_date = ?
            WHERE id = ? AND user_id = ?
          `, [nextDueDateString, nextDueMonth, nextDueDateString, debt.id, userId]);

          processed++;
          console.log(`✅ [debtService] Auto-paid ${debt.name}: ${amountToPay.toFixed(2)} MAD`);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          errors.push(`${debtData.name}: ${errorMessage}`);
          console.error('❌ [debtService] Error processing debt:', debtData.name, error);
        }
      }

      console.log(`✅ [debtService] Processed ${processed} debt payments, ${errors.length} errors`);
      
      return { processed, errors };

    } catch (error) {
      console.error('❌ [debtService] Error processing due debts:', error);
      throw error;
    }
  },

  /**
   * ✅ DIAGNOSTIC DE LA BASE DE DONNÉES
   */
  async diagnoseDatabase(): Promise<{
    debtsTableExists: boolean;
    paymentsTableExists: boolean;
    debtsCount: number;
    paymentsCount: number;
    tableStructure: any[];
  }> {
    try {
      const db = await getDatabase();
      
      const debtsTableExists = !!(await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='debts'"
      ));
      
      const paymentsTableExists = !!(await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='debt_payments'"
      ));
      
      let debtsCount = 0;
      let paymentsCount = 0;
      let tableStructure: any[] = [];
      
      if (debtsTableExists) {
        const debtsResult = await db.getFirstAsync(`SELECT COUNT(*) as count FROM debts`) as { count: number };
        debtsCount = debtsResult?.count || 0;
        tableStructure = await db.getAllAsync(`PRAGMA table_info(debts)`) as any[];
      }
      
      if (paymentsTableExists) {
        const paymentsResult = await db.getFirstAsync(`SELECT COUNT(*) as count FROM debt_payments`) as { count: number };
        paymentsCount = paymentsResult?.count || 0;
      }
      
      return {
        debtsTableExists,
        paymentsTableExists,
        debtsCount,
        paymentsCount,
        tableStructure
      };
    } catch (error) {
      console.error('❌ [debtService] Error diagnosing database:', error);
      throw error;
    }
  }
};

export default debtService;