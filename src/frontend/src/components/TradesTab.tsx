import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEngineStore } from '../store/engineStore';
import { exportToCSV, exportToJSON } from '../utils/exportTrades';
import { formatCurrency, formatPercent, formatTimestamp, formatDuration } from '../utils/formatters';
import type { Trade } from '../types/store';

export function TradesTab() {
  const { trades, addLog } = useEngineStore();
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | '7d'>('all');
  const [symbolFilter, setSymbolFilter] = useState<string>('all');
  
  const safeTrades = Array.isArray(trades) ? trades : [];
  
  // Get unique symbols
  const symbols = Array.from(new Set(safeTrades.map(t => t.symbol)));
  
  // Filter trades
  const now = Date.now();
  const filteredTrades = safeTrades.filter(trade => {
    // Time filter
    if (timeFilter === '24h' && now - trade.exitTime > 24 * 60 * 60 * 1000) return false;
    if (timeFilter === '7d' && now - trade.exitTime > 7 * 24 * 60 * 60 * 1000) return false;
    
    // Symbol filter
    if (symbolFilter !== 'all' && trade.symbol !== symbolFilter) return false;
    
    return true;
  });
  
  const handleExportCSV = () => {
    exportToCSV(filteredTrades);
    addLog('EXPORT_DONE', { type: 'CSV', count: filteredTrades.length });
  };
  
  const handleExportJSON = () => {
    exportToJSON(filteredTrades);
    addLog('EXPORT_DONE', { type: 'JSON', count: filteredTrades.length });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Select value={timeFilter} onValueChange={(v: any) => setTimeFilter(v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="24h">24 Hours</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={symbolFilter} onValueChange={setSymbolFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Symbols</SelectItem>
            {symbols.map(symbol => (
              <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex gap-2 ml-auto">
          <Button type="button" onClick={handleExportCSV} variant="outline" size="sm">
            Download CSV
          </Button>
          <Button type="button" onClick={handleExportJSON} variant="outline" size="sm">
            Download JSON
          </Button>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Entry Time</TableHead>
              <TableHead>Exit Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Entry</TableHead>
              <TableHead className="text-right">Exit</TableHead>
              <TableHead className="text-right">PnL USDT</TableHead>
              <TableHead className="text-right">PnL %</TableHead>
              <TableHead>Exit Reason</TableHead>
              <TableHead>TP1 Hit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  No trades yet
                </TableCell>
              </TableRow>
            ) : (
              filteredTrades.map(trade => (
                <TableRow key={trade.id}>
                  <TableCell className="font-medium">{trade.symbol}</TableCell>
                  <TableCell className="text-xs">{formatTimestamp(trade.entryTime)}</TableCell>
                  <TableCell className="text-xs">{formatTimestamp(trade.exitTime)}</TableCell>
                  <TableCell>{formatDuration(trade.duration)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(trade.entryPrice)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(trade.exitPrice)}</TableCell>
                  <TableCell className={`text-right font-mono font-bold ${trade.pnlUSDT >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(trade.pnlUSDT)}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${trade.pnlPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(trade.pnlPct)}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded ${
                      trade.exitReason === 'TP2_HIT' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      trade.exitReason === 'SL_HIT' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {trade.exitReason}
                    </span>
                  </TableCell>
                  <TableCell>{trade.tp1Hit ? '✓' : '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
