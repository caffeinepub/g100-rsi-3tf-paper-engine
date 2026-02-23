// Zustand store with persistence
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EngineStore, LogEntry, LogEventType, Position, Trade, Stats, ClosedCandle, RSICache } from '../types/store';

const MAX_LOGS = 1000;

export const useEngineStore = create<EngineStore>()(
  persist(
    (set, get) => ({
      // Persisted state
      engineRunning: false,
      equity: 100.00,
      openPositions: [],
      trades: [],
      logs: [],
      cooldowns: {},
      top5Symbols: [],
      lastClosed1m: {},
      rsiCache: {},
      
      // Runtime-only
      _intervalId: null,
      _runId: 0,
      _engineStartTime: 0,
      _lastTop5Refresh: 0,
      
      // Actions
      startEngine: () => {
        const state = get();
        if (state.engineRunning) {
          get().addLog('ENGINE_START_IGNORED', { reason: 'Engine already running' });
          return;
        }
        set({
          engineRunning: true,
          _runId: state._runId + 1,
          _engineStartTime: Date.now(),
          _lastTop5Refresh: 0
        });
        get().addLog('ENGINE_START', { runId: state._runId + 1 });
      },
      
      stopEngine: () => {
        const state = get();
        if (state._intervalId !== null) {
          clearInterval(state._intervalId);
        }
        set({ engineRunning: false, _intervalId: null });
        get().addLog('ENGINE_STOP');
      },
      
      resetStorage: () => {
        get().stopEngine();
        set({
          equity: 100.00,
          openPositions: [],
          trades: [],
          cooldowns: {},
          top5Symbols: [],
          lastClosed1m: {},
          rsiCache: {},
          _runId: 0,
          _engineStartTime: 0,
          _lastTop5Refresh: 0
        });
        get().addLog('RESET_ALL');
      },
      
      addLog: (eventType: LogEventType, payload?: any) => {
        const logs = get().logs;
        const newLog: LogEntry = {
          timestamp: new Date().toISOString(),
          eventType,
          payload
        };
        const updatedLogs = [newLog, ...logs].slice(0, MAX_LOGS);
        set({ logs: updatedLogs });
      },
      
      addTrade: (trade: Trade) => {
        set({ trades: [trade, ...get().trades] });
      },
      
      updateEquity: (newEquity: number) => {
        set({ equity: newEquity });
      },
      
      updateOpenPositions: (positions: Position[]) => {
        set({ openPositions: positions });
      },
      
      updateCooldowns: (cooldowns: Record<string, number>) => {
        set({ cooldowns });
      },
      
      updateTop5Symbols: (symbols: string[]) => {
        set({ top5Symbols: symbols, _lastTop5Refresh: Date.now() });
      },
      
      updateLastClosed1m: (symbol: string, candle: ClosedCandle) => {
        const existing = get().lastClosed1m[symbol];
        if (!existing || candle.closeTime > existing.closeTime) {
          set({
            lastClosed1m: {
              ...get().lastClosed1m,
              [symbol]: candle
            }
          });
        }
      },
      
      updateRsiCache: (symbol: string, cache: RSICache) => {
        set({
          rsiCache: {
            ...get().rsiCache,
            [symbol]: cache
          }
        });
      },
      
      getStats: (): Stats => {
        const { trades, equity } = get();
        
        if (trades.length === 0) {
          return {
            totalTrades: 0,
            winRate: 0,
            avgWin: 0,
            avgLoss: 0,
            expectancy: 0,
            profitFactor: 0,
            maxDrawdown: 0,
            equityNow: equity
          };
        }
        
        const wins = trades.filter(t => t.pnlUSDT > 0);
        const losses = trades.filter(t => t.pnlUSDT <= 0);
        
        const winRate = (wins.length / trades.length) * 100;
        const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnlUSDT, 0) / wins.length : 0;
        const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnlUSDT, 0) / losses.length) : 0;
        
        const totalWin = wins.reduce((sum, t) => sum + t.pnlUSDT, 0);
        const totalLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnlUSDT, 0));
        
        const profitFactor = totalLoss > 0 ? totalWin / totalLoss : 0;
        const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;
        
        // Simple max drawdown calculation
        let peak = 100;
        let maxDD = 0;
        let runningEquity = 100;
        
        for (let i = trades.length - 1; i >= 0; i--) {
          runningEquity += trades[i].pnlUSDT;
          if (runningEquity > peak) peak = runningEquity;
          const dd = ((peak - runningEquity) / peak) * 100;
          if (dd > maxDD) maxDD = dd;
        }
        
        return {
          totalTrades: trades.length,
          winRate,
          avgWin,
          avgLoss,
          expectancy,
          profitFactor,
          maxDrawdown: maxDD,
          equityNow: equity
        };
      }
    }),
    {
      name: 'g100-rsi-3tf-cleanroom-v1',
      partialize: (state) => ({
        engineRunning: state.engineRunning,
        equity: state.equity,
        openPositions: state.openPositions,
        trades: state.trades,
        logs: state.logs,
        cooldowns: state.cooldowns,
        top5Symbols: state.top5Symbols,
        lastClosed1m: state.lastClosed1m,
        rsiCache: state.rsiCache
      })
    }
  )
);
