// src/services/transferService.ts - VERSION CORRIGÉE
import { accountService } from './accountService';
import { getDatabase } from './database/sqlite';
import { transactionService } from './transactionService';

export interface TransferData {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  date: string;
}

export const transferService = {
  // ✅ CORRECTION : Méthode simplifiée et corrigée
  async executeTransfer(transferData: TransferData, userId: string = 'default-user'): Promise<void> {
    const db = await getDatabase();
    
    try {
      console.log('🔄 [transferService] Début du transfert:', transferData);

      // Validation des comptes
      const fromAccount = await accountService.getAccountById(transferData.fromAccountId);
      const toAccount = await accountService.getAccountById(transferData.toAccountId);

      if (!fromAccount) {
        throw new Error(`Compte source introuvable: ${transferData.fromAccountId}`);
      }

      if (!toAccount) {
        throw new Error(`Compte destination introuvable: ${transferData.toAccountId}`);
      }

      if (fromAccount.balance < transferData.amount) {
        throw new Error(`Fonds insuffisants sur ${fromAccount.name}. Solde disponible: ${fromAccount.balance}`);
      }

      if (transferData.amount <= 0) {
        throw new Error('Le montant du transfert doit être positif');
      }

      await db.execAsync('BEGIN TRANSACTION');

      try {
        // ✅ CORRECTION : Utiliser createTransaction au lieu de createTransactionWithoutBalanceUpdate
        // Créer la transaction de retrait
        await transactionService.createTransaction({
          amount: -Math.abs(transferData.amount),
          type: 'expense',
          category: 'transfert',
          accountId: transferData.fromAccountId,
          description: `Transfert vers ${toAccount.name}${transferData.description ? ` - ${transferData.description}` : ''}`,
          date: transferData.date,
        }, userId);

        // Créer la transaction de dépôt
        await transactionService.createTransaction({
          amount: Math.abs(transferData.amount),
          type: 'income',
          category: 'transfert',
          accountId: transferData.toAccountId,
          description: `Transfert depuis ${fromAccount.name}${transferData.description ? ` - ${transferData.description}` : ''}`,
          date: transferData.date,
        }, userId);

        await db.execAsync('COMMIT');

        console.log('✅ [transferService] Transfert réussi:', {
          fromAccount: fromAccount.name,
          toAccount: toAccount.name,
          amount: transferData.amount
        });

      } catch (error) {
        await db.execAsync('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('❌ [transferService] Erreur lors du transfert:', error);
      throw new Error(`Échec du transfert: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  },

  // ✅ SUPPRESSION de la méthode executeTransferWithoutTransaction qui n'est plus nécessaire

  async createTransfer(transferData: TransferData, userId: string = 'default-user'): Promise<void> {
    return this.executeTransfer(transferData, userId);
  },

  async validateTransfer(fromAccountId: string, amount: number): Promise<{ isValid: boolean; message?: string; currentBalance?: number }> {
    try {
      const fromAccount = await accountService.getAccountById(fromAccountId);
      
      if (!fromAccount) {
        return { isValid: false, message: 'Compte source introuvable' };
      }

      if (amount <= 0) {
        return { isValid: false, message: 'Le montant doit être positif' };
      }

      if (fromAccount.balance < amount) {
        return { 
          isValid: false, 
          message: 'Fonds insuffisants', 
          currentBalance: fromAccount.balance 
        };
      }

      return { isValid: true, currentBalance: fromAccount.balance };
    } catch (error) {
      console.error('❌ [transferService] Erreur de validation:', error);
      return { isValid: false, message: 'Erreur lors de la validation' };
    }
  },

  // ✅ CORRECTION : Méthodes pour épargne utilisant createTransaction normal
  async executeSavingsTransfer(transferData: TransferData, goalName: string, userId: string = 'default-user'): Promise<void> {
    const db = await getDatabase();
    
    try {
      console.log('💰 [transferService] Transfert épargne:', { ...transferData, goalName });

      const fromAccount = await accountService.getAccountById(transferData.fromAccountId);
      const toAccount = await accountService.getAccountById(transferData.toAccountId);

      if (!fromAccount) {
        throw new Error('Compte source introuvable');
      }

      if (!toAccount) {
        throw new Error('Compte épargne introuvable');
      }

      if (fromAccount.balance < transferData.amount) {
        throw new Error(`Fonds insuffisants sur ${fromAccount.name}. Solde disponible: ${fromAccount.balance}`);
      }

      await db.execAsync('BEGIN TRANSACTION');

      try {
        // Utiliser createTransaction normal pour épargne
        await transactionService.createTransaction({
          amount: -Math.abs(transferData.amount),
          type: 'expense',
          category: 'épargne',
          accountId: transferData.fromAccountId,
          description: `Épargne: ${goalName}`,
          date: transferData.date,
        }, userId);

        await transactionService.createTransaction({
          amount: Math.abs(transferData.amount),
          type: 'income',
          category: 'épargne',
          accountId: transferData.toAccountId,
          description: `Épargne: ${goalName}`,
          date: transferData.date,
        }, userId);

        await db.execAsync('COMMIT');

        console.log('✅ [transferService] Transfert épargne réussi');

      } catch (error) {
        await db.execAsync('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('❌ [transferService] Erreur transfert épargne:', error);
      throw new Error(`Échec du transfert épargne: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  },

  async executeSavingsRefund(transferData: TransferData, goalName: string, userId: string = 'default-user'): Promise<void> {
    const db = await getDatabase();
    
    try {
      console.log('💸 [transferService] Remboursement épargne:', { ...transferData, goalName });

      const fromAccount = await accountService.getAccountById(transferData.fromAccountId);
      const toAccount = await accountService.getAccountById(transferData.toAccountId);

      if (!fromAccount) {
        throw new Error('Compte épargne introuvable');
      }

      if (!toAccount) {
        throw new Error('Compte destination introuvable');
      }

      if (fromAccount.balance < transferData.amount) {
        throw new Error(`Fonds insuffisants sur le compte épargne. Solde disponible: ${fromAccount.balance}`);
      }

      await db.execAsync('BEGIN TRANSACTION');

      try {
        // Utiliser createTransaction normal pour remboursement
        await transactionService.createTransaction({
          amount: -Math.abs(transferData.amount),
          type: 'expense',
          category: 'remboursement épargne',
          accountId: transferData.fromAccountId,
          description: `Remboursement: ${goalName}`,
          date: transferData.date,
        }, userId);

        await transactionService.createTransaction({
          amount: Math.abs(transferData.amount),
          type: 'income',
          category: 'remboursement épargne',
          accountId: transferData.toAccountId,
          description: `Remboursement: ${goalName}`,
          date: transferData.date,
        }, userId);

        await db.execAsync('COMMIT');

        console.log('✅ [transferService] Remboursement épargne réussi');

      } catch (error) {
        await db.execAsync('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('❌ [transferService] Erreur remboursement épargne:', error);
      throw new Error(`Échec du remboursement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
};

export default transferService;