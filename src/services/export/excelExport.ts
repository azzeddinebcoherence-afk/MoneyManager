// src/services/export/excelExport.ts - VERSION CORRIGÉE
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getDatabase } from '../database/sqlite'; // ✅ IMPORT CORRIGÉ

export interface ExcelExportOptions {
  includeTransactions: boolean;
  includeAccounts: boolean;
  includeBudgets: boolean;
  includeCategories: boolean;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  format: 'xlsx' | 'csv'; 
}

export class ExcelExportService {
  private static getExportDir(): string {
    try {
      return (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
    } catch {
      return '';
    }
  }

  static async exportToExcel(options: ExcelExportOptions): Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }> {
    try {
      console.log('📊 Génération de l\'export Excel...');

      const exportData = await this.collectExportData(options);

      let fileContent: string;
      let fileExtension: string;

      if (options.format === 'csv') {
        fileContent = this.generateCSVContent(exportData);
        fileExtension = 'csv';
      } else {
        fileContent = this.generateExcelContent(exportData);
        fileExtension = 'xlsx';
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `moneymanager-export-${timestamp}.${fileExtension}`;
      const filePath = `${this.getExportDir()}${fileName}`;

      await (FileSystem as any).writeAsStringAsync(filePath, fileContent, {
        encoding: 'utf8'
      });

      return {
        success: true,
        filePath,
      };
    } catch (error) {
      console.error('❌ Erreur export Excel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  static async shareExcelFile(filePath: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Partager l\'export MoneyManager',
        });
        return { success: true };
      } else {
        throw new Error('Le partage n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      console.error('❌ Erreur partage Excel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  private static async collectExportData(options: ExcelExportOptions): Promise<any> {
    const data: any = {};
    const db = await getDatabase();

    if (options.includeAccounts) {
      const result = await db.getAllAsync('SELECT * FROM accounts ORDER BY name');
      data.accounts = result;
    }

    if (options.includeCategories) {
      const result = await db.getAllAsync('SELECT * FROM categories ORDER BY type, name');
      data.categories = result;
    }

    if (options.includeBudgets) {
      const result = await db.getAllAsync('SELECT * FROM budgets ORDER BY start_date DESC');
      data.budgets = result;
    }

    if (options.includeTransactions) {
      let transactionsQuery = 'SELECT * FROM transactions';
      const queryParams: any[] = [];

      if (options.dateRange) {
        transactionsQuery += ' WHERE date BETWEEN ? AND ?';
        queryParams.push(options.dateRange.startDate, options.dateRange.endDate);
      }

      transactionsQuery += ' ORDER BY date DESC';
      const result = await db.getAllAsync(transactionsQuery, queryParams);
      data.transactions = result;
    }

    return data;
  }

  private static generateCSVContent(data: any): string {
    const sheets: string[] = [];

    for (const [sheetName, records] of Object.entries(data)) {
      if (Array.isArray(records) && records.length > 0) {
        const headers = Object.keys(records[0]).join(',');
        const rows = (records as any[]).map((record: any) => 
          Object.values(record).map(value => 
            `"${String(value).replace(/"/g, '""')}"`
          ).join(',')
        );
        
        sheets.push(`${sheetName.toUpperCase()}\n${headers}\n${rows.join('\n')}`);
      }
    }

    return sheets.join('\n\n');
  }

  private static generateExcelContent(data: any): string {
    const header = [
      'MoneyManager Export',
      `Généré le: ${new Date().toLocaleString()}`,
      'Format: Excel (CSV étendu)',
      ''
    ].join('\n');

    const csvContent = this.generateCSVContent(data);
    return `${header}\n${csvContent}`;
  }
}