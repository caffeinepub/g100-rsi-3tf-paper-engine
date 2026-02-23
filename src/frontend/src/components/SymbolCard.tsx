import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber, formatTimestamp } from '../utils/formatters';
import type { RSICache, ClosedCandle } from '../types/store';
import { evaluateEntryGates } from '../services/entryGates';

interface SymbolCardProps {
  symbol: string;
  rsiCache?: RSICache;
  lastClosed?: ClosedCandle;
  isOpen: boolean;
  isCooldown: boolean;
}

export function SymbolCard({ symbol, rsiCache, lastClosed, isOpen, isCooldown }: SymbolCardProps) {
  const gates = evaluateEntryGates(rsiCache);
  
  let status = 'IDLE';
  let statusColor = 'bg-gray-500';
  
  if (isOpen) {
    status = 'OPEN';
    statusColor = 'bg-green-500';
  } else if (isCooldown) {
    status = 'COOLDOWN';
    statusColor = 'bg-orange-500';
  } else if (gates.allGatesPass) {
    status = 'SIGNAL_READY';
    statusColor = 'bg-blue-500';
  }
  
  const entryPrice = lastClosed?.close || 0;
  const stopPrice = entryPrice * (1 - 0.006);
  const tp1 = entryPrice * (1 + 0.01);
  const tp2 = entryPrice * (1 + 0.02);
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">{symbol}</CardTitle>
          <Badge className={`${statusColor} text-white`}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">RSI 15m</div>
            <div className="font-semibold">{formatNumber(rsiCache?.rsi15m, 1)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">RSI 5m</div>
            <div className="font-semibold">{formatNumber(rsiCache?.rsi5m, 1)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">RSI 1m</div>
            <div className="font-semibold">{formatNumber(rsiCache?.rsi1m, 1)}</div>
          </div>
        </div>
        
        <div className="border-t pt-2 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entry:</span>
            <span className="font-mono">{formatCurrency(entryPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">SL:</span>
            <span className="font-mono text-red-600">{formatCurrency(stopPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">TP1:</span>
            <span className="font-mono text-green-600">{formatCurrency(tp1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">TP2:</span>
            <span className="font-mono text-green-600">{formatCurrency(tp2)}</span>
          </div>
        </div>
        
        <div className="border-t pt-2 space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className={gates.gate15m ? 'text-green-600' : 'text-red-600'}>
              {gates.gate15m ? '✓' : '✗'}
            </span>
            <span className="text-muted-foreground">15m Gate (55-70)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={gates.gate5m ? 'text-green-600' : 'text-red-600'}>
              {gates.gate5m ? '✓' : '✗'}
            </span>
            <span className="text-muted-foreground">5m Gate (&gt;50)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={gates.gate1mCross ? 'text-green-600' : 'text-red-600'}>
              {gates.gate1mCross ? '✓' : '✗'}
            </span>
            <span className="text-muted-foreground">1m Cross (&gt;45)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
