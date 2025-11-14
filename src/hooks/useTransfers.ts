// src/hooks/useTransfers.ts - VERSION SIMPLIFIÉE
import { useCallback, useState } from 'react';
import { TransferData, transferService } from '../services/transferService';
import { useAccounts } from './useAccounts';

export const useTransfers = (userId: string = 'default-user') => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshAccounts } = useAccounts();

  const executeTransfer = useCallback(async (transferData: TransferData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 [useTransfers] Exécution du transfert...');
      
      // Validation basique
      if (!transferData.fromAccountId || !transferData.toAccountId) {
        throw new Error('Comptes source et destination requis');
      }

      if (transferData.fromAccountId === transferData.toAccountId) {
        throw new Error('Les comptes source et destination doivent être différents');
      }

      if (transferData.amount <= 0) {
        throw new Error('Le montant doit être positif');
      }

      // Exécuter le transfert via le service
      await transferService.executeTransfer(transferData, userId);
      
      // Rafraîchir les comptes
      await refreshAccounts();
      
      console.log('✅ [useTransfers] Transfert exécuté avec succès');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du transfert';
      console.error('❌ [useTransfers] Erreur:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, refreshAccounts]);

  const validateTransfer = useCallback(async (fromAccountId: string, amount: number) => {
    return await transferService.validateTransfer(fromAccountId, amount);
  }, []);

  const executeSavingsTransfer = useCallback(async (
    transferData: TransferData, 
    goalName: string
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('💰 [useTransfers] Transfert épargne...');

      await transferService.executeSavingsTransfer(transferData, goalName, userId);
      await refreshAccounts();
      
      console.log('✅ [useTransfers] Transfert épargne réussi');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du transfert épargne';
      console.error('❌ [useTransfers] Erreur transfert épargne:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, refreshAccounts]);

  const executeSavingsRefund = useCallback(async (
    transferData: TransferData, 
    goalName: string
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('💸 [useTransfers] Remboursement épargne...');

      await transferService.executeSavingsRefund(transferData, goalName, userId);
      await refreshAccounts();
      
      console.log('✅ [useTransfers] Remboursement épargne réussi');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du remboursement';
      console.error('❌ [useTransfers] Erreur remboursement:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, refreshAccounts]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Actions principales
    executeTransfer,
    executeSavingsTransfer,
    executeSavingsRefund,
    validateTransfer,
    
    // État
    loading,
    error,
    
    // Utilitaires
    clearError
  };
};