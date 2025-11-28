// src/hooks/useSmartAlerts.ts - VERSION COMPLÈTEMENT CORRIGÉE
import { useCallback, useEffect, useRef, useState } from 'react';
import SmartAlertService from '../services/SmartAlertService';
import { secureStorage } from '../services/storage/secureStorage';
import { Alert, AlertPriority } from '../types/Alert';

export interface UseSmartAlertsReturn {
  alerts: Alert[];
  scheduledAlerts: Alert[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  
  markAsRead: (alertId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissAlert: (alertId: string) => void;
  refreshAlerts: () => Promise<void>;
  analyzeTransaction: (transaction: any) => Promise<void>;
  analyzeBudgets: () => Promise<void>;
  analyzeDebts: () => Promise<void>;
  analyzeSavings: () => Promise<void>;
  
  getAlertsByPriority: (priority: AlertPriority) => Alert[];
  getAlertsByType: (type: string) => Alert[];
  clearAllAlerts: () => void;
}

export const useSmartAlerts = (userId: string = 'default-user'): UseSmartAlertsReturn => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [scheduledAlerts, setScheduledAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadAlerts();

    return () => {
      isMounted.current = false;
    };
  }, [userId]);

  const loadAlerts = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 [useSmartAlerts] Chargement des alertes...');

      // Charger depuis le stockage sécurisé
      const storedAlerts = await secureStorage.getItem(`alerts_${userId}`);
      const parsedAlerts: Alert[] = storedAlerts ? JSON.parse(storedAlerts) : [];

      // Générer de nouvelles alertes intelligentes
      const analysisResult = await SmartAlertService.analyzeAndGenerateAlerts(userId);
      
      // Récupérer les alertes planifiées
      const scheduled = await SmartAlertService.getScheduledAlerts(userId);

      // Fusionner les alertes existantes avec les nouvelles
      const allAlerts = [...parsedAlerts, ...analysisResult.alerts, ...scheduled];
      
      // Supprimer les doublons basés sur l'ID
      const uniqueAlerts = allAlerts.reduce((acc: Alert[], current) => {
        if (!acc.find(alert => alert.id === current.id)) {
          acc.push(current);
        }
        return acc;
      }, []);

      // Trier par date (plus récent en premier)
      const sortedAlerts = uniqueAlerts.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      if (isMounted.current) {
        setAlerts(sortedAlerts);
        setScheduledAlerts(scheduled);
        
        // Sauvegarder dans le stockage
        await secureStorage.setItem(`alerts_${userId}`, JSON.stringify(sortedAlerts));
      }

