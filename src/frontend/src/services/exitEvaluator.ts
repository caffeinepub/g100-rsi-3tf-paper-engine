// Exit evaluation logic
import type { Position, Trade } from '../types/store';

const TIME_STOP_MS = 45 * 60 * 1000; // 45 minutes

export interface ExitResult {
  shouldExit: boolean;
  exitReason?: 'SL_HIT' | 'TP2_HIT' | 'TIME_STOP';
  exitPrice?: number;
  tp1Hit?: boolean;
}

export function evaluateExit(position: Position, currentPrice: number, now: number): ExitResult {
  if (!Number.isFinite(currentPrice)) {
    return { shouldExit: false };
  }
  
  // Check SL
  if (currentPrice <= position.stopPrice) {
    return {
      shouldExit: true,
      exitReason: 'SL_HIT',
      exitPrice: currentPrice
    };
  }
  
  // Check TP2
  if (currentPrice >= position.tp2) {
    return {
      shouldExit: true,
      exitReason: 'TP2_HIT',
      exitPrice: currentPrice
    };
  }
  
  // Check TP1 (flag only, no exit)
  if (currentPrice >= position.tp1 && !position.tp1Hit) {
    return {
      shouldExit: false,
      tp1Hit: true
    };
  }
  
  // Check time stop
  const elapsed = now - position.entryTime;
  if (elapsed >= TIME_STOP_MS) {
    return {
      shouldExit: true,
      exitReason: 'TIME_STOP',
      exitPrice: currentPrice
    };
  }
  
  return { shouldExit: false };
}

export function calculatePnL(position: Position, exitPrice: number): { pnlUSDT: number; pnlPct: number } {
  const pnlUSDT = (exitPrice - position.entryPrice) * position.qty;
  const pnlPct = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;
  return { pnlUSDT, pnlPct };
}

export function createTrade(position: Position, exitPrice: number, exitReason: 'SL_HIT' | 'TP2_HIT' | 'TIME_STOP', exitTime: number): Trade {
  const { pnlUSDT, pnlPct } = calculatePnL(position, exitPrice);
  return {
    id: position.id,
    symbol: position.symbol,
    entryTime: position.entryTime,
    exitTime,
    duration: exitTime - position.entryTime,
    entryPrice: position.entryPrice,
    exitPrice,
    pnlUSDT,
    pnlPct,
    exitReason,
    tp1Hit: position.tp1Hit
  };
}
