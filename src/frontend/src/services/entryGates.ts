// Entry gate evaluation
import type { RSICache } from '../types/store';

export interface EntryGates {
  gate15m: boolean;
  gate5m: boolean;
  gate1mCross: boolean;
  allGatesPass: boolean;
}

export function evaluateEntryGates(rsiCache: RSICache | undefined): EntryGates {
  if (!rsiCache) {
    return { gate15m: false, gate5m: false, gate1mCross: false, allGatesPass: false };
  }
  
  const { rsi1m, rsi5m, rsi15m, prevRsi1m } = rsiCache;
  
  // Check all values are finite
  if (!Number.isFinite(rsi1m) || !Number.isFinite(rsi5m) || !Number.isFinite(rsi15m)) {
    return { gate15m: false, gate5m: false, gate1mCross: false, allGatesPass: false };
  }
  
  const gate15m = rsi15m > 55 && rsi15m < 70;
  const gate5m = rsi5m > 50;
  const gate1mCross = prevRsi1m !== undefined && prevRsi1m <= 45 && rsi1m > 45;
  
  return {
    gate15m,
    gate5m,
    gate1mCross,
    allGatesPass: gate15m && gate5m && gate1mCross
  };
}
