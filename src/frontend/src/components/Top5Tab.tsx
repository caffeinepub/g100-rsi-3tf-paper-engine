import { Button } from '@/components/ui/button';
import { useEngineStore } from '../store/engineStore';
import { startEngineLoop, stopEngineLoop } from '../services/engineLoop';
import { SymbolCard } from './SymbolCard';
import { formatCurrency } from '../utils/formatters';

export function Top5Tab() {
  const {
    engineRunning,
    equity,
    top5Symbols,
    openPositions,
    rsiCache,
    lastClosed1m,
    cooldowns,
    resetStorage
  } = useEngineStore();
  
  const handleStart = () => {
    startEngineLoop();
  };
  
  const handleStop = () => {
    stopEngineLoop();
  };
  
  const handleReset = () => {
    if (window.confirm('Reset all data? This will clear all trades and positions.')) {
      resetStorage();
    }
  };
  
  // Build watch set (TOP5 + OPEN symbols)
  const openSymbols = Array.isArray(openPositions) ? openPositions.map(p => p.symbol) : [];
  const watchSet = Array.from(new Set([...(Array.isArray(top5Symbols) ? top5Symbols : []), ...openSymbols]));
  
  const now = Date.now();
  
  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Engine Controls</h2>
            <p className="text-sm text-muted-foreground">
              Equity: <span className="font-mono font-bold">${formatCurrency(equity)}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleStart}
              disabled={engineRunning}
              variant={engineRunning ? 'secondary' : 'default'}
            >
              Start
            </Button>
            <Button
              type="button"
              onClick={handleStop}
              disabled={!engineRunning}
              variant="secondary"
            >
              Stop
            </Button>
            <Button
              type="button"
              onClick={handleReset}
              variant="destructive"
            >
              Reset All
            </Button>
          </div>
        </div>
        <div className="text-sm">
          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${engineRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          {engineRunning ? 'Engine Running' : 'Engine Stopped'}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {watchSet.map(symbol => {
          const isOpen = openSymbols.includes(symbol);
          const isCooldown = !!(cooldowns[symbol] && cooldowns[symbol] > now);
          
          return (
            <SymbolCard
              key={symbol}
              symbol={symbol}
              rsiCache={rsiCache[symbol]}
              lastClosed={lastClosed1m[symbol]}
              isOpen={isOpen}
              isCooldown={isCooldown}
            />
          );
        })}
      </div>
      
      {watchSet.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No symbols in watchlist. Start the engine to load TOP5.
        </div>
      )}
    </div>
  );
}
