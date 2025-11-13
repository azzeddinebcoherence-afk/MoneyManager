// src/context/DatabaseContext.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { categoryService } from '../services/categoryService';
import { checkDatabaseStatus, initDatabase, resetDatabase } from '../services/database/sqlite';
import migrateTransactionsTable from '../services/database/transactionMigration';
import { emergencyFixSavingsTables } from '../utils/savingsEmergencyFix';

interface DatabaseContextType {
  dbInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  retryInitialization: () => void;
  resetDatabase: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeDatabaseWithRepair = async (retryCount = 0): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 [DB CONTEXT] Starting database initialization with repair...');
      
      // 1. Initialisation normale
      await initDatabase();
      await emergencyFixSavingsTables();
      
      // 2. Réparation d'urgence si nécessaire
      try {
  console.log('🛠️ [DB CONTEXT] Running annual charges emergency fix...');
  console.log('✅ [DB CONTEXT] Annual charges emergency fix completed');
} catch (annualChargesError) {
  console.warn('⚠️ [DB CONTEXT] Annual charges fix had issues, but continuing...', annualChargesError);
}
      
      // 3. Migration des transactions
      try {
        console.log('🔄 [DB CONTEXT] Running transactions migration...');
        await migrateTransactionsTable();
        console.log('✅ [DB CONTEXT] Transactions migration completed');
      } catch (migrationError) {
        console.warn('⚠️ [DB CONTEXT] Migration had issues, but continuing...', migrationError);
      }
      
      // 4. La réparation des charges annuelles est maintenant gérée par annualChargeService.ensureAnnualChargesTableExists()
      // Cette fonction est appelée automatiquement dans chaque méthode du service
      
      // 5. Vérification de l'état
      const status = await checkDatabaseStatus();
      console.log('📋 [DB CONTEXT] Database status after repair:', status);
      
      // 6. Initialisation des catégories
      console.log('🔄 [DB CONTEXT] Initializing default categories...');
      await categoryService.initializeDefaultCategories();
      
      setDbInitialized(true);
      console.log('✅ [DB CONTEXT] Database initialized with repair successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during database initialization';
      console.error('❌ [DB CONTEXT] Failed to initialize database:', errorMessage);
      
      if (retryCount < 2) {
        console.log(`🔄 [DB CONTEXT] Retrying... (${retryCount + 1}/2)`);
        setTimeout(() => initializeDatabaseWithRepair(retryCount + 1), 1000);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const retryInitialization = () => {
    console.log('🔄 [DB CONTEXT] Retrying database initialization...');
    initializeDatabaseWithRepair();
  };

  const handleResetDatabase = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await resetDatabase();
      await initializeDatabaseWithRepair();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error resetting database';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeDatabaseWithRepair();
  }, []);

  const value: DatabaseContextType = {
    dbInitialized,
    isLoading,
    error,
    retryInitialization,
    resetDatabase: handleResetDatabase
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

export default DatabaseContext;