      console.log(`✅ [useSmartAlerts] ${sortedAlerts.length} alertes chargées`);

    } catch (err) {
      if (isMounted.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement des alertes';
        console.error('❌ [useSmartAlerts] Erreur:', errorMessage);
        setError(errorMessage);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [userId]);

  const refreshAlerts = useCallback(async () => {
    await loadAlerts();
  }, [loadAlerts]);

  const markAsRead = useCallback(async (alertId: string) => {
    try {
      // ✅ CORRECTION : Mettre à jour la base de données ET l'état local
      const { alertService } = await import('../services/alertService');
      await alertService.markAsRead(alertId);
      
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === alertId ? { ...alert, read: true } : alert
        )
      );

      // Sauvegarder la modification localement
      const updatedAlerts = alerts.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      );
      await secureStorage.setItem(`alerts_${userId}`, JSON.stringify(updatedAlerts));

      console.log(`✅ Alerte marquée comme lue (DB + local): ${alertId}`);
    } catch (error) {
      console.error('❌ Erreur markAsRead:', error);
    }
  }, [alerts, userId]);

  const markAllAsRead = useCallback(async () => {
    try {
      // ✅ CORRECTION : Mettre à jour la base de données ET l'état local
      const { alertService } = await import('../services/alertService');
      await alertService.markAllAsRead(userId);
      
      const updatedAlerts = alerts.map(alert => ({ ...alert, read: true }));
      setAlerts(updatedAlerts);
      
      // Sauvegarder les modifications localement
      await secureStorage.setItem(`alerts_${userId}`, JSON.stringify(updatedAlerts));
      
      console.log('✅ Toutes les alertes marquées comme lues (DB + local)');
    } catch (error) {
      console.error('❌ Erreur markAllAsRead:', error);
    }
  }, [alerts, userId]);

  const dismissAlert = useCallback((alertId: string) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
    
    setAlerts(updatedAlerts);
    
    // Sauvegarder les modifications
    secureStorage.setItem(`alerts_${userId}`, JSON.stringify(updatedAlerts));
    
    console.log(`🗑️ Alerte supprimée: ${alertId}`);
  }, [alerts, userId]);

  const analyzeTransaction = useCallback(async (transaction: any) => {
    try {
      console.log('💳 [useSmartAlerts] Analyse transaction...');
      
      const transactionAlerts = await SmartAlertService.analyzeTransactionForAlerts(transaction, userId);
      
      if (transactionAlerts.length > 0) {
        setAlerts(prevAlerts => {
          const newAlerts = [...transactionAlerts, ...prevAlerts];
          
          // Sauvegarder les nouvelles alertes
          secureStorage.setItem(`alerts_${userId}`, JSON.stringify(newAlerts));
          
          return newAlerts;
        });
        
        console.log(`✅ ${transactionAlerts.length} alertes générées pour la transaction`);
      }
    } catch (err) {
      console.error('❌ [useSmartAlerts] Erreur analyse transaction:', err);
    }
  }, [userId]);

  const analyzeBudgets = useCallback(async () => {
    try {
      console.log('💰 [useSmartAlerts] Analyse budgets...');
      
      const budgetAlerts = await SmartAlertService.analyzeBudgetsForAlerts(userId);
      
      if (budgetAlerts.length > 0) {
        setAlerts(prevAlerts => {
          const newAlerts = [...budgetAlerts, ...prevAlerts];
          
          // Sauvegarder les nouvelles alertes
          secureStorage.setItem(`alerts_${userId}`, JSON.stringify(newAlerts));
          
          return newAlerts;
        });
        
        console.log(`✅ ${budgetAlerts.length} alertes générées pour les budgets`);
      }
    } catch (err) {
      console.error('❌ [useSmartAlerts] Erreur analyse budgets:', err);
    }
  }, [userId]);

  const analyzeDebts = useCallback(async () => {
    try {
      console.log('🏦 [useSmartAlerts] Analyse dettes...');
      
      const debtAlerts = await SmartAlertService.analyzeDebtsForAlerts(userId);
      
      if (debtAlerts.length > 0) {
        setAlerts(prevAlerts => {
          const newAlerts = [...debtAlerts, ...prevAlerts];
          
          // Sauvegarder les nouvelles alertes
          secureStorage.setItem(`alerts_${userId}`, JSON.stringify(newAlerts));
          
          return newAlerts;
        });
        
        console.log(`✅ ${debtAlerts.length} alertes générées pour les dettes`);
      }
    } catch (err) {
      console.error('❌ [useSmartAlerts] Erreur analyse dettes:', err);
    }
  }, [userId]);

  const analyzeSavings = useCallback(async () => {
    try {
      console.log('🎯 [useSmartAlerts] Analyse épargne...');
      
      const savingsAlerts = await SmartAlertService.analyzeSavingsForAlerts(userId);
      
      if (savingsAlerts.length > 0) {
        setAlerts(prevAlerts => {
          const newAlerts = [...savingsAlerts, ...prevAlerts];
          
          // Sauvegarder les nouvelles alertes
          secureStorage.setItem(`alerts_${userId}`, JSON.stringify(newAlerts));
          
          return newAlerts;
        });
        
        console.log(`✅ ${savingsAlerts.length} alertes générées pour l'épargne`);
      }
    } catch (err) {
      console.error('❌ [useSmartAlerts] Erreur analyse épargne:', err);
    }
  }, [userId]);

  const getAlertsByPriority = useCallback((priority: AlertPriority): Alert[] => {
    return alerts.filter(alert => alert.priority === priority);
  }, [alerts]);

  const getAlertsByType = useCallback((type: string): Alert[] => {
    return alerts.filter(alert => alert.type === type);
  }, [alerts]);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
    secureStorage.removeItem(`alerts_${userId}`); // ✅ CORRIGÉ : removeItem
    console.log('🗑️ Toutes les alertes supprimées');
  }, [userId]);

  const unreadCount = alerts.filter(alert => !alert.read).length; // ✅ CORRIGÉ

  return {
    alerts,
    scheduledAlerts,
    loading,
    error,
    unreadCount,
    
    markAsRead,
    markAllAsRead,
    dismissAlert,
    refreshAlerts,
    analyzeTransaction,
    analyzeBudgets,
    analyzeDebts,
    analyzeSavings,
    
    getAlertsByPriority,
    getAlertsByType,
    clearAllAlerts
  };
};

export default useSmartAlerts;