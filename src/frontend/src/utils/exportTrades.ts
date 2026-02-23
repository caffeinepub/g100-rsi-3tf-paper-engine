// Trade export utilities
import type { Trade } from '../types/store';

export function exportToCSV(trades: Trade[]): void {
  const headers = ['id', 'symbol', 'entryTime', 'exitTime', 'duration', 'entryPrice', 'exitPrice', 'pnlUSDT', 'pnlPct', 'exitReason', 'tp1Hit'];
  
  const rows = trades.map(t => [
    t.id,
    t.symbol,
    new Date(t.entryTime).toISOString(),
    new Date(t.exitTime).toISOString(),
    t.duration,
    t.entryPrice,
    t.exitPrice,
    t.pnlUSDT,
    t.pnlPct,
    t.exitReason,
    t.tp1Hit
  ]);
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  
  const filename = `g100_trades_${formatFilename()}.csv`;
  downloadFile(csv, filename, 'text/csv');
}

export function exportToJSON(trades: Trade[]): void {
  const json = JSON.stringify(trades, null, 2);
  const filename = `g100_trades_${formatFilename()}.json`;
  downloadFile(json, filename, 'application/json');
}

function formatFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}`;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
