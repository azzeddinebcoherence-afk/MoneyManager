// src/context/DatabaseContext.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { categoryService } from '../services/categoryService';
import { categoriesSimplificationMigration } from '../services/database/categoriesSimplificationMigration';
import { checkDatabaseStatus, initDatabase, resetDatabase } from '../services/database/sqlite';
import { emergencyAnnualChargesFix } from '../utils/emergencyAnnualChargesFix';
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
      
      // 2. Réparation d'urgence pour les charges annuelles
      try {
        console.log('🛠️ [DB CONTEXT] Running annual charges emergency fix...');
        await emergencyAnnualChargesFix();
        console.log('✅ [DB CONTEXT] Annual charges emergency fix completed');
      } catch (annualChargesError) {
        console.warn('⚠️ [DB CONTEXT] Annual charges fix had issues, but continuing...', annualChargesError);
      }
      
      // 3. Réparation des tables d'épargne
      try {
        console.log('🛠️ [DB CONTEXT] Running savings tables emergency fix...');
        await emergencyFixSavingsTables();
        console.log('✅ [DB CONTEXT] Savings tables emergency fix completed');
      } catch (savingsError) {
        console.warn('⚠️ [DB CONTEXT] Savings tables fix had issues, but continuing...', savingsError);
      }
      
      // 4. Vérification de l'état
      const status = await checkDatabaseStatus();
      console.log('📋 [DB CONTEXT] Database status after repair:', status);
      
      // 5. DÉSACTIVÉ : Simplification des catégories (remplacée par les 20 nouvelles catégories)
      console.log('🚫 [DB CONTEXT] Categories simplification DÉSACTIVÉE - utilisation des 20 nouvelles catégories');
      
      // 6. INITIALISATION AUTORITAIRE : Force installation des 20 catégories + sous-catégories
      console.log('👑 [DB CONTEXT] INITIALISATION AUTORITAIRE des 20 catégories...');
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