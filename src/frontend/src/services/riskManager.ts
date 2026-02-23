// Risk management and position sizing
import type { Position } from '../types/store';

const RISK_PCT = 0.01; // 1%
const SL_DIST_PCT = 0.006; // 0.6%
const TP1_PCT = 0.01; // 1%
const TP2_PCT = 0.02; // 2%
const LEVERAGE = 5;
const MARGIN_LIMIT = 0.90; // 90%

export interface PositionCalc {
  valid: boolean;
  reason?: string;
  entryPrice?: number;
  stopPrice?: number;
  tp1?: number;
  tp2?: number;
  qty?: number;
  notional?: number;
  margin?: number;
}

export function calculatePosition(
  symbol: string,
  entryPrice: number,
  equity: number,
  openPositions: Position[],
  cooldowns: Record<string, number>
): PositionCalc {
  // Validation gates
  if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
    return { valid: false, reason: 'Invalid entry price' };
  }
  
  if (openPositions.length >= 2) {
    return { valid: false, reason: 'Max open positions reached (2)' };
  }
  
  if (openPositions.some(p => p.symbol === symbol)) {
    return { valid: false, reason: 'Symbol already has open position' };
  }
  
  const now = Date.now();
  if (cooldowns[symbol] && cooldowns[symbol] > now) {
    return { valid: false, reason: 'Symbol in cooldown' };
  }
  
  // Calculate position
  const stopPrice = entryPrice * (1 - SL_DIST_PCT);
  const tp1 = entryPrice * (1 + TP1_PCT);
  const tp2 = entryPrice * (1 + TP2_PCT);
  
  const riskUSDT = equity * RISK_PCT;
  const riskPerUnit = Math.abs(entryPrice - stopPrice);
  
  if (riskPerUnit <= 0) {
    return { valid: false, reason: 'Invalid risk per unit' };
  }
  
  const qty = riskUSDT / riskPerUnit;
  const notional = qty * entryPrice;
  const margin = notional / LEVERAGE;
  
  if (!Number.isFinite(qty) || !Number.isFinite(notional) || !Number.isFinite(margin)) {
    return { valid: false, reason: 'Non-finite calculation result' };
  }
  
  if (margin > equity * MARGIN_LIMIT) {
    return { valid: false, reason: 'Margin exceeds limit (90%)' };
  }
  
  return {
    valid: true,
    entryPrice,
    stopPrice,
    tp1,
    tp2,
    qty,
    notional,
    margin
  };
}
