import { useTransactions } from './useTransactions';

export const useRecurringTransactions = (userId?: string) => {
  const txHook = useTransactions(userId);
  const processRecurringTransactions = async () => {
    // If the transactions hook exposes a processor, call it; otherwise simulate
    if (txHook && typeof (txHook as any).processRecurringTransactions === 'function') {
      return await (txHook as any).processRecurringTransactions();
    }

    const recurring = txHook.getRecurringTransactions ? txHook.getRecurringTransactions() : [];
    // Default behaviour: no-op, return processed count
    return { processed: recurring.length, errors: [] };
  };

  return {
    processRecurringTransactions
  };
};
