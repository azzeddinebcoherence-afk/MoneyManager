// src/services/export/csvExport.ts - VERSION CORRIGÉE
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getDatabase } from '../database/sqlite';

export interface CSVExportOptions {
  tables: ('accounts' | 'transactions' | 'categories' | 'budgets' | 'recurringTransactions')[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  delimiter: string;
  includeHeaders: boolean;
} 

export class CSVExportService {
  // ✅ CORRECTION : Méthodes sécurisées pour les propriétés FileSystem
  private static getExportDir(): string {
    try {
      return (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
    } catch {
      return '';
    }
  }

  private static getEncodingType(): string {
    try {
      return (FileSystem as any).EncodingType?.UTF8 || 'utf8';
    } catch {
      return 'utf8';
    }
  }

  static async exportToCSV(options: CSVExportOptions): Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }> {
    try {
      console.log('📋 Génération de l\'export CSV...');

      const csvContent = await this.generateCSVContent(options);

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `moneymanager-export-${timestamp}.csv`;
      const filePath = `${this.getExportDir()}${fileName}`;

      await (FileSystem as any).writeAsStringAsync(filePath, csvContent, {
        encoding: this.getEncodingType()
      });

      return {
        success: true,
        filePath,
      };
    } catch (error) {
      console.error('❌ Erreur export CSV:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  static async shareCSVFile(filePath: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Partager l\'export CSV MoneyManager',
        });
        return { success: true };
      } else {
        throw new Error('Le partage n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      console.error('❌ Erreur partage CSV:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  private static async generateCSVContent(options: CSVExportOptions): Promise<string> {
    const sections: string[] = [];
    const db = await getDatabase();

    for (const table of options.tables) {
      let data: any[] = [];
      let query = `SELECT * FROM ${table}`;

      if (table === 'transactions' && options.dateRange) {
        query += ' WHERE date BETWEEN ? AND ?';
        const result = await db.getAllAsync(query, [
          options.dateRange.startDate,
          options.dateRange.endDate,
        ]);
        data = result as any[];
      } else {
        const result = await db.getAllAsync(query);
        data = result as any[];
      }

      if (data.length > 0) {
        sections.push(`# ${table.toUpperCase()}`);

        if (options.includeHeaders) {
          const headers = Object.keys(data[0]);
          sections.push(headers.join(options.delimiter));
        }

        for (const record of data) {
          const row = Object.values(record).map((value: any) => {
            const stringValue = String(value);
            if (stringValue.includes(options.delimiter) || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          });
          sections.push(row.join(options.delimiter));
        }

        sections.push('');
      }
    }

    return sections.join('\n');
  }
}