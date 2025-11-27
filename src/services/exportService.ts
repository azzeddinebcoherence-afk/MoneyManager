import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { accountService } from './accountService';
import { budgetService } from './budgetService';
import { categoryService } from './categoryService';
import { transactionService } from './transactionService';

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  dataTypes: ('transactions' | 'accounts' | 'budgets' | 'categories')[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
} 

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
  fileName: string;
}

class ExportService {
  /**
   * Export principal qui gère tous les types d'export
   */
  async exportData(options: ExportOptions): Promise<ExportResult> {
    try {
      let data: any = {};

      // Récupérer les données selon les types sélectionnés
      if (options.dataTypes.includes('transactions')) {
        const transactions = await this.getTransactionsForExport(
          options.dateRange?.startDate,
          options.dateRange?.endDate
        );
        data.transactions = transactions;
      }

      if (options.dataTypes.includes('accounts')) {
        const accounts = await this.getAccountsForExport();
        data.accounts = accounts;
      }

      if (options.dataTypes.includes('budgets')) {
        const budgets = await this.getBudgetsForExport();
        data.budgets = budgets;
      }

      if (options.dataTypes.includes('categories')) {
        const categories = await this.getCategoriesForExport();
        data.categories = categories;
      }

      // Générer le fichier selon le format
      switch (options.format) {
        case 'csv':
          return await this.exportToCSV(data, options);
        case 'json':
          return await this.exportToJSON(data, options);
        case 'pdf':
          return await this.exportToPDF(data, options);
        default:
          throw new Error('Format non supporté');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        fileName: ''
      };
    }
  }

  /**
   * Récupère les transactions pour l'export
   */
  private async getTransactionsForExport(startDate?: string, endDate?: string): Promise<any[]> {
    try {
      // Essayer d'abord la méthode spécifique
      if ((transactionService as any).getTransactionsForExport) {
        return await (transactionService as any).getTransactionsForExport(startDate, endDate);
      }
      
      // Fallback vers getAllTransactions
      const allTransactions = await transactionService.getAllTransactions();
      
      // Filtrer par date si fourni
      if (startDate && endDate) {
        return allTransactions.filter((transaction: any) => 
          transaction.date >= startDate && transaction.date <= endDate
        );
      }
      
      return allTransactions;
    } catch (error) {
      console.error('Erreur récupération transactions:', error);
      return [];
    }
  }

  /**
   * Récupère les comptes pour l'export
   */
  private async getAccountsForExport(): Promise<any[]> {
    try {
      // Essayer d'abord la méthode spécifique
      if ((accountService as any).getAccountsForExport) {
        return await (accountService as any).getAccountsForExport();
      }
      
      // Fallback vers getAllAccounts
      return await accountService.getAllAccounts();
    } catch (error) {
      console.error('Erreur récupération comptes:', error);
      return [];
    }
  }

  /**
   * Récupère les budgets pour l'export
   */
  private async getBudgetsForExport(): Promise<any[]> {
    try {
      // Essayer d'abord la méthode spécifique
      if ((budgetService as any).getBudgetsForExport) {
        return await (budgetService as any).getBudgetsForExport();
      }
      
      // Fallback vers getAllBudgets
      return await budgetService.getAllBudgets();
    } catch (error) {
      console.error('Erreur récupération budgets:', error);
      return [];
    }
  }

  /**
   * Récupère les catégories pour l'export
   */
  private async getCategoriesForExport(): Promise<any[]> {
    try {
      // Essayer d'abord la méthode spécifique
      if ((categoryService as any).getCategoriesForExport) {
        return await (categoryService as any).getCategoriesForExport();
      }
      
      // Fallback vers getAllCategories
      return await categoryService.getAllCategories();
    } catch (error) {
      console.error('Erreur récupération catégories:', error);
      return [];
    }
  }

