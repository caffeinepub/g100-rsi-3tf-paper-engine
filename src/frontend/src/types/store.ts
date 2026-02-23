// Store state types
export interface Position {
  id: string;
  symbol: string;
  entryTime: number;
  entryPrice: number;
  stopPrice: number;
  tp1: number;
  tp2: number;
  qty: number;
  notional: number;
  margin: number;
  tp1Hit: boolean;
}

export interface Trade {
  id: string;
  symbol: string;
  entryTime: number;
  exitTime: number;
  duration: number;
  entryPrice: number;
  exitPrice: number;
  pnlUSDT: number;
  pnlPct: number;
  exitReason: 'SL_HIT' | 'TP2_HIT' | 'TIME_STOP';
  tp1Hit: boolean;
}

export interface Stats {
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  profitFactor: number;
  maxDrawdown: number;
  equityNow: number;
}

export type LogEventType =
  | 'ENGINE_START'
  | 'ENGINE_STOP'
  | 'ENGINE_TICK'
  | 'ENGINE_START_IGNORED'
  | 'RESET_ALL'
  | 'UNIVERSE_FILTERED'
  | 'UNIVERSE_EMPTY'
  | 'UNIVERSE_FALLBACK'
  | 'TOP5_SET'
  | 'TOP5_REFRESH_OK'
  | 'TOP5_REFRESH_FAIL'
  | 'TOP5_SKIP_EMPTY'
  | 'FETCH_OK'
  | 'FETCH_FAIL'
  | 'FETCH_RETRY'
  | 'FETCH_THROTTLED'
  | 'RSI_VALUES'
  | 'RSI_CROSS_UP'
  | 'ENTRY_CHECK'
  | 'REJECT'
  | 'TRADE_OPEN'
  | 'TP1_HIT'
  | 'TP2_HIT'
  | 'SL_HIT'
  | 'TIME_STOP'
  | 'TRADE_CLOSED'
  | 'EXPORT_DONE'
  | 'UI_CRASH';

export interface LogEntry {
  timestamp: string;
  eventType: LogEventType;
  payload?: any;
}

export interface ClosedCandle {
  close: number;
  closeTime: number;
}

export interface RSICache {
  rsi1m: number;
  rsi5m: number;
  rsi15m: number;
  time1m: number;
  time5m: number;
  time15m: number;
  prevRsi1m?: number;
}

export interface EngineStore {
  // Persisted state
  engineRunning: boolean;
  equity: number;
  openPositions: Position[];
  trades: Trade[];
  logs: LogEntry[];
  cooldowns: Record<string, number>;
  top5Symbols: string[];
  lastClosed1m: Record<string, ClosedCandle>;
  rsiCache: Record<string, RSICache>;
  
  // Runtime-only (not persisted)
  _intervalId: number | null;
  _runId: number;
  _engineStartTime: number;
  _lastTop5Refresh: number;
  
  // Actions
  startEngine: () => void;
  stopEngine: () => void;
  resetStorage: () => void;
  addLog: (eventType: LogEventType, payload?: any) => void;
  addTrade: (trade: Trade) => void;
  updateEquity: (newEquity: number) => void;
  updateOpenPositions: (positions: Position[]) => void;
  updateCooldowns: (cooldowns: Record<string, number>) => void;
  updateTop5Symbols: (symbols: string[]) => void;
  updateLastClosed1m: (symbol: string, candle: ClosedCandle) => void;
  updateRsiCache: (symbol: string, cache: RSICache) => void;
  getStats: () => Stats;
}
