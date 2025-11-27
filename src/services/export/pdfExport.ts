// src/services/export/pdfExport.ts - VERSION CORRIGÉE
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getDatabase } from '../database/sqlite'; // ✅ IMPORT CORRIGÉ

export interface PDFExportOptions {
  title: string;
  includeTransactions: boolean;
  includeSummary: boolean;
  includeCharts: boolean;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  orientation: 'portrait' | 'landscape';
} 

export class PDFExportService {
  private static getExportDir(): string {
    try {
      return (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
    } catch {
      return '';
    }
  }

  static async exportToPDF(options: PDFExportOptions): Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }> {
    try {
      console.log('📄 Génération de l\'export PDF...');

      const htmlContent = await this.generateHTMLContent(options);

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `moneymanager-export-${timestamp}.html`;
      const filePath = `${this.getExportDir()}${fileName}`;

      await (FileSystem as any).writeAsStringAsync(filePath, htmlContent, {
        encoding: 'utf8'
      });

      return {
        success: true,
        filePath,
      };
    } catch (error) {
      console.error('❌ Erreur export PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  static async sharePDFFile(filePath: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Partager l\'export PDF MoneyManager',
        });
        return { success: true };
      } else {
        throw new Error('Le partage n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      console.error('❌ Erreur partage PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  private static async generateHTMLContent(options: PDFExportOptions): Promise<string> {
    const data = await this.collectPDFData(options);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${options.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #007AFF; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .transaction-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .transaction-table th, .transaction-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .transaction-table th { background-color: #007AFF; color: white; }
        .footer { text-align: center; margin-top: 50px; color: #666; font-size: 12px; }
        .positive { color: #34C759; }
        .negative { color: #FF3B30; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${options.title}</h1>
        <p>Généré le ${new Date().toLocaleDateString()}</p>
    </div>

    ${options.includeSummary ? this.generateSummaryHTML(data.summary) : ''}
    ${options.includeTransactions ? this.generateTransactionsHTML(data.transactions) : ''}

    <div class="footer">
        <p>Export généré par MoneyManager</p>
    </div>
</body>
</html>`;
  }

  private static async collectPDFData(options: PDFExportOptions): Promise<any> {
    const data: any = {};
    const db = await getDatabase();

    if (options.includeTransactions) {
      let query = `
        SELECT t.*, a.name as account_name 
        FROM transactions t 
        LEFT JOIN accounts a ON t.account_id = a.id
      `;
      const params: any[] = [];

      if (options.dateRange) {
        query += ' WHERE t.date BETWEEN ? AND ?';
        params.push(options.dateRange.startDate, options.dateRange.endDate);
      }

      query += ' ORDER BY t.date DESC';
      const result = await db.getAllAsync(query, params);
      data.transactions = result;
    }

    // Données de résumé simplifiées
    if (options.includeSummary) {
      data.summary = {
        income: 0,
        expenses: 0,
        net: 0,
        transactionCount: data.transactions?.length || 0
      };
    }

    return data;
  }

  private static generateSummaryHTML(summary: any): string {
    if (!summary) return '';

    return `
    <div class="summary">
        <h2>Résumé Financier</h2>
        <table style="width: 100%;">
            <tr><td><strong>Revenus totaux:</strong></td><td class="positive">€${summary.income.toFixed(2)}</td></tr>
            <tr><td><strong>Dépenses totales:</strong></td><td class="negative">€${summary.expenses.toFixed(2)}</td></tr>
            <tr><td><strong>Solde net:</strong></td><td class="${summary.net >= 0 ? 'positive' : 'negative'}">€${summary.net.toFixed(2)}</td></tr>
            <tr><td><strong>Nombre de transactions:</strong></td><td>${summary.transactionCount}</td></tr>
        </table>
    </div>`;
  }

  private static generateTransactionsHTML(transactions: any[]): string {
    if (!transactions || transactions.length === 0) {
      return '<p>Aucune transaction à afficher.</p>';
    }

    const rows = transactions.map((transaction: any) => `
        <tr>
            <td>${transaction.date}</td>
            <td>${transaction.type === 'income' ? 'Revenu' : 'Dépense'}</td>
            <td>${transaction.category || 'Non catégorisé'}</td>
            <td>${transaction.account_name || 'N/A'}</td>
            <td class="${transaction.type === 'income' ? 'positive' : 'negative'}">€${transaction.amount.toFixed(2)}</td>
            <td>${transaction.description || ''}</td>
        </tr>
    `).join('');

    return `
    <div>
        <h2>Détail des Transactions</h2>
        <table class="transaction-table">
            <thead>
                <tr><th>Date</th><th>Type</th><th>Catégorie</th><th>Compte</th><th>Montant</th><th>Description</th></tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>`;
  }
}