  /**
   * Export en format CSV
   */
  private async exportToCSV(data: any, options: ExportOptions): Promise<ExportResult> {
    try {
      let csvContent = '';
      const fileName = `moneymanager_export_${new Date().toISOString().split('T')[0]}.csv`;

      // En-tête CSV
      csvContent += 'MoneyManager - Export de données\n';
      csvContent += `Date d'export: ${new Date().toLocaleDateString()}\n\n`;

      // Transactions
      if (data.transactions && data.transactions.length > 0) {
        csvContent += 'TRANSACTIONS\n';
        csvContent += 'Date,Montant,Type,Catégorie,Compte,Description\n';
        
        data.transactions.forEach((transaction: any) => {
          csvContent += `"${transaction.date || ''}","${transaction.amount || 0}","${transaction.type || ''}","${transaction.categoryName || transaction.categoryId || ''}","${transaction.accountName || transaction.accountId || ''}","${transaction.description || ''}"\n`;
        });
        csvContent += '\n';
      }

      // Comptes
      if (data.accounts && data.accounts.length > 0) {
        csvContent += 'COMPTES\n';
        csvContent += 'Nom,Type,Solde,Devise\n';
        
        data.accounts.forEach((account: any) => {
          csvContent += `"${account.name || ''}","${account.type || ''}","${account.balance || 0}","${account.currency || 'EUR'}"\n`;
        });
        csvContent += '\n';
      }

      // Budgets
      if (data.budgets && data.budgets.length > 0) {
        csvContent += 'BUDGETS\n';
        csvContent += 'Catégorie,Budget,Dépenses,Reste,Période\n';
        
        data.budgets.forEach((budget: any) => {
          const spent = budget.spent || 0;
          const amount = budget.amount || 0;
          const remaining = amount - spent;
          csvContent += `"${budget.categoryName || budget.categoryId || ''}","${amount}","${spent}","${remaining}","${budget.period || ''}"\n`;
        });
        csvContent += '\n';
      }

      // Catégories
      if (data.categories && data.categories.length > 0) {
        csvContent += 'CATÉGORIES\n';
        csvContent += 'Nom,Type,Couleur,Icone\n';
        
        data.categories.forEach((category: any) => {
          csvContent += `"${category.name || ''}","${category.type || ''}","${category.color || ''}","${category.icon || ''}"\n`;
        });
      }

      return await this.saveAndShareFile(csvContent, fileName, 'text/csv');
    } catch (error) {
      console.error('Erreur export CSV:', error);
      return {
        success: false,
        error: 'Erreur lors de la génération du fichier CSV',
        fileName: ''
      };
    }
  }

  /**
   * Export en format JSON
   */
  private async exportToJSON(data: any, options: ExportOptions): Promise<ExportResult> {
    try {
      const exportData = {
        exportInfo: {
          app: 'MoneyManager',
          version: '1.0',
          exportDate: new Date().toISOString(),
          dataTypes: options.dataTypes,
          dateRange: options.dateRange
        },
        ...data
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const fileName = `moneymanager_export_${new Date().toISOString().split('T')[0]}.json`;

      return await this.saveAndShareFile(jsonContent, fileName, 'application/json');
    } catch (error) {
      console.error('Erreur export JSON:', error);
      return {
        success: false,
        error: 'Erreur lors de la génération du fichier JSON',
        fileName: ''
      };
    }
  }

  /**
   * Export en PDF (version simplifiée - génère du texte pour l'instant)
   */
  private async exportToPDF(data: any, options: ExportOptions): Promise<ExportResult> {
    try {
      let pdfContent = 'MoneyManager - Rapport PDF\n';
      pdfContent += `Date d'export: ${new Date().toLocaleDateString()}\n\n`;

      if (data.transactions && data.transactions.length > 0) {
        pdfContent += `TRANSACTIONS (${data.transactions.length})\n`;
        pdfContent += '================================\n';
        data.transactions.forEach((transaction: any, index: number) => {
          pdfContent += `${index + 1}. ${transaction.date} - ${transaction.description}: ${transaction.amount} ${transaction.currency || 'EUR'}\n`;
        });
        pdfContent += '\n';
      }

      if (data.accounts && data.accounts.length > 0) {
        pdfContent += `COMPTES (${data.accounts.length})\n`;
        pdfContent += '========================\n';
        data.accounts.forEach((account: any) => {
          pdfContent += `• ${account.name}: ${account.balance} ${account.currency || 'EUR'}\n`;
        });
        pdfContent += '\n';
      }

      if (data.budgets && data.budgets.length > 0) {
        pdfContent += `BUDGETS (${data.budgets.length})\n`;
        pdfContent += '==================\n';
        data.budgets.forEach((budget: any, index: number) => {
          const spent = budget.spent || 0;
          const amount = budget.amount || 0;
          const percentage = amount > 0 ? (spent / amount * 100).toFixed(1) : '0';
          pdfContent += `${index + 1}. ${budget.categoryName || budget.categoryId}: ${spent}/${amount} (${percentage}%)\n`;
        });
      }

      const fileName = `moneymanager_rapport_${new Date().toISOString().split('T')[0]}.txt`;
      return await this.saveAndShareFile(pdfContent, fileName, 'text/plain');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      return {
        success: false,
        error: 'Erreur lors de la génération du rapport PDF',
        fileName: ''
      };
    }
  }

  /**
   * Sauvegarde et partage du fichier - VERSION CORRIGÉE SANS TYPESCRIPT
   */
  private async saveAndShareFile(
    content: string, 
    fileName: string, 
    mimeType: string
  ): Promise<ExportResult> {
    try {
      // SOLUTION : Utiliser any pour éviter les erreurs TypeScript
      const fileSystemAny = FileSystem as any;
      const sharingAny = Sharing as any;
      
      const fileUri = fileSystemAny.documentDirectory + fileName;
      
      // Écrire le fichier avec any pour éviter l'erreur EncodingType
      await fileSystemAny.writeAsStringAsync(fileUri, content, {
        encoding: fileSystemAny.EncodingType.UTF8
      });

      // Partager le fichier si possible
      if (await sharingAny.isAvailableAsync()) {
        await sharingAny.shareAsync(fileUri, {
          mimeType,
          dialogTitle: `Exporter ${fileName}`
        });
      }

      return {
        success: true,
        filePath: fileUri,
        fileName
      };
    } catch (error) {
      console.error('Erreur sauvegarde fichier:', error);
      return {
        success: false,
        error: 'Erreur lors de la sauvegarde du fichier',
        fileName
      };
    }
  }

  /**
   * Alternative plus simple sans utiliser les propriétés problématiques
   */
  private async saveAndShareFileAlternative(
    content: string, 
    fileName: string, 
    mimeType: string
  ): Promise<ExportResult> {
    try {
      // Solution alternative : créer un blob et partager
      // Cette méthode évite complètement expo-file-system
      const blob = new Blob([content], { type: mimeType });
      const file = new File([blob], fileName, { type: mimeType });
      
      // Créer une URL temporaire
      const fileUrl = URL.createObjectURL(file);
      
      // Pour React Native, on utilise Share API directement
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUrl, {
          mimeType,
          dialogTitle: `Exporter ${fileName}`
        });
      }

      // Nettoyer l'URL
      setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);

      return {
        success: true,
        filePath: fileUrl,
        fileName
      };
    } catch (error) {
      console.error('Erreur sauvegarde fichier alternative:', error);
      // Fallback vers la méthode avec any
      return this.saveAndShareFile(content, fileName, mimeType);
    }
  }

  /**
   * Export rapide des transactions
   */
  async exportTransactions(
    startDate?: string, 
    endDate?: string, 
    format: 'csv' | 'json' = 'csv'
  ): Promise<ExportResult> {
    return this.exportData({
      format,
      dataTypes: ['transactions'],
      dateRange: startDate && endDate ? { startDate, endDate } : undefined
    });
  }

  /**
   * Export complet (backup)
   */
  async exportFullBackup(format: 'csv' | 'json' = 'json'): Promise<ExportResult> {
    return this.exportData({
      format,
      dataTypes: ['transactions', 'accounts', 'budgets', 'categories']
    });
  }
}

export const exportService = new ExportService();